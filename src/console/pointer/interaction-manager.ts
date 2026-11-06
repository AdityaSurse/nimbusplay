/**
 * NimbusPlay — Console Interaction & Pointer Orchestrator
 * Maps phone pointer pipeline to UI cursor, hover states, clicks (A),
 * back actions (B), D-pad navigation, calibration, and mouse fallback.
 * Strictly typed with zero `any`.
 */

import { PointerPipeline } from './pipeline.js';
import { CalibrationManager } from './calibration.js';
import { SettingsManager } from './settings-manager.js';
import { SettingsUiBinder } from './settings-ui.js';
import { CalibrationUiManager } from './calibration-ui.js';
import type { MotionSample } from './types.js';
import { BUTTON_MASKS, type CompactMotionPacket, type MotionInputFrame } from '../../shared/protocol.js';
import { audioManager } from '../audio/audio-manager.js';

export interface ConsoleInteractionCallbacks {
  openLaunchDialog: (gameId: string) => void;
  closeLaunchDialog: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openPairing: () => void;
  closePairing: () => void;
  openCalibration: () => void;
  closeCalibration: () => void;
  togglePause: () => void;
  closePause: () => void;
  changePage: (delta: number) => void;
}

export class InteractionManager {
  private stageEl: HTMLElement;
  private pointerEl: HTMLElement;
  private pipeline: PointerPipeline;
  private calibration: CalibrationManager;
  private calibrationUi: CalibrationUiManager;
  private settingsManager: SettingsManager;
  private callbacks: ConsoleInteractionCallbacks;

  // Active interaction state
  private hoveredElement: HTMLElement | null = null;
  private prevBitmask = 0;
  private currentBitmask = 0;
  private isMouseDown = false;
  private isGameActive = false;
  private homePressStart = 0;
  private activeChannelIndex = 0;
  private lastSequence = 0;
  private lastFrameTime = 0;
  private latestMotion: MotionSample = {
    rotationRate: { alpha: 0, beta: 0, gamma: 0 },
    acceleration: { x: 0, y: 0, z: 9.8 }
  };

  constructor(
    stageEl: HTMLElement,
    pointerEl: HTMLElement,
    callbacks: ConsoleInteractionCallbacks
  ) {
    this.stageEl = stageEl;
    this.pointerEl = pointerEl;
    this.callbacks = callbacks;

    this.settingsManager = new SettingsManager();
    const initialSettings = this.settingsManager.getSettings();

    // Canonical 16:9 stage domain: always 1920 x 1080
    this.pipeline = new PointerPipeline(
      { width: 1920, height: 1080 },
      initialSettings
    );

    // Load saved calibration if present
    const savedCalib = CalibrationManager.loadPersistedCalibration();
    if (savedCalib) this.pipeline.setCalibration(savedCalib);

    this.calibration = new CalibrationManager();
    this.calibrationUi = new CalibrationUiManager(this.calibration, this.pipeline, {
      recenterPointer: () => this.recenterPointer(),
      closeCalibration: () => this.callbacks.closeCalibration()
    });

    this.bindSettingsUI();
    this.bindMouseFallback();
    this.startPredictionLoop();
  }

  public setGameActive(active: boolean, gameId?: string): void {
    this.isGameActive = active;
    const settings = this.settingsManager.setActiveGame(active ? gameId : 'global');
    this.pipeline.updateSettings(settings);

    if (active && this.hoveredElement) {
      this.hoveredElement.classList.remove('is-hovered');
      this.hoveredElement = null;
    }
  }

  public getBitmask(): number {
    return this.currentBitmask;
  }

  public getIsMouseDown(): boolean {
    return this.isMouseDown;
  }

  public getLatestMotion(): MotionSample {
    return this.latestMotion;
  }

  public updateViewport(_width: number, _height: number): void {
    // Stage coordinate space remains strictly canonical 1920x1080
    this.pipeline.setViewport({ width: 1920, height: 1080 });
  }

  public getPipeline(): PointerPipeline {
    return this.pipeline;
  }

