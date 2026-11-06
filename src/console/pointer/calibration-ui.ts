/**
 * NimbusPlay — Console Pointer Calibration UI Manager
 * Manages gyro calibration progress animations, status text, and bias saving.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import type { CalibrationManager } from './calibration.js';
import type { PointerPipeline } from './pipeline.js';

export interface CalibrationUiCallbacks {
  recenterPointer: () => void;
  closeCalibration: () => void;
}

export class CalibrationUiManager {
  private calibration: CalibrationManager;
  private pipeline: PointerPipeline;
  private callbacks: CalibrationUiCallbacks;
  private isCalibrating = false;

  constructor(
    calibration: CalibrationManager,
    pipeline: PointerPipeline,
    callbacks: CalibrationUiCallbacks
  ) {
    this.calibration = calibration;
    this.pipeline = pipeline;
    this.callbacks = callbacks;
    this.bindEvents();
  }

  public getIsCalibrating(): boolean {
    return this.isCalibrating;
  }

  public startRoutine(): void {
    this.isCalibrating = true;
    const progressCircle = document.getElementById('calib-progress-circle');
    const statusText = document.getElementById('calib-status-text');
    const driftText = document.getElementById('calib-drift-text');
    const btnConfirm = document.getElementById('btn-calib-confirm');

    if (btnConfirm) btnConfirm.style.display = 'none';

    this.calibration.start(
      (progress, isSteady) => {
        if (progressCircle) {
          const offset = 527 * (1.0 - progress);
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
        this.callbacks.recenterPointer();

        if (progressCircle) progressCircle.style.stroke = '#22c55e';
        if (statusText) statusText.innerHTML = 'Status: <strong style="color: #22c55e;">Calibration Complete!</strong>';
        if (driftText) driftText.innerHTML = `Resting Drift: <strong style="color: #22c55e;">Bias: ${calibration.biasYaw.toFixed(2)}°/s</strong>`;
        if (btnConfirm) btnConfirm.style.display = 'inline-flex';
      }
    );
  }

  public stopRoutine(): void {
    this.isCalibrating = false;
    this.calibration.stop();
  }

  private bindEvents(): void {
    const btnConfirm = document.getElementById('btn-calib-confirm');
    const btnBack = document.getElementById('btn-calib-back');

    btnConfirm?.addEventListener('click', () => {
      this.callbacks.recenterPointer();
      this.callbacks.closeCalibration();
    });

    btnBack?.addEventListener('click', () => {
      this.stopRoutine();
      this.callbacks.closeCalibration();
    });
  }
}

