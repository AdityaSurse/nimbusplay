/**
 * NimbusPlay — Procedural Vector Artwork for Fruit Ninja
 * Vector sprites for Watermelon, Orange, Lemon, Strawberry, Apple, and Bombs.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Graphics } from 'pixi.js';

export type FruitType = 'watermelon' | 'orange' | 'lemon' | 'strawberry' | 'apple' | 'bomb';

export interface FruitVisualDef {
  type: FruitType;
  radius: number;
  juiceColor: number;
  points: number;
}

export const FRUIT_DEFS: Record<FruitType, FruitVisualDef> = {
  watermelon: { type: 'watermelon', radius: 56, juiceColor: 0xff2a48, points: 1 },
  orange: { type: 'orange', radius: 48, juiceColor: 0xff8c00, points: 1 },
  lemon: { type: 'lemon', radius: 44, juiceColor: 0xffe135, points: 1 },
  strawberry: { type: 'strawberry', radius: 42, juiceColor: 0xef4444, points: 1 },
  apple: { type: 'apple', radius: 46, juiceColor: 0xff3838, points: 1 },
  bomb: { type: 'bomb', radius: 44, juiceColor: 0xff3838, points: 0 }
};

export class FruitGraphicsFactory {
  public static drawWhole(g: Graphics, type: FruitType): void {
    g.clear();

    switch (type) {
      case 'watermelon': {
        g.circle(0, 0, 56).fill(0x1e6f3d);
        g.ellipse(0, 0, 53, 50).fill(0x27ae60);
        g.ellipse(-18, 0, 8, 50).fill(0x1a5e34);
        g.ellipse(18, 0, 8, 50).fill(0x1a5e34);
        g.ellipse(-16, -20, 15, 8).fill({ color: 0xffffff, alpha: 0.35 });
        break;
      }

      case 'orange': {
        g.circle(0, 0, 48).fill(0xff8c00);
        g.circle(0, 0, 45).fill(0xffa500);
        g.circle(0, -45, 4).fill(0x27ae60);
        g.ellipse(-14, -16, 13, 7).fill({ color: 0xffffff, alpha: 0.38 });
        break;
      }

      case 'lemon': {
        g.ellipse(0, 0, 44, 38).fill(0xfacc15);
        g.ellipse(0, 0, 41, 35).fill(0xffe135);
        g.poly([-46, 0, -40, -6, -40, 6]).fill(0xfacc15);
        g.poly([46, 0, 40, -6, 40, 6]).fill(0xfacc15);
        g.ellipse(-12, -14, 14, 6).fill({ color: 0xffffff, alpha: 0.42 });
        break;
      }

      case 'strawberry': {
        g.circle(-8, -12, 22).fill(0xdc2626);
        g.circle(8, -12, 22).fill(0xdc2626);
        g.poly([-26, -10, 26, -10, 0, 38]).fill(0xef4444);
        [[-10, 4], [10, 4], [0, 18], [-6, -4], [6, -4], [0, 2]].forEach(([sx, sy]) => {
          g.circle(sx, sy, 1.8).fill(0xfde047);
        });
        g.poly([-16, -24, 0, -14, -20, -12]).fill(0x16a34a);
        g.poly([16, -24, 0, -14, 20, -12]).fill(0x16a34a);
        g.poly([0, -28, 0, -14, -6, -18]).fill(0x22c55e);
        g.ellipse(-8, -6, 8, 4).fill({ color: 0xffffff, alpha: 0.4 });
        break;
      }

      case 'apple': {
        g.circle(-10, 2, 44).fill(0xe74c3c);
        g.circle(10, 2, 44).fill(0xc0392b);
        g.circle(0, 6, 42).fill(0xd63031);
        g.ellipse(0, -38, 12, 6).fill(0x8e1515);
        g.rect(-2.5, -50, 5, 14).fill(0x795548);
        g.ellipse(9, -46, 9, 4.5).fill(0x2ed573);
        g.ellipse(-15, -14, 12, 6).fill({ color: 0xffffff, alpha: 0.4 });
        break;
      }

      case 'bomb': {
        g.circle(0, 4, 44).fill(0x181820);
        g.circle(0, 4, 42).fill(0x272733);
        g.rect(-7, -44, 14, 6).fill(0x64748b);
        g.rect(-2.5, -52, 5, 10).fill(0xd1d5db);
        g.circle(0, -55, 6).fill(0xfacc15);
        g.circle(0, -55, 3).fill(0xffffff);
        g.circle(0, 4, 12).fill(0xef4444);
        g.rect(-3, -2, 6, 8).fill(0xffffff);
        g.circle(0, 10, 2).fill(0xffffff);
        g.ellipse(-14, -10, 11, 5).fill({ color: 0xffffff, alpha: 0.3 });
        break;
      }
    }
  }

  public static drawHalf(g: Graphics, type: FruitType, half: 1 | 2): void {
    g.clear();
    const sign = half === 1 ? -1 : 1;

    switch (type) {
      case 'watermelon': {
        g.arc(0, 0, 56, 0, Math.PI).fill(0x1e6f3d);
        g.arc(0, 0, 52, 0, Math.PI).fill(0xf5f6fa);
        g.arc(0, 0, 47, 0, Math.PI).fill(0xff2a48);
        g.rect(-47, -3, 94, 4).fill(0xff2a48);
        [-26, -10, 9, 27].forEach((x) => g.ellipse(x, 20, 2.6, 4.8).fill(0x181820));
        break;
      }

      case 'orange': {
        g.arc(0, 0, 48, 0, Math.PI).fill(0xff8c00);
        g.arc(0, 0, 45, 0, Math.PI).fill(0xfff2e0);
        g.arc(0, 0, 41, 0, Math.PI).fill(0xffa500);
        g.rect(-41, -3, 82, 4).fill(0xffa500);
        [-24, -9, 9, 24].forEach((x) => g.ellipse(x, 15, 5, 10).fill(0xff8c00));
        break;
      }

      case 'lemon': {
        g.arc(0, 0, 44, 0, Math.PI).fill(0xfacc15);
        g.arc(0, 0, 41, 0, Math.PI).fill(0xfffbe8);
        g.arc(0, 0, 37, 0, Math.PI).fill(0xffe135);
        g.rect(-37, -3, 74, 4).fill(0xffe135);
        [-20, -7, 7, 20].forEach((x) => g.ellipse(x, 13, 4.5, 9).fill(0xfacc15));
        break;
      }

      case 'strawberry': {
        g.arc(0, 0, 42, 0, Math.PI).fill(0xdc2626);
        g.arc(0, 0, 38, 0, Math.PI).fill(0xfecdd3);
        g.arc(0, 0, 34, 0, Math.PI).fill(0xef4444);
        g.rect(-34, -2.5, 68, 3.5).fill(0xef4444);
        break;
      }

      case 'apple': {
        g.arc(0, 0, 46, 0, Math.PI).fill(0xd63031);
        g.arc(0, 0, 43, 0, Math.PI).fill(0xfff5e6);
        g.rect(-43, -2, 86, 3).fill(0xfff5e6);
        g.ellipse(sign * 7, 13, 2.6, 5.2).fill(0x451a03);
        break;
      }

      case 'bomb': {
        g.arc(0, 0, 44, 0, Math.PI).fill(0x181820);
        g.arc(0, 0, 38, 0, Math.PI).fill(0xef4444);
        g.rect(-38, -2, 76, 3).fill(0xfacc15);
        break;
      }
    }
  }
}
