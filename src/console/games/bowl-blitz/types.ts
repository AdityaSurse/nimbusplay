/**
 * NimbusPlay — Bowl Blitz Type Definitions
 * Strictly typed with zero `any`.
 */

export interface PinState {
  id: number;
  x: number;
  y: number;
  initX: number;
  initY: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  knocked: boolean;
  fallAlpha: number;
}

export interface ThrowParameters {
  speed: number;       // Forward pixels/sec (e.g. 700 - 1300)
  aimAngle: number;    // Initial lateral velocity fraction (-1.0 to 1.0)
  hookSpin: number;    // Lateral curve acceleration from wrist twist (-1.0 to 1.0)
  startX: number;      // Foul line release X (540 to 1380)
}

export interface FrameScore {
  frameNum: number;    // 1 to 10
  roll1: number | null;
  roll2: number | null;
  roll3?: number | null; // Frame 10 only
  score: number | null;  // Cumulative running total
  isStrike: boolean;
  isSpare: boolean;
}

export interface ReplayFrame {
  ballX: number;
  ballY: number;
  ballRadius: number;
  pins: Array<{
    id: number;
    x: number;
    y: number;
    rot: number;
    knocked: boolean;
  }>;
}

export type ThrowStage = 'ready' | 'swinging' | 'rolling' | 'pinfall' | 'frame_complete';

