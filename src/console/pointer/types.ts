/**
 * NimbusPlay — Pointer Pipeline Type Definitions
 * Strictly typed with zero `any`.
 */

export interface PointerSettings {
  sensitivity: number;        // Multiplier: 0.5 to 3.0 (default: 1.2)
  minCutoff: number;          // One Euro min cutoff in Hz: 0.5 to 3.0 (default: 1.2)
  beta: number;               // One Euro beta speed coefficient: 0.001 to 0.02 (default: 0.008)
  dCutoff: number;            // One Euro derivative cutoff in Hz (default: 1.0)
  deadZone: number;           // Angular deadzone threshold in deg/s (default: 0.6)
  edgeSoftMargin: number;     // Soft stop margin in pixels (default: 24)
  aimAssist: boolean;         // Lead-the-target predictive aim assist (default: true)
  bowlingPowerMeter: boolean; // Bowl Blitz fallback mode: pointer-aim + power meter (default: false)
}

export interface GyroBiasCalibration {
  biasYaw: number;            // deg/s
  biasPitch: number;          // deg/s
  calibratedAt: number;       // timestamp
}

export interface PointerPosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isRecentered: boolean;
}

export interface ViewportBounds {
  width: number;
  height: number;
}

export interface MotionSample {
  rotationRate: {
    alpha: number; // yaw
    beta: number;  // pitch
    gamma: number; // roll
  };
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
}

