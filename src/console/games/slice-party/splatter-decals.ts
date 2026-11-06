/**
 * NimbusPlay — Fruit Ninja Sticky Juice Splatter Decals
 * Renders organic juice splatters that stick to the wooden planks and fade over time.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics } from 'pixi.js';

interface SplatterDecal {
  graphics: Graphics;
  timer: number;
  stayDuration: number;
  fadeDuration: number;
  initialAlpha: number;
}

export class SplatterDecalSystem {
  public container = new Container();
  private decals: SplatterDecal[] = [];
  private maxDecals = 30;

  constructor() {
    this.container.label = 'SplatterDecalLayer';
  }

  public addSplatter(x: number, y: number, color: number): void {
    // If over capacity, remove oldest decal smoothly
    if (this.decals.length >= this.maxDecals) {
      const oldest = this.decals.shift();
      if (oldest) {
        this.container.removeChild(oldest.graphics);
        oldest.graphics.destroy();
      }
    }

    const g = new Graphics();
    const initialAlpha = 0.72;

    // 1. Central organic juice splatter blotch (layered overlapping droplets)
    const blotchCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < blotchCount; i++) {
      const offsetX = (Math.random() - 0.5) * 28;
      const offsetY = (Math.random() - 0.5) * 28;
      const radius = 10 + Math.random() * 16;
      g.circle(offsetX, offsetY, radius).fill({ color, alpha: initialAlpha });
    }

    // 2. Radial satellite droplet splatters
    const dropletCount = 7 + Math.floor(Math.random() * 6);
    for (let j = 0; j < dropletCount; j++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 22 + Math.random() * 58;
      const dropRadius = 2.5 + Math.random() * 4.5;
      const dropX = Math.cos(angle) * distance;
      const dropY = Math.sin(angle) * distance;
      g.circle(dropX, dropY, dropRadius).fill({ color, alpha: initialAlpha * 0.9 });
    }

    g.x = x;
    g.y = y;
    this.container.addChild(g);

    this.decals.push({
      graphics: g,
      timer: 0,
      stayDuration: 3.2 + Math.random() * 1.0, // stays 3.2 - 4.2 seconds
      fadeDuration: 1.4, // smoothly fades over 1.4 seconds
      initialAlpha
    });
  }

  public update(dt: number): void {
    for (let i = this.decals.length - 1; i >= 0; i--) {
      const decal = this.decals[i];
      decal.timer += dt;

      if (decal.timer > decal.stayDuration) {
        const fadeProgress = (decal.timer - decal.stayDuration) / decal.fadeDuration;
        if (fadeProgress >= 1.0) {
          this.container.removeChild(decal.graphics);
          decal.graphics.destroy();
          this.decals.splice(i, 1);
        } else {
          decal.graphics.alpha = decal.initialAlpha * (1.0 - fadeProgress);
        }
      }
    }
  }

  public clear(): void {
    for (const decal of this.decals) {
      this.container.removeChild(decal.graphics);
      decal.graphics.destroy();
    }
    this.decals = [];
  }
}

