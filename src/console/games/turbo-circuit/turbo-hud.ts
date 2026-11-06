/**
 * NimbusPlay — Turbo Circuit Racing HUD & Results Overlay
 * Authentic HUD with gold italic position, coin & lap telemetry, item roulette, minimap,
 * 3-2-1-GO countdown, FINISH banner, and Race Results modal.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import type { RacerProfile, KartPhysicsState } from './types.js';

export class TurboHUD {
  public readonly container: HTMLDivElement;

  private readonly rankEl: HTMLSpanElement;
  private readonly speedEl: HTMLSpanElement;
  private readonly coinsEl: HTMLDivElement;
  private readonly lapEl: HTMLDivElement;
  private readonly itemBoxEl: HTMLDivElement;
  private readonly itemIconEl: HTMLDivElement;
  private readonly centerBannerEl: HTMLDivElement;
  private readonly mapCanvas: HTMLCanvasElement;
  private readonly mapCtx: CanvasRenderingContext2D;
  private readonly resultsModalEl: HTMLDivElement;

  private lastRank = 8;
  private rouletteIndex = 0;

  constructor(onRaceAgain: () => void, onBackToMenu: () => void) {
    this.container = document.createElement('div');
    this.container.id = 'turbo-hud-overlay';
    this.container.style.cssText = `position: absolute; inset: 0; pointer-events: none; font-family: system-ui, sans-serif; overflow: hidden; z-index: 50;`;

    // 1. Top-Left: Held Item Slot & Roulette
    this.itemBoxEl = document.createElement('div');
    this.itemBoxEl.style.cssText = `
      position: absolute; left: 48px; top: 36px; width: 88px; height: 88px;
      border-radius: 20px; background: rgba(15, 23, 42, 0.65); border: 2.5px solid rgba(255,255,255,0.4);
      box-shadow: 0 8px 24px rgba(0,0,0,0.5); backdrop-filter: blur(8px);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    `;
    this.itemIconEl = document.createElement('div');
    this.itemIconEl.style.cssText = `font-size: 40px; display: flex; align-items: center; justify-content: center;`;
    this.itemBoxEl.appendChild(this.itemIconEl);
    this.container.appendChild(this.itemBoxEl);

    // 2. Bottom-Left: Coins and Lap Counter
    const telemetry = document.createElement('div');
    telemetry.style.cssText = `position: absolute; left: 48px; bottom: 36px; display: flex; flex-direction: column; gap: 6px;`;
    this.coinsEl = document.createElement('div');
    this.coinsEl.style.cssText = `font-size: 26px; font-weight: 900; color: #fde047; text-shadow: 0 2px 8px rgba(0,0,0,0.8); display: flex; align-items: center; gap: 8px;`;
    this.lapEl = document.createElement('div');
    this.lapEl.style.cssText = `font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 1.5px; text-shadow: 0 2px 8px rgba(0,0,0,0.8);`;
    telemetry.appendChild(this.coinsEl);
    telemetry.appendChild(this.lapEl);
    this.container.appendChild(telemetry);

    // 3. Bottom-Right: Massive Gold Italic Position Badge with Pop Animation
    const rankBox = document.createElement('div');
    rankBox.style.cssText = `position: absolute; right: 48px; bottom: 32px; display: flex; flex-direction: column; align-items: flex-end;`;
    this.rankEl = document.createElement('span');
    this.rankEl.style.cssText = `
      font-size: 96px; font-weight: 900; font-style: italic; line-height: 0.9;
      background: linear-gradient(180deg, #fef08a 0%, #facc15 50%, #ca8a04 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.8)); transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;
    this.rankEl.textContent = '8th';
    this.speedEl = document.createElement('span');
    this.speedEl.style.cssText = `font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 2px; text-shadow: 0 2px 6px rgba(0,0,0,0.8); margin-top: 4px;`;
    rankBox.appendChild(this.rankEl);
    rankBox.appendChild(this.speedEl);
    this.container.appendChild(rankBox);

    // 4. Center-Right: Minimap with Colored Racer Dots
    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.width = 150; this.mapCanvas.height = 150;
    this.mapCanvas.style.cssText = `
      position: absolute; right: 48px; top: 110px; background: rgba(15, 23, 42, 0.45);
      border-radius: 18px; backdrop-filter: blur(8px); border: 1.5px solid rgba(255,255,255,0.25);
    `;
    this.mapCtx = this.mapCanvas.getContext('2d')!;
    this.container.appendChild(this.mapCanvas);

    // 5. Center Banner for Countdown and Finish
    this.centerBannerEl = document.createElement('div');
    this.centerBannerEl.style.cssText = `
      position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%);
      font-size: 110px; font-weight: 900; font-style: italic; color: #facc15;
      text-shadow: 0 6px 20px rgba(0,0,0,0.9); letter-spacing: 4px; opacity: 0; pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
    `;
    this.container.appendChild(this.centerBannerEl);

    // 6. Race Results Modal
    this.resultsModalEl = document.createElement('div');
    this.resultsModalEl.style.cssText = `
      position: absolute; inset: 0; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(12px);
      display: none; flex-direction: column; align-items: center; justify-content: center; pointer-events: auto; z-index: 100;
    `;
    this.buildResultsModal(onRaceAgain, onBackToMenu);
    this.container.appendChild(this.resultsModalEl);
  }

  public update(player: KartPhysicsState, racers: RacerProfile[]): void {
    // 1. Position Badge & Pop
    const rankStr = this.getRankSuffix(player.position);
    this.rankEl.textContent = rankStr;
    if (player.position !== this.lastRank) {
      this.lastRank = player.position;
      this.rankEl.style.transform = 'scale(1.25)';
      setTimeout(() => { this.rankEl.style.transform = 'scale(1.0)'; }, 160);
    }

    // 2. Speed, Coins, and Laps
    this.speedEl.textContent = `${Math.round(Math.abs(player.speed) * 3.6)} KM/H`;
    this.coinsEl.innerHTML = `<span style="font-size: 28px;">🟡</span><span>x0${player.coins}</span>`;
    const lapNum = Math.min(3, player.currentLap);
    this.lapEl.innerHTML = lapNum === 3
      ? `<span style="color: #ef4444; animation: pulse 1s infinite;">FINAL LAP!</span>`
      : `LAP ${lapNum}/3`;

    // 3. Held Item & Roulette
    this.renderItemSlot(player);

    // 4. Draw Minimap with all 8 racers
    this.drawMinimap(racers);
  }

  private renderItemSlot(player: KartPhysicsState): void {
    if (player.isItemRoulette) {
      const icons = ['🚀', '🔮', '🟢', '🛡️'];
      this.rouletteIndex = (this.rouletteIndex + 1) % icons.length;
      this.itemIconEl.textContent = icons[this.rouletteIndex];
      this.itemBoxEl.style.borderColor = '#facc15';
    } else if (player.heldItem) {
      const iconMap: Record<string, string> = { boost: '🚀', rocket: '🔮', oil: '🟢', shield: '🛡️' };
      this.itemIconEl.textContent = iconMap[player.heldItem] ?? '';
      this.itemBoxEl.style.borderColor = '#38bdf8';
    } else {
      this.itemIconEl.textContent = '';
      this.itemBoxEl.style.borderColor = 'rgba(255,255,255,0.25)';
    }
  }

  private drawMinimap(racers: RacerProfile[]): void {
    const ctx = this.mapCtx;
    const w = this.mapCanvas.width;
    const h = this.mapCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Track loop
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.5, 50, 56, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Draw all 8 racers
    racers.forEach((r) => {
      const angle = r.lapProgress * Math.PI * 2 - Math.PI / 2;
      const rx = w * 0.5 + Math.cos(angle) * 50;
      const ry = h * 0.5 + Math.sin(angle) * 56;

      ctx.fillStyle = r.isPlayer ? '#06b6d4' : r.position === 1 ? '#facc15' : '#fb923c';
      ctx.beginPath();
      ctx.arc(rx, ry, r.isPlayer ? 5.5 : 4.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  public showCountdown(text: string, isGo: boolean): void {
    this.centerBannerEl.textContent = text;
    this.centerBannerEl.style.color = isGo ? '#4ade80' : '#facc15';
    this.centerBannerEl.style.opacity = '1';
    this.centerBannerEl.style.transform = 'translate(-50%, -50%) scale(1.15)';
    setTimeout(() => {
      this.centerBannerEl.style.opacity = '0';
      this.centerBannerEl.style.transform = 'translate(-50%, -50%) scale(0.9)';
    }, isGo ? 800 : 700);
  }

  public showFinishBanner(): void {
    this.centerBannerEl.textContent = 'FINISH!';
    this.centerBannerEl.style.color = '#38bdf8';
    this.centerBannerEl.style.opacity = '1';
    this.centerBannerEl.style.transform = 'translate(-50%, -50%) scale(1.2)';
  }

  public showResults(racers: RacerProfile[]): void {
    this.centerBannerEl.style.opacity = '0';
    this.resultsModalEl.style.display = 'flex';
    const tbody = this.resultsModalEl.querySelector('#results-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    racers.forEach((r) => {
      const row = document.createElement('tr');
      row.style.cssText = r.isPlayer ? 'background: rgba(6, 182, 212, 0.2); font-weight: bold;' : '';
      row.innerHTML = `
        <td style="padding: 6px 16px; text-align: center; color: #fde047;">${this.getRankSuffix(r.position)}</td>
        <td style="padding: 6px 16px; color: #ffffff;">${r.name}</td>
        <td style="padding: 6px 16px; text-align: center; color: #94a3b8;">${r.isPlayer ? '3 Laps' : '3 Laps'}</td>
      `;
      tbody.appendChild(row);
    });
  }

  private buildResultsModal(onRaceAgain: () => void, onBackToMenu: () => void): void {
    this.resultsModalEl.innerHTML = `
      <div style="background: rgba(30, 41, 59, 0.95); border: 2px solid rgba(255,255,255,0.2); border-radius: 24px; padding: 32px 40px; box-shadow: 0 12px 36px rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; max-width: 580px; width: 90%;">
        <h2 style="font-size: 36px; font-weight: 900; font-style: italic; color: #facc15; margin: 0 0 16px 0; letter-spacing: 2px;">🏆 RACE RESULTS 🏆</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 18px;">
          <thead><tr style="border-bottom: 2px solid rgba(255,255,255,0.2); color: #94a3b8;"><th style="padding: 6px;">POS</th><th style="padding: 6px;">RACER</th><th style="padding: 6px;">LAPS</th></tr></thead>
          <tbody id="results-tbody"></tbody>
        </table>
        <div style="display: flex; gap: 16px;">
          <button id="btn-race-again" style="padding: 12px 28px; background: linear-gradient(135deg, #0284c7, #06b6d4); color: white; border: none; border-radius: 14px; font-size: 18px; font-weight: 800; cursor: pointer;">RACE AGAIN</button>
          <button id="btn-back-menu" style="padding: 12px 28px; background: rgba(255,255,255,0.15); color: white; border: 1.5px solid rgba(255,255,255,0.4); border-radius: 14px; font-size: 18px; font-weight: 800; cursor: pointer;">BACK TO MENU</button>
        </div>
      </div>
    `;
    this.resultsModalEl.querySelector('#btn-race-again')?.addEventListener('click', () => { this.resultsModalEl.style.display = 'none'; onRaceAgain(); });
    this.resultsModalEl.querySelector('#btn-back-menu')?.addEventListener('click', () => { this.resultsModalEl.style.display = 'none'; onBackToMenu(); });
  }

  public hideResults(): void {
    this.resultsModalEl.style.display = 'none';
  }

  private getRankSuffix(rank: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = rank % 100;
    return rank + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  public destroy(): void {
    this.container.remove();
  }
}
