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
  type HapticFeedbackCommand,
  type LayoutModeCommand
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

const SENSOR_UI_MAP: Record<SensorStatus, { text: string; cls: string }> = {
  active: { text: '60Hz Gyro Active', cls: 'text-[11px] text-emerald-500 font-bold' },
  'no-sensor-data': { text: 'No Sensor Data', cls: 'text-[11px] text-amber-500 font-bold' },
  denied: { text: 'Motion Denied', cls: 'text-[11px] text-rose-500 font-bold' },
  unsupported: { text: 'Hardware Unsupported', cls: 'text-[11px] text-rose-500 font-bold' },
  standby: { text: 'Sensors Standby', cls: 'text-[11px] text-tertiary font-semibold' }
};

function updateSensorUI(status: SensorStatus): void {
  if (!labelSensorStatus) return;
  const cfg = SENSOR_UI_MAP[status] ?? SENSOR_UI_MAP.standby;
  labelSensorStatus.textContent = cfg.text;
  labelSensorStatus.className = cfg.cls;
  if (status === 'active') bannerEnableMotion?.classList.add('hidden');
}

function setLayoutMode(mode: 'portrait' | 'landscape'): void {
  const portraitView = document.getElementById('portrait-controller-view');
  const landscapeView = document.getElementById('landscape-controller-view');
  if (mode === 'landscape') {
    portraitView?.classList.add('hidden');
    landscapeView?.classList.remove('hidden');
    landscapeView?.classList.add('flex');
    showToast('Switched to Flight Deck', 1200);
  } else {
    landscapeView?.classList.add('hidden');
    landscapeView?.classList.remove('flex');
    portraitView?.classList.remove('hidden');
    showToast('Switched to Wand Mode', 1200);
  }
}

function send60HzFrame(): void {
  if (!networkClient || !isStreaming) return;

  const telemetry = sensors.getTelemetry();
  const bitmask = touch.getBitmask();

  // Update landscape horizon pip if present
  const horizonPip = document.getElementById('landscape-horizon-pip');
  if (horizonPip) {
    const tiltOffset = Math.max(-1, Math.min(1, telemetry.acceleration.y / 6.5));
    horizonPip.style.transform = `translateX(${tiltOffset * 24}px)`;
  }

  const packet: CompactMotionPacket = {
    t: 'F',
    s: ++packetSequence,
    ts: Date.now(),
    b: bitmask,
    r: [telemetry.rotationRate.alpha, telemetry.rotationRate.beta, telemetry.rotationRate.gamma],
    a: [telemetry.acceleration.x, telemetry.acceleration.y, telemetry.acceleration.z]
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
      if (statusRelayText) statusRelayText.textContent = status === 'connected' ? 'CONNECTED' : status.toUpperCase();
      if (statusRelayOrb) {
        const color = status === 'connected' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : (status === 'connecting' || status === 'reconnecting') ? 'bg-amber-400 animate-ping shadow-[0_0_8px_#fbbf24]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]';
        statusRelayOrb.className = `w-2.5 h-2.5 rounded-full ${color}`;
      }
    },
    onRoomJoined: (roomId: string, peerConnected: boolean) => {
      activeRoomId = roomId;
      if (labelRoomCode) labelRoomCode.textContent = roomId;
      if (statusConsolePill) {
        statusConsolePill.textContent = peerConnected ? 'TV: Linked' : 'TV: Waiting';
        statusConsolePill.className = `font-label-sm text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${peerConnected ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-200 text-slate-500'}`;
      }
    },
    onConsoleStatus: (connected: boolean) => {
      if (statusConsolePill) {
        statusConsolePill.textContent = connected ? 'TV: Linked' : 'TV: Waiting';
        statusConsolePill.className = `font-label-sm text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${connected ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-200 text-slate-500'}`;
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
      if (isCompactPacket(message)) return;
      if (message.type === 'COMMAND_HAPTIC') {
        immersion.vibrate((message as HapticFeedbackCommand).pattern);
      } else if (message.type === 'COMMAND_LAYOUT_MODE') {
        setLayoutMode((message as LayoutModeCommand).mode);
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

  // Handling for Phone Screen Turning Off / App Switching
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      touch.resetAll();
      send60HzFrame();
      stopStreamingLoop();
    } else if (document.visibilityState === 'visible') {
      immersion.acquireWakeLock();
      sensors.start().then((started) => {
        if (started) {
          startStreamingLoop();
          showToast('Wand Active');
        }
      });
    }
  });

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
