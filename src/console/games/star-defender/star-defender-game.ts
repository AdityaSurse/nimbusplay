/**
 * NimbusPlay — Star Defender Master Game Module
 * Implements IGame with PixiJS v8, aim assist, wave progression, mothership boss, and haptics.
 * Strictly typed with zero `any`.
 */

import { Application, Container, Graphics } from 'pixi.js';
import type { IGame, GameInputState, GameOptions } from '../common/game-interface.js';
import { Starfield } from './starfield.js';
import { PlayerTurret } from './player-turret.js';
import { BulletManager } from './bullet-manager.js';
import { EnemyManager } from './enemy-manager.js';
import { BossMothership } from './boss-mothership.js';
import { PowerUpManager } from './powerup-manager.js';
import { StarParticles } from './star-particles.js';
import { StarHud } from './star-hud.js';
import { AimSolver } from './aim-solver.js';
import { StarGraphics } from './star-graphics.js';
import { SettingsManager } from '../../pointer/settings-manager.js';
import { audioManager } from '../../audio/audio-manager.js';
import type { GameState } from './types.js';

export class StarDefenderGame implements IGame {
  public readonly id = 'starDefender';
  public readonly title = 'Star Defender';

  private app: Application | null = null;
  private stageContainer = new Container();
  private reticleGraphics = new Graphics();

  private starfield!: Starfield;
  private turret!: PlayerTurret;
  private bullets!: BulletManager;
  private enemies!: EnemyManager;
  private boss!: BossMothership;
  private powerups!: PowerUpManager;
  private particles!: StarParticles;
  private hud!: StarHud;

  private state: GameState = 'intro';
  private waveNumber = 1;
  private lives = 3;
  private shakeIntensity = 0;
  private isAimAssist = true;
  private options: GameOptions | null = null;

  public async init(container: HTMLElement, options: GameOptions): Promise<void> {
    this.options = options;
    this.app = new Application();

    await this.app.init({
      width: options.width,
      height: options.height,
      backgroundAlpha: 0,
      antialias: true
    });

    const canvas = this.app.canvas as HTMLCanvasElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'auto';
    container.innerHTML = '';
    container.appendChild(canvas);

    this.app.stage.addChild(this.stageContainer);

    this.starfield = new Starfield(options.width, options.height);
    this.turret = new PlayerTurret();
    this.bullets = new BulletManager();
    this.enemies = new EnemyManager();
    this.boss = new BossMothership();
    this.powerups = new PowerUpManager();
    this.particles = new StarParticles();
    this.hud = new StarHud();

    this.stageContainer.addChild(this.starfield.container);
    this.stageContainer.addChild(this.particles.container);
    this.stageContainer.addChild(this.powerups.container);
    this.stageContainer.addChild(this.enemies.container);
    this.stageContainer.addChild(this.boss.container);
    this.stageContainer.addChild(this.bullets.container);
    this.stageContainer.addChild(this.turret.container);
    this.stageContainer.addChild(this.reticleGraphics);
    this.stageContainer.addChild(this.hud.container);

    this.startNewGame();
  }

  public startNewGame(): void {
    this.state = 'playing';
    this.waveNumber = 1;
    this.lives = 3;
    this.shakeIntensity = 0;
    this.isAimAssist = SettingsManager.isAimAssistEnabled();

    this.hud.reset();
    this.hud.setLives(this.lives);
    this.bullets.clearAll();
    this.enemies.clearAll();
    this.boss.clear();
    this.powerups.clearAll();
    this.particles.clearAll();
    this.turret.reset();

    this.startWave(this.waveNumber);
  }

  private startWave(wave: number): void {
    this.waveNumber = wave;
    this.hud.showWaveBanner(wave);
    if (wave % 5 === 0) {
      this.boss.spawn(wave);
    } else {
      this.enemies.spawnWave(wave);
    }
  }

