/**
 * NimbusPlay — Star Defender Procedural Vector Graphics Factory
 * 100% original vector art rendered via PixiJS Graphics. Zero Nintendo IP.
 * Strictly typed with zero `any`.
 */

import { Graphics } from 'pixi.js';
import type { EnemyType, PowerUpType } from './types.js';

export class StarGraphics {
  /**
   * Draw the player defense turret
   */
  public static drawTurret(g: Graphics, chargeProgress: number, isShieldActive: boolean): void {
    g.clear();

    // 1. Arc Base Platform (stationed at bottom)
    g.ellipse(0, 30, 70, 24).fill(0x1e293b).stroke({ width: 3, color: 0x38bdf8, alpha: 0.8 });
    g.ellipse(0, 25, 50, 16).fill(0x0f172a);

    // 2. Twin Stabilizer Wings
    g.poly([-65, 30, -85, 45, -55, 45]).fill(0x0284c7);
    g.poly([65, 30, 85, 45, 55, 45]).fill(0x0284c7);

    // 3. Central Gimbal Pod
    g.circle(0, 0, 28).fill(0x0f172a).stroke({ width: 3, color: 0x38bdf8 });
    g.circle(0, 0, 18).fill(0x0284c7);

    // 4. Twin Laser Barrels
    g.roundRect(-16, -55, 7, 45, 3).fill(0x334155).stroke({ width: 1.5, color: 0x38bdf8 });
    g.roundRect(9, -55, 7, 45, 3).fill(0x334155).stroke({ width: 1.5, color: 0x38bdf8 });

    // 5. Muzzle Rings
    g.rect(-17, -54, 9, 4).fill(0x38bdf8);
    g.rect(8, -54, 9, 4).fill(0x38bdf8);

    // 6. Charging Plasma Core
    if (chargeProgress > 0) {
      const chargeRadius = 6 + chargeProgress * 18;
      const alpha = 0.4 + chargeProgress * 0.6;
      g.circle(0, -60, chargeRadius * 1.4).fill({ color: 0x00f0ff, alpha: alpha * 0.4 });
      g.circle(0, -60, chargeRadius).fill({ color: 0x38bdf8, alpha });
      g.circle(0, -60, chargeRadius * 0.5).fill({ color: 0xffffff, alpha: 0.95 });
    } else {
      g.circle(0, 0, 8).fill(0x38bdf8);
    }

    // 7. Energy Shield Ring
    if (isShieldActive) {
      g.circle(0, 0, 68).stroke({ width: 3.5, color: 0x00f0ff, alpha: 0.85 });
      g.circle(0, 0, 72).stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      g.circle(0, 0, 64).fill({ color: 0x00f0ff, alpha: 0.12 });
    }
  }

  /**
   * Draw alien saucers based on type
   */
  public static drawEnemy(g: Graphics, type: EnemyType, flash: boolean): void {
    g.clear();

    if (flash) {
      g.circle(0, 0, 24).fill(0xffffff);
      return;
    }

    switch (type) {
      case 'scout':
        // Fast crimson dart saucer
        g.ellipse(0, 0, 24, 10).fill(0xd97706).stroke({ width: 2, color: 0xfbbf24 });
        g.ellipse(0, -4, 12, 8).fill(0xef4444);
        g.circle(0, -5, 4).fill(0xfef08a);
        g.rect(-3, 6, 6, 4).fill(0x38bdf8); // Thruster glow
        break;

      case 'fighter':
        // Classic alien disc saucer with glass dome
        g.ellipse(0, 2, 32, 12).fill(0x475569).stroke({ width: 2, color: 0xa855f7 });
        g.ellipse(0, 0, 24, 7).fill(0x7c3aed);
        g.ellipse(0, -7, 14, 11).fill({ color: 0x06b6d4, alpha: 0.85 });
        g.circle(0, -8, 5).fill({ color: 0xffffff, alpha: 0.8 });
        // Underbelly emitter beads
        g.circle(-16, 4, 2.5).fill(0x38bdf8);
        g.circle(0, 6, 3).fill(0xf43f5e);
        g.circle(16, 4, 2.5).fill(0x38bdf8);
        break;

      case 'cruiser':
        // Heavy armored battle cruiser
        g.ellipse(0, 0, 44, 16).fill(0x1e293b).stroke({ width: 2.5, color: 0xef4444 });
        g.poly([-42, 0, -28, 14, 28, 14, 42, 0, 24, -14, -24, -14]).fill(0x334155);
        g.ellipse(0, -6, 20, 10).fill(0xd97706);
        g.circle(0, -6, 6).fill(0xfef08a);
        // Dual weapon nacelles
        g.rect(-36, 4, 6, 12).fill(0xef4444);
        g.rect(30, 4, 6, 12).fill(0xef4444);
        break;

      case 'boss_minion':
        // Small escort drone
        g.ellipse(0, 0, 16, 7).fill(0x64748b).stroke({ width: 1.5, color: 0xf43f5e });
        g.circle(0, -3, 6).fill(0xf43f5e);
        g.circle(0, -3, 2.5).fill(0xffffff);
        break;
    }
  }

