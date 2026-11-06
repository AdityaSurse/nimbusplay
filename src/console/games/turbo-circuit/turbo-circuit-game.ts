/**
 * NimbusPlay — Turbo Circuit Master Game Loop
 * Full 3D 8-racer championship: 3-2-1-GO, AI opponents, items, coins, glider, drift, and results.
 * Strictly typed with zero `any`. Maximum limit 350 lines.
 */

import {
  Scene, WebGLRenderer, DirectionalLight, AmbientLight, HemisphereLight,
  FogExp2, Color, PCFSoftShadowMap, SphereGeometry, MeshBasicMaterial, BackSide,
  Mesh, ACESFilmicToneMapping, SRGBColorSpace, Vector3
} from 'three';
import type { IGame, GameInputState, GameOptions } from '../common/game-interface.js';
import type { KartInput, RaceState } from './types.js';
import { TrackSpline } from './track-spline.js';
import { StadiumBuilder } from './stadium-builder.js';
import { KartModel } from './kart-model.js';
import { KartPhysics } from './kart-physics.js';
import { AIManager } from './ai-manager.js';
import { ItemSystem } from './item-system.js';
import { ChaseCamera } from './chase-camera.js';
import { TurboHUD } from './turbo-hud.js';
import { TurboParticleSystem } from './particle-system.js';
import { turboAudio } from './turbo-audio.js';
import { BUTTON_MASKS } from '../../../shared/protocol.js';

export class TurboCircuitGame implements IGame {
  public readonly id = 'turboCircuit';
  public readonly title = 'Turbo Circuit';

  private options: GameOptions | null = null;
  private isPaused = false;
  private raceState: RaceState = 'countdown';
  private countdownTimer = 3.6;
  private lastCountdownStep = 4;
  private finishTimer = 0;
  private lowFpsTimer = 0;
  private wasBoosting = false;
  private rouletteTimer = 0;
  private qualityMode: 'low' | 'medium' | 'high' = 'high';

  private scene!: Scene;
  private renderer!: WebGLRenderer;
  private chaseCam!: ChaseCamera;
  private sunLight!: DirectionalLight;
  private track!: TrackSpline;
  private stadium!: StadiumBuilder;
  private kartModel!: KartModel;
  private physics!: KartPhysics;
  private aiManager!: AIManager;
  private itemSystem!: ItemSystem;
  private particles!: TurboParticleSystem;
  private hud!: TurboHUD;

  private keysDown = new Set<string>();
  private keydownHandler = (e: KeyboardEvent): void => { this.keysDown.add(e.code); };
  private keyupHandler = (e: KeyboardEvent): void => { this.keysDown.delete(e.code); };

  public async init(container: HTMLElement, options: GameOptions): Promise<void> {
    this.options = options;
    this.scene = new Scene();
    this.scene.background = new Color(0x7dd3fc);
    this.scene.fog = new FogExp2(0x7dd3fc, 0.0032);

    this.renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(options.width, options.height);
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.domElement.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%;';
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.scene.add(new Mesh(new SphereGeometry(500, 16, 12), new MeshBasicMaterial({ color: 0x38bdf8, side: BackSide })));

    this.track = new TrackSpline(); this.scene.add(this.track.trackGroup);
    this.stadium = new StadiumBuilder(); this.scene.add(this.stadium.stadiumGroup);
    this.kartModel = new KartModel(0xef4444, 0x06b6d4); this.scene.add(this.kartModel.group);
    this.particles = new TurboParticleSystem(); this.scene.add(this.particles.group);

    this.physics = new KartPhysics(this.track, () => {
      this.chaseCam.triggerShake(0.35, 0.55);
      this.options?.sendHaptic([60, 30, 80]);
    });

    this.aiManager = new AIManager(this.track);
    this.scene.add(this.aiManager.group);
    this.itemSystem = new ItemSystem(this.track);
    this.scene.add(this.itemSystem.group);

    this.chaseCam = new ChaseCamera(options.width / options.height);
    this.hud = new TurboHUD(() => this.restartRace(), () => options.onExitToMenu());
    container.appendChild(this.hud.container);

    this.applyQuality(this.loadQuality());
    this.options.setLayoutMode?.('landscape-racing', 'turboCircuit');
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    this.startCountdown();
  }

  private setupLighting(): void {
    this.scene.add(new HemisphereLight(0xfff7ed, 0x166534, 0.75), new AmbientLight(0xfef3c7, 0.45));
    this.sunLight = new DirectionalLight(0xfffbeb, 1.45);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.02;
    const d = 32, sc = this.sunLight.shadow.camera;
    sc.left = -d; sc.right = d; sc.top = d; sc.bottom = -d; sc.near = 5; sc.far = 110;
    this.scene.add(this.sunLight, this.sunLight.target);
  }

  private loadQuality(): 'low' | 'medium' | 'high' {
    if (typeof localStorage === 'undefined') return 'high';
    const q = localStorage.getItem('nimbusplay_graphics_quality');
    return (q === 'low' || q === 'medium' || q === 'high') ? q : 'high';
  }

