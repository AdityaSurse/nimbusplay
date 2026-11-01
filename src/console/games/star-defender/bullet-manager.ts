/**
 * NimbusPlay — Pooled Projectile & Bullet Engine
 * Manages player lasers, charged plasma blasts, enemy bolts, and boss orbs without allocations.
 * Strictly typed with zero `any`.
 */

import { Container, Graphics } from 'pixi.js';
import { ObjectPool } from './object-pool.js';
import type { StarBullet, BulletType } from './types.js';

export class BulletManager {
  public container = new Container();
  private g = new Graphics();
  private pool: ObjectPool<StarBullet>;
  private nextId = 1;

  constructor(maxBullets = 160) {
    this.container.addChild(this.g);

    this.pool = new ObjectPool<StarBullet>(
      maxBullets,
      () => ({
        id: this.nextId++,
        type: 'laser',
        x: 0,
        y: 0,
        vx: 0,
        vy: -1800,
        radius: 6,
        damage: 1,
        alive: false,
        piercing: false,
        color: 0x00f0ff
      }),
      (b) => {
        b.alive = true;
      }
    );
  }

  public fireLaser(x: number, y: number, angle: number): void {
    const b = this.pool.acquire();
    if (!b) return;

    const speed = 1900;
    b.type = 'laser';
    b.x = x;
    b.y = y;
    b.vx = Math.cos(angle) * speed;
    b.vy = Math.sin(angle) * speed;
    b.radius = 6;
    b.damage = 1;
    b.piercing = false;
    b.color = 0x00f0ff;
  }

  public fireSpread(x: number, y: number, centerAngle: number): void {
    const spreadRad = 0.20; // ~11.5 deg
    [-spreadRad, 0, spreadRad].forEach((offset) => {
      this.fireLaser(x, y, centerAngle + offset);
    });
  }

  public fireCharged(x: number, y: number, angle: number): void {
    const b = this.pool.acquire();
    if (!b) return;

    const speed = 1100;
    b.type = 'charged';
    b.x = x;
    b.y = y;
    b.vx = Math.cos(angle) * speed;
    b.vy = Math.sin(angle) * speed;
    b.radius = 28;
    b.damage = 6;
    b.piercing = true;
    b.color = 0x38bdf8;
  }

  public fireEnemyBolt(x: number, y: number, vx: number, vy: number, type: 'enemy_bolt' | 'boss_orb' = 'enemy_bolt'): void {
    const b = this.pool.acquire();
    if (!b) return;

    b.type = type;
    b.x = x;
    b.y = y;
    b.vx = vx;
    b.vy = vy;
    b.radius = type === 'boss_orb' ? 14 : 7;
    b.damage = 1;
    b.piercing = false;
    b.color = type === 'boss_orb' ? 0xef4444 : 0xf43f5e;
  }

  public update(dt: number, slowFactor = 1.0): void {
    this.g.clear();

    this.pool.forEachActive((b) => {
      // Enemy projectiles are affected by slow-time power-up
      const isEnemy = b.type === 'enemy_bolt' || b.type === 'boss_orb';
      const effectiveDt = isEnemy ? dt * slowFactor : dt;

      b.x += b.vx * effectiveDt;
      b.y += b.vy * effectiveDt;

      // Despawn bounds
      if (b.y < -60 || b.y > 1140 || b.x < -60 || b.x > 1980) {
        this.pool.release(b);
        return;
      }

      // Render Projectile
      if (b.type === 'laser') {
        // High-energy laser needle
        const angle = Math.atan2(b.vy, b.vx);
        const len = 34;
        const tailX = b.x - Math.cos(angle) * len;
        const tailY = b.y - Math.sin(angle) * len;
        this.g.moveTo(tailX, tailY).lineTo(b.x, b.y)
          .stroke({ width: 5, color: 0x00f0ff, alpha: 0.95 });
        this.g.moveTo(tailX + Math.cos(angle) * 8, tailY + Math.sin(angle) * 8).lineTo(b.x, b.y)
          .stroke({ width: 2.5, color: 0xffffff, alpha: 1.0 });
      } else if (b.type === 'charged') {
        // Massive plasma sphere
        this.g.circle(b.x, b.y, b.radius * 1.5).fill({ color: 0x00f0ff, alpha: 0.25 });
        this.g.circle(b.x, b.y, b.radius).fill(0x0284c7).stroke({ width: 3, color: 0x38bdf8 });
        this.g.circle(b.x, b.y, b.radius * 0.55).fill(0xffffff);
      } else if (b.type === 'boss_orb') {
        // Crimson boss mega orb
        this.g.circle(b.x, b.y, b.radius * 1.4).fill({ color: 0xef4444, alpha: 0.3 });
        this.g.circle(b.x, b.y, b.radius).fill(0x991b1b).stroke({ width: 2, color: 0xfbbf24 });
        this.g.circle(b.x, b.y, b.radius * 0.4).fill(0xffffff);
      } else {
        // Enemy plasma bolt
        this.g.circle(b.x, b.y, b.radius).fill(0xf43f5e).stroke({ width: 2, color: 0xfecdd3 });
        this.g.circle(b.x, b.y, b.radius * 0.45).fill(0xffffff);
      }
    });
  }

  public getActiveBullets(): StarBullet[] {
    return this.pool.getActiveItems();
  }

  public releaseBullet(b: StarBullet): void {
    this.pool.release(b);
  }

  public clearAll(): void {
    this.pool.releaseAll();
    this.g.clear();
  }
}
