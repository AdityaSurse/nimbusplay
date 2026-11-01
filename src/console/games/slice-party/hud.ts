/**
 * NimbusPlay — Slice Party HUD & Game Over Overlay
 * Score display, high score persistence, 3 lives indicator, and combo celebration.
 * Strictly typed with zero `any`.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

const HIGHSCORE_KEY = 'nimbusplay_sliceparty_highscore';

export interface HudCallbacks {
  onRestart: () => void;
  onExit: () => void;
}

export class SlicePartyHUD {
  public container: Container = new Container();
  private scoreText: Text;
  private bestText: Text;
  private livesContainer: Container = new Container();
  private comboText: Text;
  private gameOverContainer: Container = new Container();
  private finalScoreText: Text;
  private newBestLabel: Text;

  private score = 0;
  private bestScore = 0;
  private lives = 3;
  private callbacks: HudCallbacks;

  constructor(callbacks: HudCallbacks) {
    this.callbacks = callbacks;
    this.bestScore = this.loadHighScore();

    // 1. Score display (Top Left)
    const titleStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 16,
      fontWeight: '800',
      fill: 0x38bdf8,
      letterSpacing: 2
    });
    const title = new Text({ text: 'SLICE PARTY', style: titleStyle });
    title.x = 48;
    title.y = 36;
    this.container.addChild(title);

    const scoreStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 54,
      fontWeight: '900',
      fill: 0xffffff,
      dropShadow: { alpha: 0.4, blur: 6, distance: 3 }
    });
    this.scoreText = new Text({ text: '0', style: scoreStyle });
    this.scoreText.x = 48;
    this.scoreText.y = 56;
    this.container.addChild(this.scoreText);

    const bestStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 14,
      fontWeight: '700',
      fill: 0x94a3b8,
      letterSpacing: 1
    });
    this.bestText = new Text({ text: `BEST: ${this.bestScore}`, style: bestStyle });
    this.bestText.x = 50;
    this.bestText.y = 120;
    this.container.addChild(this.bestText);

    // 2. 3 Lives display (Top Right)
    this.livesContainer.x = 1920 - 180;
    this.livesContainer.y = 48;
    this.container.addChild(this.livesContainer);
    this.renderLives();

    // 3. Combo celebration banner (Top Center)
    const comboStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 38,
      fontWeight: '900',
      fill: 0xffd32a,
      stroke: { color: 0x111d28, width: 6 },
      dropShadow: { alpha: 0.6, blur: 8, distance: 4 }
    });
    this.comboText = new Text({ text: '', style: comboStyle });
    this.comboText.anchor.set(0.5);
    this.comboText.x = 960;
    this.comboText.y = 80;
    this.comboText.alpha = 0;
    this.container.addChild(this.comboText);

    // 4. Game Over Dialog Overlay
    this.gameOverContainer.visible = false;
    this.container.addChild(this.gameOverContainer);

    const scrim = new Graphics();
    scrim.rect(0, 0, 1920, 1080).fill({ color: 0x0b1329, alpha: 0.75 });
    this.gameOverContainer.addChild(scrim);

    const card = new Graphics();
    card.roundRect(960 - 240, 540 - 180, 480, 360, 24)
      .fill(0xffffff)
      .stroke({ width: 4, color: 0x3cb4e7 });
    this.gameOverContainer.addChild(card);

    const goStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 44,
      fontWeight: '900',
      fill: 0xba1a1a
    });
    const goLabel = new Text({ text: 'GAME OVER', style: goStyle });
    goLabel.anchor.set(0.5);
    goLabel.x = 960;
    goLabel.y = 540 - 110;
    this.gameOverContainer.addChild(goLabel);

    const finalStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 22,
      fontWeight: '800',
      fill: 0x51606a
    });
    this.finalScoreText = new Text({ text: 'Final Score: 0', style: finalStyle });
    this.finalScoreText.anchor.set(0.5);
    this.finalScoreText.x = 960;
    this.finalScoreText.y = 540 - 45;
    this.gameOverContainer.addChild(this.finalScoreText);

    const newBestStyle = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: 16,
      fontWeight: '800',
      fill: 0x22c55e
    });
    this.newBestLabel = new Text({ text: 'NEW HIGH SCORE!', style: newBestStyle });
    this.newBestLabel.anchor.set(0.5);
    this.newBestLabel.x = 960;
    this.newBestLabel.y = 540 - 15;
    this.newBestLabel.visible = false;
    this.gameOverContainer.addChild(this.newBestLabel);

    this.createGameOverButtons();
  }

  public addScore(points: number): void {
    this.score += points;
    this.scoreText.text = this.score.toString();

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.bestText.text = `BEST: ${this.bestScore}`;
      this.saveHighScore(this.bestScore);
    }
  }

  public getScore(): number {
    return this.score;
  }

  public showCombo(comboCount: number): void {
    this.comboText.text = `${comboCount}x COMBO!`;
    this.comboText.alpha = 1.0;
    this.comboText.scale.set(1.2);

    let life = 0;
    const interval = setInterval(() => {
      life += 0.03;
      this.comboText.scale.set(1.2 - life * 0.2);
      this.comboText.alpha = Math.max(0, 1.0 - life);
      if (life >= 1.0) {
        clearInterval(interval);
        this.comboText.text = '';
      }
    }, 30);
  }

  public loseLife(): number {
    this.lives = Math.max(0, this.lives - 1);
    this.renderLives();
    if (this.lives <= 0) {
      this.showGameOver();
    }
    return this.lives;
  }

  public getLives(): number {
    return this.lives;
  }

  public reset(): void {
    this.score = 0;
    this.lives = 3;
    this.scoreText.text = '0';
    this.bestText.text = `BEST: ${this.bestScore}`;
    this.renderLives();
    this.gameOverContainer.visible = false;
    this.newBestLabel.visible = false;
  }

  private showGameOver(): void {
    this.gameOverContainer.visible = true;
    this.finalScoreText.text = `Final Score: ${this.score}`;
    if (this.score >= this.bestScore && this.score > 0) {
      this.newBestLabel.visible = true;
    }
  }

  private renderLives(): void {
    this.livesContainer.removeChildren();

    for (let i = 0; i < 3; i++) {
      const g = new Graphics();
      const isActive = i < this.lives;
      const x = i * 44;

      if (isActive) {
        // Red heart
        g.circle(x, 0, 14).fill(0xff3b56);
        g.poly([x - 14, 0, x + 14, 0, x, 18]).fill(0xff3b56);
      } else {
        // Grayed out dead heart with cross
        g.circle(x, 0, 14).fill(0xbdc8d0);
        g.poly([x - 14, 0, x + 14, 0, x, 18]).fill(0xbdc8d0);
        g.moveTo(x - 8, -8).lineTo(x + 8, 8).stroke({ width: 3, color: 0x51606a });
        g.moveTo(x + 8, -8).lineTo(x - 8, 8).stroke({ width: 3, color: 0x51606a });
      }
      this.livesContainer.addChild(g);
    }
  }

  private createGameOverButtons(): void {
    // Play Again button
    const btnPlay = new Graphics();
    btnPlay.roundRect(960 - 180, 540 + 30, 160, 52, 26).fill(0x006688);
    btnPlay.eventMode = 'static';
    btnPlay.cursor = 'pointer';
    btnPlay.on('pointerdown', () => this.callbacks.onRestart());

    const playLabel = new Text({
      text: 'Retry',
      style: new TextStyle({ fontFamily: 'Nunito', fontSize: 18, fontWeight: '800', fill: 0xffffff })
    });
    playLabel.anchor.set(0.5);
    playLabel.x = 960 - 100;
    playLabel.y = 540 + 56;

    // Menu button
    const btnMenu = new Graphics();
    btnMenu.roundRect(960 + 20, 540 + 30, 160, 52, 26).fill(0xdde9f9);
    btnMenu.eventMode = 'static';
    btnMenu.cursor = 'pointer';
    btnMenu.on('pointerdown', () => this.callbacks.onExit());

    const menuLabel = new Text({
      text: 'Menu',
      style: new TextStyle({ fontFamily: 'Nunito', fontSize: 18, fontWeight: '800', fill: 0x111d28 })
    });
    menuLabel.anchor.set(0.5);
    menuLabel.x = 960 + 100;
    menuLabel.y = 540 + 56;

    this.gameOverContainer.addChild(btnPlay, playLabel, btnMenu, menuLabel);
  }

  private loadHighScore(): number {
    if (typeof localStorage === 'undefined') return 0;
    try {
      const val = localStorage.getItem(HIGHSCORE_KEY);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  private saveHighScore(score: number): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(HIGHSCORE_KEY, score.toString());
    } catch {
      // ignore
    }
  }
}

