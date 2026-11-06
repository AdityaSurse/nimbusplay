/**
 * NimbusPlay — Console Game Session Manager
 * Orchestrates game initialization, input forwarding, pause overlays, and clean teardowns.
 * Strictly typed with zero `any`.
 */

import type { IGame, GameInputState, GameOptions } from './common/game-interface.js';
import { SlicePartyGame } from './slice-party/slice-party-game.js';
import { AlienAttackGame } from './alien-attack/alien-attack-game.js';
import { ShootingRangeGame } from './shooting-range/shooting-range-game.js';
import { SketchGame } from './sketch/sketch-game.js';

export class GameManager {
  private activeGame: IGame | null = null;
  private isGameRunningState = false;
  private container: HTMLElement;
  private onStateChange: (isRunning: boolean) => void;
  private lastTime = 0;

  constructor(container: HTMLElement, onStateChange: (isRunning: boolean) => void) {
    this.container = container;
    this.onStateChange = onStateChange;
  }

  public isGameRunning(): boolean {
    return this.isGameRunningState;
  }

  public getActiveGame(): IGame | null {
    return this.activeGame;
  }

  public async launchGame(gameId: string, options: Omit<GameOptions, 'width' | 'height' | 'onExitToMenu'>): Promise<boolean> {
    if (this.activeGame) {
      this.teardown();
    }

    let game: IGame | null = null;
    if (gameId === 'fruitNinja' || gameId === 'sliceParty') {
      game = new SlicePartyGame();
    } else if (gameId === 'alienAttack') {
      game = new AlienAttackGame();
    } else if (gameId === 'shootingRange') {
      game = new ShootingRangeGame();
    } else if (gameId === 'sketch') {
      game = new SketchGame();
    }

    if (!game) {
      console.warn(`[GameManager] Game not yet loaded or unknown id: ${gameId}`);
      return false;
    }

    const fullOptions: GameOptions = {
      ...options,
      width: 1920,
      height: 1080,
      onExitToMenu: () => this.teardown()
    };

    await game.init(this.container, fullOptions);
    this.activeGame = game;
    this.isGameRunningState = true;
    this.onStateChange(true);
    this.lastTime = performance.now();

    return true;
  }

  public update(input: GameInputState): void {
    if (!this.activeGame || !this.isGameRunningState) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this.activeGame.update(input, dt);
  }

  public pause(): void {
    if (this.activeGame) {
      this.activeGame.pause();
    }
  }

  public resume(): void {
    if (this.activeGame) {
      this.activeGame.resume();
      this.lastTime = performance.now();
    }
  }

  public teardown(): void {
    if (this.activeGame) {
      this.activeGame.destroy();
      this.activeGame = null;
    }
    this.isGameRunningState = false;
    this.onStateChange(false);
  }
}
