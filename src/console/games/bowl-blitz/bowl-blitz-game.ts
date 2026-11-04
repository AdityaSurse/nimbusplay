/**
 * NimbusPlay — Bowl Blitz Master Game Loop
 * Implements IGame with motion gesture detection, pseudo-3D perspective bowling lane,
 * 2D pin cluster physics, official 10-frame scorecard, and instant replay.
 * Strictly typed with zero `any`.
 */

import { Application, Container, Graphics } from 'pixi.js';
import type { IGame, GameInputState, GameOptions } from '../common/game-interface.js';
import { BowlingBackdrop } from './bowling-backdrop.js';
import { BowlingScorecard } from './bowling-scorecard.js';
import { ThrowDetector } from './throw-detector.js';
import { BowlingPhysics } from './bowling-physics.js';
import { ReplaySystem } from './replay-system.js';
import { BowlingHud } from './bowling-hud.js';
import { SettingsManager } from '../../pointer/settings-manager.js';
import { audioManager } from '../../audio/audio-manager.js';
import type { PinState, ThrowParameters, ThrowStage } from './types.js';

export class BowlBlitzGame implements IGame {
  public readonly id = 'bowlBlitz';
  public readonly title = 'Bowl Blitz';

  private app: Application | null = null;
  private gameStage = new Container();
  private backdrop!: BowlingBackdrop;
  private ballGraphics = new Graphics();
  private pinsGraphics = new Graphics();
  private options: GameOptions | null = null;

  // Subsystems
  private scorecard = new BowlingScorecard();
  private throwDetector = new ThrowDetector();
  private replaySystem = new ReplaySystem();
  private hud = new BowlingHud();

  // Ball State
  private ball = { x: 960, y: 960, vx: 0, vy: 0, radius: 24, isGutter: false };
  private activeThrowParams: ThrowParameters | null = null;
  private pins: PinState[] = [];
  private stage: ThrowStage = 'ready';
  private frameDelayTimer = 0;
  private isPausedState = false;

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
    container.innerHTML = '';
    container.appendChild(app.canvas);
    this.app = app;

    this.app.stage.addChild(this.gameStage);
    this.backdrop = new BowlingBackdrop(options.width, options.height);
    this.gameStage.addChild(this.backdrop.container);
    this.gameStage.addChild(this.pinsGraphics);
    this.gameStage.addChild(this.ballGraphics);
    this.gameStage.addChild(this.hud.container);

    this.initPinRack();
    this.resetBallPosition();

