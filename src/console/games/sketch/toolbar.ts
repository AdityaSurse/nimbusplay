/**
 * NimbusPlay — Sketch Vertical Palette & Toolbar
 * Pinned left vertical palette with 10 color swatches, 3 brush sizes, Eraser, Undo, and Clear.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics } from 'pixi.js';
import type { ColorSwatch, BrushSize, ToolMode, ToolbarHitResult } from './types.js';

export const COLOR_PALETTE: ColorSwatch[] = [
  { id: 'black', name: 'Black', hex: 0x111827 },
  { id: 'grey', name: 'Slate Grey', hex: 0x64748b },
  { id: 'red', name: 'Crimson Red', hex: 0xef4444 },
  { id: 'orange', name: 'Orange', hex: 0xf97316 },
  { id: 'yellow', name: 'Golden Yellow', hex: 0xfacc15 },
  { id: 'green', name: 'Leaf Green', hex: 0x22c55e },
  { id: 'cyan', name: 'Sky Cyan', hex: 0x06b6d4 },
  { id: 'blue', name: 'Royal Blue', hex: 0x2563eb },
  { id: 'purple', name: 'Deep Purple', hex: 0x8b5cf6 },
  { id: 'pink', name: 'Bright Pink', hex: 0xec4899 }
];

export const BRUSH_SIZES: BrushSize[] = [
  { id: 'thin', name: 'Thin', radius: 4, strokeWidth: 8 },
  { id: 'medium', name: 'Medium', radius: 8, strokeWidth: 16 },
  { id: 'thick', name: 'Thick', radius: 12, strokeWidth: 26 }
];

interface ToolItem {
  id: string;
  type: 'color' | 'size' | 'eraser' | 'undo' | 'clear' | 'sample';
  x: number;
  y: number;
  radius: number;
  value?: string | number;
}

export class SketchToolbar {
  public readonly container = new Container();
  private g = new Graphics();
  private items: ToolItem[] = [];

  private selectedColor: number = COLOR_PALETTE[0].hex;
  private selectedSize: BrushSize = BRUSH_SIZES[1]; // Medium
  private activeMode: ToolMode = 'brush';

  constructor() {
    this.container.addChild(this.g);
    this.buildLayout();
    this.redraw();
  }

  private buildLayout(): void {
    this.items = [];
    const centerX = 36;
    let curY = 90;

    // 1. Color Swatches (10 items)
    for (const color of COLOR_PALETTE) {
      this.items.push({
        id: `color_${color.id}`,
        type: 'color',
        x: centerX,
        y: curY,
        radius: 17,
        value: color.hex
      });
      curY += 46;
    }

    curY += 10;
    // 2. Brush Sizes (3 items)
    for (const size of BRUSH_SIZES) {
      this.items.push({
        id: `size_${size.id}`,
        type: 'size',
        x: centerX,
        y: curY,
        radius: 18,
        value: size.id
      });
      curY += 44;
    }

    curY += 12;
    // 3. Action Tools: Eraser, Undo, Clear, Sample
    this.items.push({ id: 'tool_eraser', type: 'eraser', x: centerX, y: curY, radius: 18 });
    curY += 44;
    this.items.push({ id: 'tool_undo', type: 'undo', x: centerX, y: curY, radius: 18 });
    curY += 44;
    this.items.push({ id: 'tool_clear', type: 'clear', x: centerX, y: curY, radius: 18 });
    curY += 44;
    this.items.push({ id: 'tool_sample', type: 'sample', x: centerX, y: curY, radius: 18 });
  }

  public redraw(): void {
    const g = this.g;
    g.clear();

    // 1. Frosted Toolbar Background Pillar
    g.roundRect(8, 55, 56, 970, 28)
      .fill({ color: 0xffffff, alpha: 0.95 })
      .stroke({ width: 1.5, color: 0xe2e8f0 });
    g.roundRect(10, 57, 52, 966, 26)
      .fill({ color: 0xf8fafc, alpha: 0.6 });

    // 2. Render Color Swatches
    for (const item of this.items) {
      if (item.type === 'color' && typeof item.value === 'number') {
        const isSelected = this.activeMode === 'brush' && item.value === this.selectedColor;
        if (isSelected) {
          // Luminous active selection ring
          g.circle(item.x, item.y, item.radius + 4).stroke({ width: 3, color: 0x0284c7 });
          g.circle(item.x, item.y, item.radius + 1).stroke({ width: 1.5, color: 0xffffff });
        }
        g.circle(item.x, item.y, item.radius).fill({ color: item.value });
        g.circle(item.x, item.y, item.radius).stroke({ width: 1.5, color: 0xd1d5db, alpha: 0.6 });
      } else if (item.type === 'size') {
        const isSelected = item.value === this.selectedSize.id;
        const sizeDef = BRUSH_SIZES.find((s) => s.id === item.value) || BRUSH_SIZES[1];
        if (isSelected) {
          g.circle(item.x, item.y, item.radius + 3).stroke({ width: 2.5, color: 0x0284c7 });
        }
        g.circle(item.x, item.y, item.radius).fill({ color: 0xf1f5f9 }).stroke({ width: 1, color: 0xcfd8dc });
        // Size dot
        g.circle(item.x, item.y, sizeDef.radius).fill({ color: 0x334155 });
      } else if (item.type === 'eraser') {
        const isSelected = this.activeMode === 'eraser';
        if (isSelected) {
          g.circle(item.x, item.y, item.radius + 3).stroke({ width: 2.5, color: 0xef4444 });
        }
        g.circle(item.x, item.y, item.radius).fill({ color: isSelected ? 0xfee2e2 : 0xf1f5f9 })
          .stroke({ width: 1, color: 0xcfd8dc });
        // Eraser icon symbol
        g.roundRect(item.x - 7, item.y - 7, 14, 14, 3).fill({ color: 0xef4444 });
        g.roundRect(item.x - 7, item.y - 1, 14, 8, 2).fill({ color: 0xfca5a5 });
      } else if (item.type === 'undo') {
        g.circle(item.x, item.y, item.radius).fill({ color: 0xf1f5f9 }).stroke({ width: 1, color: 0xcfd8dc });
        // Undo arrow icon
        g.poly([
          { x: item.x - 6, y: item.y },
          { x: item.x, y: item.y - 6 },
          { x: item.x, y: item.y + 6 }
        ]).fill({ color: 0x475569 });
        g.rect(item.x - 1, item.y - 2, 7, 4).fill({ color: 0x475569 });
      } else if (item.type === 'clear') {
        g.circle(item.x, item.y, item.radius).fill({ color: 0xfef2f2 }).stroke({ width: 1, color: 0xfecaca });
        // Trash/Clear X symbol
        g.circle(item.x, item.y, 8).stroke({ width: 2, color: 0xef4444 });
        g.rect(item.x - 6, item.y - 1, 12, 2).fill({ color: 0xef4444 });
      } else if (item.type === 'sample') {
        g.circle(item.x, item.y, item.radius).fill({ color: 0xf0fdf4 }).stroke({ width: 1, color: 0xbbf7d0 });
        // Heart icon for sample template
        g.poly([
          { x: item.x, y: item.y + 6 },
          { x: item.x - 6, y: item.y },
          { x: item.x - 6, y: item.y - 4 },
          { x: item.x - 2, y: item.y - 6 },
          { x: item.x, y: item.y - 3 },
          { x: item.x + 2, y: item.y - 6 },
          { x: item.x + 6, y: item.y - 4 },
          { x: item.x + 6, y: item.y }
        ]).fill({ color: 0x22c55e });
      }
    }
  }

  public hitTest(px: number, py: number): ToolbarHitResult {
    // If not on the left edge, not hitting toolbar
    if (px > 74 || px < 0) return { type: 'none' };

    for (const item of this.items) {
      const dx = px - item.x;
      const dy = py - item.y;
      if (dx * dx + dy * dy <= (item.radius + 6) ** 2) {
        if (item.type === 'color' && typeof item.value === 'number') {
          this.selectedColor = item.value;
          this.activeMode = 'brush';
          this.redraw();
          return { type: 'color', value: item.value };
        } else if (item.type === 'size' && typeof item.value === 'string') {
          const found = BRUSH_SIZES.find((s) => s.id === item.value);
          if (found) {
            this.selectedSize = found;
            this.redraw();
            return { type: 'size', value: found.strokeWidth };
          }
        } else if (item.type === 'eraser') {
          this.activeMode = this.activeMode === 'eraser' ? 'brush' : 'eraser';
          this.redraw();
          return { type: 'eraser' };
        } else if (item.type === 'undo') {
          return { type: 'undo' };
        } else if (item.type === 'clear') {
          return { type: 'clear' };
        } else if (item.type === 'sample') {
          return { type: 'sample' };
        }
      }
    }

    return { type: 'none' };
  }

  public getActiveColor(): number { return this.selectedColor; }
  public getActiveWidth(): number { return this.selectedSize.strokeWidth; }
  public getActiveMode(): ToolMode { return this.activeMode; }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
