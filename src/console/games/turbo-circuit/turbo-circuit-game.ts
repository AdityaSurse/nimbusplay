/**
 * NimbusPlay — Turbo Circuit Master Game Loop
 * Implements IGame with Three.js 60 FPS 3D stadium kart racing, procedural track,
 * low-poly kart & driver, arcade physics, chase camera, fog, shadows, and Web Audio.
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
import type { KartInput } from './types.js';
import { TrackSpline } from './track-spline.js';
import { StadiumBuilder } from './stadium-builder.js';
import { KartModel } from './kart-model.js';
import { KartPhysics } from './kart-physics.js';
import { ChaseCamera } from './chase-camera.js';
import { TurboHUD } from './turbo-hud.js';
import { audioManager } from '../../audio/audio-manager.js';
import { gameSfx } from '../../audio/game-sfx.js';
import { BUTTON_MASKS } from '../../../shared/protocol.js';

export class TurboCircuitGame implements IGame {
  public readonly id = 'turboCircuit';
  public readonly title = 'Turbo Circuit';

  private options: GameOptions | null = null;
  private isPaused = false;

  private scene!: Scene;
  private renderer!: WebGLRenderer;
  private chaseCam!: ChaseCamera;

  private track!: TrackSpline;
  private stadium!: StadiumBuilder;
  private kartModel!: KartModel;
  private physics!: KartPhysics;
  private hud!: TurboHUD;

  // Keyboard controls fallback for desktop debugging
  private keysDown = new Set<string>();
  private keydownHandler = (e: KeyboardEvent) => this.keysDown.add(e.code);
  private keyupHandler = (e: KeyboardEvent) => this.keysDown.delete(e.code);

  private wasBoosting = false;

  public async init(container: HTMLElement, options: GameOptions): Promise<void> {
    this.options = options;

    // 1. Initialize Three.js Scene & Fog
    this.scene = new Scene();
    const skyColor = new Color(0x7dd3fc); // Bright saturated daytime sky
    this.scene.background = skyColor;
    this.scene.fog = new Fog(0x7dd3fc, 80, 420);

    // 2. WebGL Renderer with Soft Shadows
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(options.width, options.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.inset = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // 3. Lighting & Day Skybox
    this.setupLighting();
    this.buildSkyDome();

    // 4. Build Stadium, Track, Kart, Physics, Camera, and HUD
    this.track = new TrackSpline();
    this.scene.add(this.track.trackGroup);

    this.stadium = new StadiumBuilder();
    this.scene.add(this.stadium.stadiumGroup);

    this.kartModel = new KartModel();
    this.scene.add(this.kartModel.group);

    this.physics = new KartPhysics(this.track);
    this.chaseCam = new ChaseCamera(options.width / options.height);

    this.hud = new TurboHUD();
    container.appendChild(this.hud.container);

    // 5. Orientation & Audio
    this.options.setLayoutMode?.('landscape');
    audioManager.initOnGesture();
    audioManager.playLaunchChime();

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
  }

  private setupLighting(): void {
    // Hemispheric ambient light (Warm sun sky + cool turf reflection)
    const hemiLight = new HemisphereLight(0xfef08a, 0x15803d, 0.7);
    this.scene.add(hemiLight);

    const ambLight = new AmbientLight(0xffffff, 0.4);
    this.scene.add(ambLight);

    // Main Sun Directional Light with Soft Shadows
    const sunLight = new DirectionalLight(0xfffbeb, 1.4);
    sunLight.position.set(-80, 110, -40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 320;

    const d = 90;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.001;

    this.scene.add(sunLight);
  }

  private buildSkyDome(): void {
    const skyGeo = new SphereGeometry(500, 16, 12);
    const skyMat = new MeshBasicMaterial({
      color: 0x38bdf8,
      side: BackSide
    });
    const sky = new Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  public update(input: GameInputState, dt: number): void {
    if (this.isPaused) return;

    // 1. Process Mobile Gyro & Keyboard Input
    const kartInput = this.processInput(input);

    // 2. Step Kart Physics
    this.physics.update(kartInput, dt);

    // 3. Audio & Haptic Feedback on Boost
    const isBoosting = this.physics.state.boostTimer > 0;
    if (isBoosting && !this.wasBoosting) {
      this.wasBoosting = true;
      audioManager.playBladeWhoosh();
      this.options?.sendHaptic([60, 40, 80]);
    } else if (!isBoosting) {
      this.wasBoosting = false;
    }

    if (this.physics.state.wallBounceCooldown > 0.3) {
      gameSfx.playCarnivalPop();
      this.options?.sendHaptic([45]);
    }

    // 4. Sync Kart 3D Mesh
    this.kartModel.group.position.set(this.physics.state.x, this.physics.state.y, this.physics.state.z);
    this.kartModel.group.rotation.y = this.physics.state.heading;
    this.kartModel.updateAnimation(this.physics.state.speed, kartInput.steer, isBoosting, dt);

    // 5. Update Chase Camera & HUD
    this.chaseCam.update(this.physics.state, dt);
    this.hud.update(this.physics.state);

    // 6. Render Three.js Scene
    this.render();
  }

  private processInput(input: GameInputState): KartInput {
    let steer = 0;
    let gas = false;
    let brake = false;
    let drift = false;
    let boost = false;

    // 1. Phone Gyro Tilt Steering
    if (input.gyro && Math.abs(input.gyro.gamma) > 0.8) {
      steer = Math.max(-1.0, Math.min(1.0, -input.gyro.gamma / 22.0));
    } else if (input.accel && Math.abs(input.accel.x) > 0.5) {
      steer = Math.max(-1.0, Math.min(1.0, -input.accel.x / 5.0));
    }

    // 2. Controller Buttons
    const mask = input.rawBitmask;
    if ((mask & BUTTON_MASKS.A) || input.isTriggerPressed) gas = true;
    if (mask & BUTTON_MASKS.B) brake = true;
    if (mask & (BUTTON_MASKS.PLUS | BUTTON_MASKS.DPAD_UP)) drift = true;
    if (mask & BUTTON_MASKS.BTN_1) boost = true;

    // 3. Desktop Keyboard Fallback
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) steer = -1.0;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) steer = 1.0;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) gas = true;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) brake = true;
    if (this.keysDown.has('Space')) drift = true;
    if (this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight')) boost = true;

    if (boost && this.physics.state.boostTimer <= 0) {
      this.physics.triggerBoost(1.4);
    }

    return { steer, gas, brake, drift, boost };
  }

  public render(): void {
    if (this.renderer && this.scene && this.chaseCam) {
      this.renderer.render(this.scene, this.chaseCam.camera);
    }
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public destroy(): void {
    this.options?.setLayoutMode?.('portrait');

    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);

    this.track.destroy();
    this.stadium.destroy();
    this.kartModel.destroy();
    this.hud.destroy();

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }
}
