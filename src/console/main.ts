import { ConsoleShell } from './ui/shell.js';
import { ConsoleNetworkClient, type NetworkStatus } from './core/network.js';
import { DebugOverlay } from './core/debug-overlay.js';
import { InteractionManager } from './pointer/interaction-manager.js';
import { GameManager } from './games/game-manager.js';
import { audioManager } from './audio/audio-manager.js';
import { OnboardingManager } from './ui/onboarding.js';
import { CHANNEL_ART } from './ui/artwork.js';
import { WS_PATH, API_INFO_PATH } from '../shared/constants.js';
import { 
  isCompactPacket, BUTTON_MASKS, createMessage, type NimbusNetworkMessage, type CompactMotionPacket,
  type HapticFeedbackCommand, type HapticWaveformType, type MotionInputFrame, type LayoutModeCommand,
  type SwitchGameCommand, type GameStateSyncMessage
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
let onboarding: OnboardingManager | null = null;
let hasPlayedStartupChime = false;
let currentActiveGameId: string | undefined;

function broadcastStateSync(isGameRunning: boolean, isPaused: boolean, activeGameId?: string): void {
  if (networkClient) {
    networkClient.send(createMessage<GameStateSyncMessage>({
      type: 'STATE_GAME_SYNC',
      isGameRunning,
      isPaused,
      activeGameId
    }));
  }
}

function updateClusterUI(isPaused: boolean): void {
  const icon = document.getElementById('cluster-pause-icon');
  const label = document.getElementById('cluster-pause-label');
  if (icon) icon.textContent = isPaused ? 'play_arrow' : 'pause';
  if (label) label.textContent = isPaused ? 'Resume' : 'Pause';
}

async function launchGameSession(gameId: string, gameTitle?: string): Promise<void> {
  shell?.closeLaunchDialog();
  document.getElementById('switch-game-overlay')?.classList.remove('open');
  audioManager.playLaunchChime();
  shell?.showChannelLoading(gameTitle || gameId);
  currentActiveGameId = gameId;

  await new Promise((r) => setTimeout(r, 300));
  await gameManager?.launchGame(gameId, {
    sendHaptic: (pattern) => {
      if (networkClient) {
        networkClient.send(createMessage<HapticFeedbackCommand>({ type: 'COMMAND_HAPTIC', pattern }));
      }
    },
    setLayoutMode: (mode, gid) => {
      if (networkClient) {
        networkClient.send(createMessage<LayoutModeCommand>({ type: 'COMMAND_LAYOUT_MODE', mode, gameId: gid }));
      }
    }
  });

  shell?.hideChannelLoading();
  interaction?.setGameActive(true, gameId);
  updateClusterUI(false);
  broadcastStateSync(true, false, gameId);
}

function togglePauseGame(): void {
  if (!gameManager?.isGameRunning()) return;
  const pauseOverlay = document.getElementById('pause-overlay');
  const wasOpen = pauseOverlay?.classList.contains('open') ?? false;
  if (wasOpen) {
    shell?.closePauseOverlay();
    gameManager.resume();
    updateClusterUI(false);
    broadcastStateSync(true, false, currentActiveGameId);
  } else {
    shell?.openPauseOverlay();
    gameManager.pause();
    updateClusterUI(true);
    broadcastStateSync(true, true, currentActiveGameId);
  }
}

function updateConsoleDiagUI(c: CompactMotionPacket): void {
  const overlay = document.getElementById('controller-test-overlay');
  if (!overlay || !overlay.classList.contains('open')) return;

  const elPitch = document.getElementById('ct-pitch-val');
  const elRoll = document.getElementById('ct-roll-val');
  const elYaw = document.getElementById('ct-yaw-val');
  const elTransport = document.getElementById('ct-transport-badge');
  const elRtt = document.getElementById('ct-rtt-val');

  if (elPitch) elPitch.textContent = `${c.r[1].toFixed(1)}°`;
  if (elRoll) elRoll.textContent = `${c.r[2].toFixed(1)}°`;
  if (elYaw) elYaw.textContent = `${c.r[0].toFixed(1)}°/s`;
  if (elTransport && networkClient) elTransport.textContent = networkClient.getTransportType().toUpperCase();
  if (elRtt && pairingRttVal) elRtt.textContent = pairingRttVal.textContent || '-- ms';

  const btnMap: [string, number][] = [
    ['ct-btn-a', BUTTON_MASKS.A],
    ['ct-btn-b', BUTTON_MASKS.B],
    ['ct-btn-up', BUTTON_MASKS.DPAD_UP],
    ['ct-btn-down', BUTTON_MASKS.DPAD_DOWN],
    ['ct-btn-left', BUTTON_MASKS.DPAD_LEFT],
    ['ct-btn-right', BUTTON_MASKS.DPAD_RIGHT],
    ['ct-btn-home', BUTTON_MASKS.HOME],
    ['ct-btn-recenter', BUTTON_MASKS.RECENTER]
  ];

  for (const [id, mask] of btnMap) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', (c.b & mask) !== 0);
  }
}

