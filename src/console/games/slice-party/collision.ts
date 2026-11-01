/**
 * NimbusPlay — Swept-Segment vs Circle Collision Engine
 * Tests intersection between continuous blade segment [P1, P2] and fruit circles.
 * Strictly typed with zero `any`.
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface CollisionResult {
  hit: boolean;
  hitPoint: Point2D;
  cutAngle: number; // Angle of blade movement vector in radians
}

export class SliceCollision {
  /**
   * Tests whether swept line segment [p1, p2] intersects a circle at (cx, cy) with radius r.
   */
  public static testSegmentCircle(
    p1: Point2D,
    p2: Point2D,
    circleCenter: Point2D,
    radius: number
  ): CollisionResult {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;

    // Stationary pointer check
    if (lenSq < 1e-6) {
      const distSq = (circleCenter.x - p1.x) ** 2 + (circleCenter.y - p1.y) ** 2;
      return {
        hit: distSq <= radius * radius,
        hitPoint: { x: p1.x, y: p1.y },
        cutAngle: 0
      };
    }

    // Project circle center onto segment
    const t = Math.max(0, Math.min(1, ((circleCenter.x - p1.x) * dx + (circleCenter.y - p1.y) * dy) / lenSq));
    const closestX = p1.x + t * dx;
    const closestY = p1.y + t * dy;

    const distSq = (circleCenter.x - closestX) ** 2 + (circleCenter.y - closestY) ** 2;

    if (distSq <= radius * radius) {
      return {
        hit: true,
        hitPoint: { x: closestX, y: closestY },
        cutAngle: Math.atan2(dy, dx)
      };
    }

    return {
      hit: false,
      hitPoint: { x: 0, y: 0 },
      cutAngle: 0
    };
  }
}

