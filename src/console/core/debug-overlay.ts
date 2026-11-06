/**
 * NimbusPlay — Console Live Sensor Debug Overlay
 * Ingests 60Hz CompactMotionPackets, displays telemetry, and tracks <30ms input latency.
 * Toggled with the 'D' key. Strictly typed with zero `any`. Target < 250 lines.
 */

import { BUTTON_MASKS, type CompactMotionPacket, type MotionInputFrame } from '../../shared/protocol.js';

export interface OverlayState {
  packetRateHz: number;
  totalPackets: number;
  rttMs: number;
  inputLatencyMs: number;
  transport: string;
  rotation: [number, number, number]; // [alpha, beta, gamma]
  accel: [number, number, number];    // [x, y, z]
  bitmask: number;
  ptr: [number, number, number, number]; // [fx, fy, rx, ry]
}

const BTN_DEFS: [string, string, number][] = [
  ['a', 'A', BUTTON_MASKS.A], ['b', 'B Trigger', BUTTON_MASKS.B],
  ['up', '↑ Up', BUTTON_MASKS.DPAD_UP], ['down', '↓ Down', BUTTON_MASKS.DPAD_DOWN],
  ['left', '← Left', BUTTON_MASKS.DPAD_LEFT], ['right', '→ Right', BUTTON_MASKS.DPAD_RIGHT],
  ['plus', '+ Plus', BUTTON_MASKS.PLUS], ['minus', '- Minus', BUTTON_MASKS.MINUS],
  ['home', 'Home', BUTTON_MASKS.HOME], ['1', '1', BUTTON_MASKS.BTN_1],
  ['2', '2', BUTTON_MASKS.BTN_2], ['recenter', 'Recenter', BUTTON_MASKS.RECENTER]
];

export class DebugOverlay {
  private containerEl: HTMLElement | null = null;
  private isVisible = false;
  private state: OverlayState = {
    packetRateHz: 0,
    totalPackets: 0,
    rttMs: 0,
    inputLatencyMs: 0,
    transport: 'WebSocket (relay)',
    rotation: [0, 0, 0],
    accel: [0, 0, 9.8],
    bitmask: 0,
    ptr: [960, 540, 960, 540]
  };

  private frameTimestamps: number[] = [];
  private rafId: number | null = null;
  private isDirty = false;

  constructor() {
    this.createDom();
    this.bindKeyboardShortcut();
    this.startRenderLoop();
  }

  public setTransport(transport: string): void {
    this.state.transport = transport;
    this.isDirty = true;
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    if (this.containerEl) {
      this.containerEl.style.display = this.isVisible ? 'flex' : 'none';
    }
    const boundsEl = document.getElementById('debug-clamp-bounds');
    if (boundsEl) boundsEl.style.display = this.isVisible ? 'block' : 'none';
  }

  public updatePointer(fx: number, fy: number, rx: number, ry: number): void {
    this.state.ptr = [fx, fy, rx, ry];
    this.isDirty = true;
  }

  public updateLatency(rttMs: number): void {
    this.state.rttMs = rttMs;
    // Input-to-cursor latency = one-way network delay (RTT / 2) + pipeline filter/render time (~2.5ms)
    this.state.inputLatencyMs = Math.max(4, Math.round(rttMs * 0.5 + 2.5));
    this.isDirty = true;
  }

