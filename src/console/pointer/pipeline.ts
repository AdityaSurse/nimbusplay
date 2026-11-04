/**
 * NimbusPlay — Sensor-to-Pointer Processing Pipeline
 * Ingests gyro and accel telemetry, applies dead zone, integration,
 * One Euro filter smoothing, edge soft-stop, and recentering.
 * Strictly typed with zero `any`.
 */

import { AimMapper } from './aim-mapper.js';
import { OneEuroFilter2D } from './one-euro-filter.js';
import type { 
  PointerSettings, 
  GyroBiasCalibration, 
  PointerPosition, 
  ViewportBounds, 
  MotionSample 
} from './types.js';

export const DEFAULT_POINTER_SETTINGS: PointerSettings = {
  sensitivity: 1.2,
  minCutoff: 1.2,
  beta: 0.008,
  dCutoff: 1.0,
  deadZone: 0.6,
  edgeSoftMargin: 24,
  aimAssist: true,
  bowlingPowerMeter: false
};

export class PointerPipeline {
  private settings: PointerSettings;
  private calibration: GyroBiasCalibration = { biasYaw: 0, biasPitch: 0, calibratedAt: 0 };
  private viewport: ViewportBounds;
  private rawX: number;
  private rawY: number;
  private filteredX: number;
  private filteredY: number;
  private filter: OneEuroFilter2D;
  private lastTimestampMs = 0;
  private isRecentered = false;

  constructor(viewport: ViewportBounds, customSettings?: Partial<PointerSettings>) {
    this.viewport = { ...viewport };
    this.settings = { ...DEFAULT_POINTER_SETTINGS, ...customSettings };

    this.rawX = this.viewport.width / 2;
    this.rawY = this.viewport.height / 2;
    this.filteredX = this.rawX;
    this.filteredY = this.rawY;

    this.filter = new OneEuroFilter2D(
      this.settings.minCutoff,
      this.settings.beta,
      this.settings.dCutoff
    );
    this.filter.reset(this.rawX, this.rawY);
  }

  public setViewport(viewport: ViewportBounds): void {
    const prevW = this.viewport.width || 1;
    const prevH = this.viewport.height || 1;
    this.viewport = { ...viewport };

    // Scale current cursor proportionally
    this.rawX = (this.rawX / prevW) * this.viewport.width;
    this.rawY = (this.rawY / prevH) * this.viewport.height;
    this.recenter();
  }

  public getSettings(): Readonly<PointerSettings> {
    return this.settings;
  }

  public updateSettings(partial: Partial<PointerSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.filter.setParameters(
      this.settings.minCutoff,
      this.settings.beta,
      this.settings.dCutoff
    );
  }

  public setCalibration(calibration: GyroBiasCalibration): void {
    this.calibration = { ...calibration };
  }

  public getCalibration(): Readonly<GyroBiasCalibration> {
    return this.calibration;
  }

  public recenter(): PointerPosition {
    this.rawX = this.viewport.width / 2;
    this.rawY = this.viewport.height / 2;
    this.filteredX = this.rawX;
    this.filteredY = this.rawY;
    this.filter.reset(this.rawX, this.rawY);
    this.isRecentered = true;

    return {
      x: this.filteredX,
      y: this.filteredY,
      vx: 0,
      vy: 0,
      isRecentered: true
    };
  }

  public processMotionSample(sample: MotionSample, timestampMs: number): PointerPosition {
    let dt = 0.0166;
    if (this.lastTimestampMs > 0 && timestampMs > this.lastTimestampMs) {
      dt = Math.min((timestampMs - this.lastTimestampMs) / 1000, 0.1);
    }
    this.lastTimestampMs = timestampMs;

    // 1. Gravity-compensated aim mapping
    const aim = AimMapper.mapToAim(sample.rotationRate, sample.acceleration);

    // 2. Subtract calibrated gyro bias drift
    const unscaledYaw = aim.yawRate - this.calibration.biasYaw;
    const unscaledPitch = aim.pitchRate - this.calibration.biasPitch;

    // 3. Radial continuous deadzone
    const magnitude = Math.sqrt(unscaledYaw * unscaledYaw + unscaledPitch * unscaledPitch);
    let effYaw = 0;
    let effPitch = 0;

    if (magnitude > this.settings.deadZone) {
      const scale = (magnitude - this.settings.deadZone) / magnitude;
      effYaw = unscaledYaw * scale;
      effPitch = unscaledPitch * scale;
    }

    // 4. Sensitivity scaler (60 deg sweeps entire 1920 width at 1.0 sensitivity)
    const pxPerDeg = (this.viewport.width / 50.0) * this.settings.sensitivity;
    let dx = effYaw * dt * pxPerDeg;
    let dy = -effPitch * dt * pxPerDeg; // Invert: pitch up (positive rate) moves cursor up (-Y)

    // 5. Soft-stop edge damping
    const margin = this.settings.edgeSoftMargin;
    if (this.rawX < margin && dx < 0) {
      const ratio = Math.max(0, this.rawX / margin);
      dx *= ratio * ratio;
    } else if (this.rawX > this.viewport.width - margin && dx > 0) {
      const ratio = Math.max(0, (this.viewport.width - this.rawX) / margin);
      dx *= ratio * ratio;
    }

    if (this.rawY < margin && dy < 0) {
      const ratio = Math.max(0, this.rawY / margin);
      dy *= ratio * ratio;
    } else if (this.rawY > this.viewport.height - margin && dy > 0) {
      const ratio = Math.max(0, (this.viewport.height - this.rawY) / margin);
      dy *= ratio * ratio;
    }

    // 6. Integrate to raw position and clamp
    this.rawX = Math.max(0, Math.min(this.viewport.width, this.rawX + dx));
    this.rawY = Math.max(0, Math.min(this.viewport.height, this.rawY + dy));

    // 7. Adaptive One Euro low-pass filtering
    const prevFilteredX = this.filteredX;
    const prevFilteredY = this.filteredY;

    const filtered = this.filter.filter(this.rawX, this.rawY, dt);
    this.filteredX = Math.max(0, Math.min(this.viewport.width, filtered.x));
    this.filteredY = Math.max(0, Math.min(this.viewport.height, filtered.y));

    const wasRecentered = this.isRecentered;
    this.isRecentered = false;

    return {
      x: this.filteredX,
      y: this.filteredY,
      vx: (this.filteredX - prevFilteredX) / dt,
      vy: (this.filteredY - prevFilteredY) / dt,
      isRecentered: wasRecentered
    };
  }

  /**
   * Desktop mouse fallback integration
   */
  public setMousePosition(x: number, y: number): PointerPosition {
    this.rawX = Math.max(0, Math.min(this.viewport.width, x));
    this.rawY = Math.max(0, Math.min(this.viewport.height, y));
    this.filteredX = this.rawX;
    this.filteredY = this.rawY;
    this.filter.reset(this.rawX, this.rawY);

    return {
      x: this.filteredX,
      y: this.filteredY,
      vx: 0,
      vy: 0,
      isRecentered: false
    };
  }

  public getPosition(): PointerPosition {
    return {
      x: this.filteredX,
      y: this.filteredY,
      vx: 0,
      vy: 0,
      isRecentered: this.isRecentered
    };
  }
}

