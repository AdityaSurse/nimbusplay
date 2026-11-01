/**
 * NimbusPlay — Console Shell View Controller
 * Drives the Home Menu, Launch Modal, Pairing, Calibration & Pause HUD
 */

import QRCode from 'qrcode';
import { CHANNEL_ART } from './artwork.js';

export interface GameMetadata {
  id: string;
  title: string;
  category: string;
  rating: string;
  revision: string;
  bannerGradient: string;
  description: string;
  artHtml: string;
}

export const GAMES_CATALOG: Record<string, GameMetadata> = {
  sliceParty: {
    id: 'sliceParty',
    title: 'Slice Party',
    category: 'Party / Motion Action',
    rating: 'E (Everyone)',
    revision: 'Rev 1.02',
    bannerGradient: 'linear-gradient(135deg, #ffe6b3 0%, #ffedd5 50%, #d6f4ff 100%)',
    description: 'Fling, flick, and slice flying exotic melons, citrus wheels, and berries with precision wand slashing. Watch out for volatile party bombs!',
    artHtml: CHANNEL_ART.sliceParty
  },
  starDefender: {
    id: 'starDefender',
    title: 'Star Defender',
    category: 'Arcade / Aim & Shoot',
    rating: 'E (Everyone)',
    revision: 'Rev 1.00',
    bannerGradient: 'linear-gradient(180deg, #1b2b3a 0%, #101b24 60%, #080d12 100%)',
    description: 'Aim crosshairs at invading alien fighter fleets with the pointer and unleash rapid laser salvos with the B trigger to defend the orbital ring.',
    artHtml: CHANNEL_ART.starDefender
  },
  bowlBlitz: {
    id: 'bowlBlitz',
    title: 'Bowl Blitz',
    category: 'Sports / Motion Bowling',
    rating: 'E (Everyone)',
    revision: 'Rev 1.05',
    bannerGradient: 'linear-gradient(135deg, #e3efff 0%, #cce0f5 50%, #b3cde3 100%)',
    description: 'Hold B, swing your arm forward and release at peak acceleration. Add wrist spin to curve the bowling ball directly into the pocket for a strike!',
    artHtml: CHANNEL_ART.bowlBlitz
  }
};

export class ConsoleShell {
  private stageEl: HTMLElement;
  private pointerEl: HTMLElement;
  private currentPage = 0;
  private maxPages = 4;
  private activeDialogGame: GameMetadata | null = null;
  private activeRoomCode = 'AUTO';
  private pairingUrl = '';
  private isPointerPressed = false;

  constructor(stageEl: HTMLElement, pointerEl: HTMLElement) {
    this.stageEl = stageEl;
    this.pointerEl = pointerEl;
    this.initPointerTracking();
    this.initClock();
    this.renderHomeMenu();
    this.initKeyboardShortcuts();
  }

  public getActiveDialogGame(): GameMetadata | null {
    return this.activeDialogGame;
  }

  public getPointerElement(): HTMLElement {
    return this.pointerEl;
  }

  public getIsPointerPressed(): boolean {
    return this.isPointerPressed;
  }

  public updatePairingInfo(roomCode: string, url: string): void {
    this.activeRoomCode = roomCode;
    this.pairingUrl = url;
    this.renderPairingQr();
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
  }