// DOM Elements
const stageEl = document.getElementById('stage') as HTMLElement;
const handPointerEl = document.getElementById('hand-pointer') as HTMLElement;
const pairingPeerBadge = document.getElementById('pairing-peer-badge') as HTMLSpanElement | null;
const pairingRttVal = document.getElementById('pairing-rtt-val') as HTMLSpanElement | null;
const pairingFramesVal = document.getElementById('pairing-frames-val') as HTMLSpanElement | null;
const pairingLogBox = document.getElementById('pairing-log-box') as HTMLDivElement | null;

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

      // Auto-pause active game and display reconnect overlay on wand disconnect
      if (gameManager?.isGameRunning()) {
        if (!connected) {
          gameManager.pause();
          shell?.openReconnectOverlay();
        } else {
          shell?.closeReconnectOverlay();
          gameManager.resume();
          audioManager.playSelect();
        }
      }
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
    onTransportChange: (transport) => {
      debugOverlay?.setTransport(transport === 'webrtc' ? 'WebRTC DataChannel (p2p)' : 'WebSocket (relay)');
      appendLog(`[Network] Transport active: ${transport.toUpperCase()}`);
    },
    onMessage: (message: NimbusNetworkMessage) => {
      frameCounter++;
      if (pairingFramesVal) {
        pairingFramesVal.textContent = `${frameCounter} frames`;
      }

      // Handle Compact 60Hz Packet
      if (isCompactPacket(message)) {
        updateConsoleDiagUI(message);
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

      if (message.type === 'COMMAND_PAUSE') {
        if (gameManager?.isGameRunning()) {
          shell?.openPauseOverlay();
          gameManager.pause();
          updateClusterUI(true);
          broadcastStateSync(true, true, currentActiveGameId);
        }
        return;
      }

      if (message.type === 'COMMAND_RESUME') {
        if (gameManager?.isGameRunning()) {
          shell?.closePauseOverlay();
          gameManager.resume();
          updateClusterUI(false);
          broadcastStateSync(true, false, currentActiveGameId);
        }
        return;
      }

      if (message.type === 'COMMAND_RESTART') {
        gameManager?.getActiveGame()?.restart();
        return;
      }

      if (message.type === 'COMMAND_EXIT_MENU') {
        shell?.closePauseOverlay();
        document.getElementById('switch-game-overlay')?.classList.remove('open');
        gameManager?.teardown();
        currentActiveGameId = undefined;
        broadcastStateSync(false, false);
        return;
      }

      if (message.type === 'COMMAND_SWITCH_GAME') {
        const cmd = message as SwitchGameCommand;
        shell?.closePauseOverlay();
        launchGameSession(cmd.gameId);
        return;
      }

      appendLog(JSON.stringify(message));
    }
  });

  networkClient.connect();
}

