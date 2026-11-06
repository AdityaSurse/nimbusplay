/**
 * NimbusPlay — Procedural Game Sound Effects Synthesizer
 * Synthesizes dynamic game audio effects for Slice Party and Bowl Blitz.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { audioContextManager } from './audio-context.js';
import { starSfx } from './star-sfx.js';

export class GameSfxSynthesizer {
  /**
   * Blade whoosh: shaped filtered noise sweep
   */
  public playBladeWhoosh(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    const noiseBuffer = audioContextManager.getNoiseBuffer();
    if (!ctx || !master || !noiseBuffer || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.0;
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.05);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start(now);
    noise.stop(now + 0.14);
  }

  /**
   * Fruit slice splat: FM pitch plunge with juicy noise transient
   */
  public playFruitSplat(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    const noiseBuffer = audioContextManager.getNoiseBuffer();
    if (!ctx || !master || !noiseBuffer || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(oscGain);
    oscGain.connect(master);
    osc.start(now);
    osc.stop(now + 0.11);

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);
    noise.stop(now + 0.06);
  }

  /**
   * Bomb detonation: sub-bass boom with explosive low-pass roar
   */
  public playBombExplode(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    const noiseBuffer = audioContextManager.getNoiseBuffer();
    if (!ctx || !master || !noiseBuffer || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.45);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.6, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(oscGain);
    oscGain.connect(master);
    osc.start(now);
    osc.stop(now + 0.52);

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);
    noise.stop(now + 0.5);
  }

  /**
   * Combo celebration chime: rising harmonic intervals
   */
  public playComboChime(comboCount: number): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const baseFreqs = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    const freq = baseFreqs[Math.min(comboCount - 2, baseFreqs.length - 1)] || 784;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  // Delegate Star Defender SFX to starSfx module
  public playLaserFire(): void { starSfx.playLaserFire(); }
  public playChargedBlast(): void { starSfx.playChargedBlast(); }
  public playChargeHum(progress: number): void { starSfx.playChargeHum(progress); }
  public playAlienExplosion(): void { starSfx.playAlienExplosion(); }
  public playBossHit(): void { starSfx.playBossHit(); }
  public playShieldDeflect(): void { starSfx.playShieldDeflect(); }
  public playPowerupCollect(): void { starSfx.playPowerupCollect(); }

  /**
   * Bowling Pin Collision: Multi-tone resonant pulse
   */
  public playBowlingPinHit(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    [480, 720, 1140, 1420].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, now + 0.18);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.24);
    });
  }
}

export const gameSfx = new GameSfxSynthesizer();
