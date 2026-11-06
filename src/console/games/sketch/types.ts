/**
 * NimbusPlay — Sketch Whiteboard Type Definitions
 * Strictly typed with zero `any`. Target < 250 lines.
 */

export type ToolMode = 'brush' | 'eraser';

export interface ColorSwatch {
  id: string;
  name: string;
  hex: number;
}

export interface BrushSize {
  id: string;
  name: string;
  radius: number;
  strokeWidth: number;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: number;
  color: number;
  width: number;
  isEraser: boolean;
  points: StrokePoint[];
}

export interface ToolbarHitResult {
  type: 'color' | 'size' | 'eraser' | 'undo' | 'clear' | 'sample' | 'exit' | 'none';
  value?: string | number;
}
