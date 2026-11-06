import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OneEuroFilter, OneEuroFilter2D } from '../src/console/pointer/one-euro-filter.js';
import { AimMapper } from '../src/console/pointer/aim-mapper.js';
import { PointerPipeline } from '../src/console/pointer/pipeline.js';
import { CalibrationManager } from '../src/console/pointer/calibration.js';

describe('OneEuroFilter Unit Tests', () => {
  it('should initialize and return the initial raw value on first sample', () => {
    const filter = new OneEuroFilter(1.0, 0.01);
    const val = filter.filter(100, 0.016);
    assert.equal(val, 100);
  });

  it('should smooth stationary jitter over successive samples', () => {
    const filter = new OneEuroFilter(1.0, 0.005);
    filter.filter(100, 0.016);

    // Apply high frequency jitter (100 +- 2)
    const outputs: number[] = [];
    for (let i = 0; i < 20; i++) {
      const noisy = 100 + (i % 2 === 0 ? 2 : -2);
      outputs.push(filter.filter(noisy, 0.016));
    }

    // Filtered output should stay very close to 100 with deviation significantly dampened
    const lastOutput = outputs[outputs.length - 1];
    assert.ok(Math.abs(lastOutput - 100) < 1.0, `Expected smoothed jitter < 1.0, got ${lastOutput}`);
  });

  it('should adapt to fast movement with low lag', () => {
    const filter = new OneEuroFilter(1.0, 0.02);
    filter.filter(0, 0.016);

    // Rapid velocity swipe: +100 per frame
    let current = 0;
    for (let i = 1; i <= 10; i++) {
      current += 100;
      filter.filter(current, 0.016);
    }
    const finalVal = filter.filter(1100, 0.016);
    // At fast speeds, filter should follow closely (within 15% lag)
    assert.ok(finalVal > 950, `Expected fast response > 950, got ${finalVal}`);
  });

  it('should reset position cleanly when requested', () => {
    const filter2D = new OneEuroFilter2D(1.2, 0.008);
    filter2D.filter(500, 300, 0.016);
    filter2D.reset(960, 540);
    const out = filter2D.filter(960, 540, 0.016);
    assert.equal(out.x, 960);
    assert.equal(out.y, 540);
  });
});

describe('AimMapper Gravity-Compensated Aim Tests', () => {
  it('should map horizontal yaw when phone is held flat', () => {
    // Flat phone: gravity in +Z
    const accel = { x: 0, y: 0, z: 9.8 };
    // Rotating right around vertical (yaw): alpha = -20 deg/s
    const gyro = { alpha: -20, beta: 0, gamma: 0 };
    const aim = AimMapper.mapToAim(gyro, accel);

    assert.ok(aim.yawRate > 15, `Expected positive rightward yaw rate, got ${aim.yawRate}`);
    assert.equal(aim.pitchRate, 0);
  });

  it('should map vertical pitch when phone is held flat', () => {
    const accel = { x: 0, y: 0, z: 9.8 };
    // Tilting nose up: beta = 20 deg/s
    const gyro = { alpha: 0, beta: 20, gamma: 0 };
    const aim = AimMapper.mapToAim(gyro, accel);

    assert.ok(aim.pitchRate > 15, `Expected positive upward pitch rate, got ${aim.pitchRate}`);
    assert.equal(aim.yawRate, 0);
  });

  it('should maintain yaw and pitch aim invariance when phone is rolled 90 degrees', () => {
    // Phone rolled 90 deg sideways: gravity is in +X (along lateral axis)
    const accel = { x: 9.8, y: 0, z: 0 };
    
    // In rolled state, horizontal panning in room rotates around device X (beta = -20)
    const gyroYaw = { alpha: 0, beta: -20, gamma: 0 };
    const aimYaw = AimMapper.mapToAim(gyroYaw, accel);

    assert.ok(aimYaw.yawRate > 15, `Expected rolled yaw rate > 15, got ${aimYaw.yawRate}`);
    assert.ok(Math.abs(aimYaw.pitchRate) < 0.1, `Expected rolled pitch ~ 0, got ${aimYaw.pitchRate}`);

    // In rolled state, pitching nose up rotates in negative alpha direction
    const gyroPitch = { alpha: -20, beta: 0, gamma: 0 };
    const aimPitch = AimMapper.mapToAim(gyroPitch, accel);

    assert.ok(aimPitch.pitchRate > 15, `Expected rolled pitch rate > 15, got ${aimPitch.pitchRate}`);
    assert.ok(Math.abs(aimPitch.yawRate) < 0.1, `Expected rolled yaw ~ 0, got ${aimPitch.yawRate}`);
  });
});

