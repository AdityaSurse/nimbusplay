/**
 * NimbusPlay — Sketch Pen Tip & Cursor Preview
 * Displays dynamic brush size preview and ink color ring at pointer position.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics } from 'pixi.js';

export class PenCursor {
  public readonly container = new Container();
  private g = new Graphics();

  public x = 960;
  public y = 540;

  constructor() {
    this.container.addChild(this.g);
  }

  public update(x: number, y: number, color: number, strokeWidth: number, isEraser: boolean, isDrawing: boolean, isOverToolbar: boolean): void {
    this.x = x;
    this.y = y;
    this.container.x = x;
    this.container.y = y;

    const g = this.g;
    g.clear();

    if (isOverToolbar) {
      // Precision hover cursor over toolbar
      g.circle(0, 0, 7).stroke({ width: 2, color: 0x0284c7 });
      g.circle(0, 0, 2).fill({ color: 0x0284c7 });
      return;
    }

    const radius = Math.max(3, strokeWidth * 0.5);

    if (isEraser) {
      g.circle(0, 0, radius).stroke({ width: 2, color: 0xef4444, alpha: 0.85 });
      g.circle(0, 0, radius * 0.7).stroke({ width: 1, color: 0x94a3b8, alpha: 0.5 });
    } else {
      // Ink tip preview circle
      g.circle(0, 0, radius).fill({ color, alpha: isDrawing ? 0.9 : 0.45 });
      g.circle(0, 0, radius).stroke({ width: 1.5, color: 0x1e293b, alpha: 0.75 });
      if (radius > 5) {
        g.circle(0, 0, 2).fill({ color: 0xffffff, alpha: 0.8 });
      }
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}

