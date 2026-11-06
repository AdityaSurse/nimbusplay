/**
 * NimbusPlay — Turbo Circuit Procedural Low-Poly Kart & Driver Model
 * Original racer "Volt" with spinning wheels, steering, driver lean, glider wing, and drift sparks.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import {
  Group,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Mesh
} from 'three';
import type { DriftTier } from './types.js';

export class KartModel {
  public readonly group = new Group();

  private readonly frontLeftWheel = new Group();
  private readonly frontRightWheel = new Group();
  private readonly rearLeftWheel = new Group();
  private readonly rearRightWheel = new Group();

  private readonly frontLeftPivot = new Group();
  private readonly frontRightPivot = new Group();

  private readonly driverTorso = new Group();
  private readonly boostFlames: Mesh[] = [];
  private readonly gliderWing = new Group();
  private readonly sparkMeshes: Mesh[] = [];
  private sparkMaterial!: MeshBasicMaterial;

  constructor(primaryColor: number = 0xef4444, accentColor: number = 0x06b6d4) {
    this.buildChassis(primaryColor, accentColor);
    this.buildWheels();
    this.buildDriver(accentColor);
    this.buildExhausts();
    this.buildGliderWing();
    this.buildDriftSparks();
  }

  private buildChassis(primary: number, accent: number): void {
    const frameGeo = new BoxGeometry(2.0, 0.35, 3.8);
    const frame = new Mesh(frameGeo, new MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 }));
    frame.position.y = 0.45;
    frame.castShadow = true;
    this.group.add(frame);

    const bodyGeo = new BoxGeometry(1.6, 0.45, 2.6);
    const body = new Mesh(bodyGeo, new MeshStandardMaterial({ color: primary, roughness: 0.3, metalness: 0.2 }));
    body.position.set(0, 0.72, 0.1);
    body.castShadow = true;
    this.group.add(body);

    const noseGeo = new BoxGeometry(1.9, 0.18, 0.9);
    const nose = new Mesh(noseGeo, new MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }));
    nose.position.set(0, 0.38, 1.85);
    nose.castShadow = true;
    this.group.add(nose);

    const spoilerGeo = new BoxGeometry(2.1, 0.12, 0.55);
    const spoiler = new Mesh(spoilerGeo, new MeshStandardMaterial({ color: accent, metalness: 0.4 }));
    spoiler.position.set(0, 1.25, -1.6);
    spoiler.castShadow = true;
    this.group.add(spoiler);
  }

  private buildWheels(): void {
    const wheelGeo = new CylinderGeometry(0.44, 0.44, 0.38, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    const tireMat = new MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const rimMat = new MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });

    const createWheel = (): Group => {
      const g = new Group();
      const tire = new Mesh(wheelGeo, tireMat);
      tire.castShadow = true;
      const rim = new Mesh(new CylinderGeometry(0.25, 0.25, 0.4, 10), rimMat);
      rim.rotateZ(Math.PI / 2);
      g.add(tire, rim);
      return g;
    };

    const fl = createWheel(); fl.position.set(-1.05, 0.44, 1.2); this.frontLeftPivot.add(fl); this.frontLeftWheel.add(fl);
    const fr = createWheel(); fr.position.set(1.05, 0.44, 1.2); this.frontRightPivot.add(fr); this.frontRightWheel.add(fr);
    const rl = createWheel(); rl.position.set(-1.08, 0.46, -1.2); this.rearLeftWheel.add(rl);
    const rr = createWheel(); rr.position.set(1.08, 0.46, -1.2); this.rearRightWheel.add(rr);

    this.group.add(this.frontLeftPivot, this.frontRightPivot, this.rearLeftWheel, this.rearRightWheel);
  }

  private buildDriver(helmetColor: number): void {
    const seat = new Mesh(new BoxGeometry(0.9, 0.6, 0.8), new MeshStandardMaterial({ color: 0x09090b }));
    seat.position.set(0, 0.75, -0.3);
    this.group.add(seat);

    const torso = new Mesh(new BoxGeometry(0.8, 0.75, 0.55), new MeshStandardMaterial({ color: 0x1e293b }));
    torso.position.set(0, 1.15, -0.2);
    this.driverTorso.add(torso);

    const helmet = new Mesh(new SphereGeometry(0.38, 14, 12), new MeshStandardMaterial({ color: helmetColor, metalness: 0.5 }));
    helmet.position.set(0, 1.72, -0.15);
    this.driverTorso.add(helmet);

    const visor = new Mesh(new BoxGeometry(0.48, 0.18, 0.32), new MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9 }));
    visor.position.set(0, 1.72, 0.12);
    this.driverTorso.add(visor);
    this.group.add(this.driverTorso);
  }

  private buildExhausts(): void {
    const pipeGeo = new CylinderGeometry(0.12, 0.14, 0.55, 10);
    pipeGeo.rotateX(Math.PI / 2);
    const pipeMat = new MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
    const flameGeo = new CylinderGeometry(0.02, 0.22, 0.8, 8);
    flameGeo.rotateX(Math.PI / 2);
    const flameMat = new MeshBasicMaterial({ color: 0x38bdf8 });

    for (const side of [-0.4, 0.4]) {
      const pipe = new Mesh(pipeGeo, pipeMat);
      pipe.position.set(side, 0.65, -1.8);
      this.group.add(pipe);

      const flame = new Mesh(flameGeo, flameMat);
      flame.position.set(side, 0.65, -2.15);
      flame.visible = false;
      this.boostFlames.push(flame);
      this.group.add(flame);
    }
  }

  private buildGliderWing(): void {
    const wingGeo = new BoxGeometry(4.8, 0.08, 1.6);
    const wingMat = new MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.4 });
    const wing = new Mesh(wingGeo, wingMat);
    wing.position.set(0, 2.2, -0.2);
    this.gliderWing.add(wing);
    this.gliderWing.visible = false;
    this.group.add(this.gliderWing);
  }

  private buildDriftSparks(): void {
    const sparkGeo = new SphereGeometry(0.16, 6, 6);
    this.sparkMaterial = new MeshBasicMaterial({ color: 0x38bdf8 });
    for (const side of [-1.15, 1.15]) {
      const spark = new Mesh(sparkGeo, this.sparkMaterial);
      spark.position.set(side, 0.3, -1.2);
      spark.visible = false;
      this.sparkMeshes.push(spark);
      this.group.add(spark);
    }
  }

  public updateAnimation(speed: number, steerInput: number, isBoosting: boolean, driftTier: DriftTier, isGliding: boolean, dt: number): void {
    const spinAngle = (speed / 0.48) * dt;
    this.frontLeftWheel.rotation.x += spinAngle;
    this.frontRightWheel.rotation.x += spinAngle;
    this.rearLeftWheel.rotation.x += spinAngle;
    this.rearRightWheel.rotation.x += spinAngle;

    const targetPivot = -steerInput * 0.48;
    this.frontLeftPivot.rotation.y = targetPivot;
    this.frontRightPivot.rotation.y = targetPivot;

    const targetLean = steerInput * 0.28;
    this.driverTorso.rotation.z += (targetLean - this.driverTorso.rotation.z) * Math.min(1.0, dt * 10);

    // Boost flames
    for (const flame of this.boostFlames) {
      flame.visible = isBoosting;
      if (isBoosting) {
        flame.scale.set(1 + Math.random() * 0.3, 1 + Math.random() * 0.3, 1 + Math.random() * 0.4);
      }
    }

    // Glider wing deployment
    this.gliderWing.visible = isGliding;

    // Drift sparks
    const hasSparks = driftTier !== 'none';
    for (const spark of this.sparkMeshes) {
      spark.visible = hasSparks;
      if (hasSparks) {
        const color = driftTier === 'purple' ? 0xc084fc : driftTier === 'orange' ? 0xfb923c : 0x38bdf8;
        this.sparkMaterial.color.setHex(color);
        spark.position.y = 0.25 + Math.random() * 0.2;
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
