/**
 * NimbusPlay — Standard Game Interface & Contracts
 * Every game module (Fruit Ninja, Alien Attack, Shooting Range, Sketch) implements IGame.
 * Strictly typed with zero `any`.
 */

export interface GameInputState {
  pointerX: number;       // Stage coordinate: 0 to width
  pointerY: number;       // Stage coordinate: 0 to height
  isSliceHeld: boolean;    // B button held (or left click held)
  isTriggerPressed: boolean; // Button pressed this frame
  rawBitmask: number;     // Active 12-bit button bitmask
  accel?: { x: number; y: number; z: number };             // Device linear + gravity acceleration (m/s^2)
  gyro?: { alpha: number; beta: number; gamma: number };    // Rotation rates (deg/s): yaw, pitch, roll
}

export interface GameOptions {
  width: number;
  height: number;
  sendHaptic: (pattern: number[]) => void;
  setLayoutMode?: (mode: 'portrait' | 'landscape') => void;
  onExitToMenu: () => void;
  onScoreUpdate?: (score: number) => void;
}

export interface IGame {
  readonly id: string;
  readonly title: string;
  init(container: HTMLElement, options: GameOptions): Promise<void>;
  update(input: GameInputState, dt: number): void;
  render(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}

