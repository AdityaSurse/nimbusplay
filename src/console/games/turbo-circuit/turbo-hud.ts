/**
 * NimbusPlay — Turbo Circuit Stadium HUD Overlay
 * Displays gold italic placement badge, digital speedometer, coins, laps, and minimap.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import type { KartPhysicsState } from './types.js';

export class TurboHUD {
  public readonly container: HTMLDivElement;

  private readonly rankEl: HTMLSpanElement;
  private readonly speedEl: HTMLSpanElement;
  private readonly coinsEl: HTMLSpanElement;
  private readonly lapEl: HTMLSpanElement;
  private readonly alertEl: HTMLDivElement;
  private readonly mapCanvas: HTMLCanvasElement;
  private readonly mapCtx: CanvasRenderingContext2D;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'turbo-hud-overlay';
    this.container.style.cssText = `
      position: absolute; inset: 0; pointer-events: none;
      font-family: 'Nunito Sans', system-ui, sans-serif;
      overflow: hidden; z-index: 50;
    `;

    // 1. Bottom-Right: Massive Gold Italic Position Badge
    const rankBox = document.createElement('div');
    rankBox.style.cssText = `
      position: absolute; right: 48px; bottom: 36px;
      display: flex; flex-direction: column; align-items: flex-end;
    `;

    this.rankEl = document.createElement('span');
    this.rankEl.style.cssText = `
      font-size: 88px; font-weight: 900; font-style: italic;
      line-height: 0.9; letter-spacing: -2px;
      background: linear-gradient(180deg, #fef08a 0%, #facc15 50%, #ca8a04 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.6));
    `;
    this.rankEl.textContent = '1st';

    this.speedEl = document.createElement('span');
    this.speedEl.style.cssText = `
      font-size: 20px; font-weight: 800; color: #ffffff;
      letter-spacing: 2px; text-shadow: 0 2px 6px rgba(0,0,0,0.8);
      margin-top: 6px;
    `;
    this.speedEl.textContent = '0 KM/H';

    rankBox.appendChild(this.rankEl);
    rankBox.appendChild(this.speedEl);
    this.container.appendChild(rankBox);

    // 2. Bottom-Left: Coins and Lap Counter
    const telemetryBox = document.createElement('div');
    telemetryBox.style.cssText = `
      position: absolute; left: 48px; bottom: 40px;
      display: flex; flex-direction: column; gap: 6px;
    `;

    this.coinsEl = document.createElement('div');
    this.coinsEl.style.cssText = `
      font-size: 26px; font-weight: 900; color: #fde047;
      text-shadow: 0 2px 8px rgba(0,0,0,0.8); display: flex; align-items: center; gap: 8px;
    `;
    this.coinsEl.innerHTML = '<span style="font-size: 28px;">🟡</span><span>x04</span>';

    this.lapEl = document.createElement('div');
    this.lapEl.style.cssText = `
      font-size: 22px; font-weight: 900; color: #ffffff;
      letter-spacing: 1.5px; text-shadow: 0 2px 8px rgba(0,0,0,0.8);
    `;
    this.lapEl.textContent = 'LAP 1/1';

    telemetryBox.appendChild(this.coinsEl);
    telemetryBox.appendChild(this.lapEl);
    this.container.appendChild(telemetryBox);

    // 3. Center-Right: Circuit Minimap
    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.width = 140;
    this.mapCanvas.height = 140;
    this.mapCanvas.style.cssText = `
      position: absolute; right: 48px; top: 120px;
      background: rgba(15, 23, 42, 0.45); border-radius: 18px;
      backdrop-filter: blur(8px); border: 1.5px solid rgba(255,255,255,0.25);
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    `;
    this.mapCtx = this.mapCanvas.getContext('2d')!;
    this.container.appendChild(this.mapCanvas);

    // 4. Center Banner Alert
    this.alertEl = document.createElement('div');
    this.alertEl.style.cssText = `
      position: absolute; top: 22%; left: 50%; transform: translate(-50%, -50%);
      font-size: 54px; font-weight: 900; font-style: italic; color: #facc15;
      text-shadow: 0 4px 16px rgba(0,0,0,0.8); letter-spacing: 2px;
      opacity: 0; transition: opacity 0.25s ease, transform 0.25s ease;
    `;
    this.container.appendChild(this.alertEl);
  }

  public update(kart: KartPhysicsState): void {
    // Speed km/h readout
    const kmh = Math.round(Math.abs(kart.speed) * 3.6);
    this.speedEl.textContent = `${kmh} KM/H`;

    // Dynamic Rank & Coins
    this.coinsEl.innerHTML = `<span style="font-size: 28px;">🟡</span><span>x0${kart.coins}</span>`;
    this.lapEl.textContent = `LAP ${kart.currentLap}/1`;

    // Draw Minimap
    this.drawMinimap(kart);

    // Boost alert banner
    if (kart.boostTimer > 0) {
      this.alertEl.textContent = '⚡ TURBO BOOST! ⚡';
      this.alertEl.style.opacity = '1';
      this.alertEl.style.color = '#38bdf8';
    } else if (kart.isOffroad) {
      this.alertEl.textContent = 'GRASS SLOWDOWN';
      this.alertEl.style.opacity = '0.85';
      this.alertEl.style.color = '#4ade80';
    } else {
      this.alertEl.style.opacity = '0';
    }
  }

  private drawMinimap(kart: KartPhysicsState): void {
    const ctx = this.mapCtx;
    const w = this.mapCanvas.width;
    const h = this.mapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Simplified stadium track loop outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.5, 46, 52, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Player Blip (Bright Cyan with outline)
    const angle = kart.lapProgress * Math.PI * 2 - Math.PI / 2;
    const bx = w * 0.5 + Math.cos(angle) * 46;
    const by = h * 0.5 + Math.sin(angle) * 52;

    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  public destroy(): void {
    this.container.remove();
  }
}

