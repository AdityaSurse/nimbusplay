/**
 * NimbusPlay — Pooled Particle & Floating FX System
 * High-performance explosion sparks, shockwaves, and floating score callouts.
 * Strictly typed with zero `any`.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

interface SparkParticle {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: number;
  alpha: number;
  decay: number;
}

interface ShockwaveRing {
  alive: boolean;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  color: number;
  alpha: number;
}

interface FloatingText {
  alive: boolean;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  age: number;
  pixiText: Text;
}

export class StarParticles {
  public container = new Container();
  private g = new Graphics();
  private textContainer = new Container();

  private sparks: SparkParticle[] = [];
  private shockwaves: ShockwaveRing[] = [];
  private floatingTexts: FloatingText[] = [];

  constructor(maxSparks = 250, maxShockwaves = 16, maxTexts = 20) {
    this.container.addChild(this.g);
    this.container.addChild(this.textContainer);

    for (let i = 0; i < maxSparks; i++) {
      this.sparks.push({
        alive: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 2,
        color: 0xffffff,
        alpha: 1,
        decay: 1.5
      });
    }

    for (let i = 0; i < maxShockwaves; i++) {
      this.shockwaves.push({
        alive: false,
        x: 0,
        y: 0,
        radius: 0,
        maxRadius: 100,
        speed: 300,
        color: 0x00f0ff,
        alpha: 1
      });
    }

    const textStyle = new TextStyle({
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 22,
      fontWeight: '800',
      fill: '#ffffff',
      stroke: { color: '#090e1a', width: 4 }
    });

    for (let i = 0; i < maxTexts; i++) {
      const pixiText = new Text({ text: '', style: textStyle });
      pixiText.visible = false;
      this.textContainer.addChild(pixiText);
      this.floatingTexts.push({
        alive: false,
        x: 0,
        y: 0,
        text: '',
        color: '#ffffff',
        alpha: 1,
        age: 0,
        pixiText
      });
    }
  }

  public emitExplosion(x: number, y: number, color = 0xf59e0b, count = 24, speedMax = 320): void {
    let emitted = 0;
    for (let i = 0; i < this.sparks.length && emitted < count; i++) {
      const p = this.sparks[i];
      if (!p.alive) {
        p.alive = true;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * speedMax;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.radius = 2 + Math.random() * 3.5;
        p.color = Math.random() > 0.4 ? color : 0xffffff;
        p.alpha = 1.0;
        p.decay = 1.6 + Math.random() * 1.4;
        emitted++;
      }
    }
  }

  public emitShockwave(x: number, y: number, maxRadius = 120, color = 0x00f0ff): void {
    for (let i = 0; i < this.shockwaves.length; i++) {
      const sw = this.shockwaves[i];
      if (!sw.alive) {
        sw.alive = true;
        sw.x = x;
        sw.y = y;
        sw.radius = 8;
        sw.maxRadius = maxRadius;
        sw.speed = maxRadius * 3.2;
        sw.color = color;
        sw.alpha = 0.9;
        break;
      }
    }
  }

  public emitFloatingText(x: number, y: number, text: string, color = '#38bdf8'): void {
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (!ft.alive) {
        ft.alive = true;
        ft.x = x;
        ft.y = y;
        ft.text = text;
        ft.color = color;
        ft.alpha = 1.0;
        ft.age = 0;
        ft.pixiText.text = text;
        ft.pixiText.style.fill = color;
        ft.pixiText.position.set(x, y);
        ft.pixiText.alpha = 1.0;
        ft.pixiText.visible = true;
        break;
      }
    }
  }

  public update(dt: number): void {
    this.g.clear();

    // 1. Update Sparks
    for (let i = 0; i < this.sparks.length; i++) {
      const p = this.sparks[i];
      if (p.alive) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.alpha -= p.decay * dt;

        if (p.alpha <= 0) {
          p.alive = false;
        } else {
          this.g.circle(p.x, p.y, p.radius).fill({ color: p.color, alpha: p.alpha });
        }
      }
    }

    // 2. Update Shockwaves
    for (let i = 0; i < this.shockwaves.length; i++) {
      const sw = this.shockwaves[i];
      if (sw.alive) {
        sw.radius += sw.speed * dt;
        sw.alpha = Math.max(0, 1.0 - sw.radius / sw.maxRadius);

        if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
          sw.alive = false;
        } else {
          this.g.circle(sw.x, sw.y, sw.radius)
            .stroke({ width: 3 * sw.alpha, color: sw.color, alpha: sw.alpha });
        }
      }
    }

    // 3. Update Floating Texts
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (ft.alive) {
        ft.age += dt;
        ft.y -= 45 * dt;
        ft.alpha = Math.max(0, 1.0 - ft.age / 0.85);

        ft.pixiText.position.set(ft.x - ft.pixiText.width / 2, ft.y);
        ft.pixiText.alpha = ft.alpha;

        if (ft.alpha <= 0) {
          ft.alive = false;
          ft.pixiText.visible = false;
        }
      }
    }
  }

  public clearAll(): void {
    for (let i = 0; i < this.sparks.length; i++) this.sparks[i].alive = false;
    for (let i = 0; i < this.shockwaves.length; i++) this.shockwaves[i].alive = false;
    for (let i = 0; i < this.floatingTexts.length; i++) {
      this.floatingTexts[i].alive = false;
      this.floatingTexts[i].pixiText.visible = false;
    }
    this.g.clear();
  }
}
