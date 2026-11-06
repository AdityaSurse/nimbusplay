/**
 * NimbusPlay — Alien Attack HUD & Heads-Up Display
 * Top-left bold score readout & BEST; Top-right three green hearts for lives and shield badge.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

const HIGHSCORE_KEY = 'nimbusplay_alienattack_highscore';

export interface AlienHudCallbacks {
  onRestart: () => void;
  onExit: () => void;
}

export class AlienHUD {
  public readonly container = new Container();
  private scoreText: Text;
  private bestText: Text;
  private waveBanner: Text;
  private shieldBadge = new Container();
  private heartsContainer = new Container();
  private heartGraphics: Graphics[] = [];
  private gameOverContainer = new Container();
  private finalScoreText: Text;
  private newBestLabel: Text;

  private score = 0;
  private bestScore = 0;
  private lives = 3;
  private readonly maxLives = 3;
  private callbacks: AlienHudCallbacks;

  constructor(callbacks: AlienHudCallbacks) {
    this.callbacks = callbacks;
    this.bestScore = this.loadHighScore();

    // 1. Top-Left: Score + BEST
    this.scoreText = new Text({
      text: '0',
      style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 54, fontWeight: '900', fill: 0xffffff, dropShadow: { alpha: 0.6, blur: 8, distance: 3 } })
    });
    this.scoreText.x = 60; this.scoreText.y = 35;
    this.container.addChild(this.scoreText);

    this.bestText = new Text({
      text: `BEST: ${this.bestScore}`,
      style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 15, fontWeight: '800', fill: 0x94a3b8, letterSpacing: 1.5 })
    });
    this.bestText.x = 64; this.bestText.y = 98;
    this.container.addChild(this.bestText);

    // 2. Top-Right: Three Green Hearts & Shield Badge
    this.heartsContainer.x = 1920 - 220; this.heartsContainer.y = 48;
    this.container.addChild(this.heartsContainer);
    this.buildHeartsDisplay();
    this.buildShieldBadge();
    this.container.addChild(this.shieldBadge);

    // 3. Top-Center: Wave Banner
    this.waveBanner = new Text({
      text: '',
      style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 38, fontWeight: '900', fill: 0x38bdf8, stroke: { color: 0x081232, width: 6 }, dropShadow: { alpha: 0.7, blur: 10, distance: 4 } })
    });
    this.waveBanner.anchor.set(0.5); this.waveBanner.x = 960; this.waveBanner.y = 70; this.waveBanner.alpha = 0;
    this.container.addChild(this.waveBanner);

    // 4. Game Over Modal
    this.gameOverContainer.visible = false;
    this.container.addChild(this.gameOverContainer);

    const scrim = new Graphics();
    scrim.rect(0, 0, 1920, 1080).fill({ color: 0x050b1e, alpha: 0.82 });
    this.gameOverContainer.addChild(scrim);

    const card = new Graphics();
    card.roundRect(960 - 240, 540 - 180, 480, 360, 24).fill({ color: 0x0f172a }).stroke({ width: 3, color: 0x0284c7 });
    this.gameOverContainer.addChild(card);

    const goLabel = new Text({ text: 'MISSION FAILED', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 44, fontWeight: '900', fill: 0xef4444 }) });
    goLabel.anchor.set(0.5); goLabel.x = 960; goLabel.y = 540 - 105;
    this.gameOverContainer.addChild(goLabel);

    this.finalScoreText = new Text({ text: 'Score: 0', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 24, fontWeight: '800', fill: 0xe2e8f0 }) });
    this.finalScoreText.anchor.set(0.5); this.finalScoreText.x = 960; this.finalScoreText.y = 540 - 45;
    this.gameOverContainer.addChild(this.finalScoreText);

    this.newBestLabel = new Text({ text: '★ NEW HIGH SCORE ★', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 16, fontWeight: '800', fill: 0x38bdf8 }) });
    this.newBestLabel.anchor.set(0.5); this.newBestLabel.x = 960; this.newBestLabel.y = 540 - 12; this.newBestLabel.visible = false;
    this.gameOverContainer.addChild(this.newBestLabel);

    this.buildButton(960 - 110, 540 + 45, 'RETRY', 0x0284c7, () => this.callbacks.onRestart());
    this.buildButton(960 + 110, 540 + 45, 'MENU', 0x334155, () => this.callbacks.onExit());
  }

  private drawGreenHeart(g: Graphics, filled: boolean): void {
    g.clear();
    const color = filled ? 0x22c55e : 0x334155, alpha = filled ? 1.0 : 0.45;
    g.poly([
      { x: 0, y: -4 }, { x: -7, y: -14 }, { x: -16, y: -14 }, { x: -18, y: -6 }, { x: -18, y: 2 },
      { x: 0, y: 16 }, { x: 18, y: 2 }, { x: 18, y: -6 }, { x: 16, y: -14 }, { x: 7, y: -14 }
    ]).fill({ color, alpha });

    if (filled) {
      g.circle(-8, -9, 2.5).fill({ color: 0x86efac, alpha: 0.8 });
      g.stroke({ width: 2, color: 0x16a34a });
    } else {
      g.stroke({ width: 1.5, color: 0x475569 });
    }
  }

  private buildHeartsDisplay(): void {
    this.heartsContainer.removeChildren();
    this.heartGraphics = [];
    for (let i = 0; i < this.maxLives; i++) {
      const g = new Graphics();
      g.x = i * 46;
      this.drawGreenHeart(g, i < this.lives);
      this.heartGraphics.push(g);
      this.heartsContainer.addChild(g);
    }
  }

  private buildShieldBadge(): void {
    this.shieldBadge.x = 1920 - 220; this.shieldBadge.y = 90; this.shieldBadge.visible = false;
    const bg = new Graphics();
    bg.roundRect(0, 0, 138, 24, 12).fill({ color: 0x06b6d4, alpha: 0.25 }).stroke({ width: 1.5, color: 0x38bdf8, alpha: 0.85 });
    this.shieldBadge.addChild(bg);
    const txt = new Text({ text: 'SHIELD ACTIVE', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: '900', fill: 0x67e8f9 }) });
    txt.x = 22; txt.y = 4;
    this.shieldBadge.addChild(txt);
  }

  public setShieldActive(active: boolean): void { this.shieldBadge.visible = active; }

  public setLives(lives: number): void {
    this.lives = Math.max(0, Math.min(this.maxLives, lives));
    for (let i = 0; i < this.maxLives; i++) {
      if (this.heartGraphics[i]) this.drawGreenHeart(this.heartGraphics[i], i < this.lives);
    }
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

  public showWave(wave: number): void {
    this.waveBanner.text = `WAVE ${wave}`;
    this.waveBanner.alpha = 1;
    this.waveBanner.scale.set(1.2);
    setTimeout(() => { this.waveBanner.scale.set(1.0); }, 150);
    setTimeout(() => { this.waveBanner.alpha = 0; }, 2200);
  }

  public showGameOver(): void {
    this.finalScoreText.text = `Final Score: ${this.score}`;
    this.newBestLabel.visible = this.score > 0 && this.score >= this.bestScore;
    this.gameOverContainer.visible = true;
  }

  public reset(): void {
    this.score = 0; this.lives = 3; this.scoreText.text = '0';
    this.setShieldActive(false);
    this.buildHeartsDisplay();
    this.gameOverContainer.visible = false;
  }

  private buildButton(x: number, y: number, label: string, color: number, onClick: () => void): void {
    const btn = new Container();
    btn.x = x; btn.y = y; btn.eventMode = 'static'; btn.cursor = 'pointer';
    const bg = new Graphics();
    bg.roundRect(-75, -24, 150, 48, 24).fill(color);
    btn.addChild(bg);
    const txt = new Text({ text: label, style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 16, fontWeight: '900', fill: 0xffffff }) });
    txt.anchor.set(0.5);
    btn.addChild(txt);
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
