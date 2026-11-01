import { ControllerNetworkClient, type ControllerNetworkStatus } from './network.js';
import { WS_PATH } from '../shared/constants.js';
import type { 
  NimbusNetworkMessage, 
  MotionInputFrame, 
  ControllerButtonState, 
  HapticFeedbackCommand 
} from '../shared/protocol.js';

let activeRoomId = 'AUTO';
let isStreamingMotion = false;
let framesSent = 0;
let networkClient: ControllerNetworkClient | null = null;

// Hardware state
const buttons: ControllerButtonState = {
  a: false,
  b: false,
  dpadUp: false,
  dpadDown: false,
  dpadLeft: false,
  dpadRight: false,
  plus: false,
  minus: false,
  home: false,
  btn1: false,
  btn2: false
};

let currentRotation = { alpha: 0, beta: 0, gamma: 0 };
let currentAccel = { x: 0, y: 0, z: 0 };

// DOM Elements
const ctrlRelayStatusEl = document.getElementById('ctrl-relay-status') as HTMLSpanElement;
const ctrlConsoleStatusEl = document.getElementById('ctrl-console-status') as HTMLSpanElement;
const inputRoom = document.getElementById('input-room') as HTMLInputElement;
const btnJoin = document.getElementById('btn-join') as HTMLButtonElement;
const ctrlRtt = document.getElementById('ctrl-rtt') as HTMLSpanElement;
const ctrlSent = document.getElementById('ctrl-sent') as HTMLSpanElement;
const sensorState = document.getElementById('sensor-state') as HTMLSpanElement;
const hapticState = document.getElementById('haptic-state') as HTMLSpanElement;
const btnPadA = document.getElementById('btn-pad-a') as HTMLButtonElement;
const btnPadB = document.getElementById('btn-pad-b') as HTMLButtonElement;
const btnToggleMotion = document.getElementById('btn-toggle-motion') as HTMLButtonElement;
const btnSendTest = document.getElementById('btn-send-test') as HTMLButtonElement;
const ctrlLog = document.getElementById('ctrl-log') as HTMLDivElement;

function log(msg: string): void {
  const time = new Date().toLocaleTimeString();
  ctrlLog.textContent = `[${time}] ${msg}\n` + ctrlLog.textContent;
}

function updateHapticSupport(): void {
  const supported = 'vibrate' in navigator && typeof navigator.vibrate === 'function';
  hapticState.textContent = supported ? 'Supported' : 'Not Supported';
  hapticState.style.color = supported ? '#22c55e' : '#f59e0b';
}

function sendInputFrame(): void {
  if (!networkClient) return;

  const frame: MotionInputFrame = {
    type: 'INPUT_FRAME',
    seq: ++framesSent,
    timestamp: Date.now(),
    roomId: activeRoomId,
    buttons: { ...buttons },
    rotationRate: { ...currentRotation },
    acceleration: { ...currentAccel },
    interval: 16.6
  };

  networkClient.send(frame);
  ctrlSent.textContent = framesSent.toString();
}

function handleMotionEvent(event: DeviceMotionEvent): void {
  if (event.rotationRate) {
    currentRotation = {
      alpha: event.rotationRate.alpha ?? 0,
      beta: event.rotationRate.beta ?? 0,
      gamma: event.rotationRate.gamma ?? 0
    };
  }
  if (event.acceleration) {
    currentAccel = {
      x: event.acceleration.x ?? 0,
      y: event.acceleration.y ?? 0,
      z: event.acceleration.z ?? 0
    };
  }

  if (isStreamingMotion) {
    sendInputFrame();
  }
}

async function startMotionSensors(): Promise<boolean> {
  if (!('DeviceMotionEvent' in window)) {
    log('DeviceMotionEvent not available in this browser');
    sensorState.textContent = 'Unavailable';
    return false;
  }

  // iOS Safari 13+ requires explicit permission request; Chrome Android does not require permission on HTTPS
  const dme = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> };
  if (typeof dme.requestPermission === 'function') {
    try {
      const res = await dme.requestPermission();
      if (res !== 'granted') {
        log('Motion permission denied');
        return false;
      }
    } catch (err) {
      log('Permission request error: ' + String(err));
      return false;
    }
  }

  window.addEventListener('devicemotion', handleMotionEvent, { passive: true });
  sensorState.textContent = 'Active (60Hz)';
  sensorState.style.color = '#22c55e';
  log('Motion sensor listener registered');
  return true;
}

