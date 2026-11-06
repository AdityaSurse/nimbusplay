/**
 * NimbusPlay — Turbo Circuit Type Definitions & Interfaces
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import type { Vector3 } from 'three';

export type ItemType = 'boost' | 'rocket' | 'oil' | 'shield' | null;
export type DriftTier = 'none' | 'blue' | 'orange' | 'purple';
export type RaceState = 'countdown' | 'racing' | 'finished' | 'results';

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
  driftTier: DriftTier;
  boostTimer: number;
  isGliding: boolean;
  glideHeight: number;
  isSpinning: boolean;
  spinTimer: number;
  isShielded: boolean;
  shieldTimer: number;
  heldItem: ItemType;
  isItemRoulette: boolean;
  isOffroad: boolean;
  wallBounceCooldown: number;
  coins: number;
  currentLap: number;
  lapProgress: number;
  totalDistance: number;
  position: number;
  rpm: number;
}

export interface KartInput {
  steer: number;     // -1.0 (full left) to +1.0 (full right)
  gas: boolean;      // Accelerate held
  brake: boolean;    // Brake / reverse held
  drift: boolean;    // Hop / drift held
  boost: boolean;    // Turbo boost triggered
  useItem?: boolean; // Use held item
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

export interface RacerProfile {
  id: string;
  name: string;
  kartColor: number;
  accentColor: number;
  isPlayer: boolean;
  skillSpeed: number;
  skillAccel: number;
  laneOffset: number;
  currentLap: number;
  lapProgress: number;
  totalDistance: number;
  position: number;
  lapTimes: number[];
  totalTime: number;
  isFinished: boolean;
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number;
}

export interface ActiveHazard {
  id: string;
  type: 'rocket' | 'oil';
  x: number;
  y: number;
  z: number;
  heading?: number;
  targetRacerId?: string;
  lifetime: number;
}

export interface ItemBoxData {
  id: string;
  x: number;
  y: number;
  z: number;
  active: boolean;
  respawnTimer: number;
}

export interface CoinData {
  id: string;
  x: number;
  y: number;
  z: number;
  active: boolean;
  respawnTimer: number;
}
