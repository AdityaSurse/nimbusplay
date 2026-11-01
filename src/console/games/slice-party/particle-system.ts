/**
 * NimbusPlay — Slice Party Particle System
 * Emits radial juice splashes, bomb explosion sparks, and animated floating score texts.
 * Strictly typed with zero `any`.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

interface JuiceDroplet {
  g: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingScore {
  text: Text;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  life: number;
}

export class ParticleSystem {
  private container: Container = new Container();
  private droplets: JuiceDroplet[] = [];
  private scorePopups: FloatingScore[] = [];

  public getDisplayObject(): Container {
    return this.container;
  }

  public emitJuiceSplash(x: number, y: number, color: number, count = 20): void {
    for (let i = 0; i < count; i++) {
      const g = new Graphics();
      const r = 2.5 + Math.random() * 4;
      g.circle(0, 0, r).fill(color);

      const angle = Math.random() * Math.PI * 2;
      const speed = 180 + Math.random() * 480;

      const drop: JuiceDroplet = {
        g,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120, // Initial upward burst
        radius: r,
        alpha: 1.0,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.45
      };

      g.x = x;
      g.y = y;
      this.container.addChild(g);
      this.droplets.push(drop);
    }
  }

  public emitBombExplosion(x: number, y: number): void {
    // 1. Fiery explosion sparks
    for (let i = 0; i < 40; i++) {
      const g = new Graphics();
      const isFire = Math.random() > 0.4;
      const color = isFire ? (Math.random() > 0.5 ? 0xff4757 : 0xffa502) : 0xffffff;
      const r = 3 + Math.random() * 7;
      g.circle(0, 0, r).fill(color);

      const angle = Math.random() * Math.PI * 2;
      const speed = 250 + Math.random() * 750;

      const spark: JuiceDroplet = {
        g,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: r,
        alpha: 1.0,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.5
      };

      g.x = x;
      g.y = y;
      this.container.addChild(g);
      this.droplets.push(spark);
    }

    // 2. Shockwave ring
    const ring = new Graphics();
    ring.circle(0, 0, 10).stroke({ width: 6, color: 0xffffff, alpha: 0.9 });
    ring.x = x;
    ring.y = y;
    this.container.addChild(ring);

    let ringLife = 0;
    const ringMax = 0.4;
    const ringInterval = setInterval(() => {
      ringLife += 0.016;
      const p = ringLife / ringMax;
      ring.scale.set(1 + p * 14);
      ring.alpha = 1 - p;
      if (ringLife >= ringMax) {
        clearInterval(ringInterval);
        this.container.removeChild(ring);
        ring.destroy();
      }
    }, 16);
  }

  public emitScorePopup(x: number, y: number, textStr: string, isCombo = false): void {
    const style = new TextStyle({
      fontFamily: 'Nunito, sans-serif',
      fontSize: isCombo ? 36 : 28,
      fontWeight: '900',
      fill: isCombo ? 0xffd32a : 0xffffff,
      stroke: { color: 0x111d28, width: 5 },
      dropShadow: {
        alpha: 0.6,
        angle: Math.PI / 6,
        blur: 4,
        distance: 4
      }
    });

    const label = new Text({ text: textStr, style });
    label.anchor.set(0.5);
    label.x = x;
    label.y = y;

    this.container.addChild(label);
    this.scorePopups.push({
      text: label,
      x,
      y,
      vy: -160,
      alpha: 1.0,
      life: 0
    });
  }

  public update(dt: number): void {
    const gravity = 820; // px/s^2

    // Update droplets
    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const d = this.droplets[i];
      d.life += dt;
      if (d.life >= d.maxLife) {
        this.container.removeChild(d.g);
        d.g.destroy();
        this.droplets.splice(i, 1);
        continue;
      }

      d.vy += gravity * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.alpha = Math.max(0, 1.0 - d.life / d.maxLife);

      d.g.x = d.x;
      d.g.y = d.y;
      d.g.alpha = d.alpha;
    }

    // Update score popups
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const s = this.scorePopups[i];
      s.life += dt;
      if (s.life >= 0.9) {
        this.container.removeChild(s.text);
        s.text.destroy();
        this.scorePopups.splice(i, 1);
        continue;
      }

      s.y += s.vy * dt;
      s.vy *= 0.92;
      s.alpha = Math.max(0, 1.0 - s.life / 0.9);

      s.text.y = s.y;
      s.text.alpha = s.alpha;
    }
  }

  public clear(): void {
    for (const d of this.droplets) {
      this.container.removeChild(d.g);
      d.g.destroy();
    }
    this.droplets = [];

    for (const s of this.scorePopups) {
      this.container.removeChild(s.text);
      s.text.destroy();
    }
    this.scorePopups = [];
  }
}