  public ingestFrame(packet: CompactMotionPacket | MotionInputFrame): void {
    let bitmask = 0;
    let sample = {
      rotationRate: { alpha: 0, beta: 0, gamma: 0 },
      acceleration: { x: 0, y: 0, z: 9.8 }
    };

    if ('t' in packet && packet.t === 'F') {
      const c = packet as CompactMotionPacket;
      // Latest-wins packet filtering: discard out-of-order packets
      if (c.s <= this.lastSequence) {
        return;
      }
      this.lastSequence = c.s;
      bitmask = c.b;
      sample = {
        rotationRate: { alpha: c.r[0], beta: c.r[1], gamma: c.r[2] },
        acceleration: { x: c.a[0], y: c.a[1], z: c.a[2] }
      };
    } else if ('buttons' in packet) {
      const f = packet as MotionInputFrame;
      sample = { rotationRate: { ...f.rotationRate }, acceleration: { ...f.acceleration } };
      const b = f.buttons;
      if (b.a) bitmask |= BUTTON_MASKS.A;
      if (b.b) bitmask |= BUTTON_MASKS.B;
      if (b.dpadUp) bitmask |= BUTTON_MASKS.DPAD_UP;
      if (b.dpadDown) bitmask |= BUTTON_MASKS.DPAD_DOWN;
      if (b.dpadLeft) bitmask |= BUTTON_MASKS.DPAD_LEFT;
      if (b.dpadRight) bitmask |= BUTTON_MASKS.DPAD_RIGHT;
      if (b.home) bitmask |= BUTTON_MASKS.HOME;
      if (b.recenter) bitmask |= BUTTON_MASKS.RECENTER;
    }

    this.latestMotion = sample;
    this.lastFrameTime = performance.now();

    // 1. If currently on Calibration screen, pass sample to calibrator
    if (this.calibrationUi.getIsCalibrating()) {
      this.calibration.ingestSample(sample);
    }

    // 2. Process motion sample through pipeline
    const pos = this.pipeline.processMotionSample(sample, this.lastFrameTime);
    this.updatePointerVisuals(pos.x, pos.y);

    // 3. Handle Controller Buttons
    this.handleButtons(bitmask);
  }

