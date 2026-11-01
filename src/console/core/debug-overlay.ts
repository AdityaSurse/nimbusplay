/**
 * NimbusPlay — Console Live Sensor Debug Overlay
 * Ingests 60Hz CompactMotionPackets and renders high-frequency telemetry.
 * Toggled with the 'D' key. Strictly typed with zero `any`.
 */

import { BUTTON_MASKS, type CompactMotionPacket, type MotionInputFrame } from '../../shared/protocol.js';

export interface OverlayState {
  isVisible: boolean;
  packetRateHz: number;
  totalPackets: number;
  rttMs: number;
  rotation: [number, number, number]; // [alpha, beta, gamma]
  accel: [number, number, number];    // [x, y, z]
  bitmask: number;
  lastPacketTime: number;
}

export class DebugOverlay {
  private containerEl: HTMLElement | null = null;
  private isVisible = false;
  private state: OverlayState = {
    isVisible: false,
    packetRateHz: 0,
    totalPackets: 0,
    rttMs: 0,
    rotation: [0, 0, 0],
    accel: [0, 0, 9.8],
    bitmask: 0,
    lastPacketTime: 0
  };

  // FPS/Hz rate calculation window
  private frameTimestamps: number[] = [];
  private rafId: number | null = null;
  private isDirty = false;

  constructor() {
    this.createDom();
    this.bindKeyboardShortcut();
    this.startRenderLoop();
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    if (this.containerEl) {
      this.containerEl.style.display = this.isVisible ? 'flex' : 'none';
    }
  }

  public updateLatency(rttMs: number): void {
    this.state.rttMs = rttMs;
    this.isDirty = true;
  }

  public ingestPacket(packet: CompactMotionPacket | MotionInputFrame): void {
    const now = performance.now();
    this.frameTimestamps.push(now);

    // Keep timestamps from the last 1000ms
    while (this.frameTimestamps.length > 0 && this.frameTimestamps[0] < now - 1000) {
      this.frameTimestamps.shift();
    }
    this.state.packetRateHz = this.frameTimestamps.length;
    this.state.totalPackets++;
    this.state.lastPacketTime = Date.now();

    if ('t' in packet && packet.t === 'F') {
      const compact = packet as CompactMotionPacket;
      this.state.rotation = [...compact.r];
      this.state.accel = [...compact.a];
      this.state.bitmask = compact.b;
    } else if ('buttons' in packet) {
      const frame = packet as MotionInputFrame;
      this.state.rotation = [frame.rotationRate.alpha, frame.rotationRate.beta, frame.rotationRate.gamma];
      this.state.accel = [frame.acceleration.x, frame.acceleration.y, frame.acceleration.z];

      let mask = 0;
      if (frame.buttons.a) mask |= BUTTON_MASKS.A;
      if (frame.buttons.b) mask |= BUTTON_MASKS.B;
      if (frame.buttons.dpadUp) mask |= BUTTON_MASKS.DPAD_UP;
      if (frame.buttons.dpadDown) mask |= BUTTON_MASKS.DPAD_DOWN;
      if (frame.buttons.dpadLeft) mask |= BUTTON_MASKS.DPAD_LEFT;
      if (frame.buttons.dpadRight) mask |= BUTTON_MASKS.DPAD_RIGHT;
      if (frame.buttons.plus) mask |= BUTTON_MASKS.PLUS;
      if (frame.buttons.minus) mask |= BUTTON_MASKS.MINUS;
      if (frame.buttons.home) mask |= BUTTON_MASKS.HOME;
      if (frame.buttons.btn1) mask |= BUTTON_MASKS.BTN_1;
      if (frame.buttons.btn2) mask |= BUTTON_MASKS.BTN_2;
      this.state.bitmask = mask;
    }

    this.isDirty = true;
  }

  public getBitmask(): number {
    return this.state.bitmask;
  }

