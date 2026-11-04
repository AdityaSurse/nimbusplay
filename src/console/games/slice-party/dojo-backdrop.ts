/**
 * NimbusPlay — Slice Party Dojo Wood Table & Wall Backdrop
 * 100% original procedural vector art for a Fruit-Ninja-style wooden dojo table.
 * Zero external image dependencies. Strictly typed with zero `any`.
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

    // 1. Solid deep mahogany wood base (100% opaque, covers entire canvas)
    g.rect(0, 0, this.width, this.height).fill(0x241108);

    // 2. Horizontal Hardwood Dojo Planks (6 broad planks)
    const plankCount = 6;
    const plankHeight = this.height / plankCount;
    const plankColors = [
      0x472512, // Rich dark amber cedar
      0x542c16, // Golden teak tone
      0x3e1f0e, // Deep roasted walnut
      0x4d2814, // Warm reddish mahogany
      0x432311, // Dark chestnut
      0x36190b  // Shadowed base timber
    ];

    for (let i = 0; i < plankCount; i++) {
      const y = i * plankHeight;
      const color = plankColors[i % plankColors.length];

      // Plank body
      g.rect(0, y, this.width, plankHeight).fill(color);

      // Fine horizontal wood grain striations
      const grainCount = 9;
      for (let j = 1; j <= grainCount; j++) {
        const grainY = y + (plankHeight / (grainCount + 1)) * j;
        const waveAmp = 2.5 + (j % 3) * 1.5;
        const grainColor = j % 2 === 0 ? 0x2e1509 : 0x5e331b;
        const grainAlpha = 0.22 + (j % 3) * 0.08;

        g.moveTo(0, grainY);
        g.bezierCurveTo(
          this.width * 0.25, grainY + waveAmp,
          this.width * 0.75, grainY - waveAmp,
          this.width, grainY
        ).stroke({ width: 1.2, color: grainColor, alpha: grainAlpha });
      }

      // Natural wood knot swirl on select planks
      if (i === 1 || i === 4) {
        const knotX = i === 1 ? 460 : 1420;
        const knotY = y + plankHeight * 0.52;
        // Concentric grain rings around knot
        g.ellipse(knotX, knotY, 38, 18).stroke({ width: 1.5, color: 0x261006, alpha: 0.45 });
        g.ellipse(knotX, knotY, 26, 12).stroke({ width: 1.5, color: 0x61351c, alpha: 0.5 });
        g.ellipse(knotX, knotY, 14, 7).fill(0x220e05);
      }

      // Plank seam: dark shadow groove + lower highlight bevel
      if (i > 0) {
        // Deep groove
        g.rect(0, y - 2, this.width, 4).fill(0x160803);
        // Bevel top edge highlight
        g.rect(0, y + 2, this.width, 1.5).fill({ color: 0x7c4524, alpha: 0.45 });
      }
    }

    // 3. Blade Gouge Scars & Slash Cuts (Authentic Fruit Ninja cutting table wear)
    const slashes = [
      { x1: 280, y1: 240, x2: 440, y2: 380 },
      { x1: 720, y1: 610, x2: 890, y2: 490 },
      { x1: 1180, y1: 320, x2: 1350, y2: 460 },
      { x1: 1540, y1: 680, x2: 1690, y2: 560 },
      { x1: 860, y1: 180, x2: 1040, y2: 310 }
    ];

    for (let k = 0; k < slashes.length; k++) {
      const s = slashes[k];
      // Dark incision shadow
      g.moveTo(s.x1, s.y1).lineTo(s.x2, s.y2).stroke({ width: 2.2, color: 0x140602, alpha: 0.75 });
      // Chipped wood highlight edge
      g.moveTo(s.x1 + 1, s.y1 - 1).lineTo(s.x2 + 1, s.y2 - 1).stroke({ width: 1.0, color: 0x8a4d29, alpha: 0.4 });
    }

    // 4. Dojo Perimeter Timber Trim & Brass Mount Brackets
    // Top border rail
    g.rect(0, 0, this.width, 18).fill(0x1d0c05);
    g.rect(0, 18, this.width, 2).fill({ color: 0x6e3b1c, alpha: 0.5 });

    // Bottom cutting counter table ledge
    g.rect(0, this.height - 42, this.width, 42).fill(0x1a0a04);
    g.rect(0, this.height - 42, this.width, 3).fill(0x6e3b1c);
    g.rect(0, this.height - 39, this.width, 2).fill(0x0f0502);

    // Decorative corner brass bracket plates
    const bracketSize = 48;
    // Top-Left
    g.poly([0, 0, bracketSize, 0, 0, bracketSize]).fill(0x855823).stroke({ width: 2, color: 0xb5843c });
    g.circle(14, 14, 3).fill(0x1a0a04);
    // Top-Right
    g.poly([this.width, 0, this.width - bracketSize, 0, this.width, bracketSize]).fill(0x855823).stroke({ width: 2, color: 0xb5843c });
    g.circle(this.width - 14, 14, 3).fill(0x1a0a04);

    // 5. Ambient Dojo Center Spotlight & Dark Vignette
    // Center warm lantern glow
    g.circle(this.width / 2, this.height / 2, 650).fill({ color: 0x9e5428, alpha: 0.12 });
    g.circle(this.width / 2, this.height / 2, 420).fill({ color: 0xb36332, alpha: 0.08 });

    // Perimeter edge vignettes (darkening borders to enhance fruit contrast)
    g.rect(0, 0, 160, this.height).fill({ color: 0x0a0401, alpha: 0.45 });
    g.rect(this.width - 160, 0, 160, this.height).fill({ color: 0x0a0401, alpha: 0.45 });
    g.rect(0, 0, this.width, 90).fill({ color: 0x0a0401, alpha: 0.35 });
    g.rect(0, this.height - 110, this.width, 110).fill({ color: 0x0a0401, alpha: 0.45 });
  }
}