  public applyQuality(quality: 'low' | 'medium' | 'high'): void {
    this.qualityMode = quality;
    if (typeof localStorage !== 'undefined') localStorage.setItem('nimbusplay_graphics_quality', quality);
    const isLow = quality === 'low', isMed = quality === 'medium';
    this.renderer.shadowMap.enabled = !isLow;
    if (!isLow) this.sunLight.shadow.mapSize.set(isMed ? 1024 : 2048, isMed ? 1024 : 2048);
    this.particles.setQualityScale(isLow ? 0.35 : isMed ? 0.65 : 1.0);
    this.renderer.setPixelRatio(isLow ? 0.85 : isMed ? 1.0 : Math.min(window.devicePixelRatio, 2));
  }

  private startCountdown(): void {
    this.raceState = 'countdown';
    this.countdownTimer = 3.6;
    this.lastCountdownStep = 4;
  }

  public update(input: GameInputState, dt: number): void {
    if (this.isPaused) return;

    if (this.raceState === 'countdown') this.updateCountdown(dt, input);

    const kartInput = this.processInput(input);
    const effInput = this.raceState === 'countdown' ? { ...kartInput, gas: false, brake: false } : kartInput;
    this.physics.update(effInput, dt);

    const isRacing = this.raceState === 'racing' || this.raceState === 'finished';
    this.aiManager.update(this.physics.state, dt, isRacing, () => this.options?.sendHaptic([25]));

    this.updateItemRoulette(dt, kartInput.useItem ?? false);
    const kartPos = new Vector3(this.physics.state.x, this.physics.state.y, this.physics.state.z);
    this.itemSystem.update(
      this.physics.state,
      dt,
      () => this.triggerItemRoulette(),
      () => {
        turboAudio.playCoinChime();
        this.particles.emitCoinSparkles(kartPos, 8);
      },
      () => this.handlePlayerHazardHit()
    );

    this.updateAudioAndEffects(kartInput);

    if (this.physics.state.driftTier !== 'none' || (kartInput.brake && this.physics.state.speed > 10)) {
      this.particles.emitSmoke(kartPos, 2);
      this.particles.emitDriftSparks(kartPos, this.physics.state.driftTier, 2);
      this.particles.addSkidMark(kartPos, this.physics.state.heading);
    }
    if (this.physics.state.boostTimer > 0) {
      this.particles.emitBoostFlame(kartPos, this.physics.state.heading, 2);
    }
    this.particles.update(dt);

    this.sunLight.position.set(this.physics.state.x - 28, this.physics.state.y + 42, this.physics.state.z - 22);
    this.sunLight.target.position.set(this.physics.state.x, this.physics.state.y, this.physics.state.z);
    this.sunLight.target.updateMatrixWorld();

    const { sortedRacers } = this.aiManager.computeRanks(this.physics.state);
    if (this.physics.state.currentLap > 3 && this.raceState === 'racing') {
      this.raceState = 'finished';
      this.finishTimer = 2.4;
      this.hud.showFinishBanner();
      turboAudio.playFinishFanfare();
      this.options?.sendHaptic([80, 50, 100]);
    }

    if (this.raceState === 'finished') {
      this.finishTimer -= dt;
      if (this.finishTimer <= 0) {
        this.raceState = 'results';
        this.hud.showResults(sortedRacers);
      }
    }

    this.kartModel.group.position.set(this.physics.state.x, this.physics.state.y, this.physics.state.z);
    this.kartModel.group.rotation.y = this.physics.state.heading;
    this.kartModel.updateAnimation(
      this.physics.state.speed, kartInput.steer, this.physics.state.boostTimer > 0,
      this.physics.state.driftTier, this.physics.state.isGliding, dt, kartInput.gas, kartInput.brake
    );

    this.chaseCam.update(this.physics.state, dt);
    this.hud.update(this.physics.state, sortedRacers);

    if (dt > 0.022) {
      this.lowFpsTimer += dt;
      if (this.lowFpsTimer >= 3.0) {
        this.lowFpsTimer = 0;
        if (this.qualityMode === 'high') this.applyQuality('medium');
        else if (this.qualityMode === 'medium') this.applyQuality('low');
      }
    } else {
      this.lowFpsTimer = Math.max(0, this.lowFpsTimer - dt * 0.5);
    }

    this.render();
  }

  private updateCountdown(dt: number, input: GameInputState): void {
    this.countdownTimer -= dt;
    const step = Math.ceil(this.countdownTimer);
    if (step !== this.lastCountdownStep && step >= 1 && step <= 3) {
      this.lastCountdownStep = step;
      this.hud.showCountdown(`${step}`, false);
      turboAudio.playCountdownTick(false);
      this.options?.sendHaptic([20]);
    }
    if (this.countdownTimer <= 0) {
      this.raceState = 'racing';
      this.hud.showCountdown('GO!', true);
      turboAudio.playCountdownTick(true);
      this.options?.sendHaptic([60, 40, 80]);
      if ((input.rawBitmask & BUTTON_MASKS.A) || input.isTriggerPressed || this.keysDown.has('KeyW')) {
        this.physics.triggerBoost(1.6, 70.0);
        this.chaseCam.triggerShake(0.25, 0.3);
        turboAudio.playBoostWhoosh();
      }
    }
  }

