/**
 * NimbusPlay — Unified Procedural Web Audio Facade
 * Connects Menu SFX, Ambience Synthesizer, and Game SFX.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { audioContextManager } from './audio-context.js';
import { menuSfx } from './menu-sfx.js';
import { ambience } from './ambience.js';
import { gameSfx } from './game-sfx.js';

export class AudioManager {
  public initOnGesture(): void {
    audioContextManager.initOnGesture();
    ambience.start();
  }

  public setMuted(muted: boolean): void {
    audioContextManager.setMasterMuted(muted);
  }

  // --- Menu Sound Effects ---
  public playHoverTick(): void {
    menuSfx.playHoverTick();
  }

  public playSelect(): void {
    menuSfx.playSelect();
  }

  public playBack(): void {
    menuSfx.playBack();
  }

  public playPageTurn(): void {
    menuSfx.playPageTurn();
  }

  public playClick(): void {
    menuSfx.playClick();
  }

  public playLaunchChime(): void {
    menuSfx.playLaunchChime();
  }

  public playStartupChime(): void {
    menuSfx.playStartupChime();
  }

  // --- Background Ambience ---
  public startAmbience(): void {
    ambience.start();
  }

  public stopAmbience(): void {
    ambience.stop();
  }

  public toggleAmbience(): boolean {
    return ambience.toggleMute();
  }

  public isAmbienceMuted(): boolean {
    return ambience.isMuted();
  }

  public setAmbienceMuted(muted: boolean): void {
    ambience.setMuted(muted);
  }

  // --- Game Sound Effects ---
  public playBladeWhoosh(): void {
    gameSfx.playBladeWhoosh();
  }

  public playFruitSplat(): void {
    gameSfx.playFruitSplat();
  }

  public playBombExplode(): void {
    gameSfx.playBombExplode();
  }

  public playComboChime(comboCount: number): void {
    gameSfx.playComboChime(comboCount);
  }

  public playStrikeBuzz(): void {
    gameSfx.playStrikeBuzz();
  }

  public playLaserFire(): void {
    gameSfx.playLaserFire();
  }

  public playAlienExplosion(): void {
    gameSfx.playAlienExplosion();
  }

  public playBullseyeBell(): void {
    gameSfx.playBullseyeBell();
  }

  public playCarnivalPop(): void {
    gameSfx.playCarnivalPop();
  }
}

export const audioManager = new AudioManager();
