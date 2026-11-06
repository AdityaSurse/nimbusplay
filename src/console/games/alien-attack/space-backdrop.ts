/**
 * NimbusPlay — Alien Attack Cosmic Space Backdrop
 * Renders royal-blue void, soft glowing nebula blobs, an orange ringed gas giant planet,
 * and downward-streaking white warp speed lines.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics } from 'pixi.js';
import type { SpeedLine } from './types.js';

interface NebulaBlob {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  color: number;
  speed: number;
  phase: number;
}

export class SpaceBackdrop {
  public readonly container = new Container();
  private width: number;
  private height: number;

  private bgGraphics = new Graphics();
  private nebulaGraphics = new Graphics();
  private planetContainer = new Container();
  private planetGraphics = new Graphics();
  private speedLineGraphics = new Graphics();

  private speedLines: SpeedLine[] = [];
  private nebulae: NebulaBlob[] = [];
  private planetX: number;
  private planetY: number;
  private planetTime = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.container.addChild(this.bgGraphics);
    this.container.addChild(this.nebulaGraphics);
    this.container.addChild(this.planetContainer);
    this.planetContainer.addChild(this.planetGraphics);
    this.container.addChild(this.speedLineGraphics);

    this.planetX = width * 0.72;
    this.planetY = height * 0.28;

    this.initNebulae();
    this.initSpeedLines(70);
    this.renderStaticBackground();
    this.renderPlanet();
  }

  private initNebulae(): void {
    this.nebulae = [
      {
        x: this.width * 0.25,
        y: this.height * 0.35,
        baseX: this.width * 0.25,
        baseY: this.height * 0.35,
        radius: 260,
        color: 0x8b5cf6, // Vibrant purple
        speed: 0.2,
        phase: 0
      },
      {
        x: this.width * 0.75,
        y: this.height * 0.65,
        baseX: this.width * 0.75,
        baseY: this.height * 0.65,
        radius: 240,
        color: 0xec4899, // Glowing pink
        speed: 0.25,
        phase: Math.PI / 2
      },
      {
        x: this.width * 0.5,
        y: this.height * 0.2,
        baseX: this.width * 0.5,
        baseY: this.height * 0.2,
        radius: 280,
        color: 0x06b6d4, // Neon cyan
        speed: 0.18,
        phase: Math.PI
      }
    ];
  }

  private initSpeedLines(count: number): void {
    this.speedLines = [];
    for (let i = 0; i < count; i++) {
      this.speedLines.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        length: 18 + Math.random() * 45,
        speed: 480 + Math.random() * 520,
        alpha: 0.35 + Math.random() * 0.55,
        width: 1.5 + Math.random() * 1.5
      });
    }
  }

  private renderStaticBackground(): void {
    const g = this.bgGraphics;
    g.clear();

    // Deep royal-blue gradient background
    const steps = 16;
    const topR = 10, topG = 22, topB = 60;     // #0a163c deep royal void
    const botR = 22, botG = 46, botB = 112;    // #162e70 rich royal blue
    const stepH = this.height / steps;

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(topR + (botR - topR) * t);
      const gr = Math.round(topG + (botG - topG) * t);
      const b = Math.round(topB + (botB - topB) * t);
      const color = (r << 16) | (gr << 8) | b;
      g.rect(0, i * stepH, this.width, stepH + 1).fill({ color });
    }
  }

  private renderPlanet(): void {
    const g = this.planetGraphics;
    g.clear();

    const planetRadius = 78;

    // Outer back ring
    g.ellipse(0, 0, 160, 48)
      .stroke({ width: 22, color: 0xf97316, alpha: 0.45 });
    g.ellipse(0, 0, 138, 40)
      .stroke({ width: 14, color: 0xfdba74, alpha: 0.75 });

    // Planet body
    g.circle(0, 0, planetRadius).fill({ color: 0xea580c });
    // Atmosphere rim glow
    g.circle(0, 0, planetRadius).stroke({ width: 3, color: 0xfdba74, alpha: 0.6 });

    // Atmospheric bands
    g.ellipse(0, -20, planetRadius * 0.95, 14).fill({ color: 0xf97316, alpha: 0.8 });
    g.ellipse(0, 0, planetRadius * 0.98, 16).fill({ color: 0xc2410c, alpha: 0.75 });
    g.ellipse(0, 22, planetRadius * 0.92, 14).fill({ color: 0xfb923c, alpha: 0.85 });

    // Planetary shadow crescent
    g.ellipse(28, 10, planetRadius * 0.8, planetRadius * 0.95)
      .fill({ color: 0x07112b, alpha: 0.55 });

    // Front ring pass
    g.ellipse(0, 0, 160, 48)
      .stroke({ width: 22, color: 0xf97316, alpha: 0.5 });
    g.ellipse(0, 0, 138, 40)
      .stroke({ width: 14, color: 0xfdba74, alpha: 0.85 });

    this.planetContainer.rotation = -0.38; // ~22 degrees tilt
    this.planetContainer.x = this.planetX;
    this.planetContainer.y = this.planetY;
  }

  public update(dt: number): void {
    this.planetTime += dt;

    // 1. Drift planet slowly across space
    this.planetX -= 6 * dt;
    this.planetY += 2.5 * dt;
    if (this.planetX < -200) {
      this.planetX = this.width + 200;
      this.planetY = this.height * 0.2 + Math.random() * (this.height * 0.3);
    }
    this.planetContainer.x = this.planetX;
    this.planetContainer.y = this.planetY;

    // 2. Animate soft glowing nebula blobs
    const ng = this.nebulaGraphics;
    ng.clear();
    for (const neb of this.nebulae) {
      neb.phase += neb.speed * dt;
      const curX = neb.baseX + Math.sin(neb.phase) * 35;
      const curY = neb.baseY + Math.cos(neb.phase * 0.7) * 25;

      // Render concentric soft alpha layers for glowing bloom
      ng.circle(curX, curY, neb.radius * 1.2).fill({ color: neb.color, alpha: 0.05 });
      ng.circle(curX, curY, neb.radius * 0.85).fill({ color: neb.color, alpha: 0.1 });
      ng.circle(curX, curY, neb.radius * 0.5).fill({ color: neb.color, alpha: 0.14 });
    }

    // 3. Animate downward-streaking speed lines
    const sg = this.speedLineGraphics;
    sg.clear();
    for (const line of this.speedLines) {
      line.y += line.speed * dt;
      if (line.y > this.height + 60) {
        line.y = -60;
        line.x = Math.random() * this.width;
      }
      sg.rect(line.x, line.y, line.width, line.length).fill({
        color: 0xffffff,
        alpha: line.alpha
      });
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}

