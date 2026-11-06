/**
 * NimbusPlay — Turbo Circuit Arcade Kart Physics Engine
 * Handles drive forces, 3-tier drift sparks, glider flight, spinouts, shields, and laps.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Vector3 } from 'three';
import type { KartPhysicsState, KartInput } from './types.js';
import type { TrackSpline } from './track-spline.js';

export class KartPhysics {
  public state: KartPhysicsState;
  private readonly track: TrackSpline;

  private readonly normalMaxSpeed = 48.0;
  private readonly boostMaxSpeed = 68.0;
  private readonly accelRate = 32.0;
  private readonly brakeRate = 45.0;
  private readonly coastDecel = 12.0;

  private checkpointMask = 0;
  private onWallBounceCallback?: () => void;

  constructor(track: TrackSpline, onWallBounce?: () => void) {
    this.track = track;
    this.onWallBounceCallback = onWallBounce;
    const start = track.getStartGridTransform(7); // 8th position
    const initialT = (1.0 - 8 * 0.007) % 1.0;

    this.state = {
      x: start.position.x,
      y: start.position.y,
      z: start.position.z,
      speed: 0,
      maxSpeed: this.normalMaxSpeed,
      heading: start.heading,
      steerAngle: 0,
      angularVelocity: 0,
      isDrifting: false,
      driftDirection: 0,
      driftTime: 0,
      driftTier: 'none',
      boostTimer: 0,
      isGliding: false,
      glideHeight: 0,
      isSpinning: false,
      spinTimer: 0,
      isShielded: false,
      shieldTimer: 0,
      heldItem: null,
      isItemRoulette: false,
      isOffroad: false,
      wallBounceCooldown: 0,
      coins: 4,
      currentLap: 1,
      lapProgress: initialT,
      totalDistance: initialT * track.totalLength,
      position: 8,
      rpm: 800
    };
  }

  public update(input: KartInput, dt: number): void {
    // 1. Boost & Shield Timers
    if (this.state.boostTimer > 0) {
      this.state.boostTimer -= dt;
      this.state.maxSpeed = this.boostMaxSpeed;
    } else {
      this.state.maxSpeed = this.normalMaxSpeed + this.state.coins * 0.8;
    }

    if (this.state.shieldTimer > 0) {
      this.state.shieldTimer -= dt;
      this.state.isShielded = this.state.shieldTimer > 0;
    }

    if (this.state.wallBounceCooldown > 0) {
      this.state.wallBounceCooldown -= dt;
    }

    // 2. Track Query & Checkpoints
    const currentPos = new Vector3(this.state.x, this.state.y, this.state.z);
    const sample = this.track.getClosestTrackSample(currentPos);
    this.state.isOffroad = sample.isOffroad && !this.state.isGliding;
    this.state.lapProgress = sample.t;
    this.updateCheckpointsAndLaps(sample.t);

    // 3. Glider Ramp Aerodynamics
    if (this.track.isGliderRamp(sample.t) && this.state.speed > 20.0) {
      this.state.isGliding = true;
      this.state.glideHeight = Math.min(3.6, this.state.glideHeight + dt * 4.5);
    } else if (this.state.isGliding) {
      this.state.glideHeight = Math.max(0, this.state.glideHeight - dt * 2.0);
      if (this.state.glideHeight <= 0.05) {
        this.state.isGliding = false;
        this.state.glideHeight = 0;
      }
    }

    // 4. Spin-out Hazard State
    if (this.state.isSpinning) {
      this.state.spinTimer -= dt;
      this.state.heading += Math.PI * 4 * dt;
      this.state.speed = Math.max(0, this.state.speed - 35 * dt);
      if (this.state.spinTimer <= 0) this.state.isSpinning = false;
    }

    // 5. Drive Forces & Off-road Clamping
    let effectiveMax = this.state.maxSpeed;
    if (this.state.isOffroad && this.state.boostTimer <= 0) effectiveMax = this.normalMaxSpeed * 0.42;

    if (!this.state.isSpinning) {
      if (input.gas) {
        if (this.state.speed < effectiveMax) {
          this.state.speed = Math.min(effectiveMax, this.state.speed + this.accelRate * dt);
        } else {
          this.state.speed -= this.coastDecel * dt;
        }
      } else if (input.brake) {
        this.state.speed = Math.max(-12.0, this.state.speed - this.brakeRate * dt);
      } else {
        const friction = this.state.isOffroad ? 28.0 : this.coastDecel;
        if (this.state.speed > 0) this.state.speed = Math.max(0, this.state.speed - friction * dt);
        else if (this.state.speed < 0) this.state.speed = Math.min(0, this.state.speed + friction * dt);
      }
    }

    // 6. 3-Tier Drift Mechanics
    const speedRatio = Math.min(1.0, Math.abs(this.state.speed) / this.normalMaxSpeed);
    const turnAuthority = 2.2 - speedRatio * 0.95;

    if (input.drift && Math.abs(input.steer) > 0.25 && !this.state.isDrifting && this.state.speed > 15) {
      this.state.isDrifting = true;
      this.state.driftDirection = Math.sign(input.steer);
      this.state.driftTime = 0;
    } else if (!input.drift && this.state.isDrifting) {
      if (this.state.driftTier === 'purple') this.triggerBoost(2.0, 74.0);
      else if (this.state.driftTier === 'orange') this.triggerBoost(1.4, 68.0);
      else if (this.state.driftTier === 'blue') this.triggerBoost(0.8, 62.0);
      this.state.isDrifting = false;
      this.state.driftTier = 'none';
      this.state.driftTime = 0;
    }

    if (this.state.isDrifting) {
      this.state.driftTime += dt;
      if (this.state.driftTime >= 2.5) this.state.driftTier = 'purple';
      else if (this.state.driftTime >= 1.4) this.state.driftTier = 'orange';
      else if (this.state.driftTime >= 0.6) this.state.driftTier = 'blue';
      else this.state.driftTier = 'none';
      this.state.steerAngle = this.state.driftDirection * (turnAuthority * 1.28);
    } else {
      this.state.steerAngle = input.steer * turnAuthority;
    }

    if (Math.abs(this.state.speed) > 0.5 && !this.state.isSpinning) {
      const dirSign = this.state.speed >= 0 ? 1 : -1;
      this.state.heading += this.state.steerAngle * dirSign * dt;
    }

    // 7. Integrate Position
    this.state.x += Math.sin(this.state.heading) * this.state.speed * dt;
    this.state.z += Math.cos(this.state.heading) * this.state.speed * dt;
    this.state.y = sample.center.y + 0.1 + this.state.glideHeight;

    // 8. Wall Collisions
    const halfRoad = this.track.roadWidth * 0.5;
    if (sample.distanceFromCenter > halfRoad + 2.8 && this.state.wallBounceCooldown <= 0 && !this.state.isGliding) {
      this.handleWallBounce(sample);
    }

    const rpmRatio = Math.min(1.0, Math.abs(this.state.speed) / this.state.maxSpeed);
    this.state.rpm = 900 + rpmRatio * 4200;
  }

  private updateCheckpointsAndLaps(t: number): void {
    if (t > 0.22 && t < 0.30) this.checkpointMask |= 1;
    if (t > 0.48 && t < 0.58) this.checkpointMask |= 2;
    if (t > 0.72 && t < 0.82) this.checkpointMask |= 4;

    // Finish line crossing check
    if (t < 0.05 && this.checkpointMask === 7) {
      this.checkpointMask = 0;
      this.state.currentLap = Math.min(4, this.state.currentLap + 1);
    }

    this.state.totalDistance = (this.state.currentLap - 1) * this.track.totalLength + t * this.track.totalLength;
  }

  private handleWallBounce(sample: { center: Vector3 }): void {
    this.state.wallBounceCooldown = 0.35;
    this.state.speed *= 0.55;
    this.onWallBounceCallback?.();
    const toCenter = new Vector3().subVectors(sample.center, new Vector3(this.state.x, this.state.y, this.state.z));
    toCenter.y = 0;
    toCenter.normalize();
    this.state.x += toCenter.x * 1.8;
    this.state.z += toCenter.z * 1.8;
    this.state.heading = Math.atan2(toCenter.x, toCenter.z);
  }

  public triggerBoost(durationSeconds: number, targetSpeed: number = 68.0): void {
    this.state.boostTimer = Math.max(this.state.boostTimer, durationSeconds);
    this.state.speed = targetSpeed;
  }

  public triggerSpinout(): void {
    if (this.state.isShielded || this.state.isSpinning) return;
    this.state.isSpinning = true;
    this.state.spinTimer = 0.75;
    this.state.coins = Math.max(0, this.state.coins - 3);
  }

  public triggerShield(duration: number = 5.0): void {
    this.state.isShielded = true;
    this.state.shieldTimer = duration;
  }

  public addCoin(): void {
    if (this.state.coins < 10) this.state.coins++;
  }

  public reset(startGrid: { position: Vector3; heading: number }): void {
    const initialT = (1.0 - 8 * 0.007) % 1.0;
    this.state.x = startGrid.position.x;
    this.state.y = startGrid.position.y;
    this.state.z = startGrid.position.z;
    this.state.speed = 0;
    this.state.heading = startGrid.heading;
    this.state.steerAngle = 0;
    this.state.boostTimer = 0;
    this.state.isDrifting = false;
    this.state.driftTier = 'none';
    this.state.isGliding = false;
    this.state.isSpinning = false;
    this.state.isShielded = false;
    this.state.currentLap = 1;
    this.state.lapProgress = initialT;
    this.state.totalDistance = initialT * this.track.totalLength;
    this.state.position = 8;
    this.checkpointMask = 0;
  }
}
