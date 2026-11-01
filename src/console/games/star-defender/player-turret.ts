/**
 * NimbusPlay — Player Turret Controller & Weapon Systems
 * Drives turret aim rotation, rate-limited laser fire, and charged plasma blast.
 * Strictly typed with zero `any`.
 */

import { Container, Graphics } from 'pixi.js';
import { StarGraphics } from './star-graphics.js';
import type { GameInputState } from '../common/game-interface.js';
import { BUTTON_MASKS } from '../../../shared/protocol.js';

export interface TurretShootCallbacks {
  onFireLaser: (x: number, y: number, angle: number) => void;
  onFireSpread: (x: number, y: number, angle: number) => void;
  onFireCharged: (x: number, y: number, angle: number) => void;
  onChargeHum: (progress: number) => void;
}

export class PlayerTurret {
  public container = new Container();
  private g = new Graphics();

  public readonly x = 960;
  public readonly y = 1015;
  public angle = 0; // Radians, 0 = pointing straight up

  private laserCooldown = 0;
  private readonly LASER_INTERVAL = 0.12; // ~8.3 shots/sec
  public chargeProgress = 0;
  private isCharging = false;
  private chargeHumTimer = 0;

  constructor() {
    this.container.position.set(this.x, this.y);
    this.container.addChild(this.g);
  }

  public update(
    input: GameInputState,
    dt: number,
    aimX: number,
    aimY: number,
    isSpreadActive: boolean,
    isShieldActive: boolean,
    callbacks: TurretShootCallbacks
  ): void {
    // 1. Aim angle towards reticle
    const dx = aimX - this.x;
    const dy = aimY - this.y;
    // Turret graphic points UP at angle = 0
    this.angle = Math.atan2(dy, dx) + Math.PI / 2;
    // Clamp turret elevation so it cannot fire downwards
    this.angle = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.angle));
    this.g.rotation = this.angle;

    // 2. Cooldown timer
    if (this.laserCooldown > 0) {
      this.laserCooldown = Math.max(0, this.laserCooldown - dt);
    }

    // 3. Firing Inputs
    const isAPressed = (input.rawBitmask & BUTTON_MASKS.A) !== 0 || input.isTriggerPressed;
    const isBPressed = (input.rawBitmask & BUTTON_MASKS.B) !== 0 || input.isSliceHeld;

    // B Button Charged Blast Mechanism
    if (isBPressed) {
      this.isCharging = true;
      this.chargeProgress = Math.min(1.0, this.chargeProgress + dt / 0.75);

      this.chargeHumTimer += dt;
      if (this.chargeHumTimer >= 0.15) {
        this.chargeHumTimer = 0;
        callbacks.onChargeHum(this.chargeProgress);
      }
    } else {
      if (this.isCharging) {
        // Released B: if sufficiently charged (> 0.4), fire charged blast!
        if (this.chargeProgress >= 0.4) {
          const muzzleOffset = -60;
          const spawnX = this.x + Math.sin(this.angle) * -muzzleOffset;
          const spawnY = this.y + Math.cos(this.angle) * muzzleOffset;
          callbacks.onFireCharged(spawnX, spawnY, this.angle - Math.PI / 2);
        }
        this.isCharging = false;
        this.chargeProgress = 0;
      }
    }

    // A Button Primary Lasers (Rate-limited)
    if (isAPressed && !this.isCharging && this.laserCooldown <= 0) {
      this.laserCooldown = this.LASER_INTERVAL;
      const muzzleOffset = -55;
      const spawnX = this.x + Math.sin(this.angle) * -muzzleOffset;
      const spawnY = this.y + Math.cos(this.angle) * muzzleOffset;
      const fireAngle = this.angle - Math.PI / 2;

      if (isSpreadActive) {
        callbacks.onFireSpread(spawnX, spawnY, fireAngle);
      } else {
        callbacks.onFireLaser(spawnX, spawnY, fireAngle);
      }
    }

    // 4. Render Turret
    StarGraphics.drawTurret(this.g, this.chargeProgress, isShieldActive);
  }

  public reset(): void {
    this.chargeProgress = 0;
    this.isCharging = false;
    this.laserCooldown = 0;
    this.g.rotation = 0;
  }
}

