/**
 * NimbusPlay — Pointer Settings Persistence Manager
 * Manages sensitivity, One Euro smoothing, and dead zone settings in localStorage.
 */

import { DEFAULT_POINTER_SETTINGS } from './pipeline.js';
import type { PointerSettings } from './types.js';

const SETTINGS_STORAGE_KEY = 'nimbusplay_pointer_settings';

export class SettingsManager {
  private currentSettings: PointerSettings;

  constructor() {
    this.currentSettings = this.load();
  }

  public getSettings(): PointerSettings {
    return { ...this.currentSettings };
  }

  public update(partial: Partial<PointerSettings>): PointerSettings {
    this.currentSettings = { ...this.currentSettings, ...partial };
    this.save();
    return this.getSettings();
  }

  public resetToDefaults(): PointerSettings {
    this.currentSettings = { ...DEFAULT_POINTER_SETTINGS };
    this.save();
    return this.getSettings();
  }

  private load(): PointerSettings {
    if (typeof localStorage === 'undefined') {
      return { ...DEFAULT_POINTER_SETTINGS };
    }
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PointerSettings>;
        return { ...DEFAULT_POINTER_SETTINGS, ...parsed };
      }
    } catch (err) {
      console.warn('[SettingsManager] Failed to read settings from storage:', err);
    }
    return { ...DEFAULT_POINTER_SETTINGS };
  }

  private save(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.currentSettings));
    } catch (err) {
      console.warn('[SettingsManager] Failed to save settings to storage:', err);
    }
  }
}
