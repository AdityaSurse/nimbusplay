/**
 * NimbusPlay — Turbo Circuit Unit & Physics Integration Tests
 * Verifies track spline geometry, arcade kart physics, steering damping,
 * off-road slowdown, barrier bounce, and chase camera dynamics.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { TrackSpline } from '../src/console/games/turbo-circuit/track-spline.js';
import { KartPhysics } from '../src/console/games/turbo-circuit/kart-physics.js';
import { ChaseCamera } from '../src/console/games/turbo-circuit/chase-camera.js';
import type { KartInput } from '../src/console/games/turbo-circuit/types.js';

describe('TrackSpline Geometry & Sample Queries', () => {
  it('should initialize closed CatmullRom track with expected road width and start grid', () => {
    const track = new TrackSpline();
    assert.equal(track.roadWidth, 16.0);
    assert.equal(track.curbWidth, 1.6);
    assert.ok(track.curve.closed);

    const start = track.getStartGridTransform();
    assert.ok(Number.isFinite(start.position.x));
    assert.ok(Number.isFinite(start.position.z));
    assert.ok(Number.isFinite(start.heading));
    track.destroy();
  });

  it('should detect on-road vs off-road positions correctly', () => {
    const track = new TrackSpline();
    const start = track.getStartGridTransform();

    // Position on centerline
    const onRoadSample = track.getClosestTrackSample(start.position);
    assert.equal(onRoadSample.isOffroad, false);
    assert.ok(onRoadSample.distanceFromCenter < 1.0);

    // Position 12 meters to the side (halfRoad = 8.0, so 12 is in grass infield)
    const offRoadPos = new Vector3(
      start.position.x + onRoadSample.binormal.x * 12.0,
      start.position.y,
      start.position.z + onRoadSample.binormal.z * 12.0
    );
    const offRoadSample = track.getClosestTrackSample(offRoadPos);
    assert.equal(offRoadSample.isOffroad, true);
    assert.ok(offRoadSample.distanceFromCenter > 8.0);

    track.destroy();
  });
});

describe('KartPhysics Engine Tests', () => {
  const neutralInput: KartInput = { steer: 0, gas: false, brake: false, drift: false, boost: false };

  it('should accelerate on straightaway when gas is pressed', () => {
    const track = new TrackSpline();
    const physics = new KartPhysics(track);
    assert.equal(physics.state.speed, 0);

    const gasInput: KartInput = { ...neutralInput, gas: true };
    for (let i = 0; i < 30; i++) {
      physics.update(gasInput, 0.016);
    }

    assert.ok(physics.state.speed > 10.0, 'Kart did not accelerate with gas input');
    assert.ok(physics.state.speed <= physics.state.maxSpeed);
    track.destroy();
  });

  it('should decelerate when braking', () => {
    const track = new TrackSpline();
    const physics = new KartPhysics(track);
    physics.state.speed = 30.0;

    const brakeInput: KartInput = { ...neutralInput, brake: true };
    for (let i = 0; i < 15; i++) {
      physics.update(brakeInput, 0.016);
    }

    assert.ok(physics.state.speed < 25.0, 'Kart did not decelerate when braking');
    track.destroy();
  });

  it('should reduce steering sensitivity at high speeds to prevent snap oversteer', () => {
    const track = new TrackSpline();
    const physicsLow = new KartPhysics(track);
    physicsLow.state.speed = 10.0;

    const physicsHigh = new KartPhysics(track);
    physicsHigh.state.speed = 45.0;

    const steerInput: KartInput = { ...neutralInput, steer: 1.0 };
    physicsLow.update(steerInput, 0.016);
    physicsHigh.update(steerInput, 0.016);

    // Turn rate factor = Math.max(0.48, 1.0 - (speed / maxSpeed) * 0.45)
    // Low speed allows sharper turn angle than high speed
    assert.ok(
      Math.abs(physicsLow.state.steerAngle) >= Math.abs(physicsHigh.state.steerAngle),
      'High speed steering was not properly damped'
    );
    track.destroy();
  });

  it('should clamp speed when driving off-road in the grass', () => {
    const track = new TrackSpline();
    const physics = new KartPhysics(track);
    const start = track.getStartGridTransform();

    // Place kart in the grass verge (9.5 units from center: past 8.0m road edge, before 10.8m barrier)
    const sample = track.getClosestTrackSample(start.position);
    physics.state.x = start.position.x + sample.binormal.x * 9.5;
    physics.state.z = start.position.z + sample.binormal.z * 9.5;
    physics.state.heading = Math.atan2(sample.tangent.x, sample.tangent.z);
    physics.state.speed = 0;

    const gasInput: KartInput = { ...neutralInput, gas: true };
    for (let i = 0; i < 60; i++) {
      physics.update(gasInput, 0.016);
    }

    assert.equal(physics.state.isOffroad, true);
    // Off-road cap is maxSpeed * 0.42 (~20.16)
    assert.ok(physics.state.speed <= physics.state.maxSpeed * 0.45);
    assert.ok(physics.state.speed > 15.0);
    track.destroy();
  });

  it('should bounce off barriers when exceeding track limits', () => {
    const track = new TrackSpline();
    const physics = new KartPhysics(track);
    const start = track.getStartGridTransform();

    // Move kart past barrier limit (halfRoad 8 + 3 = 11m)
    const sample = track.getClosestTrackSample(start.position);
    physics.state.x = start.position.x + sample.binormal.x * 12.0;
    physics.state.z = start.position.z + sample.binormal.z * 12.0;
    physics.state.speed = 30.0;

    physics.update(neutralInput, 0.016);
    assert.ok(physics.state.wallBounceCooldown > 0, 'Wall bounce cooldown not triggered');
    assert.ok(physics.state.speed < 30.0 * 0.6, 'Speed not reduced after wall collision');
    track.destroy();
  });

  it('should activate boost and increase max speed during boost window', () => {
    const track = new TrackSpline();
    const physics = new KartPhysics(track);
    physics.triggerBoost(1.5);

    assert.ok(physics.state.boostTimer > 0);
    assert.equal(physics.state.speed, 68.0);

    physics.update(neutralInput, 0.05);
    assert.equal(physics.state.maxSpeed, 68.0);
    track.destroy();
  });
});

describe('ChaseCamera Dynamic FOV & Tracking Tests', () => {
  it('should initialize at base FOV and aspect ratio', () => {
    const cam = new ChaseCamera(16 / 9);
    assert.equal(cam.camera.fov, 60);
    assert.ok(Math.abs(cam.camera.aspect - 16 / 9) < 0.001);
  });

  it('should track behind kart and smoothly increase FOV when boosting', () => {
    const cam = new ChaseCamera(16 / 9);
    const mockKart = {
      x: 0,
      y: 0,
      z: 0,
      speed: 50,
      maxSpeed: 68,
      heading: 0,
      steerAngle: 0,
      angularVelocity: 0,
      isDrifting: false,
      driftDirection: 0,
      driftTime: 0,
      boostTimer: 2.0, // boosting
      isOffroad: false,
      wallBounceCooldown: 0,
      coins: 4,
      currentLap: 1,
      lapProgress: 0,
      rpm: 3000
    };

    // First frame snaps anchor behind kart
    cam.update(mockKart, 0.016);
    assert.ok(cam.camera.position.z < 0, 'Camera should be behind heading 0 (negative Z)');
    assert.ok(cam.camera.position.y > 0, 'Camera should be elevated above ground');

    // Several frames under boost -> FOV rises towards 75
    for (let i = 0; i < 30; i++) {
      cam.update(mockKart, 0.016);
    }
    assert.ok(cam.camera.fov > 65, `Expected FOV kick > 65, got ${cam.camera.fov}`);

    // End boost -> FOV eases back to 60
    mockKart.boostTimer = 0;
    for (let i = 0; i < 60; i++) {
      cam.update(mockKart, 0.016);
    }
    assert.ok(cam.camera.fov < 64, `Expected FOV recovery < 64, got ${cam.camera.fov}`);
  });
});
