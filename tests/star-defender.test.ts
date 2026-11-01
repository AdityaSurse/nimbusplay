/**
 * NimbusPlay — Star Defender Unit Tests
 * Tests AimSolver mathematical lead prediction and ObjectPool allocation.
 * Pure logic unit tests.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AimSolver } from '../src/console/games/star-defender/aim-solver.js';
import { ObjectPool } from '../src/console/games/star-defender/object-pool.js';
import type { StarEnemy } from '../src/console/games/star-defender/types.js';

describe('Star Defender: AimSolver Lead Prediction Math', () => {
  it('should return target position if target has zero velocity', () => {
    const turretX = 960;
    const turretY = 1000;
    const targetX = 960;
    const targetY = 200;
    const { leadX, leadY, timeToHit } = AimSolver.computeLead(
      turretX,
      turretY,
      targetX,
      targetY,
      0,
      0,
      1600
    );

    assert.equal(leadX, 960);
    assert.equal(leadY, 200);
    assert.equal(timeToHit, 0.5); // 800px / 1600px/s = 0.5s
  });

  it('should predict accurate lead position for moving target', () => {
    const turretX = 0;
    const turretY = 1000;
    const targetX = 0;
    const targetY = 0;
    const targetVx = 200; // moving right at 200px/s
    const targetVy = 0;
    const projectileSpeed = 2000; // 1000px / 2000px/s = 0.5s

    const { leadX, leadY, timeToHit } = AimSolver.computeLead(
      turretX,
      turretY,
      targetX,
      targetY,
      targetVx,
      targetVy,
      projectileSpeed
    );

    assert.equal(timeToHit, 0.5);
    assert.equal(leadX, 100); // 0 + 200 * 0.5 = 100
    assert.equal(leadY, 0);
  });

  it('should select closest enemy and calculate lead', () => {
    const enemies: StarEnemy[] = [
      {
        id: 1,
        type: 'fighter',
        x: 500,
        y: 300,
        vx: 100,
        vy: 50,
        hp: 1,
        maxHp: 1,
        radius: 20,
        scoreValue: 100,
        alive: true,
        shootTimer: 0,
        patternTime: 0,
        patternParam: 0,
        flashTimer: 0
      },
      {
        id: 2,
        type: 'scout',
        x: 900,
        y: 400,
        vx: -50,
        vy: 100,
        hp: 1,
        maxHp: 1,
        radius: 20,
        scoreValue: 150,
        alive: true,
        shootTimer: 0,
        patternTime: 0,
        patternParam: 0,
        flashTimer: 0
      }
    ];

    // Reticle is close to enemy 1 (at 520, 310)
    const result = AimSolver.findLeadTarget(enemies, 520, 310, 960, 1000, 1800, 100);
    assert.equal(result.hasLead, true);
    assert.equal(result.targetEnemy?.id, 1);
    assert.ok(result.leadX > 500); // Moving right
  });

  it('should return no lead if reticle is too far from any enemy', () => {
    const enemies: StarEnemy[] = [
      {
        id: 1,
        type: 'fighter',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        hp: 1,
        maxHp: 1,
        radius: 20,
        scoreValue: 100,
        alive: true,
        shootTimer: 0,
        patternTime: 0,
        patternParam: 0,
        flashTimer: 0
      }
    ];

    const result = AimSolver.findLeadTarget(enemies, 900, 900, 960, 1000, 1800, 100);
    assert.equal(result.hasLead, false);
    assert.equal(result.targetEnemy, null);
  });
});

describe('Star Defender: Generic ObjectPool Allocation', () => {
  it('should acquire, track active count, and release items', () => {
    interface TestItem {
      id: number;
      alive: boolean;
    }

    const pool = new ObjectPool<TestItem>(
      3,
      (idx) => ({ id: idx, alive: false }),
      (item) => { item.alive = true; }
    );

    assert.equal(pool.activeCount, 0);

    const item1 = pool.acquire();
    assert.ok(item1);
    assert.equal(item1.alive, true);
    assert.equal(pool.activeCount, 1);

    const item2 = pool.acquire();
    const item3 = pool.acquire();
    assert.equal(pool.activeCount, 3);

    // Pool full
    const item4 = pool.acquire();
    assert.equal(item4, null);

    // Release item2
    pool.release(item2!);
    assert.equal(pool.activeCount, 2);

    // Re-acquire should reuse slot
    const reacquired = pool.acquire();
    assert.ok(reacquired);
    assert.equal(pool.activeCount, 3);

    pool.releaseAll();
    assert.equal(pool.activeCount, 0);
  });
});
