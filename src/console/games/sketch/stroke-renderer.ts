/**
 * NimbusPlay — Sketch Stroke Renderer & History Engine
 * Implements quadratic curve smoothing, round stroke caps/joins, and undo history.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics } from 'pixi.js';
import type { DrawingStroke, StrokePoint } from './types.js';

export class StrokeRenderer {
  public readonly container = new Container();

  private bgGraphics = new Graphics();
  private strokesGraphics = new Graphics();
  private activeGraphics = new Graphics();

  private strokes: DrawingStroke[] = [];
  private currentStroke: DrawingStroke | null = null;
  private width: number;
  private height: number;
  private nextId = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.container.addChild(this.bgGraphics);
    this.container.addChild(this.strokesGraphics);
    this.container.addChild(this.activeGraphics);

    this.renderBackground();
  }

  private renderBackground(): void {
    const g = this.bgGraphics;
    g.clear();
    // Clean studio white canvas
    g.rect(0, 0, this.width, this.height).fill({ color: 0xffffff });
  }

  public beginStroke(x: number, y: number, color: number, width: number, isEraser: boolean): void {
    const effectiveColor = isEraser ? 0xffffff : color;
    const effectiveWidth = isEraser ? Math.max(34, width * 2) : width;

    this.currentStroke = {
      id: ++this.nextId,
      color: effectiveColor,
      width: effectiveWidth,
      isEraser,
      points: [{ x, y }]
    };

    // Render initial contact dot
    this.renderActiveStroke();
  }

  public addPoint(x: number, y: number): void {
    if (!this.currentStroke) return;

    const lastPt = this.currentStroke.points[this.currentStroke.points.length - 1];
    if (lastPt) {
      const dx = x - lastPt.x;
      const dy = y - lastPt.y;
      // Filter micro jitter under 2px
      if (dx * dx + dy * dy < 4) return;
    }

    this.currentStroke.points.push({ x, y });
    this.renderActiveStroke();
  }

  public endStroke(): void {
    if (this.currentStroke) {
      this.strokes.push(this.currentStroke);
      this.currentStroke = null;
      this.activeGraphics.clear();
      this.redrawAllStrokes();
    }
  }

  public undo(): boolean {
    if (this.strokes.length > 0) {
      this.strokes.pop();
      this.redrawAllStrokes();
      return true;
    }
    return false;
  }

  public clear(): void {
    this.strokes = [];
    this.currentStroke = null;
    this.activeGraphics.clear();
    this.strokesGraphics.clear();
  }

  public loadStrokes(strokes: DrawingStroke[]): void {
    this.strokes = [...strokes];
    this.redrawAllStrokes();
  }

  private renderActiveStroke(): void {
    const g = this.activeGraphics;
    g.clear();
    if (!this.currentStroke) return;
    this.drawStroke(g, this.currentStroke);
  }

  private redrawAllStrokes(): void {
    const g = this.strokesGraphics;
    g.clear();
    for (const stroke of this.strokes) {
      this.drawStroke(g, stroke);
    }
  }

  /**
   * Renders smooth hand-drawn strokes with quadratic curve smoothing and round caps.
   */
  private drawStroke(g: Graphics, stroke: DrawingStroke): void {
    const pts = stroke.points;
    if (pts.length === 0) return;

    const color = stroke.color;
    const width = stroke.width;

    // Single point: render a solid round dot
    if (pts.length === 1) {
      g.circle(pts[0].x, pts[0].y, width * 0.5).fill({ color });
      return;
    }

    // Two points: simple line segment with round caps
    if (pts.length === 2) {
      g.moveTo(pts[0].x, pts[0].y)
        .lineTo(pts[1].x, pts[1].y)
        .stroke({ width, color, cap: 'round', join: 'round' });
      return;
    }

    // 3 or more points: Quadratic curve smoothing
    // Start at initial point
    g.moveTo(pts[0].x, pts[0].y);

    let prevMid: StrokePoint = {
      x: (pts[0].x + pts[1].x) * 0.5,
      y: (pts[0].y + pts[1].y) * 0.5
    };

    g.lineTo(prevMid.x, prevMid.y);

    for (let i = 1; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const nextMid: StrokePoint = {
        x: (p1.x + p2.x) * 0.5,
        y: (p1.y + p2.y) * 0.5
      };

      // Quadratic curve from prevMid to nextMid using p1 as control point
      g.quadraticCurveTo(p1.x, p1.y, nextMid.x, nextMid.y);
      prevMid = nextMid;
    }

    // Final segment to last point
    const last = pts[pts.length - 1];
    g.lineTo(last.x, last.y);
    g.stroke({ width, color, cap: 'round', join: 'round' });
  }

  public getStrokesCount(): number {
    return this.strokes.length;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}

