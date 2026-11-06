/**
 * NimbusPlay — Turbo Circuit 3D Item & Coin Track System
 * Manages item boxes, coins, active hazards (Rocket Orb, Oil Slick), and shield visualizer.
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
import type { ItemType, ItemBoxData, CoinData, ActiveHazard, KartPhysicsState } from './types.js';
import type { TrackSpline } from './track-spline.js';

export class ItemSystem {
  public readonly group = new Group();

  private readonly itemBoxes: ItemBoxData[] = [];
  private readonly itemBoxMeshes: Mesh[] = [];

  private readonly coins: CoinData[] = [];
  private readonly coinMeshes: Mesh[] = [];

  private readonly hazards: ActiveHazard[] = [];
  private readonly hazardMeshes: Map<string, Mesh> = new Map();

  private readonly shieldMesh: Mesh;
  private readonly track: TrackSpline;

  constructor(track: TrackSpline) {
    this.track = track;

    // Shield Aura
    const shieldGeo = new SphereGeometry(2.4, 16, 12);
    const shieldMat = new MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, wireframe: true });
    this.shieldMesh = new Mesh(shieldGeo, shieldMat);
    this.shieldMesh.visible = false;
    this.group.add(this.shieldMesh);

    this.spawnItemBoxes();
    this.spawnCoins();
  }

  private spawnItemBoxes(): void {
    const boxGeo = new BoxGeometry(1.6, 1.6, 1.6);
    const boxMat = new MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.4, roughness: 0.2, transparent: true, opacity: 0.85 });

    // 2 Gates of 3 item boxes across lanes (t = 0.16 and t = 0.65)
    [0.16, 0.65].forEach((tGate, gIdx) => {
      [-3.8, 0, 3.8].forEach((offset, oIdx) => {
        const pt = this.track.getPointAlongSpline(tGate, offset);
        const mesh = new Mesh(boxGeo, boxMat);
        mesh.position.set(pt.position.x, pt.position.y + 1.2, pt.position.z);
        mesh.castShadow = true;
        this.group.add(mesh);
        this.itemBoxMeshes.push(mesh);

        this.itemBoxes.push({
          id: `box-${gIdx}-${oIdx}`,
          x: pt.position.x,
          y: pt.position.y + 1.2,
          z: pt.position.z,
          active: true,
          respawnTimer: 0
        });
      });
    });
  }

  private spawnCoins(): void {
    const coinGeo = new CylinderGeometry(0.65, 0.65, 0.14, 12);
    coinGeo.rotateZ(Math.PI / 2);
    const coinMat = new MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 });

    // 8 coins along the circuit
    const coinTs = [0.06, 0.10, 0.26, 0.30, 0.52, 0.56, 0.76, 0.82];
    coinTs.forEach((tVal, idx) => {
      const lateral = (idx % 2 === 0 ? -2.2 : 2.2);
      const pt = this.track.getPointAlongSpline(tVal, lateral);
      const mesh = new Mesh(coinGeo, coinMat);
      mesh.position.set(pt.position.x, pt.position.y + 0.6, pt.position.z);
      this.group.add(mesh);
      this.coinMeshes.push(mesh);

      this.coins.push({
        id: `coin-${idx}`,
        x: pt.position.x,
        y: pt.position.y + 0.6,
        z: pt.position.z,
        active: true,
        respawnTimer: 0
      });
    });
  }

  public update(
    player: KartPhysicsState,
    dt: number,
    onPickupItem: () => void,
    onPickupCoin: () => void,
    onPlayerHit: () => void
  ): void {
    // 1. Rotate & Check Item Boxes
    this.itemBoxes.forEach((box, i) => {
      const mesh = this.itemBoxMeshes[i];
      if (!box.active) {
        box.respawnTimer -= dt;
        if (box.respawnTimer <= 0) {
          box.active = true;
          mesh.visible = true;
        }
      } else {
        mesh.rotation.x += dt * 2.0;
        mesh.rotation.y += dt * 2.5;

        // Player collision
        const distSq = (player.x - box.x) ** 2 + (player.z - box.z) ** 2;
        if (distSq < 5.5 && !player.heldItem && !player.isItemRoulette) {
          box.active = false;
          mesh.visible = false;
          box.respawnTimer = 4.5;
          onPickupItem();
        }
      }
    });

    // 2. Rotate & Check Coins
    this.coins.forEach((coin, i) => {
      const mesh = this.coinMeshes[i];
      if (!coin.active) {
        coin.respawnTimer -= dt;
        if (coin.respawnTimer <= 0) {
          coin.active = true;
          mesh.visible = true;
        }
      } else {
        mesh.rotation.y += dt * 3.5;
        const distSq = (player.x - coin.x) ** 2 + (player.z - coin.z) ** 2;
        if (distSq < 4.0) {
          coin.active = false;
          mesh.visible = false;
          coin.respawnTimer = 6.0;
          player.coins = Math.min(10, player.coins + 1);
          onPickupCoin();
        }
      }
    });

    // 3. Update Active Hazards
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.lifetime -= dt;
      const mesh = this.hazardMeshes.get(h.id);

      if (h.type === 'rocket') {
        const speed = 72.0;
        h.x += Math.sin(h.heading ?? 0) * speed * dt;
        h.z += Math.cos(h.heading ?? 0) * speed * dt;
        if (mesh) {
          mesh.position.set(h.x, h.y, h.z);
          mesh.rotation.y = (h.heading ?? 0);
        }

        // Rocket hits player
        const distSq = (player.x - h.x) ** 2 + (player.z - h.z) ** 2;
        if (distSq < 4.5 && !player.isShielded) {
          onPlayerHit();
          h.lifetime = -1;
        }
      } else if (h.type === 'oil') {
        // Oil puddle on ground
        const distSq = (player.x - h.x) ** 2 + (player.z - h.z) ** 2;
        if (distSq < 4.0 && !player.isShielded && !player.isGliding) {
          onPlayerHit();
          h.lifetime = -1;
        }
      }

      if (h.lifetime <= 0) {
        if (mesh) {
          mesh.geometry.dispose();
          mesh.remove();
        }
        this.hazardMeshes.delete(h.id);
        this.hazards.splice(i, 1);
      }
    }

    // 4. Update Shield Mesh
    this.shieldMesh.visible = player.isShielded;
    if (player.isShielded) {
      this.shieldMesh.position.set(player.x, player.y + 0.8, player.z);
      this.shieldMesh.rotation.y += dt * 4.0;
    }
  }

  public deployRocket(fromX: number, fromY: number, fromZ: number, heading: number): void {
    const id = `rocket-${Date.now()}`;
    const mesh = new Mesh(new CylinderGeometry(0.25, 0.35, 1.4, 8), new MeshBasicMaterial({ color: 0xf97316 }));
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(fromX, fromY + 0.8, fromZ);
    this.group.add(mesh);
    this.hazardMeshes.set(id, mesh);
    this.hazards.push({ id, type: 'rocket', x: fromX, y: fromY + 0.8, z: fromZ, heading, lifetime: 3.5 });
  }

  public deployOil(fromX: number, fromY: number, fromZ: number): void {
    const id = `oil-${Date.now()}`;
    const mesh = new Mesh(new CylinderGeometry(1.6, 1.6, 0.05, 12), new MeshStandardMaterial({ color: 0x10b981, roughness: 0.1, metalness: 0.8 }));
    mesh.position.set(fromX, fromY + 0.05, fromZ);
    this.group.add(mesh);
    this.hazardMeshes.set(id, mesh);
    this.hazards.push({ id, type: 'oil', x: fromX, y: fromY + 0.05, z: fromZ, lifetime: 12.0 });
  }

  public getRandomItem(rank: number): ItemType {
    const r = Math.random();
    if (rank >= 6) return r < 0.5 ? 'boost' : r < 0.85 ? 'rocket' : 'shield';
    if (rank <= 2) return r < 0.45 ? 'oil' : r < 0.8 ? 'shield' : 'boost';
    return r < 0.3 ? 'boost' : r < 0.55 ? 'rocket' : r < 0.8 ? 'oil' : 'shield';
  }

  public reset(): void {
    this.hazards.forEach((h) => { const m = this.hazardMeshes.get(h.id); if (m) m.remove(); });
    this.hazards.length = 0;
    this.hazardMeshes.clear();
    this.itemBoxes.forEach((b, i) => { b.active = true; b.respawnTimer = 0; this.itemBoxMeshes[i].visible = true; });
    this.coins.forEach((c, i) => { c.active = true; c.respawnTimer = 0; this.coinMeshes[i].visible = true; });
  }

  public destroy(): void {
    this.reset();
    this.group.clear();
  }
}