  /**
   * Draw the Mothership Boss
   */
  public static drawBoss(g: Graphics, flash: boolean, hpPercent: number): void {
    g.clear();

    if (flash) {
      g.ellipse(0, 0, 150, 48).fill(0xffffff);
      return;
    }

    // Outer Heavy Armor Hull
    g.ellipse(0, 0, 148, 44).fill(0x0f172a).stroke({ width: 4, color: 0xf43f5e });
    g.ellipse(0, 0, 134, 36).fill(0x1e293b);

    // Multi-tier upper bridge
    g.ellipse(0, -16, 75, 24).fill(0x334155).stroke({ width: 2.5, color: 0xfbbf24 });
    g.ellipse(0, -22, 42, 16).fill(0x0f172a);

    // Pulsing central hyper-core eye
    const coreColor = hpPercent < 0.3 ? 0xef4444 : hpPercent < 0.6 ? 0xf59e0b : 0xa855f7;
    g.circle(0, -22, 14).fill(coreColor);
    g.circle(0, -22, 6).fill(0xffffff);

    // Wing Weapon Pods
    g.rect(-135, -4, 16, 22).fill(0xef4444).stroke({ width: 2, color: 0x991b1b });
    g.rect(119, -4, 16, 22).fill(0xef4444).stroke({ width: 2, color: 0x991b1b });

    // Underbelly Energy Conduit Line
    g.ellipse(0, 14, 85, 8).fill({ color: coreColor, alpha: 0.7 });
  }

  /**
   * Draw Power-up Capsule
   */
  public static drawPowerUp(g: Graphics, type: PowerUpType): void {
    g.clear();

    let bgColor = 0x0284c7;
    let strokeColor = 0x38bdf8;
    if (type === 'spread_shot') {
      bgColor = 0xb91c1c;
      strokeColor = 0xf87171;
    } else if (type === 'slow_time') {
      bgColor = 0x6d28d9;
      strokeColor = 0xc084fc;
    }

    // Outer hexagonal capsule
    g.poly([-16, -10, 0, -20, 16, -10, 16, 10, 0, 20, -16, 10]).fill(bgColor).stroke({ width: 2.5, color: strokeColor });
    g.circle(0, 0, 10).fill({ color: 0xffffff, alpha: 0.3 });

    // Inner symbol
    if (type === 'spread_shot') {
      // 3 diverging laser beams
      g.rect(-2, -8, 4, 16).fill(0xffffff);
      g.poly([-6, -5, -4, -6, -2, 6, -4, 7]).fill(0xffffff);
      g.poly([6, -5, 4, -6, 2, 6, 4, 7]).fill(0xffffff);
    } else if (type === 'shield') {
      // Shield icon
      g.poly([-7, -7, 0, -10, 7, -7, 6, 2, 0, 8, -6, 2]).fill(0xffffff);
    } else {
      // Hourglass / Chrono symbol
      g.poly([-6, -7, 6, -7, 0, 0, 6, 7, -6, 7, 0, 0]).fill(0xffffff);
    }
  }

  /**
   * Draw Aim Crosshair & Lead Indicator
   */
  public static drawCrosshair(g: Graphics, leadX: number, leadY: number, hasLead: boolean): void {
    g.clear();

    // Player Aim Reticle (Center)
    g.circle(0, 0, 18).stroke({ width: 2, color: 0x38bdf8, alpha: 0.9 });
    g.circle(0, 0, 3).fill(0x38bdf8);
    // 4 directional ticks
    g.rect(-26, -1, 7, 2).fill(0x38bdf8);
    g.rect(19, -1, 7, 2).fill(0x38bdf8);
    g.rect(-1, -26, 2, 7).fill(0x38bdf8);
    g.rect(-1, 19, 2, 7).fill(0x38bdf8);

    // Predictive Lead Reticle Marker (offset relative to crosshair)
    if (hasLead) {
      g.poly([leadX, leadY - 14, leadX + 14, leadY, leadX, leadY + 14, leadX - 14, leadY])
        .stroke({ width: 2, color: 0xf59e0b, alpha: 0.85 });
      g.circle(leadX, leadY, 3).fill(0xf59e0b);
      // Dotted connecting trace line
      g.moveTo(0, 0);
      g.lineTo(leadX, leadY).stroke({ width: 1.5, color: 0xf59e0b, alpha: 0.4 });
    }
  }
}
