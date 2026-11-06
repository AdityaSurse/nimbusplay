/**
 * NimbusPlay — Pointer Settings Persistence Manager
 * Manages sensitivity, One Euro smoothing, and dead zone settings in localStorage,
 * with per-game profiles and fallback to global defaults.
 * Strictly typed with zero `any`. Target < 200 lines.
 */

import { DEFAULT_POINTER_SETTINGS } from './pipeline.js';
import type { PointerSettings } from './types.js';

const GLOBAL_STORAGE_KEY = 'nimbusplay_pointer_settings';

export class SettingsManager {
  private activeGameId = 'global';
  private currentSettings: PointerSettings;
  private memoryStore = new Map<string, string>();

  constructor() {
    this.currentSettings = this.load('global');
  }

  public setActiveGame(gameId?: string | null): PointerSettings {
    this.activeGameId = gameId || 'global';
    this.currentSettings = this.load(this.activeGameId);
    return this.getSettings();
  }

  public getActiveGameId(): string {
    return this.activeGameId;
  }

  public getSettings(): PointerSettings {
    return { ...this.currentSettings };
  }

  public getSettingsForGame(gameId?: string | null): PointerSettings {
    return this.load(gameId || 'global');
  }

  public update(partial: Partial<PointerSettings>): PointerSettings {
    return this.updateForGame(partial, this.activeGameId);
  }

  public updateForGame(partial: Partial<PointerSettings>, gameId?: string | null): PointerSettings {
    const targetGame = gameId || this.activeGameId;
    const base = this.load(targetGame);
    const updated = { ...base, ...partial };
    if (targetGame === this.activeGameId) {
      this.currentSettings = updated;
    }
    this.save(targetGame, updated);
    return { ...updated };
  }

  public resetToDefaults(gameId?: string | null): PointerSettings {
    const targetGame = gameId || this.activeGameId;
    this.currentSettings = { ...DEFAULT_POINTER_SETTINGS };
    this.save(targetGame, this.currentSettings);
    return this.getSettings();
  }

  private getStorageKey(gameId: string): string {
    return gameId === 'global' ? GLOBAL_STORAGE_KEY : `${GLOBAL_STORAGE_KEY}_${gameId}`;
  }

  private load(gameId: string): PointerSettings {
    const key = this.getStorageKey(gameId);
    let raw: string | null = null;
    if (typeof localStorage !== 'undefined') {
      try {
        raw = localStorage.getItem(key);
      } catch { /* ignore */ }
    }
    if (!raw) {
      raw = this.memoryStore.get(key) ?? null;
    }

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<PointerSettings>;
        return { ...DEFAULT_POINTER_SETTINGS, ...parsed };
      } catch { /* ignore */ }
    }

    // Fallback to global settings if game-specific not yet saved
    if (gameId !== 'global') {
      let globalRaw: string | null = null;
      if (typeof localStorage !== 'undefined') {
        try { globalRaw = localStorage.getItem(GLOBAL_STORAGE_KEY); } catch { /* ignore */ }
      }
      if (!globalRaw) {
        globalRaw = this.memoryStore.get(GLOBAL_STORAGE_KEY) ?? null;
      }
      if (globalRaw) {
        try {
          const parsed = JSON.parse(globalRaw) as Partial<PointerSettings>;
          return { ...DEFAULT_POINTER_SETTINGS, ...parsed };
        } catch { /* ignore */ }
      }
    }
    return { ...DEFAULT_POINTER_SETTINGS };
  }

  private save(gameId: string, settings: PointerSettings): void {
    const key = this.getStorageKey(gameId);
    const json = JSON.stringify(settings);
    this.memoryStore.set(key, json);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, json);
      } catch (err) {
        console.warn('[SettingsManager] Failed to save settings to storage:', err);
      }
    }
  }
}
