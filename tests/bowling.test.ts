import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BowlingScorecard } from '../src/console/games/bowl-blitz/bowling-scorecard.js';
import { ThrowDetector } from '../src/console/games/bowl-blitz/throw-detector.js';
import { BowlingPhysics } from '../src/console/games/bowl-blitz/bowling-physics.js';
import type { GameInputState } from '../src/console/games/common/game-interface.js';
import { BUTTON_MASKS } from '../src/shared/protocol.js';

describe('Bowl Blitz: BowlingScorecard Official Scoring Tests', () => {
  it('should score a perfect game of 300 (12 consecutive strikes)', () => {
    const card = new BowlingScorecard();
    for (let i = 0; i < 12; i++) {
      const res = card.recordRoll(10);
      assert.equal(res.isStrike, true);
    }

    assert.equal(card.isGameComplete(), true);
    assert.equal(card.getTotalScore(), 300);

    const frames = card.getFrames();
    assert.equal(frames.length, 10);
    assert.equal(frames[0].score, 30);
    assert.equal(frames[1].score, 60);
    assert.equal(frames[8].score, 270);
    assert.equal(frames[9].score, 300);
  });

  it('should score an all-spares game of 150 (all 5s)', () => {
    const card = new BowlingScorecard();
    // 10 frames of (5 + 5/) plus 1 bonus roll of 5 in 10th frame = 21 rolls
    for (let i = 0; i < 21; i++) {
      card.recordRoll(5);
    }

    assert.equal(card.isGameComplete(), true);
    assert.equal(card.getTotalScore(), 150);

    const frames = card.getFrames();
    assert.equal(frames[0].score, 15);
    assert.equal(frames[1].score, 30);
    assert.equal(frames[9].score, 150);
  });

  it('should score open frames with no bonuses correctly', () => {
    const card = new BowlingScorecard();
    // 10 frames of 4 and 3 = 7 per frame => 70 total
    for (let i = 0; i < 10; i++) {
      card.recordRoll(4);
      card.recordRoll(3);
    }

    assert.equal(card.isGameComplete(), true);
    assert.equal(card.getTotalScore(), 70);

    const frames = card.getFrames();
    assert.equal(frames[0].score, 7);
    assert.equal(frames[1].score, 14);
    assert.equal(frames[9].score, 70);
  });

  it('should compute strike and spare bonuses with subsequent rolls', () => {
    const card = new BowlingScorecard();
    // Frame 1: Strike (10)
    card.recordRoll(10);
    // Frame 2: 7, 2 -> Frame 1 score = 10 + 7 + 2 = 19; Frame 2 = 19 + 9 = 28
    card.recordRoll(7);
    card.recordRoll(2);

    let frames = card.getFrames();
    assert.equal(frames[0].score, 19);
    assert.equal(frames[1].score, 28);

    // Frame 3: Spare (6 + 4)
    card.recordRoll(6);
    card.recordRoll(4);
    // Score not finalized until next roll
    assert.equal(frames[2].score, null);

    // Frame 4: 8, 1 -> Frame 3 score = 28 + 10 + 8 = 46; Frame 4 = 46 + 9 = 55
    card.recordRoll(8);
    card.recordRoll(1);

    frames = card.getFrames();
    assert.equal(frames[2].score, 46);
    assert.equal(frames[3].score, 55);
  });

  it('should end 10th frame on 2 rolls if no strike or spare achieved', () => {
    const card = new BowlingScorecard();
    // 9 strikes
    for (let i = 0; i < 9; i++) {
      card.recordRoll(10);
    }
    assert.equal(card.getCurrentFrameNumber(), 10);
    assert.equal(card.isGameComplete(), false);

    // 10th frame: open frame (4, 4)
    card.recordRoll(4);
    assert.equal(card.isGameComplete(), false);
    const res = card.recordRoll(4);
    assert.equal(res.isGameOver, true);
    assert.equal(card.isGameComplete(), true);
  });

  it('should allow 3 rolls in 10th frame if spare is scored on roll 2', () => {
    const card = new BowlingScorecard();
    // 9 strikes
    for (let i = 0; i < 9; i++) {
      card.recordRoll(10);
    }

    // 10th frame: 7, 3 (spare)
    card.recordRoll(7);
    card.recordRoll(3);
    assert.equal(card.isGameComplete(), false);
    assert.equal(card.getCurrentRollNumber(), 3);

    // 3rd bonus roll
    const res = card.recordRoll(9);
    assert.equal(res.isGameOver, true);
    assert.equal(card.isGameComplete(), true);
  });
});

