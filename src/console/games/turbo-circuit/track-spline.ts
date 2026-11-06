/**
 * NimbusPlay — Turbo Circuit Procedural Track & Spline Generator
 * Builds a closed 3D CatmullRom road with blue/white curbs, lane markings, and grass infield.
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
  PlaneGeometry
} from 'three';
import type { TrackSample } from './types.js';

export class TrackSpline {
  public readonly curve: CatmullRomCurve3;
  public readonly roadWidth = 16.0;
  public readonly curbWidth = 1.6;
  public readonly trackGroup = new Group();

  private readonly samplesCount = 200;
  private readonly cachedPoints: Vector3[] = [];
  private readonly cachedTangents: Vector3[] = [];
  private readonly cachedBinormals: Vector3[] = [];

  constructor() {
    // 16 control points forming a closed dynamic stadium circuit
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
    this.precomputeSplineData();
    this.buildRoadMesh();
    this.buildCurbs();
    this.buildGrassInfield();
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

      positions.push(left.x, left.y + 0.05, left.z);
      positions.push(right.x, right.y + 0.05, right.z);

      // Dark asphalt tone
      const isStripe = (i % 6) < 3;
      const c = isStripe ? 0.20 : 0.16;
      colors.push(c, c, c + 0.02, c, c, c + 0.02);
    }

    const indices: number[] = [];
    for (let i = 0; i < this.samplesCount; i++) {
      const i0 = i * 2;
      const i1 = i0 + 1;
      const i2 = i0 + 2;
      const i3 = i0 + 3;

      indices.push(i0, i1, i2);
      indices.push(i1, i3, i2);
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05
    });

    const roadMesh = new Mesh(geo, mat);
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
      const binormal = this.cachedBinormals[idx];

      // Outer and inner curb strips
      const leftInner = pt.clone().addScaledVector(binormal, -halfW);
      const leftOuter = pt.clone().addScaledVector(binormal, -(halfW + this.curbWidth));
      const rightInner = pt.clone().addScaledVector(binormal, halfW);
      const rightOuter = pt.clone().addScaledVector(binormal, halfW + this.curbWidth);

      positions.push(leftOuter.x, leftOuter.y + 0.12, leftOuter.z);
      positions.push(leftInner.x, leftInner.y + 0.06, leftInner.z);
      positions.push(rightInner.x, rightInner.y + 0.06, rightInner.z);
      positions.push(rightOuter.x, rightOuter.y + 0.12, rightOuter.z);

      // Blue and White alternating curbs (4 segments blue, 4 segments white)
      const isBlue = Math.floor(i / 3) % 2 === 0;
      const r = isBlue ? 0.11 : 0.96;
      const g = isBlue ? 0.32 : 0.96;
      const b = isBlue ? 0.88 : 0.98;

      colors.push(r, g, b, r, g, b, r, g, b, r, g, b);
    }

    const indices: number[] = [];
    for (let i = 0; i < this.samplesCount; i++) {
      const b = i * 4;
      // Left curb quad
      indices.push(b, b + 1, b + 4);
      indices.push(b + 1, b + 5, b + 4);
      // Right curb quad
      indices.push(b + 2, b + 3, b + 6);
      indices.push(b + 3, b + 7, b + 6);
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
    const curbMesh = new Mesh(geo, mat);
    curbMesh.receiveShadow = true;
    this.trackGroup.add(curbMesh);
  }

  private buildGrassInfield(): void {
    const geo = new PlaneGeometry(450, 450, 16, 16);
    geo.rotateX(-Math.PI / 2);
    const mat = new MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.92,
      metalness: 0.0
    });
    const grass = new Mesh(geo, mat);
    grass.position.y = -0.05;
    grass.receiveShadow = true;
    this.trackGroup.add(grass);
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

  public getStartGridTransform(): { position: Vector3; heading: number } {
    // Start at point 0 on the main straight, facing forward along tangent
    const p = this.cachedPoints[0];
    const t = this.cachedTangents[0];
    const heading = Math.atan2(t.x, t.z);
    return {
      position: new Vector3(p.x, p.y + 0.1, p.z),
      heading
    };
  }

  public destroy(): void {
    this.trackGroup.traverse((obj) => {
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