  private bindKeyboardShortcut(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Toggle on 'd' or 'D', except when typing in input
      if ((e.key === 'd' || e.key === 'D') && (e.target as HTMLElement).tagName !== 'INPUT') {
        this.toggle();
      }
    });
  }

  private createDom(): void {
    const el = document.createElement('div');
    el.id = 'sensor-debug-overlay';
    el.style.display = 'none';
    el.innerHTML = `
      <div class="debug-overlay-card">
        <div class="debug-overlay-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="debug-pulse-dot"></span>
            <span style="font-weight: 800; font-size: 13px; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.08em;">
              Wand Sensor Telemetry [D]
            </span>
          </div>
          <span id="dbg-hz-pill" class="debug-hz-pill">0 Hz</span>
        </div>

        <div class="debug-grid">
          <!-- Latency & Stream Metrics -->
          <div class="debug-metric-box">
            <span class="dbg-label">RTT Latency</span>
            <span id="dbg-rtt" class="dbg-value">-- ms</span>
          </div>
          <div class="debug-metric-box">
            <span class="dbg-label">Packet Count</span>
            <span id="dbg-packets" class="dbg-value">0</span>
          </div>

          <!-- Gyroscope Angular Velocity (deg/s) -->
          <div class="debug-section-full">
            <span class="dbg-label">Gyroscope (deg/s): Yaw (α), Pitch (β), Roll (γ)</span>
            <div class="dbg-axis-row">
              <span class="axis-tag">α</span>
              <span id="dbg-gyro-a" class="axis-num">0.00</span>
              <div class="axis-track"><div id="dbg-bar-gyro-a" class="axis-fill"></div></div>
            </div>
            <div class="dbg-axis-row">
              <span class="axis-tag">β</span>
              <span id="dbg-gyro-b" class="axis-num">0.00</span>
              <div class="axis-track"><div id="dbg-bar-gyro-b" class="axis-fill"></div></div>
            </div>
            <div class="dbg-axis-row">
              <span class="axis-tag">γ</span>
              <span id="dbg-gyro-c" class="axis-num">0.00</span>
              <div class="axis-track"><div id="dbg-bar-gyro-c" class="axis-fill"></div></div>
            </div>
          </div>

          <!-- Accelerometer with Gravity (m/s^2) -->
          <div class="debug-section-full">
            <span class="dbg-label">Acceleration (m/s²): X, Y, Z</span>
            <div class="dbg-axis-row">
              <span class="axis-tag">X</span>
              <span id="dbg-acc-x" class="axis-num">0.00</span>
              <div class="axis-track"><div id="dbg-bar-acc-x" class="axis-fill"></div></div>
            </div>
            <div class="dbg-axis-row">
              <span class="axis-tag">Y</span>
              <span id="dbg-acc-y" class="axis-num">0.00</span>
              <div class="axis-track"><div id="dbg-bar-acc-y" class="axis-fill"></div></div>
            </div>
            <div class="dbg-axis-row">
              <span class="axis-tag">Z</span>
              <span id="dbg-acc-z" class="axis-num">9.80</span>
              <div class="axis-track"><div id="dbg-bar-acc-z" class="axis-fill"></div></div>
            </div>
          </div>

          <!-- Live Multi-Touch Button Pad Matrix -->
          <div class="debug-section-full">
            <span class="dbg-label">Active Virtual Buttons (Bitmask: <span id="dbg-bitmask">0</span>)</span>
            <div class="dbg-button-matrix">
              <span id="btn-ind-a" class="dbg-btn-pill">A</span>
              <span id="btn-ind-b" class="dbg-btn-pill">B Trigger</span>
              <span id="btn-ind-up" class="dbg-btn-pill">↑ Up</span>
              <span id="btn-ind-down" class="dbg-btn-pill">↓ Down</span>
              <span id="btn-ind-left" class="dbg-btn-pill">← Left</span>
              <span id="btn-ind-right" class="dbg-btn-pill">→ Right</span>
              <span id="btn-ind-plus" class="dbg-btn-pill">+ Plus</span>
              <span id="btn-ind-minus" class="dbg-btn-pill">- Minus</span>
              <span id="btn-ind-home" class="dbg-btn-pill">Home</span>
              <span id="btn-ind-1" class="dbg-btn-pill">1</span>
              <span id="btn-ind-2" class="dbg-btn-pill">2</span>
              <span id="btn-ind-recenter" class="dbg-btn-pill">Recenter</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(el);
    this.containerEl = el;
  }

  private startRenderLoop(): void {
    const tick = () => {
      if (this.isVisible && this.isDirty) {
        this.renderDom();
        this.isDirty = false;
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private renderDom(): void {
    if (!this.containerEl) return;

    const [a, b, c] = this.state.rotation;
    const [x, y, z] = this.state.accel;
    const mask = this.state.bitmask;

    const elHz = document.getElementById('dbg-hz-pill');
    const elRtt = document.getElementById('dbg-rtt');
    const elPackets = document.getElementById('dbg-packets');
    const elBitmask = document.getElementById('dbg-bitmask');

    if (elHz) elHz.textContent = `${this.state.packetRateHz} Hz`;
    if (elRtt) elRtt.textContent = `${this.state.rttMs} ms`;
    if (elPackets) elPackets.textContent = this.state.totalPackets.toString();
    if (elBitmask) elBitmask.textContent = mask.toString(2).padStart(12, '0');

    this.updateAxis('dbg-gyro-a', 'dbg-bar-gyro-a', a, 180);
    this.updateAxis('dbg-gyro-b', 'dbg-bar-gyro-b', b, 180);
    this.updateAxis('dbg-gyro-c', 'dbg-bar-gyro-c', c, 180);

    this.updateAxis('dbg-acc-x', 'dbg-bar-acc-x', x, 20);
    this.updateAxis('dbg-acc-y', 'dbg-bar-acc-y', y, 20);
    this.updateAxis('dbg-acc-z', 'dbg-bar-acc-z', z, 20);

    this.updateButtonPill('btn-ind-a', mask & BUTTON_MASKS.A);
    this.updateButtonPill('btn-ind-b', mask & BUTTON_MASKS.B);
    this.updateButtonPill('btn-ind-up', mask & BUTTON_MASKS.DPAD_UP);
    this.updateButtonPill('btn-ind-down', mask & BUTTON_MASKS.DPAD_DOWN);
    this.updateButtonPill('btn-ind-left', mask & BUTTON_MASKS.DPAD_LEFT);
    this.updateButtonPill('btn-ind-right', mask & BUTTON_MASKS.DPAD_RIGHT);
    this.updateButtonPill('btn-ind-plus', mask & BUTTON_MASKS.PLUS);
    this.updateButtonPill('btn-ind-minus', mask & BUTTON_MASKS.MINUS);
    this.updateButtonPill('btn-ind-home', mask & BUTTON_MASKS.HOME);
    this.updateButtonPill('btn-ind-1', mask & BUTTON_MASKS.BTN_1);
    this.updateButtonPill('btn-ind-2', mask & BUTTON_MASKS.BTN_2);
    this.updateButtonPill('btn-ind-recenter', mask & BUTTON_MASKS.RECENTER);
  }

  private updateAxis(valId: string, barId: string, val: number, maxLimit: number): void {
    const valEl = document.getElementById(valId);
    const barEl = document.getElementById(barId);
    if (valEl) valEl.textContent = val.toFixed(2);
    if (barEl) {
      const pct = Math.min(Math.max((val / maxLimit) * 50, -50), 50);
      if (pct >= 0) {
        barEl.style.left = '50%';
        barEl.style.width = `${pct}%`;
        barEl.style.background = '#38bdf8';
      } else {
        barEl.style.left = `${50 + pct}%`;
        barEl.style.width = `${-pct}%`;
        barEl.style.background = '#f43f5e';
      }
    }
  }

  private updateButtonPill(id: string, isPressed: number): void {
    const el = document.getElementById(id);
    if (!el) return;
    if (isPressed) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.containerEl) {
      this.containerEl.remove();
    }
  }
}

