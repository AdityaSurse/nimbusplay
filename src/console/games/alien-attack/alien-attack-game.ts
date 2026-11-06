/**
 * NimbusPlay — Alien Attack Master Game Loop
 * Implements IGame with 60 FPS PixiJS forward-flight rail shooter rendering,
 * landscape phone tilt steering & dual firing, procedural graphics, and green hearts HUD.
 * Strictly typed with zero `any`. Target < 350 lines.
 */

import { Application, Container } from 'pixi.js';
import type { IGame, GameInputState, GameOptions } from '../common/game-interface.js';
import { SpaceBackdrop } from './space-backdrop.js';
import { PlayerShip } from './player-ship.js';
import { EnemyManager } from './enemy-manager.js';
import { AlienHUD } from './alien-hud.js';
import { gameSfx } from '../../audio/game-sfx.js';
import { audioManager } from '../../audio/audio-manager.js';
import { BUTTON_MASKS } from '../../../shared/protocol.js';
import { GameEndModal } from '../common/game-end-modal.js';

export class AlienAttackGame implements IGame {
  public readonly id = 'alienAttack';
  public readonly title = 'Alien Attack';

  private app: Application | null = null;
  private gameStage = new Container();
  private options: GameOptions | null = null;
  private endModal: GameEndModal | null = null;

  private backdrop!: SpaceBackdrop;
  private playerShip!: PlayerShip;
  private enemyManager!: EnemyManager;
  private hud!: AlienHUD;

  private isPaused = false;
  private isGameOver = false;
  private shakeDuration = 0;
  private shakeMagnitude = 0;
  private lastWaveAnnounced = 1;

  // Keyboard controls fallback
  private keysPressed = new Set<string>();
  private keydownHandler = (e: KeyboardEvent) => this.keysPressed.add(e.code);
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

    // 1. Setup Layered Subsystems
    this.backdrop = new SpaceBackdrop(options.width, options.height);
    this.gameStage.addChild(this.backdrop.container);

    this.playerShip = new PlayerShip(options.width, options.height);
    this.gameStage.addChild(this.playerShip.container);

    this.enemyManager = new EnemyManager(options.width, options.height, {
      onScore: (pts) => {
        this.hud.addScore(pts);
        this.options?.onScoreUpdate?.(this.hud.getScore());
      },
      onEnemyKilled: (_type, _x, _y) => {
        gameSfx.playAlienExplosion();
        this.options?.sendHaptic([35]);
      },
      onPlayerHit: () => this.handlePlayerHit(),
      onPowerUpCollected: (_type) => this.handlePowerUp()
    });
    this.gameStage.addChild(this.enemyManager.container);

    this.hud = new AlienHUD({
      onRestart: () => this.restartGame(),
      onExit: () => options.onExitToMenu()
    });
    this.gameStage.addChild(this.hud.container);

    this.endModal = new GameEndModal(container);

    // 2. Request Landscape Flight Deck mode on mobile controller
    this.options.setLayoutMode?.('landscape');

