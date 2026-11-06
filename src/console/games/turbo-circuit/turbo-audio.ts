/**
 * NimbusPlay — Turbo Circuit Procedural Audio Engine
 * 100% Web Audio API synthesized SFX for racing: engine, drift, boost, items, and countdown.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { audioContextManager } from '../../audio/audio-context.js';

export class TurboAudio {
  private lastDriftTime = 0;

  private playTone(freq: number, dur: number, type: OscillatorType = 'sine', gainVal: number = 0.25): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  public playCountdownTick(isGo: boolean): void {
    this.playTone(isGo ? 1760 : 880, isGo ? 0.35 : 0.18, isGo ? 'triangle' : 'sine', 0.35);
  }

  public playDriftScreech(): void {
    const now = performance.now();
    if (now - this.lastDriftTime < 180) return;
    this.lastDriftTime = now;
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    const noiseBuffer = audioContextManager.getNoiseBuffer();
    if (!ctx || !master || !noiseBuffer || audioContextManager.isMuted()) return;

    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 6.0;
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(2200, t + 0.15);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    noise.connect(filter).connect(gain).connect(master);
    noise.start(t);
    noise.stop(t + 0.17);
  }

  public playBoostWhoosh(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    const noiseBuffer = audioContextManager.getNoiseBuffer();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(45, now + 0.35);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    sub.connect(subGain).connect(master);
    sub.start(now);
    sub.stop(now + 0.4);

    if (noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(2600, now + 0.3);
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.28, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      noise.connect(filter).connect(nGain).connect(master);
      noise.start(now);
      noise.stop(now + 0.36);
    }
  }

  public playCoinChime(): void {
    [987.77, 1318.51].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.18, 'sine', 0.22), i * 50);
    });
  }

  public playItemRouletteTick(): void {
    this.playTone(1400, 0.03, 'triangle', 0.16);
  }

  public playItemUnlock(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.15, 'triangle', 0.2), idx * 40);
    });
  }

  public playRocketLaunch(): void {
    this.playTone(440, 0.25, 'sawtooth', 0.25);
  }

  public playExplosion(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    const noiseBuffer = audioContextManager.getNoiseBuffer();
    if (!ctx || !master || audioContextManager.isMuted()) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.22);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.45, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(oscGain).connect(master);
    osc.start(now);
    osc.stop(now + 0.26);

    if (noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.3);
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.35, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      noise.connect(filter).connect(nGain).connect(master);
      noise.start(now);
      noise.stop(now + 0.34);
    }
  }

  public playFinishFanfare(): void {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.45, 'sawtooth', 0.24), i * 110);
    });
  }
}

export const turboAudio = new TurboAudio();
