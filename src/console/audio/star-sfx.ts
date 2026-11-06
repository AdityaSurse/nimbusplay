/**
 * NimbusPlay — Procedural Sound Effects for Star Defender
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { audioContextManager } from './audio-context.js';

export class StarSfxSynthesizer {
  public playLaserFire(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playChargedBlast(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    const noiseBuffer = audioContextManager.getNoiseBuffer();
    if (!ctx || !master || !noiseBuffer || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.55, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(oscGain);
    oscGain.connect(master);
    osc.start(now);
    osc.stop(now + 0.4);

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.35);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);
    noise.stop(now + 0.38);
  }

  public playChargeHum(progress: number): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const freq = 300 + Math.min(progress, 1) * 900;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  public playAlienExplosion(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    const noiseBuffer = audioContextManager.getNoiseBuffer();
    if (!ctx || !master || !noiseBuffer || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.16);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(oscGain);
    oscGain.connect(master);
    osc.start(now);
    osc.stop(now + 0.19);

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.8;
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);
    noise.stop(now + 0.23);
  }

  public playBossHit(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    [320, 480, 840].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.15);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.17);
    });
  }

  public playShieldDeflect(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.linearRampToValueAtTime(2400, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playPowerupCollect(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    [587.33, 880.00, 1174.66].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.28);
    });
  }
}

export const starSfx = new StarSfxSynthesizer();