describe('PointerPipeline Integration & Boundary Tests', () => {
  const viewport = { width: 1920, height: 1080 };

  it('should suppress micro-tremor jitter under dead zone threshold', () => {
    const pipeline = new PointerPipeline(viewport, { deadZone: 0.6 });
    const initial = pipeline.getPosition();
    assert.equal(initial.x, 960);
    assert.equal(initial.y, 540);

    // Apply micro-jitter below 0.6 deg/s
    const sample = {
      rotationRate: { alpha: -0.3, beta: 0.2, gamma: 0 },
      acceleration: { x: 0, y: 0, z: 9.8 }
    };

    for (let i = 0; i < 30; i++) {
      pipeline.processMotionSample(sample, i * 16.6);
    }

    const pos = pipeline.getPosition();
    assert.equal(pos.x, 960, 'Sub-deadzone movement must not move X');
    assert.equal(pos.y, 540, 'Sub-deadzone movement must not move Y');
  });

  it('should move cursor smoothly when movement exceeds dead zone', () => {
    const pipeline = new PointerPipeline(viewport, { deadZone: 0.5, sensitivity: 1.0 });

    const sample = {
      rotationRate: { alpha: -25, beta: 0, gamma: 0 }, // Rightward yaw
      acceleration: { x: 0, y: 0, z: 9.8 }
    };

    let pos = pipeline.getPosition();
    for (let i = 1; i <= 10; i++) {
      pos = pipeline.processMotionSample(sample, i * 16.6);
    }

    assert.ok(pos.x > 960, `Cursor should have moved right from 960, got ${pos.x}`);
    assert.equal(pos.y, 540);
  });

  it('should clamp cursor within viewport bounds under continuous displacement', () => {
    const pipeline = new PointerPipeline(viewport, { deadZone: 0.2, sensitivity: 2.0 });

    // Extreme rightward velocity
    const sampleRight = {
      rotationRate: { alpha: -500, beta: 0, gamma: 0 },
      acceleration: { x: 0, y: 0, z: 9.8 }
    };

    let pos = pipeline.getPosition();
    for (let i = 1; i <= 60; i++) {
      pos = pipeline.processMotionSample(sampleRight, i * 16.6);
    }

    assert.ok(pos.x <= 1920, `Cursor must not exceed viewport width, got ${pos.x}`);
    assert.equal(pos.x, 1920, `Cursor should reach exact right edge (1920), got ${pos.x}`);
  });

  it('should instantly recenter to viewport center on recenter()', () => {
    const pipeline = new PointerPipeline(viewport);
    pipeline.setMousePosition(100, 100);

    const pos = pipeline.recenter();
    assert.equal(pos.x, 960);
    assert.equal(pos.y, 540);
    assert.equal(pos.isRecentered, true);
  });

  it('should scale cursor displacement proportionally with sensitivity setting', () => {
    const pipelineLow = new PointerPipeline(viewport, { deadZone: 0.1, sensitivity: 1.0 });
    const pipelineHigh = new PointerPipeline(viewport, { deadZone: 0.1, sensitivity: 2.0 });

    const sample = {
      rotationRate: { alpha: -20, beta: 0, gamma: 0 },
      acceleration: { x: 0, y: 0, z: 9.8 }
    };

    let posLow = pipelineLow.getPosition();
    let posHigh = pipelineHigh.getPosition();

    for (let i = 1; i <= 10; i++) {
      posLow = pipelineLow.processMotionSample(sample, i * 16.6);
      posHigh = pipelineHigh.processMotionSample(sample, i * 16.6);
    }

    const deltaLow = posLow.x - 960;
    const deltaHigh = posHigh.x - 960;

    assert.ok(deltaHigh > deltaLow * 1.7, `Expected high sensitivity to move ~2x further: high=${deltaHigh}, low=${deltaLow}`);
  });

  it('should clamp cursor cleanly to exact boundary edges and reach all 4 corners', () => {
    const pipeline = new PointerPipeline(viewport, { deadZone: 0.1, sensitivity: 3.0 });

    // 1. Top-Left Corner: Drive hard yaw-left and pitch-up
    const sampleTopLeft = {
      rotationRate: { alpha: 300, beta: 300, gamma: 0 },
      acceleration: { x: 0, y: 0, z: 9.8 }
    };
    for (let i = 1; i <= 60; i++) {
      pipeline.processMotionSample(sampleTopLeft, i * 16.6);
    }
    const posTopLeft = pipeline.getPosition();
    assert.equal(posTopLeft.x, 0, `Top-Left corner X must reach exact 0, got ${posTopLeft.x}`);
    assert.equal(posTopLeft.y, 0, `Top-Left corner Y must reach exact 0, got ${posTopLeft.y}`);

    // 2. Top-Right Corner: Drive hard yaw-right and keep pitch-up
    const sampleTopRight = {
      rotationRate: { alpha: -300, beta: 300, gamma: 0 },
      acceleration: { x: 0, y: 0, z: 9.8 }
    };
    for (let i = 61; i <= 120; i++) {
      pipeline.processMotionSample(sampleTopRight, i * 16.6);
    }
    const posTopRight = pipeline.getPosition();
    assert.equal(posTopRight.x, 1920, `Top-Right corner X must reach exact 1920, got ${posTopRight.x}`);
    assert.equal(posTopRight.y, 0, `Top-Right corner Y must reach exact 0, got ${posTopRight.y}`);

    // 3. Bottom-Left Corner: Drive hard yaw-left and pitch-down
    const sampleBottomLeft = {
      rotationRate: { alpha: 300, beta: -300, gamma: 0 },
      acceleration: { x: 0, y: 0, z: 9.8 }
    };
    for (let i = 121; i <= 180; i++) {
      pipeline.processMotionSample(sampleBottomLeft, i * 16.6);
    }
    const posBottomLeft = pipeline.getPosition();
    assert.equal(posBottomLeft.x, 0, `Bottom-Left corner X must reach exact 0, got ${posBottomLeft.x}`);
    assert.equal(posBottomLeft.y, 1080, `Bottom-Left corner Y must reach exact 1080, got ${posBottomLeft.y}`);

    // 4. Bottom-Right Corner: Drive hard yaw-right and pitch-down
    const sampleBottomRight = {
      rotationRate: { alpha: -300, beta: -300, gamma: 0 },
      acceleration: { x: 0, y: 0, z: 9.8 }
    };
    for (let i = 181; i <= 240; i++) {
      pipeline.processMotionSample(sampleBottomRight, i * 16.6);
    }
    const posBottomRight = pipeline.getPosition();
    assert.equal(posBottomRight.x, 1920, `Bottom-Right corner X must reach exact 1920, got ${posBottomRight.x}`);
    assert.equal(posBottomRight.y, 1080, `Bottom-Right corner Y must reach exact 1080, got ${posBottomRight.y}`);
  });

  it('should allow mouse fallback position override and update smoothly', () => {
    const pipeline = new PointerPipeline(viewport);
    pipeline.setMousePosition(450, 320);

    const pos = pipeline.getPosition();
    assert.equal(pos.x, 450);
    assert.equal(pos.y, 320);
  });
});

describe('CalibrationManager Unit Tests', () => {
  it('should collect 60 samples and compute exact mean bias', () => {
    let calibratedResult: { biasYaw: number; biasPitch: number } | null = null;
    const calib = new CalibrationManager(
      () => {},
      (result) => { calibratedResult = result; }
    );

    calib.start(() => {}, (result) => { calibratedResult = result; });

    // Constant drift of +1.5 deg/s yaw and -0.8 deg/s pitch
    const sample = {
      rotationRate: { alpha: -1.5, beta: 0.8, gamma: 0 },
      acceleration: { x: 0, y: 0, z: 9.8 }
    };

    for (let i = 0; i < 60; i++) {
      calib.ingestSample(sample);
    }

    assert.ok(calibratedResult !== null, 'Calibration should have completed after 60 samples');
    assert.ok(Math.abs(calibratedResult!.biasYaw - 1.5) < 0.01, `Expected biasYaw ~ 1.5, got ${calibratedResult!.biasYaw}`);
    assert.ok(Math.abs(calibratedResult!.biasPitch - 0.8) < 0.01, `Expected biasPitch ~ 0.8, got ${calibratedResult!.biasPitch}`);
  });
});
