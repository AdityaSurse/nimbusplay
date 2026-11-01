/**
 * NimbusPlay — Predictive Interception & Aim Solver
 * Computes lead-target coordinates for moving targets given projectile velocity.
 * Strictly typed with zero `any`.
 */

import type { AimPrediction, StarEnemy } from './types.js';

export class AimSolver {
  /**
   * Computes exact or first-order lead position for a moving target.
   * P_lead = P_target + V_target * (distance / V_projectile)
   */
  public static computeLead(
    turretX: number,
    turretY: number,
    targetX: number,
    targetY: number,
    targetVx: number,
    targetVy: number,
    projectileSpeed: number
  ): { leadX: number; leadY: number; timeToHit: number } {
    const dx = targetX - turretX;
    const dy = targetY - turretY;
    const dist = Math.hypot(dx, dy);

    if (projectileSpeed <= 0 || dist === 0) {
      return { leadX: targetX, leadY: targetY, timeToHit: 0 };
    }

    // Time of flight approximation
    const t = dist / projectileSpeed;
    const leadX = targetX + targetVx * t;
    const leadY = targetY + targetVy * t;

    return { leadX, leadY, timeToHit: t };
  }

  /**
   * Finds the best target nearest to the player's reticle and computes predictive lead.
   */
  public static findLeadTarget(
    enemies: StarEnemy[],
    reticleX: number,
    reticleY: number,
    turretX: number,
    turretY: number,
    projectileSpeed = 1800,
    maxLockDistance = 180
  ): AimPrediction {
    let closestEnemy: StarEnemy | null = null;
    let minDistance = maxLockDistance;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.alive) continue;

      const d = Math.hypot(e.x - reticleX, e.y - reticleY);
      if (d < minDistance) {
        minDistance = d;
        closestEnemy = e;
      }
    }

    if (!closestEnemy) {
      return {
        targetEnemy: null,
        leadX: reticleX,
        leadY: reticleY,
        hasLead: false
      };
    }

    const { leadX, leadY } = this.computeLead(
      turretX,
      turretY,
      closestEnemy.x,
      closestEnemy.y,
      closestEnemy.vx,
      closestEnemy.vy,
      projectileSpeed
    );

    return {
      targetEnemy: closestEnemy,
      leadX,
      leadY,
      hasLead: true
    };
  }
}
