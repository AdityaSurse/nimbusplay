/**
 * NimbusPlay — Shooting Range Type Definitions
 * Strictly typed with zero `any`. Target < 250 lines.
 */

export type TargetVariant = 'red' | 'gold' | 'black';

export type TargetState = 'spawning' | 'active' | 'hit' | 'fading';

export interface BullseyeTarget {
  id: number;
  variant: TargetVariant;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  scale: number;
  alpha: number;
  state: TargetState;
  timer: number;
  maxLifetime: number;
  sinPhase: number;
  hasPost: boolean;
  rotation: number;
  rotSpeed: number;
}

export interface ScorePopup {
  id: number;
  text: string;
  x: number;
  y: number;
  vy: number;
  color: number;
  alpha: number;
  scale: number;
  timer: number;
  maxLifetime: number;
}

export interface SplinterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  alpha: number;
  radius: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
}

export interface RangeCloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  alpha: number;
}

