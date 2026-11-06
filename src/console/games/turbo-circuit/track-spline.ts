/**
 * NimbusPlay — Turbo Circuit Procedural Track & Spline Generator
 * Builds a closed 3D CatmullRom road with curbs, grass, checkpoints, glider ramp, and grid.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import {
  CatmullRomCurve3,
  Vector3,
  Group,
  BufferGeometry,
  Float32BufferAttribute,
  MeshStandardMaterial,
  Mesh,
  PlaneGeometry,
  BoxGeometry
} from 'three';
import type { TrackSample } from './types.js';

export class TrackSpline {
  public readonly curve: CatmullRomCurve3;
  public readonly roadWidth = 16.0;
  public readonly curbWidth = 1.6;
  public readonly trackGroup = new Group();
  public readonly totalLength: number;

  private readonly samplesCount = 200;
  private readonly cachedPoints: Vector3[] = [];
  private readonly cachedTangents: Vector3[] = [];
  private readonly cachedBinormals: Vector3[] = [];

  constructor() {
    const points: Vector3[] = [
      new Vector3(-50, 0, -80), // 0: Start / Finish line
      new Vector3(-50, 0, -20), // 1: Main straight
      new Vector3(-50, 0, 40),  // 2: Main straight
      new Vector3(-45, 0.5, 90),// 3: Turn 1 entry
      new Vector3(-15, 1.0, 120),// 4: Turn 1 apex
      new Vector3(30, 0.8, 110), // 5: Turn 1 exit
      new Vector3(60, 0.4, 70),  // 6: Back straight
      new Vector3(65, 0.2, 20),  // 7: Sweeping curve
      new Vector3(45, 0.5, -15), // 8: S-Chicane entry
      new Vector3(25, 0.8, -35), // 9: Chicane center
      new Vector3(40, 1.2, -65), // 10: Chicane exit
      new Vector3(70, 0.6, -95), // 11: Hairpin approach
      new Vector3(65, 0.2, -130),// 12: Hairpin apex
      new Vector3(20, 0.0, -140),// 13: Hairpin exit
      new Vector3(-25, 0.0, -135),// 14: Final turn approach
      new Vector3(-50, 0.0, -115) // 15: Final turn into straight
    ];

    this.curve = new CatmullRomCurve3(points, true, 'centripetal', 0.5);
    this.totalLength = this.curve.getLength();
    this.precomputeSplineData();
    this.buildRoadMesh();
    this.buildCurbs();
    this.buildGrassInfield();
    this.buildGliderRamp();
  }

  private precomputeSplineData(): void {
    const up = new Vector3(0, 1, 0);
    for (let i = 0; i < this.samplesCount; i++) {
      const t = i / this.samplesCount;
      const pt = this.curve.getPointAt(t);
      const tan = this.curve.getTangentAt(t).normalize();
      const binormal = new Vector3().crossVectors(tan, up).normalize();

      this.cachedPoints.push(pt);
      this.cachedTangents.push(tan);
      this.cachedBinormals.push(binormal);
    }
  }

  private buildRoadMesh(): void {
    const positions: number[] = [];
    const colors: number[] = [];
    const halfW = this.roadWidth * 0.5;

    for (let i = 0; i <= this.samplesCount; i++) {
      const idx = i % this.samplesCount;
      const pt = this.cachedPoints[idx];
      const binormal = this.cachedBinormals[idx];
      const left = pt.clone().addScaledVector(binormal, -halfW);
      const right = pt.clone().addScaledVector(binormal, halfW);

      positions.push(left.x, left.y + 0.05, left.z, right.x, right.y + 0.05, right.z);
      const c = (i % 6) < 3 ? 0.20 : 0.16;
      colors.push(c, c, c + 0.02, c, c, c + 0.02);
    }

    const indices: number[] = [];
    for (let i = 0; i < this.samplesCount; i++) {
      const i0 = i * 2;
      indices.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2);
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const roadMesh = new Mesh(geo, new MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
    roadMesh.receiveShadow = true;
    this.trackGroup.add(roadMesh);
  }

  private buildCurbs(): void {
    const positions: number[] = [];
    const colors: number[] = [];
    const halfW = this.roadWidth * 0.5;

    for (let i = 0; i <= this.samplesCount; i++) {
      const idx = i % this.samplesCount;
      const pt = this.cachedPoints[idx];
      const bin = this.cachedBinormals[idx];
      const lOut = pt.clone().addScaledVector(bin, -(halfW + this.curbWidth));
      const lIn = pt.clone().addScaledVector(bin, -halfW);
      const rIn = pt.clone().addScaledVector(bin, halfW);
      const rOut = pt.clone().addScaledVector(bin, halfW + this.curbWidth);

      positions.push(lOut.x, lOut.y + 0.12, lOut.z, lIn.x, lIn.y + 0.06, lIn.z);
      positions.push(rIn.x, rIn.y + 0.06, rIn.z, rOut.x, rOut.y + 0.12, rOut.z);

      const isBlue = Math.floor(i / 3) % 2 === 0;
      const r = isBlue ? 0.11 : 0.96;
      const g = isBlue ? 0.32 : 0.96;
      const b = isBlue ? 0.88 : 0.98;
      colors.push(r, g, b, r, g, b, r, g, b, r, g, b);
    }

    const indices: number[] = [];
    for (let i = 0; i < this.samplesCount; i++) {
      const b = i * 4;
      indices.push(b, b + 1, b + 4, b + 1, b + 5, b + 4);
      indices.push(b + 2, b + 3, b + 6, b + 3, b + 7, b + 6);
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const curbMesh = new Mesh(geo, new MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }));
    curbMesh.receiveShadow = true;
    this.trackGroup.add(curbMesh);
  }

  private buildGrassInfield(): void {
    const geo = new PlaneGeometry(450, 450, 16, 16);
    geo.rotateX(-Math.PI / 2);
    const grass = new Mesh(geo, new MeshStandardMaterial({ color: 0x22c55e, roughness: 0.92 }));
    grass.position.y = -0.05;
    grass.receiveShadow = true;
    this.trackGroup.add(grass);
  }

  private buildGliderRamp(): void {
    // Ramp located on back-straight approach (t approx 0.38)
    const rampIdx = Math.floor(this.samplesCount * 0.38);
    const pt = this.cachedPoints[rampIdx];
    const tan = this.cachedTangents[rampIdx];
    const angle = Math.atan2(tan.x, tan.z);

    const rampGeo = new BoxGeometry(this.roadWidth * 0.8, 1.2, 5.0);
    const rampMat = new MeshStandardMaterial({ color: 0x0284c7, metalness: 0.3, roughness: 0.4 });
    const rampMesh = new Mesh(rampGeo, rampMat);
    rampMesh.position.set(pt.x, pt.y + 0.6, pt.z);
    rampMesh.rotation.y = angle;
    rampMesh.rotation.x = -0.15; // incline
    this.trackGroup.add(rampMesh);
  }

  public getClosestTrackSample(pos: Vector3): TrackSample {
    let closestDistSq = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < this.samplesCount; i++) {
      const dSq = pos.distanceToSquared(this.cachedPoints[i]);
      if (dSq < closestDistSq) {
        closestDistSq = dSq;
        closestIndex = i;
      }
    }

    const center = this.cachedPoints[closestIndex];
    const tangent = this.cachedTangents[closestIndex];
    const binormal = this.cachedBinormals[closestIndex];
    const toPos = new Vector3().subVectors(pos, center);
    const distanceFromCenter = toPos.dot(binormal);
    const halfRoad = this.roadWidth * 0.5;

    return {
      center,
      tangent,
      normal: new Vector3(0, 1, 0),
      binormal,
      t: closestIndex / this.samplesCount,
      distanceFromCenter: Math.abs(distanceFromCenter),
      isOffroad: Math.abs(distanceFromCenter) > halfRoad
    };
  }

  public isGliderRamp(t: number): boolean {
    return t >= 0.37 && t <= 0.44;
  }

  public getStartGridTransform(slotIndex: number = 7): { position: Vector3; heading: number } {
    // 8 staggered slots back from finish line (slot 0 = 1st pole, slot 7 = 8th player)
    const stepBack = 0.007; // ~5.5m spacing along spline
    const baseT = (1.0 - (slotIndex + 1) * stepBack) % 1.0;
    const normT = baseT < 0 ? baseT + 1.0 : baseT;
    const pt = this.curve.getPointAt(normT);
    const tan = this.curve.getTangentAt(normT).normalize();
    const up = new Vector3(0, 1, 0);
    const bin = new Vector3().crossVectors(tan, up).normalize();

    // Alternate left (-3.2m) and right (+3.2m) lanes
    const lateral = slotIndex % 2 === 0 ? -3.2 : 3.2;
    const pos = pt.clone().addScaledVector(bin, lateral);
    pos.y += 0.1;

    return { position: pos, heading: Math.atan2(tan.x, tan.z) };
  }

  public getPointAlongSpline(t: number, lateralOffset: number = 0): { position: Vector3; heading: number; tangent: Vector3 } {
    const normT = ((t % 1.0) + 1.0) % 1.0;
    const pt = this.curve.getPointAt(normT);
    const tan = this.curve.getTangentAt(normT).normalize();
    const up = new Vector3(0, 1, 0);
    const bin = new Vector3().crossVectors(tan, up).normalize();
    const pos = pt.clone().addScaledVector(bin, lateralOffset);
    pos.y += 0.1;
    return { position: pos, heading: Math.atan2(tan.x, tan.z), tangent: tan };
  }

  public destroy(): void {
    this.trackGroup.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}
