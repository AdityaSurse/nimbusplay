/**
 * NimbusPlay — Enemy Wave & Saucer Fleet Manager
 * Coordinates alien saucer formations, sinusoidal waves, dive attacks, and bolt fire.
 * Strictly typed with zero `any`.
 */

import { Container, Graphics } from 'pixi.js';
import { StarGraphics } from './star-graphics.js';
import type { StarEnemy, EnemyType } from './types.js';

export class EnemyManager {
  public container = new Container();
  private g = new Graphics();
  private enemies: StarEnemy[] = [];
  private nextId = 1;

  constructor() {
    this.container.addChild(this.g);
  }

  public spawnWave(waveNumber: number): void {
    this.enemies = [];
    const isBossWave = waveNumber % 5 === 0;
    if (isBossWave) return; // Handled by BossMothership

    // Generate formation based on wave number
    const rows = Math.min(2 + Math.floor(waveNumber / 2), 4);
    const cols = Math.min(5 + waveNumber, 9);
    const startY = 80;
    const spacingX = 1400 / (cols + 1);
    const offsetX = (1920 - spacingX * (cols - 1)) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type: EnemyType = 'fighter';
        let hp = 1;
        let score = 100;
        let radius = 26;

        if (r === 0 && waveNumber >= 2) {
          type = 'cruiser';
          hp = 3 + Math.floor(waveNumber / 2);
          score = 300;
          radius = 36;
        } else if (r === rows - 1 && Math.random() > 0.4) {
          type = 'scout';
          hp = 1;
          score = 150;
          radius = 20;
        }

        const enemy: StarEnemy = {
          id: this.nextId++,
          type,
          x: offsetX + c * spacingX,
          y: startY + r * 75 - 300, // Drop in from top
          vx: 0,
          vy: 60 + waveNumber * 6,
          hp,
          maxHp: hp,
          radius,
          scoreValue: score,
          alive: true,
          shootTimer: 1.5 + Math.random() * 4.0,
          patternTime: c * 0.35 + r * 0.5,
          patternParam: type === 'scout' ? 220 : 120,
          flashTimer: 0
        };

        this.enemies.push(enemy);
      }
    }
  }

  public spawnMinion(x: number, y: number): void {
    this.enemies.push({
      id: this.nextId++,
      type: 'boss_minion',
      x,
      y,
      vx: (Math.random() - 0.5) * 180,
      vy: 120 + Math.random() * 80,
      hp: 1,
      maxHp: 1,
      radius: 16,
      scoreValue: 80,
      alive: true,
      shootTimer: 2.0 + Math.random() * 3.0,
      patternTime: Math.random() * 10,
      patternParam: 90,
      flashTimer: 0
    });
  }

  public getActiveEnemies(): StarEnemy[] {
    return this.enemies.filter((e) => e.alive);
  }

  public hasEnemiesRemaining(): boolean {
    return this.enemies.some((e) => e.alive);
  }

  public update(
    dt: number,
    slowFactor: number,
    onEnemyShoot: (x: number, y: number, vx: number, vy: number) => void
  ): void {
    const effectiveDt = dt * slowFactor;
    this.g.clear();

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.alive) continue;

      e.patternTime += effectiveDt;

      // Update flash timer
      if (e.flashTimer > 0) {
        e.flashTimer = Math.max(0, e.flashTimer - dt);
      }

      // Movement patterns by type
      if (e.type === 'fighter') {
        // Sinusoidal swaying descent
        e.vx = Math.cos(e.patternTime * 2.2) * e.patternParam;
        e.x += e.vx * effectiveDt;
        e.y += e.vy * effectiveDt * 0.6;
      } else if (e.type === 'scout') {
        // High speed zig-zag darting
        e.vx = Math.sin(e.patternTime * 3.8) * e.patternParam * 1.5;
        e.x += e.vx * effectiveDt;
        e.y += (e.vy + 70) * effectiveDt;
      } else if (e.type === 'cruiser') {
        // Slow horizontal strafe
        e.vx = Math.sin(e.patternTime * 1.2) * 90;
        e.x += e.vx * effectiveDt;
        e.y += e.vy * effectiveDt * 0.35;
      } else if (e.type === 'boss_minion') {
        // Dart downward
        e.x += e.vx * effectiveDt;
        e.y += e.vy * effectiveDt;
        if (e.x < 100 || e.x > 1820) e.vx = -e.vx;
      }

      // Bounce horizontal edges
      if (e.x < 60) {
        e.x = 60;
        if (e.vx < 0) e.vx = -e.vx;
      } else if (e.x > 1860) {
        e.x = 1860;
        if (e.vx > 0) e.vx = -e.vx;
      }

      // Loop wrap when reaching bottom of stage
      if (e.y > 1100) {
        e.y = -60;
        e.x = 200 + Math.random() * 1520;
      }

      // Enemy firing logic
      e.shootTimer -= effectiveDt;
      if (e.shootTimer <= 0) {
        e.shootTimer = e.type === 'cruiser' ? 2.2 : 3.5 + Math.random() * 2.5;
        // Shoot downward towards bottom
        const aimSpread = (Math.random() - 0.5) * 60;
        onEnemyShoot(e.x, e.y + e.radius, aimSpread, 340);
      }

      // Render enemy
      const enemyG = new Graphics();
      StarGraphics.drawEnemy(enemyG, e.type, e.flashTimer > 0);
      enemyG.position.set(e.x, e.y);
      this.g.addChild(enemyG);
    }
  }

  public damageEnemy(enemy: StarEnemy, amount: number): boolean {
    enemy.hp -= amount;
    enemy.flashTimer = 0.08;
    if (enemy.hp <= 0) {
      enemy.alive = false;
      return true; // Destroyed
    }
    return false;
  }

  public clearAll(): void {
    this.enemies = [];
    this.g.clear();
  }
}

