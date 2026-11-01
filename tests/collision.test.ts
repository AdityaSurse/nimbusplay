import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SliceCollision } from '../src/console/games/slice-party/collision.js';

describe('SliceCollision Swept-Segment vs Circle Tests', () => {
  const circleCenter = { x: 500, y: 500 };
  const radius = 50;

  it('should detect a direct horizontal cut through circle center', () => {
    const p1 = { x: 400, y: 500 };
    const p2 = { x: 600, y: 500 };

    const res = SliceCollision.testSegmentCircle(p1, p2, circleCenter, radius);
    assert.equal(res.hit, true);
    assert.equal(res.hitPoint.x, 500);
    assert.equal(res.hitPoint.y, 500);
    assert.equal(res.cutAngle, 0); // 0 radians = horizontal rightward
  });

  it('should detect a vertical slice cutting through circle', () => {
    const p1 = { x: 500, y: 400 };
    const p2 = { x: 500, y: 600 };

    const res = SliceCollision.testSegmentCircle(p1, p2, circleCenter, radius);
    assert.equal(res.hit, true);
    assert.equal(res.hitPoint.x, 500);
    assert.equal(res.hitPoint.y, 500);
    assert.ok(Math.abs(res.cutAngle - Math.PI / 2) < 1e-4);
  });

  it('should detect a diagonal swipe crossing the perimeter', () => {
    const p1 = { x: 400, y: 400 };
    const p2 = { x: 600, y: 600 };

    const res = SliceCollision.testSegmentCircle(p1, p2, circleCenter, radius);
    assert.equal(res.hit, true);
    assert.ok(Math.abs(res.cutAngle - Math.PI / 4) < 1e-4);
  });

  it('should return false when a segment passes outside circle radius', () => {
    const p1 = { x: 400, y: 300 };
    const p2 = { x: 600, y: 300 }; // 200px away on Y

    const res = SliceCollision.testSegmentCircle(p1, p2, circleCenter, radius);
    assert.equal(res.hit, false);
  });

  it('should return false when segment points towards circle but does not reach it', () => {
    const p1 = { x: 200, y: 500 };
    const p2 = { x: 400, y: 500 }; // Stops at x=400, circle starts at x=450

    const res = SliceCollision.testSegmentCircle(p1, p2, circleCenter, radius);
    assert.equal(res.hit, false);
  });
});