    // 3. Audio & UI Init
    audioManager.initOnGesture();
    audioManager.playLaunchChime();
    this.hud.showWave(1);

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
  }

  private handlePlayerHit(): void {
    const { shieldAbsorbed, isDead } = this.playerShip.hit();
    this.triggerScreenShake(0.35, 16);

    if (shieldAbsorbed) {
      this.hud.setShieldActive(false);
      gameSfx.playStrikeBuzz();
      this.options?.sendHaptic([60, 40, 60]);
    } else {
      this.hud.setLives(this.playerShip.lives);
      gameSfx.playBombExplode();
      this.options?.sendHaptic([100, 60, 120]);

      if (isDead) {
        this.isGameOver = true;
        this.endModal?.show({
          title: 'MISSION FAILED',
          score: this.hud.getScore(),
          accentColor: '#ef4444',
          restartLabel: 'Retry',
          onRestart: () => this.restartGame(),
          onExit: () => this.exit()
        });
      }
    }
  }

  private handlePowerUp(): void {
    this.playerShip.activateShield();
    this.hud.setShieldActive(true);
    gameSfx.playComboChime(5);
    this.options?.sendHaptic([30, 20, 60]);
  }

  public update(input: GameInputState, dt: number): void {
    if (this.isPaused || this.isGameOver || !this.app) return;

    // 1. Check for Wave Announcements
    const currentWave = this.enemyManager.getWave();
    if (currentWave !== this.lastWaveAnnounced) {
      this.lastWaveAnnounced = currentWave;
      this.hud.showWave(currentWave);
      gameSfx.playComboChime(3);
    }

    // 2. Process Steering Input (Landscape Tilt + Pointer/Keyboard Fallbacks)
    let steeringHandled = false;

    // A. Keyboard Controls (A/D or Left/Right Arrow)
    if (this.keysPressed.has('ArrowLeft') || this.keysPressed.has('KeyA')) {
      this.playerShip.steerWithTilt(-1.0, dt);
      steeringHandled = true;
    } else if (this.keysPressed.has('ArrowRight') || this.keysPressed.has('KeyD')) {
      this.playerShip.steerWithTilt(1.0, dt);
      steeringHandled = true;
    }

    // B. Landscape Accelerometer Tilt
    if (!steeringHandled && input.accel) {
      // In landscape phone grip, gravity shifts onto Y axis when rolling sideways
      const tiltRaw = input.accel.y;
      if (Math.abs(tiltRaw) > 0.4) {
        const normalizedTilt = Math.max(-1, Math.min(1, tiltRaw / 5.2));
        this.playerShip.steerWithTilt(normalizedTilt, dt);
        steeringHandled = true;
      }
    }

    // C. Gyro Roll Fallback (when phone is rotated sideways)
    if (!steeringHandled && input.gyro && Math.abs(input.gyro.beta) > 3.0) {
      const gyroTilt = Math.max(-1, Math.min(1, input.gyro.beta / 45.0));
      this.playerShip.steerWithTilt(gyroTilt, dt);
      steeringHandled = true;
    }

    // D. Cursor / Pointer Fallback
    if (!steeringHandled && typeof input.pointerX === 'number') {
      this.playerShip.steerTowardPointer(input.pointerX, dt);
    }

    // 3. Process Firing (A Button, B Trigger, or Spacebar / Left Click)
    const isFireBtn = (input.rawBitmask & (BUTTON_MASKS.A | BUTTON_MASKS.B)) !== 0;
    const isKeyFire = this.keysPressed.has('Space') || this.keysPressed.has('KeyJ') || this.keysPressed.has('KeyK');
    const wantsToFire = isFireBtn || isKeyFire || input.isTriggerPressed || input.isSliceHeld;

    if (wantsToFire) {
      const bolts = this.playerShip.fireLasers();
      if (bolts) {
        this.enemyManager.addLasers(bolts);
        gameSfx.playLaserFire();
        this.options?.sendHaptic([18]);
      }
    }

    // 4. Update Game Subsystems
    this.backdrop.update(dt);
    this.playerShip.update(dt);
    this.enemyManager.update(dt, this.playerShip.x, this.playerShip.y, 35);

    // 5. Update Screen Shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const ox = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      const oy = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      this.gameStage.position.set(ox, oy);
    } else {
      this.gameStage.position.set(0, 0);
    }
  }

  public render(): void {
    // PixiJS ticker handles render automatically
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  private triggerScreenShake(duration: number, magnitude: number): void {
    this.shakeDuration = duration;
    this.shakeMagnitude = magnitude;
  }

  public restartGame(): void {
    this.endModal?.hide();
    this.isGameOver = false;
    this.isPaused = false;
    this.lastWaveAnnounced = 1;
    this.playerShip.reset(this.options?.width ?? 1920, this.options?.height ?? 1080);
    this.enemyManager.reset();
    this.hud.reset();
    this.hud.showWave(1);
    audioManager.playLaunchChime();
  }

  public restart(): void {
    this.restartGame();
  }

  public exit(): void {
    this.options?.onExitToMenu();
  }

  public destroy(): void {
    // Return phone controller to standard portrait wand
    this.options?.setLayoutMode?.('portrait');

    this.endModal?.destroy();
    this.endModal = null;

    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);

    this.backdrop.destroy();
    this.playerShip.destroy();
    this.enemyManager.destroy();
    this.hud.destroy();

    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
}

