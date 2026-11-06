/**
 * NimbusPlay — Alien Attack Player Starship Entity
 * White and red jet fighter with banking physics, blue exhaust particle trail,
 * dual wingtip plasma lasers, and energy shield.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics } from 'pixi.js';
import type { ExhaustParticle, LaserBolt } from './types.js';
import { AlienGraphics } from './alien-graphics.js';

export class PlayerShip {
  public readonly container = new Container();
  private shipGraphics = new Graphics();
  private exhaustGraphics = new Graphics();

  public x: number;
  public y: number;
  public vx = 0;
  public rollAngle = 0;
  public targetRoll = 0;

  public lives = 3;
  public maxLives = 3;
  public shieldActive = false;
  private shieldPulse = 0;

  private fireCooldown = 0;
  private readonly FIRE_INTERVAL = 0.15; // ~6.6 shots/sec
  private laserCounter = 0;

  private exhaustParticles: ExhaustParticle[] = [];
  private exhaustTimer = 0;
  private stageWidth: number;

  constructor(stageWidth: number, stageHeight: number) {
    this.stageWidth = stageWidth;
    this.x = stageWidth * 0.5;
    this.y = stageHeight - 140;

    this.container.addChild(this.exhaustGraphics);
    this.container.addChild(this.shipGraphics);
    this.updateTransform();
    this.redraw();
  }

  public redraw(): void {
    AlienGraphics.drawPlayerShip(this.shipGraphics, this.shieldActive, this.shieldPulse);
  }

  private updateTransform(): void {
    this.shipGraphics.x = this.x;
    this.shipGraphics.y = this.y;
    this.shipGraphics.rotation = this.rollAngle;
  }

  public steerWithTilt(tilt: number, dt: number): void {
    // Tilt input in range [-1, 1] from landscape tilt
    const speed = 1100;
    this.vx = tilt * speed;
    this.x += this.vx * dt;
    this.targetRoll = tilt * 0.42; // Up to ~24 degrees banking roll
    this.clampBounds();
  }

  public steerTowardPointer(targetX: number, dt: number): void {
    const dx = targetX - this.x;
    const lerpRate = Math.min(1, 14 * dt);
    this.x += dx * lerpRate;
    this.targetRoll = Math.max(-0.42, Math.min(0.42, (dx / 180) * 0.42));
    this.clampBounds();
  }

  private clampBounds(): void {
    const margin = 55;
    if (this.x < margin) {
      this.x = margin;
      this.targetRoll = 0;
    } else if (this.x > this.stageWidth - margin) {
      this.x = this.stageWidth - margin;
      this.targetRoll = 0;
    }
  }

  public update(dt: number): void {
    // Smooth banking roll interpolation
    this.rollAngle += (this.targetRoll - this.rollAngle) * Math.min(1, 15 * dt);

    if (this.shieldActive) {
      this.shieldPulse += dt;
      this.redraw();
    }

    if (this.fireCooldown > 0) {
      this.fireCooldown -= dt;
    }

    // Emit blue exhaust dots from twin engines
    this.exhaustTimer += dt;
    if (this.exhaustTimer >= 0.035) {
      this.exhaustTimer = 0;
      this.emitExhaustDots();
    }

    this.updateExhaust(dt);
    this.updateTransform();
  }

  private emitExhaustDots(): void {
    const leftX = this.x - 17 * Math.cos(this.rollAngle) + 26 * Math.sin(this.rollAngle);
    const leftY = this.y - 17 * Math.sin(this.rollAngle) + 26 * Math.cos(this.rollAngle);
    const rightX = this.x + 17 * Math.cos(this.rollAngle) + 26 * Math.sin(this.rollAngle);
    const rightY = this.y + 17 * Math.sin(this.rollAngle) + 26 * Math.cos(this.rollAngle);

    const makeParticle = (px: number, py: number): ExhaustParticle => ({
      x: px + (Math.random() - 0.5) * 4,
      y: py,
      vx: (Math.random() - 0.5) * 30,
      vy: 220 + Math.random() * 80,
      alpha: 0.9,
      radius: 4.5 + Math.random() * 2,
      life: 0.32,
      maxLife: 0.32
    });

    this.exhaustParticles.push(makeParticle(leftX, leftY));
    this.exhaustParticles.push(makeParticle(rightX, rightY));
  }

  private updateExhaust(dt: number): void {
    const g = this.exhaustGraphics;
    g.clear();

    for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
      const p = this.exhaustParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.exhaustParticles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const progress = p.life / p.maxLife;
      const currentRadius = p.radius * (0.4 + 0.6 * progress);
      const currentAlpha = p.alpha * progress;

      // Outer cyan glow
      g.circle(p.x, p.y, currentRadius * 1.5).fill({ color: 0x06b6d4, alpha: currentAlpha * 0.4 });
      // Inner glowing blue core
      g.circle(p.x, p.y, currentRadius).fill({ color: 0x38bdf8, alpha: currentAlpha });
    }
  }

  public fireLasers(): LaserBolt[] | null {
    if (this.fireCooldown > 0) return null;
    this.fireCooldown = this.FIRE_INTERVAL;

    // Wingtips offset
    const cos = Math.cos(this.rollAngle);
    const sin = Math.sin(this.rollAngle);
    const leftX = this.x - 42 * cos + 10 * sin;
    const leftY = this.y - 42 * sin + 10 * cos;
    const rightX = this.x + 42 * cos + 10 * sin;
    const rightY = this.y + 42 * sin + 10 * cos;

    return [
      { id: ++this.laserCounter, x: leftX, y: leftY - 8, vy: -1200, radius: 5 },
      { id: ++this.laserCounter, x: rightX, y: rightY - 8, vy: -1200, radius: 5 }
    ];
  }

  public hit(): { shieldAbsorbed: boolean; isDead: boolean } {
    if (this.shieldActive) {
      this.shieldActive = false;
      this.redraw();
      return { shieldAbsorbed: true, isDead: false };
    }

    this.lives = Math.max(0, this.lives - 1);
    return { shieldAbsorbed: false, isDead: this.lives <= 0 };
  }

  public activateShield(): void {
    this.shieldActive = true;
    this.shieldPulse = 0;
    this.redraw();
  }

  public reset(stageWidth: number, stageHeight: number): void {
    this.x = stageWidth * 0.5;
    this.y = stageHeight - 140;
    this.vx = 0;
    this.rollAngle = 0;
    this.targetRoll = 0;
    this.lives = 3;
    this.shieldActive = false;
    this.exhaustParticles = [];
    this.redraw();
    this.updateTransform();
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}

