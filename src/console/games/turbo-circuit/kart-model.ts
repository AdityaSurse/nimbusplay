/**
 * NimbusPlay — Turbo Circuit Procedural Low-Poly Kart & Driver Model
 * Original racer "Volt" with spinning wheels, steering animation, and body lean.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import {
  Group,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  Mesh
} from 'three';

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

  constructor() {
    this.buildChassis();
    this.buildWheels();
    this.buildDriver();
    this.buildExhausts();
  }

  private buildChassis(): void {
    // 1. Lower chassis frame
    const frameGeo = new BoxGeometry(2.0, 0.35, 3.8);
    const frameMat = new MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const frame = new Mesh(frameGeo, frameMat);
    frame.position.y = 0.45;
    frame.castShadow = true;
    this.group.add(frame);

    // 2. Aerodynamic wedge body (Crimson Red with Cyan Accent)
    const bodyGeo = new BoxGeometry(1.6, 0.45, 2.6);
    const bodyMat = new MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.2 });
    const body = new Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.72, 0.1);
    body.castShadow = true;
    this.group.add(body);

    // 3. Front Nose Splitter
    const noseGeo = new BoxGeometry(1.9, 0.18, 0.9);
    const noseMat = new MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const nose = new Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.38, 1.85);
    nose.castShadow = true;
    this.group.add(nose);

    // 4. Side pods with cyan radiator vents
    const podGeo = new BoxGeometry(0.35, 0.4, 1.8);
    const podMat = new MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });
    const leftPod = new Mesh(podGeo, podMat);
    leftPod.position.set(-0.95, 0.65, 0.0);
    this.group.add(leftPod);

    const rightPod = new Mesh(podGeo, podMat);
    rightPod.position.set(0.95, 0.65, 0.0);
    this.group.add(rightPod);

    // 5. Rear spoiler wing mounted on dual struts
    const strutGeo = new BoxGeometry(0.08, 0.7, 0.15);
    const strutMat = new MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });

    const leftStrut = new Mesh(strutGeo, strutMat);
    leftStrut.position.set(-0.65, 1.15, -1.6);
    this.group.add(leftStrut);

    const rightStrut = new Mesh(strutGeo, strutMat);
    rightStrut.position.set(0.65, 1.15, -1.6);
    this.group.add(rightStrut);

    const wingGeo = new BoxGeometry(2.3, 0.12, 0.55);
    const wingMat = new MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const wing = new Mesh(wingGeo, wingMat);
    wing.position.set(0, 1.5, -1.6);
    wing.castShadow = true;
    this.group.add(wing);
  }

  private buildWheels(): void {
    const tireGeo = new CylinderGeometry(0.48, 0.48, 0.42, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });

    const rimGeo = new CylinderGeometry(0.28, 0.28, 0.44, 8);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

    const createWheel = (group: Group) => {
      const tire = new Mesh(tireGeo, tireMat);
      tire.castShadow = true;
      group.add(tire);
      const rim = new Mesh(rimGeo, rimMat);
      group.add(rim);
    };

    // Front Wheels with steering pivots
    createWheel(this.frontLeftWheel);
    this.frontLeftWheel.position.set(-1.18, 0, 0);
    this.frontLeftPivot.position.set(0, 0.48, 1.3);
    this.frontLeftPivot.add(this.frontLeftWheel);
    this.group.add(this.frontLeftPivot);

    createWheel(this.frontRightWheel);
    this.frontRightWheel.position.set(1.18, 0, 0);
    this.frontRightPivot.position.set(0, 0.48, 1.3);
    this.frontRightPivot.add(this.frontRightWheel);
    this.group.add(this.frontRightPivot);

    // Rear Wheels
    createWheel(this.rearLeftWheel);
    this.rearLeftWheel.position.set(-1.22, 0.48, -1.25);
    this.group.add(this.rearLeftWheel);

    createWheel(this.rearRightWheel);
    this.rearRightWheel.position.set(1.22, 0.48, -1.25);
    this.group.add(this.rearRightWheel);
  }

  private buildDriver(): void {
    // Low-poly human racer "Volt"
    const suitMat = new MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const torsoGeo = new BoxGeometry(0.75, 0.85, 0.5);
    const torso = new Mesh(torsoGeo, suitMat);
    torso.position.set(0, 1.15, 0.1);
    torso.castShadow = true;
    this.driverTorso.add(torso);

    // Helmet
    const helmetGeo = new SphereGeometry(0.38, 12, 10);
    const helmetMat = new MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.3 });
    const helmet = new Mesh(helmetGeo, helmetMat);
    helmet.position.set(0, 1.8, 0.1);
    helmet.castShadow = true;
    this.driverTorso.add(helmet);

    // Visor
    const visorGeo = new BoxGeometry(0.48, 0.18, 0.25);
    const visorMat = new MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
    const visor = new Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.8, 0.36);
    this.driverTorso.add(visor);

    // Steering wheel
    const wheelGeo = new CylinderGeometry(0.24, 0.24, 0.06, 12);
    wheelGeo.rotateX(Math.PI / 3);
    const wheelMat = new MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
    const steerWheel = new Mesh(wheelGeo, wheelMat);
    steerWheel.position.set(0, 1.05, 0.65);
    this.driverTorso.add(steerWheel);

    this.group.add(this.driverTorso);
  }

  private buildExhausts(): void {
    const pipeGeo = new CylinderGeometry(0.12, 0.12, 0.5, 8);
    pipeGeo.rotateX(Math.PI / 2);
    const pipeMat = new MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });

    const flameGeo = new CylinderGeometry(0.01, 0.16, 0.65, 6);
    flameGeo.rotateX(Math.PI / 2);
    const flameMat = new MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.0
    });

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

  public updateAnimation(speed: number, steerInput: number, isBoosting: boolean, dt: number): void {
    // 1. Wheel spin rate proportional to linear speed
    const spinAngle = (speed / 0.48) * dt;
    this.frontLeftWheel.rotation.x += spinAngle;
    this.frontRightWheel.rotation.x += spinAngle;
    this.rearLeftWheel.rotation.x += spinAngle;
    this.rearRightWheel.rotation.x += spinAngle;

    // 2. Front wheel steering pivot angle
    const targetPivot = -steerInput * 0.48;
    this.frontLeftPivot.rotation.y = targetPivot;
    this.frontRightPivot.rotation.y = targetPivot;

    // 3. Driver lean into corner
    const targetLean = steerInput * 0.28;
    this.driverTorso.rotation.z += (targetLean - this.driverTorso.rotation.z) * Math.min(1.0, dt * 10);

    // 4. Boost flames flicker
    for (const flame of this.boostFlames) {
      flame.visible = isBoosting;
      if (isBoosting) {
        flame.scale.set(1 + Math.random() * 0.3, 1 + Math.random() * 0.3, 1 + Math.random() * 0.4);
      }
    }
  }

  public destroy(): void {
    this.group.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}