function bindModalButtons(): void {
  document.getElementById('btn-dialog-back')?.addEventListener('click', () => shell?.closeLaunchDialog());
  document.getElementById('btn-dialog-start')?.addEventListener('click', async () => {
    const game = shell?.getActiveDialogGame();
    if (game) {
      await launchGameSession(game.id, game.title);
    }
  });

  // Persistent in-game cluster controls
  document.getElementById('btn-cluster-pause')?.addEventListener('click', () => {
    togglePauseGame();
    audioManager.playSelect();
  });
  document.getElementById('btn-cluster-switch')?.addEventListener('click', () => {
    document.getElementById('switch-game-overlay')?.classList.add('open');
    audioManager.playSelect();
  });
  document.getElementById('btn-cluster-menu')?.addEventListener('click', () => {
    gameManager?.teardown();
    currentActiveGameId = undefined;
    broadcastStateSync(false, false);
    audioManager.playBack();
  });

  // Wii-style switch game overlay bindings
  const switchGrid = document.getElementById('switch-game-grid');
  if (switchGrid) {
    const list: [string, string][] = [
      ['fruitNinja', CHANNEL_ART.fruitNinja],
      ['alienAttack', CHANNEL_ART.alienAttack],
      ['shootingRange', CHANNEL_ART.shootingRange],
      ['sketch', CHANNEL_ART.sketch],
      ['turboCircuit', CHANNEL_ART.turboCircuit]
    ];
    switchGrid.innerHTML = list.map(([id, art]) => `
      <div class="switch-game-tile channel-tile" data-game="${id}">
        ${art}
      </div>
    `).join('');

    switchGrid.querySelectorAll('.switch-game-tile').forEach((tile) => {
      tile.addEventListener('click', () => {
        const gid = tile.getAttribute('data-game');
        if (gid) launchGameSession(gid);
      });
    });
  }

  document.getElementById('btn-switch-close')?.addEventListener('click', () => {
    document.getElementById('switch-game-overlay')?.classList.remove('open');
    audioManager.playBack();
  });

  // Ambience Toggle in Bottom Tray
  const btnToggleAmbience = document.getElementById('btn-toggle-ambience');
  const settingAmbienceMusic = document.getElementById('setting-ambience-music') as HTMLInputElement | null;

  btnToggleAmbience?.addEventListener('click', () => {
    const isMuted = audioManager.toggleAmbience();
    shell?.updateAmbienceUI(isMuted);
    if (settingAmbienceMusic) settingAmbienceMusic.checked = !isMuted;
    audioManager.playSelect();
  });

  settingAmbienceMusic?.addEventListener('change', () => {
    const isMuted = !settingAmbienceMusic.checked;
    audioManager.setAmbienceMuted(isMuted);
    shell?.updateAmbienceUI(isMuted);
  });

  // Onboarding Guide Buttons
  document.getElementById('btn-settings-guide')?.addEventListener('click', () => {
    shell?.closeSettingsScreen();
    onboarding?.open();
  });
  document.getElementById('btn-pairing-guide')?.addEventListener('click', () => {
    shell?.closePairingScreen();
    onboarding?.open();
  });

  // Reconnect Overlay Buttons (Mid-game wand disconnect)
  document.getElementById('btn-reconnect-mouse')?.addEventListener('click', () => {
    shell?.closeReconnectOverlay();
    gameManager?.resume();
    audioManager.playSelect();
  });
  document.getElementById('btn-reconnect-menu')?.addEventListener('click', () => {
    shell?.closeReconnectOverlay();
    gameManager?.teardown();
    audioManager.playBack();
  });

  // First User Gesture: initialize Web Audio context and play authentic startup chime
  const onFirstGesture = () => {
    audioManager.initOnGesture();
    if (!hasPlayedStartupChime) {
      hasPlayedStartupChime = true;
      audioManager.playStartupChime();
    }
    window.removeEventListener('pointerdown', onFirstGesture);
    window.removeEventListener('keydown', onFirstGesture);
  };
  window.addEventListener('pointerdown', onFirstGesture);
  window.addEventListener('keydown', onFirstGesture);

  document.getElementById('btn-pairing-close')?.addEventListener('click', () => shell?.closePairingScreen());
  document.getElementById('disk-settings')?.addEventListener('click', (e) => { e.preventDefault(); shell?.openSettingsScreen(); });
  document.getElementById('disk-messages')?.addEventListener('click', (e) => { e.preventDefault(); shell?.togglePauseOverlay(); });
  document.getElementById('header-battery-pill')?.addEventListener('click', () => shell?.openPairingScreen());

  document.getElementById('btn-pause-resume')?.addEventListener('click', () => { shell?.closePauseOverlay(); gameManager?.resume(); });
  document.getElementById('btn-pause-calibrate')?.addEventListener('click', () => { shell?.closePauseOverlay(); shell?.openCalibrationScreen(); interaction?.startCalibrationRoutine(); });
  document.getElementById('btn-pause-pairing')?.addEventListener('click', () => { shell?.closePauseOverlay(); shell?.openPairingScreen(); });
  document.getElementById('btn-pause-menu')?.addEventListener('click', () => { shell?.closePauseOverlay(); gameManager?.teardown(); interaction?.setGameActive(false); });
  document.getElementById('btn-pause-close')?.addEventListener('click', () => { shell?.closePauseOverlay(); gameManager?.resume(); });
  document.getElementById('btn-calib-back')?.addEventListener('click', () => { interaction?.stopCalibrationRoutine(); shell?.closeCalibrationScreen(); });

  // Controller Test Diagnostic Modal Bindings
  const diagOverlay = document.getElementById('controller-test-overlay');
  const openDiag = () => {
    shell?.closeSettingsScreen();
    shell?.closePairingScreen();
    shell?.closePauseOverlay();
    diagOverlay?.classList.add('open');
    audioManager.playSelect();
  };

  document.getElementById('btn-settings-ctrl-test')?.addEventListener('click', openDiag);
  document.getElementById('btn-pause-ctrl-test')?.addEventListener('click', openDiag);
  document.getElementById('btn-pairing-ctrl-test')?.addEventListener('click', openDiag);

  document.getElementById('btn-ctrl-test-close')?.addEventListener('click', () => {
    diagOverlay?.classList.remove('open');
    audioManager.playBack();
  });

  diagOverlay?.querySelectorAll('[data-ct-haptic]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const waveform = btn.getAttribute('data-ct-haptic') as HapticWaveformType | null;
      if (waveform && networkClient) {
        networkClient.send(createMessage<HapticFeedbackCommand>({
          type: 'COMMAND_HAPTIC',
          pattern: [30],
          waveform
        }));
        audioManager.playSelect();
        appendLog(`[Haptic] Triggered test waveform: ${waveform}`);
      }
    });
  });

  document.getElementById('btn-pairing-test-vibrate')?.addEventListener('click', () => {
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
  shell = new ConsoleShell(stageEl);
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
      const isOpen = document.getElementById('pause-overlay')?.classList.contains('open') ?? false;
      if (gameManager?.isGameRunning()) {
        if (isOpen) gameManager.pause();
        else gameManager.resume();
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

  // Onboarding initialization
  onboarding = new OnboardingManager();
  if (onboarding.shouldAutoLaunch()) {
    onboarding.open();
  }
  shell?.updateAmbienceUI(audioManager.isAmbienceMuted());

  const boundsGuide = document.createElement('div');
  boundsGuide.id = 'debug-clamp-bounds';
  boundsGuide.style.cssText = 'position: absolute; inset: 0; pointer-events: none; border: 3px dashed rgba(56, 189, 248, 0.6); box-shadow: inset 0 0 20px rgba(56, 189, 248, 0.2); z-index: 9999; display: none;';
  stageEl.appendChild(boundsGuide);

  // 60 FPS Game Loop
  const tickGame = () => {
    const pos = interaction?.getPipeline().getPosition();
    if (pos && debugOverlay) {
      debugOverlay.updatePointer(pos.x, pos.y, pos.rawX ?? pos.x, pos.rawY ?? pos.y);
    }

    if (gameManager?.isGameRunning()) {
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