  private startPredictionLoop(): void {
    const loop = (now: number) => {
      // If > 18ms elapsed since last physical packet and not using mouse, extrapolate cursor
      if (!this.isMouseDown && this.lastFrameTime > 0 && now - this.lastFrameTime > 18 && now - this.lastFrameTime < 80) {
        const predicted = this.pipeline.predict(now);
        this.updatePointerVisuals(predicted.x, predicted.y);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  public updatePointerVisuals(stageX: number, stageY: number): void {
    const stageWidth = this.stageEl.clientWidth || 1920;
    const stageHeight = this.stageEl.clientHeight || 1080;
    const domX = (stageX / 1920) * stageWidth;
    const domY = (stageY / 1080) * stageHeight;

    this.pointerEl.style.transform = `translate3d(${domX}px, ${domY}px, 0) rotate(-12deg)`;
    this.pointerEl.style.setProperty('--ptr-x', `${domX}px`);
    this.pointerEl.style.setProperty('--ptr-y', `${domY}px`);

    const stageRect = this.stageEl.getBoundingClientRect();
    const screenX = stageRect.left + (stageX / 1920) * stageRect.width;
    const screenY = stageRect.top + (stageY / 1080) * stageRect.height;

    const hit = document.elementFromPoint(screenX, screenY);
    let interactive = hit?.closest('.channel-tile, .pill-btn, .bumper-btn, .system-disk-btn, .game-btn, .in-game-ctrl, button, a') as HTMLElement | null;

    if (this.isGameActive && interactive) {
      if (!interactive.closest('.modal-overlay.open, .game-modal-overlay, #game-container, #in-game-cluster, #switch-game-overlay')) {
        interactive = null;
      }
    }

    if (interactive !== this.hoveredElement) {
      if (this.hoveredElement) {
        this.hoveredElement.classList.remove('is-hovered');
      }
      this.hoveredElement = interactive;
      if (this.hoveredElement) {
        this.hoveredElement.classList.add('is-hovered');
        audioManager.playHoverTick();
      }
    }
  }

  private handleButtons(bitmask: number): void {
    this.currentBitmask = bitmask;
    const pressedNow = bitmask & ~this.prevBitmask;
    const releasedNow = ~bitmask & this.prevBitmask;

    // A Button (Primary Select / Click)
    if (pressedNow & BUTTON_MASKS.A) {
      this.pointerEl.classList.add('active-click');
      const target = this.hoveredElement || (document.activeElement as HTMLElement | null);
      if (target && typeof target.click === 'function') {
        target.click();
      }
    }
    if (releasedNow & BUTTON_MASKS.A) {
      this.pointerEl.classList.remove('active-click');
    }

    // B Button (Back / Cancel / Close Active Overlay)
    if (pressedNow & BUTTON_MASKS.B) {
      this.triggerBackAction();
    }

    // Recenter Button
    if (pressedNow & BUTTON_MASKS.RECENTER) {
      this.recenterPointer();
    }

    // Home Button Handling (Short-press = Pause Overlay, Long-press > 500ms = Recenter)
    if (pressedNow & BUTTON_MASKS.HOME) {
      this.homePressStart = Date.now();
    }
    if (releasedNow & BUTTON_MASKS.HOME) {
      const holdDuration = Date.now() - this.homePressStart;
      if (holdDuration >= 450) {
        this.recenterPointer();
      } else {
        this.callbacks.togglePause();
      }
    }

    // D-Pad Navigation
    if (pressedNow & BUTTON_MASKS.DPAD_UP) this.handleDpad(-4);
    if (pressedNow & BUTTON_MASKS.DPAD_DOWN) this.handleDpad(4);
    if (pressedNow & BUTTON_MASKS.DPAD_LEFT) this.handleDpad(-1);
    if (pressedNow & BUTTON_MASKS.DPAD_RIGHT) this.handleDpad(1);

    this.prevBitmask = bitmask;
  }

  private handleDpad(delta: number): void {
    const activeOverlay = document.querySelector('.modal-overlay.open, .game-modal-overlay.open, #results-modal.open, #switch-game-overlay.open');
    if (activeOverlay) {
      const buttons = Array.from(activeOverlay.querySelectorAll('button:not([disabled]), .pill-btn:not([disabled]), a:not([disabled])')) as HTMLElement[];
      if (buttons.length > 0) {
        let idx = buttons.findIndex((b) => b === this.hoveredElement || b.classList.contains('is-hovered') || document.activeElement === b);
        const step = delta > 0 ? 1 : -1;
        idx = idx === -1 ? 0 : (idx + step + buttons.length) % buttons.length;

        const targetBtn = buttons[idx];
        if (targetBtn) {
          if (this.hoveredElement) this.hoveredElement.classList.remove('is-hovered');
          this.hoveredElement = targetBtn;
          targetBtn.classList.add('is-hovered');
          targetBtn.focus();
          audioManager.playHoverTick();

          const stageRect = this.stageEl.getBoundingClientRect();
          const btnRect = targetBtn.getBoundingClientRect();
          const tx = Math.max(0, Math.min(1920, ((btnRect.left + btnRect.width / 2 - stageRect.left) / stageRect.width) * 1920));
          const ty = Math.max(0, Math.min(1080, ((btnRect.top + btnRect.height / 2 - stageRect.top) / stageRect.height) * 1080));
          this.pipeline.setMousePosition(tx, ty);
          this.updatePointerVisuals(tx, ty);
        }
        return;
      }
    }

    if (!this.isGameActive) {
      this.navigateGrid(delta);
    }
  }

  private triggerBackAction(): void {
    const gameModal = document.querySelector('.game-modal-overlay.open, #results-modal.open');
    if (gameModal) {
      const menuBtn = gameModal.querySelector('#btn-game-modal-menu, #btn-back-menu, .game-btn-menu') as HTMLElement | null;
      if (menuBtn) { menuBtn.click(); return; }
    }

    const overlays: [string, () => void][] = [
      ['calibration-overlay', () => this.callbacks.closeCalibration()],
      ['settings-overlay', () => this.callbacks.closeSettings()],
      ['pairing-overlay', () => this.callbacks.closePairing()],
      ['launch-dialog-overlay', () => this.callbacks.closeLaunchDialog()],
      ['pause-overlay', () => this.callbacks.closePause()]
    ];

    for (const [id, close] of overlays) {
      if (document.getElementById(id)?.classList.contains('open')) { close(); return; }
    }
  }

  private recenterPointer(): void {
    const pos = this.pipeline.recenter();
    this.updatePointerVisuals(pos.x, pos.y);
  }

  private navigateGrid(delta: number): void {
    const tiles = Array.from(this.stageEl.querySelectorAll('.channel-tile')) as HTMLElement[];
    if (tiles.length === 0) return;

    this.activeChannelIndex = Math.max(0, Math.min(tiles.length - 1, this.activeChannelIndex + delta));
    const targetTile = tiles[this.activeChannelIndex];
    if (targetTile) {
      const stageRect = this.stageEl.getBoundingClientRect();
      const tileRect = targetTile.getBoundingClientRect();
      const tx = Math.max(0, Math.min(1920, ((tileRect.left + tileRect.width / 2 - stageRect.left) / stageRect.width) * 1920));
      const ty = Math.max(0, Math.min(1080, ((tileRect.top + tileRect.height / 2 - stageRect.top) / stageRect.height) * 1080));
      this.pipeline.setMousePosition(tx, ty);
      this.updatePointerVisuals(tx, ty);
    }
  }

  private bindSettingsUI(): void {
    SettingsUiBinder.bind(this.settingsManager, this.pipeline, {
      recenterPointer: () => this.recenterPointer(),
      openCalibration: () => { this.callbacks.closeSettings(); this.callbacks.openCalibration(); },
      closeSettings: () => this.callbacks.closeSettings()
    });
  }

  public startCalibrationRoutine(): void { this.calibrationUi.startRoutine(); }
  public stopCalibrationRoutine(): void { this.calibrationUi.stopRoutine(); }

  private bindMouseFallback(): void {
    window.addEventListener('mousemove', (e: MouseEvent) => {
      const stageRect = this.stageEl.getBoundingClientRect();
      const x = Math.max(0, Math.min(1920, ((e.clientX - stageRect.left) / stageRect.width) * 1920));
      const y = Math.max(0, Math.min(1080, ((e.clientY - stageRect.top) / stageRect.height) * 1080));
      this.pipeline.setMousePosition(x, y);
      this.updatePointerVisuals(x, y);
    });

    window.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button === 0) { this.isMouseDown = true; this.pointerEl.classList.add('active-click'); }
    });

    window.addEventListener('mouseup', (e: MouseEvent) => {
      if (e.button === 0) { this.isMouseDown = false; this.pointerEl.classList.remove('active-click'); }
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Space') this.recenterPointer();
      else if (e.code === 'Escape' || e.code === 'KeyH') this.callbacks.togglePause();
    });
  }
}

