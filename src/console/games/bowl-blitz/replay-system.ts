/**
 * NimbusPlay — Bowl Blitz Instant Replay Engine
 * Records trajectory keyframes and plays back the last throw in cinematic slow-motion.
 * Strictly typed with zero `any`.
 */

import type { PinState, ReplayFrame } from './types.js';

export class ReplaySystem {
  private recordedFrames: ReplayFrame[] = [];
  private isRecordingState = false;
  private isPlayingState = false;
  private playbackTime = 0;
  private onPlaybackComplete: (() => void) | null = null;
  private recordTimer = 0;
  private readonly SAMPLE_INTERVAL = 0.025; // ~40 fps recording

  public startRecording(): void {
    this.recordedFrames = [];
    this.isRecordingState = true;
    this.isPlayingState = false;
    this.recordTimer = 0;
  }

  public recordFrame(ball: { x: number; y: number; radius: number }, pins: PinState[], dt: number): void {
    if (!this.isRecordingState) return;

    this.recordTimer += dt;
    if (this.recordTimer >= this.SAMPLE_INTERVAL) {
      this.recordTimer = 0;
      this.recordedFrames.push({
        ballX: ball.x,
        ballY: ball.y,
        ballRadius: ball.radius,
        pins: pins.map((p) => ({
          id: p.id,
          x: p.x,
          y: p.y,
          rot: p.rot,
          knocked: p.knocked
        }))
      });
    }
  }

  public stopRecording(): void {
    this.isRecordingState = false;
  }

  public hasReplay(): boolean {
    return this.recordedFrames.length > 10;
  }

  public startPlayback(onComplete: () => void): void {
    if (!this.hasReplay()) return;
    this.isPlayingState = true;
    this.playbackTime = 0;
    this.onPlaybackComplete = onComplete;
  }

  public stopPlayback(): void {
    this.isPlayingState = false;
    if (this.onPlaybackComplete) {
      const cb = this.onPlaybackComplete;
      this.onPlaybackComplete = null;
      cb();
    }
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public update(dt: number): ReplayFrame | null {
    if (!this.isPlayingState || this.recordedFrames.length === 0) return null;

    // Slow-motion playback at 0.6x speed
    this.playbackTime += dt * 0.6;
    const frameIndex = Math.floor(this.playbackTime / this.SAMPLE_INTERVAL);

    if (frameIndex >= this.recordedFrames.length) {
      this.stopPlayback();
      return null;
    }

    return this.recordedFrames[frameIndex];
  }
}