function initNetwork(): void {
  const isHttps = window.location.protocol === 'https:';
  const wsProto = isHttps ? 'wss:' : 'ws:';
  const wsUrl = `${wsProto}//${window.location.host}${WS_PATH}`;

  networkClient = new ControllerNetworkClient(wsUrl, activeRoomId, {
    onStatusChange: (status: ControllerNetworkStatus, details?: string) => {
      ctrlRelayStatusEl.className = `badge ${status}`;
      ctrlRelayStatusEl.textContent = status.toUpperCase();
      log(`Relay status: ${status} ${details || ''}`);
    },
    onRoomJoined: (roomId: string, peerConnected: boolean) => {
      activeRoomId = roomId;
      inputRoom.value = roomId;
      ctrlConsoleStatusEl.className = `badge ${peerConnected ? 'connected' : 'disconnected'}`;
      ctrlConsoleStatusEl.textContent = peerConnected ? 'Console: Online' : 'Console: Offline';
      log(`Joined room ${roomId}. Console is ${peerConnected ? 'Online' : 'Offline'}`);
    },
    onConsoleStatus: (connected: boolean) => {
      ctrlConsoleStatusEl.className = `badge ${connected ? 'connected' : 'disconnected'}`;
      ctrlConsoleStatusEl.textContent = connected ? 'Console: Online' : 'Console: Offline';
      log(`Console status: ${connected ? 'Connected' : 'Disconnected'}`);
    },
    onLatencyUpdate: (rttMs: number) => {
      ctrlRtt.textContent = `${rttMs} ms`;
    },
    onMessage: (message: NimbusNetworkMessage) => {
      if (message.type === 'COMMAND_HAPTIC') {
        const cmd = message as HapticFeedbackCommand;
        if ('vibrate' in navigator) {
          navigator.vibrate(cmd.pattern);
          log(`Haptic feedback triggered: [${cmd.pattern.join(', ')}] ms`);
        }
      }
    }
  });

  networkClient.connect();
}

// Button Events
btnPadA.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  buttons.a = true;
  if ('vibrate' in navigator) navigator.vibrate(20);
  sendInputFrame();
  log('Button [A] Pressed');
});
btnPadA.addEventListener('pointerup', () => {
  buttons.a = false;
  sendInputFrame();
});

btnPadB.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  buttons.b = true;
  if ('vibrate' in navigator) navigator.vibrate(20);
  sendInputFrame();
  log('Button [B] Pressed');
});
btnPadB.addEventListener('pointerup', () => {
  buttons.b = false;
  sendInputFrame();
});

btnToggleMotion.addEventListener('click', async () => {
  if (!isStreamingMotion) {
    const started = await startMotionSensors();
    if (started) {
      isStreamingMotion = true;
      btnToggleMotion.textContent = 'Stop Motion Stream';
      btnToggleMotion.style.background = '#ef4444';
      log('Motion stream started');
    }
  } else {
    isStreamingMotion = false;
    btnToggleMotion.textContent = 'Start Continuous Motion Stream';
    btnToggleMotion.style.background = 'var(--accent)';
    sensorState.textContent = 'Paused';
    log('Motion stream paused');
  }
});

btnSendTest.addEventListener('click', () => {
  currentRotation = { alpha: Math.random() * 2, beta: Math.random() * 2, gamma: Math.random() * 2 };
  currentAccel = { x: Math.random(), y: Math.random(), z: 9.8 };
  sendInputFrame();
  log('Sent test motion input frame');
});

btnJoin.addEventListener('click', () => {
  const code = inputRoom.value.trim().toUpperCase();
  if (code && networkClient) {
    activeRoomId = code;
    networkClient.setRoomId(code);
    log(`Joining room ${code}...`);
  }
});

// Boot
function boot(): void {
  updateHapticSupport();
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get('room');
  if (roomParam) {
    activeRoomId = roomParam.trim().toUpperCase();
    inputRoom.value = activeRoomId;
  }
  initNetwork();
}

boot();