  public update(input: GameInputState, dt: number): void {
    if (this.state === 'gameover') {
      this.handleGameOverInput(input);
      return;
    }
    if (this.state !== 'playing') return;

    this.isAimAssist = SettingsManager.isAimAssistEnabled();
    const slowFactor = this.powerups.getSlowTimeFactor();

    // 1. Aim Assist & Lead Target Calculation
    let effectiveAimX = input.pointerX;
    let effectiveAimY = input.pointerY;
    let leadOffsetX = 0;
    let leadOffsetY = 0;
    let hasLead = false;

    if (this.isAimAssist) {
      const activeTargets = this.boss.alive ? [this.boss.asTarget()] : this.enemies.getActiveEnemies();
      const prediction = AimSolver.findLeadTarget(
        activeTargets,
        input.pointerX,
        input.pointerY,
        this.turret.x,
        this.turret.y,
        1900
      );

      if (prediction.hasLead && prediction.targetEnemy) {
        hasLead = true;
        leadOffsetX = prediction.leadX - input.pointerX;
        leadOffsetY = prediction.leadY - input.pointerY;
        effectiveAimX = input.pointerX + leadOffsetX * 0.45;
        effectiveAimY = input.pointerY + leadOffsetY * 0.45;
      }
    }

    // 2. Draw Crosshair & Lead Reticle
    this.reticleGraphics.position.set(input.pointerX, input.pointerY);
    StarGraphics.drawCrosshair(this.reticleGraphics, leadOffsetX, leadOffsetY, hasLead);

    // 3. Update Subsystems
    this.starfield.update(dt, slowFactor);
    this.particles.update(dt);
    this.powerups.update(dt, this.turret.x, this.turret.y, (type, x, y) => {
      audioManager.playPowerupCollect();
      this.particles.emitFloatingText(x, y, `+${type.toUpperCase().replace('_', ' ')}!`, '#38bdf8');
      this.particles.emitShockwave(x, y, 70, 0x38bdf8);
    });

    // 4. Update Turret & Firing
    this.turret.update(
      input,
      dt,
      effectiveAimX,
      effectiveAimY,
      this.powerups.isSpreadShotActive(),
      this.powerups.isShieldActive(),
      {
        onFireLaser: (x, y, angle) => {
          this.bullets.fireLaser(x, y, angle);
          audioManager.playLaserFire();
          this.options?.sendHaptic([20]);
        },
        onFireSpread: (x, y, angle) => {
          this.bullets.fireSpread(x, y, angle);
          audioManager.playLaserFire();
          this.options?.sendHaptic([30]);
        },
        onFireCharged: (x, y, angle) => {
          this.bullets.fireCharged(x, y, angle);
          audioManager.playChargedBlast();
          this.shakeIntensity = 18;
          this.options?.sendHaptic([80, 30, 80]);
        },
        onChargeHum: (prog) => audioManager.playChargeHum(prog)
      }
    );

    // 5. Update Bullets & Enemies
    this.bullets.update(dt, slowFactor);

    if (this.boss.alive) {
      this.boss.update(dt, slowFactor, {
        onFireBolt: (x, y, vx, vy, type) => this.bullets.fireEnemyBolt(x, y, vx, vy, type),
        onSpawnMinion: (x, y) => this.enemies.spawnMinion(x, y)
      });
    }

    this.enemies.update(dt, slowFactor, (x, y, vx, vy) => {
      this.bullets.fireEnemyBolt(x, y, vx, vy, 'enemy_bolt');
    });

    // 6. Handle Collisions
    this.processCollisions();

    // 7. Check Wave Clearance
    if (!this.boss.alive && !this.enemies.hasEnemiesRemaining()) {
      this.startWave(this.waveNumber + 1);
    }

    // 8. Update HUD & Screen Shake
    this.hud.update(dt, this.boss.alive, this.boss.getHpPercent(), this.powerups.getActiveBuffsList());

    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 25);
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      this.stageContainer.position.set(sx, sy);
    } else {
      this.stageContainer.position.set(0, 0);
    }
  }

  private processCollisions(): void {
    const bullets = this.bullets.getActiveBullets();
    const enemies = this.enemies.getActiveEnemies();

    // Player Bullets vs Enemies
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (!b.alive || b.type === 'enemy_bolt' || b.type === 'boss_orb') continue;

      // Check vs Regular Enemies
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (!e.alive) continue;

        if (Math.hypot(b.x - e.x, b.y - e.y) < b.radius + e.radius) {
          const destroyed = this.enemies.damageEnemy(e, b.damage);
          this.particles.emitExplosion(b.x, b.y, b.color, 12, 180);

          if (destroyed) {
            audioManager.playAlienExplosion();
            this.particles.emitExplosion(e.x, e.y, 0xf59e0b, 28, 300);
            this.particles.emitFloatingText(e.x, e.y, `+${e.scoreValue}`);
            this.hud.addScore(e.scoreValue);
            this.powerups.spawnDropChance(e.x, e.y, e.type === 'cruiser');
          }

          if (!b.piercing) {
            this.bullets.releaseBullet(b);
            break;
          }
        }
      }

      // Check vs Mothership Boss
      if (b.alive && this.boss.alive && !this.boss.isEntering) {
        if (Math.abs(b.x - this.boss.x) < 140 && Math.abs(b.y - this.boss.y) < 50) {
          audioManager.playBossHit();
          const bossDead = this.boss.damage(b.damage);
          this.particles.emitExplosion(b.x, b.y, 0xf43f5e, 14, 220);

          if (bossDead) {
            audioManager.playBombExplode();
            this.particles.emitShockwave(this.boss.x, this.boss.y, 280, 0xf43f5e);
            this.particles.emitExplosion(this.boss.x, this.boss.y, 0xfbbf24, 60, 450);
            this.particles.emitFloatingText(this.boss.x, this.boss.y, '+2500 BOSS DESTROYED!', '#fbbf24');
            this.hud.addScore(2500);
            this.shakeIntensity = 28;
            this.options?.sendHaptic([150, 50, 150, 50, 250]);
            this.powerups.activatePowerUp('spread_shot');
          }

          if (!b.piercing) {
            this.bullets.releaseBullet(b);
          }
        }
      }
    }

    // Enemy Bolts vs Player Turret
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (!b.alive || (b.type !== 'enemy_bolt' && b.type !== 'boss_orb')) continue;

      if (Math.hypot(b.x - this.turret.x, b.y - this.turret.y) < b.radius + 55) {
        this.bullets.releaseBullet(b);

        if (this.powerups.consumeShieldHit()) {
          audioManager.playShieldDeflect();
          this.particles.emitShockwave(this.turret.x, this.turret.y, 90, 0x00f0ff);
          this.particles.emitFloatingText(this.turret.x, this.turret.y - 40, 'SHIELD DEFLECT!', '#00f0ff');
        } else {
          this.lives--;
          this.hud.setLives(this.lives);
          audioManager.playBombExplode();
          this.shakeIntensity = 22;
          this.options?.sendHaptic([180, 60, 180]);
          this.particles.emitExplosion(this.turret.x, this.turret.y, 0xef4444, 32, 340);

          if (this.lives <= 0) {
            this.triggerGameOver();
          }
        }
      }
    }
  }

  private triggerGameOver(): void {
    this.state = 'gameover';
    this.shakeIntensity = 30;
    this.options?.sendHaptic([250, 80, 250]);
  }

  private handleGameOverInput(input: GameInputState): void {
    const action = this.hud.checkGameOverAction(input.pointerX, input.pointerY, input.isTriggerPressed);
    if (action === 'retry') {
      audioManager.playClick();
      this.startNewGame();
    } else if (action === 'menu') {
      audioManager.playClick();
      this.options?.onExitToMenu();
    }
  }

  public render(): void {}
  public pause(): void { this.state = 'paused'; }
  public resume(): void { this.state = 'playing'; }

  public destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
}
