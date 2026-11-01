/**
 * NimbusPlay — Procedural Web Audio Sound Synthesizer
 * 100% synthesized in real time via Web Audio API. Zero external audio assets.
 * Strictly typed with zero `any`.
 */

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isMuted = false;

  constructor() {
    // AudioContext will be initialized or resumed on first user gesture
  }

  public initOnGesture(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this.createNoiseBuffer();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  /**
   * Blade swing whoosh: shaped filtered noise burst with pitch sweep
   */
  public playBladeWhoosh(): void {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

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
    gain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.14);
  }

  /**
   * Fruit slice splat: FM pitch plunge with juicy noise transient
   */
  public playFruitSplat(): void {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // 1. Core juicy squish tone
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.11);

    // 2. High-frequency crack/snap transient
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    noise.start(now);
    noise.stop(now + 0.06);
  }

  /**
   * Bomb detonation: sub-bass boom with explosive low-pass roar
   */
  public playBombExplode(): void {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Sub rumble
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.45);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.6, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.52);

    // Roar
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    noise.start(now);
    noise.stop(now + 0.5);
  }

  /**
   * Combo celebration chime: rising harmonic intervals
   */
  public playComboChime(comboCount: number): void {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const baseFreqs = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
    const freq = baseFreqs[Math.min(comboCount - 2, baseFreqs.length - 1)] || 784;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  /**
   * Laser Fire: Pitch-swept square wave (2200Hz down to 220Hz in 60ms)
   */
  public playLaserFire(): void {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Charged Plasma Blast: Deep explosive burst with sub-bass punch
   */
  public playChargedBlast(): void {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Sub punch
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.55, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.4);

    // Filtered plasma roar
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.35);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    noise.start(now);
    noise.stop(now + 0.38);
  }

  /**
   * Charging Hum: Ascending tone during B button charge
   */
  public playChargeHum(progress: number): void {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx!;
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
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  /**
   * Alien Saucer Explosion: Crashing high-to-low FM pop with crunch
   */
  public playAlienExplosion(): void {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.16);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.19);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

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
    noiseGain.connect(this.masterGain!);
    noise.start(now);
    noise.stop(now + 0.23);
  }

  /**
   * Boss Hit: Metallic heavy resonant clang
   */
  public playBossHit(): void {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx!;
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
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.17);
    });
  }

  /**
   * Shield Deflect: Crystalline high-frequency pulse
   */
  public playShieldDeflect(): void {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.linearRampToValueAtTime(2400, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Power-up Collect: Bright ascending fanfare (D5 -> A5)
   */
  public playPowerupCollect(): void {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    [587.33, 880.00, 1174.66].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.28);
    });
  }

  /**
   * Channel / Button Click: sine envelope pulse
   */
  public playClick(): void {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  /**
   * Launch chime: dual harmonic tone (E5 + B5)
   */
  public playLaunchChime(): void {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    [659.25, 987.77].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.04);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.65);
    });
  }

  private ensureContext(): boolean {
    if (!this.ctx) {
      this.initOnGesture();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx !== null;
  }

  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not ready');
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

export const audioManager = new AudioManager();

