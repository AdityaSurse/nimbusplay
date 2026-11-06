/**
 * NimbusPlay — Sketch Master Drawing Loop
 * Implements IGame with 60 FPS PixiJS whiteboard canvas, left vertical palette,
 * quadratic curve smoothing, eraser, undo, and preloaded "I ❤️ VIBECODING" reference artwork.
 * Strictly typed with zero `any`. Target < 350 lines.
 */

import { Application, Container } from 'pixi.js';
import type { IGame, GameInputState, GameOptions } from '../common/game-interface.js';
import { SketchToolbar } from './toolbar.js';
import { StrokeRenderer } from './stroke-renderer.js';
import { PenCursor } from './pen-cursor.js';
import { SampleArtwork } from './sample-artwork.js';
import { gameSfx } from '../../audio/game-sfx.js';
import { audioManager } from '../../audio/audio-manager.js';
import { BUTTON_MASKS } from '../../../shared/protocol.js';

export class SketchGame implements IGame {
  public readonly id = 'sketch';
  public readonly title = 'Sketch';

  private app: Application | null = null;
  private gameStage = new Container();
  private options: GameOptions | null = null;

  private strokeRenderer!: StrokeRenderer;
  private toolbar!: SketchToolbar;
  private penCursor!: PenCursor;

  private isPaused = false;
  private wasDrawing = false;
  private wasActionButtonDown = false;
  private lastToolbarActionTimer = 0;

  // Keyboard shortcut handlers
  private keydownHandler = (e: KeyboardEvent) => {
    if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
      this.strokeRenderer.undo();
      gameSfx.playCarnivalPop();
    } else if (e.code === 'KeyC') {
      this.strokeRenderer.clear();
      gameSfx.playCarnivalPop();
    } else if (e.code === 'KeyE') {
      this.toolbar.hitTest(36, 680); // trigger eraser
    }
  };

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

    // 1. Layered Subsystems: Canvas Strokes -> Palette Toolbar -> Pen Cursor
    this.strokeRenderer = new StrokeRenderer(options.width, options.height);
    this.gameStage.addChild(this.strokeRenderer.container);

    this.toolbar = new SketchToolbar();
    this.gameStage.addChild(this.toolbar.container);

    this.penCursor = new PenCursor();
    this.gameStage.addChild(this.penCursor.container);

    // 2. Controller in standard portrait wand mode
    this.options.setLayoutMode?.('portrait');

    // 3. Preload reference sample marker drawing ("I ❤️ VIBECODING")
    this.strokeRenderer.loadStrokes(SampleArtwork.getSampleStrokes());

    audioManager.initOnGesture();
    audioManager.playLaunchChime();

    window.addEventListener('keydown', this.keydownHandler);
  }

  public update(input: GameInputState, dt: number): void {
    if (this.isPaused || !this.app) return;

    this.lastToolbarActionTimer += dt;
    const px = typeof input.pointerX === 'number' ? input.pointerX : 960;
    const py = typeof input.pointerY === 'number' ? input.pointerY : 540;

    const isActionButton =
      (input.rawBitmask & (BUTTON_MASKS.A | BUTTON_MASKS.B)) !== 0 ||
      input.isTriggerPressed ||
      input.isSliceHeld;

    const actionPressedThisFrame = isActionButton && !this.wasActionButtonDown;
    this.wasActionButtonDown = isActionButton;

    const isOverToolbar = px <= 78;

    // 1. Toolbar Interactions (Left Margin)
    if (isOverToolbar) {
      if (this.wasDrawing) {
        this.strokeRenderer.endStroke();
        this.wasDrawing = false;
      }

      if (actionPressedThisFrame || (isActionButton && this.lastToolbarActionTimer > 0.22)) {
        const hit = this.toolbar.hitTest(px, py);
        if (hit.type !== 'none') {
          this.lastToolbarActionTimer = 0;
          this.handleToolbarAction(hit.type);
        }
      }
    } else {
      // 2. Canvas Freehand Drawing (Quadratic Smoothing)
      if (isActionButton) {
        if (!this.wasDrawing) {
          this.wasDrawing = true;
          this.strokeRenderer.beginStroke(
            px,
            py,
            this.toolbar.getActiveColor(),
            this.toolbar.getActiveWidth(),
            this.toolbar.getActiveMode() === 'eraser'
          );
          this.options?.sendHaptic([18]);
        } else {
          this.strokeRenderer.addPoint(px, py);
        }
      } else if (this.wasDrawing) {
        this.wasDrawing = false;
        this.strokeRenderer.endStroke();
      }
    }

    // 3. Update Pen Cursor Tip
    this.penCursor.update(
      px,
      py,
      this.toolbar.getActiveColor(),
      this.toolbar.getActiveWidth(),
      this.toolbar.getActiveMode() === 'eraser',
      this.wasDrawing,
      isOverToolbar
    );
  }

  private handleToolbarAction(type: string): void {
    if (type === 'color' || type === 'size') {
      audioManager.playHoverTick();
      this.options?.sendHaptic([20]);
    } else if (type === 'eraser') {
      audioManager.playHoverTick();
      this.options?.sendHaptic([25]);
    } else if (type === 'undo') {
      const ok = this.strokeRenderer.undo();
      if (ok) {
        gameSfx.playCarnivalPop();
        this.options?.sendHaptic([30]);
      }
    } else if (type === 'clear') {
      this.strokeRenderer.clear();
      gameSfx.playCarnivalPop();
      this.options?.sendHaptic([50, 30, 50]);
    } else if (type === 'sample') {
      this.strokeRenderer.clear();
      this.strokeRenderer.loadStrokes(SampleArtwork.getSampleStrokes());
      audioManager.playLaunchChime();
      this.options?.sendHaptic([40, 20, 60]);
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

  public restart(): void {
    this.strokeRenderer.clear();
    this.strokeRenderer.loadStrokes(SampleArtwork.getSampleStrokes());
    audioManager.playLaunchChime();
  }

  public exit(): void {
    this.options?.onExitToMenu();
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.keydownHandler);

    this.strokeRenderer.destroy();
    this.toolbar.destroy();
    this.penCursor.destroy();

    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
}

