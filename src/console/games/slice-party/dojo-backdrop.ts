/**
 * NimbusPlay — Fruit Ninja Vertical Cedar Planks Backdrop
 * Full-screen warm brown vertical wooden plank wall with natural grain, knots, and gouges.
 * Zero external image dependencies. Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics } from 'pixi.js';

export class DojoBackdrop {
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

    // 1. Deep roasted timber base backing
    g.rect(0, 0, this.width, this.height).fill(0x220f06);

    // 2. Vertical Hardwood Cedar Planks (10 broad vertical planks)
    const plankCount = 10;
    const plankWidth = this.width / plankCount;
    const plankTones = [
      0x764322, // Warm golden cedar
      0x864e29, // Rich honey amber
      0x6b391b, // Dark roasted chestnut
      0x7f4925, // Toasted teak
      0x8b542c, // Cinnamon mahogany
      0x723e1f, // Deep cedar
      0x844d27, // Golden amber
      0x794523, // Warm teak
      0x89522a, // Light cedar
      0x6d3a1c  // Roasted walnut
    ];

    for (let i = 0; i < plankCount; i++) {
      const x = i * plankWidth;
      const color = plankTones[i % plankTones.length];

      // Plank rectangular body
      g.rect(x, 0, plankWidth, this.height).fill(color);

      // Fine vertical woodgrain striations running top to bottom
      const grainCount = 10;
      for (let j = 1; j <= grainCount; j++) {
        const grainX = x + (plankWidth / (grainCount + 1)) * j;
        const waveAmp = 3.0 + (j % 3) * 2.5;
        const isDark = j % 2 === 0;
        const grainColor = isDark ? 0x3d1c0c : 0xa46638;
        const grainAlpha = isDark ? 0.22 : 0.18;

        g.moveTo(grainX, 0);
        g.bezierCurveTo(
          grainX + waveAmp, this.height * 0.33,
          grainX - waveAmp, this.height * 0.66,
          grainX, this.height
        ).stroke({ width: 1.2, color: grainColor, alpha: grainAlpha });
      }

      // Natural wood knot swirl on select vertical planks
      if (i === 1 || i === 4 || i === 8) {
        const knotX = x + plankWidth * 0.52;
        const knotY = i === 1 ? 320 : i === 4 ? 680 : 410;
        // Concentric grain rings around knot
        g.ellipse(knotX, knotY, 20, 42).stroke({ width: 1.4, color: 0x240f06, alpha: 0.45 });
        g.ellipse(knotX, knotY, 14, 28).stroke({ width: 1.4, color: 0x5a2f16, alpha: 0.5 });
        g.ellipse(knotX, knotY, 7, 16).fill(0x200c04);
      }

      // Vertical plank seam: dark groove + right-side bevel highlight
      if (i > 0) {
        g.rect(x - 2, 0, 4, this.height).fill(0x140703);
        g.rect(x + 2, 0, 1.5, this.height).fill({ color: 0x9f6035, alpha: 0.42 });
      }
    }

    // 3. Authentic cutting table gouge scars running across boards
    const cuts = [
      { x1: 260, y1: 280, x2: 440, y2: 410 },
      { x1: 720, y1: 640, x2: 910, y2: 520 },
      { x1: 1160, y1: 290, x2: 1360, y2: 430 },
      { x1: 1510, y1: 710, x2: 1690, y2: 590 },
      { x1: 840, y1: 210, x2: 1040, y2: 340 }
    ];

    for (let k = 0; k < cuts.length; k++) {
      const c = cuts[k];
      g.moveTo(c.x1, c.y1).lineTo(c.x2, c.y2).stroke({ width: 2.2, color: 0x140703, alpha: 0.75 });
      g.moveTo(c.x1 + 1, c.y1 - 1).lineTo(c.x2 + 1, c.y2 - 1).stroke({ width: 1.0, color: 0xa46638, alpha: 0.4 });
    }

    // 4. Subtle perimeter dark vignette (boosts fruit saturation contrast)
    g.rect(0, 0, 120, this.height).fill({ color: 0x0a0401, alpha: 0.42 });
    g.rect(this.width - 120, 0, 120, this.height).fill({ color: 0x0a0401, alpha: 0.42 });
    g.rect(0, 0, this.width, 70).fill({ color: 0x0a0401, alpha: 0.35 });
    g.rect(0, this.height - 80, this.width, 80).fill({ color: 0x0a0401, alpha: 0.4 });

    // 5. Center warm light pool
    g.circle(this.width / 2, this.height / 2, 600).fill({ color: 0xb56534, alpha: 0.10 });
  }
}
