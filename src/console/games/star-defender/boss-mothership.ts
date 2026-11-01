/**
 * NimbusPlay — Mothership Boss Entity & Attack Engine
 * Controls boss entry sequence, multi-phase bullet salvos, minions, and health bar.
 * Strictly typed with zero `any`.
 */

import { Container, Graphics } from 'pixi.js';
import { StarGraphics } from './star-graphics.js';
import type { StarEnemy } from './types.js';

export interface BossAttackCallbacks {
  onFireBolt: (x: number, y: number, vx: number, vy: number, type: 'enemy_bolt' | 'boss_orb') => void;
  onSpawnMinion: (x: number, y: number) => void;
}

export class BossMothership {
  public container = new Container();
  private g = new Graphics();

  public x = 960;
  public y = -200;
  public targetY = 220;
  public vx = 80;
  public hp = 100;
  public maxHp = 100;
  public alive = false;
  public flashTimer = 0;
  public isEntering = false;

  private attackTimer = 2.0;
  private minionTimer = 4.0;
  private waveNumber = 5;

  constructor() {
    this.container.addChild(this.g);
  }

  public spawn(waveNumber: number): void {
    this.waveNumber = waveNumber;
    this.maxHp = waveNumber * 22;
    this.hp = this.maxHp;
    this.x = 960;
    this.y = -200;
    this.targetY = 220;
    this.vx = 75 + waveNumber * 4;
    this.alive = true;
    this.isEntering = true;
    this.attackTimer = 2.0;
    this.minionTimer = 3.5;
    this.flashTimer = 0;
  }

  public getHpPercent(): number {
    return Math.max(0, Math.min(1.0, this.hp / this.maxHp));
  }

  public damage(amount: number): boolean {
    if (!this.alive) return false;
    this.hp -= amount;
    this.flashTimer = 0.08;
    if (this.hp <= 0) {
      this.alive = false;
      return true; // Boss defeated!
    }
    return false;
  }

  public update(dt: number, slowFactor: number, callbacks: BossAttackCallbacks): void {
    if (!this.alive) {
      this.g.clear();
      return;
    }

    const effectiveDt = dt * slowFactor;

    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
    }

    // 1. Entrance descent
    if (this.isEntering) {
      this.y += 180 * effectiveDt;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.isEntering = false;
      }
    } else {
      // 2. Horizontal strafe across upper screen
      this.x += this.vx * effectiveDt;
      if (this.x < 240) {
        this.x = 240;
        this.vx = Math.abs(this.vx);
      } else if (this.x > 1680) {
        this.x = 1680;
        this.vx = -Math.abs(this.vx);
      }

      // Attack Phase execution
      const hpPct = this.getHpPercent();

      // Basic Attack Timer (Radial 8-way or dual wing fire)
      this.attackTimer -= effectiveDt;
      if (this.attackTimer <= 0) {
        const interval = hpPct < 0.3 ? 0.9 : hpPct < 0.6 ? 1.4 : 2.0;
        this.attackTimer = interval;

        if (hpPct < 0.3) {
          // Phase 3: Enraged 8-way burst
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 280;
            callbacks.onFireBolt(this.x, this.y + 10, Math.cos(angle) * speed, Math.sin(angle) * speed, 'boss_orb');
          }
        } else {
          // Phase 1/2: Wing salvo
          callbacks.onFireBolt(this.x - 125, this.y + 15, -60, 360, 'enemy_bolt');
          callbacks.onFireBolt(this.x + 125, this.y + 15, 60, 360, 'enemy_bolt');
          if (hpPct < 0.6) {
            // Central plasma bomb
            callbacks.onFireBolt(this.x, this.y + 25, 0, 420, 'boss_orb');
          }
        }
      }

      // Minion deployment timer
      this.minionTimer -= effectiveDt;
      if (this.minionTimer <= 0) {
        this.minionTimer = hpPct < 0.5 ? 4.5 : 6.5;
        callbacks.onSpawnMinion(this.x - 90, this.y + 30);
        callbacks.onSpawnMinion(this.x + 90, this.y + 30);
      }
    }

    // Render Boss
    this.g.clear();
    const bossG = new Graphics();
    StarGraphics.drawBoss(bossG, this.flashTimer > 0, this.getHpPercent());
    bossG.position.set(this.x, this.y);
    this.g.addChild(bossG);
  }

  public clear(): void {
    this.alive = false;
    this.g.clear();
  }

  public asTarget(): StarEnemy {
    return {
      id: 9999,
      type: 'cruiser',
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: 0,
      hp: this.hp,
      maxHp: this.maxHp,
      radius: 80,
      scoreValue: 500,
      alive: this.alive,
      shootTimer: 0,
      patternTime: 0,
      patternParam: 0,
      flashTimer: 0
    };
  }
}
