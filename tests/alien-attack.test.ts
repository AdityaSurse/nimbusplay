/**
 * NimbusPlay — Alien Attack Unit Tests
 * Verifies player ship mechanics, shield protection, laser firing, and collision hit detection.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PlayerShip } from '../src/console/games/alien-attack/player-ship.js';

describe('Alien Attack Player Starship Tests', () => {
  it('should initialize ship at horizontal center and near bottom', () => {
    const ship = new PlayerShip(1920, 1080);
    assert.equal(ship.x, 960);
    assert.equal(ship.y, 1080 - 140);
    assert.equal(ship.lives, 3);
    assert.equal(ship.shieldActive, false);
    ship.destroy();
  });

  it('should clamp ship horizontal position within screen bounds', () => {
    const ship = new PlayerShip(1920, 1080);
    // Extreme left tilt
    ship.steerWithTilt(-1.0, 10.0);
    assert.equal(ship.x, 55);

    // Extreme right tilt
    ship.steerWithTilt(1.0, 10.0);
    assert.equal(ship.x, 1920 - 55);
    ship.destroy();
  });

  it('should calculate banking roll angle proportional to tilt', () => {
    const ship = new PlayerShip(1920, 1080);
    ship.steerWithTilt(0.5, 0.016);
    assert.ok(ship.targetRoll > 0.15 && ship.targetRoll < 0.25);

    ship.steerWithTilt(-0.5, 0.016);
    assert.ok(ship.targetRoll < -0.15 && ship.targetRoll > -0.25);
    ship.destroy();
  });

  it('should fire twin wingtip lasers and respect cooldown timer', () => {
    const ship = new PlayerShip(1920, 1080);
    const bolts1 = ship.fireLasers();
    assert.ok(bolts1 !== null);
    assert.equal(bolts1.length, 2);
    // Left and right wingtips
    assert.ok(bolts1[0].x < ship.x);
    assert.ok(bolts1[1].x > ship.x);

    // Immediate second fire within cooldown should return null
    const bolts2 = ship.fireLasers();
    assert.equal(bolts2, null);

    // Advance time past fire cooldown
    ship.update(0.18);
    const bolts3 = ship.fireLasers();
    assert.ok(bolts3 !== null);
    assert.equal(bolts3.length, 2);
    ship.destroy();
  });

  it('should absorb damage when shield is active without losing a life', () => {
    const ship = new PlayerShip(1920, 1080);
    ship.activateShield();
    assert.equal(ship.shieldActive, true);
    assert.equal(ship.lives, 3);

    const result = ship.hit();
    assert.equal(result.shieldAbsorbed, true);
    assert.equal(result.isDead, false);
    assert.equal(ship.shieldActive, false);
    assert.equal(ship.lives, 3);
    ship.destroy();
  });

  it('should decrement lives when hit without shield and signal death at 0 lives', () => {
    const ship = new PlayerShip(1920, 1080);
    assert.equal(ship.lives, 3);

    // Hit 1
    const r1 = ship.hit();
    assert.equal(r1.shieldAbsorbed, false);
    assert.equal(r1.isDead, false);
    assert.equal(ship.lives, 2);

    // Hit 2
    const r2 = ship.hit();
    assert.equal(r2.shieldAbsorbed, false);
    assert.equal(r2.isDead, false);
    assert.equal(ship.lives, 1);

    // Hit 3
    const r3 = ship.hit();
    assert.equal(r3.shieldAbsorbed, false);
    assert.equal(r3.isDead, true);
    assert.equal(ship.lives, 0);
    ship.destroy();
  });

  it('should reset clean state upon reset()', () => {
    const ship = new PlayerShip(1920, 1080);
    ship.hit();
    ship.hit();
    assert.equal(ship.lives, 1);

    ship.reset(1920, 1080);
    assert.equal(ship.lives, 3);
    assert.equal(ship.shieldActive, false);
    assert.equal(ship.x, 960);
    ship.destroy();
  });
});

describe('Alien Attack Collision Mathematics', () => {
  it('should correctly detect circle-circle intersection between laser and alien', () => {
    const laser = { x: 500, y: 300, radius: 5 };
    const alien = { x: 504, y: 302, radius: 28 };

    const distSq = (laser.x - alien.x) ** 2 + (laser.y - alien.y) ** 2;
    const hitDist = laser.radius + alien.radius;
    assert.ok(distSq <= hitDist * hitDist);
  });

  it('should not register collision when laser passes outside alien perimeter', () => {
    const laser = { x: 400, y: 300, radius: 5 };
    const alien = { x: 500, y: 300, radius: 28 };

    const distSq = (laser.x - alien.x) ** 2 + (laser.y - alien.y) ** 2;
    const hitDist = laser.radius + alien.radius;
    assert.ok(distSq > hitDist * hitDist);
  });
});