    audioManager.initOnGesture();
    audioManager.playLaunchChime();
  }

  private initPinRack(keepKnocked = false): void {
    if (!keepKnocked) {
      this.pins = [];
      const deckY = 280;
      const spacingX = 36;
      const spacingY = 28;
      const rows = [[0], [-0.5, 0.5], [-1, 0, 1], [-1.5, -0.5, 0.5, 1.5]];

      let pinId = 1;
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const y = deckY + (3 - r) * spacingY;
        for (let c = 0; c < row.length; c++) {
          const x = 960 + row[c] * spacingX;
          this.pins.push({
            id: pinId++,
            x,
            y,
            initX: x,
            initY: y,
            vx: 0,
            vy: 0,
            rot: 0,
            vRot: 0,
            knocked: false,
            fallAlpha: 1.0
          });
        }
      }
    } else {
      // Remove knocked pins for 2nd roll of frame
      this.pins = this.pins.filter((p) => !p.knocked);
    }
  }

  private resetBallPosition(aimX = 960): void {
    this.ball = {
      x: Math.max(560, Math.min(1360, aimX)),
      y: 960,
      vx: 0,
      vy: 0,
      radius: 24,
      isGutter: false
    };
    this.activeThrowParams = null;
    this.stage = 'ready';
  }

  public update(input: GameInputState, dt: number): void {
    if (this.isPausedState || !this.app) return;

    // Check Game Over
    if (this.scorecard.isGameComplete()) {
      const action = this.hud.checkGameOverClick(input.pointerX, input.pointerY, input.isTriggerPressed);
      if (action === 'retry') {
        audioManager.playClick();
        this.scorecard.reset();
        this.initPinRack();
        this.resetBallPosition();
      } else if (action === 'menu') {
        audioManager.playClick();
        this.options?.onExitToMenu();
      }
      this.hud.renderGameOver(this.scorecard.getTotalScore(), false, false);
      return;
    }

    // Handle Replay Playback
    if (this.replaySystem.isPlaying()) {
      const replayFrame = this.replaySystem.update(dt);
      if (replayFrame) {
        this.ball.x = replayFrame.ballX;
        this.ball.y = replayFrame.ballY;
        this.ball.radius = replayFrame.ballRadius;
        this.renderEntities(replayFrame.pins);
      }
      return;
    }

    // Replay Trigger from HUD or minus button
    if (this.replaySystem.hasReplay() && this.stage === 'ready') {
      const isOverReplayBtn = input.pointerX >= 60 && input.pointerX <= 260 &&
                              input.pointerY >= 990 && input.pointerY <= 1040;
      if (isOverReplayBtn && input.isTriggerPressed) {
        audioManager.playClick();
        this.hud.setReplayVisible(true);
        this.replaySystem.startPlayback(() => {
          this.hud.setReplayVisible(false);
          this.resetBallPosition(input.pointerX);
        });
        return;
      }
    }

    const isPowerMode = SettingsManager.isBowlingPowerMeterEnabled();

    // 1. Ready & Throw Detection Phase
    if (this.stage === 'ready' || this.stage === 'swinging') {
      const throwParams = this.throwDetector.update(input, dt, isPowerMode);
      if (this.throwDetector.isArmedState()) {
        this.stage = 'swinging';
        this.ball.x = Math.max(560, Math.min(1360, input.pointerX));
      } else {
        this.ball.x = Math.max(560, Math.min(1360, input.pointerX));
      }

      if (throwParams) {
        // Ball Discharged!
        this.activeThrowParams = throwParams;
        this.stage = 'rolling';
        this.ball.x = throwParams.startX;
        this.ball.y = 960;
        this.ball.vy = -throwParams.speed;
        this.ball.vx = throwParams.aimAngle * 320;
        this.ball.isGutter = false;

        this.replaySystem.startRecording();
        this.options?.sendHaptic([60, 30, 80]);
      }
    }

    // 2. Rolling Ball & Physics Update
    if (this.stage === 'rolling' && this.activeThrowParams) {
      BowlingPhysics.updateBall(this.ball, this.activeThrowParams, dt);

      // Record keyframe for instant replay
      this.replaySystem.recordFrame(this.ball, this.pins, dt);

      // Check pin collisions
      const { newlyKnocked } = BowlingPhysics.resolveCollisions(this.ball, this.pins, dt);
      if (newlyKnocked > 0) {
        audioManager.playBowlingPinHit();
        this.options?.sendHaptic([100, 30, 120]);
      }

      // Ball reached the pit
      if (this.ball.y < 220) {
        this.stage = 'pinfall';
        this.frameDelayTimer = 1.6;
        this.replaySystem.stopRecording();
      }
    }

    // 3. Pinfall settling & Score Calculation
    if (this.stage === 'pinfall') {
      // Continue pin physics while settling
      BowlingPhysics.resolveCollisions(this.ball, this.pins, dt);
      this.frameDelayTimer -= dt;

      if (this.frameDelayTimer <= 0) {
        this.completeRoll();
      }
    }

    this.hud.update(dt);
    this.hud.renderScoreboard(
      this.scorecard.getFrames(),
      this.scorecard.getCurrentFrameNumber(),
      this.throwDetector.getPowerMeterProgress(),
      isPowerMode,
      this.replaySystem.hasReplay(),
      this.stage === 'rolling'
    );

    this.renderEntities();
  }

  private completeRoll(): void {
    const knockedCount = this.pins.filter((p) => p.knocked).length;
    const result = this.scorecard.recordRoll(knockedCount);

    if (result.isStrike) {
      this.hud.showBanner('STRIKE!!', '#38bdf8', 2.4);
      audioManager.playComboChime(5);
      this.options?.sendHaptic([150, 40, 150, 40, 250]);
    } else if (result.isSpare) {
      this.hud.showBanner('SPARE!', '#34d399', 2.0);
      audioManager.playComboChime(3);
      this.options?.sendHaptic([100, 30, 150]);
    } else if (knockedCount === 0) {
      this.hud.showBanner('GUTTER BALL', '#94a3b8', 1.8);
    }

    this.stage = 'frame_complete';

    setTimeout(() => {
      if (result.isFrameOver) {
        this.initPinRack(false);
      } else {
        this.initPinRack(true);
      }
      this.resetBallPosition();
    }, 1200);
  }

  private renderEntities(customPins?: Array<{ id: number; x: number; y: number; rot: number; knocked: boolean }>): void {
    // 1. Render Pins
    const pg = this.pinsGraphics;
    pg.clear();

    const pinsToRender = customPins ?? this.pins;
    for (let i = 0; i < pinsToRender.length; i++) {
      const p = pinsToRender[i];
      const scale = BowlingPhysics.getPerspectiveScale(p.y);
      const w = 12 * scale;
      const h = 24 * scale;

      // Pin Body
      pg.ellipse(p.x, p.y, w, h).fill(0xf8fafc).stroke({ width: 1.5, color: 0x94a3b8 });
      pg.circle(p.x, p.y - h * 0.85, 5 * scale).fill(0xf8fafc);
      // Red neck bands
      pg.rect(p.x - w * 0.5, p.y - h * 0.5, w, 2.5 * scale).fill(0xef4444);
      pg.rect(p.x - w * 0.5, p.y - h * 0.25, w, 2.5 * scale).fill(0xef4444);
    }

    // 2. Render Bowling Ball
    const bg = this.ballGraphics;
    bg.clear();

    if (this.stage === 'rolling' || this.stage === 'ready' || this.stage === 'swinging') {
      // Perspective drop shadow
      bg.ellipse(this.ball.x, this.ball.y + this.ball.radius * 0.7, this.ball.radius * 0.9, this.ball.radius * 0.35)
        .fill({ color: 0x000000, alpha: 0.35 });

      // Cobalt marbled bowling ball
      bg.circle(this.ball.x, this.ball.y, this.ball.radius).fill(0x1e3a8a).stroke({ width: 2, color: 0x38bdf8 });
      bg.circle(this.ball.x - this.ball.radius * 0.3, this.ball.y - this.ball.radius * 0.3, this.ball.radius * 0.3)
        .fill({ color: 0xffffff, alpha: 0.35 });

      // 3 finger holes
      const holeR = Math.max(2, this.ball.radius * 0.14);
      bg.circle(this.ball.x - 4, this.ball.y - 2, holeR).fill(0x0f172a);
      bg.circle(this.ball.x + 4, this.ball.y - 2, holeR).fill(0x0f172a);
      bg.circle(this.ball.x, this.ball.y + 6, holeR).fill(0x0f172a);
    }
  }

  public render(): void {}
  public pause(): void { this.isPausedState = true; }
  public resume(): void { this.isPausedState = false; }

  public destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
}
