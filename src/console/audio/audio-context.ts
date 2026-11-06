/**
 * NimbusPlay — Core Web Audio Context & Node Manager
 * Manages AudioContext lifecycle, master gain, and procedural noise buffers.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

export class AudioContextManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isMasterMuted = false;

  public initOnGesture(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMasterMuted ? 0 : 0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this.generateNoiseBuffer(this.ctx);
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public ensureContext(): AudioContext | null {
    if (!this.ctx) {
      this.initOnGesture();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  public getNoiseBuffer(): AudioBuffer | null {
    if (!this.noiseBuffer && this.ctx) {
      this.noiseBuffer = this.generateNoiseBuffer(this.ctx);
    }
    return this.noiseBuffer;
  }

  public setMasterMuted(muted: boolean): void {
    this.isMasterMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public isMuted(): boolean {
    return this.isMasterMuted;
  }

  private generateNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

export const audioContextManager = new AudioContextManager();

