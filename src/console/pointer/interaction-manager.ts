/**
 * NimbusPlay — Console Interaction & Pointer Orchestrator
 * Maps phone pointer pipeline to UI cursor, hover states, clicks (A),
 * back actions (B), D-pad navigation, calibration, and mouse fallback.
 * Strictly typed with zero `any`.
 */

import { PointerPipeline } from './pipeline.js';
import { CalibrationManager } from './calibration.js';
import { SettingsManager } from './settings-manager.js';
import { BUTTON_MASKS, type CompactMotionPacket, type MotionInputFrame } from '../../shared/protocol.js';

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
  private settingsManager: SettingsManager;
  private callbacks: ConsoleInteractionCallbacks;

  // Active interaction state
  private hoveredElement: HTMLElement | null = null;
  private prevBitmask = 0;
  private homePressStart = 0;
  private activeChannelIndex = 0;
  private isCalibrating = false;

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

    const stageWidth = this.stageEl.clientWidth || 1920;
    const stageHeight = this.stageEl.clientHeight || 1080;

    this.pipeline = new PointerPipeline(
      { width: stageWidth, height: stageHeight },
      initialSettings
    );

    // Load saved calibration if present
    const savedCalib = CalibrationManager.loadPersistedCalibration();
    if (savedCalib) {
      this.pipeline.setCalibration(savedCalib);
    }

    this.calibration = new CalibrationManager();

    this.bindSettingsUI();
    this.bindCalibrationUI();
    this.bindMouseFallback();
  }

  public updateViewport(width: number, height: number): void {
    this.pipeline.setViewport({ width, height });
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
      bitmask = c.b;
      sample = {
        rotationRate: { alpha: c.r[0], beta: c.r[1], gamma: c.r[2] },
        acceleration: { x: c.a[0], y: c.a[1], z: c.a[2] }
      };
    } else if ('buttons' in packet) {
      const f = packet as MotionInputFrame;
      sample = {
        rotationRate: { ...f.rotationRate },
        acceleration: { ...f.acceleration }
      };
      if (f.buttons.a) bitmask |= BUTTON_MASKS.A;
      if (f.buttons.b) bitmask |= BUTTON_MASKS.B;
      if (f.buttons.dpadUp) bitmask |= BUTTON_MASKS.DPAD_UP;
      if (f.buttons.dpadDown) bitmask |= BUTTON_MASKS.DPAD_DOWN;
      if (f.buttons.dpadLeft) bitmask |= BUTTON_MASKS.DPAD_LEFT;
      if (f.buttons.dpadRight) bitmask |= BUTTON_MASKS.DPAD_RIGHT;
      if (f.buttons.home) bitmask |= BUTTON_MASKS.HOME;
      if (f.buttons.recenter) bitmask |= BUTTON_MASKS.RECENTER;
    }

    // 1. If currently on Calibration screen, pass sample to calibrator
    if (this.isCalibrating) {
      this.calibration.ingestSample(sample);
    }

    // 2. Process motion sample through pipeline
    const pos = this.pipeline.processMotionSample(sample, performance.now());
    this.updatePointerVisuals(pos.x, pos.y);

    // 3. Handle Controller Buttons
    this.handleButtons(bitmask);
  }

  public updatePointerVisuals(stageX: number, stageY: number): void {
    this.pointerEl.style.transform = `translate3d(${stageX}px, ${stageY}px, 0) rotate(-12deg)`;
    this.pointerEl.style.setProperty('--ptr-x', `${stageX}px`);
    this.pointerEl.style.setProperty('--ptr-y', `${stageY}px`);

    // Element hit testing
    const stageRect = this.stageEl.getBoundingClientRect();
    const screenX = stageRect.left + (stageX / (this.stageEl.clientWidth || 1920)) * stageRect.width;
    const screenY = stageRect.top + (stageY / (this.stageEl.clientHeight || 1080)) * stageRect.height;

    const hit = document.elementFromPoint(screenX, screenY);
    const interactive = hit?.closest('.channel-tile, .pill-btn, .bumper-btn, .system-disk-btn, button, a') as HTMLElement | null;

    if (interactive !== this.hoveredElement) {
      if (this.hoveredElement) {
        this.hoveredElement.classList.remove('is-hovered');
      }
      this.hoveredElement = interactive;
      if (this.hoveredElement) {
        this.hoveredElement.classList.add('is-hovered');
      }
    }
  }

  private handleButtons(bitmask: number): void {
    const pressedNow = bitmask & ~this.prevBitmask;
    const releasedNow = ~bitmask & this.prevBitmask;

    // A Button (Primary Select / Click)
    if (pressedNow & BUTTON_MASKS.A) {
      this.pointerEl.classList.add('active-click');
      if (this.hoveredElement) {
        this.hoveredElement.click();
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
    if (pressedNow & BUTTON_MASKS.DPAD_UP) this.navigateGrid(-4);
    if (pressedNow & BUTTON_MASKS.DPAD_DOWN) this.navigateGrid(4);
    if (pressedNow & BUTTON_MASKS.DPAD_LEFT) this.navigateGrid(-1);
    if (pressedNow & BUTTON_MASKS.DPAD_RIGHT) this.navigateGrid(1);

    this.prevBitmask = bitmask;
  }

  private triggerBackAction(): void {
    const overlays = [
      { id: 'calibration-overlay', close: () => this.callbacks.closeCalibration() },
      { id: 'settings-overlay', close: () => this.callbacks.closeSettings() },
      { id: 'pairing-overlay', close: () => this.callbacks.closePairing() },
      { id: 'launch-dialog-overlay', close: () => this.callbacks.closeLaunchDialog() },
      { id: 'pause-overlay', close: () => this.callbacks.closePause() }
    ];

    for (const ov of overlays) {
      const el = document.getElementById(ov.id);
      if (el && el.classList.contains('open')) {
        ov.close();
        return;
      }
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
      const targetStageX = ((tileRect.left + tileRect.width / 2 - stageRect.left) / stageRect.width) * (this.stageEl.clientWidth || 1920);
      const targetStageY = ((tileRect.top + tileRect.height / 2 - stageRect.top) / stageRect.height) * (this.stageEl.clientHeight || 1080);

      this.pipeline.setMousePosition(targetStageX, targetStageY);
      this.updatePointerVisuals(targetStageX, targetStageY);
    }
  }

  private bindSettingsUI(): void {
    const sliderSens = document.getElementById('setting-sensitivity') as HTMLInputElement;
    const sliderSmooth = document.getElementById('setting-smoothing') as HTMLInputElement;
    const sliderDead = document.getElementById('setting-deadzone') as HTMLInputElement;
    const labelSens = document.getElementById('label-val-sensitivity');
    const labelSmooth = document.getElementById('label-val-smoothing');
    const labelDead = document.getElementById('label-val-deadzone');
    const btnReset = document.getElementById('btn-settings-reset');
    const btnRecenter = document.getElementById('btn-settings-recenter');
    const btnCalib = document.getElementById('btn-settings-calibrate');
    const btnClose = document.getElementById('btn-settings-close');

    const cur = this.settingsManager.getSettings();
    if (sliderSens) sliderSens.value = cur.sensitivity.toString();
    if (sliderSmooth) sliderSmooth.value = cur.minCutoff.toString();
    if (sliderDead) sliderDead.value = cur.deadZone.toString();

    sliderSens?.addEventListener('input', () => {
      const val = parseFloat(sliderSens.value);
      if (labelSens) labelSens.textContent = `${val.toFixed(1)}x`;
      this.settingsManager.update({ sensitivity: val });
      this.pipeline.updateSettings({ sensitivity: val });
    });

    sliderSmooth?.addEventListener('input', () => {
      const val = parseFloat(sliderSmooth.value);
      if (labelSmooth) labelSmooth.textContent = `${val.toFixed(1)} Hz`;
      this.settingsManager.update({ minCutoff: val });
      this.pipeline.updateSettings({ minCutoff: val });
    });

    sliderDead?.addEventListener('input', () => {
      const val = parseFloat(sliderDead.value);
      if (labelDead) labelDead.textContent = `${val.toFixed(1)} deg/s`;
      this.settingsManager.update({ deadZone: val });
      this.pipeline.updateSettings({ deadZone: val });
    });

    btnReset?.addEventListener('click', () => {
      const def = this.settingsManager.resetToDefaults();
      if (sliderSens) sliderSens.value = def.sensitivity.toString();
      if (sliderSmooth) sliderSmooth.value = def.minCutoff.toString();
      if (sliderDead) sliderDead.value = def.deadZone.toString();
      if (labelSens) labelSens.textContent = `${def.sensitivity.toFixed(1)}x`;
      if (labelSmooth) labelSmooth.textContent = `${def.minCutoff.toFixed(1)} Hz`;
      if (labelDead) labelDead.textContent = `${def.deadZone.toFixed(1)} deg/s`;
      this.pipeline.updateSettings(def);
    });

    btnRecenter?.addEventListener('click', () => this.recenterPointer());
    btnCalib?.addEventListener('click', () => {
      this.callbacks.closeSettings();
      this.callbacks.openCalibration();
    });
    btnClose?.addEventListener('click', () => this.callbacks.closeSettings());
  }

  public startCalibrationRoutine(): void {
    this.isCalibrating = true;
    const progressCircle = document.getElementById('calib-progress-circle');
    const statusText = document.getElementById('calib-status-text');
    const driftText = document.getElementById('calib-drift-text');
    const btnConfirm = document.getElementById('btn-calib-confirm');

    if (btnConfirm) btnConfirm.style.display = 'none';

    this.calibration.start(
      (progress, isSteady) => {
        if (progressCircle) {
          const circumference = 527;
          const offset = circumference * (1.0 - progress);
          progressCircle.style.strokeDashoffset = offset.toString();
          progressCircle.style.stroke = isSteady ? '#3cb4e7' : '#f59e0b';
        }

        if (statusText) {
          if (!isSteady) {
            statusText.innerHTML = 'Status: <strong style="color: #f59e0b;">Hold Steady! Movement detected...</strong>';
          } else {
            const pct = Math.round(progress * 100);
            statusText.innerHTML = `Status: <strong style="color: #006688;">Measuring Gyro Bias (${pct}%)...</strong>`;
          }
        }
      },
      (calibration) => {
        this.isCalibrating = false;
        this.pipeline.setCalibration(calibration);
        this.recenterPointer();

        if (progressCircle) progressCircle.style.stroke = '#22c55e';
        if (statusText) statusText.innerHTML = 'Status: <strong style="color: #22c55e;">Calibration Complete!</strong>';
        if (driftText) driftText.innerHTML = `Resting Drift: <strong style="color: #22c55e;">Bias: ${calibration.biasYaw.toFixed(2)}°/s</strong>`;
        if (btnConfirm) btnConfirm.style.display = 'inline-flex';
      }
    );
  }

  public stopCalibrationRoutine(): void {
    this.isCalibrating = false;
    this.calibration.stop();
  }

  private bindCalibrationUI(): void {
    const btnConfirm = document.getElementById('btn-calib-confirm');
    const btnBack = document.getElementById('btn-calib-back');

    btnConfirm?.addEventListener('click', () => {
      this.recenterPointer();
      this.callbacks.closeCalibration();
    });

    btnBack?.addEventListener('click', () => {
      this.stopCalibrationRoutine();
      this.callbacks.closeCalibration();
    });
  }

  private bindMouseFallback(): void {
    window.addEventListener('mousemove', (e: MouseEvent) => {
      const stageRect = this.stageEl.getBoundingClientRect();
      const x = ((e.clientX - stageRect.left) / stageRect.width) * (this.stageEl.clientWidth || 1920);
      const y = ((e.clientY - stageRect.top) / stageRect.height) * (this.stageEl.clientHeight || 1080);

      this.pipeline.setMousePosition(x, y);
      this.updatePointerVisuals(x, y);
    });

    window.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button === 0) {
        this.pointerEl.classList.add('active-click');
      }
    });

    window.addEventListener('mouseup', (e: MouseEvent) => {
      if (e.button === 0) {
        this.pointerEl.classList.remove('active-click');
      }
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        this.recenterPointer();
      }
    });
  }
}

