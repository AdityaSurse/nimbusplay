/**
 * NimbusPlay — Alien Attack Enemy & Combat Manager
 * Orchestrates alien saucers, tumbling asteroids, bubble aliens, lasers, and power-ups.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics } from 'pixi.js';
import type { LaserBolt, PowerUpItem, AlienType } from './types.js';
import { AlienGraphics } from './alien-graphics.js';
import { CombatParticleSystem } from './particles.js';

export interface CombatEvents {
  onScore: (pts: number) => void;
  onEnemyKilled: (type: AlienType, x: number, y: number) => void;
  onPlayerHit: () => void;
  onPowerUpCollected: (type: 'shield') => void;
}

interface ActiveEnemy {
  id: number;
  type: AlienType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  radius: number;
  rotation: number;
  rotSpeed: number;
  sinPhase: number;
  scoreVal: number;
  gfx: Graphics;
}

export class EnemyManager {
  public readonly container = new Container();
  public readonly particles = new CombatParticleSystem();

  private laserGfx = new Graphics();
  private powerUpGfx = new Graphics();
  private enemyContainer = new Container();

  private enemies: ActiveEnemy[] = [];
  private lasers: LaserBolt[] = [];
  private powerUps: PowerUpItem[] = [];

  private nextId = 0;
  private spawnTimer = 0;
  private spawnInterval = 1.7;
  private wave = 1;
  private waveTimer = 0;
  private stageWidth: number;
  private stageHeight: number;
  private events: CombatEvents;

  constructor(stageWidth: number, stageHeight: number, events: CombatEvents) {
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.events = events;

    this.container.addChild(this.laserGfx);
    this.container.addChild(this.powerUpGfx);
    this.container.addChild(this.enemyContainer);
    this.container.addChild(this.particles.container);
  }

  public addLasers(bolts: LaserBolt[]): void {
    this.lasers.push(...bolts);
  }

  public update(dt: number, pX: number, pY: number, pRadius: number): void {
    this.updateWave(dt); this.updateSpawning(dt); this.updateLasers(dt);
    this.updateEnemies(dt, pX, pY, pRadius);
    this.updatePowerUps(dt, pX, pY, pRadius);
    this.particles.update(dt);
    this.render();
  }

  private updateWave(dt: number): void {
    this.waveTimer += dt;
    if (this.waveTimer >= 18) {
      this.waveTimer = 0;
      this.wave++;
      this.spawnInterval = Math.max(0.65, 1.7 - (this.wave - 1) * 0.16);
    }
  }

  private updateSpawning(dt: number): void {
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }
  }

  private spawnEnemy(): void {
    const roll = Math.random(), x = 75 + Math.random() * (this.stageWidth - 150);
    const speedBoost = Math.min(180, (this.wave - 1) * 22);
    const gfx = new Graphics();
    this.enemyContainer.addChild(gfx);

    if (roll < 0.42) {
      AlienGraphics.drawAsteroid(gfx, 32);
      this.enemies.push({
        id: ++this.nextId, type: 'asteroid', x, y: -50, vx: (Math.random() - 0.5) * 40,
        vy: 180 + Math.random() * 80 + speedBoost * 0.7, hp: 2, radius: 32,
        rotation: Math.random() * Math.PI, rotSpeed: (Math.random() - 0.5) * 2.2,
        sinPhase: 0, scoreVal: 15, gfx
      });
    } else if (roll < 0.78) {
      AlienGraphics.drawSaucer(gfx, 28);
      this.enemies.push({
        id: ++this.nextId, type: 'saucer', x, y: -40, vx: 0,
        vy: 210 + Math.random() * 90 + speedBoost, hp: 1, radius: 28,
        rotation: 0, rotSpeed: 0, sinPhase: Math.random() * Math.PI * 2, scoreVal: 25, gfx
      });
    } else {
      AlienGraphics.drawBubbleAlien(gfx, 35, 0);
      this.enemies.push({
        id: ++this.nextId, type: 'bubble-alien', x, y: -60, vx: 0,
        vy: 140 + Math.random() * 60 + speedBoost * 0.5, hp: 3, radius: 35,
        rotation: 0, rotSpeed: 0, sinPhase: Math.random() * Math.PI * 2, scoreVal: 100, gfx
      });
    }
  }

  private updateLasers(dt: number): void {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y += l.vy * dt;
      if (l.y < -40) { this.lasers.splice(i, 1); continue; }

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        const distSq = (l.x - e.x) ** 2 + (l.y - e.y) ** 2;
        if (distSq <= (l.radius + e.radius) ** 2) {
          this.lasers.splice(i, 1);
          e.hp--;
          this.particles.spawnHitSparks(l.x, l.y, e.type);
          if (e.hp <= 0) this.killEnemy(j);
          break;
        }
      }
    }
  }

  private killEnemy(index: number): void {
    const e = this.enemies[index];
    this.enemyContainer.removeChild(e.gfx);
    e.gfx.destroy();
    this.enemies.splice(index, 1);
    this.events.onScore(e.scoreVal);
    this.events.onEnemyKilled(e.type, e.x, e.y);
    this.particles.spawnExplosion(e.x, e.y, e.type);

    if (e.type === 'bubble-alien') {
      this.powerUps.push({
        id: ++this.nextId, type: 'shield', x: e.x, y: e.y, vy: 130, radius: 20, pulseTimer: 0
      });
    }
  }

  private updateEnemies(dt: number, pX: number, pY: number, pRadius: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      e.rotation += e.rotSpeed * dt;
      e.sinPhase += dt * 3.5;

      if (e.type === 'saucer') {
        e.x += Math.sin(e.sinPhase) * 110 * dt;
      } else if (e.type === 'bubble-alien') {
        e.x += Math.cos(e.sinPhase * 0.8) * 60 * dt;
        AlienGraphics.drawBubbleAlien(e.gfx, 35, e.sinPhase);
      }

      e.gfx.x = e.x;
      e.gfx.y = e.y;
      e.gfx.rotation = e.rotation;

      // Player collision
      if ((e.x - pX) ** 2 + (e.y - pY) ** 2 <= (e.radius + pRadius) ** 2) {
        this.killEnemy(i);
        this.events.onPlayerHit();
        continue;
      }

      if (e.y > this.stageHeight + 80) {
        this.enemyContainer.removeChild(e.gfx);
        e.gfx.destroy();
        this.enemies.splice(i, 1);
      }
    }
  }

  private updatePowerUps(dt: number, pX: number, pY: number, pRadius: number): void {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.y += pu.vy * dt;
      pu.pulseTimer += dt;

      if ((pu.x - pX) ** 2 + (pu.y - pY) ** 2 <= (pu.radius + pRadius) ** 2) {
        this.powerUps.splice(i, 1);
        this.events.onPowerUpCollected(pu.type);
        this.particles.spawnPowerUpSparks(pu.x, pu.y);
        continue;
      }

      if (pu.y > this.stageHeight + 50) this.powerUps.splice(i, 1);
    }
  }

  private render(): void {
    const lg = this.laserGfx;
    lg.clear();
    for (const l of this.lasers) {
      lg.roundRect(l.x - 3, l.y - 12, 6, 24, 3).fill({ color: 0x06b6d4, alpha: 0.5 });
      lg.roundRect(l.x - 1.5, l.y - 10, 3, 20, 1.5).fill({ color: 0xffffff });
    }

    const pg = this.powerUpGfx;
    pg.clear();
    for (const pu of this.powerUps) {
      AlienGraphics.drawPowerUp(pg, pu.radius, pu.pulseTimer);
      pg.x = pu.x; pg.y = pu.y;
    }
    pg.x = 0; pg.y = 0;
  }

  public getWave(): number { return this.wave; }

  public reset(): void {
    for (const e of this.enemies) {
      this.enemyContainer.removeChild(e.gfx);
      e.gfx.destroy();
    }
    this.enemies = []; this.lasers = []; this.powerUps = [];
    this.particles.reset();
    this.wave = 1; this.waveTimer = 0; this.spawnTimer = 0; this.spawnInterval = 1.7;
  }

  public destroy(): void {
    this.reset();
    this.container.destroy({ children: true });
  }
}
