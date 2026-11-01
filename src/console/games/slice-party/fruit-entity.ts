/**
 * NimbusPlay — Slice Party Fruit & Bomb Entity Physics
 * Parabolic projectile trajectories, rotational spin, and split halves dynamics.
 * Strictly typed with zero `any`.
 */

import { Container, Graphics } from 'pixi.js';
import { FruitGraphicsFactory, FRUIT_DEFS, type FruitType } from './fruit-graphics.js';

let nextEntityId = 1;

export class FruitEntity {
  public id: number = ++nextEntityId;
  public type: FruitType;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public rotation = 0;
  public vRot: number;
  public radius: number;
  public isSliced = false;
  public isDead = false;
  public graphics: Graphics;

  constructor(type: FruitType, x: number, y: number, vx: number, vy: number, vRot: number) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.vRot = vRot;
    this.radius = FRUIT_DEFS[type].radius;

    this.graphics = new Graphics();
    FruitGraphicsFactory.drawWhole(this.graphics, type);
    this.updateTransform();
  }

  public update(dt: number, gravity = 820): void {
    this.vy += gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.vRot * dt;

    this.updateTransform();

    // Fallen below screen
    if (this.y > 1200 && this.vy > 0) {
      this.isDead = true;
    }
  }

  private updateTransform(): void {
    this.graphics.x = this.x;
    this.graphics.y = this.y;
    this.graphics.rotation = this.rotation;
  }
}

export class SlicedHalfEntity {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public rotation: number;
  public vRot: number;
  public isDead = false;
  public graphics: Graphics;

  constructor(
    type: FruitType,
    half: 1 | 2,
    x: number,
    y: number,
    vx: number,
    vy: number,
    rotation: number,
    vRot: number
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.rotation = rotation;
    this.vRot = vRot;

    this.graphics = new Graphics();
    FruitGraphicsFactory.drawHalf(this.graphics, type, half);
    this.updateTransform();
  }

  public update(dt: number, gravity = 880): void {
    this.vy += gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.vRot * dt;

    this.updateTransform();

    if (this.y > 1200 && this.vy > 0) {
      this.isDead = true;
    }
  }

  private updateTransform(): void {
    this.graphics.x = this.x;
    this.graphics.y = this.y;
    this.graphics.rotation = this.rotation;
  }
}

export class EntityManager {
  public container: Container = new Container();
  public fruits: FruitEntity[] = [];
  public halves: SlicedHalfEntity[] = [];

  public spawnFruit(
    type: FruitType,
    x: number,
    y: number,
    vx: number,
    vy: number,
    vRot: number
  ): FruitEntity {
    const fruit = new FruitEntity(type, x, y, vx, vy, vRot);
    this.fruits.push(fruit);
    this.container.addChild(fruit.graphics);
    return fruit;
  }

  public splitFruit(fruit: FruitEntity, cutAngle: number): void {
    fruit.isSliced = true;
    fruit.isDead = true;
    this.container.removeChild(fruit.graphics);
    fruit.graphics.destroy();

    // Perpendicular separation impulse
    const perpX = -Math.sin(cutAngle);
    const perpY = Math.cos(cutAngle);
    const impulseSpeed = 220 + Math.random() * 80;

    // Half 1
    const half1 = new SlicedHalfEntity(
      fruit.type,
      1,
      fruit.x - perpX * 10,
      fruit.y - perpY * 10,
      fruit.vx - perpX * impulseSpeed,
      fruit.vy - perpY * impulseSpeed,
      cutAngle,
      -3.5 + Math.random() * -2
    );

    // Half 2
    const half2 = new SlicedHalfEntity(
      fruit.type,
      2,
      fruit.x + perpX * 10,
      fruit.y + perpY * 10,
      fruit.vx + perpX * impulseSpeed,
      fruit.vy + perpY * impulseSpeed,
      cutAngle + Math.PI,
      3.5 + Math.random() * 2
    );

    this.halves.push(half1, half2);
    this.container.addChild(half1.graphics);
    this.container.addChild(half2.graphics);
  }

  public update(dt: number): void {
    // Update active fruits
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      f.update(dt);
      if (f.isDead) {
        this.container.removeChild(f.graphics);
        f.graphics.destroy();
        this.fruits.splice(i, 1);
      }
    }

    // Update split halves
    for (let i = this.halves.length - 1; i >= 0; i--) {
      const h = this.halves[i];
      h.update(dt);
      if (h.isDead) {
        this.container.removeChild(h.graphics);
        h.graphics.destroy();
        this.halves.splice(i, 1);
      }
    }
  }

  public clear(): void {
    for (const f of this.fruits) {
      this.container.removeChild(f.graphics);
      f.graphics.destroy();
    }
    this.fruits = [];

    for (const h of this.halves) {
      this.container.removeChild(h.graphics);
      h.graphics.destroy();
    }
    this.halves = [];
  }
}