  public closeLaunchDialog(): void {
    const overlay = document.getElementById('launch-dialog-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  public openPairingScreen(): void {
    const overlay = document.getElementById('pairing-overlay');
    if (overlay) {
      overlay.classList.add('open');
      this.renderPairingQr();
    }
  }

  public closePairingScreen(): void {
    const overlay = document.getElementById('pairing-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  public openSettingsScreen(): void {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) overlay.classList.add('open');
  }

  public closeSettingsScreen(): void {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  public openCalibrationScreen(): void {
    const overlay = document.getElementById('calibration-overlay');
    if (overlay) overlay.classList.add('open');
  }

  public closeCalibrationScreen(): void {
    const overlay = document.getElementById('calibration-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  public togglePauseOverlay(): void {
    const overlay = document.getElementById('pause-overlay');
    if (overlay) {
      overlay.classList.toggle('open');
    }
  }

  public closePauseOverlay(): void {
    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  public changePage(delta: number): void {
    this.currentPage = (this.currentPage + delta + this.maxPages) % this.maxPages;
    const pips = document.querySelectorAll('.pagination-pips .pip');
    pips.forEach((pip, idx) => {
      pip.classList.toggle('active', idx === this.currentPage);
    });
  }

  private initPointerTracking(): void {
    // Pointer tracking & hit testing is driven by InteractionManager
  }

  private initClock(): void {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const dateStr = `${days[now.getDay()]} ${now.getMonth() + 1}/${now.getDate()}`;

      const timeEls = document.querySelectorAll('.clock-time');
      const dateEls = document.querySelectorAll('.clock-date');

      timeEls.forEach((el) => { el.textContent = timeStr; });
      dateEls.forEach((el) => { el.textContent = dateStr; });
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  private renderHomeMenu(): void {
    const gridEl = document.getElementById('channels-grid');
    if (!gridEl) return;

    gridEl.innerHTML = `
      <!-- Slot 1: Slice Party -->
      <div class="channel-tile group" data-action="launch" data-game="sliceParty">
        <div class="tile-specular-glare"></div>
        ${CHANNEL_ART.sliceParty}
        <div class="tile-bottom-banner">
          <span class="tile-bottom-text">Disc Channel</span>
        </div>
      </div>

      <!-- Slot 2: Star Defender -->
      <div class="channel-tile group" data-action="launch" data-game="starDefender">
        <div class="tile-specular-glare"></div>
        ${CHANNEL_ART.starDefender}
        <div class="tile-bottom-banner">
          <span class="tile-bottom-text">Arcade</span>
        </div>
      </div>

      <!-- Slot 3: Bowl Blitz -->
      <div class="channel-tile group" data-action="launch" data-game="bowlBlitz">
        <div class="tile-specular-glare"></div>
        ${CHANNEL_ART.bowlBlitz}
        <div class="tile-bottom-banner">
          <span class="tile-bottom-text">Sports Hub</span>
        </div>
      </div>

      <!-- Slot 4: Settings -->
      <div class="channel-tile group" data-action="settings">
        <div class="tile-specular-glare"></div>
        ${CHANNEL_ART.settings}
        <div class="tile-bottom-banner">
          <span class="tile-bottom-text">System v3.4</span>
        </div>
      </div>

      <!-- Slot 5: Controller Sync -->
      <div class="channel-tile group" data-action="pairing">
        <div class="tile-specular-glare"></div>
        ${CHANNEL_ART.controllerSync}
        <div class="tile-bottom-banner">
          <span class="tile-bottom-text">Wireless Link</span>
        </div>
      </div>

      <!-- Slot 6: Pointer Tuning -->
      <div class="channel-tile group" data-action="calibration">
        <div class="tile-specular-glare"></div>
        ${CHANNEL_ART.calibration}
        <div class="tile-bottom-banner">
          <span class="tile-bottom-text">Sensor Bar</span>
        </div>
      </div>

      <!-- Slots 7 to 12: Empty Slots -->
      ${Array.from({ length: 6 }).map((_, i) => `
        <div class="channel-tile empty-slot group" data-slot="${i + 7}">
          <div class="tile-specular-glare"></div>
          ${CHANNEL_ART.emptySlot}
        </div>
      `).join('')}
    `;

    this.bindGridEvents();
  }

  private bindGridEvents(): void {
    const tiles = this.stageEl.querySelectorAll('.channel-tile');
    tiles.forEach((tile) => {
      tile.addEventListener('click', () => {
        const action = tile.getAttribute('data-action');
        const gameId = tile.getAttribute('data-game');

        if (action === 'launch' && gameId) {
          this.openLaunchDialog(gameId);
        } else if (action === 'pairing') {
          this.openPairingScreen();
        } else if (action === 'calibration') {
          this.openCalibrationScreen();
        } else if (action === 'settings') {
          this.openSettingsScreen();
        }
      });
    });

    // Pagination Bumpers
    const prevBtn = document.getElementById('btn-page-prev');
    const nextBtn = document.getElementById('btn-page-next');

    prevBtn?.addEventListener('click', () => this.changePage(-1));
    nextBtn?.addEventListener('click', () => this.changePage(1));
  }

  private renderPairingQr(): void {
    const canvas = document.getElementById('pairing-qr-canvas') as HTMLCanvasElement;
    const codeEl = document.getElementById('pairing-room-code');
    const urlEl = document.getElementById('pairing-room-url');

    if (codeEl) codeEl.textContent = this.activeRoomCode;
    if (urlEl) urlEl.textContent = this.pairingUrl;

    if (canvas && this.pairingUrl) {
      QRCode.toCanvas(canvas, this.pairingUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#006688',
          light: '#ffffff'
        }
      }, (err) => {
        if (err) console.error('[QR] Failed to render pairing QR:', err);
      });
    }
  }

  private initKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'h') {
        this.togglePauseOverlay();
      } else if (e.key.toLowerCase() === 'c') {
        this.openCalibrationScreen();
      } else if (e.key.toLowerCase() === 'p') {
        this.openPairingScreen();
      } else if (e.key === 'ArrowLeft') {
        this.changePage(-1);
      } else if (e.key === 'ArrowRight') {
        this.changePage(1);
      }
    });
  }
}
