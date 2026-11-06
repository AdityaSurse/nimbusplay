import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SensorFusion } from '../src/console/pointer/sensor-fusion.js';
import { PointerPipeline } from '../src/console/pointer/pipeline.js';
import { SettingsManager } from '../src/console/pointer/settings-manager.js';
import { HapticsManager, HAPTIC_PATTERNS } from '../src/controller/haptics.js';
import { NimbusDataChannelPeer } from '../src/shared/webrtc.js';
import { type CompactMotionPacket } from '../src/shared/protocol.js';

describe('Task 5 — Sensor Fusion & Drift Elimination Tests', () => {
  it('should initialize with zero orientation and reset cleanly', () => {
    const fusion = new SensorFusion();
    const ori = fusion.getOrientation();
    assert.strictEqual(ori.pitch, 0);
    assert.strictEqual(ori.roll, 0);

    fusion.reset();
    assert.strictEqual(fusion.getOrientation().pitch, 0);
  });

  it('should converge pitch and roll towards gravity using complementary filter', () => {
    const fusion = new SensorFusion();
    // Simulate phone tilted 30 degrees pitch
    const gyro = { alpha: 0, beta: 0, gamma: 0 };
    const accel = { x: 0, y: 4.9, z: 8.48 }; // ~30 deg pitch
    
    // First update initializes to accel tilt
    const f1 = fusion.update(gyro, accel, 0.016);
    assert.ok(f1.pitch > 25 && f1.pitch < 35, `Pitch should be near 30 deg, got ${f1.pitch}`);

    // If gyro has 0 angular rate, orientation stays locked to gravity without drift
    for (let i = 0; i < 60; i++) {
      fusion.update(gyro, accel, 0.016);
    }
    const f2 = fusion.getOrientation();
    assert.ok(Math.abs(f2.pitch - f1.pitch) < 1.0, `Pitch drifted! prev: ${f1.pitch}, now: ${f2.pitch}`);
  });

  it('should project gyro rates onto gravity vector for earth-stabilized yaw', () => {
    const fusion = new SensorFusion();
    const gyro = { alpha: 25, beta: 0, gamma: 0 }; // 25 deg/s yaw
    const accel = { x: 0, y: 0, z: 9.8 }; // pointing flat forward
    
    const fused = fusion.update(gyro, accel, 0.016);
    assert.ok(Math.abs(fused.yawRate) > 0, 'Should derive non-zero earth-stabilized yaw rate');
  });
});

describe('Task 5 — Dead-Reckoning Cursor Prediction Tests', () => {
  it('should extrapolate cursor position based on filtered velocity between network frames', () => {
    const pipeline = new PointerPipeline({ width: 1920, height: 1080 });
    
    // Feed two packets with rightward yaw (alpha: -30) to establish +X velocity
    pipeline.processMotionSample({
      rotationRate: { alpha: -30, beta: 0, gamma: 0 },
      acceleration: { x: 0, y: 0, z: 9.8 }
    }, 1000);

    const pos2 = pipeline.processMotionSample({
      rotationRate: { alpha: -30, beta: 0, gamma: 0 },
      acceleration: { x: 0, y: 0, z: 9.8 }
    }, 1016);

    assert.ok(pos2.vx > 0, `Velocity vx should be positive, got ${pos2.vx}`);

    // Extrapolate ahead by 20ms
    const pred = pipeline.predict(1036);
    assert.ok(pred.x > pos2.x, `Predicted X (${pred.x}) should be greater than last packet X (${pos2.x})`);
    assert.ok(pred.x <= 1920, 'Predicted X must not exceed stage boundaries');
  });

  it('should reset velocity and cancel prediction instantly on recenter()', () => {
    const pipeline = new PointerPipeline({ width: 1920, height: 1080 });
    pipeline.processMotionSample({
      rotationRate: { alpha: 50, beta: 50, gamma: 0 },
      acceleration: { x: 0, y: 0, z: 9.8 }
    }, 1000);

    const recentered = pipeline.recenter();
    assert.strictEqual(recentered.x, 960);
    assert.strictEqual(recentered.y, 540);
    assert.strictEqual(recentered.vx, 0);
    assert.strictEqual(recentered.vy, 0);

    // After recenter, predict should remain at center
    const pred = pipeline.predict(1050);
    assert.strictEqual(pred.x, 960);
    assert.strictEqual(pred.y, 540);
  });
});

