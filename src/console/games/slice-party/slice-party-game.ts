/**
 * NimbusPlay — Slice Party Master Game Loop
 * Implements IGame with 60 FPS PixiJS rendering, parabolic fruit physics,
 * blade ribbon trailing, combo multipliers, screen shake, and haptic feedback.
 * Strictly typed with zero `any`.
 */

import { Application, Container, Graphics } from 'pixi.js';
import type { IGame, GameInputState, GameOptions } from '../common/game-interface.js';
import { SliceCollision } from './collision.js';
import { EntityManager, FruitEntity } from './fruit-entity.js';
import { BladeTrail } from './blade-trail.js';
import { ParticleSystem } from './particle-system.js';
import { SlicePartyHUD } from './hud.js';
import { FRUIT_DEFS, type FruitType } from './fruit-graphics.js';
import { audioManager } from '../../audio/audio-manager.js';

export class SlicePartyGame implements IGame {
  public readonly id = 'sliceParty';
  public readonly title = 'Slice Party';

  private app: Application | null = null;
  private gameStage: Container = new Container();
  private options: GameOptions | null = null;

  // Subsystems
  private entityManager = new EntityManager();
  private bladeTrail = new BladeTrail();
  private particles = new ParticleSystem();
  private hud: SlicePartyHUD | null = null;

  // Slicing state
  private prevX = 960;
  private prevY = 540;
  private isPaused = false;
  private isGameOver = false;
  private lastWhooshTime = 0;

  // Combo system
  private currentCombo = 0;
  private comboTimer: ReturnType<typeof setTimeout> | null = null;

  // Spawner & Waves
  private timeSinceLastSpawn = 0;
  private spawnInterval = 2.4;
  private waveNumber = 1;
  private waveTimer = 0;

  // Screen shake
  private shakeDuration = 0;
  private shakeMagnitude = 0;

  public async init(container: HTMLElement, options: GameOptions): Promise<void> {
    this.options = options;

    const app = new Application();
    await app.init({
      width: options.width,
      height: options.height,
      backgroundAlpha: 0,
      antialias: true
    });

    app.canvas.style.position = 'absolute';
    app.canvas.style.inset = '0';
    app.canvas.style.width = '100%';
    app.canvas.style.height = '100%';
    app.canvas.style.pointerEvents = 'none';

    container.appendChild(app.canvas);
    this.app = app;

    // Build layered display hierarchy
    this.app.stage.addChild(this.gameStage);
    this.renderBackdrop();

    this.gameStage.addChild(this.entityManager.container);
    this.gameStage.addChild(this.particles.getDisplayObject());
    this.gameStage.addChild(this.bladeTrail.getDisplayObject());

    this.hud = new SlicePartyHUD({
      onRestart: () => this.restartGame(),
      onExit: () => options.onExitToMenu()
    });
    this.gameStage.addChild(this.hud.container);

    audioManager.initOnGesture();
    audioManager.playLaunchChime();
  }

  public update(input: GameInputState, dt: number): void {
    if (this.isPaused || this.isGameOver || !this.app) return;

    // 1. Calculate slice velocity
    const dx = input.pointerX - this.prevX;
    const dy = input.pointerY - this.prevY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = dist / Math.max(dt, 0.001);

    const isSlicing = input.isSliceHeld || speed > 1100;

    // 2. Audio whoosh on rapid swings
    const now = performance.now();
    if (isSlicing && speed > 1200 && now - this.lastWhooshTime > 160) {
      this.lastWhooshTime = now;
      audioManager.playBladeWhoosh();
    }

    // 3. Update blade ribbon trail
    this.bladeTrail.addPoint(input.pointerX, input.pointerY, isSlicing);

    // 4. Swept line collision hit-testing against active fruits
    if (isSlicing && dist > 3) {
      this.testFruitCollisions({ x: this.prevX, y: this.prevY }, { x: input.pointerX, y: input.pointerY });
    }

    // 5. Spawner wave logic
    this.updateSpawner(dt);

    // 6. Update entities & particle systems
    this.entityManager.update(dt);
    this.particles.update(dt);
    this.bladeTrail.render();

    // 7. Screen shake update
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const ox = (Math.random() * 2 - 1) * this.shakeMagnitude;
      const oy = (Math.random() * 2 - 1) * this.shakeMagnitude;
      this.gameStage.x = ox;
      this.gameStage.y = oy;
      this.shakeMagnitude *= 0.9;
    } else {
      this.gameStage.x = 0;
      this.gameStage.y = 0;
    }

