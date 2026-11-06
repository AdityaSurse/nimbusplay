/**
 * NimbusPlay — Console Shell View Controller
 * Drives the Home Menu, Launch Modal, Pairing, Calibration & Pause HUD
 */

import QRCode from 'qrcode';
import { audioManager } from '../audio/audio-manager.js';
import { GAMES_CATALOG, type GameMetadata, renderChannelsGridHtml } from './catalog.js';

export { GAMES_CATALOG, type GameMetadata };

export class ConsoleShell {
  private stageEl: HTMLElement;
  private currentPage = 0;
  private maxPages = 4;
  private activeDialogGame: GameMetadata | null = null;
  private activeRoomCode = 'AUTO';
  private pairingUrl = '';

  constructor(stageEl: HTMLElement) {
    this.stageEl = stageEl;
    this.initClock();
    this.renderHomeMenu();
    this.initKeyboardShortcuts();
  }

  public getActiveDialogGame(): GameMetadata | null {
    return this.activeDialogGame;
  }

  public updatePairingInfo(roomCode: string, url: string): void {
    this.activeRoomCode = roomCode;
    this.pairingUrl = url;
    this.renderPairingQr();
    this.renderDockQr();
  }

  public openLaunchDialog(gameId: string): void {
    const game = GAMES_CATALOG[gameId];
    if (!game) return;
    this.activeDialogGame = game;

    const overlay = document.getElementById('launch-dialog-overlay') as HTMLElement;
    const titleEl = document.getElementById('dialog-game-title') as HTMLElement;
    const catEl = document.getElementById('dialog-game-category') as HTMLElement;
    const descEl = document.getElementById('dialog-game-desc') as HTMLElement;
    const bannerEl = document.getElementById('dialog-banner-inner') as HTMLElement;

    if (titleEl) titleEl.textContent = game.title;
    if (catEl) catEl.textContent = `${game.category} • ${game.revision}`;
    if (descEl) descEl.textContent = game.description;
    if (bannerEl) bannerEl.innerHTML = game.artHtml;

    if (overlay) overlay.classList.add('open');
    audioManager.playSelect();
  }

  public closeLaunchDialog(): void {
    const overlay = document.getElementById('launch-dialog-overlay');
    if (overlay) overlay.classList.remove('open');
    audioManager.playBack();
  }

  public showChannelLoading(gameTitle: string): void {
    const overlay = document.getElementById('channel-loading-overlay');
    const titleEl = document.getElementById('loading-game-title');
    if (titleEl) titleEl.textContent = `Loading ${gameTitle}...`;
    if (overlay) overlay.classList.add('open');
  }

  public hideChannelLoading(): void {
    const overlay = document.getElementById('channel-loading-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  public openPairingScreen(): void {
    const overlay = document.getElementById('pairing-overlay');
    if (overlay) {
      overlay.classList.add('open');
      this.renderPairingQr();
      audioManager.playSelect();
    }
  }

  public closePairingScreen(): void {
    const overlay = document.getElementById('pairing-overlay');
    if (overlay) overlay.classList.remove('open');
    audioManager.playBack();
  }

  public openSettingsScreen(): void {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) { overlay.classList.add('open'); audioManager.playSelect(); }
  }

