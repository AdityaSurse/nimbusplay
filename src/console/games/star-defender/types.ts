/**
 * NimbusPlay — Star Defender Type Definitions & Contracts
 * Strictly typed with zero `any`.
 */

export type GameState = 'intro' | 'playing' | 'paused' | 'gameover';

export type BulletType = 'laser' | 'charged' | 'enemy_bolt' | 'boss_orb';

export type EnemyType = 'scout' | 'fighter' | 'cruiser' | 'boss_minion';

export type PowerUpType = 'spread_shot' | 'shield' | 'slow_time';

export interface StarBullet {
  id: number;
  type: BulletType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  alive: boolean;
  piercing: boolean;
  color: number;
}

export interface StarEnemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  scoreValue: number;
  alive: boolean;
  shootTimer: number;
  patternTime: number;
  patternParam: number;
  flashTimer: number;
}

export interface PowerUpItem {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  vy: number;
  radius: number;
  alive: boolean;
  age: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  durationMs: number;
  remainingMs: number;
}

export interface AimPrediction {
  targetEnemy: StarEnemy | null;
  leadX: number;
  leadY: number;
  hasLead: boolean;
}

