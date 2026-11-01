/**
 * NimbusPlay — Slice Party Blade Ribbon Trail Renderer
 * Renders an electric cyan-and-white tapered sword slash ribbon behind pointer movements.
 * Strictly typed with zero `any`.
 */

import { Graphics } from 'pixi.js';

interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

export class BladeTrail {
  private graphics: Graphics = new Graphics();
  private points: TrailPoint[] = [];
  private maxAgeMs = 160; // Fades out over 160ms

  public getDisplayObject(): Graphics {
    return this.graphics;
  }

  public addPoint(x: number, y: number, isSlicing: boolean): void {
    if (!isSlicing) {
      // If not actively slicing, taper out points quickly
      this.points = [];
      this.graphics.clear();
      return;
    }

    const now = performance.now();
    this.points.unshift({ x, y, time: now });

    // Prune stale points
    while (this.points.length > 0 && now - this.points[this.points.length - 1].time > this.maxAgeMs) {
      this.points.pop();
    }
  }

  public render(): void {
    this.graphics.clear();
    const now = performance.now();

    // Remove expired points
    while (this.points.length > 0 && now - this.points[this.points.length - 1].time > this.maxAgeMs) {
      this.points.pop();
    }

    if (this.points.length < 2) return;

    // Draw multi-layered glowing blade ribbon
    // Layer 1: Outer cyan diffuse glow
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];

      const ageRatio = (now - p1.time) / this.maxAgeMs;
      const alpha = Math.max(0, 1.0 - ageRatio) * 0.7;
      const width = Math.max(1, (1.0 - ageRatio) * 16);

      this.graphics
        .moveTo(p1.x, p1.y)
        .lineTo(p2.x, p2.y)
        .stroke({ width, color: 0x38bdf8, alpha, cap: 'round', join: 'round' });
    }

    // Layer 2: Sharp high-intensity white core
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];

      const ageRatio = (now - p1.time) / this.maxAgeMs;
      const alpha = Math.max(0, 1.0 - ageRatio);
      const width = Math.max(1, (1.0 - ageRatio) * 6);

      this.graphics
        .moveTo(p1.x, p1.y)
        .lineTo(p2.x, p2.y)
        .stroke({ width, color: 0xffffff, alpha, cap: 'round', join: 'round' });
    }
  }

  public clear(): void {
    this.points = [];
    this.graphics.clear();
  }
}

