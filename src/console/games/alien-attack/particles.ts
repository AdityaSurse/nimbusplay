/**
 * NimbusPlay — Alien Attack Particle System
 * Manages combat spark impacts, power-up flares, and alien explosions.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics } from 'pixi.js';
import type { ExplosionParticle, AlienType } from './types.js';

export class CombatParticleSystem {
  public readonly container = new Container();
  private g = new Graphics();
  private particles: ExplosionParticle[] = [];

  constructor() {
    this.container.addChild(this.g);
  }

  public update(dt: number): void {
    const g = this.g;
    g.clear();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const progress = p.life / p.maxLife;
      const alpha = p.alpha * progress;
      const radius = p.radius * (0.3 + 0.7 * progress);

      g.circle(p.x, p.y, radius).fill({ color: p.color, alpha });
    }
  }

  public spawnHitSparks(x: number, y: number, type: AlienType): void {
    const color = type === 'asteroid' ? 0xd6d3d1 : type === 'saucer' ? 0x4ade80 : 0x06b6d4;
    for (let i = 0; i < 4; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 120;
      this.particles.push({
        x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        color, alpha: 0.95, radius: 2.5, life: 0.16, maxLife: 0.16
      });
    }
  }

  public spawnExplosion(x: number, y: number, type: AlienType): void {
    const colors = type === 'asteroid' ? [0x78716c, 0xa8a29e, 0xf97316]
      : type === 'saucer' ? [0x10b981, 0x34d399, 0xfacc15]
      : [0x06b6d4, 0x67e8f9, 0xfacc15, 0xec4899];

    for (let i = 0; i < 22; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 240;
      const col = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        color: col, alpha: 1, radius: 3 + Math.random() * 4,
        life: 0.4 + Math.random() * 0.25, maxLife: 0.65
      });
    }
  }

  public spawnPowerUpSparks(x: number, y: number): void {
    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 160;
      this.particles.push({
        x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        color: 0x38bdf8, alpha: 1, radius: 3.5, life: 0.38, maxLife: 0.38
      });
    }
  }

  public reset(): void {
    this.particles = [];
    this.g.clear();
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}

