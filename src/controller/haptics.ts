/**
 * NimbusPlay — Mobile Controller Haptics Subsystem
 * Centralizes physical vibration patterns, rate-limiting, and user preferences.
 * Strictly typed with zero `any`. Target < 200 lines.
 */

import type { HapticWaveformType } from '../shared/protocol.js';

export const HAPTIC_PATTERNS: Record<HapticWaveformType, number[]> = {
  click: [15],
  slice: [25, 20, 40],
  laser: [20, 15, 20],
  target_hit: [45, 25, 60],
  kart_boost: [35, 20, 35, 20, 70],
  wall_bump: [120]
};

const STORAGE_KEY = 'nimbusplay_haptics_enabled';
const MIN_INTERVAL_MS = 35;

export class HapticsManager {
  private enabled = true;
  private lastVibrationTime = 0;

  constructor() {
    this.enabled = this.loadSetting();
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.saveSetting(enabled);
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /**
   * Triggers a specific named waveform or raw pattern.
   * Rate-limited to prevent hardware motor saturation.
   */
  public trigger(input: HapticWaveformType | number | number[]): boolean {
    if (!this.enabled) return false;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return false;
    }

    const now = performance.now();
    if (now - this.lastVibrationTime < MIN_INTERVAL_MS) {
      return false; // Skip to prevent motor saturation
    }

    let pattern: number | number[];
    if (typeof input === 'string') {
      pattern = HAPTIC_PATTERNS[input] ?? [20];
    } else {
      pattern = input;
    }

    try {
      const ok = navigator.vibrate(pattern);
      if (ok) {
        this.lastVibrationTime = now;
      }
      return ok;
    } catch {
      return false;
    }
  }

  public playClick(): boolean {
    return this.trigger('click');
  }

  public playSlice(): boolean {
    return this.trigger('slice');
  }

  public playLaser(): boolean {
    return this.trigger('laser');
  }

  public playTargetHit(): boolean {
    return this.trigger('target_hit');
  }

  public playKartBoost(): boolean {
    return this.trigger('kart_boost');
  }

  public playWallBump(): boolean {
    return this.trigger('wall_bump');
  }

  private loadSetting(): boolean {
    if (typeof localStorage === 'undefined') return true;
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      return val !== null ? val === 'true' : true;
    } catch {
      return true;
    }
  }

  private saveSetting(enabled: boolean): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // Ignore
    }
  }
}

