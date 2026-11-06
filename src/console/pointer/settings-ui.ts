/**
 * NimbusPlay — Console Pointer Settings & System UI Binder
 * Connects DOM sliders, toggles, and resets for pointer tuning.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import type { SettingsManager } from './settings-manager.js';
import type { PointerPipeline } from './pipeline.js';

export interface SettingsUiCallbacks {
  recenterPointer: () => void;
  openCalibration: () => void;
  closeSettings: () => void;
}

export class SettingsUiBinder {
  public static bind(
    settingsManager: SettingsManager,
    pipeline: PointerPipeline,
    callbacks: SettingsUiCallbacks
  ): void {
    const sliderSens = document.getElementById('setting-sensitivity') as HTMLInputElement | null;
    const sliderSmooth = document.getElementById('setting-smoothing') as HTMLInputElement | null;
    const sliderDead = document.getElementById('setting-deadzone') as HTMLInputElement | null;

    const labelSens = document.getElementById('label-val-sensitivity');
    const labelSmooth = document.getElementById('label-val-smoothing');
    const labelDead = document.getElementById('label-val-deadzone');

    const btnReset = document.getElementById('btn-settings-reset');
    const btnRecenter = document.getElementById('btn-settings-recenter');
    const btnCalib = document.getElementById('btn-settings-calibrate');
    const btnClose = document.getElementById('btn-settings-close');

    const cur = settingsManager.getSettings();
    if (sliderSens) sliderSens.value = cur.sensitivity.toString();
    if (sliderSmooth) sliderSmooth.value = cur.minCutoff.toString();
    if (sliderDead) sliderDead.value = cur.deadZone.toString();
    if (labelSens) labelSens.textContent = `${cur.sensitivity.toFixed(1)}x`;
    if (labelSmooth) labelSmooth.textContent = `${cur.minCutoff.toFixed(1)} Hz`;
    if (labelDead) labelDead.textContent = `${cur.deadZone.toFixed(1)} deg/s`;

    sliderSens?.addEventListener('input', () => {
      const val = parseFloat(sliderSens.value);
      if (labelSens) labelSens.textContent = `${val.toFixed(1)}x`;
      settingsManager.update({ sensitivity: val });
      pipeline.updateSettings({ sensitivity: val });
    });

    sliderSmooth?.addEventListener('input', () => {
      const val = parseFloat(sliderSmooth.value);
      if (labelSmooth) labelSmooth.textContent = `${val.toFixed(1)} Hz`;
      settingsManager.update({ minCutoff: val });
      pipeline.updateSettings({ minCutoff: val });
    });

    sliderDead?.addEventListener('input', () => {
      const val = parseFloat(sliderDead.value);
      if (labelDead) labelDead.textContent = `${val.toFixed(1)} deg/s`;
      settingsManager.update({ deadZone: val });
      pipeline.updateSettings({ deadZone: val });
    });

    btnReset?.addEventListener('click', () => {
      const def = settingsManager.resetToDefaults();
      if (sliderSens) sliderSens.value = def.sensitivity.toString();
      if (sliderSmooth) sliderSmooth.value = def.minCutoff.toString();
      if (sliderDead) sliderDead.value = def.deadZone.toString();
      if (labelSens) labelSens.textContent = `${def.sensitivity.toFixed(1)}x`;
      if (labelSmooth) labelSmooth.textContent = `${def.minCutoff.toFixed(1)} Hz`;
      if (labelDead) labelDead.textContent = `${def.deadZone.toFixed(1)} deg/s`;
      pipeline.updateSettings(def);
    });

    btnRecenter?.addEventListener('click', () => callbacks.recenterPointer());
    btnCalib?.addEventListener('click', () => {
      callbacks.closeSettings();
      callbacks.openCalibration();
    });
    btnClose?.addEventListener('click', () => callbacks.closeSettings());
  }
}