  private triggerItemRoulette(): void {
    this.physics.state.isItemRoulette = true;
    this.rouletteTimer = 1.2;
    turboAudio.playItemRouletteTick();
  }

  private updateItemRoulette(dt: number, useItem: boolean): void {
    if (this.physics.state.isItemRoulette) {
      this.rouletteTimer -= dt;
      if (Math.random() < 0.25) turboAudio.playItemRouletteTick();
      if (this.rouletteTimer <= 0) {
        this.physics.state.isItemRoulette = false;
        this.physics.state.heldItem = this.itemSystem.getRandomItem(this.physics.state.position);
        turboAudio.playItemUnlock();
      }
    } else if (useItem && this.physics.state.heldItem) {
      this.deployPlayerItem(this.physics.state.heldItem);
      this.physics.state.heldItem = null;
    }
  }

  private deployPlayerItem(item: string): void {
    if (item === 'boost') {
      this.physics.triggerBoost(1.8, 72.0);
      this.chaseCam.triggerShake(0.25, 0.25);
      turboAudio.playBoostWhoosh();
      this.options?.sendHaptic([60, 40, 80]);
    } else if (item === 'rocket') {
      this.itemSystem.deployRocket(this.physics.state.x, this.physics.state.y, this.physics.state.z, this.physics.state.heading);
      turboAudio.playRocketLaunch();
    } else if (item === 'oil') {
      this.itemSystem.deployOil(this.physics.state.x, this.physics.state.y, this.physics.state.z);
    } else if (item === 'shield') {
      this.physics.triggerShield(5.0);
      turboAudio.playBoostWhoosh();
    }
  }

  private handlePlayerHazardHit(): void {
    this.physics.triggerSpinout();
    this.chaseCam.triggerShake(0.5, 0.8);
    turboAudio.playExplosion();
    this.options?.sendHaptic([100, 60, 120]);
  }

  private updateAudioAndEffects(kartInput: KartInput): void {
    const isBoosting = this.physics.state.boostTimer > 0;
    if (isBoosting && !this.wasBoosting) {
      this.wasBoosting = true;
      turboAudio.playBoostWhoosh();
      this.options?.sendHaptic([60, 40, 80]);
    } else if (!isBoosting) this.wasBoosting = false;
    if (kartInput.drift && Math.abs(kartInput.steer) > 0.3) turboAudio.playDriftScreech();
  }

  private processInput(input: GameInputState): KartInput {
    let steer = 0;
    if (input.accel && Math.abs(input.accel.y) > 0.4) {
      steer = Math.sign(input.accel.y) * Math.min(1.0, (Math.abs(input.accel.y) - 0.4) / 4.8);
    } else if (input.gyro && Math.abs(input.gyro.beta) > 2.5) {
      steer = Math.max(-1.0, Math.min(1.0, input.gyro.beta / 42.0));
    } else if (input.accel && Math.abs(input.accel.x) > 0.5) {
      steer = Math.max(-1.0, Math.min(1.0, -input.accel.x / 5.0));
    } else if (input.gyro && Math.abs(input.gyro.gamma) > 0.8) {
      steer = Math.max(-1.0, Math.min(1.0, -input.gyro.gamma / 22.0));
    }

    const mask = input.rawBitmask;
    if (mask & BUTTON_MASKS.DPAD_LEFT || this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) steer = -1.0;
    if (mask & BUTTON_MASKS.DPAD_RIGHT || this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) steer = 1.0;
    const gas = !!((mask & BUTTON_MASKS.A) || input.isTriggerPressed || this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp'));
    const brake = !!((mask & BUTTON_MASKS.B) || this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown'));
    const drift = !!((mask & (BUTTON_MASKS.PLUS | BUTTON_MASKS.DPAD_UP)) || this.keysDown.has('Space'));
    const useItem = !!((mask & BUTTON_MASKS.BTN_1) || this.keysDown.has('KeyE') || this.keysDown.has('ShiftLeft') || this.keysDown.has('Space'));

    return { steer, gas, brake, drift, boost: useItem, useItem };
  }

  private restartRace(): void {
    this.physics.reset(this.track.getStartGridTransform(7));
    this.aiManager.reset();
    this.itemSystem.reset();
    this.hud.hideResults();
    this.startCountdown();
  }

  public render(): void {
    if (this.renderer && this.scene && this.chaseCam) this.renderer.render(this.scene, this.chaseCam.camera);
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public restart(): void { this.restartRace(); }
  public exit(): void { this.options?.onExitToMenu(); }

  public destroy(): void {
    this.options?.setLayoutMode?.('portrait');
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    this.track.destroy(); this.stadium.destroy(); this.kartModel.destroy();
    this.aiManager.destroy(); this.itemSystem.destroy(); this.particles.destroy(); this.hud.destroy();
    if (this.renderer) { this.renderer.dispose(); this.renderer.domElement.remove(); }
  }
}
