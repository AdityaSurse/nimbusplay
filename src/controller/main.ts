/**
 * NimbusPlay — Mobile Controller Main Controller Loop
 * 60Hz compact packet transmission, device immersion, and sensor orchestration.
 * Strictly typed with zero `any`.
 */

import { ControllerNetworkClient, type ControllerNetworkStatus } from './network.js';
import { SensorManager, type SensorStatus } from './sensors.js';
import { TouchInputManager, type ButtonName } from './touch.js';
import { DeviceImmersion } from './device.js';
import { WS_PATH } from '../shared/constants.js';
import { 
  isCompactPacket,
  type NimbusNetworkMessage, 
  type CompactMotionPacket, 
  type HapticFeedbackCommand 
} from '../shared/protocol.js';

let activeRoomId = 'AUTO';
let isStreaming = false;
let packetSequence = 0;
let networkClient: ControllerNetworkClient | null = null;
let streamIntervalId: ReturnType<typeof setInterval> | null = null;

// Subsystem instances
const immersion = new DeviceImmersion();
let sensors: SensorManager;
let touch: TouchInputManager;

// DOM Elements
const statusRelayText = document.getElementById('status-relay-text') as HTMLSpanElement;
const statusRelayOrb = document.getElementById('status-relay-orb') as HTMLDivElement;
const statusConsolePill = document.getElementById('status-console-pill') as HTMLDivElement;
const labelRoomCode = document.getElementById('label-room-code') as HTMLSpanElement;
const labelRtt = document.getElementById('label-rtt') as HTMLSpanElement;
const labelSensorStatus = document.getElementById('label-sensor-status') as HTMLSpanElement;
const bannerEnableMotion = document.getElementById('banner-enable-motion') as HTMLDivElement;
const btnEnableMotion = document.getElementById('btn-enable-motion') as HTMLButtonElement;
const toastEl = document.getElementById('toast') as HTMLDivElement;
const toastTextEl = document.getElementById('toast-text') as HTMLSpanElement;

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(text: string, durationMs = 1200): void {
  if (toastTimer) clearTimeout(toastTimer);
  if (toastTextEl) toastTextEl.textContent = text;
  if (toastEl) {
    toastEl.classList.remove('opacity-0');
    toastEl.classList.add('opacity-100');
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('opacity-100');
      toastEl.classList.add('opacity-0');
    }, durationMs);
  }
}

function updateSensorUI(status: SensorStatus, detail?: string): void {
  if (!labelSensorStatus) return;

  switch (status) {
    case 'active':
      labelSensorStatus.textContent = '60Hz Gyro Active';
      labelSensorStatus.className = 'font-label-sm text-[11px] text-emerald-500 font-bold';
      bannerEnableMotion?.classList.add('hidden');
      break;
    case 'no-sensor-data':
      labelSensorStatus.textContent = 'No Sensor Data';
      labelSensorStatus.className = 'font-label-sm text-[11px] text-amber-500 font-bold';
      break;
    case 'denied':
      labelSensorStatus.textContent = 'Motion Denied';
      labelSensorStatus.className = 'font-label-sm text-[11px] text-rose-500 font-bold';
      break;
    case 'unsupported':
      labelSensorStatus.textContent = 'Hardware Unsupported';
      labelSensorStatus.className = 'font-label-sm text-[11px] text-rose-500 font-bold';
      break;
    case 'standby':
    default:
      labelSensorStatus.textContent = 'Sensors Standby';
      labelSensorStatus.className = 'font-label-sm text-[11px] text-tertiary';
      break;
  }
  if (detail) console.log(`[SensorUI] ${status}: ${detail}`);
}

function send60HzFrame(): void {
  if (!networkClient || !isStreaming) return;

  const telemetry = sensors.getTelemetry();
  const bitmask = touch.getBitmask();

  const packet: CompactMotionPacket = {
    t: 'F',
    s: ++packetSequence,
    ts: Date.now(),
    b: bitmask,
    r: [
      telemetry.rotationRate.alpha,
      telemetry.rotationRate.beta,
      telemetry.rotationRate.gamma
    ],
    a: [
      telemetry.acceleration.x,
      telemetry.acceleration.y,
      telemetry.acceleration.z
    ]
  };

  networkClient.send(packet);
}

