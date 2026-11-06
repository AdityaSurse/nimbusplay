/**
 * NimbusPlay — Sketch Reference Sample Artwork ("I ❤️ VIBECODING")
 * Procedural marker strokes replicating the exact reference drawing from the reel.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import type { DrawingStroke } from './types.js';

export class SampleArtwork {
  /**
   * Generates strokes for "I ❤️ VIBECODING" in authentic hand-drawn marker style.
   */
  public static getSampleStrokes(): DrawingStroke[] {
    const strokes: DrawingStroke[] = [];
    let id = 0;

    const addStroke = (color: number, width: number, pts: [number, number][]): void => {
      strokes.push({
        id: ++id,
        color,
        width,
        isEraser: false,
        points: pts.map(([x, y]) => ({ x, y }))
      });
    };

    // -------------------------------------------------------------
    // TOP LINE: "I" and "❤️" (Centered around y = 380 - 460)
    // -------------------------------------------------------------
    const markerColor = 0x111827; // Bold charcoal black
    const heartColor = 0xef4444;  // Vibrant crimson red
    const strokeW = 18;

    // Letter 'I'
    addStroke(markerColor, strokeW, [[720, 360], [720, 480]]);
    addStroke(markerColor, strokeW, [[680, 360], [760, 360]]);
    addStroke(markerColor, strokeW, [[680, 480], [760, 480]]);

    // Red Heart "❤️"
    // Left lobe of heart
    addStroke(heartColor, strokeW + 2, [
      [960, 400], [930, 350], [870, 350], [840, 390],
      [840, 430], [900, 480], [960, 520]
    ]);
    // Right lobe of heart
    addStroke(heartColor, strokeW + 2, [
      [960, 400], [990, 350], [1050, 350], [1080, 390],
      [1080, 430], [1020, 480], [960, 520]
    ]);
    // Heart inner marker shading fill
    addStroke(heartColor, 14, [[960, 420], [910, 440], [960, 490]]);
    addStroke(heartColor, 14, [[960, 420], [1010, 440], [960, 490]]);

    // -------------------------------------------------------------
    // BOTTOM LINE: "VIBECODING" (Spread across x = 360 to 1560, y ~ 640)
    // -------------------------------------------------------------
    const yTop = 580, yBot = 700;

    // 'V' (x ~ 420)
    addStroke(markerColor, strokeW, [[380, yTop], [430, yBot], [480, yTop]]);

    // 'I' (x ~ 540)
    addStroke(markerColor, strokeW, [[540, yTop], [540, yBot]]);
    addStroke(markerColor, strokeW - 4, [[515, yTop], [565, yTop]]);
    addStroke(markerColor, strokeW - 4, [[515, yBot], [565, yBot]]);

    // 'B' (x ~ 640)
    addStroke(markerColor, strokeW, [[620, yTop], [620, yBot]]);
    addStroke(markerColor, strokeW, [[620, yTop], [670, yTop + 5], [685, yTop + 30], [660, yTop + 60], [620, yTop + 60]]);
    addStroke(markerColor, strokeW, [[620, yTop + 60], [675, yTop + 65], [690, yTop + 95], [665, yBot], [620, yBot]]);

    // 'E' (x ~ 760)
    addStroke(markerColor, strokeW, [[740, yTop], [740, yBot]]);
    addStroke(markerColor, strokeW, [[740, yTop], [800, yTop]]);
    addStroke(markerColor, strokeW, [[740, yTop + 60], [790, yTop + 60]]);
    addStroke(markerColor, strokeW, [[740, yBot], [800, yBot]]);

    // 'C' (x ~ 880)
    addStroke(markerColor, strokeW, [
      [930, yTop + 15], [890, yTop], [850, yTop + 30],
      [840, yTop + 60], [850, yBot - 30], [890, yBot], [930, yBot - 15]
    ]);

    // 'O' (x ~ 1010)
    addStroke(markerColor, strokeW, [
      [1010, yTop], [970, yTop + 25], [960, yTop + 60],
      [970, yBot - 25], [1010, yBot], [1050, yBot - 25],
      [1060, yTop + 60], [1050, yTop + 25], [1010, yTop]
    ]);

    // 'D' (x ~ 1140)
    addStroke(markerColor, strokeW, [[1120, yTop], [1120, yBot]]);
    addStroke(markerColor, strokeW, [
      [1120, yTop], [1160, yTop], [1185, yTop + 30],
      [1190, yTop + 60], [1185, yBot - 30], [1160, yBot], [1120, yBot]
    ]);

    // 'I' (x ~ 1260)
    addStroke(markerColor, strokeW, [[1260, yTop], [1260, yBot]]);
    addStroke(markerColor, strokeW - 4, [[1235, yTop], [1285, yTop]]);
    addStroke(markerColor, strokeW - 4, [[1235, yBot], [1285, yBot]]);

    // 'N' (x ~ 1370)
    addStroke(markerColor, strokeW, [[1340, yBot], [1340, yTop], [1400, yBot], [1400, yTop]]);

    // 'G' (x ~ 1490)
    addStroke(markerColor, strokeW, [
      [1510, yTop + 15], [1470, yTop], [1440, yTop + 30],
      [1430, yTop + 60], [1440, yBot - 30], [1480, yBot],
      [1510, yBot - 10], [1510, yTop + 60], [1480, yTop + 60]
    ]);

    return strokes;
  }
}

