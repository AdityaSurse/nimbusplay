import QRCode from 'qrcode';
import { ConsoleNetworkClient, type NetworkStatus } from './core/network.js';
import { WS_PATH, API_INFO_PATH } from '../shared/constants.js';
import type { NimbusNetworkMessage, HapticFeedbackCommand } from '../shared/protocol.js';

interface LanInfo {
  lanIp: string;
  port: number;
}

let activeRoomId = 'AUTO';
let lanIp = window.location.hostname;
let lanPort = window.location.port ? Number(window.location.port) : 5173;
let frameCounter = 0;
let networkClient: ConsoleNetworkClient | null = null;

// DOM Elements
const relayStatusEl = document.getElementById('relay-status') as HTMLSpanElement;
const peerStatusEl = document.getElementById('peer-status') as HTMLSpanElement;
const roomCodeText = document.getElementById('room-code-text') as HTMLDivElement;
const roomUrlText = document.getElementById('room-url-text') as HTMLDivElement;
const lanIpVal = document.getElementById('lan-ip-val') as HTMLSpanElement;
const rttVal = document.getElementById('rtt-val') as HTMLSpanElement;
const framesCount = document.getElementById('frames-count') as HTMLSpanElement;
const logContainer = document.getElementById('log-container') as HTMLDivElement;
const qrcodeCanvas = document.getElementById('qrcode-canvas') as HTMLCanvasElement;
const btnVibrate = document.getElementById('btn-vibrate') as HTMLButtonElement;
const btnClearLogs = document.getElementById('btn-clear-logs') as HTMLButtonElement;

function appendLog(text: string, isImportant = false): void {
  const line = document.createElement('div');
  line.className = 'log-line';
  if (isImportant) {
    line.style.color = '#38bdf8';
    line.style.fontWeight = 'bold';
  }
  const time = new Date().toLocaleTimeString();
  line.innerHTML = `<span class="log-time">[${time}]</span> ${escapeHtml(text)}`;
  logContainer.appendChild(line);

  // Keep at most 200 lines
  while (logContainer.children.length > 200) {
    logContainer.removeChild(logContainer.children[0]);
  }
  logContainer.scrollTop = logContainer.scrollHeight;
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
      lanIpVal.textContent = `${lanIp}:${lanPort}`;
    }
  } catch (err) {
    console.warn('[Console] Could not fetch LAN info, using fallback hostname:', err);
    lanIpVal.textContent = `${lanIp}:${lanPort}`;
  }
}

function updateQrCode(roomId: string): void {
  const isHttps = window.location.protocol === 'https:';
  const protocol = isHttps ? 'https' : 'http';
  const host = lanIp === 'localhost' || lanIp === '127.0.0.1' ? window.location.hostname : lanIp;
  const controllerUrl = `${protocol}://${host}:${lanPort}/controller?room=${roomId}`;

  roomCodeText.textContent = roomId;
  roomUrlText.textContent = controllerUrl;

  QRCode.toCanvas(qrcodeCanvas, controllerUrl, {
    width: 200,
    margin: 1,
    color: {
      dark: '#0284c7',
      light: '#ffffff'
    }
  }, (err) => {
    if (err) console.error('[Console] QR generation failed:', err);
  });
}

function initNetwork(): void {
  const isHttps = window.location.protocol === 'https:';
  const wsProto = isHttps ? 'wss:' : 'ws:';
  const wsUrl = `${wsProto}//${window.location.host}${WS_PATH}`;

  networkClient = new ConsoleNetworkClient(wsUrl, activeRoomId, {
    onStatusChange: (status: NetworkStatus, details?: string) => {
      relayStatusEl.className = `badge ${status}`;
      relayStatusEl.textContent = `Relay: ${status.toUpperCase()}${details ? ` (${details})` : ''}`;
      appendLog(`[Relay Status] ${status} ${details || ''}`, true);
    },
    onPeerStatus: (connected: boolean) => {
      peerStatusEl.className = `badge ${connected ? 'connected' : 'disconnected'}`;
      peerStatusEl.textContent = connected ? 'Controller: Connected' : 'Controller: Waiting';
      appendLog(`[Peer Status] Controller is ${connected ? 'CONNECTED' : 'DISCONNECTED'}`, true);
    },
    onRoomJoined: (roomId: string) => {
      activeRoomId = roomId;
      updateQrCode(roomId);
      appendLog(`[Room] Joined room ${roomId}`, true);
    },
    onLatencyUpdate: (rttMs: number) => {
      rttVal.textContent = `${rttMs} ms`;
    },
    onMessage: (message: NimbusNetworkMessage) => {
      frameCounter++;
      framesCount.textContent = frameCounter.toString();
      appendLog(JSON.stringify(message));
    }
  });

  networkClient.connect();
}

btnVibrate.addEventListener('click', () => {
  if (networkClient) {
    const cmd: HapticFeedbackCommand = {
      type: 'COMMAND_HAPTIC',
      seq: Date.now(),
      timestamp: Date.now(),
      pattern: [50, 30, 50]
    };
    networkClient.send(cmd);
    appendLog('[Action] Sent COMMAND_HAPTIC to controller', true);
  }
});

btnClearLogs.addEventListener('click', () => {
  logContainer.innerHTML = '';
});

// Boot sequence
async function boot(): Promise<void> {
  await fetchLanInfo();
  initNetwork();
}

boot();

