/**
 * NimbusPlay — DOM Game Over & Round Complete Modal Overlay
 * Renders an accessible, pointer-friendly DOM overlay with Restart and Menu pill buttons.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { audioManager } from '../../audio/audio-manager.js';

export interface GameEndModalConfig {
  title: string;
  score?: number;
  bestScore?: number;
  subtitle?: string;
  accentColor?: string;
  restartLabel?: string;
  menuLabel?: string;
  onRestart: () => void;
  onExit: () => void;
}

export class GameEndModal {
  private overlayEl: HTMLDivElement;
  private cardEl: HTMLDivElement;
  private titleEl: HTMLHeadingElement;
  private scoreEl: HTMLParagraphElement;
  private bestEl: HTMLParagraphElement;
  private subtitleEl: HTMLParagraphElement;
  private btnRestart: HTMLButtonElement;
  private btnMenu: HTMLButtonElement;

  private currentConfig: GameEndModalConfig | null = null;
  private isShown = false;

  constructor(parent: HTMLElement) {
    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'game-modal-overlay';
    this.overlayEl.style.cssText = `
      position: absolute; inset: 0; z-index: 85;
      background: rgba(10, 15, 28, 0.82); backdrop-filter: blur(12px);
      display: none; align-items: center; justify-content: center;
      transition: opacity 0.25s ease;
    `;

    this.cardEl = document.createElement('div');
    this.cardEl.className = 'game-modal-card';
    this.cardEl.style.cssText = `
      background: #ffffff; border-radius: 28px; padding: 36px 44px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
      border: 3.5px solid #0284c7; max-width: 520px; width: 90%;
      display: flex; flex-direction: column; align-items: center; text-align: center;
    `;

    this.titleEl = document.createElement('h2');
    this.titleEl.style.cssText = `
      font-size: 38px; font-weight: 900; margin: 0 0 10px 0;
      color: #0284c7; letter-spacing: 0.04em;
    `;

    this.scoreEl = document.createElement('p');
    this.scoreEl.style.cssText = `
      font-size: 26px; font-weight: 900; margin: 0 0 4px 0; color: #0f172a;
    `;

    this.subtitleEl = document.createElement('p');
    this.subtitleEl.style.cssText = `
      font-size: 16px; font-weight: 700; margin: 0 0 8px 0; color: #64748b;
    `;

    this.bestEl = document.createElement('p');
    this.bestEl.style.cssText = `
      font-size: 15px; font-weight: 800; margin: 0 0 24px 0;
      color: #16a34a; letter-spacing: 0.05em; display: none;
    `;
    this.bestEl.textContent = 'NEW HIGH SCORE!';

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; align-items: center; justify-content: center; gap: 20px; width: 100%;';

    this.btnRestart = document.createElement('button');
    this.btnRestart.id = 'btn-game-modal-restart';
    this.btnRestart.className = 'pill-btn game-btn game-btn-restart';
    this.btnRestart.style.cssText = `
      flex: 1; height: 56px; border-radius: 9999px; font-size: 17px; font-weight: 800;
      background: #0284c7; color: #ffffff; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
    `;
    this.btnRestart.innerHTML = `
      <span class="material-symbols-outlined" style="font-size: 22px;">refresh</span>
      <span class="btn-lbl">Restart</span>
    `;

    this.btnMenu = document.createElement('button');
    this.btnMenu.id = 'btn-game-modal-menu';
    this.btnMenu.className = 'pill-btn game-btn game-btn-menu';
    this.btnMenu.style.cssText = `
      flex: 1; height: 56px; border-radius: 9999px; font-size: 17px; font-weight: 800;
      background: #f1f5f9; color: #334155; border: 1.5px solid #cbd5e1; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    `;
    this.btnMenu.innerHTML = `
      <span class="material-symbols-outlined" style="font-size: 22px;">home</span>
      <span class="btn-lbl">Menu</span>
    `;

    this.btnRestart.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.playSelect();
      this.hide();
      this.currentConfig?.onRestart();
    });

    this.btnMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.playBack();
      this.hide();
      this.currentConfig?.onExit();
    });

    btnRow.appendChild(this.btnRestart);
    btnRow.appendChild(this.btnMenu);

    this.cardEl.appendChild(this.titleEl);
    this.cardEl.appendChild(this.scoreEl);
    this.cardEl.appendChild(this.subtitleEl);
    this.cardEl.appendChild(this.bestEl);
    this.cardEl.appendChild(btnRow);

    this.overlayEl.appendChild(this.cardEl);
    parent.appendChild(this.overlayEl);
  }

  public show(config: GameEndModalConfig): void {
    this.currentConfig = config;
    this.isShown = true;

    this.titleEl.textContent = config.title;
    if (config.accentColor) {
      this.titleEl.style.color = config.accentColor;
      this.cardEl.style.borderColor = config.accentColor;
      this.btnRestart.style.background = config.accentColor;
      this.btnRestart.style.boxShadow = `0 4px 14px ${config.accentColor}66`;
    }

    if (typeof config.score === 'number') {
      this.scoreEl.textContent = `Score: ${config.score}`;
      this.scoreEl.style.display = 'block';
    } else {
      this.scoreEl.style.display = 'none';
    }

    if (config.subtitle) {
      this.subtitleEl.textContent = config.subtitle;
      this.subtitleEl.style.display = 'block';
    } else {
      this.subtitleEl.style.display = 'none';
    }

    const isNewBest = typeof config.score === 'number' && typeof config.bestScore === 'number' &&
      config.score > 0 && config.score >= config.bestScore;
    this.bestEl.style.display = isNewBest ? 'block' : 'none';

    const restartLbl = this.btnRestart.querySelector('.btn-lbl');
    if (restartLbl) restartLbl.textContent = config.restartLabel || 'Restart';

    const menuLbl = this.btnMenu.querySelector('.btn-lbl');
    if (menuLbl) menuLbl.textContent = config.menuLabel || 'Menu';

    this.overlayEl.classList.add('open');
    this.overlayEl.style.display = 'flex';
  }

  public hide(): void {
    this.isShown = false;
    this.overlayEl.classList.remove('open');
    this.overlayEl.style.display = 'none';
  }

  public getIsShown(): boolean {
    return this.isShown;
  }

  public destroy(): void {
    this.hide();
    this.overlayEl.remove();
  }
}

