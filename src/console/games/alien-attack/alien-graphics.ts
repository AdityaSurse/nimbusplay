/**
 * NimbusPlay — Alien Attack Procedural Vector Artwork
 * Strictly original vector art rendered via PixiJS Graphics.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Graphics } from 'pixi.js';

export class AlienGraphics {
  /**
   * White and red jet fighter with cockpit canopy, delta wings and engine nozzles.
   */
  public static drawPlayerShip(g: Graphics, shieldActive: boolean, shieldPulse = 0): void {
    g.clear();

    // 1. Forcefield shield bubble if active
    if (shieldActive) {
      const shieldR = 52 + Math.sin(shieldPulse * 8) * 3;
      g.circle(0, -6, shieldR)
        .fill({ color: 0x06b6d4, alpha: 0.18 })
        .stroke({ width: 2.5, color: 0x38bdf8, alpha: 0.85 });
      g.circle(0, -6, shieldR * 0.92)
        .stroke({ width: 1.5, color: 0xa5f3fc, alpha: 0.5 });
    }

    // 2. Twin Jet Engine Thrusters
    g.roundRect(-22, 14, 10, 14, 3).fill({ color: 0x334155 });
    g.roundRect(12, 14, 10, 14, 3).fill({ color: 0x334155 });
    g.ellipse(-17, 26, 4, 2).fill({ color: 0x0284c7 });
    g.ellipse(17, 26, 4, 2).fill({ color: 0x0284c7 });

    // 3. Red Delta Wings (Swept Wing Silhouette)
    g.poly([
      { x: 0, y: -24 },
      { x: -44, y: 16 },
      { x: -36, y: 22 },
      { x: -16, y: 12 },
      { x: 16, y: 12 },
      { x: 36, y: 22 },
      { x: 44, y: 16 }
    ]).fill({ color: 0xef4444 });

    // Wing highlights & wingtip weapon pods
    g.poly([
      { x: 0, y: -20 },
      { x: -42, y: 16 },
      { x: -36, y: 16 },
      { x: 0, y: -10 }
    ]).fill({ color: 0xf87171, alpha: 0.6 });

    g.roundRect(-46, 8, 4, 12, 1.5).fill({ color: 0xdc2626 });
    g.roundRect(42, 8, 4, 12, 1.5).fill({ color: 0xdc2626 });

    // 4. White Sleek Aerodynamic Fuselage
    g.poly([
      { x: 0, y: -38 },   // Nose needle
      { x: -14, y: 0 },
      { x: -16, y: 22 },
      { x: 16, y: 22 },
      { x: 14, y: 0 }
    ]).fill({ color: 0xf8fafc }).stroke({ width: 1.5, color: 0xe2e8f0 });

    // Center dorsal spine accent
    g.poly([
      { x: 0, y: -36 },
      { x: -4, y: 20 },
      { x: 4, y: 20 }
    ]).fill({ color: 0xffffff });

    // 5. Cyan Tinted Cockpit Canopy Glass
    g.ellipse(0, -8, 7, 16).fill({ color: 0x0284c7 });
    g.ellipse(-2, -10, 3, 10).fill({ color: 0x7dd3fc, alpha: 0.85 });
    g.ellipse(0, -8, 6.5, 15).stroke({ width: 1.5, color: 0x38bdf8, alpha: 0.9 });
  }

  /**
   * Craggy tumbling asteroid rock with craters and shaded facets.
   */
  public static drawAsteroid(g: Graphics, radius: number): void {
    g.clear();
    const pts = [
      { x: 0, y: -radius * 1.05 },
      { x: radius * 0.75, y: -radius * 0.7 },
      { x: radius * 1.08, y: 0 },
      { x: radius * 0.82, y: radius * 0.78 },
      { x: radius * 0.1, y: radius * 1.04 },
      { x: -radius * 0.72, y: radius * 0.85 },
      { x: -radius * 1.05, y: -0.1 },
      { x: -radius * 0.65, y: -radius * 0.8 }
    ];

    // Rock base
    g.poly(pts).fill({ color: 0x78716c }).stroke({ width: 2, color: 0x57534e });

    // Rocky surface facets
    g.poly([pts[0], pts[1], { x: radius * 0.2, y: -radius * 0.2 }]).fill({ color: 0xa8a29e, alpha: 0.5 });
    g.poly([pts[3], pts[4], { x: 0, y: radius * 0.3 }]).fill({ color: 0x44403c, alpha: 0.6 });

    // Crater pips
    g.circle(-radius * 0.3, -radius * 0.25, radius * 0.22).fill({ color: 0x44403c });
    g.circle(-radius * 0.3, -radius * 0.25, radius * 0.16).fill({ color: 0x292524 });
    g.circle(radius * 0.35, radius * 0.2, radius * 0.18).fill({ color: 0x44403c });
  }

  /**
   * Classic sleek alien saucer with green dome and pulse lights.
   */
  public static drawSaucer(g: Graphics, radius: number): void {
    g.clear();

    // Metallic saucer disc
    g.ellipse(0, 4, radius * 1.25, radius * 0.52).fill({ color: 0x334155 })
      .stroke({ width: 2, color: 0x64748b });
    g.ellipse(0, 2, radius * 1.15, radius * 0.38).fill({ color: 0x475569 });

    // Glowing perimeter lights
    const lR = radius * 0.85;
    g.circle(-lR * 0.8, 4, 3).fill({ color: 0x4ade80 });
    g.circle(-lR * 0.3, 7, 3).fill({ color: 0xfacc15 });
    g.circle(lR * 0.3, 7, 3).fill({ color: 0xfacc15 });
    g.circle(lR * 0.8, 4, 3).fill({ color: 0x4ade80 });

    // Glowing green cockpit dome
    g.ellipse(0, -6, radius * 0.62, radius * 0.48).fill({ color: 0x10b981 })
      .stroke({ width: 1.5, color: 0x34d399, alpha: 0.8 });
    g.ellipse(-4, -10, radius * 0.22, radius * 0.18).fill({ color: 0xa7f3d0, alpha: 0.75 });
  }

  /**
   * Alien in a glowing ring bubble: Alien creature inside a pulsing circular bubble with outer ring glow.
   */
  public static drawBubbleAlien(g: Graphics, radius: number, pulse: number): void {
    g.clear();

    const ringRadius = radius * 1.15 + Math.sin(pulse * 6) * 3;

    // 1. Shimmering outer energy ring
    g.circle(0, 0, ringRadius + 4).stroke({ width: 3.5, color: 0x06b6d4, alpha: 0.85 });
    g.circle(0, 0, ringRadius).stroke({ width: 2, color: 0x67e8f9, alpha: 0.95 });
    g.circle(0, 0, ringRadius * 0.95).fill({ color: 0x38bdf8, alpha: 0.22 });

    // Bubble specular reflection
    g.ellipse(-ringRadius * 0.45, -ringRadius * 0.45, ringRadius * 0.28, ringRadius * 0.12)
      .fill({ color: 0xffffff, alpha: 0.55 });

    // 2. Cute Green Alien Entity inside bubble
    // Antennae
    g.circle(-8, -19, 3).fill({ color: 0xfacc15 });
    g.circle(8, -19, 3).fill({ color: 0xfacc15 });
    g.rect(-9, -17, 2, 8).fill({ color: 0x22c55e });
    g.rect(7, -17, 2, 8).fill({ color: 0x22c55e });

    // Alien head
    g.ellipse(0, -4, 18, 15).fill({ color: 0x22c55e })
      .stroke({ width: 1.5, color: 0x15803d });

    // Big black alien almond eyes
    g.ellipse(-7, -5, 5, 7).fill({ color: 0x09090b });
    g.circle(-8, -7, 1.8).fill({ color: 0xffffff }); // Catchlight

    g.ellipse(7, -5, 5, 7).fill({ color: 0x09090b });
    g.circle(6, -7, 1.8).fill({ color: 0xffffff }); // Catchlight

    // Alien mouth
    g.ellipse(0, 4, 3.5, 2).fill({ color: 0x166534 });

    // Alien body torso & little arms
    g.ellipse(0, 14, 12, 10).fill({ color: 0x16a34a });
    g.ellipse(-12, 12, 3.5, 6).fill({ color: 0x22c55e });
    g.ellipse(12, 12, 3.5, 6).fill({ color: 0x22c55e });
  }

  /**
   * Dual plasma laser bolt with cyan outer glow and white core.
   */
  public static drawLaser(g: Graphics): void {
    g.clear();
    g.roundRect(-4, -16, 8, 32, 4).fill({ color: 0x06b6d4, alpha: 0.4 });
    g.roundRect(-2, -14, 4, 28, 2).fill({ color: 0x38bdf8, alpha: 0.85 });
    g.roundRect(-1, -12, 2, 24, 1).fill({ color: 0xffffff });
  }

  /**
   * Shield Power-Up Capsule: Glowing blue orb with orbital ring.
   */
  public static drawPowerUp(g: Graphics, radius: number, pulse: number): void {
    g.clear();
    const r = radius + Math.sin(pulse * 6) * 2;

    // Glowing aura
    g.circle(0, 0, r * 1.3).fill({ color: 0x06b6d4, alpha: 0.25 });
    // Core orb
    g.circle(0, 0, r).fill({ color: 0x0284c7 }).stroke({ width: 2, color: 0x38bdf8 });

    // Orbital ring
    g.ellipse(0, 0, r * 1.4, r * 0.45).stroke({ width: 2.5, color: 0x67e8f9, alpha: 0.9 });

    // Inner shield emblem
    g.poly([
      { x: 0, y: -7 },
      { x: 8, y: -3 },
      { x: 5, y: 7 },
      { x: 0, y: 9 },
      { x: -5, y: 7 },
      { x: -8, y: -3 }
    ]).fill({ color: 0xffffff, alpha: 0.95 });
  }
}