describe('Bowl Blitz: ThrowDetector Mechanics', () => {
  const createMockInput = (overrides?: Partial<GameInputState>): GameInputState => ({
    pointerX: 960,
    pointerY: 540,
    isSliceHeld: false,
    rawBitmask: 0,
    isAJustPressed: false,
    isBJustPressed: false,
    isHomeJustPressed: false,
    ...overrides
  });

  it('should oscillate power meter progress when B is held in fallback mode', () => {
    const detector = new ThrowDetector();
    const inputHeld = createMockInput({ rawBitmask: BUTTON_MASKS.B });

    assert.equal(detector.isArmedState(), false);
    detector.update(inputHeld, 0.2, true); // dt = 0.2s
    assert.equal(detector.isArmedState(), true);
    assert.ok(detector.getPowerMeterProgress() > 0.15);
  });

  it('should release throw parameters on B release in power meter mode', () => {
    const detector = new ThrowDetector();
    const inputHeld = createMockInput({ rawBitmask: BUTTON_MASKS.B, pointerX: 1000 });
    detector.update(inputHeld, 0.3, true);

    const inputReleased = createMockInput({ rawBitmask: 0, pointerX: 1050 });
    const throwParams = detector.update(inputReleased, 0.016, true);

    assert.ok(throwParams !== null);
    assert.ok(throwParams.speed >= 700);
    assert.ok(throwParams.speed <= 1280);
    assert.equal(throwParams.startX, 1050);
    assert.ok(throwParams.hookSpin > 0); // drifted right
  });

  it('should detect dynamic accelerometer swing in motion mode', () => {
    const detector = new ThrowDetector();
    // Step 1: Hold B button to arm
    const armInput = createMockInput({
      rawBitmask: BUTTON_MASKS.B,
      accel: { x: 0, y: 1.0, z: 9.8 },
      gyro: { alpha: 0, beta: 0, gamma: 0 }
    });
    detector.update(armInput, 0.016, false);
    assert.equal(detector.isArmedState(), true);

    // Step 2: Forward swing acceleration peak
    const swingInput = createMockInput({
      rawBitmask: BUTTON_MASKS.B,
      accel: { x: 0, y: 8.5, z: 9.8 }, // strong forward swing
      gyro: { alpha: 5.0, beta: 0, gamma: -15.0 } // slight left hook spin
    });
    detector.update(swingInput, 0.016, false);

    // Step 3: Release B to throw
    const releaseInput = createMockInput({
      rawBitmask: 0,
      accel: { x: 0, y: 2.0, z: 9.8 },
      gyro: { alpha: 5.0, beta: 0, gamma: -15.0 }
    });
    const throwParams = detector.update(releaseInput, 0.016, false);

    assert.ok(throwParams !== null);
    assert.ok(throwParams.speed > 800);
    assert.ok(throwParams.hookSpin < 0); // negative roll rate -> left hook
  });
});

describe('Bowl Blitz: BowlingPhysics Perspective & Collision Tests', () => {
  it('should calculate correct perspective lane boundaries', () => {
    const foulBounds = BowlingPhysics.getLaneBoundaries(BowlingPhysics.FOUL_LINE_Y);
    assert.equal(foulBounds.left, 480);
    assert.equal(foulBounds.right, 1440);
    assert.equal(foulBounds.width, 960);

    const deckBounds = BowlingPhysics.getLaneBoundaries(BowlingPhysics.PIN_DECK_Y);
    assert.equal(deckBounds.left, 780);
    assert.equal(deckBounds.right, 1140);
    assert.equal(deckBounds.width, 360);
  });

  it('should scale perspective factor between foul line and pin deck', () => {
    const foulScale = BowlingPhysics.getPerspectiveScale(BowlingPhysics.FOUL_LINE_Y);
    const deckScale = BowlingPhysics.getPerspectiveScale(BowlingPhysics.PIN_DECK_Y);

    assert.equal(foulScale, 1.0);
    assert.ok(Math.abs(deckScale - 0.40) < 0.01);
  });

  it('should detect gutter drop when ball veers off the lane', () => {
    const ball = {
      x: 300, // well outside lane boundaries at foul line (480)
      y: 800,
      vx: -50,
      vy: -800,
      radius: 20,
      isGutter: false
    };

    const params = {
      speed: 800,
      aimAngle: -0.2,
      hookSpin: 0,
      startX: 300
    };

    BowlingPhysics.updateBall(ball, params, 0.016);
    assert.equal(ball.isGutter, true);
  });

  it('should resolve ball collision with pin', () => {
    const ball = {
      x: 960,
      y: 280,
      vx: 0,
      vy: -600,
      radius: 15,
      isGutter: false
    };

    const pins = [
      {
        id: 1,
        x: 960,
        y: 275,
        baseX: 960,
        baseY: 275,
        knocked: false,
        vx: 0,
        vy: 0,
        rotation: 0,
        angularVelocity: 0,
        scale: 0.42,
        alpha: 1.0
      }
    ];

    const result = BowlingPhysics.resolveCollisions(ball, pins, 0.016);
    assert.equal(result.newlyKnocked, 1);
    assert.equal(pins[0].knocked, true);
    assert.ok(pins[0].vy < 0); // Pin knocked backwards
  });
});