function startStreamingLoop(): void {
  if (streamIntervalId) return;
  isStreaming = true;
  // Exact 60 Hz interval (~16.67ms)
  streamIntervalId = setInterval(send60HzFrame, 16);
}

function stopStreamingLoop(): void {
  if (streamIntervalId) {
    clearInterval(streamIntervalId);
    streamIntervalId = null;
  }
  isStreaming = false;
}

async function handleEnableMotion(): Promise<void> {
  // Activate device immersion on user gesture
  await immersion.activateImmersion();

  // Start hardware sensors
  const ok = await sensors.start();
  if (ok) {
    showToast('Motion Sensors Activated');
    startStreamingLoop();
  } else {
    showToast('Sensor Activation Failed');
  }
}

function initNetwork(): void {
  const isHttps = window.location.protocol === 'https:';
  const wsProto = isHttps ? 'wss:' : 'ws:';
  const wsUrl = `${wsProto}//${window.location.host}${WS_PATH}`;

  networkClient = new ControllerNetworkClient(wsUrl, activeRoomId, {
    onStatusChange: (status: ControllerNetworkStatus) => {
      if (statusRelayText) {
        statusRelayText.textContent = status === 'connected' ? 'CONNECTED' : status.toUpperCase();
      }
      if (statusRelayOrb) {
        statusRelayOrb.className = `w-2.5 h-2.5 rounded-full ${
          status === 'connected' 
            ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' 
            : status === 'connecting' || status === 'reconnecting'
            ? 'bg-amber-400 animate-ping shadow-[0_0_8px_#fbbf24]'
            : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
        }`;
      }
    },
    onRoomJoined: (roomId: string, peerConnected: boolean) => {
      activeRoomId = roomId;
      if (labelRoomCode) labelRoomCode.textContent = roomId;
      if (statusConsolePill) {
        statusConsolePill.textContent = peerConnected ? 'TV: Linked' : 'TV: Waiting';
        statusConsolePill.className = `font-label-sm text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
          peerConnected ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-200 text-slate-500'
        }`;
      }
    },
    onConsoleStatus: (connected: boolean) => {
      if (statusConsolePill) {
        statusConsolePill.textContent = connected ? 'TV: Linked' : 'TV: Waiting';
        statusConsolePill.className = `font-label-sm text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
          connected ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-200 text-slate-500'
        }`;
      }
      if (connected) {
        showToast('Console Linked');
        startStreamingLoop();
      } else {
        stopStreamingLoop();
      }
    },
    onLatencyUpdate: (rttMs: number) => {
      if (labelRtt) labelRtt.textContent = `${rttMs}ms`;
    },
    onMessage: (message: NimbusNetworkMessage) => {
      if (!isCompactPacket(message) && message.type === 'COMMAND_HAPTIC') {
        const cmd = message as HapticFeedbackCommand;
        immersion.vibrate(cmd.pattern);
      }
    }
  });

  networkClient.connect();
}

// Recenter special handler
function handleButtonChange(_bitmask: number, pressedButton: ButtonName | null): void {
  if (pressedButton === 'recenter') {
    showToast('Pointer Recenter Sent', 800);
  }
}

// Bootstrap
function boot(): void {
  // Initialize sensors and touch subsystems
  sensors = new SensorManager(updateSensorUI);
  touch = new TouchInputManager(handleButtonChange, (ms) => immersion.vibrate(ms));
  touch.bindButtons();

  // Read URL query params
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get('room');
  if (roomParam) {
    activeRoomId = roomParam.trim().toUpperCase();
    if (labelRoomCode) labelRoomCode.textContent = activeRoomId;
  }

  // Bind enable motion action
  btnEnableMotion?.addEventListener('click', handleEnableMotion);

  // Initialize network connection
  initNetwork();

  // Auto-attempt sensor start if non-gesture environment allows
  sensors.start().then((started) => {
    if (started) {
      startStreamingLoop();
    }
  }).catch(() => {
    // Requires gesture
  });
}

window.addEventListener('DOMContentLoaded', boot);
