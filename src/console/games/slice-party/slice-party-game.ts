/**
 * NimbusPlay — Fruit Ninja Master Game Loop
 * Implements IGame with 60 FPS PixiJS rendering, vertical timber cedar plank wall,
 * parabolic fruit physics, sticky juice decals, glowing blade trail, and authentic 3-strike HUD.
 * Strictly typed with zero `any`. Target < 350 lines.
 */

import { Application, Container } from 'pixi.js';
import type { IGame, GameInputState, GameOptions } from '../common/game-interface.js';
import { SliceCollision } from './collision.js';
import { EntityManager, FruitEntity } from './fruit-entity.js';
import { BladeTrail } from './blade-trail.js';
import { ParticleSystem } from './particle-system.js';
import { SplatterDecalSystem } from './splatter-decals.js';
import { SlicePartyHUD } from './hud.js';
import { DojoBackdrop } from './dojo-backdrop.js';
import { FRUIT_DEFS, type FruitType } from './fruit-graphics.js';
import { audioManager } from '../../audio/audio-manager.js';
import { BUTTON_MASKS } from '../../../shared/protocol.js';

export class SlicePartyGame implements IGame {
  public readonly id = 'fruitNinja';
  public readonly title = 'Fruit Ninja';

  private app: Application | null = null;
  private gameStage: Container = new Container();
  private options: GameOptions | null = null;

  // Layered Subsystems
  private backdrop!: DojoBackdrop;
  private splatters = new SplatterDecalSystem();
  private entityManager = new EntityManager();
  private particles = new ParticleSystem();
  private bladeTrail = new BladeTrail();
  private hud: SlicePartyHUD | null = null;

  // Slicing State
  private prevX = 960;
  private prevY = 540;
  private isPaused = false;
  private isGameOver = false;
  private lastWhooshTime = 0;

  // Combo System
  private currentCombo = 0;
  private comboTimer: ReturnType<typeof setTimeout> | null = null;

  // Spawner & Wave Progression
  private timeSinceLastSpawn = 0;
  private spawnInterval = 2.4;
  private waveNumber = 1;
  private waveTimer = 0;

  // Screen Shake
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

    // Display hierarchy: Planks -> Splatters -> Fruits -> Particles -> Blade -> HUD
    this.app.stage.addChild(this.gameStage);
    this.backdrop = new DojoBackdrop(options.width, options.height);
    this.gameStage.addChild(this.backdrop.container);
    this.gameStage.addChild(this.splatters.container);
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

    // 1. Calculate pointer speed & determine slicing state
    const dx = input.pointerX - this.prevX;
    const dy = input.pointerY - this.prevY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = dist / Math.max(dt, 0.001);

    // Slicing active by holding A button (or B / mouse drag fallback)
    const isAHeld = (input.rawBitmask & BUTTON_MASKS.A) !== 0;
    const isBHeld = (input.rawBitmask & BUTTON_MASKS.B) !== 0;
    const isSlicing = (isAHeld || isBHeld || input.isSliceHeld) && speed > 160;

    // 2. Whoosh sound on energetic swings
    const now = performance.now();
    if (isSlicing && speed > 1050 && now - this.lastWhooshTime > 150) {
      this.lastWhooshTime = now;
      audioManager.playBladeWhoosh();
    }

    // 3. Update glowing blade ribbon trail
    this.bladeTrail.addPoint(input.pointerX, input.pointerY, isSlicing);

    // 4. Swept line collision hit-testing against active fruits
    if (isSlicing && dist > 3) {
      this.testFruitCollisions({ x: this.prevX, y: this.prevY }, { x: input.pointerX, y: input.pointerY });
    }

    // 5. Spawner wave logic
    this.updateSpawner(dt);

    // 6. Update entities, decals, particles, and blade
    this.entityManager.update(dt, (fruit) => this.handleFruitMissed(fruit));
    this.splatters.update(dt);
    this.particles.update(dt);
    this.bladeTrail.render();

    // 7. Screen shake update
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const ox = (Math.random() * 2 - 1) * this.shakeMagnitude;
      const oy = (Math.random() * 2 - 1) * this.shakeMagnitude;
      this.gameStage.x = ox;
      this.gameStage.y = oy;
      this.shakeMagnitude *= 0.88;
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
    this.splatters.clear();
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

    // Sticky juice decal on cedar planks
    this.splatters.addSplatter(hitPoint.x, hitPoint.y, def.juiceColor);

    // Particle sprays in the fruit's color
    this.particles.emitJuiceSplash(hitPoint.x, hitPoint.y, def.juiceColor, 28);
    audioManager.playFruitSplat();
    this.options?.sendHaptic([25]);

    // Multi-fruit combo tracking
    this.currentCombo++;
    if (this.comboTimer) clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => {
      this.currentCombo = 0;
    }, 300);

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

    this.shakeDuration = 0.5;
    this.shakeMagnitude = 22;
    this.currentCombo = 0;

    // Hitting a bomb detonates and triggers Game Over
    while ((this.hud?.getStrikes() ?? 0) < 3) {
      this.hud?.addStrike();
    }
    this.isGameOver = true;
  }

  private handleFruitMissed(_fruit: FruitEntity): void {
    if (this.isGameOver) return;
    const strikes = this.hud?.addStrike() ?? 0;
    audioManager.playStrikeBuzz();
    this.options?.sendHaptic([40, 30, 40]);
    if (strikes >= 3) {
      this.isGameOver = true;
    }
  }

  private updateSpawner(dt: number): void {
    this.timeSinceLastSpawn += dt;
    this.waveTimer += dt;

    if (this.waveTimer >= 14) {
      this.waveTimer = 0;
      this.waveNumber++;
      this.spawnInterval = Math.max(1.2, 2.4 - this.waveNumber * 0.12);
    }

    if (this.timeSinceLastSpawn >= this.spawnInterval) {
      this.timeSinceLastSpawn = 0;
      this.tossFruitCluster();
    }
  }

  private tossFruitCluster(): void {
    const clusterSize = Math.min(4, 1 + Math.floor(Math.random() * (1 + this.waveNumber * 0.5)));
    const types: FruitType[] = ['watermelon', 'orange', 'lemon', 'strawberry', 'apple'];

    for (let i = 0; i < clusterSize; i++) {
      const isBomb = Math.random() < Math.min(0.35, 0.08 + this.waveNumber * 0.04);
      const type = isBomb ? 'bomb' : types[Math.floor(Math.random() * types.length)];

      const x = 360 + Math.random() * (1920 - 720);
      const y = 1120;

      // Parabolic trajectories targeted toward screen center
      const vx = (960 - x) * (0.22 + Math.random() * 0.28) + (Math.random() * 200 - 100);
      const vy = -(980 + Math.random() * 260);
      const vRot = (Math.random() * 2 - 1) * 3.8;

      this.entityManager.spawnFruit(type, x, y, vx, vy, vRot);
    }
  }

  private restartGame(): void {
    this.entityManager.clear();
    this.splatters.clear();
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
