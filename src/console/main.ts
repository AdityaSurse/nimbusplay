import { ConsoleShell } from './ui/shell.js';
import { ConsoleNetworkClient, type NetworkStatus } from './core/network.js';
import { WS_PATH, API_INFO_PATH } from '../shared/constants.js';
import type { NimbusNetworkMessage, HapticFeedbackCommand, MotionInputFrame } from '../shared/protocol.js';

interface LanInfo {
  lanIp: string;
  port: number;
}

let activeRoomId = 'AUTO';
let lanIp = window.location.hostname;
let lanPort = window.location.port ? Number(window.location.port) : 5173;
let frameCounter = 0;
let networkClient: ConsoleNetworkClient | null = null;
let shell: ConsoleShell | null = null;

// DOM Elements
const stageEl = document.getElementById('stage') as HTMLElement;
const handPointerEl = document.getElementById('hand-pointer') as HTMLElement;
const pairingPeerBadge = document.getElementById('pairing-peer-badge') as HTMLSpanElement;
const pairingRttVal = document.getElementById('pairing-rtt-val') as HTMLSpanElement;
const pairingFramesVal = document.getElementById('pairing-frames-val') as HTMLSpanElement;
const pairingLogBox = document.getElementById('pairing-log-box') as HTMLDivElement;
const btnPairingTestVibrate = document.getElementById('btn-pairing-test-vibrate') as HTMLButtonElement;
const headerBatteryPill = document.getElementById('header-battery-pill') as HTMLDivElement;

// Modal Action Buttons
const btnDialogBack = document.getElementById('btn-dialog-back');
const btnDialogStart = document.getElementById('btn-dialog-start');
const btnPairingClose = document.getElementById('btn-pairing-close');
const diskSettings = document.getElementById('disk-settings');
const diskMessages = document.getElementById('disk-messages');
const btnPauseResume = document.getElementById('btn-pause-resume');
const btnPauseCalibrate = document.getElementById('btn-pause-calibrate');
const btnPausePairing = document.getElementById('btn-pause-pairing');
const btnPauseMenu = document.getElementById('btn-pause-menu');
const btnPauseClose = document.getElementById('btn-pause-close');
const btnCalibBack = document.getElementById('btn-calib-back');

function appendLog(text: string): void {
  if (!pairingLogBox) return;
  const line = document.createElement('div');
  line.style.lineHeight = '1.4';
  const time = new Date().toLocaleTimeString();
  line.innerHTML = `<span style="color: #64748b;">[${time}]</span> ${escapeHtml(text)}`;
  pairingLogBox.appendChild(line);

  while (pairingLogBox.children.length > 50) {
    pairingLogBox.removeChild(pairingLogBox.children[0]);
  }
  pairingLogBox.scrollTop = pairingLogBox.scrollHeight;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fetchLanInfo(): Promise<void> {
  try {
    const res = await fetch(API_INFO_PATH);
    if (res.ok) {
      const data = (await res.json()) as LanInfo;
      lanIp = data.lanIp;
      lanPort = data.port;
    }
  } catch (err) {
    console.warn('[Console] Using fallback hostname for LAN IP:', err);
  }
}

function getControllerUrl(roomId: string): string {
  const isHttps = window.location.protocol === 'https:';
  const protocol = isHttps ? 'https' : 'http';
  const host = lanIp === 'localhost' || lanIp === '127.0.0.1' ? window.location.hostname : lanIp;
  return `${protocol}://${host}:${lanPort}/controller?room=${roomId}`;
}

function initNetwork(): void {
  const isHttps = window.location.protocol === 'https:';
  const wsProto = isHttps ? 'wss:' : 'ws:';
  const wsUrl = `${wsProto}//${window.location.host}${WS_PATH}`;

  networkClient = new ConsoleNetworkClient(wsUrl, activeRoomId, {
    onStatusChange: (status: NetworkStatus, details?: string) => {
      appendLog(`[Relay] ${status.toUpperCase()} ${details || ''}`);
    },
    onPeerStatus: (connected: boolean) => {
      if (pairingPeerBadge) {
        pairingPeerBadge.textContent = connected ? 'Connected' : 'Waiting';
        pairingPeerBadge.style.background = connected ? 'rgba(34, 197, 94, 0.2)' : '#e2e8f0';
        pairingPeerBadge.style.color = connected ? '#22c55e' : '#475569';
      }
      appendLog(`[Controller] Peer ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
    },
    onRoomJoined: (roomId: string) => {
      activeRoomId = roomId;
      const url = getControllerUrl(roomId);
      if (shell) {
        shell.updatePairingInfo(roomId, url);
      }
      appendLog(`[Room] Assigned code: ${roomId}`);
    },
    onLatencyUpdate: (rttMs: number) => {
      if (pairingRttVal) {
        pairingRttVal.textContent = `${rttMs} ms`;
      }
    },
    onMessage: (message: NimbusNetworkMessage) => {
      frameCounter++;
      if (pairingFramesVal) {
        pairingFramesVal.textContent = `${frameCounter} frames`;
      }

      if (message.type === 'INPUT_FRAME') {
        const frame = message as MotionInputFrame;
        // If controller pressed Home button, toggle Pause HUD
        if (frame.buttons.home) {
          shell?.togglePauseOverlay();
        }
      }

      appendLog(JSON.stringify(message));
    }
  });

  networkClient.connect();
}

function bindModalButtons(): void {
  btnDialogBack?.addEventListener('click', () => shell?.closeLaunchDialog());
  btnDialogStart?.addEventListener('click', () => {
    alert('Game Launch animation triggered! Game runtime loads in Phase 7.');
    shell?.closeLaunchDialog();
  });

  btnPairingClose?.addEventListener('click', () => shell?.closePairingScreen());
  diskSettings?.addEventListener('click', (e) => {
    e.preventDefault();
    shell?.openPairingScreen();
  });

  diskMessages?.addEventListener('click', (e) => {
    e.preventDefault();
    shell?.togglePauseOverlay();
  });

  headerBatteryPill?.addEventListener('click', () => shell?.openPairingScreen());

  btnPauseResume?.addEventListener('click', () => shell?.closePauseOverlay());
  btnPauseCalibrate?.addEventListener('click', () => {
    shell?.closePauseOverlay();
    shell?.openCalibrationScreen();
  });
  btnPausePairing?.addEventListener('click', () => {
    shell?.closePauseOverlay();
    shell?.openPairingScreen();
  });
  btnPauseMenu?.addEventListener('click', () => {
    shell?.closePauseOverlay();
  });
  btnPauseClose?.addEventListener('click', () => shell?.closePauseOverlay());

  btnCalibBack?.addEventListener('click', () => shell?.closeCalibrationScreen());

  btnPairingTestVibrate?.addEventListener('click', () => {
    if (networkClient) {
      const cmd: HapticFeedbackCommand = {
        type: 'COMMAND_HAPTIC',
        seq: Date.now(),
        timestamp: Date.now(),
        pattern: [60, 40, 60]
      };
      networkClient.send(cmd);
      appendLog('[Action] Sent COMMAND_HAPTIC to controller');
    }
  });
}

// Bootstrap Console
async function boot(): Promise<void> {
  shell = new ConsoleShell(stageEl, handPointerEl);
  bindModalButtons();
  await fetchLanInfo();
  initNetwork();
}

boot();
