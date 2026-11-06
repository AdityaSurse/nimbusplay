/**
 * NimbusPlay — Turbo Circuit 3D Particle Subsystem
 * High-performance pooled particle effects: tire smoke, drift sparks,
 * skid marks, boost flames, and coin collection sparkles.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import {
  Group,
  Mesh,
  SphereGeometry,
  PlaneGeometry,
  MeshBasicMaterial,
  AdditiveBlending,
  Vector3
} from 'three';
import type { DriftTier } from './types.js';

interface Particle {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  maxLife: number;
  scaleGrowth: number;
  active: boolean;
}

interface SkidSegment {
  mesh: Mesh;
  opacity: number;
  active: boolean;
}

export class TurboParticleSystem {
  public readonly group = new Group();

  private readonly smokePool: Particle[] = [];
  private readonly sparkPool: Particle[] = [];
  private readonly coinSparklePool: Particle[] = [];
  private readonly skidPool: SkidSegment[] = [];

  private readonly smokeGeo = new SphereGeometry(0.35, 6, 5);
  private readonly sparkGeo = new SphereGeometry(0.12, 4, 4);
  private readonly sparkleGeo = new SphereGeometry(0.18, 5, 5);
  private readonly skidGeo = new PlaneGeometry(0.5, 1.2);

  private particleCountScale = 1.0;

  constructor() {
    this.skidGeo.rotateX(-Math.PI / 2);
    this.initPools();
  }

  public setQualityScale(scale: number): void {
    this.particleCountScale = Math.max(0.3, Math.min(1.0, scale));
  }

  private initPools(): void {
    // 1. Tire Smoke (40 particles)
    for (let i = 0; i < 40; i++) {
      const mat = new MeshBasicMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.6,
        depthWrite: false
      });
      const mesh = new Mesh(this.smokeGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.smokePool.push({
        mesh,
        velocity: new Vector3(),
        life: 0,
        maxLife: 1.0,
        scaleGrowth: 2.5,
        active: false
      });
    }

    // 2. Drift Sparks (50 particles)
    for (let i = 0; i < 50; i++) {
      const mat = new MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.9,
        blending: AdditiveBlending,
        depthWrite: false
      });
      const mesh = new Mesh(this.sparkGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.sparkPool.push({
        mesh,
        velocity: new Vector3(),
        life: 0,
        maxLife: 0.45,
        scaleGrowth: -0.5,
        active: false
      });
    }

    // 3. Coin Sparkles (30 particles)
    for (let i = 0; i < 30; i++) {
      const mat = new MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 1.0,
        blending: AdditiveBlending,
        depthWrite: false
      });
      const mesh = new Mesh(this.sparkleGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.coinSparklePool.push({
        mesh,
        velocity: new Vector3(),
        life: 0,
        maxLife: 0.6,
        scaleGrowth: -0.8,
        active: false
      });
    }

    // 4. Skid Marks (30 planar segments)
    for (let i = 0; i < 30; i++) {
      const mat = new MeshBasicMaterial({
        color: 0x09090b,
        transparent: true,
        opacity: 0.5,
        depthWrite: false
      });
      const mesh = new Mesh(this.skidGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.skidPool.push({ mesh, opacity: 0.5, active: false });
    }
  }

  public emitSmoke(pos: Vector3, count = 2): void {
    const actual = Math.ceil(count * this.particleCountScale);
    for (let i = 0; i < actual; i++) {
      const p = this.smokePool.find((item) => !item.active);
      if (!p) break;
      p.active = true;
      p.life = 0;
      p.maxLife = 0.5 + Math.random() * 0.3;
      p.mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.8,
        pos.y + 0.2 + Math.random() * 0.2,
        pos.z + (Math.random() - 0.5) * 0.8
      );
      p.velocity.set(
        (Math.random() - 0.5) * 1.5,
        1.2 + Math.random() * 1.5,
        (Math.random() - 0.5) * 1.5
      );
      p.mesh.scale.setScalar(0.4);
      (p.mesh.material as MeshBasicMaterial).opacity = 0.45;
      p.mesh.visible = true;
    }
  }

  public emitDriftSparks(pos: Vector3, tier: DriftTier, count = 3): void {
    if (tier === 'none') return;
    const colorHex = tier === 'purple' ? 0xc084fc : tier === 'orange' ? 0xf97316 : 0x38bdf8;
    const actual = Math.ceil(count * this.particleCountScale);

    for (let i = 0; i < actual; i++) {
      const p = this.sparkPool.find((item) => !item.active);
      if (!p) break;
      p.active = true;
      p.life = 0;
      p.maxLife = 0.35 + Math.random() * 0.2;
      p.mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.5,
        pos.y + 0.25,
        pos.z + (Math.random() - 0.5) * 0.5
      );
      p.velocity.set(
        (Math.random() - 0.5) * 5.0,
        2.0 + Math.random() * 4.0,
        (Math.random() - 0.5) * 5.0
      );
      (p.mesh.material as MeshBasicMaterial).color.setHex(colorHex);
      (p.mesh.material as MeshBasicMaterial).opacity = 0.95;
      p.mesh.scale.setScalar(0.6 + Math.random() * 0.4);
      p.mesh.visible = true;
    }
  }

  public emitBoostFlame(pos: Vector3, heading: number, count = 2): void {
    const actual = Math.ceil(count * this.particleCountScale);
    for (let i = 0; i < actual; i++) {
      const p = this.sparkPool.find((item) => !item.active);
      if (!p) break;
      p.active = true;
      p.life = 0;
      p.maxLife = 0.25 + Math.random() * 0.15;
      const backX = pos.x - Math.sin(heading) * 1.5 + (Math.random() - 0.5) * 0.4;
      const backZ = pos.z - Math.cos(heading) * 1.5 + (Math.random() - 0.5) * 0.4;
      p.mesh.position.set(backX, pos.y + 0.35, backZ);
      (p.mesh.material as MeshBasicMaterial).color.setHex(Math.random() > 0.5 ? 0xf97316 : 0xfacc15);
      p.velocity.set(-Math.sin(heading) * 12 + (Math.random() - 0.5) * 2, 0.5, -Math.cos(heading) * 12 + (Math.random() - 0.5) * 2);
      p.mesh.scale.setScalar(1.2);
      (p.mesh.material as MeshBasicMaterial).opacity = 1.0;
      p.mesh.visible = true;
    }
  }

  public emitCoinSparkles(pos: Vector3, count = 10): void {
    const actual = Math.ceil(count * this.particleCountScale);
    for (let i = 0; i < actual; i++) {
      const p = this.coinSparklePool.find((item) => !item.active);
      if (!p) break;
      p.active = true;
      p.life = 0;
      p.maxLife = 0.5 + Math.random() * 0.25;
      p.mesh.position.copy(pos);
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.0 + Math.random() * 4.0;
      p.velocity.set(Math.cos(angle) * speed, 2.5 + Math.random() * 4.0, Math.sin(angle) * speed);
      (p.mesh.material as MeshBasicMaterial).opacity = 1.0;
      p.mesh.scale.setScalar(0.8);
      p.mesh.visible = true;
    }
  }

  public addSkidMark(pos: Vector3, heading: number): void {
    const s = this.skidPool.find((item) => !item.active) || this.skidPool[0];
    s.active = true;
    s.opacity = 0.55;
    s.mesh.position.set(pos.x, pos.y + 0.08, pos.z);
    s.mesh.rotation.y = heading;
    (s.mesh.material as MeshBasicMaterial).opacity = s.opacity;
    s.mesh.visible = true;
  }

  public update(dt: number): void {
    // 1. Update Smoke
    for (const p of this.smokePool) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.mesh.position.addScaledVector(p.velocity, dt);
      const progress = p.life / p.maxLife;
      const scale = 0.4 + progress * p.scaleGrowth;
      p.mesh.scale.setScalar(scale);
      (p.mesh.material as MeshBasicMaterial).opacity = (1 - progress) * 0.45;
    }

    // 2. Update Sparks
    for (const p of this.sparkPool) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.velocity.y -= 12.0 * dt; // gravity
      p.mesh.position.addScaledVector(p.velocity, dt);
      const progress = p.life / p.maxLife;
      (p.mesh.material as MeshBasicMaterial).opacity = (1 - progress) * 0.95;
    }

    // 3. Update Coin Sparkles
    for (const p of this.coinSparklePool) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.velocity.y -= 9.8 * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      const progress = p.life / p.maxLife;
      (p.mesh.material as MeshBasicMaterial).opacity = 1 - progress;
      p.mesh.scale.setScalar((1 - progress * 0.5) * 0.8);
    }

    // 4. Fade Skid Marks
    for (const s of this.skidPool) {
      if (!s.active) continue;
      s.opacity -= dt * 0.06;
      if (s.opacity <= 0.05) {
        s.active = false;
        s.mesh.visible = false;
      } else {
        (s.mesh.material as MeshBasicMaterial).opacity = s.opacity;
      }
    }
  }

  public destroy(): void {
    this.group.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}
