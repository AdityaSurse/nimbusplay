/**
 * NimbusPlay — Shooting Range Master Game Loop
 * Implements IGame with 60 FPS PixiJS carnival target range, pop-up concentric bullseyes,
 * gyro pointer crosshair hitscan aiming, Web Audio effects, and timed round scoring.
 * Strictly typed with zero `any`. Target < 350 lines.
 */

import { Application, Container } from 'pixi.js';
import type { IGame, GameInputState, GameOptions } from '../common/game-interface.js';
import { RangeBackdrop } from './range-backdrop.js';
import { RangeCrosshair } from './crosshair.js';
import { TargetManager } from './target-manager.js';
import { RangeHUD } from './range-hud.js';
import { gameSfx } from '../../audio/game-sfx.js';
import { audioManager } from '../../audio/audio-manager.js';
import { BUTTON_MASKS } from '../../../shared/protocol.js';

export class ShootingRangeGame implements IGame {
  public readonly id = 'shootingRange';
  public readonly title = 'Shooting Range';

  private app: Application | null = null;
  private gameStage = new Container();
  private options: GameOptions | null = null;

  private backdrop!: RangeBackdrop;
  private crosshair!: RangeCrosshair;
  private targetManager!: TargetManager;
  private hud!: RangeHUD;

  private isPaused = false;
  private isGameOver = false;
  private roundTimer = 60.0;
  private wasFireDown = false;
  private wasMouseDown = false;

  private keysPressed = new Set<string>();
  private keydownHandler = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'KeyF' || e.code === 'Enter') {
      this.fireShot();
    }
    this.keysPressed.add(e.code);
  };
  private keyupHandler = (e: KeyboardEvent) => this.keysPressed.delete(e.code);

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
    this.app.stage.addChild(this.gameStage);

    // 1. Layered Subsystems: Backdrop -> Targets -> HUD -> Crosshair
    this.backdrop = new RangeBackdrop(options.width, options.height);
    this.gameStage.addChild(this.backdrop.container);

    this.targetManager = new TargetManager(options.width, options.height);
    this.gameStage.addChild(this.targetManager.container);

    this.hud = new RangeHUD({
      onRestart: () => this.restartRound(),
      onExit: () => options.onExitToMenu()
    });
    this.gameStage.addChild(this.hud.container);

    this.crosshair = new RangeCrosshair();
    this.gameStage.addChild(this.crosshair.container);

    // 2. Controller is in standard portrait wand mode
    this.options.setLayoutMode?.('portrait');

    audioManager.initOnGesture();
    audioManager.playLaunchChime();

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
  }

  public update(input: GameInputState, dt: number): void {
    if (this.isPaused || this.isGameOver || !this.app) return;

    // 1. Update 60-Second Round Countdown
    this.roundTimer = Math.max(0, this.roundTimer - dt);
    this.hud.setTimeLeft(this.roundTimer);

    if (this.roundTimer <= 0) {
      this.isGameOver = true;
      this.hud.showRoundOver();
      audioManager.playLaunchChime();
      return;
    }

    // 2. Aim Crosshair with Gyro Pointer or Mouse
    const targetX = typeof input.pointerX === 'number' ? input.pointerX : 960;
    const targetY = typeof input.pointerY === 'number' ? input.pointerY : 540;
    this.crosshair.setPosition(targetX, targetY);

    // 3. Detect Trigger Fire (A Button, B Trigger, or Left Click)
    const isFireBtn = (input.rawBitmask & (BUTTON_MASKS.A | BUTTON_MASKS.B)) !== 0;
    const isClick = input.isSliceHeld;

    const firePressed =
      (isFireBtn && !this.wasFireDown) ||
      (isClick && !this.wasMouseDown) ||
      input.isTriggerPressed;

    this.wasFireDown = isFireBtn;
    this.wasMouseDown = isClick;

    if (firePressed) {
      this.fireShot();
    }

    // 4. Update Subsystems
    this.backdrop.update(dt);
    this.targetManager.update(dt);
    this.crosshair.update(dt);
    this.hud.update(dt);
  }

  private fireShot(): void {
    if (this.isPaused || this.isGameOver) return;

    this.crosshair.triggerRecoil();
    const result = this.targetManager.testHitscan(this.crosshair.x, this.crosshair.y);

    this.hud.registerShot(result.hit);

    if (result.hit) {
      this.hud.addScore(result.points);
      this.options?.onScoreUpdate?.(this.hud.getScore());
      this.hud.showHitPopup(result.x, result.y, result.points, result.isBullseye);

      if (result.isBullseye) {
        gameSfx.playBullseyeBell();
        this.options?.sendHaptic([60, 25, 80]);
      } else {
        gameSfx.playCarnivalPop();
        this.options?.sendHaptic([40]);
      }
    } else {
      // Missed shot
      gameSfx.playCarnivalPop();
      this.options?.sendHaptic([18]);
    }
  }

  public render(): void {
    // Handled by PixiJS ticker
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public restartRound(): void {
    this.isGameOver = false;
    this.isPaused = false;
    this.roundTimer = 60.0;
    this.wasFireDown = false;
    this.wasMouseDown = false;
    this.targetManager.reset();
    this.hud.reset();
    audioManager.playLaunchChime();
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);

    this.backdrop.destroy();
    this.crosshair.destroy();
    this.targetManager.destroy();
    this.hud.destroy();

    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
}

