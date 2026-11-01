/**
 * NimbusPlay — Mobile Controller Device Immersion & System APIs
 * Manages Screen Wake Lock, Portrait Orientation Lock, Fullscreen and Haptics.
 * Strictly typed with zero `any`.
 */

interface CustomWakeLockSentinel {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
}

interface CustomWakeLock {
  request(type: 'screen'): Promise<CustomWakeLockSentinel>;
}

type ScreenOrientationLock = 
  | 'any' 
  | 'natural' 
  | 'landscape' 
  | 'portrait' 
  | 'portrait-primary' 
  | 'portrait-secondary' 
  | 'landscape-primary' 
  | 'landscape-secondary';

export class DeviceImmersion {
  private wakeLockSentinel: CustomWakeLockSentinel | null = null;
  private isWakeLockRequested = false;

  constructor() {
    // Re-acquire wake lock if page visibility returns
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isWakeLockRequested) {
        this.acquireWakeLock();
      }
    });
  }

  /**
   * Request full immersive mode on initial user gesture:
   * 1. Screen Wake Lock (keeps display active during gameplay)
   * 2. Orientation Lock to portrait
   * 3. HTML5 Fullscreen
   */
  public async activateImmersion(): Promise<void> {
    await this.acquireWakeLock();
    this.lockPortrait();
    await this.requestFullscreen();
  }

  /**
   * Request Screen Wake Lock API
   */
  public async acquireWakeLock(): Promise<boolean> {
    const nav = navigator as unknown as { wakeLock?: CustomWakeLock };
    if (nav.wakeLock && typeof nav.wakeLock.request === 'function') {
      try {
        this.isWakeLockRequested = true;
        this.wakeLockSentinel = await nav.wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
        return true;
      } catch (err) {
        console.warn('[Immersion] Wake Lock acquisition failed:', err);
      }
    }
    return false;
  }

  /**
   * Lock screen orientation to portrait
   */
  public lockPortrait(): void {
    const orientation = screen.orientation as unknown as {
      lock?: (orientation: ScreenOrientationLock) => Promise<void>;
    };

    if (orientation && typeof orientation.lock === 'function') {
      orientation.lock('portrait-primary').catch(() => {
        // Fallback to generic portrait if portrait-primary is not supported
        orientation.lock?.('portrait').catch((err) => {
          console.warn('[Immersion] Portrait orientation lock failed:', err);
        });
      });
    }
  }

  /**
   * Enter full screen
   */
  public async requestFullscreen(): Promise<boolean> {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        return true;
      } catch (err) {
        console.warn('[Immersion] Fullscreen request rejected:', err);
      }
    }
    return false;
  }

  /**
   * Trigger device vibration haptics
   */
  public vibrate(pattern: number | number[]): boolean {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      return navigator.vibrate(pattern);
    }
    return false;
  }
}
