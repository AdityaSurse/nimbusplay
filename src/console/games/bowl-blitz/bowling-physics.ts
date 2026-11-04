/**
 * NimbusPlay — Bowl Blitz Pseudo-3D Lane & Pin Collision Physics Engine
 * Calculates perspective ball movement, hook curve, gutters, and multi-pin chain reactions.
 * Strictly typed with zero `any`.
 */

import type { PinState, ThrowParameters } from './types.js';

export class BowlingPhysics {
  public static readonly FOUL_LINE_Y = 980;
  public static readonly PIN_DECK_Y = 260;
  public static readonly LANE_BOTTOM_LEFT = 480;
  public static readonly LANE_BOTTOM_RIGHT = 1440;
  public static readonly LANE_TOP_LEFT = 780;
  public static readonly LANE_TOP_RIGHT = 1140;

  /**
   * Returns lane boundaries at vertical position y
   */
  public static getLaneBoundaries(y: number): { left: number; right: number; width: number } {
    const fraction = Math.max(0, Math.min(1, (this.FOUL_LINE_Y - y) / (this.FOUL_LINE_Y - this.PIN_DECK_Y)));
    const left = this.LANE_BOTTOM_LEFT + (this.LANE_TOP_LEFT - this.LANE_BOTTOM_LEFT) * fraction;
    const right = this.LANE_BOTTOM_RIGHT - (this.LANE_BOTTOM_RIGHT - this.LANE_TOP_RIGHT) * fraction;
    return { left, right, width: right - left };
  }

  /**
   * Perspective scaling factor (1.0 at foul line, 0.42 at pin deck)
   */
  public static getPerspectiveScale(y: number): number {
    const fraction = (y - this.PIN_DECK_Y) / (this.FOUL_LINE_Y - this.PIN_DECK_Y);
    return Math.max(0.38, Math.min(1.0, 0.40 + 0.60 * fraction));
  }

  /**
   * Update ball position, hook spin curve, and gutter status
   */
  public static updateBall(
    ball: { x: number; y: number; vx: number; vy: number; radius: number; isGutter: boolean },
    params: ThrowParameters,
    dt: number
  ): void {
    // Forward progression
    ball.y += ball.vy * dt;

    if (!ball.isGutter) {
      // Lateral drift from aim angle
      ball.x += ball.vx * dt;

      // Hook spin curve kicks in on the second half of the lane (dry boards)
      if (ball.y < 680) {
        const hookCurve = params.hookSpin * 460 * dt;
        ball.vx += hookCurve;
      }

      // Check for gutter drop
      const bounds = this.getLaneBoundaries(ball.y);
      if (ball.x < bounds.left) {
        ball.isGutter = true;
        ball.x = bounds.left - 30; // Lock to gutter channel
        ball.vx = (this.LANE_TOP_LEFT - 30 - ball.x) * 0.4;
      } else if (ball.x > bounds.right) {
        ball.isGutter = true;
        ball.x = bounds.right + 30; // Lock to gutter channel
        ball.vx = (this.LANE_TOP_RIGHT + 30 - ball.x) * 0.4;
      }
    } else {
      // Ball in gutter rolls straight into pit
      const bounds = this.getLaneBoundaries(ball.y);
      if (ball.x < 960) {
        ball.x = bounds.left - 30;
      } else {
        ball.x = bounds.right + 30;
      }
    }

    // Dynamic radius with perspective
    ball.radius = Math.max(10, 24 * this.getPerspectiveScale(ball.y));
  }

  /**
   * Perform Ball-to-Pin and Pin-to-Pin Collision Physics
   */
  public static resolveCollisions(
    ball: { x: number; y: number; vx: number; vy: number; radius: number; isGutter: boolean },
    pins: PinState[],
    dt: number
  ): { newlyKnocked: number } {
    let newlyKnocked = 0;

    // 1. Ball vs Pins (only if ball is NOT in gutter)
    if (!ball.isGutter) {
      for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        if (!pin.knocked) {
          const pinRadius = 14 * this.getPerspectiveScale(pin.y);
          const dx = pin.x - ball.x;
          const dy = pin.y - ball.y;
          const dist = Math.hypot(dx, dy);

          if (dist < ball.radius + pinRadius) {
            pin.knocked = true;
            newlyKnocked++;

            // Angle of impact
            const angle = Math.atan2(dy, dx);
            const impactSpeed = Math.hypot(ball.vx, ball.vy) * 0.65;
            pin.vx = Math.cos(angle) * impactSpeed;
            pin.vy = Math.sin(angle) * impactSpeed - 80;
            pin.vRot = (Math.random() - 0.5) * 16;

            // Slight ball deflection
            ball.vx += Math.cos(angle + Math.PI) * 45;
          }
        }
      }
    }

    // 2. Pin-to-Pin Collisions (Domino Chain Reactions)
    for (let i = 0; i < pins.length; i++) {
      const p1 = pins[i];
      if (p1.knocked && (Math.abs(p1.vx) > 25 || Math.abs(p1.vy) > 25)) {
        for (let j = 0; j < pins.length; j++) {
          if (i === j) continue;
          const p2 = pins[j];
          if (!p2.knocked) {
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const hitDist = 26 * this.getPerspectiveScale((p1.y + p2.y) / 2);

            if (dist < hitDist) {
              p2.knocked = true;
              newlyKnocked++;

              const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
              const transferSpeed = Math.hypot(p1.vx, p1.vy) * 0.75;
              p2.vx = Math.cos(angle) * transferSpeed;
              p2.vy = Math.sin(angle) * transferSpeed - 60;
              p2.vRot = (Math.random() - 0.5) * 14;

              p1.vx *= 0.6;
              p1.vy *= 0.6;
            }
          }
        }
      }
    }

    // 3. Update physics on knocked pins
    for (let k = 0; k < pins.length; k++) {
      const p = pins[k];
      if (p.knocked) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vRot * dt;
        p.vx *= 0.93;
        p.vy *= 0.93;
        p.vRot *= 0.95;

        // Fade out pins that fall off the pit deck
        if (p.y < this.PIN_DECK_Y - 40 || p.y > this.FOUL_LINE_Y + 40) {
          p.fallAlpha = Math.max(0, p.fallAlpha - dt * 2.5);
        }
      }
    }

    return { newlyKnocked };
  }
}

