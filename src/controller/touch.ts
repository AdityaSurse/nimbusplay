/**
 * NimbusPlay — Mobile Controller Multi-Touch & Button Management
 * Multi-touch safe with pointer ID tracking and bitmask generation.
 * Zero `any` types.
 */

import { BUTTON_MASKS } from '../shared/protocol.js';

export type ButtonName = 
  | 'a' 
  | 'b' 
  | 'dpadUp' 
  | 'dpadDown' 
  | 'dpadLeft' 
  | 'dpadRight' 
  | 'plus' 
  | 'minus' 
  | 'home' 
  | 'btn1' 
  | 'btn2' 
  | 'recenter';

export interface ButtonConfig {
  id: string;
  name: ButtonName;
  mask: number;
  hapticDuration: number;
}

const BUTTON_CONFIGS: ButtonConfig[] = [
  { id: 'btn-a', name: 'a', mask: BUTTON_MASKS.A, hapticDuration: 25 },
  { id: 'btn-trigger', name: 'b', mask: BUTTON_MASKS.B, hapticDuration: 40 },
  { id: 'dpad-up', name: 'dpadUp', mask: BUTTON_MASKS.DPAD_UP, hapticDuration: 18 },
  { id: 'dpad-down', name: 'dpadDown', mask: BUTTON_MASKS.DPAD_DOWN, hapticDuration: 18 },
  { id: 'dpad-left', name: 'dpadLeft', mask: BUTTON_MASKS.DPAD_LEFT, hapticDuration: 18 },
  { id: 'dpad-right', name: 'dpadRight', mask: BUTTON_MASKS.DPAD_RIGHT, hapticDuration: 18 },
  { id: 'btn-plus', name: 'plus', mask: BUTTON_MASKS.PLUS, hapticDuration: 20 },
  { id: 'btn-minus', name: 'minus', mask: BUTTON_MASKS.MINUS, hapticDuration: 20 },
  { id: 'btn-home', name: 'home', mask: BUTTON_MASKS.HOME, hapticDuration: 35 },
  { id: 'btn-1', name: 'btn1', mask: BUTTON_MASKS.BTN_1, hapticDuration: 22 },
  { id: 'btn-2', name: 'btn2', mask: BUTTON_MASKS.BTN_2, hapticDuration: 22 },
  { id: 'btn-recenter', name: 'recenter', mask: BUTTON_MASKS.RECENTER, hapticDuration: 30 },
  { id: 'btn-landscape-left-fire', name: 'a', mask: BUTTON_MASKS.A, hapticDuration: 25 },
  { id: 'btn-landscape-right-fire', name: 'b', mask: BUTTON_MASKS.B, hapticDuration: 25 },
  { id: 'btn-landscape-recenter', name: 'recenter', mask: BUTTON_MASKS.RECENTER, hapticDuration: 30 },
  { id: 'btn-landscape-home', name: 'home', mask: BUTTON_MASKS.HOME, hapticDuration: 35 }
];

export type ButtonChangeCallback = (bitmask: number, pressedButton: ButtonName | null) => void;
export type HapticTrigger = (durationMs: number) => void;

export class TouchInputManager {
  private activePointers = new Map<number, { mask: number; name: ButtonName; element: HTMLElement }>();
  private currentBitmask = 0;
  private onButtonChange: ButtonChangeCallback;
  private hapticTrigger: HapticTrigger;

  constructor(onButtonChange: ButtonChangeCallback, hapticTrigger: HapticTrigger) {
    this.onButtonChange = onButtonChange;
    this.hapticTrigger = hapticTrigger;
  }

  /**
   * Bind pointer events to all configured virtual controller buttons.
   */
  public bindButtons(): void {
    for (const config of BUTTON_CONFIGS) {
      const element = document.getElementById(config.id);
      if (!element) continue;

      element.addEventListener('pointerdown', (event: PointerEvent) => {
        event.preventDefault();
        event.stopPropagation();

        // Capture pointer so releasing outside element still releases the button cleanly
        try {
          element.setPointerCapture(event.pointerId);
        } catch {
          // ignore if unsupported
        }

        this.activePointers.set(event.pointerId, {
          mask: config.mask,
          name: config.name,
          element
        });

        element.classList.add('active-pressed');
        this.hapticTrigger(config.hapticDuration);
        this.recalculateBitmask(config.name);
      });

      const releaseHandler = (event: PointerEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const active = this.activePointers.get(event.pointerId);
        if (active) {
          active.element.classList.remove('active-pressed');
          try {
            active.element.releasePointerCapture(event.pointerId);
          } catch {
            // ignore
          }
          this.activePointers.delete(event.pointerId);
          this.recalculateBitmask(null);
        }
      };

      element.addEventListener('pointerup', releaseHandler);
      element.addEventListener('pointercancel', releaseHandler);
      element.addEventListener('pointerleave', (event: PointerEvent) => {
        // If not captured, release on pointerleave
        if (!element.hasPointerCapture(event.pointerId)) {
          releaseHandler(event);
        }
      });
    }
  }

  public getBitmask(): number {
    return this.currentBitmask;
  }

  public isPressed(mask: number): boolean {
    return (this.currentBitmask & mask) !== 0;
  }

  /**
   * Release all active button touches (e.g. when screen turns off or loses visibility)
   */
  public resetAll(): void {
    for (const entry of this.activePointers.values()) {
      entry.element.classList.remove('active-pressed');
    }
    this.activePointers.clear();
    this.currentBitmask = 0;
    this.onButtonChange(0, null);
  }

  private recalculateBitmask(lastPressedName: ButtonName | null): void {
    let mask = 0;
    for (const entry of this.activePointers.values()) {
      mask |= entry.mask;
    }
    this.currentBitmask = mask;
    this.onButtonChange(this.currentBitmask, lastPressedName);
  }
}

