/**
 * NimbusPlay — 3-Layer Parallax Starfield Engine
 * Procedural starfield with depth scaling, warp streaks, and slow-time damping.
 * Strictly typed with zero `any`.
 */

import { Container, Graphics } from 'pixi.js';

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  color: number;
  alpha: number;
}

export class Starfield {
  public container = new Container();
  private g = new Graphics();
  private stars: Star[] = [];
  private width: number;
  private height: number;

  constructor(width = 1920, height = 1080) {
    this.width = width;
    this.height = height;
    this.container.addChild(this.g);
    this.initStars();
  }

  private initStars(): void {
    // 1. Distant micro-stars (120 count, slow drift)
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 20 + Math.random() * 25,
        size: 1.2,
        color: 0x94a3b8,
        alpha: 0.35 + Math.random() * 0.3
      });
    }

    // 2. Midfield stars (60 count, medium cyan/white)
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 65 + Math.random() * 45,
        size: 2.2,
        color: Math.random() > 0.4 ? 0x38bdf8 : 0xf8fafc,
        alpha: 0.6 + Math.random() * 0.35
      });
    }

    // 3. Foreground fast warp specks (25 count, bright white)
    for (let i = 0; i < 25; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 160 + Math.random() * 90,
        size: 3.5,
        color: 0xffffff,
        alpha: 0.85
      });
    }
  }

  public update(dt: number, slowFactor = 1.0): void {
    const effectiveDt = dt * slowFactor;

    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      star.y += star.speed * effectiveDt;
      if (star.y > this.height) {
        star.y = -5;
        star.x = Math.random() * this.width;
      }
    }

    this.render();
  }

  public render(): void {
    this.g.clear();

    // Deep space backdrop fill
    this.g.rect(0, 0, this.width, this.height).fill(0x060913);

    // Subtle galactic nebula gradients
    this.g.circle(400, 300, 320).fill({ color: 0x1e1b4b, alpha: 0.25 });
    this.g.circle(1500, 750, 420).fill({ color: 0x082f49, alpha: 0.25 });

    // Draw all stars
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      if (star.size > 3) {
        // Foreground star streak
        this.g.roundRect(star.x, star.y, star.size * 0.7, star.size * 3.5, 1)
          .fill({ color: star.color, alpha: star.alpha });
      } else {
        this.g.circle(star.x, star.y, star.size)
          .fill({ color: star.color, alpha: star.alpha });
      }
    }
  }
}