    this.prevX = input.pointerX;
    this.prevY = input.pointerY;
  }

  public render(): void {
    // PixiJS renders automatically via requestAnimationFrame
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public destroy(): void {
    this.isGameOver = true;
    if (this.comboTimer) clearTimeout(this.comboTimer);

    this.entityManager.clear();
    this.particles.clear();
    this.bladeTrail.clear();

    if (this.app) {
      const canvas = this.app.canvas;
      this.app.destroy(true, { children: true });
      canvas.remove();
      this.app = null;
    }
  }

  private testFruitCollisions(p1: { x: number; y: number }, p2: { x: number; y: number }): void {
    for (let i = this.entityManager.fruits.length - 1; i >= 0; i--) {
      const fruit = this.entityManager.fruits[i];
      if (fruit.isSliced || fruit.isDead) continue;

      const hit = SliceCollision.testSegmentCircle(p1, p2, { x: fruit.x, y: fruit.y }, fruit.radius);
      if (hit.hit) {
        if (fruit.type === 'bomb') {
          this.handleBombHit(fruit, hit.hitPoint);
        } else {
          this.handleFruitSlice(fruit, hit.hitPoint, hit.cutAngle);
        }
      }
    }
  }

  private handleFruitSlice(fruit: FruitEntity, hitPoint: { x: number; y: number }, cutAngle: number): void {
    this.entityManager.splitFruit(fruit, cutAngle);
    const def = FRUIT_DEFS[fruit.type];

    this.particles.emitJuiceSplash(hitPoint.x, hitPoint.y, def.juiceColor);
    audioManager.playFruitSplat();
    this.options?.sendHaptic([25]);

    // Register combo
    this.currentCombo++;
    if (this.comboTimer) clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => {
      this.currentCombo = 0;
    }, 280);

    let points = def.points;
    if (this.currentCombo >= 2) {
      points *= this.currentCombo;
      this.hud?.showCombo(this.currentCombo);
      this.particles.emitScorePopup(hitPoint.x, hitPoint.y, `+${points} (${this.currentCombo}x)`, true);
      audioManager.playComboChime(this.currentCombo);
      this.options?.sendHaptic([30, 20, 30]);
    } else {
      this.particles.emitScorePopup(hitPoint.x, hitPoint.y, `+${points}`);
    }

    this.hud?.addScore(points);
  }

  private handleBombHit(bomb: FruitEntity, hitPoint: { x: number; y: number }): void {
    bomb.isDead = true;
    this.particles.emitBombExplosion(hitPoint.x, hitPoint.y);
    audioManager.playBombExplode();
    this.options?.sendHaptic([80, 50, 120]);

    this.shakeDuration = 0.45;
    this.shakeMagnitude = 18;
    this.currentCombo = 0;

    const remainingLives = this.hud?.loseLife() ?? 0;
    if (remainingLives <= 0) {
      this.isGameOver = true;
    }
  }

  private updateSpawner(dt: number): void {
    this.timeSinceLastSpawn += dt;
    this.waveTimer += dt;

    if (this.waveTimer >= 14) {
      this.waveTimer = 0;
      this.waveNumber++;
      this.spawnInterval = Math.max(1.2, 2.4 - this.waveNumber * 0.15);
    }

    if (this.timeSinceLastSpawn >= this.spawnInterval) {
      this.timeSinceLastSpawn = 0;
      this.tossFruitCluster();
    }
  }

  private tossFruitCluster(): void {
    const clusterSize = Math.min(4, 1 + Math.floor(Math.random() * (1 + this.waveNumber * 0.5)));
    const types: FruitType[] = ['watermelon', 'orange', 'apple', 'pineapple'];

    for (let i = 0; i < clusterSize; i++) {
      const isBomb = Math.random() < Math.min(0.35, 0.08 + this.waveNumber * 0.04);
      const type = isBomb ? 'bomb' : types[Math.floor(Math.random() * types.length)];

      const x = 340 + Math.random() * (1920 - 680);
      const y = 1120;

      // Velocities targeted to reach stage center
      const vx = (960 - x) * (0.2 + Math.random() * 0.3) + (Math.random() * 200 - 100);
      const vy = -(920 + Math.random() * 240);
      const vRot = (Math.random() * 2 - 1) * 3.5;

      this.entityManager.spawnFruit(type, x, y, vx, vy, vRot);
    }
  }

  private renderBackdrop(): void {
    const bg = new Graphics();
    // Soft vignette ambient background
    bg.rect(0, 0, 1920, 1080).fill({ color: 0x07111e, alpha: 0.88 });
    // Decorative traditional wood grain strips
    bg.rect(0, 1080 - 60, 1920, 60).fill({ color: 0x111d28, alpha: 0.95 });
    this.gameStage.addChild(bg);
  }

  private restartGame(): void {
    this.entityManager.clear();
    this.particles.clear();
    this.bladeTrail.clear();
    this.hud?.reset();
    this.isGameOver = false;
    this.waveNumber = 1;
    this.waveTimer = 0;
    this.currentCombo = 0;
    audioManager.playLaunchChime();
  }
}
