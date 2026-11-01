/**
 * NimbusPlay — Gravity-Compensated Aim Mapper
 * Projects 3D device gyro angular rates onto earth-referenced yaw and pitch axes
 * using the real-time gravity vector, ensuring wrist tilt/roll does not distort aim.
 */

export interface AimVelocity {
  yawRate: number;   // Horizontal aiming angular rate (deg/s), positive = right
  pitchRate: number; // Vertical aiming angular rate (deg/s), positive = up
}

export class AimMapper {
  /**
   * Maps 3D gyro rates and accelerometer vectors to gravity-stabilized yaw and pitch rates.
   * 
   * @param gyro - rotationRate in deg/s { alpha (yaw/z), beta (pitch/x), gamma (roll/y) }
   * @param accel - acceleration in m/s^2 { x, y, z }
   */
  public static mapToAim(
    gyro: { alpha: number; beta: number; gamma: number },
    accel: { x: number; y: number; z: number }
  ): AimVelocity {
    const gx = accel.x;
    const gy = accel.y;
    const gz = accel.z;

    // Norm of gravity vector
    const gNorm = Math.sqrt(gx * gx + gy * gy + gz * gz);

    // Fallback if accelerometer is near zero or uncalibrated (assume flat phone)
    let gHatX = 0;
    let gHatY = 0;
    let gHatZ = 1;

    if (gNorm > 1.0) {
      gHatX = gx / gNorm;
      gHatY = gy / gNorm;
      gHatZ = gz / gNorm;
    }

    // Angular velocity vector in device coordinates:
    // W3C: beta = rotX, gamma = rotY, alpha = rotZ
    const wx = gyro.beta;
    const wy = gyro.gamma;
    const wz = gyro.alpha;

    // 1. Yaw Axis: aligned with Earth gravity vector (downward)
    // Rotation around gravity represents horizontal panning in the room
    const omegaYaw = wx * gHatX + wy * gHatY + wz * gHatZ;

    // 2. Pitch Axis: horizontal axis perpendicular to both gravity and forward pointing axis (phone +Y)
    // h = gHat x (0, 1, 0) = (-gHatZ, 0, gHatX)
    let hx = -gHatZ;
    let hz = gHatX;
    const hNorm = Math.sqrt(hx * hx + hz * hz);

    let omegaPitch = 0;
    if (hNorm > 0.05) {
      hx /= hNorm;
      hz /= hNorm;
      omegaPitch = wx * hx + wz * hz;
    } else {
      // Degenerate case (phone pointing straight up or down): fallback to device X
      omegaPitch = -wx;
    }

    const rawYaw = -omegaYaw;
    const rawPitch = -omegaPitch;

    return {
      // Invert yaw so positive yawRate rotates cursor rightward (normalize -0 to 0)
      yawRate: Math.abs(rawYaw) < 1e-9 ? 0 : rawYaw,
      // Positive pitchRate represents lifting wand nose up
      pitchRate: Math.abs(rawPitch) < 1e-9 ? 0 : rawPitch
    };
  }
}