  public ingestPacket(packet: CompactMotionPacket | MotionInputFrame): void {
    const now = performance.now();
    this.frameTimestamps.push(now);

    while (this.frameTimestamps.length > 0 && this.frameTimestamps[0] < now - 1000) {
      this.frameTimestamps.shift();
    }
    this.state.packetRateHz = this.frameTimestamps.length;
    this.state.totalPackets++;

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
          <div class="debug-metric-box">
            <span class="dbg-label">RTT Latency</span>
            <span id="dbg-rtt" class="dbg-value">-- ms</span>
          </div>
          <div class="debug-metric-box">
            <span class="dbg-label">Input-to-Cursor (<30ms)</span>
            <span id="dbg-input-lat" class="dbg-value" style="color: #34d399;">-- ms</span>
          </div>
          <div class="debug-metric-box" style="grid-column: span 2;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="dbg-label">Stream Status & Transport</span>
              <span id="dbg-transport" style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">WebSocket</span>
            </div>
            <span id="dbg-packets" class="dbg-value" style="font-size: 13px; font-weight: 600;">0 pkts</span>
          </div>
          <div class="debug-metric-box" style="grid-column: span 2;">
            <span class="dbg-label">Pointer & Clamp Bounds (1920×1080)</span>
            <span id="dbg-ptr-info" class="dbg-value" style="font-size: 11px; font-weight: 700; color: #facc15;">
              Pos: (960, 540) | Raw: (960, 540) | Bounds: [0, 1920]×[0, 1080]
            </span>
          </div>

          <div class="debug-section-full">
            <span class="dbg-label">Gyroscope (deg/s): Yaw (α), Pitch (β), Roll (γ)</span>
            ${['a', 'b', 'c'].map((ax, idx) => `
              <div class="dbg-axis-row">
                <span class="axis-tag">${['α', 'β', 'γ'][idx]}</span>
                <span id="dbg-gyro-${ax}" class="axis-num">0.00</span>
                <div class="axis-track"><div id="dbg-bar-gyro-${ax}" class="axis-fill"></div></div>
              </div>
            `).join('')}
          </div>

          <div class="debug-section-full">
            <span class="dbg-label">Acceleration (m/s²): X, Y, Z</span>
            ${['x', 'y', 'z'].map((ax) => `
              <div class="dbg-axis-row">
                <span class="axis-tag">${ax.toUpperCase()}</span>
                <span id="dbg-acc-${ax}" class="axis-num">0.00</span>
                <div class="axis-track"><div id="dbg-bar-acc-${ax}" class="axis-fill"></div></div>
              </div>
            `).join('')}
          </div>

          <div class="debug-section-full">
            <span class="dbg-label">Active Virtual Buttons (Bitmask: <span id="dbg-bitmask">0</span>)</span>
            <div class="dbg-button-matrix">
              ${BTN_DEFS.map(([id, label]) => `<span id="btn-ind-${id}" class="dbg-btn-pill">${label}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(el);
    this.containerEl = el;
  }

  private startRenderLoop(): void {
    const loop = () => {
      if (this.isVisible && this.isDirty) {
        this.render();
        this.isDirty = false;
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private render(): void {
    const [a, b, c] = this.state.rotation;
    const [x, y, z] = this.state.accel;
    const mask = this.state.bitmask;

    const elHz = document.getElementById('dbg-hz-pill');
    const elRtt = document.getElementById('dbg-rtt');
    const elInputLat = document.getElementById('dbg-input-lat');
    const elPackets = document.getElementById('dbg-packets');
    const elBitmask = document.getElementById('dbg-bitmask');
    const elPtr = document.getElementById('dbg-ptr-info');
    const elTransport = document.getElementById('dbg-transport');

    if (elTransport) elTransport.textContent = this.state.transport;
    if (elHz) elHz.textContent = `${this.state.packetRateHz} Hz`;
    if (elRtt) elRtt.textContent = `${this.state.rttMs} ms`;
    if (elInputLat) {
      const lat = this.state.inputLatencyMs;
      elInputLat.textContent = `${lat} ms ${lat <= 30 ? '[OK]' : '[HIGH]'}`;
      elInputLat.style.color = lat <= 30 ? '#34d399' : '#f59e0b';
    }
    if (elPackets) elPackets.textContent = `${this.state.totalPackets} pkts (${this.state.packetRateHz >= 55 ? '60Hz Link' : 'Syncing'})`;
    if (elBitmask) elBitmask.textContent = mask.toString(2).padStart(12, '0');
    if (elPtr) {
      const [fx, fy, rx, ry] = this.state.ptr;
      elPtr.textContent = `Pos: (${Math.round(fx)}, ${Math.round(fy)}) | Raw: (${Math.round(rx)}, ${Math.round(ry)}) | Bounds: [0, 1920]×[0, 1080]`;
    }

    this.updateAxis('dbg-gyro-a', 'dbg-bar-gyro-a', a, 180);
    this.updateAxis('dbg-gyro-b', 'dbg-bar-gyro-b', b, 180);
    this.updateAxis('dbg-gyro-c', 'dbg-bar-gyro-c', c, 180);

    this.updateAxis('dbg-acc-x', 'dbg-bar-acc-x', x, 20);
    this.updateAxis('dbg-acc-y', 'dbg-bar-acc-y', y, 20);
    this.updateAxis('dbg-acc-z', 'dbg-bar-acc-z', z, 20);

    for (const [id, , m] of BTN_DEFS) {
      const pill = document.getElementById(`btn-ind-${id}`);
      if (pill) pill.classList.toggle('active', (mask & m) !== 0);
    }
  }

  private updateAxis(valId: string, barId: string, val: number, maxLimit: number): void {
    const valEl = document.getElementById(valId);
    const barEl = document.getElementById(barId);
    if (valEl) valEl.textContent = val.toFixed(2);
    if (barEl) {
      const pct = Math.min(Math.max((val / maxLimit) * 50, -50), 50);
      barEl.style.left = pct >= 0 ? '50%' : `${50 + pct}%`;
      barEl.style.width = `${Math.abs(pct)}%`;
      barEl.style.background = pct >= 0 ? '#38bdf8' : '#f43f5e';
    }
  }

  public destroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.containerEl) this.containerEl.remove();
  }
}
