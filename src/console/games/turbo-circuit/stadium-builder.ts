/**
 * NimbusPlay — Turbo Circuit Procedural Stadium & Scenery Builder
 * Builds grandstands with spectators, light towers, start/finish gantry, and banners.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import {
  Group,
  BoxGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  Mesh,
  CanvasTexture,
  PointLight
} from 'three';

export class StadiumBuilder {
  public readonly stadiumGroup = new Group();

  constructor() {
    this.buildGrandstands();
    this.buildLightTowers();
    this.buildStartFinishArch();
    this.buildTracksideBanners();
  }

  private buildGrandstands(): void {
    const standGroup = new Group();

    // 5-tier stepped bleachers along the main straight (x = -72, z from -70 to 50)
    const tierGeo = new BoxGeometry(12, 1.2, 110);
    const tierMat = new MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });

    for (let t = 0; t < 5; t++) {
      const tier = new Mesh(tierGeo, tierMat);
      tier.position.set(-70 - t * 2.2, t * 1.4 + 0.7, -10);
      tier.castShadow = true;
      tier.receiveShadow = true;
      standGroup.add(tier);

      // Spectator colored blocks on each tier
      const crowdGeo = new BoxGeometry(1.6, 1.0, 3.2);
      for (let c = -50; c <= 45; c += 5) {
        const colors = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981, 0xec4899, 0xffffff];
        const color = colors[Math.abs(c * 7 + t * 11) % colors.length];
        const crowdMat = new MeshStandardMaterial({ color, roughness: 0.9 });
        const person = new Mesh(crowdGeo, crowdMat);
        person.position.set(-70 - t * 2.2, t * 1.4 + 1.8, c);
        standGroup.add(person);
      }
    }

    // Grandstand roof canopy
    const roofGeo = new BoxGeometry(22, 0.6, 115);
    const roofMat = new MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const roof = new Mesh(roofGeo, roofMat);
    roof.position.set(-76, 10.5, -10);
    roof.rotation.z = -0.08;
    roof.castShadow = true;
    standGroup.add(roof);

    this.stadiumGroup.add(standGroup);
  }

  private buildLightTowers(): void {
    const towerCoords = [
      { x: -75, z: -85 },
      { x: -75, z: 65 },
      { x: 80, z: -110 },
      { x: 75, z: 80 }
    ];

    const poleGeo = new CylinderGeometry(0.5, 0.9, 28, 8);
    const headGeo = new BoxGeometry(5.0, 2.5, 1.4);
    const poleMat = new MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });
    const headMat = new MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const lightMat = new MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef08a,
      emissiveIntensity: 0.8
    });
    const bulbGeo = new BoxGeometry(4.6, 2.1, 0.2);

    for (const pos of towerCoords) {
      const tower = new Group();
      const pole = new Mesh(poleGeo, poleMat);
      pole.position.y = 14;
      pole.castShadow = true;
      tower.add(pole);

      const head = new Mesh(headGeo, headMat);
      head.position.set(0, 27, 0);
      head.rotation.x = 0.25;
      tower.add(head);

      const bulb = new Mesh(bulbGeo, lightMat);
      bulb.position.set(0, 27, 0.7);
      bulb.rotation.x = 0.25;
      tower.add(bulb);

      const light = new PointLight(0xfef08a, 0.8, 55, 1.4);
      light.position.set(0, 26, 1.2);
      tower.add(light);

      tower.position.set(pos.x, 0, pos.z);
      this.stadiumGroup.add(tower);
    }
  }

  private buildStartFinishArch(): void {
    const archGroup = new Group();
    const pillarGeo = new BoxGeometry(2.0, 14, 2.0);
    const pillarMat = new MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7 });

    const leftPillar = new Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-62, 7, -80);
    archGroup.add(leftPillar);

    const rightPillar = new Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(-38, 7, -80);
    archGroup.add(rightPillar);

    // Crossbar span
    const barGeo = new BoxGeometry(26, 3.2, 3.0);
    let barMat = new MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 128);
      for (let c = 0; c < 16; c++) {
        ctx.fillStyle = c % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(c * 32, 0, 32, 28);
      }
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TURBO CIRCUIT', 256, 80);
      barMat = new MeshStandardMaterial({ map: new CanvasTexture(canvas), roughness: 0.4 });
    }
    const crossbar = new Mesh(barGeo, barMat);
    crossbar.position.set(-50, 13.5, -80);
    crossbar.castShadow = true;
    archGroup.add(crossbar);

    this.stadiumGroup.add(archGroup);
  }

  private buildTracksideBanners(): void {
    const bannerSpots = [
      { x: -50, z: 98, angle: 0 },
      { x: 35, z: 120, angle: 1.2 },
      { x: 72, z: 30, angle: 3.1 },
      { x: 45, z: -40, angle: 2.2 },
      { x: 75, z: -135, angle: 3.5 }
    ];

    let bannerMat = new MeshStandardMaterial({ color: 0xea580c, roughness: 0.6 });
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HYPER BOOST', 128, 42);
      bannerMat = new MeshStandardMaterial({ map: new CanvasTexture(canvas), roughness: 0.6 });
    }
    const bannerGeo = new BoxGeometry(12, 2.2, 0.4);

    for (const spot of bannerSpots) {
      const banner = new Mesh(bannerGeo, bannerMat);
      banner.position.set(spot.x, 1.2, spot.z);
      banner.rotation.y = spot.angle;
      banner.castShadow = true;
      this.stadiumGroup.add(banner);
    }
  }

  public destroy(): void {
    this.stadiumGroup.traverse((obj) => {
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

