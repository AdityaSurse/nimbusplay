/**
 * NimbusPlay — Shooting Range Procedural Bullseye Graphics
 * 100% original vector target artwork for Red, Gold, and Black concentric bullseyes.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Graphics } from 'pixi.js';
import type { TargetVariant } from './types.js';

export class TargetGraphics {
  /**
   * Draws a complete concentric circular bullseye target with optional wooden ground post.
   */
  public static drawTarget(g: Graphics, variant: TargetVariant, radius: number, hasPost = false): void {
    g.clear();

    // 1. Optional Wooden Mounting Post
    if (hasPost) {
      const postW = Math.max(12, radius * 0.28);
      const postH = radius * 1.8;
      // Post shadow & body
      g.roundRect(-postW * 0.5, radius * 0.6, postW, postH, 4).fill({ color: 0x92400e });
      g.roundRect(-postW * 0.5 + 2, radius * 0.6, postW * 0.45, postH, 2).fill({ color: 0xb45309 });
    }

    // 2. Concentric Ring Color Palettes
    let c1 = 0xef4444, c2 = 0xffffff, c3 = 0xef4444, cCenter = 0xdc2626;
    let rimColor = 0x991b1b;

    if (variant === 'gold') {
      c1 = 0xf59e0b;
      c2 = 0xfef9c3;
      c3 = 0xfacc15;
      cCenter = 0xb45309;
      rimColor = 0x78350f;
    } else if (variant === 'black') {
      c1 = 0x1f2937;
      c2 = 0xffffff;
      c3 = 0x111827;
      cCenter = 0xfacc15; // Golden center pip on black ring target
      rimColor = 0x030712;
    }

    // 3. Drop Shadow & Outer Rim
    g.circle(0, 4, radius + 2).fill({ color: 0x0f172a, alpha: 0.22 });
    g.circle(0, 0, radius).fill({ color: rimColor });

    // Ring 1 (Outer Ring: 100% to 75% radius)
    g.circle(0, 0, radius * 0.94).fill({ color: c1 });

    // Ring 2 (Middle Outer Ring: 75% to 50% radius)
    g.circle(0, 0, radius * 0.72).fill({ color: c2 });

    // Ring 3 (Inner Ring: 50% to 25% radius)
    g.circle(0, 0, radius * 0.48).fill({ color: c3 });

    // Center Bullseye (25% radius)
    g.circle(0, 0, radius * 0.26).fill({ color: cCenter });
    g.circle(0, 0, radius * 0.08).fill({ color: 0xffffff }); // Precision center dot

    // 4. Subtle Specular Highlight Crescent
    g.ellipse(-radius * 0.35, -radius * 0.35, radius * 0.35, radius * 0.15)
      .fill({ color: 0xffffff, alpha: 0.28 });
  }

  /**
   * Draws a wooden splinter fragment for hit target shattering.
   */
  public static drawSplinter(g: Graphics, radius: number, color: number): void {
    g.clear();
    g.poly([
      { x: -radius, y: 0 },
      { x: 0, y: -radius * 0.6 },
      { x: radius, y: 0 },
      { x: 0, y: radius * 0.6 }
    ]).fill({ color });
  }
}