  public closeSettingsScreen(): void {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) overlay.classList.remove('open');
    audioManager.playBack();
  }

  public openCalibrationScreen(): void {
    const overlay = document.getElementById('calibration-overlay');
    if (overlay) { overlay.classList.add('open'); audioManager.playSelect(); }
  }

  public closeCalibrationScreen(): void {
    const overlay = document.getElementById('calibration-overlay');
    if (overlay) overlay.classList.remove('open');
    audioManager.playBack();
  }

  public openPauseOverlay(): void {
    const overlay = document.getElementById('pause-overlay');
    if (overlay && !overlay.classList.contains('open')) {
      overlay.classList.add('open');
      audioManager.playSelect();
    }
  }

  public togglePauseOverlay(): void {
    const overlay = document.getElementById('pause-overlay');
    if (overlay) {
      const isOpen = overlay.classList.toggle('open');
      if (isOpen) audioManager.playSelect();
      else audioManager.playBack();
    }
  }

  public closePauseOverlay(): void {
    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.classList.remove('open');
    audioManager.playBack();
  }

  public openReconnectOverlay(): void {
    const overlay = document.getElementById('reconnect-overlay');
    if (overlay) {
      overlay.classList.add('open');
      this.renderReconnectQr();
    }
  }

  public closeReconnectOverlay(): void {
    const overlay = document.getElementById('reconnect-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  public updateAmbienceUI(isMuted: boolean): void {
    const btn = document.getElementById('btn-toggle-ambience');
    const icon = document.getElementById('ambience-icon');
    const label = document.getElementById('ambience-label');
    if (btn) btn.classList.toggle('muted', isMuted);
    if (icon) icon.textContent = isMuted ? 'volume_off' : 'music_note';
    if (label) label.textContent = isMuted ? 'Music: Muted' : 'Music: On';
  }

  public changePage(delta: number): void {
    this.currentPage = (this.currentPage + delta + this.maxPages) % this.maxPages;
    this.renderHomeMenu();
    audioManager.playPageTurn();
  }

  private initClock(): void {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      document.querySelectorAll('.clock-time').forEach((el) => { el.textContent = timeStr; });
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  private renderHomeMenu(): void {
    const gridEl = document.getElementById('channels-grid');
    if (!gridEl) return;
    gridEl.innerHTML = renderChannelsGridHtml(this.currentPage);
    this.bindGridEvents();
  }

  private bindGridEvents(): void {
    const tiles = this.stageEl.querySelectorAll('.channel-tile');
    tiles.forEach((tile) => {
      tile.addEventListener('click', () => {
        const action = tile.getAttribute('data-action');
        const gameId = tile.getAttribute('data-game');

        if (action === 'launch' && gameId) this.openLaunchDialog(gameId);
        else if (action === 'pairing') this.openPairingScreen();
        else if (action === 'calibration') this.openCalibrationScreen();
        else if (action === 'settings') this.openSettingsScreen();
      });
    });

    const dockQr = document.getElementById('dock-qr-link');
    dockQr?.addEventListener('click', () => this.openPairingScreen());

    document.getElementById('btn-page-prev')?.addEventListener('click', () => this.changePage(-1));
    document.getElementById('btn-page-next')?.addEventListener('click', () => this.changePage(1));
  }

  public renderDockQr(): void {
    this.drawQr('dock-qr-canvas', 'dock-qr-code', 72);
  }

  public renderReconnectQr(): void {
    this.drawQr('reconnect-qr-canvas', 'reconnect-room-code', 140);
  }

  private renderPairingQr(): void {
    const urlEl = document.getElementById('pairing-room-url');
    if (urlEl) urlEl.textContent = this.pairingUrl;
    this.drawQr('pairing-qr-canvas', 'pairing-room-code', 220);
  }

  private drawQr(canvasId: string, codeId: string, width: number): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    const codeEl = codeId ? document.getElementById(codeId) : null;
    if (codeEl) codeEl.textContent = this.activeRoomCode;
    if (canvas && this.pairingUrl) {
      QRCode.toCanvas(canvas, this.pairingUrl, {
        width,
        margin: 1,
        color: { dark: '#006688', light: '#ffffff' }
      }, (err) => {
        if (err) console.error(`[QR] Failed to render ${canvasId}:`, err);
      });
    }
  }

  private initKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === 'Escape' || key === 'h') this.togglePauseOverlay();
      else if (key === 'c') this.openCalibrationScreen();
      else if (key === 'p') this.openPairingScreen();
      else if (e.key === 'ArrowLeft') this.changePage(-1);
      else if (e.key === 'ArrowRight') this.changePage(1);
    });
  }
}
