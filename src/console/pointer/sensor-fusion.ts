/**
 * NimbusPlay — Sensor Fusion & Complementary Filter
 * Fuses gyroscope angular velocity with accelerometer gravity vector
 * to eliminate long-term pitch and roll drift, providing drift-free aim.
 * Strictly typed with zero `any`. Target < 200 lines.
 */

export interface FusedOrientation {
  pitch: number;    // degrees (-90 to +90)
  roll: number;     // degrees (-180 to +180)
  yawRate: number;  // earth-stabilized horizontal angular velocity (deg/s)
  pitchRate: number;// earth-stabilized vertical angular velocity (deg/s)
}

export class SensorFusion {
  private fusedPitch = 0; // degrees
  private fusedRoll = 0;  // degrees
  private isInitialized = false;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.fusedPitch = 0;
    this.fusedRoll = 0;
    this.isInitialized = false;
  }

  /**
   * Updates complementary filter with current gyro and accel samples.
   * 
   * @param gyro Rotation rates in deg/s { alpha: yaw/z, beta: pitch/x, gamma: roll/y }
   * @param accel Acceleration with gravity { x, y, z } in m/s^2
   * @param dt Elapsed seconds since last sample
   */
  public update(
    gyro: { alpha: number; beta: number; gamma: number },
    accel: { x: number; y: number; z: number },
    dt: number
  ): FusedOrientation {
    const ax = accel.x;
    const ay = accel.y;
    const az = accel.z;

    const wx = gyro.beta;   // rotX (pitch rate)
    const wy = gyro.gamma;  // rotY (roll rate)
    const wz = gyro.alpha;  // rotZ (yaw rate)

    // Compute accelerometer tilt angles
    const accelNorm = Math.sqrt(ax * ax + ay * ay + az * az);
    let accelPitch = 0;
    let accelRoll = 0;

    if (accelNorm > 1.0) {
      // Pitch angle: inclination forward/back
      accelPitch = Math.atan2(ay, Math.sqrt(ax * ax + az * az)) * (180 / Math.PI);
      // Roll angle: inclination left/right
      accelRoll = Math.atan2(ax, az) * (180 / Math.PI);
    }

    if (!this.isInitialized) {
      this.fusedPitch = accelPitch;
      this.fusedRoll = accelRoll;
      this.isInitialized = true;
    } else {
      // Integrate gyro rates
      const predictedPitch = this.fusedPitch + wx * dt;
      const predictedRoll = this.fusedRoll + wy * dt;

      // Adaptive complementary blend:
      // When stationary (low gyro magnitude), blend accelerometer faster to cancel drift
      const gyroMagnitude = Math.sqrt(wx * wx + wy * wy + wz * wz);
      const isResting = gyroMagnitude < 1.2 && Math.abs(accelNorm - 9.8) < 1.5;
      const alpha = isResting ? 0.90 : 0.98;

      this.fusedPitch = alpha * predictedPitch + (1 - alpha) * accelPitch;
      this.fusedRoll = alpha * predictedRoll + (1 - alpha) * accelRoll;
    }

    // Convert fused pitch and roll into earth gravity unit vector in device frame
    const pitchRad = this.fusedPitch * (Math.PI / 180);
    const rollRad = this.fusedRoll * (Math.PI / 180);

    const gx = Math.sin(rollRad);
    const gy = Math.sin(pitchRad);
    const gz = Math.sqrt(Math.max(0, 1 - gx * gx - gy * gy));

    // 1. Earth-referenced Yaw Rate (projection of gyro rates onto gravity vector)
    const rawYawRate = -(wx * gx + wy * gy + wz * gz);

    // 2. Earth-referenced Pitch Rate (perpendicular to gravity)
    let hx = -gz;
    let hz = gx;
    const hNorm = Math.sqrt(hx * hx + hz * hz);
    let rawPitchRate = 0;
    if (hNorm > 0.05) {
      hx /= hNorm;
      hz /= hNorm;
      rawPitchRate = -(wx * hx + wz * hz);
    } else {
      rawPitchRate = -wx;
    }

    return {
      pitch: this.fusedPitch,
      roll: this.fusedRoll,
      yawRate: Math.abs(rawYawRate) < 1e-9 ? 0 : rawYawRate,
      pitchRate: Math.abs(rawPitchRate) < 1e-9 ? 0 : rawPitchRate
    };
  }

  public getOrientation(): { pitch: number; roll: number } {
    return { pitch: this.fusedPitch, roll: this.fusedRoll };
  }
}

