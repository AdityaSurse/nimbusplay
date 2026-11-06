/**
 * NimbusPlay — Turbo Circuit Master Game Loop
 * Full 3D 8-racer championship: 3-2-1-GO, AI opponents, items, coins, glider, drift, and results.
 * Strictly typed with zero `any`. Target < 350 lines.
 */

import {
  Scene,
  WebGLRenderer,
  DirectionalLight,
  AmbientLight,
  HemisphereLight,
  Fog,
  Color,
  PCFSoftShadowMap,
  SphereGeometry,
  MeshBasicMaterial,
  BackSide,
  Mesh
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

  private scene!: Scene;
  private renderer!: WebGLRenderer;
  private chaseCam!: ChaseCamera;
  private track!: TrackSpline;
  private stadium!: StadiumBuilder;
  private kartModel!: KartModel;
  private physics!: KartPhysics;
  private aiManager!: AIManager;
  private itemSystem!: ItemSystem;
  private hud!: TurboHUD;

  private keysDown = new Set<string>();
  private keydownHandler = (e: KeyboardEvent) => this.keysDown.add(e.code);
  private keyupHandler = (e: KeyboardEvent) => this.keysDown.delete(e.code);

  private wasBoosting = false;
  private rouletteTimer = 0;

  public async init(container: HTMLElement, options: GameOptions): Promise<void> {
    this.options = options;

    // 1. Scene, Sky & Renderer
    this.scene = new Scene();
    this.scene.background = new Color(0x7dd3fc);
    this.scene.fog = new Fog(0x7dd3fc, 80, 420);

    this.renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(options.width, options.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.domElement.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%;';
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.buildSkyDome();

    // 2. Track, Stadium, Karts & Systems
    this.track = new TrackSpline();
    this.scene.add(this.track.trackGroup);

    this.stadium = new StadiumBuilder();
    this.scene.add(this.stadium.stadiumGroup);

    this.kartModel = new KartModel(0xef4444, 0x06b6d4); // Volt
    this.scene.add(this.kartModel.group);

    this.physics = new KartPhysics(this.track);
    this.aiManager = new AIManager(this.track);
    this.scene.add(this.aiManager.group);

    this.itemSystem = new ItemSystem(this.track);
    this.scene.add(this.itemSystem.group);

    this.chaseCam = new ChaseCamera(options.width / options.height);
    this.hud = new TurboHUD(() => this.restartRace(), () => options.onExitToMenu());
    container.appendChild(this.hud.container);

    this.options.setLayoutMode?.('landscape');
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    this.startCountdown();
  }

  private setupLighting(): void {
    this.scene.add(new HemisphereLight(0xfef08a, 0x15803d, 0.7), new AmbientLight(0xffffff, 0.4));
    const sun = new DirectionalLight(0xfffbeb, 1.4);
    sun.position.set(-80, 110, -40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const d = 90;
    sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
    sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
    this.scene.add(sun);
  }

  private buildSkyDome(): void {
    this.scene.add(new Mesh(new SphereGeometry(500, 16, 12), new MeshBasicMaterial({ color: 0x38bdf8, side: BackSide })));
  }

  private startCountdown(): void {
    this.raceState = 'countdown';
    this.countdownTimer = 3.6;
    this.lastCountdownStep = 4;
  }

  public update(input: GameInputState, dt: number): void {
    if (this.isPaused) return;

    // 1. Countdown State Machine
    if (this.raceState === 'countdown') {
      this.updateCountdown(dt, input);
    }

    // 2. Process Input & Physics
    const kartInput = this.processInput(input);
    const effectiveInput = this.raceState === 'countdown' ? { ...kartInput, gas: false, brake: false } : kartInput;
    this.physics.update(effectiveInput, dt);

    // 3. AI Opponents Update & Bumping
    const isRacing = this.raceState === 'racing' || this.raceState === 'finished';
    this.aiManager.update(this.physics.state, dt, isRacing, () => {
      this.options?.sendHaptic([25]);
    });

    // 4. Item System & Roulette
    this.updateItemRoulette(dt, kartInput.useItem ?? false);
    this.itemSystem.update(
      this.physics.state,
      dt,
      () => this.triggerItemRoulette(),
      () => turboAudio.playCoinChime(),
      () => this.handlePlayerHazardHit()
    );

    // 5. Sound & Drift Effects
    this.updateAudioAndEffects(kartInput, dt);

    // 6. Ranks, Race Completion & HUD
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

    // 7. Sync Kart 3D Mesh & Chase Camera
    this.kartModel.group.position.set(this.physics.state.x, this.physics.state.y, this.physics.state.z);
    this.kartModel.group.rotation.y = this.physics.state.heading;
    this.kartModel.updateAnimation(
      this.physics.state.speed,
      kartInput.steer,
      this.physics.state.boostTimer > 0,
      this.physics.state.driftTier,
      this.physics.state.isGliding,
      dt
    );

    this.chaseCam.update(this.physics.state, dt);
    this.hud.update(this.physics.state, sortedRacers);
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

      // Rocket start bonus if gas was held
      const gasHeld = (input.rawBitmask & BUTTON_MASKS.A) || input.isTriggerPressed || this.keysDown.has('KeyW');
      if (gasHeld) {
        this.physics.triggerBoost(1.6, 70.0);
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
    turboAudio.playExplosion();
    this.options?.sendHaptic([100, 60, 120]);
  }

  private updateAudioAndEffects(kartInput: KartInput, _dt: number): void {
    const isBoosting = this.physics.state.boostTimer > 0;
    if (isBoosting && !this.wasBoosting) {
      this.wasBoosting = true;
      turboAudio.playBoostWhoosh();
      this.options?.sendHaptic([60, 40, 80]);
    } else if (!isBoosting) {
      this.wasBoosting = false;
    }

    if (kartInput.drift && Math.abs(kartInput.steer) > 0.3) {
      turboAudio.playDriftScreech();
    }
  }

  private processInput(input: GameInputState): KartInput {
    let steer = 0;
    let gas = false;
    let brake = false;
    let drift = false;
    let boost = false;
    let useItem = false;

    if (input.gyro && Math.abs(input.gyro.gamma) > 0.8) {
      steer = Math.max(-1.0, Math.min(1.0, -input.gyro.gamma / 22.0));
    } else if (input.accel && Math.abs(input.accel.x) > 0.5) {
      steer = Math.max(-1.0, Math.min(1.0, -input.accel.x / 5.0));
    }

    const mask = input.rawBitmask;
    if ((mask & BUTTON_MASKS.A) || input.isTriggerPressed) gas = true;
    if (mask & BUTTON_MASKS.B) brake = true;
    if (mask & (BUTTON_MASKS.PLUS | BUTTON_MASKS.DPAD_UP)) drift = true;
    if (mask & BUTTON_MASKS.BTN_1) { boost = true; useItem = true; }

    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) steer = -1.0;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) steer = 1.0;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) gas = true;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) brake = true;
    if (this.keysDown.has('Space')) { drift = true; useItem = true; }
    if (this.keysDown.has('KeyE') || this.keysDown.has('ShiftLeft')) useItem = true;

    return { steer, gas, brake, drift, boost, useItem };
  }

  private restartRace(): void {
    const grid = this.track.getStartGridTransform(7);
    this.physics.reset(grid);
    this.aiManager.reset();
    this.itemSystem.reset();
    this.hud.hideResults();
    this.startCountdown();
  }

  public render(): void {
    if (this.renderer && this.scene && this.chaseCam) {
      this.renderer.render(this.scene, this.chaseCam.camera);
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }

  public destroy(): void {
    this.options?.setLayoutMode?.('portrait');
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    this.track.destroy();
    this.stadium.destroy();
    this.kartModel.destroy();
    this.aiManager.destroy();
    this.itemSystem.destroy();
    this.hud.destroy();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }
}
