/**
 * NimbusPlay — Mobile Controller Main Controller Loop
 * 60Hz compact packet transmission, device immersion, and sensor orchestration.
 * Strictly typed with zero `any`. Target < 250 lines.
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
  type LayoutModeCommand,
  type LayoutMode
} from '../shared/protocol.js';

let activeRoomId = 'AUTO';
let isStreaming = false;
let packetSequence = 0;
let networkClient: ControllerNetworkClient | null = null;
let streamIntervalId: ReturnType<typeof setInterval> | null = null;
let calibratedTiltY = 0;
let hasCalibratedRacing = false;

const immersion = new DeviceImmersion();
let sensors: SensorManager;
let touch: TouchInputManager;

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

function setLayoutMode(mode: LayoutMode, gameId?: string): void {
  const pView = document.getElementById('portrait-controller-view');
  const aView = document.getElementById('landscape-controller-view');
  const rView = document.getElementById('racing-controller-view');
  pView?.classList.add('hidden');
  aView?.classList.add('hidden'); aView?.classList.remove('flex');
  rView?.classList.add('hidden'); rView?.classList.remove('flex');

  if (mode === 'landscape-racing' || (mode === 'landscape' && gameId === 'turboCircuit')) {
    rView?.classList.remove('hidden'); rView?.classList.add('flex');
    showToast('Switched to Racing Wheel', 1200);
    immersion.acquireWakeLock();
    if (!hasCalibratedRacing) {
      const modal = document.getElementById('racing-calibration-modal');
      modal?.classList.remove('hidden'); modal?.classList.add('flex');
    }
  } else if (mode === 'landscape') {
    aView?.classList.remove('hidden'); aView?.classList.add('flex');
    showToast('Switched to Flight Deck', 1200);
    immersion.acquireWakeLock();
  } else {
    pView?.classList.remove('hidden');
    showToast('Switched to Wand Mode', 1200);
  }
}

function send60HzFrame(): void {
  if (!networkClient || !isStreaming) return;
  const telemetry = sensors.getTelemetry();
  const bitmask = touch.getBitmask();
  const calibTilt = telemetry.acceleration.y - calibratedTiltY;

  const horizonPip = document.getElementById('landscape-horizon-pip');
  if (horizonPip) horizonPip.style.transform = `translateX(${Math.max(-1, Math.min(1, telemetry.acceleration.y / 6.5)) * 24}px)`;

  const rHorizon = document.getElementById('racing-horizon-pip');
  const rNorm = Math.max(-1, Math.min(1, calibTilt / 5.2));
  if (rHorizon) rHorizon.style.transform = `translateX(${rNorm * 40}px)`;
  const rAngle = document.getElementById('racing-tilt-angle');
  if (rAngle) rAngle.textContent = `${Math.round(rNorm * 45)}°`;
  const bubble = document.getElementById('calib-bubble');
  if (bubble) bubble.style.transform = `translateX(${rNorm * 65}px)`;

  const packet: CompactMotionPacket = {
    t: 'F', s: ++packetSequence, ts: Date.now(), b: bitmask,
    r: [telemetry.rotationRate.alpha, telemetry.rotationRate.beta, telemetry.rotationRate.gamma],
    a: [telemetry.acceleration.x, calibTilt, telemetry.acceleration.z]
  };
  networkClient.send(packet);
}

function startStreamingLoop(): void {
  if (streamIntervalId) return;
  isStreaming = true;
  streamIntervalId = setInterval(send60HzFrame, 16);
}

function stopStreamingLoop(): void {
  if (streamIntervalId) { clearInterval(streamIntervalId); streamIntervalId = null; }
  isStreaming = false;
}

async function handleEnableMotion(): Promise<void> {
  await immersion.activateImmersion();
  const ok = await sensors.start();
  if (ok) { showToast('Motion Sensors Activated'); startStreamingLoop(); }
  else { showToast('Sensor Activation Failed'); }
}

function initNetwork(): void {
  const isHttps = window.location.protocol === 'https:';
  const wsUrl = `${isHttps ? 'wss:' : 'ws:'}//${window.location.host}${WS_PATH}`;

  networkClient = new ControllerNetworkClient(wsUrl, activeRoomId, {
    onStatusChange: (status: ControllerNetworkStatus) => {
      if (statusRelayText) statusRelayText.textContent = status === 'connected' ? 'CONNECTED' : status.toUpperCase();
      if (statusRelayOrb) {
        statusRelayOrb.className = `w-2.5 h-2.5 rounded-full ${status === 'connected' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`;
      }
    },
    onRoomJoined: (roomId: string, peerConnected: boolean) => {
      activeRoomId = roomId;
      if (labelRoomCode) labelRoomCode.textContent = roomId;
      if (statusConsolePill) statusConsolePill.textContent = peerConnected ? 'TV: Linked' : 'TV: Waiting';
    },
    onConsoleStatus: (connected: boolean) => {
      if (statusConsolePill) statusConsolePill.textContent = connected ? 'TV: Linked' : 'TV: Waiting';
      if (connected) { showToast('Console Linked'); startStreamingLoop(); }
      else { stopStreamingLoop(); }
    },
    onLatencyUpdate: (rttMs: number) => { if (labelRtt) labelRtt.textContent = `${rttMs}ms`; },
    onMessage: (message: NimbusNetworkMessage) => {
      if (isCompactPacket(message)) return;
      if (message.type === 'COMMAND_HAPTIC') {
        immersion.vibrate((message as HapticFeedbackCommand).pattern);
      } else if (message.type === 'COMMAND_LAYOUT_MODE') {
        const layoutMsg = message as LayoutModeCommand;
        setLayoutMode(layoutMsg.mode, layoutMsg.gameId);
      }
    }
  });
  networkClient.connect();
}

function handleButtonChange(_bitmask: number, pressedButton: ButtonName | null): void {
  if (pressedButton === 'recenter') showToast('Pointer Recenter Sent', 800);
}

function boot(): void {
  sensors = new SensorManager(updateSensorUI);
  touch = new TouchInputManager(handleButtonChange, (ms) => immersion.vibrate(ms));
  touch.bindButtons();

  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get('room');
  if (roomParam) {
    activeRoomId = roomParam.trim().toUpperCase();
    if (labelRoomCode) labelRoomCode.textContent = activeRoomId;
  }

  btnEnableMotion?.addEventListener('click', handleEnableMotion);

  // Calibration modal bindings
  const calibModal = document.getElementById('racing-calibration-modal');
  document.getElementById('btn-confirm-calibration')?.addEventListener('click', () => {
    calibratedTiltY = sensors.getTelemetry().acceleration.y;
    hasCalibratedRacing = true;
    calibModal?.classList.add('hidden'); calibModal?.classList.remove('flex');
    immersion.vibrate([40, 20, 40]);
    showToast('Wheel Calibrated');
  });

  document.getElementById('btn-racing-center')?.addEventListener('click', () => {
    calibratedTiltY = sensors.getTelemetry().acceleration.y;
    immersion.vibrate(30);
    showToast('Wheel Centered');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      touch.resetAll(); send60HzFrame(); stopStreamingLoop();
    } else if (document.visibilityState === 'visible') {
      immersion.acquireWakeLock();
      sensors.start().then((started) => { if (started) { startStreamingLoop(); showToast('Wand Active'); } });
    }
  });

  initNetwork();
  sensors.start().then((started) => { if (started) startStreamingLoop(); }).catch(() => {});
}

window.addEventListener('DOMContentLoaded', boot);
