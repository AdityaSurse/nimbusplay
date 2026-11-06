/**
 * NimbusPlay — Turbo Circuit Type Definitions & Interfaces
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import type { Vector3 } from 'three';

export interface KartPhysicsState {
  x: number;
  y: number;
  z: number;
  speed: number;
  maxSpeed: number;
  heading: number;
  steerAngle: number;
  angularVelocity: number;
  isDrifting: boolean;
  driftDirection: number;
  driftTime: number;
  boostTimer: number;
  isOffroad: boolean;
  wallBounceCooldown: number;
  coins: number;
  currentLap: number;
  lapProgress: number;
  rpm: number;
}

export interface KartInput {
  steer: number;     // -1.0 (full left) to +1.0 (full right)
  gas: boolean;      // Accelerate held
  brake: boolean;    // Brake / reverse held
  drift: boolean;    // Hop / drift held
  boost: boolean;    // Turbo boost triggered
}

export interface TrackSample {
  center: Vector3;
  tangent: Vector3;
  normal: Vector3;
  binormal: Vector3;
  t: number;
  distanceFromCenter: number;
  isOffroad: boolean;
}

export interface StadiumConfig {
  trackRadiusX: number;
  trackRadiusZ: number;
  roadWidth: number;
}

