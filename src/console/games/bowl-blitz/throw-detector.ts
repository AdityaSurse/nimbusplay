/**
 * NimbusPlay — Bowl Blitz Throw Gesture & Power Meter Detector
 * Detects phone accelerometer swings, wrist twist spin, and power-meter fallback.
 * Strictly typed with zero `any`.
 */

import type { GameInputState } from '../common/game-interface.js';
import type { ThrowParameters } from './types.js';
import { BUTTON_MASKS } from '../../../shared/protocol.js';

export class ThrowDetector {
  private armed = false;
  private peakAccel = 0;
  private peakRollRate = 0;
  private peakYawRate = 0;
  private lastAccelY = 0;
  private swingDuration = 0;
  private hadBackswing = false;

  // Power Meter Fallback Mode
  private powerMeterProgress = 0;
  private powerMeterDirection = 1;
  private prevPointerX = 960;

  public isArmedState(): boolean {
    return this.armed;
  }

  public getPowerMeterProgress(): number {
    return this.powerMeterProgress;
  }

  public reset(): void {
    this.armed = false;
    this.peakAccel = 0;
    this.peakRollRate = 0;
    this.peakYawRate = 0;
    this.lastAccelY = 0;
    this.swingDuration = 0;
    this.hadBackswing = false;
    this.powerMeterProgress = 0;
    this.powerMeterDirection = 1;
  }

  public update(
    input: GameInputState,
    dt: number,
    isPowerMeterMode: boolean
  ): ThrowParameters | null {
    const isBHeld = (input.rawBitmask & BUTTON_MASKS.B) !== 0 || input.isSliceHeld;

    // Mode A: Pointer-Aim + Power-Meter Fallback
    if (isPowerMeterMode) {
      if (isBHeld) {
        this.armed = true;
        // Oscillate power meter between 0.15 and 1.0
        this.powerMeterProgress += this.powerMeterDirection * dt * 1.8;
        if (this.powerMeterProgress >= 1.0) {
          this.powerMeterProgress = 1.0;
          this.powerMeterDirection = -1;
        } else if (this.powerMeterProgress <= 0.15) {
          this.powerMeterProgress = 0.15;
          this.powerMeterDirection = 1;
        }
        return null;
      }

      if (this.armed && !isBHeld) {
        // Released B: Throw locked in!
        this.armed = false;
        const power = this.powerMeterProgress;
        this.powerMeterProgress = 0;

        // Hook spin derived from horizontal pointer drift
        const dx = input.pointerX - this.prevPointerX;
        this.prevPointerX = input.pointerX;
        const hookSpin = Math.max(-0.9, Math.min(0.9, dx * 0.08));

        return {
          speed: 700 + power * 580,
          aimAngle: (input.pointerX - 960) / 750,
          hookSpin,
          startX: Math.max(540, Math.min(1380, input.pointerX))
        };
      }

      this.prevPointerX = input.pointerX;
      return null;
    }

    // Mode B: Motion Accelerometer & Gyroscope Gesture Detection
    const accelY = input.accel?.y ?? 0;
    const accelZ = input.accel?.z ?? 9.8;
    const accelX = input.accel?.x ?? 0;
    const rollRate = input.gyro?.gamma ?? 0;  // deg/s roll (wrist twist)
    const yawRate = input.gyro?.alpha ?? 0;    // deg/s yaw (direction)

    // Compute forward dynamic swing acceleration magnitude
    const netAccel = Math.hypot(accelX, accelY, accelZ - 9.8);

    if (isBHeld) {
      if (!this.armed) {
        this.armed = true;
        this.peakAccel = 0;
        this.peakRollRate = 0;
        this.peakYawRate = 0;
        this.swingDuration = 0;
        this.hadBackswing = false;
      }

      this.swingDuration += dt;

      // Detect backswing (negative acceleration or arm pulling back)
      if (accelY < -2.2) {
        this.hadBackswing = true;
      }

      // Track peak forward swing dynamics
      if (netAccel > this.peakAccel) {
        this.peakAccel = netAccel;
      }

      if (Math.abs(rollRate) > Math.abs(this.peakRollRate)) {
        this.peakRollRate = rollRate;
      }

      if (Math.abs(yawRate) > Math.abs(this.peakYawRate)) {
        this.peakYawRate = yawRate;
      }

      this.lastAccelY = accelY;
      return null;
    }

    // Released B: Check for valid throw swing
    if (this.armed && !isBHeld) {
      this.armed = false;

      // Effective peak acceleration (use fallback if phone sensors report near zero)
      const measuredPeak = Math.max(this.peakAccel, Math.abs(this.lastAccelY));
      const hasMotionSwing = measuredPeak >= 5.5;

      const powerFraction = hasMotionSwing
        ? Math.min(1.0, Math.max(0.2, (measuredPeak - 5.5) / 12.0 + (this.hadBackswing ? 0.15 : 0)))
        : 0.65; // Default moderate throw if release without harsh swing

      const speed = 720 + powerFraction * 540;

      // Hook curve: wrist roll rate (e.g. twist left = hook left)
      const hookSpin = Math.max(-0.85, Math.min(0.85, (this.peakRollRate / 180.0)));

      // Aim direction: yaw rate and pointer horizontal offset
      const aimOffset = (input.pointerX - 960) / 800;
      const gyroYawOffset = Math.max(-0.35, Math.min(0.35, this.peakYawRate / 160.0));
      const aimAngle = aimOffset * 0.7 + gyroYawOffset * 0.3;

      this.reset();

      return {
        speed,
        aimAngle,
        hookSpin,
        startX: Math.max(560, Math.min(1360, input.pointerX))
      };
    }

    return null;
  }
}
