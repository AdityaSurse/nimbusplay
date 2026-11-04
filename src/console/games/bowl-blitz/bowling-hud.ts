/**
 * NimbusPlay — Bowl Blitz 10-Frame Scoreboard & HUD System
 * Renders the official 10-frame score sheet, power meter, celebratory banners, and replay badge.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { FrameScore } from './types.js';

const makeStyle = (fontSize: number, fill = '#f8fafc', bold = true): TextStyle =>
  new TextStyle({
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize,
    fontWeight: bold ? '700' : '500',
    fill
  });

export class BowlingHud {
  public container = new Container();
  private g = new Graphics();
  private textContainer = new Container();
  private bannerText: Text;
  private bannerTimer = 0;
  private replayBadgeText: Text;
  private replayBtnText: Text;

  // Overhead scoreboard dynamic text cache
  private colTexts: Array<{ r1: Text; r2: Text; r3?: Text; total: Text }> = [];
  private totalScoreText!: Text;

  // Game over overlay texts
  private gameOverTitle!: Text;
  private gameOverScore!: Text;
  private gameOverContainer = new Container();

  constructor() {
    this.container.addChild(this.g, this.textContainer, this.gameOverContainer);
    this.gameOverContainer.visible = false;

    this.bannerText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'system-ui, sans-serif',
        fontSize: 76,
        fontWeight: '900',
        fill: '#38bdf8',
        stroke: { color: '#0369a1', width: 8 },
        letterSpacing: 4
      })
    });
    this.bannerText.visible = false;
    this.textContainer.addChild(this.bannerText);

    this.replayBadgeText = new Text({
      text: '● REPLAY (0.6x SLOW-MO)',
      style: new TextStyle({
        fontFamily: 'ui-monospace, monospace',
        fontSize: 18,
        fontWeight: '900',
        fill: '#ef4444',
        letterSpacing: 2
      })
    });
    this.replayBadgeText.position.set(60, 160);
    this.replayBadgeText.visible = false;
    this.textContainer.addChild(this.replayBadgeText);

    this.replayBtnText = new Text({ text: 'REPLAY (B)', style: makeStyle(16, '#38bdf8') });
    this.replayBtnText.position.set(110, 1002);
    this.replayBtnText.visible = false;
    this.textContainer.addChild(this.replayBtnText);

    this.initScoreboardTexts();
    this.initGameOverTexts();
  }

  private initScoreboardTexts(): void {
    const boardW = 1260;
    const boardX = (1920 - boardW) / 2;
    const colW = (boardW - 120) / 10;
    const boardY = 24;

    for (let i = 0; i < 10; i++) {
      const fx = boardX + i * colW;
      const numText = new Text({ text: `${i + 1}`, style: makeStyle(13, '#94a3b8') });
      numText.position.set(fx + colW * 0.5 - numText.width * 0.5, boardY + 4);
      const r1 = new Text({ text: '', style: makeStyle(14, '#e2e8f0') });
      r1.position.set(fx + 16, boardY + 28);
      const r2 = new Text({ text: '', style: makeStyle(14, '#38bdf8') });
      r2.position.set(fx + colW - 32, boardY + 28);

      let r3: Text | undefined;
      if (i === 9) {
        r3 = new Text({ text: '', style: makeStyle(14, '#38bdf8') });
        r3.position.set(fx + colW - 16, boardY + 28);
        this.textContainer.addChild(r3);
      }

      const total = new Text({ text: '', style: makeStyle(18, '#ffffff') });
      total.position.set(fx + colW * 0.5 - 12, boardY + 56);
      this.textContainer.addChild(numText, r1, r2, total);
      this.colTexts.push({ r1, r2, r3, total });
    }

    const totalLabel = new Text({ text: 'TOTAL', style: makeStyle(13, '#38bdf8') });
    totalLabel.position.set(boardX + 10 * colW + 36, boardY + 4);
    this.totalScoreText = new Text({ text: '0', style: makeStyle(26, '#38bdf8') });
    this.totalScoreText.position.set(boardX + 10 * colW + 42, boardY + 40);
    this.textContainer.addChild(totalLabel, this.totalScoreText);
  }

  private initGameOverTexts(): void {
    this.gameOverTitle = new Text({ text: 'GAME OVER', style: makeStyle(42, '#38bdf8') });
    this.gameOverTitle.position.set(960 - 130, 400);
    this.gameOverScore = new Text({ text: 'FINAL SCORE: 0', style: makeStyle(26, '#f8fafc') });
    this.gameOverScore.position.set(960 - 105, 470);
    const retryText = new Text({ text: 'PLAY AGAIN', style: makeStyle(18, '#ffffff') });
    retryText.position.set(770, 608);
    const menuText = new Text({ text: 'HOME MENU', style: makeStyle(18, '#cbd5e1') });
    menuText.position.set(1040, 608);
    this.gameOverContainer.addChild(this.gameOverTitle, this.gameOverScore, retryText, menuText);
  }

  public showBanner(text: string, color = '#38bdf8', duration = 2.0): void {
    this.bannerText.text = text;
    this.bannerText.style.fill = color;
    this.bannerText.position.set(960 - this.bannerText.width / 2, 430);
    this.bannerText.visible = true;
    this.bannerTimer = duration;
  }

  public setReplayVisible(visible: boolean): void {
    this.replayBadgeText.visible = visible;
  }

  public renderScoreboard(
    frames: FrameScore[],
    currentFrame: number,
    powerProgress: number,
    isPowerMode: boolean,
    hasReplay: boolean,
    isRolling: boolean
  ): void {
    this.g.clear();
    const boardW = 1260;
    const boardH = 90;
    const boardX = (1920 - boardW) / 2;
    const boardY = 24;

    this.g.roundRect(boardX, boardY, boardW, boardH, 12).fill(0x0a101d).stroke({ width: 2, color: 0x334155 });
    const colW = (boardW - 120) / 10;
    let runningTotal = 0;

    for (let i = 0; i < 10; i++) {
      const fx = boardX + i * colW;
      const f = frames[i];
      if (currentFrame === i + 1) {
        this.g.rect(fx, boardY + 2, colW, boardH - 4).fill({ color: 0x0284c7, alpha: 0.22 }).stroke({ width: 1.5, color: 0x38bdf8 });
      }

      this.g.rect(fx, boardY, colW, 24).fill(0x131f33).stroke({ width: 0.5, color: 0x1e293b });
      const rollBoxW = colW * 0.42;
      this.g.rect(fx + colW - rollBoxW, boardY + 24, rollBoxW, 26).stroke({ width: 0.5, color: 0x334155 });
      if (i === 9) {
        this.g.rect(fx + colW - rollBoxW * 2, boardY + 24, rollBoxW, 26).stroke({ width: 0.5, color: 0x334155 });
      }

      // Update Column Text
      const item = this.colTexts[i];
      item.r1.text = f.roll1 === null ? '' : f.roll1 === 10 ? 'X' : `${f.roll1}`;
      item.r2.text = f.roll2 === null ? '' : f.isSpare ? '/' : f.roll2 === 10 ? 'X' : `${f.roll2}`;
      if (item.r3) item.r3.text = f.roll3 === null ? '' : f.roll3 === 10 ? 'X' : `${f.roll3}`;
      item.total.text = f.score !== null ? `${f.score}` : '';
      if (f.score !== null) runningTotal = f.score;
    }

    this.g.roundRect(boardX + 10 * colW, boardY, 120, boardH, 8).fill(0x0f172a).stroke({ width: 2, color: 0x0284c7 });
    this.totalScoreText.text = `${runningTotal}`;

    // Power Meter Bar
    if (isPowerMode && !isRolling) {
      const pmX = 1820;
      const pmY = 560;
      const pmW = 22;
      const pmH = 240;
      this.g.roundRect(pmX, pmY, pmW, pmH, 11).fill(0x0f172a).stroke({ width: 2, color: 0x475569 });
      const fillH = Math.max(0, (pmH - 4) * powerProgress);
      const fillColor = powerProgress > 0.8 ? 0xef4444 : powerProgress > 0.5 ? 0xf59e0b : 0x06b6d4;
      this.g.roundRect(pmX + 2, pmY + pmH - 2 - fillH, pmW - 4, fillH, 9).fill(fillColor);
    }

    this.replayBtnText.visible = hasReplay && !isRolling;
    if (hasReplay && !isRolling) {
      this.g.roundRect(60, 990, 200, 46, 23).fill(0x1e293b).stroke({ width: 2, color: 0x38bdf8 });
    }
  }

  public update(dt: number): void {
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.bannerText.visible = false;
    }
  }

  public renderGameOver(totalScore: number, isOverRetry: boolean, isOverMenu: boolean): void {
    this.gameOverContainer.visible = true;
    this.gameOverTitle.text = totalScore === 300 ? 'PERFECT GAME!' : 'GAME OVER';
    this.gameOverScore.text = `FINAL SCORE: ${totalScore}`;

    this.g.rect(0, 0, 1920, 1080).fill({ color: 0x060913, alpha: 0.85 });
    const cardW = 620;
    const cardH = 390;
    const cardX = (1920 - cardW) / 2;
    const cardY = (1080 - cardH) / 2;
    this.g.roundRect(cardX, cardY, cardW, cardH, 24).fill(0x0f172a).stroke({ width: 3, color: 0x38bdf8 });

    const btnW = 220;
    const btnH = 54;
    const btnY = cardY + cardH - 85;
    const retryX = cardX + 55;
    this.g.roundRect(retryX, btnY, btnW, btnH, 27).fill(isOverRetry ? 0x0284c7 : 0x0369a1).stroke({ width: 2, color: 0x38bdf8 });
    const menuX = cardX + cardW - btnW - 55;
    this.g.roundRect(menuX, btnY, btnW, btnH, 27).fill(isOverMenu ? 0x334155 : 0x1e293b).stroke({ width: 2, color: 0x64748b });
  }

  public checkGameOverClick(px: number, py: number, isClicked: boolean): 'retry' | 'menu' | null {
    const cardW = 620;
    const cardH = 390;
    const cardY = (1080 - cardH) / 2;
    const btnW = 220;
    const btnH = 54;
    const btnY = cardY + cardH - 85;
    const retryX = (1920 - cardW) / 2 + 55;
    const menuX = (1920 - cardW) / 2 + cardW - btnW - 55;

    const isOverRetry = px >= retryX && px <= retryX + btnW && py >= btnY && py <= btnY + btnH;
    const isOverMenu = px >= menuX && px <= menuX + btnW && py >= btnY && py <= btnY + btnH;

    if (isClicked) {
      if (isOverRetry) return 'retry';
      if (isOverMenu) return 'menu';
    }
    return null;
  }
}
