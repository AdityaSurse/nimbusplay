/**
 * NimbusPlay — Shooting Range Precision Aim Reticle & Crosshair
 * Smoothly tracks wand pointer coordinates with recoil kick physics.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics } from 'pixi.js';

export class RangeCrosshair {
  public readonly container = new Container();
  private g = new Graphics();

  public x = 960;
  public y = 540;
  private recoil = 0;

  constructor() {
    this.container.addChild(this.g);
    this.redraw(22);
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.container.x = x;
    this.container.y = y;
  }

  public triggerRecoil(): void {
    this.recoil = 1.0;
  }

  public update(dt: number): void {
    if (this.recoil > 0) {
      this.recoil = Math.max(0, this.recoil - 11 * dt);
      const baseR = 22;
      const currentR = baseR * (1.0 + this.recoil * 0.38);
      this.redraw(currentR);
    }
  }

  private redraw(radius: number): void {
    const g = this.g;
    g.clear();

    // Outer precision ring
    g.circle(0, 0, radius).stroke({ width: 2, color: 0x1e293b, alpha: 0.9 });
    g.circle(0, 0, radius - 2).stroke({ width: 1, color: 0xffffff, alpha: 0.7 });

    // 4 Crosshair Tick Marks
    const tickLen = 8;
    const gap = radius + 3;

    // Top
    g.rect(-1, -gap - tickLen, 2, tickLen).fill({ color: 0x0f172a });
    // Bottom
    g.rect(-1, gap, 2, tickLen).fill({ color: 0x0f172a });
    // Left
    g.rect(-gap - tickLen, -1, tickLen, 2).fill({ color: 0x0f172a });
    // Right
    g.rect(gap, -1, tickLen, 2).fill({ color: 0x0f172a });

    // Center precision pip
    g.circle(0, 0, 3.5).fill({ color: 0xef4444 }).stroke({ width: 1, color: 0xffffff });
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}

