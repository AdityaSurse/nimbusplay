/**
 * NimbusPlay — Turbo Circuit AI Opponents Engine
 * Orchestrates 7 AI racers with skill levels, lane offsets, rubber-banding, and kart collisions.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Group } from 'three';
import type { RacerProfile, KartPhysicsState } from './types.js';
import type { TrackSpline } from './track-spline.js';
import { KartModel } from './kart-model.js';

export class AIManager {
  public readonly group = new Group();
  public readonly opponents: RacerProfile[] = [];
  private readonly kartModels: KartModel[] = [];
  private readonly track: TrackSpline;

  constructor(track: TrackSpline) {
    this.track = track;
    const aiConfigs = [
      { id: 'ai-1', name: 'Nova', color: 0xfacc15, accent: 0x0284c7, speed: 47.2, accel: 31, offset: -2.8 },
      { id: 'ai-2', name: 'Blaze', color: 0xe11d48, accent: 0xf97316, speed: 48.0, accel: 32, offset: 2.5 },
      { id: 'ai-3', name: 'Pixel', color: 0xa855f7, accent: 0xec4899, speed: 46.5, accel: 29, offset: -1.2 },
      { id: 'ai-4', name: 'Echo', color: 0x14b8a6, accent: 0xf1f5f9, speed: 46.0, accel: 28, offset: 1.8 },
      { id: 'ai-5', name: 'Rex', color: 0x16a34a, accent: 0x0f172a, speed: 45.5, accel: 27, offset: -2.2 },
      { id: 'ai-6', name: 'Luna', color: 0x6366f1, accent: 0xfde047, speed: 45.0, accel: 26, offset: 2.4 },
      { id: 'ai-7', name: 'Apex', color: 0xf43f5e, accent: 0x38bdf8, speed: 48.6, accel: 33, offset: 0.0 }
    ];

    aiConfigs.forEach((cfg, idx) => {
      const model = new KartModel(cfg.color, cfg.accent);
      this.kartModels.push(model);
      this.group.add(model.group);

      const grid = this.track.getStartGridTransform(idx);
      const initT = (1.0 - (idx + 1) * 0.007) % 1.0;
      this.opponents.push({
        id: cfg.id,
        name: cfg.name,
        kartColor: cfg.color,
        accentColor: cfg.accent,
        isPlayer: false,
        skillSpeed: cfg.speed,
        skillAccel: cfg.accel,
        laneOffset: cfg.offset,
        currentLap: 1,
        lapProgress: initT,
        totalDistance: initT * this.track.totalLength,
        position: idx + 1,
        lapTimes: [],
        totalTime: 0,
        isFinished: false,
        x: grid.position.x,
        y: grid.position.y,
        z: grid.position.z,
        heading: grid.heading,
        speed: 0
      });
      model.group.position.copy(grid.position);
      model.group.rotation.y = grid.heading;
    });
  }

  public update(player: KartPhysicsState, dt: number, isRacing: boolean, onBump: () => void): void {
    const trackLen = this.track.totalLength;

    this.opponents.forEach((ai, idx) => {
      if (!isRacing) return;

      // 1. Rubber-Banding relative to player
      const distDelta = player.totalDistance - ai.totalDistance;
      let speedScale = 1.0;
      if (distDelta > 20) speedScale = 1.08; // Catch-up boost if behind
      else if (distDelta < -60) speedScale = 0.94; // Ease off if way ahead

      const targetSpeed = ai.skillSpeed * speedScale;
      ai.speed = Math.min(targetSpeed, ai.speed + ai.skillAccel * dt);

      // 2. Advance Along Spline Progress
      const advanceRate = (ai.speed / trackLen) * dt;
      const prevT = ai.lapProgress;
      ai.lapProgress = (ai.lapProgress + advanceRate) % 1.0;

      // Check lap rollover
      if (prevT > 0.85 && ai.lapProgress < 0.15) {
        ai.currentLap++;
        if (ai.currentLap > 3) ai.isFinished = true;
      }

      ai.totalDistance = (ai.currentLap - 1) * trackLen + ai.lapProgress * trackLen;

      // 3. Position & Rotation with Sinusoidal Lane Weave
      const laneWeave = Math.sin(ai.lapProgress * Math.PI * 8 + idx) * 0.6;
      const splinePt = this.track.getPointAlongSpline(ai.lapProgress, ai.laneOffset + laneWeave);

      ai.x = splinePt.position.x;
      ai.y = splinePt.position.y;
      ai.z = splinePt.position.z;
      ai.heading = splinePt.heading;

      // 4. Light Bumping with Player Kart
      const dx = player.x - ai.x;
      const dz = player.z - ai.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < 5.0) { // ~2.23m collision radius
        const dist = Math.sqrt(distSq) || 0.1;
        const pushX = (dx / dist) * 0.8;
        const pushZ = (dz / dist) * 0.8;
        player.x += pushX;
        player.z += pushZ;
        ai.x -= pushX * 0.5;
        ai.z -= pushZ * 0.5;
        onBump();
      }

      // 5. Update 3D Model
      const model = this.kartModels[idx];
      model.group.position.set(ai.x, ai.y, ai.z);
      model.group.rotation.y = ai.heading;
      model.updateAnimation(ai.speed, 0, false, 'none', false, dt);
    });
  }

  public computeRanks(player: KartPhysicsState): { playerRank: number; sortedRacers: RacerProfile[] } {
    const playerProfile: RacerProfile = {
      id: 'player',
      name: 'Volt (You)',
      kartColor: 0xef4444,
      accentColor: 0x06b6d4,
      isPlayer: true,
      skillSpeed: 48,
      skillAccel: 32,
      laneOffset: 0,
      currentLap: player.currentLap,
      lapProgress: player.lapProgress,
      totalDistance: player.totalDistance,
      position: 8,
      lapTimes: [],
      totalTime: 0,
      isFinished: player.currentLap > 3,
      x: player.x,
      y: player.y,
      z: player.z,
      heading: player.heading,
      speed: player.speed
    };

    const all = [playerProfile, ...this.opponents].sort((a, b) => b.totalDistance - a.totalDistance);
    all.forEach((r, i) => { r.position = i + 1; });

    const pRank = all.find((r) => r.isPlayer)?.position ?? 8;
    player.position = pRank;

    return { playerRank: pRank, sortedRacers: all };
  }

  public reset(): void {
    this.opponents.forEach((ai, idx) => {
      const grid = this.track.getStartGridTransform(idx);
      const initT = (1.0 - (idx + 1) * 0.007) % 1.0;
      ai.x = grid.position.x;
      ai.y = grid.position.y;
      ai.z = grid.position.z;
      ai.heading = grid.heading;
      ai.speed = 0;
      ai.currentLap = 1;
      ai.lapProgress = initT;
      ai.totalDistance = initT * this.track.totalLength;
      ai.isFinished = false;
      const model = this.kartModels[idx];
      model.group.position.copy(grid.position);
      model.group.rotation.y = grid.heading;
    });
  }

  public destroy(): void {
    this.kartModels.forEach((m) => m.destroy());
    this.group.clear();
  }
}
