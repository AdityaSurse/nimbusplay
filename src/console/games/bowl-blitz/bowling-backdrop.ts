/**
 * NimbusPlay — Bowl Blitz Hardwood Bowling Lane Backdrop
 * 100% procedural vector art for a perspective bowling alley lane, gutters, and pin deck.
 * Strictly typed with zero `any`.
 */

import { Container, Graphics } from 'pixi.js';

export class BowlingBackdrop {
  public container = new Container();
  private g = new Graphics();
  private width: number;
  private height: number;

  constructor(width = 1920, height = 1080) {
    this.width = width;
    this.height = height;
    this.container.addChild(this.g);
    this.render();
  }

  public render(): void {
    const g = this.g;
    g.clear();

    // 1. Deep bowling hall atmospheric background (100% opaque)
    g.rect(0, 0, this.width, this.height).fill(0x0c131f);

    // 2. Distant Pin Deck Wall & Neon Banner
    g.rect(0, 0, this.width, 260).fill(0x080d16);
    g.rect(720, 140, 480, 70).fill(0x131d2e).stroke({ width: 3, color: 0x38bdf8 });
    g.rect(740, 160, 440, 30).fill(0x0f172a);

    // 3. Perspective Hardwood Lane (Tapers from bottom to deck)
    const laneBottomLeft = 480;
    const laneBottomRight = 1440;
    const laneTopLeft = 780;
    const laneTopRight = 1140;
    const laneTopY = 260;
    const laneBottomY = 1080;

    // Outer Gutter Trenches
    g.poly([
      laneBottomLeft - 90, laneBottomY,
      laneTopLeft - 60, laneTopY,
      laneTopLeft, laneTopY,
      laneBottomLeft, laneBottomY
    ]).fill(0x1a2332);

    g.poly([
      laneBottomRight, laneBottomY,
      laneTopRight, laneTopY,
      laneTopRight + 60, laneTopY,
      laneBottomRight + 90, laneBottomY
    ]).fill(0x1a2332);

    // Maple Hardwood Lane Surface
    g.poly([
      laneBottomLeft, laneBottomY,
      laneTopLeft, laneTopY,
      laneTopRight, laneTopY,
      laneBottomRight, laneBottomY
    ]).fill(0xc49a6c); // Warm polished maple

    // Hardwood Boards (Perspective board lines)
    for (let i = 1; i < 9; i++) {
      const frac = i / 9;
      const bX = laneBottomLeft + (laneBottomRight - laneBottomLeft) * frac;
      const tX = laneTopLeft + (laneTopRight - laneTopLeft) * frac;
      g.moveTo(bX, laneBottomY).lineTo(tX, laneTopY).stroke({ width: 1.5, color: 0xa87d50, alpha: 0.6 });
    }

    // Lane Targeting Arrows (7 Chevrons)
    const arrowY = 620;
    for (let j = 1; j <= 7; j++) {
      const frac = j / 8;
      const ax = laneBottomLeft + (laneBottomRight - laneBottomLeft) * (0.3 + frac * 0.4);
      g.poly([ax, arrowY, ax - 8, arrowY + 22, ax, arrowY + 16, ax + 8, arrowY + 22]).fill(0x3e2410);
    }

    // Foul Line
    g.rect(laneBottomLeft, 980, laneBottomRight - laneBottomLeft, 6).fill(0x991b1b);

    // Glossy lane specular center highlight
    g.poly([
      960 - 80, laneBottomY,
      960 - 30, laneTopY,
      960 + 30, laneTopY,
      960 + 80, laneBottomY
    ]).fill({ color: 0xffffff, alpha: 0.08 });
  }
}

