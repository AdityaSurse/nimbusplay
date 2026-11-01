/**
 * NimbusPlay — Gyroscope Bias Calibration Routine
 * Collects 60 samples over 1000ms while user holds wand stationary
 * to calculate resting zero-rate bias drift and store in localStorage.
 */

import { AimMapper } from './aim-mapper.js';
import type { GyroBiasCalibration, MotionSample } from './types.js';

const CALIBRATION_STORAGE_KEY = 'nimbusplay_gyro_calibration';
const TARGET_SAMPLES = 60;
const MAX_STABILITY_VARIANCE = 4.0; // deg^2/s^2

export type CalibrationProgressCallback = (progress0to1: number, isSteady: boolean) => void;
export type CalibrationCompleteCallback = (calibration: GyroBiasCalibration) => void;

export class CalibrationManager {
  private isCalibrating = false;
  private samples: Array<{ yaw: number; pitch: number }> = [];
  private onProgress: CalibrationProgressCallback | null = null;
  private onComplete: CalibrationCompleteCallback | null = null;

  constructor(
    onProgress?: CalibrationProgressCallback,
    onComplete?: CalibrationCompleteCallback
  ) {
    if (onProgress) this.onProgress = onProgress;
    if (onComplete) this.onComplete = onComplete;
  }

  public static loadPersistedCalibration(): GyroBiasCalibration | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(CALIBRATION_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as GyroBiasCalibration;
      }
    } catch (err) {
      console.warn('[Calibration] Failed to read calibration from storage:', err);
    }
    return null;
  }

  public static savePersistedCalibration(calib: GyroBiasCalibration): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(calib));
    } catch (err) {
      console.warn('[Calibration] Failed to persist calibration:', err);
    }
  }

  public start(
    onProgress: CalibrationProgressCallback,
    onComplete: CalibrationCompleteCallback
  ): void {
    this.isCalibrating = true;
    this.samples = [];
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onProgress(0, true);
  }

  public stop(): void {
    this.isCalibrating = false;
    this.samples = [];
  }

  public isRunning(): boolean {
    return this.isCalibrating;
  }

  public ingestSample(sample: MotionSample): boolean {
    if (!this.isCalibrating) return false;

    const aim = AimMapper.mapToAim(sample.rotationRate, sample.acceleration);
    this.samples.push({ yaw: aim.yawRate, pitch: aim.pitchRate });

    // Measure stability over sliding window
    const recent = this.samples.slice(-15);
    const meanYaw = recent.reduce((sum, s) => sum + s.yaw, 0) / recent.length;
    const meanPitch = recent.reduce((sum, s) => sum + s.pitch, 0) / recent.length;
    
    let variance = 0;
    for (const s of recent) {
      const dy = s.yaw - meanYaw;
      const dp = s.pitch - meanPitch;
      variance += dy * dy + dp * dp;
    }
    variance /= recent.length;

    const isSteady = variance < MAX_STABILITY_VARIANCE;

    // If severe movement detected, restart window
    if (!isSteady && this.samples.length > 10) {
      this.samples = [];
      this.onProgress?.(0, false);
      return false;
    }

    const progress = Math.min(1.0, this.samples.length / TARGET_SAMPLES);
    this.onProgress?.(progress, true);

    if (this.samples.length >= TARGET_SAMPLES) {
      this.finalize();
      return true;
    }

    return false;
  }

  private finalize(): void {
    this.isCalibrating = false;

    const totalYaw = this.samples.reduce((sum, s) => sum + s.yaw, 0);
    const totalPitch = this.samples.reduce((sum, s) => sum + s.pitch, 0);

    const calibration: GyroBiasCalibration = {
      biasYaw: totalYaw / this.samples.length,
      biasPitch: totalPitch / this.samples.length,
      calibratedAt: Date.now()
    };

    CalibrationManager.savePersistedCalibration(calibration);
    this.onComplete?.(calibration);
  }
}
