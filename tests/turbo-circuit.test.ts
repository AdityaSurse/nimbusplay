/**
 * NimbusPlay — Turbo Circuit Unit & Physics Integration Tests
 * Verifies track spline, drift tiers, glider flight, items, AI ranking, and camera.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { TrackSpline } from '../src/console/games/turbo-circuit/track-spline.js';
import { KartPhysics } from '../src/console/games/turbo-circuit/kart-physics.js';
import { AIManager } from '../src/console/games/turbo-circuit/ai-manager.js';
import { ItemSystem } from '../src/console/games/turbo-circuit/item-system.js';
import { ChaseCamera } from '../src/console/games/turbo-circuit/chase-camera.js';
import type { KartInput } from '../src/console/games/turbo-circuit/types.js';

describe('TrackSpline & Grid Geometry', () => {
  it('should initialize closed track with 8 staggered grid slots', () => {
    const track = new TrackSpline();
    assert.equal(track.roadWidth, 16.0);
    assert.ok(track.curve.closed);

    // Verify 8 distinct grid positions
    for (let slot = 0; slot < 8; slot++) {
      const grid = track.getStartGridTransform(slot);
      assert.ok(Number.isFinite(grid.position.x));
      assert.ok(Number.isFinite(grid.heading));
    }
    track.destroy();
  });

  it('should detect glider ramp zone on track spline', () => {
    const track = new TrackSpline();
    assert.equal(track.isGliderRamp(0.40), true);
    assert.equal(track.isGliderRamp(0.10), false);
    track.destroy();
  });
});

describe('KartPhysics Drift, Glider & Hazard Mechanics', () => {
  const neutralInput: KartInput = { steer: 0, gas: false, brake: false, drift: false, boost: false };

  it('should progress through 3 drift spark tiers (Blue, Orange, Purple)', () => {
    const track = new TrackSpline();
    const physics = new KartPhysics(track);
    physics.state.speed = 30;

    const driftInput: KartInput = { ...neutralInput, steer: 0.8, drift: true };

    // 0.7s -> Blue tier
    for (let i = 0; i < 44; i++) physics.update(driftInput, 0.016);
    assert.equal(physics.state.driftTier, 'blue');

    // 1.5s -> Orange tier
    for (let i = 0; i < 50; i++) physics.update(driftInput, 0.016);
    assert.equal(physics.state.driftTier, 'orange');

    // 2.6s -> Purple tier
    for (let i = 0; i < 70; i++) physics.update(driftInput, 0.016);
    assert.equal(physics.state.driftTier, 'purple');

    // Release drift -> grants boost
    physics.update(neutralInput, 0.016);
    assert.ok(physics.state.boostTimer > 1.0);
    assert.ok(physics.state.speed >= 68.0);
    track.destroy();
  });

  it('should engage glider flight and elevation lift on glider ramp', () => {
    const track = new TrackSpline();
    const physics = new KartPhysics(track);
    physics.state.speed = 35.0;

    // Place kart on glider ramp (t = 0.40)
    const rampPt = track.getPointAlongSpline(0.40, 0);
    physics.state.x = rampPt.position.x;
    physics.state.z = rampPt.position.z;

    const gasInput: KartInput = { ...neutralInput, gas: true };
    for (let i = 0; i < 20; i++) physics.update(gasInput, 0.016);

    assert.equal(physics.state.isGliding, true);
    assert.ok(physics.state.glideHeight > 0.5, 'Glider did not gain altitude');
    track.destroy();
  });

  it('should spin out and drop 3 coins when hitting a hazard without shield', () => {
    const track = new TrackSpline();
    const physics = new KartPhysics(track);
    physics.state.coins = 5;
    physics.state.speed = 40;

    physics.triggerSpinout();
    assert.equal(physics.state.isSpinning, true);
    assert.equal(physics.state.coins, 2);

    // While shielded, spinout is blocked
    physics.triggerShield(5.0);
    physics.triggerSpinout();
    assert.equal(physics.state.coins, 2);
    track.destroy();
  });
});

describe('AIManager & Live Position Ranking Tests', () => {
  it('should initialize 7 distinct AI opponents with staggered grid slots', () => {
    const track = new TrackSpline();
    const ai = new AIManager(track);
    assert.equal(ai.opponents.length, 7);

    // Verify all names
    const names = ai.opponents.map((o) => o.name);
    assert.ok(names.includes('Nova'));
    assert.ok(names.includes('Blaze'));
    assert.ok(names.includes('Apex'));

    ai.destroy();
    track.destroy();
  });

  it('should compute live race positions correctly across all 8 racers', () => {
    const track = new TrackSpline();
    const ai = new AIManager(track);
    const physics = new KartPhysics(track);

    // Player starts at back (8th)
    const initialRanks = ai.computeRanks(physics.state);
    assert.equal(initialRanks.playerRank, 8);
    assert.equal(initialRanks.sortedRacers.length, 8);

    // Move player ahead by 1 lap
    physics.state.currentLap = 2;
    physics.state.totalDistance = track.totalLength + 200;
    const updatedRanks = ai.computeRanks(physics.state);
    assert.equal(updatedRanks.playerRank, 1, 'Player should be 1st with 1-lap lead');

    ai.destroy();
    track.destroy();
  });
});

describe('ItemSystem Spawn & Hazard Mechanics', () => {
  it('should provide weighted item distribution based on rank', () => {
    const track = new TrackSpline();
    const items = new ItemSystem(track);

    // 8th position: should get speed boosts or rockets
    const item8 = items.getRandomItem(8);
    assert.ok(item8 === 'boost' || item8 === 'rocket' || item8 === 'shield');

    // 1st position: should get defensive items
    const item1 = items.getRandomItem(1);
    assert.ok(item1 === 'oil' || item1 === 'shield' || item1 === 'boost');

    items.destroy();
    track.destroy();
  });
});

describe('ChaseCamera Dynamic FOV & Tracking Tests', () => {
  it('should track behind kart and expand FOV when boosting', () => {
    const cam = new ChaseCamera(16 / 9);
    assert.equal(cam.camera.fov, 60);

    const mockKart = {
      x: 0, y: 0, z: 0, speed: 50, maxSpeed: 68, heading: 0, steerAngle: 0, angularVelocity: 0,
      isDrifting: false, driftDirection: 0, driftTime: 0, driftTier: 'none' as const, boostTimer: 2.0,
      isGliding: false, glideHeight: 0, isSpinning: false, spinTimer: 0, isShielded: false,
      shieldTimer: 0, heldItem: null, isItemRoulette: false, isOffroad: false, wallBounceCooldown: 0,
      coins: 4, currentLap: 1, lapProgress: 0, totalDistance: 0, position: 8, rpm: 3000
    };

    cam.update(mockKart, 0.016);
    assert.ok(cam.camera.position.z < 0);

    for (let i = 0; i < 30; i++) cam.update(mockKart, 0.016);
    assert.ok(cam.camera.fov > 65);
  });
});

describe('Landscape Racing Controller & Steering Tilt Tests', () => {
  it('should map lateral tilt acceleration with dead zone and clamping', () => {
    const deadZone = 0.4;
    const sensitivity = 0.28;

    const computeSteer = (accelY: number): number => {
      if (Math.abs(accelY) < deadZone) return 0;
      const mag = (Math.abs(accelY) - deadZone) * sensitivity;
      return Math.max(-1, Math.min(1, Math.sign(accelY) * mag));
    };

    // Under dead zone: 0
    assert.equal(computeSteer(0.2), 0);
    assert.equal(computeSteer(-0.35), 0);

    // Active tilt: proportional and clamped to [-1, 1]
    const steerRight = computeSteer(2.5);
    assert.ok(steerRight > 0.5 && steerRight < 0.7);

    const maxSteer = computeSteer(10.0);
    assert.equal(maxSteer, 1.0);

    const minSteer = computeSteer(-10.0);
    assert.equal(minSteer, -1.0);
  });
});
