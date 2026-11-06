/**
 * NimbusPlay — Shooting Range Pastoral Scenery & Backdrop
 * Renders bright cartoon blue sky, drifting puffy cumulus clouds, rolling grass meadow,
 * and cute rounded cartoon trees on the flanks.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics } from 'pixi.js';
import type { RangeCloud } from './types.js';

export class RangeBackdrop {
  public readonly container = new Container();
  private width: number;
  private height: number;

  private skyGraphics = new Graphics();
  private cloudGraphics = new Graphics();
  private landscapeGraphics = new Graphics();

  private clouds: RangeCloud[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.container.addChild(this.skyGraphics);
    this.container.addChild(this.cloudGraphics);
    this.container.addChild(this.landscapeGraphics);

    this.initClouds();
    this.renderSky();
    this.renderLandscape();
  }

  private initClouds(): void {
    this.clouds = [
      { x: this.width * 0.12, y: this.height * 0.14, speed: 18, scale: 1.1, alpha: 0.95 },
      { x: this.width * 0.45, y: this.height * 0.22, speed: 24, scale: 0.85, alpha: 0.9 },
      { x: this.width * 0.78, y: this.height * 0.12, speed: 20, scale: 1.25, alpha: 0.98 },
      { x: this.width * 0.95, y: this.height * 0.32, speed: 28, scale: 0.75, alpha: 0.88 },
      { x: this.width * 0.28, y: this.height * 0.38, speed: 22, scale: 0.9, alpha: 0.92 }
    ];
  }

  private renderSky(): void {
    const g = this.skyGraphics;
    g.clear();

    // Sunny vibrant sky vertical gradient from #38bdf8 to #93c5fd
    const steps = 16;
    const topR = 56, topG = 189, topB = 248;   // #38bdf8 bright sky cyan
    const botR = 147, botG = 197, botB = 253; // #93c5fd soft horizon blue
    const stepH = this.height / steps;

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(topR + (botR - topR) * t);
      const gr = Math.round(topG + (botG - topG) * t);
      const b = Math.round(topB + (botB - topB) * t);
      const color = (r << 16) | (gr << 8) | b;
      g.rect(0, i * stepH, this.width, stepH + 1).fill({ color });
    }

    // Warm sun glare in upper left
    g.circle(180, 110, 54).fill({ color: 0xfef08a, alpha: 0.85 });
    g.circle(180, 110, 85).fill({ color: 0xfef9c3, alpha: 0.35 });
    g.circle(180, 110, 120).fill({ color: 0xffffff, alpha: 0.15 });
  }

  private renderLandscape(): void {
    const g = this.landscapeGraphics;
    g.clear();

    const meadowY = this.height * 0.72; // ~778px in 1080p

    // 1. Distant Back Rolling Hill
    g.poly([
      { x: 0, y: meadowY + 40 },
      { x: this.width * 0.25, y: meadowY - 20 },
      { x: this.width * 0.55, y: meadowY + 30 },
      { x: this.width * 0.85, y: meadowY - 35 },
      { x: this.width, y: meadowY + 10 },
      { x: this.width, y: this.height },
      { x: 0, y: this.height }
    ]).fill({ color: 0x22c55e });

    // 2. Foreground Rolling Lush Meadow
    g.poly([
      { x: 0, y: meadowY + 60 },
      { x: this.width * 0.2, y: meadowY + 30 },
      { x: this.width * 0.48, y: meadowY + 80 },
      { x: this.width * 0.78, y: meadowY + 25 },
      { x: this.width, y: meadowY + 70 },
      { x: this.width, y: this.height },
      { x: 0, y: this.height }
    ]).fill({ color: 0x4ade80 });

    // Meadow edge highlight
    g.poly([
      { x: 0, y: meadowY + 60 },
      { x: this.width * 0.2, y: meadowY + 30 },
      { x: this.width * 0.48, y: meadowY + 80 },
      { x: this.width * 0.78, y: meadowY + 25 },
      { x: this.width, y: meadowY + 70 }
    ]).stroke({ width: 4, color: 0x86efac, alpha: 0.65 });

    // 3. Left Round Cartoon Tree
    this.drawCartoonTree(g, 100, meadowY + 50, 48);

    // 4. Right Round Cartoon Tree
    this.drawCartoonTree(g, this.width - 110, meadowY + 45, 52);

    // Cute meadow flower pips
    const flowers = [
      { x: 280, y: meadowY + 110, col: 0xfef08a },
      { x: 420, y: meadowY + 150, col: 0xffffff },
      { x: 680, y: meadowY + 120, col: 0xf472b6 },
      { x: 920, y: meadowY + 160, col: 0xfef08a },
      { x: 1220, y: meadowY + 130, col: 0xffffff },
      { x: 1540, y: meadowY + 155, col: 0xf472b6 },
      { x: 1720, y: meadowY + 115, col: 0xfef08a }
    ];
    for (const fl of flowers) {
      g.circle(fl.x, fl.y, 4).fill({ color: fl.col });
      g.circle(fl.x, fl.y, 1.5).fill({ color: 0xf59e0b });
    }
  }

  private drawCartoonTree(g: Graphics, x: number, y: number, radius: number): void {
    // Tree Trunk
    g.roundRect(x - 10, y - 10, 20, 80, 5).fill({ color: 0x854d0e });
    g.roundRect(x - 6, y - 5, 5, 70, 2).fill({ color: 0xa16207 });

    // Leaf Canopy
    const cy = y - 40;
    // Base shadow circle
    g.circle(x, cy + 8, radius * 0.95).fill({ color: 0x15803d });
    // Main vibrant canopy circles
    g.circle(x - radius * 0.35, cy, radius * 0.72).fill({ color: 0x22c55e });
    g.circle(x + radius * 0.35, cy, radius * 0.72).fill({ color: 0x22c55e });
    g.circle(x, cy - radius * 0.3, radius * 0.75).fill({ color: 0x4ade80 });

    // Top highlight specular puff
    g.circle(x - radius * 0.15, cy - radius * 0.45, radius * 0.35).fill({ color: 0x86efac, alpha: 0.85 });
  }

  public update(dt: number): void {
    // Animate drifting clouds
    const cg = this.cloudGraphics;
    cg.clear();

    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x > this.width + 180) {
        c.x = -180;
      }
      this.drawPuffyCloud(cg, c.x, c.y, c.scale, c.alpha);
    }
  }

  private drawPuffyCloud(g: Graphics, x: number, y: number, scale: number, alpha: number): void {
    const r = 32 * scale;
    // Bottom cloud base pill
    g.roundRect(x - r * 2.2, y - r * 0.2, r * 4.4, r * 1.3, r * 0.65).fill({ color: 0xffffff, alpha });
    // Overlapping puffy cloud lobes
    g.circle(x - r * 1.3, y - r * 0.1, r * 0.9).fill({ color: 0xffffff, alpha });
    g.circle(x + r * 1.3, y - r * 0.1, r * 0.85).fill({ color: 0xffffff, alpha });
    g.circle(x - r * 0.4, y - r * 0.65, r * 1.15).fill({ color: 0xffffff, alpha });
    g.circle(x + r * 0.5, y - r * 0.55, r * 1.0).fill({ color: 0xffffff, alpha });
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}

