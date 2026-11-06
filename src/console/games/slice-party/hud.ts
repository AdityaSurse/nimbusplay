/**
 * NimbusPlay — Fruit Ninja Authentic HUD & Game Over Card
 * Top-left watermelon icon + score & BEST; Top-right three red "X X X" strikes.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

const HIGHSCORE_KEY = 'nimbusplay_fruitninja_highscore';

export interface HudCallbacks {
  onRestart: () => void;
  onExit: () => void;
}

export class SlicePartyHUD {
  public container = new Container();
  private scoreText: Text;
  private bestText: Text;
  private strikesContainer = new Container();
  private strikeTexts: Text[] = [];
  private comboBanner: Text;
  private gameOverContainer = new Container();
  private finalScoreText: Text;
  private newBestLabel: Text;

  private score = 0;
  private bestScore = 0;
  private strikes = 0;
  private maxStrikes = 3;
  private callbacks: HudCallbacks;

  constructor(callbacks: HudCallbacks) {
    this.callbacks = callbacks;
    this.bestScore = this.loadHighScore();

    // 1. Top-Left: Small Fruit Icon + Score + BEST
    const fruitIcon = new Graphics();
    fruitIcon.arc(0, 0, 24, 0, Math.PI).fill(0x1e6f3d);
    fruitIcon.arc(0, 0, 21, 0, Math.PI).fill(0xf5f6fa);
    fruitIcon.arc(0, 0, 18, 0, Math.PI).fill(0xff2a48);
    fruitIcon.rect(-18, -2, 36, 3).fill(0xff2a48);
    fruitIcon.circle(-8, 6, 1.6).fill(0x181820);
    fruitIcon.circle(0, 9, 1.6).fill(0x181820);
    fruitIcon.circle(8, 6, 1.6).fill(0x181820);
    fruitIcon.x = 64; fruitIcon.y = 58;
    this.container.addChild(fruitIcon);

    this.scoreText = new Text({
      text: '0',
      style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 56, fontWeight: '900', fill: 0xffffff, dropShadow: { alpha: 0.5, blur: 6, distance: 3 } })
    });
    this.scoreText.x = 100; this.scoreText.y = 30;
    this.container.addChild(this.scoreText);

    this.bestText = new Text({
      text: `BEST: ${this.bestScore}`,
      style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 15, fontWeight: '800', fill: 0xd1d5db, letterSpacing: 1.5 })
    });
    this.bestText.x = 104; this.bestText.y = 96;
    this.container.addChild(this.bestText);

    // 2. Top-Right: Three Strike "X X X" Markers
    this.strikesContainer.x = 1920 - 200;
    this.strikesContainer.y = 36;
    this.container.addChild(this.strikesContainer);
    this.buildStrikesDisplay();

    // 3. Top-Center: Combo Celebration Banner
    this.comboBanner = new Text({
      text: '',
      style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 42, fontWeight: '900', fill: 0xffd32a, stroke: { color: 0x140703, width: 6 }, dropShadow: { alpha: 0.6, blur: 8, distance: 4 } })
    });
    this.comboBanner.anchor.set(0.5);
    this.comboBanner.x = 960; this.comboBanner.y = 75; this.comboBanner.alpha = 0;
    this.container.addChild(this.comboBanner);

    // 4. Game Over Dialog Overlay
    this.gameOverContainer.visible = false;
    this.container.addChild(this.gameOverContainer);

    const scrim = new Graphics();
    scrim.rect(0, 0, 1920, 1080).fill({ color: 0x0a0401, alpha: 0.78 });
    this.gameOverContainer.addChild(scrim);

    const card = new Graphics();
    card.roundRect(960 - 240, 540 - 180, 480, 360, 24).fill(0xffffff).stroke({ width: 4, color: 0xea580c });
    this.gameOverContainer.addChild(card);

    const goLabel = new Text({ text: 'GAME OVER', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 46, fontWeight: '900', fill: 0xba1a1a }) });
    goLabel.anchor.set(0.5); goLabel.x = 960; goLabel.y = 540 - 110;
    this.gameOverContainer.addChild(goLabel);

    this.finalScoreText = new Text({ text: 'Final Score: 0', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: '800', fill: 0x51606a }) });
    this.finalScoreText.anchor.set(0.5); this.finalScoreText.x = 960; this.finalScoreText.y = 540 - 45;
    this.gameOverContainer.addChild(this.finalScoreText);

    this.newBestLabel = new Text({ text: 'NEW HIGH SCORE!', style: new TextStyle({ fontFamily: 'Nunito, sans-serif', fontSize: 16, fontWeight: '800', fill: 0x22c55e }) });
    this.newBestLabel.anchor.set(0.5); this.newBestLabel.x = 960; this.newBestLabel.y = 540 - 10;
    this.newBestLabel.visible = false;
    this.gameOverContainer.addChild(this.newBestLabel);

    this.buildButton(960 - 110, 540 + 40, 'RESTART', 0xea580c, () => this.callbacks.onRestart());
    this.buildButton(960 + 110, 540 + 40, 'MENU', 0x51606a, () => this.callbacks.onExit());
  }

  private buildStrikesDisplay(): void {
    this.strikesContainer.removeChildren();
    this.strikeTexts = [];
    for (let i = 0; i < this.maxStrikes; i++) {
      const isHit = i < this.strikes;
      const xText = new Text({
        text: 'X',
        style: new TextStyle({
          fontFamily: 'Nunito, sans-serif',
          fontSize: 48,
          fontWeight: '900',
          fill: isHit ? 0xef4444 : 0x475569,
          stroke: { color: isHit ? 0xffffff : 0x1f2937, width: isHit ? 2 : 1 },
          dropShadow: isHit ? { alpha: 0.6, blur: 8, distance: 3 } : undefined
        })
      });
      xText.anchor.set(0.5);
      xText.x = i * 46; xText.y = 20;
      xText.alpha = isHit ? 1.0 : 0.45;
      this.strikeTexts.push(xText);
      this.strikesContainer.addChild(xText);
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

  public addStrike(): number {
    this.strikes = Math.min(this.maxStrikes, this.strikes + 1);
    this.buildStrikesDisplay();

    const activeText = this.strikeTexts[this.strikes - 1];
    if (activeText) {
      activeText.scale.set(1.4);
      setTimeout(() => { if (activeText) activeText.scale.set(1.0); }, 150);
    }
    if (this.strikes >= this.maxStrikes) this.showGameOver();
    return this.strikes;
  }

  public getStrikes(): number { return this.strikes; }

  public showCombo(comboCount: number): void {
    this.comboBanner.text = `COMBO x${comboCount}!`;
    this.comboBanner.alpha = 1;
    this.comboBanner.scale.set(1.3);
    setTimeout(() => { this.comboBanner.scale.set(1.0); }, 120);
    setTimeout(() => { this.comboBanner.alpha = 0; }, 800);
  }

  public showGameOver(): void {
    this.finalScoreText.text = `Final Score: ${this.score}`;
    this.newBestLabel.visible = this.score > 0 && this.score >= this.bestScore;
    this.gameOverContainer.visible = true;
  }

  public reset(): void {
    this.score = 0;
    this.strikes = 0;
    this.scoreText.text = '0';
    this.buildStrikesDisplay();
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
}
