/**
 * NimbusPlay — Procedural Menu & Firmware Sound Effects
 * 100% synthesized in real time via Web Audio API. Zero external audio assets.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { audioContextManager } from './audio-context.js';

export class MenuSfxSynthesizer {
  private lastTickTime = 0;

  /**
   * Hover Tick: Ultra-short high-frequency crisp tick when moving over tiles or buttons
   */
  public playHoverTick(): void {
    const nowMs = performance.now();
    // Throttle hover ticks to avoid saturation during fast sweeps
    if (nowMs - this.lastTickTime < 38) return;
    this.lastTickTime = nowMs;

    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.016);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.02);
  }

  /**
   * Select Sound: Crisp confirmation double-chime (880Hz + 1320Hz)
   */
  public playSelect(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    [880, 1320].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.035);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.035 + 0.08);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.09);
    });
  }

  /**
   * Back Sound: Gentle descending cancellation tone (660Hz down to 380Hz)
   */
  public playBack(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.09);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * Page Turn Sound: Soft airy flick/whoosh when paging channel matrix
   */
  public playPageTurn(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    const noiseBuffer = audioContextManager.getNoiseBuffer();
    if (!ctx || !master || !noiseBuffer || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 2.4;
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.045);
    filter.frequency.exponentialRampToValueAtTime(450, now + 0.11);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start(now);
    noise.stop(now + 0.13);
  }

  /**
   * Channel / Button Click: Sine envelope pulse (1200Hz -> 600Hz in 40ms)
   */
  public playClick(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  /**
   * Launch Chime: Dual harmonic chime (E5 + B5)
   */
  public playLaunchChime(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    [659.25, 987.77].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.04);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.6);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.65);
    });
  }

  /**
   * Console Startup Chime: Original 4-note ascending celestial chord with gentle shimmer
   * F#4 (370Hz) -> B4 (493.88Hz) -> D#5 (622.25Hz) -> F#5 (739.99Hz)
   */
  public playStartupChime(): void {
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master || audioContextManager.isMuted()) return;

    const now = ctx.currentTime;
    const notes = [369.99, 493.88, 622.25, 739.99];

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.09;

      // Primary crystal sine
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Warm octave overtone
      const sub = ctx.createOscillator();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(freq * 0.5, startTime);

      const noteGain = ctx.createGain();
      const vol = idx === notes.length - 1 ? 0.28 : 0.2;
      noteGain.gain.setValueAtTime(0.001, startTime);
      noteGain.gain.linearRampToValueAtTime(vol, startTime + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

      osc.connect(noteGain);
      sub.connect(noteGain);
      noteGain.connect(master);

      osc.start(startTime);
      sub.start(startTime);
      osc.stop(startTime + 1.25);
      sub.stop(startTime + 1.25);
    });
  }
}

export const menuSfx = new MenuSfxSynthesizer();

