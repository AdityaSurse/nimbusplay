/**
 * NimbusPlay — Power-Up Drops & Status Manager
 * Handles capsule spawning, physics, collection, and timed gameplay buffs.
 * Strictly typed with zero `any`.
 */

import { Container, Graphics } from 'pixi.js';
import { StarGraphics } from './star-graphics.js';
import type { PowerUpItem, PowerUpType, ActivePowerUp } from './types.js';

export class PowerUpManager {
  public container = new Container();
  private g = new Graphics();
  private items: PowerUpItem[] = [];
  private activeBuffs: Map<PowerUpType, ActivePowerUp> = new Map();
  private shieldHitsRemaining = 0;
  private nextId = 1;

  constructor() {
    this.container.addChild(this.g);
  }

  public spawnDropChance(x: number, y: number, isCruiser = false): void {
    const chance = isCruiser ? 0.45 : 0.16;
    if (Math.random() > chance) return;

    const types: PowerUpType[] = ['spread_shot', 'shield', 'slow_time'];
    const selectedType = types[Math.floor(Math.random() * types.length)];

    this.items.push({
      id: this.nextId++,
      type: selectedType,
      x,
      y,
      vy: 110,
      radius: 22,
      alive: true,
      age: 0
    });
  }

  public activatePowerUp(type: PowerUpType): void {
    const duration = type === 'slow_time' ? 7000 : 10000;
    this.activeBuffs.set(type, {
      type,
      durationMs: duration,
      remainingMs: duration
    });

    if (type === 'shield') {
      this.shieldHitsRemaining = 3;
    }
  }

  public isSpreadShotActive(): boolean {
    return this.activeBuffs.has('spread_shot');
  }

  public isShieldActive(): boolean {
    return this.activeBuffs.has('shield') && this.shieldHitsRemaining > 0;
  }

  public consumeShieldHit(): boolean {
    if (this.isShieldActive()) {
      this.shieldHitsRemaining--;
      if (this.shieldHitsRemaining <= 0) {
        this.activeBuffs.delete('shield');
      }
      return true;
    }
    return false;
  }

  public getSlowTimeFactor(): number {
    return this.activeBuffs.has('slow_time') ? 0.45 : 1.0;
  }

  public getActiveBuffsList(): ActivePowerUp[] {
    return Array.from(this.activeBuffs.values());
  }

  public update(dt: number, turretX: number, turretY: number, onCollect: (type: PowerUpType, x: number, y: number) => void): void {
    // 1. Decrement active buffs
    const dtMs = dt * 1000;
    for (const [type, buff] of this.activeBuffs.entries()) {
      buff.remainingMs -= dtMs;
      if (buff.remainingMs <= 0) {
        this.activeBuffs.delete(type);
      }
    }

    // 2. Update falling capsules
    this.g.clear();

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (!item.alive) {
        this.items.splice(i, 1);
        continue;
      }

      item.age += dt;
      item.y += item.vy * dt;
      item.x += Math.sin(item.age * 4) * 35 * dt;

      // Magnetism / collection by player turret or bottom boundary
      const dx = turretX - item.x;
      const dy = turretY - item.y;
      const dist = Math.hypot(dx, dy);

      if (dist < item.radius + 60) {
        item.alive = false;
        this.activatePowerUp(item.type);
        onCollect(item.type, item.x, item.y);
        this.items.splice(i, 1);
        continue;
      }

      if (item.y > 1150) {
        item.alive = false;
        this.items.splice(i, 1);
        continue;
      }

      // Draw item
      const itemG = new Graphics();
      StarGraphics.drawPowerUp(itemG, item.type);
      itemG.position.set(item.x, item.y);
      this.g.addChild(itemG);
    }
  }

  public clearAll(): void {
    this.items = [];
    this.activeBuffs.clear();
    this.shieldHitsRemaining = 0;
    this.g.clear();
  }
}

