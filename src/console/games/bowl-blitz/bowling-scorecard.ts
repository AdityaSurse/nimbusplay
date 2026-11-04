/**
 * NimbusPlay — Official 10-Frame Bowling Scorecard Engine
 * Calculates standard bowling scoring including strikes, spares, bonuses, and 10th frame.
 * Strictly typed with zero `any`.
 */

import type { FrameScore } from './types.js';

export class BowlingScorecard {
  private frames: FrameScore[] = [];
  private currentFrameIndex = 0; // 0 to 9
  private currentRollNum = 1;    // 1 to 3
  private rolls: number[] = [];
  private gameOver = false;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.frames = [];
    for (let i = 1; i <= 10; i++) {
      this.frames.push({
        frameNum: i,
        roll1: null,
        roll2: null,
        roll3: i === 10 ? null : undefined,
        score: null,
        isStrike: false,
        isSpare: false
      });
    }
    this.currentFrameIndex = 0;
    this.currentRollNum = 1;
    this.rolls = [];
    this.gameOver = false;
  }

  public recordRoll(pins: number): { isStrike: boolean; isSpare: boolean; isFrameOver: boolean; isGameOver: boolean } {
    if (this.gameOver) {
      return { isStrike: false, isSpare: false, isFrameOver: true, isGameOver: true };
    }

    const clampedPins = Math.max(0, Math.min(10, pins));
    this.rolls.push(clampedPins);

    const f = this.frames[this.currentFrameIndex];
    let isStrike = false;
    let isSpare = false;
    let isFrameOver = false;

    if (this.currentFrameIndex < 9) {
      // Frames 1 to 9
      if (this.currentRollNum === 1) {
        f.roll1 = clampedPins;
        if (clampedPins === 10) {
          f.isStrike = true;
          isStrike = true;
          isFrameOver = true;
          this.currentFrameIndex++;
          this.currentRollNum = 1;
        } else {
          this.currentRollNum = 2;
        }
      } else {
        f.roll2 = clampedPins;
        if ((f.roll1 ?? 0) + clampedPins === 10) {
          f.isSpare = true;
          isSpare = true;
        }
        isFrameOver = true;
        this.currentFrameIndex++;
        this.currentRollNum = 1;
      }
    } else {
      // 10th Frame
      if (this.currentRollNum === 1) {
        f.roll1 = clampedPins;
        if (clampedPins === 10) {
          f.isStrike = true;
          isStrike = true;
        }
        this.currentRollNum = 2;
      } else if (this.currentRollNum === 2) {
        f.roll2 = clampedPins;
        if (clampedPins === 10) {
          isStrike = true;
        } else if (!f.isStrike && (f.roll1 ?? 0) + clampedPins === 10) {
          f.isSpare = true;
          isSpare = true;
        }

        // Check if 3rd roll earned
        if (f.isStrike || f.isSpare || clampedPins === 10) {
          this.currentRollNum = 3;
        } else {
          isFrameOver = true;
          this.gameOver = true;
        }
      } else if (this.currentRollNum === 3) {
        f.roll3 = clampedPins;
        if (clampedPins === 10) {
          isStrike = true;
        } else if ((f.roll2 ?? 0) !== 10 && (f.roll2 ?? 0) + clampedPins === 10) {
          isSpare = true;
        }
        isFrameOver = true;
        this.gameOver = true;
      }
    }

    this.recalculateScores();

    return {
      isStrike,
      isSpare,
      isFrameOver,
      isGameOver: this.gameOver
    };
  }

  public recalculateScores(): void {
    let rollIdx = 0;
    let runningTotal = 0;

    for (let fIdx = 0; fIdx < 10; fIdx++) {
      const f = this.frames[fIdx];

      if (fIdx < 9) {
        // Standard Frame 1-9
        if (rollIdx >= this.rolls.length) break;

        if (this.rolls[rollIdx] === 10) {
          // Strike: 10 + next 2 rolls
          if (rollIdx + 2 < this.rolls.length) {
            runningTotal += 10 + this.rolls[rollIdx + 1] + this.rolls[rollIdx + 2];
            f.score = runningTotal;
          } else {
            f.score = null;
          }
          rollIdx += 1;
        } else if (rollIdx + 1 < this.rolls.length) {
          const sum = this.rolls[rollIdx] + this.rolls[rollIdx + 1];
          if (sum === 10) {
            // Spare: 10 + next 1 roll
            if (rollIdx + 2 < this.rolls.length) {
              runningTotal += 10 + this.rolls[rollIdx + 2];
              f.score = runningTotal;
            } else {
              f.score = null;
            }
          } else {
            // Open Frame
            runningTotal += sum;
            f.score = runningTotal;
          }
          rollIdx += 2;
        } else {
          f.score = null;
          break;
        }
      } else {
        // 10th Frame
        if (rollIdx < this.rolls.length) {
          const r1 = this.rolls[rollIdx] ?? 0;
          const r2 = this.rolls[rollIdx + 1];
          const r3 = this.rolls[rollIdx + 2];

          if (r2 !== undefined) {
            if (r1 === 10 || r1 + r2 === 10) {
              if (r3 !== undefined) {
                runningTotal += r1 + r2 + r3;
                f.score = runningTotal;
              } else {
                f.score = null;
              }
            } else {
              runningTotal += r1 + r2;
              f.score = runningTotal;
            }
          }
        }
      }
    }
  }

  public getFrames(): FrameScore[] {
    return this.frames;
  }

  public getCurrentFrameNumber(): number {
    return Math.min(10, this.currentFrameIndex + 1);
  }

  public getCurrentRollNumber(): number {
    return this.currentRollNum;
  }

  public isGameComplete(): boolean {
    return this.gameOver;
  }

  public getTotalScore(): number {
    let lastValidScore = 0;
    for (let i = 0; i < this.frames.length; i++) {
      if (this.frames[i].score !== null) {
        lastValidScore = this.frames[i].score!;
      }
    }
    return lastValidScore;
  }
}
