/**
 * NimbusPlay — Sensor-to-Pointer Processing Pipeline
 * Ingests gyro and accel telemetry, applies dead zone, integration,
 * One Euro filter smoothing, edge soft-stop, and recentering.
 * Strictly typed with zero `any`.
 */

import { OneEuroFilter2D } from './one-euro-filter.js';
import { SensorFusion } from './sensor-fusion.js';
import type { 
  PointerSettings, 
  GyroBiasCalibration, 
  PointerPosition, 
  ViewportBounds, 
  MotionSample 
} from './types.js';

export const DEFAULT_POINTER_SETTINGS: PointerSettings = {
  sensitivity: 1.5,
  minCutoff: 1.2,
  beta: 0.008,
  dCutoff: 1.0,
  deadZone: 0.5,
  edgeSoftMargin: 0
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
  private sensorFusion = new SensorFusion();
  private lastTimestampMs = 0;
  private isRecentered = false;
  private currentVx = 0;
  private currentVy = 0;

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
    this.sensorFusion.reset();
    this.currentVx = 0;
    this.currentVy = 0;
    this.isRecentered = true;

    return {
      x: this.filteredX,
      y: this.filteredY,
      vx: 0,
      vy: 0,
      isRecentered: true,
      rawX: this.rawX,
      rawY: this.rawY
    };
  }

  public predict(targetTimestampMs: number): PointerPosition {
    if (this.lastTimestampMs > 0 && targetTimestampMs > this.lastTimestampMs) {
      const dtPred = Math.min((targetTimestampMs - this.lastTimestampMs) / 1000, 0.05);
      const decay = Math.pow(0.92, dtPred / 0.016);
      const predX = Math.max(0, Math.min(this.viewport.width, this.filteredX + this.currentVx * dtPred * decay));
      const predY = Math.max(0, Math.min(this.viewport.height, this.filteredY + this.currentVy * dtPred * decay));

      return {
        x: predX,
        y: predY,
        vx: this.currentVx * decay,
        vy: this.currentVy * decay,
        isRecentered: false,
        rawX: this.rawX,
        rawY: this.rawY
      };
    }
    return this.getPosition();
  }

  public processMotionSample(sample: MotionSample, timestampMs: number): PointerPosition {
    let dt = 0.0166;
    if (this.lastTimestampMs > 0 && timestampMs > this.lastTimestampMs) {
      dt = Math.min((timestampMs - this.lastTimestampMs) / 1000, 0.1);
    }
    this.lastTimestampMs = timestampMs;

    // 1. Gravity-stabilized sensor fusion with complementary filter
    const fused = this.sensorFusion.update(sample.rotationRate, sample.acceleration, dt);

    // 2. Subtract calibrated gyro bias drift
    const unscaledYaw = fused.yawRate - this.calibration.biasYaw;
    const unscaledPitch = fused.pitchRate - this.calibration.biasPitch;

    // 3. Radial continuous deadzone
    const magnitude = Math.sqrt(unscaledYaw * unscaledYaw + unscaledPitch * unscaledPitch);
    let effYaw = 0;
    let effPitch = 0;

    if (magnitude > this.settings.deadZone) {
      const scale = (magnitude - this.settings.deadZone) / magnitude;
      effYaw = unscaledYaw * scale;
      effPitch = unscaledPitch * scale;
    }

    // 4. Sensitivity scaler (42 deg sweeps full width at 1.0 sensitivity)
    const pxPerDeg = (this.viewport.width / 42.0) * this.settings.sensitivity;
    const dx = effYaw * dt * pxPerDeg;
    const dy = -effPitch * dt * pxPerDeg; // Invert: pitch up moves cursor up (-Y)

    // 5. Hard boundary clamp (no edge insets or soft damping)
    this.rawX = Math.max(0, Math.min(this.viewport.width, this.rawX + dx));
    this.rawY = Math.max(0, Math.min(this.viewport.height, this.rawY + dy));

    // 6. Adaptive One Euro low-pass filtering with exact boundary snapping
    const prevFilteredX = this.filteredX;
    const prevFilteredY = this.filteredY;

    const filtered = this.filter.filter(this.rawX, this.rawY, dt);
    let fx = filtered.x;
    let fy = filtered.y;

    if (this.rawX <= 0 || fx < 0.001) fx = 0;
    else if (this.rawX >= this.viewport.width || fx > this.viewport.width - 0.001) fx = this.viewport.width;

    if (this.rawY <= 0 || fy < 0.001) fy = 0;
    else if (this.rawY >= this.viewport.height || fy > this.viewport.height - 0.001) fy = this.viewport.height;

    this.filteredX = Math.max(0, Math.min(this.viewport.width, fx));
    this.filteredY = Math.max(0, Math.min(this.viewport.height, fy));

    this.currentVx = (this.filteredX - prevFilteredX) / dt;
    this.currentVy = (this.filteredY - prevFilteredY) / dt;

    const wasRecentered = this.isRecentered;
    this.isRecentered = false;

    return {
      x: this.filteredX,
      y: this.filteredY,
      vx: this.currentVx,
      vy: this.currentVy,
      isRecentered: wasRecentered,
      rawX: this.rawX,
      rawY: this.rawY
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
      isRecentered: false,
      rawX: this.rawX,
      rawY: this.rawY
    };
  }

  public getPosition(): PointerPosition {
    return {
      x: this.filteredX,
      y: this.filteredY,
      vx: 0,
      vy: 0,
      isRecentered: this.isRecentered,
      rawX: this.rawX,
      rawY: this.rawY
    };
  }
}

