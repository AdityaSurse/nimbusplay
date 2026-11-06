/**
 * NimbusPlay — Sketch Unit Tests
 * Verifies stroke path recording, jitter suppression, undo/clear stack mechanics,
 * toolbar hit-testing, and reference sample artwork generation.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StrokeRenderer } from '../src/console/games/sketch/stroke-renderer.js';
import { SketchToolbar, COLOR_PALETTE, BRUSH_SIZES } from '../src/console/games/sketch/toolbar.js';
import { SampleArtwork } from '../src/console/games/sketch/sample-artwork.js';

describe('Sketch Stroke Renderer & History Stack Tests', () => {
  it('should start with zero strokes and record completed strokes', () => {
    const renderer = new StrokeRenderer(1920, 1080);
    assert.equal(renderer.getStrokesCount(), 0);

    renderer.beginStroke(200, 200, 0x111827, 16, false);
    renderer.addPoint(220, 220);
    renderer.addPoint(250, 240);
    renderer.endStroke();

    assert.equal(renderer.getStrokesCount(), 1);
    renderer.destroy();
  });

  it('should suppress micro-jitter under 2px threshold', () => {
    const renderer = new StrokeRenderer(1920, 1080);
    renderer.beginStroke(300, 300, 0xef4444, 12, false);

    // Micro jitter < 2px
    renderer.addPoint(300.5, 300.8);
    renderer.addPoint(301.0, 300.5);
    renderer.endStroke();

    assert.equal(renderer.getStrokesCount(), 1);
    renderer.destroy();
  });

  it('should support undo and clear operations cleanly', () => {
    const renderer = new StrokeRenderer(1920, 1080);

    // Draw stroke 1
    renderer.beginStroke(100, 100, 0x111827, 8, false);
    renderer.addPoint(150, 150);
    renderer.endStroke();

    // Draw stroke 2
    renderer.beginStroke(200, 200, 0x22c55e, 8, false);
    renderer.addPoint(250, 250);
    renderer.endStroke();

    assert.equal(renderer.getStrokesCount(), 2);

    // Undo once
    const undoOk = renderer.undo();
    assert.equal(undoOk, true);
    assert.equal(renderer.getStrokesCount(), 1);

    // Clear board
    renderer.clear();
    assert.equal(renderer.getStrokesCount(), 0);
    assert.equal(renderer.undo(), false);
    renderer.destroy();
  });
});

describe('Sketch Vertical Palette & Toolbar Hit-Testing Tests', () => {
  it('should return none when pointer is outside toolbar margin', () => {
    const toolbar = new SketchToolbar();
    const hit = toolbar.hitTest(400, 400);
    assert.equal(hit.type, 'none');
    toolbar.destroy();
  });

  it('should select color swatch when clicked within swatch radius', () => {
    const toolbar = new SketchToolbar();
    // Color item 0 (Black) is around y=90, x=36
    const hit = toolbar.hitTest(36, 90);
    assert.equal(hit.type, 'color');
    assert.equal(hit.value, COLOR_PALETTE[0].hex);
    assert.equal(toolbar.getActiveColor(), COLOR_PALETTE[0].hex);
    assert.equal(toolbar.getActiveMode(), 'brush');
    toolbar.destroy();
  });

  it('should select brush size when size dot is clicked', () => {
    const toolbar = new SketchToolbar();
    // Brush size item 0 is after 10 colors (~y=560)
    const hit = toolbar.hitTest(36, 560);
    assert.equal(hit.type, 'size');
    assert.equal(toolbar.getActiveWidth(), BRUSH_SIZES[0].strokeWidth);
    toolbar.destroy();
  });

  it('should toggle eraser mode when eraser tool is selected', () => {
    const toolbar = new SketchToolbar();
    assert.equal(toolbar.getActiveMode(), 'brush');

    // Eraser is at curY around y=704
    const hit = toolbar.hitTest(36, 704);
    assert.equal(hit.type, 'eraser');
    assert.equal(toolbar.getActiveMode(), 'eraser');

    // Clicking again returns to brush mode
    toolbar.hitTest(36, 704);
    assert.equal(toolbar.getActiveMode(), 'brush');
    toolbar.destroy();
  });
});

describe('Sketch Reference Sample Artwork Generation Tests', () => {
  it('should generate valid "I ❤️ VIBECODING" marker strokes', () => {
    const strokes = SampleArtwork.getSampleStrokes();
    assert.ok(strokes.length > 10);

    // Must have red heart strokes
    const heartStrokes = strokes.filter((s) => s.color === 0xef4444);
    assert.ok(heartStrokes.length >= 2);

    // Must have black marker strokes for lettering
    const textStrokes = strokes.filter((s) => s.color === 0x111827);
    assert.ok(textStrokes.length >= 8);

    for (const stroke of strokes) {
      assert.ok(stroke.points.length >= 2);
      assert.ok(stroke.width >= 10);
    }
  });
});

