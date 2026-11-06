/**
 * NimbusPlay — Turbo Circuit Arcade Kart Physics Engine
 * Handles drive forces, speed-dependent steering, grip, off-road slowdown, and wall bounces.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Vector3 } from 'three';
import type { KartPhysicsState, KartInput } from './types.js';
import type { TrackSpline } from './track-spline.js';

export class KartPhysics {
  public state: KartPhysicsState;
  private readonly track: TrackSpline;

  private readonly normalMaxSpeed = 48.0; // ~172 km/h
  private readonly boostMaxSpeed = 68.0;  // ~245 km/h
  private readonly accelRate = 32.0;
  private readonly brakeRate = 45.0;
  private readonly coastDecel = 12.0;

  constructor(track: TrackSpline) {
    this.track = track;
    const start = track.getStartGridTransform();

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
      boostTimer: 0,
      isOffroad: false,
      wallBounceCooldown: 0,
      coins: 4,
      currentLap: 1,
      lapProgress: 0,
      rpm: 800
    };
  }

  public update(input: KartInput, dt: number): void {
    // 1. Boost Countdown
    if (this.state.boostTimer > 0) {
      this.state.boostTimer -= dt;
      this.state.maxSpeed = this.boostMaxSpeed;
    } else {
      this.state.maxSpeed = this.normalMaxSpeed + this.state.coins * 0.8;
    }

    if (this.state.wallBounceCooldown > 0) {
      this.state.wallBounceCooldown -= dt;
    }

    // 2. Track Sample & Off-road check
    const currentPos = new Vector3(this.state.x, this.state.y, this.state.z);
    const sample = this.track.getClosestTrackSample(currentPos);
    this.state.isOffroad = sample.isOffroad;
    this.state.lapProgress = sample.t;

    // Off-road top speed clamp
    let effectiveMaxSpeed = this.state.maxSpeed;
    if (this.state.isOffroad && this.state.boostTimer <= 0) {
      effectiveMaxSpeed = this.normalMaxSpeed * 0.42;
    }

    // 3. Drive force / Acceleration & Braking
    if (input.gas) {
      if (this.state.speed < effectiveMaxSpeed) {
        this.state.speed += this.accelRate * dt;
        if (this.state.speed > effectiveMaxSpeed) this.state.speed = effectiveMaxSpeed;
      } else {
        this.state.speed -= this.coastDecel * dt;
      }
    } else if (input.brake) {
      if (this.state.speed > 0) {
        this.state.speed -= this.brakeRate * dt;
        if (this.state.speed < 0) this.state.speed = 0;
      } else {
        // Reverse
        this.state.speed -= 16.0 * dt;
        if (this.state.speed < -12.0) this.state.speed = -12.0;
      }
    } else {
      // Coasting friction
      const friction = this.state.isOffroad ? 28.0 : this.coastDecel;
      if (this.state.speed > 0) {
        this.state.speed = Math.max(0, this.state.speed - friction * dt);
      } else if (this.state.speed < 0) {
        this.state.speed = Math.min(0, this.state.speed + friction * dt);
      }
    }

    // 4. Speed-dependent turn rate
    // Agility is high at low/mid speeds (~2.2 rad/s), smoothly tempered at high speed (~1.2 rad/s)
    const speedRatio = Math.min(1.0, Math.abs(this.state.speed) / this.normalMaxSpeed);
    const turnAuthority = 2.2 - speedRatio * 0.95;

    // Drifting hop & lock
    if (input.drift && Math.abs(input.steer) > 0.25 && !this.state.isDrifting && this.state.speed > 15) {
      this.state.isDrifting = true;
      this.state.driftDirection = Math.sign(input.steer);
      this.state.driftTime = 0;
    } else if (!input.drift && this.state.isDrifting) {
      // Release drift: award mini-turbo boost if charged
      if (this.state.driftTime >= 1.2) {
        this.triggerBoost(1.2);
      } else if (this.state.driftTime >= 0.6) {
        this.triggerBoost(0.6);
      }
      this.state.isDrifting = false;
      this.state.driftTime = 0;
    }

    if (this.state.isDrifting) {
      this.state.driftTime += dt;
      // Extra yaw slip when drifting
      this.state.steerAngle = this.state.driftDirection * (turnAuthority * 1.28);
    } else {
      this.state.steerAngle = input.steer * turnAuthority;
    }

    if (Math.abs(this.state.speed) > 0.5) {
      const dirSign = this.state.speed >= 0 ? 1 : -1;
      this.state.heading += this.state.steerAngle * dirSign * dt;
    }

    // 5. Integrate Position
    const vx = Math.sin(this.state.heading) * this.state.speed;
    const vz = Math.cos(this.state.heading) * this.state.speed;

    this.state.x += vx * dt;
    this.state.z += vz * dt;

    // Track surface elevation follow
    this.state.y = sample.center.y + 0.1;

    // 6. Wall / Barrier Collision Bounce
    const halfRoad = this.track.roadWidth * 0.5;
    const barrierLimit = halfRoad + 2.8;

    if (sample.distanceFromCenter > barrierLimit && this.state.wallBounceCooldown <= 0) {
      this.handleWallBounce(sample);
    }

    // Simulated engine RPM for audio
    const rpmRatio = Math.min(1.0, Math.abs(this.state.speed) / this.state.maxSpeed);
    this.state.rpm = 900 + rpmRatio * 4200;
  }

  private handleWallBounce(sample: { center: Vector3; binormal: Vector3 }): void {
    this.state.wallBounceCooldown = 0.35;
    this.state.speed *= 0.55; // absorb impact energy

    // Push kart back towards the track road surface
    const toCenter = new Vector3().subVectors(sample.center, new Vector3(this.state.x, this.state.y, this.state.z));
    toCenter.y = 0;
    toCenter.normalize();

    this.state.x += toCenter.x * 1.8;
    this.state.z += toCenter.z * 1.8;

    // Deflect heading away from wall
    this.state.heading = Math.atan2(toCenter.x, toCenter.z);
  }

  public triggerBoost(durationSeconds: number): void {
    this.state.boostTimer = Math.max(this.state.boostTimer, durationSeconds);
    this.state.speed = this.boostMaxSpeed;
  }

  public reset(startGrid: { position: Vector3; heading: number }): void {
    this.state.x = startGrid.position.x;
    this.state.y = startGrid.position.y;
    this.state.z = startGrid.position.z;
    this.state.speed = 0;
    this.state.heading = startGrid.heading;
    this.state.steerAngle = 0;
    this.state.boostTimer = 0;
    this.state.isDrifting = false;
    this.state.currentLap = 1;
  }
}
