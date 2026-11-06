/**
 * NimbusPlay — Alien Attack Type Definitions
 * Strictly typed with zero `any`. Target < 250 lines.
 */

export type AlienType = 'asteroid' | 'saucer' | 'bubble-alien';

export interface AlienEnemy {
  id: number;
  type: AlienType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  sinPhase: number;
  scoreValue: number;
}

export interface LaserBolt {
  id: number;
  x: number;
  y: number;
  vy: number;
  radius: number;
}

export interface PowerUpItem {
  id: number;
  type: 'shield';
  x: number;
  y: number;
  vy: number;
  radius: number;
  pulseTimer: number;
}

export interface ExhaustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  radius: number;
  life: number;
  maxLife: number;
}

export interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  alpha: number;
  radius: number;
  life: number;
  maxLife: number;
}

export interface SpeedLine {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
  width: number;
}

