/**
 * NimbusPlay — Shooting Range HUD, Score Popups & Round Timer
 * Frosted top-left score card, top-right round timer, floating "+N" hit popups,
 * and Round Over modal. Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { ScorePopup } from './types.js';

const HIGHSCORE_KEY = 'nimbusplay_shootingrange_highscore';

export interface RangeHudCallbacks {
  onRestart: () => void;
  onExit: () => void;
}

export class RangeHUD {
  public readonly container = new Container();
  private popupsLayer = new Container();
  private scoreText: Text;
  private bestText: Text;
  private timerText: Text;
  private timerPillGfx = new Graphics();
  private statsText: Text;
  private gameOverContainer = new Container();
  private finalScoreText: Text;
  private accuracyText: Text;
  private newBestLabel: Text;

  private score = 0;
  private bestScore = 0;
  private timeLeft = 60;
  private totalShots = 0;
  private totalHits = 0;
  private popups: ScorePopup[] = [];
  private popupTexts = new Map<number, Text>();
  private nextPopupId = 0;
  private callbacks: RangeHudCallbacks;

  constructor(callbacks: RangeHudCallbacks) {
    this.callbacks = callbacks;
    this.bestScore = this.loadHighScore();

    // 1. Top-Left: Score & BEST in Frosted Card
    const scoreCard = new Graphics();
    scoreCard.roundRect(40, 30, 230, 85, 20).fill({ color: 0xffffff, alpha: 0.88 }).stroke({ width: 2, color: 0x38bdf8, alpha: 0.6 });
    scoreCard.circle(75, 72, 18).fill({ color: 0xef4444 });
    scoreCard.circle(75, 72, 13).fill({ color: 0xffffff });
    scoreCard.circle(75, 72, 8).fill({ color: 0xef4444 });
    scoreCard.circle(75, 72, 3).fill({ color: 0xffffff });
    this.container.addChild(scoreCard);

    this.scoreText = new Text({ text: '0', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 38, fontWeight: '900', fill: 0x0f172a }) });
    this.scoreText.x = 106; this.scoreText.y = 40;
    this.container.addChild(this.scoreText);

    this.bestText = new Text({ text: `BEST: ${this.bestScore}`, style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: '800', fill: 0x64748b, letterSpacing: 1 }) });
    this.bestText.x = 108; this.bestText.y = 84;
    this.container.addChild(this.bestText);

    // 2. Top-Right: Round Timer Pill & Accuracy
    this.container.addChild(this.timerPillGfx);
    this.timerText = new Text({ text: 'TIME: 60s', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 24, fontWeight: '900', fill: 0x0284c7 }) });
    this.timerText.anchor.set(1, 0); this.timerText.x = 1920 - 65; this.timerText.y = 42;
    this.container.addChild(this.timerText);

    this.statsText = new Text({ text: 'ACC: 100% (0/0)', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: '800', fill: 0x475569 }) });
    this.statsText.anchor.set(1, 0); this.statsText.x = 1920 - 65; this.statsText.y = 80;
    this.container.addChild(this.statsText);
    this.redrawTimerPill(false);

    this.container.addChild(this.popupsLayer);

    // 3. Round Over Dialog
    this.gameOverContainer.visible = false;
    this.container.addChild(this.gameOverContainer);

    const scrim = new Graphics();
    scrim.rect(0, 0, 1920, 1080).fill({ color: 0x03182b, alpha: 0.75 });
    this.gameOverContainer.addChild(scrim);

    const card = new Graphics();
    card.roundRect(960 - 250, 540 - 190, 500, 380, 28).fill({ color: 0xffffff }).stroke({ width: 4, color: 0x38bdf8 });
    this.gameOverContainer.addChild(card);

    const title = new Text({ text: 'ROUND COMPLETE!', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 40, fontWeight: '900', fill: 0x0284c7 }) });
    title.anchor.set(0.5); title.x = 960; title.y = 540 - 120;
    this.gameOverContainer.addChild(title);

    this.finalScoreText = new Text({ text: 'Score: 0', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 28, fontWeight: '900', fill: 0x0f172a }) });
    this.finalScoreText.anchor.set(0.5); this.finalScoreText.x = 960; this.finalScoreText.y = 540 - 60;
    this.gameOverContainer.addChild(this.finalScoreText);

    this.accuracyText = new Text({ text: 'Accuracy: 100%', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 18, fontWeight: '800', fill: 0x51606a }) });
    this.accuracyText.anchor.set(0.5); this.accuracyText.x = 960; this.accuracyText.y = 540 - 15;
    this.gameOverContainer.addChild(this.accuracyText);

    this.newBestLabel = new Text({ text: '★ NEW HIGH SCORE ★', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 16, fontWeight: '900', fill: 0x16a34a }) });
    this.newBestLabel.anchor.set(0.5); this.newBestLabel.x = 960; this.newBestLabel.y = 540 + 20;
    this.newBestLabel.visible = false;
    this.gameOverContainer.addChild(this.newBestLabel);

    this.buildButton(960 - 110, 540 + 80, 'PLAY AGAIN', 0x0284c7, () => this.callbacks.onRestart());
    this.buildButton(960 + 110, 540 + 80, 'MENU', 0x51606a, () => this.callbacks.onExit());
  }

  private redrawTimerPill(isUrgent: boolean): void {
    const g = this.timerPillGfx;
    g.clear();
    g.roundRect(1920 - 290, 30, 240, 85, 20).fill({ color: 0xffffff, alpha: 0.9 })
      .stroke({ width: 2, color: isUrgent ? 0xef4444 : 0x38bdf8, alpha: 0.75 });
  }

  public setTimeLeft(seconds: number): void {
    this.timeLeft = Math.max(0, Math.ceil(seconds));
    this.timerText.text = `TIME: ${this.timeLeft}s`;
    const isUrgent = this.timeLeft <= 10;
    this.timerText.style.fill = isUrgent ? 0xef4444 : 0x0284c7;
    this.redrawTimerPill(isUrgent);
  }

  public registerShot(hit: boolean): void {
    this.totalShots++;
    if (hit) this.totalHits++;
    const acc = this.totalShots > 0 ? Math.round((this.totalHits / this.totalShots) * 100) : 100;
    this.statsText.text = `ACC: ${acc}% (${this.totalHits}/${this.totalShots})`;
  }

  public addScore(pts: number): void {
    this.score += pts;
    this.scoreText.text = this.score.toString();
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.bestText.text = `BEST: ${this.bestScore}`;
      this.saveHighScore(this.bestScore);
    }
  }

  public getScore(): number { return this.score; }

  public showHitPopup(x: number, y: number, points: number, isBullseye: boolean): void {
    const id = ++this.nextPopupId;
    const text = isBullseye ? `+${points} BULLSEYE!` : `+${points}`;
    const color = isBullseye ? 0xb45309 : points >= 15 ? 0xdc2626 : 0x0284c7;
    const popup: ScorePopup = { id, text, x, y, vy: -110, color, alpha: 1.0, scale: 1.35, timer: 0, maxLifetime: 0.75 };
    this.popups.push(popup);

    const txt = new Text({
      text,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif', fontSize: isBullseye ? 30 : 25, fontWeight: '900', fill: color,
        stroke: { color: 0xffffff, width: 4 }, dropShadow: { alpha: 0.4, blur: 6, distance: 2 }
      })
    });
    txt.anchor.set(0.5); txt.x = x; txt.y = y;
    this.popupTexts.set(id, txt);
    this.popupsLayer.addChild(txt);
  }

  public update(dt: number): void {
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.timer += dt;
      p.y += p.vy * dt;
      p.scale = Math.max(1.0, p.scale - 2.5 * dt);
      p.alpha = Math.max(0, 1.0 - (p.timer / p.maxLifetime));

      const txt = this.popupTexts.get(p.id);
      if (txt) { txt.y = p.y; txt.scale.set(p.scale); txt.alpha = p.alpha; }

      if (p.timer >= p.maxLifetime) {
        if (txt) { this.popupsLayer.removeChild(txt); txt.destroy(); this.popupTexts.delete(p.id); }
        this.popups.splice(i, 1);
      }
    }
  }

  public showRoundOver(): void {
    const acc = this.totalShots > 0 ? Math.round((this.totalHits / this.totalShots) * 100) : 0;
    this.finalScoreText.text = `Final Score: ${this.score}`;
    this.accuracyText.text = `Accuracy: ${acc}% (${this.totalHits} hits / ${this.totalShots} shots)`;
    this.newBestLabel.visible = this.score > 0 && this.score >= this.bestScore;
    this.gameOverContainer.visible = true;
  }

  public reset(): void {
    this.score = 0; this.timeLeft = 60; this.totalShots = 0; this.totalHits = 0;
    this.scoreText.text = '0';
    this.setTimeLeft(60);
    this.statsText.text = 'ACC: 100% (0/0)';
    for (const txt of this.popupTexts.values()) {
      this.popupsLayer.removeChild(txt);
      txt.destroy();
    }
    this.popups = [];
    this.popupTexts.clear();
    this.gameOverContainer.visible = false;
  }

  private buildButton(x: number, y: number, label: string, color: number, onClick: () => void): void {
    const btn = new Container();
    btn.x = x; btn.y = y; btn.eventMode = 'static'; btn.cursor = 'pointer';
    const bg = new Graphics();
    bg.roundRect(-80, -25, 160, 50, 25).fill(color);
    btn.addChild(bg);
    const txt = new Text({ text: label, style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 16, fontWeight: '900', fill: 0xffffff }) });
    txt.anchor.set(0.5); btn.addChild(txt);
    btn.on('pointerdown', onClick);
    this.gameOverContainer.addChild(btn);
  }

  private loadHighScore(): number {
    try {
      const val = localStorage.getItem(HIGHSCORE_KEY);
      return val ? parseInt(val, 10) : 0;
    } catch { return 0; }
  }

  private saveHighScore(score: number): void {
    try { localStorage.setItem(HIGHSCORE_KEY, score.toString()); } catch { /* ignore */ }
  }

  public destroy(): void { this.container.destroy({ children: true }); }
}
