/**
 * NimbusPlay — Procedural Vector Artwork for Slice Party
 * Generates PixiJS vector sprites for Watermelon, Orange, Apple, Pineapple, and Bombs.
 * Strictly typed with zero `any`.
 */

import { Graphics } from 'pixi.js';

export type FruitType = 'watermelon' | 'orange' | 'apple' | 'pineapple' | 'bomb';

export interface FruitVisualDef {
  type: FruitType;
  radius: number;
  juiceColor: number;
  points: number;
}

export const FRUIT_DEFS: Record<FruitType, FruitVisualDef> = {
  watermelon: { type: 'watermelon', radius: 54, juiceColor: 0xff3b56, points: 1 },
  orange: { type: 'orange', radius: 46, juiceColor: 0xff9900, points: 1 },
  apple: { type: 'apple', radius: 44, juiceColor: 0xff4757, points: 1 },
  pineapple: { type: 'pineapple', radius: 52, juiceColor: 0xffd32a, points: 2 },
  bomb: { type: 'bomb', radius: 42, juiceColor: 0xff3838, points: 0 }
};

export class FruitGraphicsFactory {
  /**
   * Draws a complete intact fruit sprite centered at (0, 0)
   */
  public static drawWhole(g: Graphics, type: FruitType): void {
    g.clear();

    switch (type) {
      case 'watermelon': {
        // Outer dark green rind
        g.circle(0, 0, 54).fill(0x1e6f3d);
        // Lighter green wave stripes
        g.ellipse(0, 0, 52, 48).fill(0x27ae60);
        g.ellipse(-18, 0, 8, 48).fill(0x1e6f3d);
        g.ellipse(18, 0, 8, 48).fill(0x1e6f3d);
        // Specular sheen
        g.ellipse(-16, -20, 14, 8).fill({ color: 0xffffff, alpha: 0.35 });
        break;
      }

      case 'orange': {
        // Main orange skin
        g.circle(0, 0, 46).fill(0xff8c00);
        g.circle(0, 0, 43).fill(0xffa500);
        // Top stem bud
        g.circle(0, -44, 4).fill(0x27ae60);
        // Specular gloss
        g.ellipse(-12, -16, 12, 7).fill({ color: 0xffffff, alpha: 0.38 });
        break;
      }

      case 'apple': {
        // Red apple body (two overlapping lobes)
        g.circle(-10, 2, 42).fill(0xe74c3c);
        g.circle(10, 2, 42).fill(0xc0392b);
        g.circle(0, 6, 40).fill(0xd63031);
        // Indentation top
        g.ellipse(0, -36, 12, 6).fill(0x8e1515);
        // Brown stalk stem
        g.rect(-2.5, -48, 5, 14).fill(0x795548);
        // Green leaf
        g.ellipse(8, -44, 8, 4).fill(0x2ed573);
        // Gloss
        g.ellipse(-14, -14, 11, 6).fill({ color: 0xffffff, alpha: 0.4 });
        break;
      }

      case 'pineapple': {
        // Golden oval body
        g.ellipse(0, 8, 38, 48).fill(0xd48806);
        g.ellipse(0, 8, 35, 45).fill(0xfaad14);
        // Diamond scale details
        for (let dy = -25; dy <= 35; dy += 16) {
          for (let dx = -20; dx <= 20; dx += 16) {
            g.circle(dx, 8 + dy, 4).fill(0xa76800);
          }
        }
        // Top green palm spiky crown
        g.poly([-16, -35, 0, -60, -4, -38]).fill(0x1e824c);
        g.poly([0, -38, 16, -60, 4, -35]).fill(0x27ae60);
        g.poly([-6, -38, 0, -66, 6, -38]).fill(0x2ecc71);
        break;
      }

      case 'bomb': {
        // Cast-iron dark orb
        g.circle(0, 4, 42).fill(0x1a1a24);
        g.circle(0, 4, 40).fill(0x2d3436);
        // Collar & Fuse
        g.rect(-6, -42, 12, 6).fill(0x636e72);
        g.rect(-2, -50, 4, 10).fill(0xdfe6e9);
        // Sparkling fuse tip
        g.circle(0, -52, 6).fill(0xffd32a);
        g.circle(0, -52, 3).fill(0xffffff);
        // Skull / Warning symbol
        g.circle(0, 4, 12).fill(0xe74c3c);
        g.rect(-3, -2, 6, 8).fill(0xffffff);
        g.circle(0, 10, 2).fill(0xffffff);
        // Specular glare
        g.ellipse(-14, -10, 10, 5).fill({ color: 0xffffff, alpha: 0.3 });
        break;
      }
    }
  }

  /**
   * Draws a sliced half with open flesh facing the cut plane
   */
  public static drawHalf(g: Graphics, type: FruitType, half: 1 | 2): void {
    g.clear();
    const sign = half === 1 ? -1 : 1;

    switch (type) {
      case 'watermelon': {
        // Semicircular cut half: outer green rind
        g.arc(0, 0, 54, 0, Math.PI).fill(0x1e6f3d);
        // White inner pith
        g.arc(0, 0, 50, 0, Math.PI).fill(0xf5f6fa);
        // Juicy pink/red flesh
        g.arc(0, 0, 45, 0, Math.PI).fill(0xff4757);
        // Flat cut base edge
        g.rect(-45, -3, 90, 4).fill(0xff4757);
        // Black seeds
        [-25, -10, 8, 26].forEach((x) => {
          g.ellipse(x, 18, 2.5, 4.5).fill(0x1e272e);
        });
        break;
      }

      case 'orange': {
        // Outer rind
        g.arc(0, 0, 46, 0, Math.PI).fill(0xff8c00);
        // White pith
        g.arc(0, 0, 43, 0, Math.PI).fill(0xfff2e0);
        // Citrus flesh
        g.arc(0, 0, 39, 0, Math.PI).fill(0xffa500);
        g.rect(-39, -3, 78, 4).fill(0xffa500);
        // Segment wedges
        [-22, -8, 8, 22].forEach((x) => {
          g.ellipse(x, 14, 5, 9).fill(0xff8c00);
        });
        break;
      }

      case 'apple': {
        // Red skin
        g.arc(0, 0, 44, 0, Math.PI).fill(0xd63031);
        // Crisp pale flesh
        g.arc(0, 0, 41, 0, Math.PI).fill(0xfff5e6);
        g.rect(-41, -2, 82, 3).fill(0xfff5e6);
        // Core pip
        g.ellipse(sign * 6, 12, 2.5, 5).fill(0x4a2c00);
        break;
      }

      case 'pineapple': {
        // Rough textured skin edge
        g.arc(0, 0, 48, 0, Math.PI).fill(0xd48806);
        // Fibrous pineapple yellow meat
        g.arc(0, 0, 43, 0, Math.PI).fill(0xffea00);
        g.rect(-43, -3, 86, 4).fill(0xffea00);
        // Center core
        g.arc(0, 0, 14, 0, Math.PI).fill(0xfbc531);
        break;
      }

      default:
        // Default circular half
        g.arc(0, 0, 40, 0, Math.PI).fill(0x57606f);
        break;
    }
  }
}

