import { ConsoleShell } from './ui/shell.js';
import { ConsoleNetworkClient, type NetworkStatus } from './core/network.js';
import { DebugOverlay } from './core/debug-overlay.js';
import { InteractionManager } from './pointer/interaction-manager.js';
import { GameManager } from './games/game-manager.js';
import { audioManager } from './audio/audio-manager.js';
import { WS_PATH, API_INFO_PATH } from '../shared/constants.js';
import { 
  isCompactPacket,
  BUTTON_MASKS,
  type NimbusNetworkMessage, 
  type HapticFeedbackCommand, 
  type MotionInputFrame
} from '../shared/protocol.js';

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
let debugOverlay: DebugOverlay | null = null;
let interaction: InteractionManager | null = null;
let gameManager: GameManager | null = null;

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
      debugOverlay?.updateLatency(rttMs);
    },
    onMessage: (message: NimbusNetworkMessage) => {
      frameCounter++;
      if (pairingFramesVal) {
        pairingFramesVal.textContent = `${frameCounter} frames`;
      }

      // Handle Compact 60Hz Packet
      if (isCompactPacket(message)) {
        debugOverlay?.ingestPacket(message);
        interaction?.ingestFrame(message);
        return;
      }

      // Handle Verbose Frame
      if (message.type === 'INPUT_FRAME') {
        const frame = message as MotionInputFrame;
        debugOverlay?.ingestPacket(frame);
        interaction?.ingestFrame(frame);
        return;
      }

      appendLog(JSON.stringify(message));
    }
  });

  networkClient.connect();
}

function bindModalButtons(): void {
  btnDialogBack?.addEventListener('click', () => shell?.closeLaunchDialog());
  btnDialogStart?.addEventListener('click', async () => {
    const game = shell?.getActiveDialogGame();
    if (game) {
      shell?.closeLaunchDialog();
      audioManager.playLaunchChime();
      await gameManager?.launchGame(game.id, {
        sendHaptic: (pattern) => {
          if (networkClient) {
            networkClient.send({
              type: 'COMMAND_HAPTIC',
              seq: Date.now(),
              timestamp: Date.now(),
              pattern
            });
          }
        }
      });
    }
  });

  btnPairingClose?.addEventListener('click', () => shell?.closePairingScreen());
  diskSettings?.addEventListener('click', (e) => {
    e.preventDefault();
    shell?.openSettingsScreen();
  });

  diskMessages?.addEventListener('click', (e) => {
    e.preventDefault();
    shell?.togglePauseOverlay();
  });

  headerBatteryPill?.addEventListener('click', () => shell?.openPairingScreen());

  btnPauseResume?.addEventListener('click', () => {
    shell?.closePauseOverlay();
    gameManager?.resume();
  });
  btnPauseCalibrate?.addEventListener('click', () => {
    shell?.closePauseOverlay();
    shell?.openCalibrationScreen();
    interaction?.startCalibrationRoutine();
  });
  btnPausePairing?.addEventListener('click', () => {
    shell?.closePauseOverlay();
    shell?.openPairingScreen();
  });
  btnPauseMenu?.addEventListener('click', () => {
    shell?.closePauseOverlay();
    gameManager?.teardown();
  });
  btnPauseClose?.addEventListener('click', () => {
    shell?.closePauseOverlay();
    gameManager?.resume();
  });

  btnCalibBack?.addEventListener('click', () => {
    interaction?.stopCalibrationRoutine();
    shell?.closeCalibrationScreen();
  });

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

  window.addEventListener('resize', () => {
    interaction?.updateViewport(stageEl.clientWidth, stageEl.clientHeight);
  });
}

// Bootstrap Console
async function boot(): Promise<void> {
  shell = new ConsoleShell(stageEl, handPointerEl);
  debugOverlay = new DebugOverlay();

  const gameContainer = document.getElementById('game-container') as HTMLElement;
  gameManager = new GameManager(gameContainer, (isRunning) => {
    interaction?.setGameActive(isRunning);
    stageEl.classList.toggle('in-game', isRunning);
    if (gameContainer) {
      gameContainer.style.display = isRunning ? 'block' : 'none';
    }
  });

  interaction = new InteractionManager(stageEl, handPointerEl, {
    openLaunchDialog: (id) => shell?.openLaunchDialog(id),
    closeLaunchDialog: () => shell?.closeLaunchDialog(),
    openSettings: () => shell?.openSettingsScreen(),
    closeSettings: () => shell?.closeSettingsScreen(),
    openPairing: () => shell?.openPairingScreen(),
    closePairing: () => shell?.closePairingScreen(),
    openCalibration: () => {
      shell?.openCalibrationScreen();
      interaction?.startCalibrationRoutine();
    },
    closeCalibration: () => {
      interaction?.stopCalibrationRoutine();
      shell?.closeCalibrationScreen();
    },
    togglePause: () => {
      shell?.togglePauseOverlay();
      if (gameManager?.isGameRunning()) {
        gameManager.pause();
      }
    },
    closePause: () => {
      shell?.closePauseOverlay();
      gameManager?.resume();
    },
    changePage: (delta) => shell?.changePage(delta)
  });

  bindModalButtons();
  await fetchLanInfo();
  initNetwork();

  // 60 FPS Game Loop
  const tickGame = () => {
    if (gameManager?.isGameRunning()) {
      const pos = interaction?.getPipeline().getPosition();
      const bitmask = interaction?.getBitmask() ?? 0;
      const isMouseDown = interaction?.getIsMouseDown() ?? false;

      const motion = interaction?.getLatestMotion();

      gameManager.update({
        pointerX: pos?.x ?? 960,
        pointerY: pos?.y ?? 540,
        isSliceHeld: (bitmask & BUTTON_MASKS.B) !== 0 || isMouseDown,
        isTriggerPressed: (bitmask & BUTTON_MASKS.A) !== 0,
        rawBitmask: bitmask,
        accel: motion ? { ...motion.acceleration } : undefined,
        gyro: motion ? { ...motion.rotationRate } : undefined
      });
    }
    requestAnimationFrame(tickGame);
  };
  requestAnimationFrame(tickGame);
}

boot();
