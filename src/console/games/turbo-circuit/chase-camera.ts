/**
 * NimbusPlay — Turbo Circuit Dynamic Chase Camera System
 * Smoothly tracks behind the kart with speed-responsive FOV kick and corner banking.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Vector3, PerspectiveCamera } from 'three';
import type { KartPhysicsState } from './types.js';

export class ChaseCamera {
  public readonly camera: PerspectiveCamera;

  private readonly baseDistance = 7.4;
  private readonly baseHeight = 2.9;
  private readonly lookAheadDistance = 4.2;
  private readonly lookAheadHeight = 1.2;

  private readonly baseFov = 60;
  private readonly boostFov = 75;

  private currentTarget = new Vector3();
  private currentCamPos = new Vector3();
  private shakeTimer = 0;
  private shakeIntensity = 0;

  constructor(aspect: number) {
    this.camera = new PerspectiveCamera(this.baseFov, aspect, 0.1, 800);
  }

  public triggerShake(duration = 0.35, intensity = 0.4): void {
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  public update(kart: KartPhysicsState, dt: number): void {
    // 1. Compute Ideal Camera Anchor behind kart
    const forwardX = Math.sin(kart.heading);
    const forwardZ = Math.cos(kart.heading);

    const targetPos = new Vector3(
      kart.x - forwardX * this.baseDistance,
      kart.y + this.baseHeight,
      kart.z - forwardZ * this.baseDistance
    );

    const lookTarget = new Vector3(
      kart.x + forwardX * this.lookAheadDistance,
      kart.y + this.lookAheadHeight,
      kart.z + forwardZ * this.lookAheadDistance
    );

    // Initial instant snap if camera is at origin
    if (this.currentCamPos.lengthSq() < 1) {
      this.currentCamPos.copy(targetPos);
      this.currentTarget.copy(lookTarget);
    } else {
      // Critically damped smooth follow
      const followRate = Math.min(1.0, dt * 10.0);
      this.currentCamPos.lerp(targetPos, followRate);
      this.currentTarget.lerp(lookTarget, followRate * 1.2);
    }

    this.camera.position.copy(this.currentCamPos);

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const decay = Math.max(0, this.shakeTimer / 0.35);
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity * decay;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity * decay;
    }

    this.camera.lookAt(this.currentTarget);

    // 2. Corner banking tilt
    const bankAngle = -kart.steerAngle * 0.08;
    this.camera.rotation.z += (bankAngle - this.camera.rotation.z) * Math.min(1.0, dt * 8);

    // 3. Dynamic FOV Kick on Boost
    const targetFov = kart.boostTimer > 0 ? this.boostFov : this.baseFov;
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, dt * 9);
    this.camera.updateProjectionMatrix();
  }

  public updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}

