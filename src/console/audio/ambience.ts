/**
 * NimbusPlay — Procedural Background Ambience Synthesizer
 * Continuous soothing celestial drone pad with LFO filter sweeps.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { audioContextManager } from './audio-context.js';

export class AmbienceSynthesizer {
  private isPlaying = false;
  private isMutedState = false;
  private ambienceGain: GainNode | null = null;
  private nodes: Array<OscillatorNode | GainNode | BiquadFilterNode> = [];

  constructor() {
    this.isMutedState = typeof localStorage !== 'undefined'
      ? localStorage.getItem('nimbusplay_ambience_muted') === 'true'
      : false;
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public setMuted(muted: boolean): void {
    this.isMutedState = muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nimbusplay_ambience_muted', muted ? 'true' : 'false');
    }
    if (this.ambienceGain) {
      const ctx = audioContextManager.getContext();
      if (ctx) {
        this.ambienceGain.gain.setTargetAtTime(muted ? 0 : 0.045, ctx.currentTime, 0.2);
      }
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMutedState);
    return this.isMutedState;
  }

  public start(): void {
    if (this.isPlaying) return;
    const ctx = audioContextManager.ensureContext();
    const master = audioContextManager.getMasterGain();
    if (!ctx || !master) return;

    this.isPlaying = true;
    const now = ctx.currentTime;

    // Master Ambience Gain
    this.ambienceGain = ctx.createGain();
    this.ambienceGain.gain.setValueAtTime(0.001, now);
    const targetGain = this.isMutedState ? 0 : 0.045;
    this.ambienceGain.gain.linearRampToValueAtTime(targetGain, now + 1.5);
    this.ambienceGain.connect(master);

    // Warm Low-Pass Resonant Filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.setValueAtTime(2.2, now);
    filter.connect(this.ambienceGain);
    this.nodes.push(filter);

    // Subtle LFO Filter Sweep (0.07 Hz breath)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.07, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(140, now);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(now);
    this.nodes.push(lfo, lfoGain);

    // Harmonic Chord Oscillators (Warm Ambient Fifth: A2 110Hz + E3 164.8Hz + Sub 55Hz)
    const tones = [
      { freq: 110.0, type: 'triangle' as OscillatorType, detune: -3 },
      { freq: 110.0, type: 'sine' as OscillatorType, detune: 4 },
      { freq: 164.81, type: 'triangle' as OscillatorType, detune: 2 },
      { freq: 55.0, type: 'sine' as OscillatorType, detune: 0 }
    ];

    tones.forEach((t) => {
      const osc = ctx.createOscillator();
      osc.type = t.type;
      osc.frequency.setValueAtTime(t.freq, now);
      osc.detune.setValueAtTime(t.detune, now);

      const toneGain = ctx.createGain();
      toneGain.gain.setValueAtTime(0.24, now);

      osc.connect(toneGain);
      toneGain.connect(filter);
      osc.start(now);
      this.nodes.push(osc, toneGain);
    });
  }

  public stop(): void {
    if (!this.isPlaying) return;
    const ctx = audioContextManager.getContext();
    if (ctx && this.ambienceGain) {
      this.ambienceGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    }
    setTimeout(() => {
      this.nodes.forEach((n) => {
        if ('stop' in n && typeof n.stop === 'function') {
          try { n.stop(); } catch {}
        }
        try { n.disconnect(); } catch {}
      });
      this.nodes = [];
      this.ambienceGain?.disconnect();
      this.ambienceGain = null;
      this.isPlaying = false;
    }, 650);
  }
}

export const ambience = new AmbienceSynthesizer();

