/**
 * NimbusPlay — Shooting Range Target Manager & Hitscan System
 * Spawns dynamic pop-up bullseye targets (grass post & sky drift), tests hitscan accuracy,
 * and manages splinter destruction particles.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics } from 'pixi.js';
import type { BullseyeTarget, SplinterParticle, TargetVariant } from './types.js';
import { TargetGraphics } from './target-graphics.js';

export interface ShotResult {
  hit: boolean;
  points: number;
  isBullseye: boolean;
  x: number;
  y: number;
}

interface TargetItem {
  data: BullseyeTarget;
  gfx: Graphics;
}

export class TargetManager {
  public readonly container = new Container();
  private targetLayer = new Container();
  private splinterGraphics = new Graphics();

  private targets: TargetItem[] = [];
  private splinters: SplinterParticle[] = [];

  private nextId = 0;
  private spawnTimer = 0;
  private spawnInterval = 1.35;
  private stageWidth: number;
  private stageHeight: number;

  constructor(stageWidth: number, stageHeight: number) {
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;

    this.container.addChild(this.targetLayer);
    this.container.addChild(this.splinterGraphics);
  }

  public update(dt: number): void {
    this.updateSpawning(dt);
    this.updateTargets(dt);
    this.updateSplinters(dt);
  }

  private updateSpawning(dt: number): void {
    this.spawnTimer += dt;
    // Keep 3 to 5 targets active simultaneously
    if (this.spawnTimer >= this.spawnInterval && this.targets.length < 5) {
      this.spawnTimer = 0;
      this.spawnInterval = 1.1 + Math.random() * 0.7;
      this.spawnRandomTarget();
    }
  }

  private spawnRandomTarget(): void {
    const isGrass = Math.random() < 0.52, variantRoll = Math.random();
    const variant: TargetVariant = variantRoll < 0.5 ? 'red' : variantRoll < 0.8 ? 'gold' : 'black';
    const radius = 38 + Math.random() * 12;
    const x = isGrass ? 180 + Math.random() * (this.stageWidth - 360) : 190 + Math.random() * (this.stageWidth - 380);
    const y = isGrass ? 750 + Math.random() * 120 : 170 + Math.random() * 320;
    const vx = isGrass ? 0 : (Math.random() - 0.5) * 45;

    const gfx = new Graphics();
    TargetGraphics.drawTarget(gfx, variant, radius, isGrass);
    this.targetLayer.addChild(gfx);

    this.targets.push({
      data: {
        id: ++this.nextId, variant, x, y, baseX: x, baseY: y, vx, vy: 0,
        radius, scale: 0.1, alpha: 1.0, state: 'spawning', timer: 0,
        maxLifetime: 3.6 + Math.random() * 1.4, sinPhase: Math.random() * Math.PI * 2,
        hasPost: isGrass, rotation: 0, rotSpeed: 0
      },
      gfx
    });
  }

  private updateTargets(dt: number): void {
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const item = this.targets[i];
      const t = item.data;
      t.timer += dt;
      t.sinPhase += dt * 2.8;

      if (t.state === 'spawning') {
        t.scale = Math.min(1.0, t.scale + 7 * dt);
        if (t.scale >= 1.0) t.state = 'active';
      } else if (t.state === 'active') {
        t.x += t.vx * dt;
        t.y = t.baseY + Math.sin(t.sinPhase) * (t.hasPost ? 6 : 14);

        // Disappear warning fade in final 0.6 seconds
        const timeLeft = t.maxLifetime - t.timer;
        if (timeLeft <= 0.6) {
          t.alpha = Math.max(0, timeLeft / 0.6);
        }
        if (t.timer >= t.maxLifetime) {
          this.removeTarget(i);
          continue;
        }
      } else if (t.state === 'hit') {
        // Hit spin & fly away
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.vy += 800 * dt; // gravity
        t.rotation += t.rotSpeed * dt;
        t.alpha = Math.max(0, t.alpha - 2.8 * dt);
        t.scale = Math.max(0.2, t.scale - 1.2 * dt);

        if (t.alpha <= 0.05 || t.y > this.stageHeight + 100) {
          this.removeTarget(i);
          continue;
        }
      }

      item.gfx.x = t.x;
      item.gfx.y = t.y;
      item.gfx.scale.set(t.scale);
      item.gfx.alpha = t.alpha;
      item.gfx.rotation = t.rotation;
    }
  }

  public testHitscan(shotX: number, shotY: number): ShotResult {
    // Test front-to-back
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const item = this.targets[i];
      const t = item.data;
      if (t.state === 'hit' || t.alpha < 0.2) continue;

      const effectiveRadius = t.radius * t.scale;
      const dx = shotX - t.x;
      const dy = shotY - t.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= effectiveRadius * effectiveRadius) {
        const dist = Math.sqrt(distSq);
        const ratio = dist / effectiveRadius;

        let points = 10;
        let isBullseye = false;

        if (ratio <= 0.28) {
          points = 25; // Dead center bullseye
          isBullseye = true;
        } else if (ratio <= 0.60) {
          points = 15; // Inner ring
        }

        // Trigger hit animation
        t.state = 'hit';
        t.vx = (Math.random() - 0.5) * 160;
        t.vy = -260;
        t.rotSpeed = (Math.random() - 0.5) * 9;
        this.spawnSplinters(t.x, t.y, t.variant);

        return { hit: true, points, isBullseye, x: shotX, y: shotY };
      }
    }

    return { hit: false, points: 0, isBullseye: false, x: shotX, y: shotY };
  }

  private spawnSplinters(x: number, y: number, variant: TargetVariant): void {
    const colors = variant === 'gold' ? [0xfacc15, 0xfef9c3, 0x92400e]
      : variant === 'black' ? [0x1f2937, 0xffffff, 0xfacc15]
      : [0xef4444, 0xffffff, 0x92400e];

    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * Math.PI * 2, spd = 80 + Math.random() * 220;
      this.splinters.push({
        x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0, radius: 3 + Math.random() * 4.5,
        rotation: Math.random() * Math.PI, rotSpeed: (Math.random() - 0.5) * 12,
        life: 0.45, maxLife: 0.45
      });
    }
  }

  private updateSplinters(dt: number): void {
    const g = this.splinterGraphics;
    g.clear();

    for (let i = this.splinters.length - 1; i >= 0; i--) {
      const p = this.splinters[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.splinters.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 650 * dt; // gravity
      p.rotation += p.rotSpeed * dt;
      const progress = p.life / p.maxLife;

      g.circle(p.x, p.y, p.radius * progress).fill({
        color: p.color,
        alpha: p.alpha * progress
      });
    }
  }

  private removeTarget(index: number): void {
    const item = this.targets[index];
    this.targetLayer.removeChild(item.gfx);
    item.gfx.destroy();
    this.targets.splice(index, 1);
  }

  public reset(): void {
    for (const item of this.targets) {
      this.targetLayer.removeChild(item.gfx);
      item.gfx.destroy();
    }
    this.targets = [];
    this.splinters = [];
    this.splinterGraphics.clear();
    this.spawnTimer = 0;
  }

  public destroy(): void {
    this.reset();
    this.container.destroy({ children: true });
  }
}
