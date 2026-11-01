/**
 * NimbusPlay — Mobile Controller Motion Sensor Subsystem
 * Ingests gyroscope and accelerometer telemetry at 60Hz.
 * Strictly typed with zero `any` types.
 */

export type SensorStatus = 'standby' | 'active' | 'no-sensor-data' | 'denied' | 'unsupported';

export interface SensorTelemetry {
  rotationRate: {
    alpha: number; // yaw rate (deg/s)
    beta: number;  // pitch rate (deg/s)
    gamma: number; // roll rate (deg/s)
  };
  acceleration: {
    x: number; // m/s^2 including gravity
    y: number;
    z: number;
  };
}

export type SensorStatusCallback = (status: SensorStatus, detail?: string) => void;

interface DeviceMotionEventWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

interface GenericGyroscope {
  x: number;
  y: number;
  z: number;
  addEventListener(type: 'reading' | 'error', listener: () => void): void;
  start(): void;
  stop(): void;
}

interface GenericAccelerometer {
  x: number;
  y: number;
  z: number;
  addEventListener(type: 'reading' | 'error', listener: () => void): void;
  start(): void;
  stop(): void;
}

export class SensorManager {
  private status: SensorStatus = 'standby';
  private onStatusChange: SensorStatusCallback;
  private telemetry: SensorTelemetry = {
    rotationRate: { alpha: 0, beta: 0, gamma: 0 },
    acceleration: { x: 0, y: 0, z: 9.8 }
  };
  private hasReceivedValidData = false;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private isListening = false;

  // Generic Sensor API fallbacks
  private genericGyro: GenericGyroscope | null = null;
  private genericAccel: GenericAccelerometer | null = null;

  constructor(onStatusChange: SensorStatusCallback) {
    this.onStatusChange = onStatusChange;
  }

  public getTelemetry(): Readonly<SensorTelemetry> {
    return this.telemetry;
  }

  public getStatus(): SensorStatus {
    return this.status;
  }

  /**
   * Request sensor permissions if required (iOS 13+) and register listeners.
   */
  public async start(): Promise<boolean> {
    if (this.isListening) return true;

    // 1. Permission check for iOS Safari
    const dme = DeviceMotionEvent as unknown as DeviceMotionEventWithPermission;
    if (typeof dme.requestPermission === 'function') {
      try {
        const permission = await dme.requestPermission();
        if (permission !== 'granted') {
          this.setStatus('denied', 'Motion permission denied by user');
          return false;
        }
      } catch (err) {
        this.setStatus('denied', err instanceof Error ? err.message : String(err));
        return false;
      }
    }

    // 2. Register DeviceMotionEvent listener
    if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', this.handleDeviceMotion, { passive: true });
      this.isListening = true;
      this.setStatus('active', 'Listening for devicemotion');

      // Set a watchdog to detect if sensor hardware returns null or no data
      this.armWatchdog();
      return true;
    }

    // 3. Fallback to Generic Sensor API
    const startedFallback = this.tryStartGenericSensors();
    if (startedFallback) {
      this.isListening = true;
      this.setStatus('active', 'Using Generic Sensor API fallback');
      this.armWatchdog();
      return true;
    }

    this.setStatus('unsupported', 'No motion sensor APIs available');
    return false;
  }

  public stop(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    if (this.isListening) {
      window.removeEventListener('devicemotion', this.handleDeviceMotion);
      this.isListening = false;
    }

    if (this.genericGyro) {
      try { this.genericGyro.stop(); } catch { /* ignore */ }
      this.genericGyro = null;
    }

    if (this.genericAccel) {
      try { this.genericAccel.stop(); } catch { /* ignore */ }
      this.genericAccel = null;
    }

    this.hasReceivedValidData = false;
    this.setStatus('standby', 'Sensors stopped');
  }

  private handleDeviceMotion = (event: DeviceMotionEvent): void => {
    let gotData = false;

    // Gyroscope rotation rate (deg/s)
    if (event.rotationRate) {
      const alpha = event.rotationRate.alpha;
      const beta = event.rotationRate.beta;
      const gamma = event.rotationRate.gamma;

      if (alpha !== null || beta !== null || gamma !== null) {
        this.telemetry.rotationRate.alpha = alpha ?? 0;
        this.telemetry.rotationRate.beta = beta ?? 0;
        this.telemetry.rotationRate.gamma = gamma ?? 0;
        gotData = true;
      }
    }

    // Acceleration with gravity (m/s^2)
    const accel = event.accelerationIncludingGravity || event.acceleration;
    if (accel) {
      const x = accel.x;
      const y = accel.y;
      const z = accel.z;

      if (x !== null || y !== null || z !== null) {
        this.telemetry.acceleration.x = x ?? 0;
        this.telemetry.acceleration.y = y ?? 0;
        this.telemetry.acceleration.z = z ?? 9.8;
        gotData = true;
      }
    }

    if (gotData && !this.hasReceivedValidData) {
      this.hasReceivedValidData = true;
      if (this.watchdogTimer) {
        clearTimeout(this.watchdogTimer);
        this.watchdogTimer = null;
      }
      this.setStatus('active', 'Receiving real-time motion events');
    }
  };

  private tryStartGenericSensors(): boolean {
    const win = window as unknown as {
      Gyroscope?: new (options?: { frequency: number }) => GenericGyroscope;
      Accelerometer?: new (options?: { frequency: number }) => GenericAccelerometer;
    };

    if (typeof win.Gyroscope === 'function' && typeof win.Accelerometer === 'function') {
      try {
        const gyro = new win.Gyroscope({ frequency: 60 });
        gyro.addEventListener('reading', () => {
          this.telemetry.rotationRate.alpha = gyro.z * (180 / Math.PI);
          this.telemetry.rotationRate.beta = gyro.x * (180 / Math.PI);
          this.telemetry.rotationRate.gamma = gyro.y * (180 / Math.PI);
          if (!this.hasReceivedValidData) {
            this.hasReceivedValidData = true;
            this.setStatus('active', 'Generic Gyroscope active');
          }
        });
        gyro.start();
        this.genericGyro = gyro;

        const accel = new win.Accelerometer({ frequency: 60 });
        accel.addEventListener('reading', () => {
          this.telemetry.acceleration.x = accel.x;
          this.telemetry.acceleration.y = accel.y;
          this.telemetry.acceleration.z = accel.z;
        });
        accel.start();
        this.genericAccel = accel;

        return true;
      } catch (err) {
        console.warn('[Sensors] Generic Sensor API initialization failed:', err);
      }
    }
    return false;
  }

  private armWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
    }
    // If no valid data is registered within 1.2s, notify 'no-sensor-data'
    this.watchdogTimer = setTimeout(() => {
      if (!this.hasReceivedValidData) {
        this.setStatus('no-sensor-data', 'Hardware not reporting motion coordinates');
      }
    }, 1200);
  }

  private setStatus(newStatus: SensorStatus, detail?: string): void {
    this.status = newStatus;
    this.onStatusChange(newStatus, detail);
  }
}