describe('Task 5 — Per-Game Pointer Settings Persistence Tests', () => {
  it('should store and retrieve distinct sensitivity and deadzone per game', () => {
    const mgr = new SettingsManager();

    // Default global settings
    mgr.setActiveGame('global');
    mgr.update({ sensitivity: 1.2, deadZone: 0.4 });
    assert.strictEqual(mgr.getSettings().sensitivity, 1.2);

    // Turbo Circuit custom high sensitivity
    mgr.setActiveGame('turboCircuit');
    mgr.update({ sensitivity: 2.5, deadZone: 0.2 });
    assert.strictEqual(mgr.getSettings().sensitivity, 2.5);
    assert.strictEqual(mgr.getSettings().deadZone, 0.2);

    // Sketch custom precision sensitivity
    mgr.setActiveGame('sketch');
    mgr.update({ sensitivity: 0.8, deadZone: 0.6 });
    assert.strictEqual(mgr.getSettings().sensitivity, 0.8);
    assert.strictEqual(mgr.getSettings().deadZone, 0.6);

    // Switching back to turboCircuit retains its specific settings
    mgr.setActiveGame('turboCircuit');
    assert.strictEqual(mgr.getSettings().sensitivity, 2.5);

    // Switching back to global retains global settings
    mgr.setActiveGame('global');
    assert.strictEqual(mgr.getSettings().sensitivity, 1.2);
  });
});

describe('Task 5 — HapticsManager & Waveforms Tests', () => {
  it('should provide predefined waveforms for all 6 required game actions', () => {
    const requiredWaveforms = ['click', 'slice', 'laser', 'target_hit', 'kart_boost', 'wall_bump'] as const;
    for (const wf of requiredWaveforms) {
      assert.ok(HAPTIC_PATTERNS[wf] !== undefined, `Pattern missing for ${wf}`);
      assert.ok(HAPTIC_PATTERNS[wf].length > 0, `Pattern for ${wf} must be non-empty`);
    }
  });

  it('should allow toggling haptics enabled/disabled', () => {
    const haptics = new HapticsManager();
    haptics.setEnabled(true);
    assert.strictEqual(haptics.isEnabled(), true);
    haptics.setEnabled(false);
    assert.strictEqual(haptics.isEnabled(), false);
    // When disabled, trigger should return false immediately
    assert.strictEqual(haptics.trigger('click'), false);
  });
});

describe('Task 5 — WebRTC DataChannel & Latest-Wins Sequence Tests', () => {
  it('should verify NimbusDataChannelPeer static support check', () => {
    assert.strictEqual(typeof NimbusDataChannelPeer.isSupported, 'function');
  });

  it('should simulate latest-wins sequence packet filtering', () => {
    let lastSequence = 0;
    const processedSequences: number[] = [];

    const ingest = (pkt: CompactMotionPacket) => {
      if (pkt.s <= lastSequence) return false;
      lastSequence = pkt.s;
      processedSequences.push(pkt.s);
      return true;
    };

    assert.strictEqual(ingest({ t: 'F', s: 1, ts: 100, b: 0, r: [0, 0, 0], a: [0, 0, 9.8] }), true);
    assert.strictEqual(ingest({ t: 'F', s: 3, ts: 130, b: 0, r: [0, 0, 0], a: [0, 0, 9.8] }), true);
    // Out of order packet s: 2 should be rejected!
    assert.strictEqual(ingest({ t: 'F', s: 2, ts: 120, b: 0, r: [0, 0, 0], a: [0, 0, 9.8] }), false);
    // Duplicate packet s: 3 should be rejected!
    assert.strictEqual(ingest({ t: 'F', s: 3, ts: 130, b: 0, r: [0, 0, 0], a: [0, 0, 9.8] }), false);
    // Newer packet s: 4 accepted!
    assert.strictEqual(ingest({ t: 'F', s: 4, ts: 145, b: 0, r: [0, 0, 0], a: [0, 0, 9.8] }), true);

    assert.deepStrictEqual(processedSequences, [1, 3, 4]);
  });
});
