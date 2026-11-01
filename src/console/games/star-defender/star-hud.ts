/**
 * NimbusPlay — Star Defender HUD & Game Over UI
 * High-performance HUD overlay for score, lives, wave banner, boss HP, and game over.
 * Strictly typed with zero `any`.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { ActivePowerUp } from './types.js';

const STORAGE_KEY_HIGHSCORE = 'nimbusplay_stardefender_highscore';

export class StarHud {
  public container = new Container();
  private g = new Graphics();
  private textContainer = new Container();

  private scoreText: Text;
  private highScoreText: Text;
  private waveBannerText: Text;
  private waveBannerSubText: Text;
  private bossTitleText: Text;

  private score = 0;
  private highScore = 0;
  private lives = 3;
  private waveBannerTimer = 0;
  private currentWave = 1;

  constructor() {
    this.container.addChild(this.g);
    this.container.addChild(this.textContainer);

    this.highScore = this.loadHighScore();

    const labelStyle = new TextStyle({
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 28,
      fontWeight: '900',
      fill: '#ffffff',
      letterSpacing: 2
    });

    const subStyle = new TextStyle({
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 16,
      fontWeight: '700',
      fill: '#38bdf8',
      letterSpacing: 1
    });

    this.scoreText = new Text({ text: 'SCORE: 0', style: labelStyle });
    this.scoreText.position.set(40, 36);

    this.highScoreText = new Text({ text: `BEST: ${this.highScore}`, style: subStyle });
    this.highScoreText.position.set(40, 72);

    this.bossTitleText = new Text({
      text: 'MOTHERSHIP DREADNOUGHT',
      style: new TextStyle({
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 16,
        fontWeight: '900',
        fill: '#f43f5e',
        letterSpacing: 3
      })
    });
    this.bossTitleText.visible = false;

    this.waveBannerText = new Text({
      text: 'SECTOR 01',
      style: new TextStyle({
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 54,
        fontWeight: '900',
        fill: '#ffffff',
        letterSpacing: 4,
        stroke: { color: '#0284c7', width: 6 }
      })
    });
    this.waveBannerText.visible = false;

    this.waveBannerSubText = new Text({
      text: 'INVASION VECTOR DETECTED',
      style: new TextStyle({
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 20,
        fontWeight: '800',
        fill: '#38bdf8',
        letterSpacing: 3
      })
    });
    this.waveBannerSubText.visible = false;

    this.textContainer.addChild(this.scoreText);
    this.textContainer.addChild(this.highScoreText);
    this.textContainer.addChild(this.bossTitleText);
    this.textContainer.addChild(this.waveBannerText);
    this.textContainer.addChild(this.waveBannerSubText);
  }

  public showWaveBanner(wave: number): void {
    this.currentWave = wave;
    this.waveBannerTimer = 2.4;
    const isBoss = wave % 5 === 0;
    this.waveBannerText.text = isBoss ? `BOSS SECTOR ${wave}` : `SECTOR 0${wave}`;
    this.waveBannerText.style.fill = isBoss ? '#f43f5e' : '#ffffff';
    this.waveBannerSubText.text = isBoss ? 'WARNING // FLAGSHIP ENGAGEMENT' : 'HOSTILE SAUCERS APPROACHING';
    this.waveBannerSubText.style.fill = isBoss ? '#fbbf24' : '#38bdf8';
    this.waveBannerText.visible = true;
    this.waveBannerSubText.visible = true;
  }

  public addScore(pts: number): void {
    this.score += pts;
    this.scoreText.text = `SCORE: ${this.score}`;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.highScoreText.text = `BEST: ${this.highScore}`;
      this.saveHighScore(this.highScore);
    }
  }

  public getScore(): number {
    return this.score;
  }

  public setLives(lives: number): void {
    this.lives = Math.max(0, lives);
  }

  public update(dt: number, bossActive: boolean, bossHpPct: number, buffs: ActivePowerUp[]): void {
    this.g.clear();

    // 1. Draw Player Hull / Lives (Top Right)
    const rightX = 1880;
    const topY = 46;
    for (let i = 0; i < 3; i++) {
      const x = rightX - i * 44;
      const filled = i < this.lives;
      this.g.poly([x - 14, topY - 14, x, topY - 20, x + 14, topY - 14, x + 12, topY + 4, x, topY + 16, x - 12, topY + 4])
        .fill(filled ? 0x0284c7 : 0x1e293b)
        .stroke({ width: 2, color: filled ? 0x38bdf8 : 0x475569 });
      if (filled) {
        this.g.circle(x, topY - 2, 4).fill(0xffffff);
      }
    }

    // 2. Boss Health Bar (Top Center)
    if (bossActive) {
      const barW = 540;
      const barH = 16;
      const barX = (1920 - barW) / 2;
      const barY = 42;

      this.bossTitleText.position.set(1920 / 2 - this.bossTitleText.width / 2, barY - 22);
      this.bossTitleText.visible = true;

      // Track background
      this.g.roundRect(barX, barY, barW, barH, 8).fill(0x0f172a).stroke({ width: 2, color: 0x475569 });
      // Fill bar
      const fillW = Math.max(0, (barW - 4) * bossHpPct);
      const fillColor = bossHpPct < 0.3 ? 0xef4444 : bossHpPct < 0.6 ? 0xf59e0b : 0x06b6d4;
      this.g.roundRect(barX + 2, barY + 2, fillW, barH - 4, 6).fill(fillColor);
    } else {
      this.bossTitleText.visible = false;
    }

    // 3. Power-Up Badges (Bottom Left)
    let badgeY = 1000;
    for (let i = 0; i < buffs.length; i++) {
      const b = buffs[i];
      const pct = Math.max(0, b.remainingMs / b.durationMs);
      const name = b.type === 'spread_shot' ? 'SPREAD' : b.type === 'shield' ? 'SHIELD' : 'SLOW-MO';
      const color = b.type === 'spread_shot' ? 0xef4444 : b.type === 'shield' ? 0x0284c7 : 0x7c3aed;

      this.g.roundRect(40, badgeY, 130, 24, 6).fill(0x0f172a).stroke({ width: 1.5, color });
      this.g.roundRect(42, badgeY + 2, 126 * pct, 20, 4).fill({ color, alpha: 0.6 });
      badgeY -= 32;
    }

    // 4. Wave Banner Animation
    if (this.waveBannerTimer > 0) {
      this.waveBannerTimer -= dt;
      const alpha = Math.min(1.0, this.waveBannerTimer / 0.5);
      this.waveBannerText.position.set(1920 / 2 - this.waveBannerText.width / 2, 420);
      this.waveBannerSubText.position.set(1920 / 2 - this.waveBannerSubText.width / 2, 490);
      this.waveBannerText.alpha = alpha;
      this.waveBannerSubText.alpha = alpha;

      if (this.waveBannerTimer <= 0) {
        this.waveBannerText.visible = false;
        this.waveBannerSubText.visible = false;
      }
    }
  }

  public checkGameOverAction(px: number, py: number, isClicked: boolean): 'retry' | 'menu' | null {
    const cardW = 600;
    const cardH = 380;
    const cardX = (1920 - cardW) / 2;
    const cardY = (1080 - cardH) / 2;
    const btnW = 220;
    const btnH = 54;
    const btnY = cardY + cardH - 85;

    const retryX = cardX + 55;
    const isOverRetry = px >= retryX && px <= retryX + btnW && py >= btnY && py <= btnY + btnH;

    const menuX = cardX + cardW - btnW - 55;
    const isOverMenu = px >= menuX && px <= menuX + btnW && py >= btnY && py <= btnY + btnH;

    this.renderGameOver(isOverRetry, isOverMenu);

    if (isClicked) {
      if (isOverRetry) return 'retry';
      if (isOverMenu) return 'menu';
    }
    return null;
  }

  public renderGameOver(isHoveringRetry: boolean, isHoveringMenu: boolean): void {
    // Backdrop overlay
    this.g.rect(0, 0, 1920, 1080).fill({ color: 0x050811, alpha: 0.85 });

    const cardW = 600;
    const cardH = 380;
    const cardX = (1920 - cardW) / 2;
    const cardY = (1080 - cardH) / 2;

    // Card pod
    this.g.roundRect(cardX, cardY, cardW, cardH, 24).fill(0x0f172a).stroke({ width: 3, color: 0x38bdf8 });

    // Buttons
    const btnW = 220;
    const btnH = 54;
    const btnY = cardY + cardH - 85;

    // Retry Button
    const retryX = cardX + 55;
    this.g.roundRect(retryX, btnY, btnW, btnH, 27)
      .fill(isHoveringRetry ? 0x0284c7 : 0x0369a1)
      .stroke({ width: 2, color: 0x38bdf8 });

    // Menu Button
    const menuX = cardX + cardW - btnW - 55;
    this.g.roundRect(menuX, btnY, btnW, btnH, 27)
      .fill(isHoveringMenu ? 0x334155 : 0x1e293b)
      .stroke({ width: 2, color: 0x64748b });
  }

  public reset(): void {
    this.score = 0;
    this.lives = 3;
    this.scoreText.text = 'SCORE: 0';
    this.waveBannerTimer = 0;
    this.waveBannerText.visible = false;
    this.waveBannerSubText.visible = false;
    this.bossTitleText.visible = false;
    this.g.clear();
  }

  private loadHighScore(): number {
    if (typeof localStorage === 'undefined') return 0;
    try {
      const val = localStorage.getItem(STORAGE_KEY_HIGHSCORE);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  private saveHighScore(score: number): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_HIGHSCORE, score.toString());
    } catch {
      // Ignore
    }
  }
}
