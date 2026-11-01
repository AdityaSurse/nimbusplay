# NimbusPlay — System Architecture & Technical Specifications

This document defines the technical architecture, mathematical models, module boundaries, and TypeScript interfaces for the **NimbusPlay** console system.

---

## 1. Architectural Overview & Design Tenets

NimbusPlay decouples the physical input hardware from the display terminal using modern web standards:
1. **Host Terminal (Console)**: A desktop browser running Vite, rendering the domestic Wii-inspired channel hub via plain DOM/CSS and hardware-accelerated games via PixiJS.
2. **Motion Input Terminal (Controller)**: An Android smartphone running Chrome, capturing hardware inertial measurements (`DeviceMotionEvent`) and multitouch interactions, streaming them at 60Hz.
3. **Local Mesh Transport (Relay)**: A lightweight Node.js WebSocket relay bridging the controller and console over the local Wi-Fi subnet with sub-10ms packet transport.

```
+----------------------------------------------------------------------------------+
|                              LOCAL WI-FI NETWORK                                 |
|                                                                                  |
|  +-------------------------+             +------------------------------------+  |
|  |     Android Phone       |   HTTPS     |       Laptop / Workstation         |  |
|  |  (Chrome 110+ Mobile)   |<===========>|  Vite Dev Server (Port 5173/HTTPS) |  |
|  |                         |  Web Assets |  + basic-ssl self-signed cert     |  |
|  |  [Touch Screen Buttons] |             +-----------------+------------------+  |
|  |  [Gyro & Accelerometer] |                               |                      |
|  +------------+------------+                               | Proxy /ws            |
|               |                                            v                      |
|               | Secure WebSocket (WSS)            +-----------------+             |
|               +==================================>| Node WS Relay   |             |
|                               <===================| (Port 3001)     |             |
|                                                   +--------+--------+             |
|                                                            |                      |
|                                                            | Loopback WS          |
|                                                            v                      |
|                                                   +-----------------+             |
|                                                   | Console Client  |             |
|                                                   | (Desktop Tab)   |             |
|                                                   | - Pointer Eng.  |             |
|                                                   | - Channel Shell |             |
|                                                   | - PixiJS Games  |             |
|                                                   | - Web Audio     |             |
|                                                   +-----------------+             |
+----------------------------------------------------------------------------------+
```

---

## 2. Complete TypeScript Message Protocol & Types

All WebSocket communication uses structured, strongly typed JSON payloads. Every message contains a `type` discriminator, a monotonic `seq` number, and a `timestamp` in milliseconds.

```ts
/**
 * Room and Pairing Protocol
 */
export type ClientRole = 'console' | 'controller';

export interface BaseMessage {
  type: string;
  seq: number;
  timestamp: number;
}

export interface JoinRoomRequest extends BaseMessage {
  type: 'JOIN_ROOM';
  role: ClientRole;
  roomId: string; // 4-character alphanumeric uppercase code, e.g. "NX82"
}

export interface JoinRoomAck extends BaseMessage {
  type: 'JOIN_ROOM_ACK';
  success: boolean;
  roomId: string;
  assignedRole: ClientRole;
  peerConnected: boolean;
  error?: string;
}

export interface PeerStatusUpdate extends BaseMessage {
  type: 'PEER_STATUS';
  peerRole: ClientRole;
  status: 'connected' | 'disconnected';
  batteryLevel?: number; // 0.0 to 1.0
}

export interface PingMessage extends BaseMessage {
  type: 'PING';
}

export interface PongMessage extends BaseMessage {
  type: 'PONG';
  clientTimestamp: number;
}

/**
 * Controller Hardware Input Payload
 */
export interface ControllerButtonState {
  a: boolean;       // Primary trigger / select (front face)
  b: boolean;       // Underside trigger (index finger)
  dpadUp: boolean;
  dpadDown: boolean;
  dpadLeft: boolean;
  dpadRight: boolean;
  plus: boolean;    // + button
  minus: boolean;   // - button
  home: boolean;    // Home overlay menu
  btn1: boolean;    // 1 button
  btn2: boolean;    // 2 button
}

export interface RotationRateDegPerSec {
  alpha: number; // Z-axis rotation rate (yaw / heading change)
  beta: number;  // X-axis rotation rate (pitch / tilt forward-back)
  gamma: number; // Y-axis rotation rate (roll / tilt lateral)
}

export interface AccelerationMPerSec2 {
  x: number;     // Lateral linear acceleration
  y: number;     // Longitudinal linear acceleration
  z: number;     // Normal linear acceleration
}

export interface MotionInputFrame extends BaseMessage {
  type: 'INPUT_FRAME';
  roomId: string;
  buttons: ControllerButtonState;
  rotationRate: RotationRateDegPerSec;
  acceleration: AccelerationMPerSec2;
  accelerationIncludingGravity: AccelerationMPerSec2;
  interval: number; // Sensor sampling interval in milliseconds (~16.6ms for 60Hz)
}

/**
 * Control and Command Payloads
 */
export interface RecenterCommand extends BaseMessage {
  type: 'COMMAND_RECENTER';
}

export interface HapticFeedbackCommand extends BaseMessage {
  type: 'COMMAND_HAPTIC';
  pattern: number[]; // Vibration pulse duration array in ms, e.g. [40, 20, 40]
}

export interface CalibrationStartRequest extends BaseMessage {
  type: 'CALIBRATION_START';
}

export interface CalibrationOffsetUpdate extends BaseMessage {
  type: 'CALIBRATION_OFFSET';
  offsetBeta: number;
  offsetGamma: number;
}

/**
 * Union of all network messages
 */
export type NimbusNetworkMessage =
  | JoinRoomRequest
  | JoinRoomAck
  | PeerStatusUpdate
  | PingMessage
  | PongMessage
  | MotionInputFrame
  | RecenterCommand
  | HapticFeedbackCommand
  | CalibrationStartRequest
  | CalibrationOffsetUpdate;
```

---

## 3. Mathematical Models: Motion Sensor Pipeline & Pointer Tracking

### 3.1 Gyroscopic Angular Integration
An Android phone pointing forward in landscape or portrait orientation produces angular velocities ($\omega_\beta, \omega_\gamma, \omega_\alpha$) via `DeviceMotionEvent.rotationRate`.

To track the on-screen pointer:
1. **Delta Angle Calculation**:
   $$\Delta \theta_x = -\omega_\alpha \cdot \Delta t \quad (\text{or } \omega_\gamma \text{ depending on phone hold orientation})$$
   $$\Delta \theta_y = -\omega_\beta \cdot \Delta t$$
2. **Deadzone Filtering**:
   If $|\omega| < \tau_{\text{deadzone}}$ (where $\tau_{\text{deadzone}} \approx 0.6^\circ/\text{s}$), $\omega \leftarrow 0$. This stops resting jitter caused by hand micro-tremors and sensor thermal noise.

### 3.2 One Euro ($1€$) Adaptive Filter
To eliminate jitter at rest while preserving instantaneous response during rapid swipes, the coordinates pass through a dual low-pass filter with a dynamic cutoff frequency:

1. **Exponential Smoothing**:
   $$\hat{X}_k = \alpha \cdot X_k + (1 - \alpha) \cdot \hat{X}_{k-1}$$
   where:
   $$\alpha = \frac{1}{1 + \frac{\tau}{\Delta t}} = \frac{1}{1 + \frac{1}{2\pi f_c \Delta t}}$$

2. **Dynamic Cutoff Frequency ($f_c$)**:
   The derivative (speed of movement $\dot{X}_k$) is computed:
   $$\dot{X}_k = \frac{X_k - \hat{X}_{k-1}}{\Delta t}$$
   $$\hat{\dot{X}}_k = \alpha_d \cdot \dot{X}_k + (1 - \alpha_d) \cdot \hat{\dot{X}}_{k-1}$$
   Then the position filter cutoff adjusts dynamically:
   $$f_c = f_{c,\min} + \beta \cdot |\hat{\dot{X}}_k|$$

**Filter Parameters**:
- $f_{c,\min} = 1.0 \text{ Hz}$: High smoothing when the pointer is stationary (eliminates button click twitch).
- $\beta = 0.007$: Aggressive lag suppression when speed increases (zero perceived latency on fast swipes).
- $f_{c,\text{deriv}} = 1.0 \text{ Hz}$: Smoothing factor for velocity calculation.

### 3.3 Screen Transformation, Sensitivity & Clamp
$$P_{x,\text{new}} = P_{x,\text{prev}} + \Delta \theta_x \cdot S_x$$
$$P_{y,\text{new}} = P_{y,\text{prev}} + \Delta \theta_y \cdot S_y$$
$$P_x = \text{clamp}(P_{x,\text{new}}, 0, W_{\text{viewport}})$$
$$P_y = \text{clamp}(P_{y,\text{new}}, 0, H_{\text{viewport}})$$

Where $S_x, S_y$ are pixel-per-degree sensitivity scalers calibrated for 1080p/4K display aspect ratios.

---

## 4. Module Decomposition & Responsibilities

### 4.1 Server Relay (`server/relay.ts`)
- Standalone Node.js process using native `ws`.
- Maintains an in-memory map of active rooms: `Map<string, RoomSession>`.
- `RoomSession` holds two sockets: `consoleSocket` and `controllerSocket`.
- Relays incoming `INPUT_FRAME` packets directly from controller to console without serialization mutation.
- Handles heartbeats: terminates orphaned rooms if ping times out after 10 seconds.

### 4.2 Controller Web Application (`src/controller/`)
- Pure HTML5/TypeScript client running in Android Chrome.
- **Sensor Listener**:
  - Registers `window.addEventListener('devicemotion', handleMotion, { passive: true })`.
  - Captures `event.rotationRate` and `event.acceleration`.
  - Normalizes coordinate signs based on screen orientation lock (`screen.orientation.lock('portrait-primary')`).
- **Touch Pad Surface**:
  - High-contrast ergonomic buttons matching a console wand: Large **A** button on front face, **B** trigger on reverse/bottom, directional D-pad, **Home**, **+**, **-**, **1**, **2**.
  - Multitouch handling via `pointerdown`, `pointerup`, `pointercancel` with `preventDefault()` to block zooming/scrolling.
  - Haptic feedback trigger on touch start: `navigator.vibrate(25)`.
- **System Services**:
  - `navigator.wakeLock.request('screen')`: Keeps the screen awake during gameplay.
  - Fullscreen API: `document.documentElement.requestFullscreen()`.

### 4.3 Console Core & Pointer Engine (`src/console/pointer/`)
- Ingests `INPUT_FRAME` packets from WebSocket.
- Integrates gyro velocities, applies the $1€$ filter, scales to viewport resolution.
- Renders the custom SVG pointer cursor (`design/console_hand_pointer.svg`) using GPU-accelerated CSS transforms (`transform: translate3d(...)`).
- Triggers virtual DOM pointer events (`pointermove`, `pointerdown`, `pointerup`) on elements directly beneath the pointer cursor coordinates using `document.elementFromPoint(x, y)`.

### 4.4 Console Shell UI (`src/console/ui/`)
- Replicates the authentic late-2000s domestic console interface:
  - **4×3 Grid Matrix**: 12 channel slots with 16:9 aspect ratio and rounded ceramic borders.
  - **Animated Specular Highlights**: Diagonal white sheens and glowing cyan focus borders.
  - **Pagination Wings**: Smooth lateral scrolling between channel pages via directional bumpers.
  - **System Tray**: Sculpted bottom dock housing circular Disks (Settings, Message Board) and real-time clock.
  - **Channel Launch Dialog**: Modal window presenting game banner, description, and "Start" / "Back" pill actions.
  - **Home Overlay Menu**: Semi-transparent modal pausing gameplay and offering "Nimbus Menu", "Reset", and "Controller Settings".

### 4.5 Web Audio Synthesis Engine (`src/console/audio/`)
- Procedural sound generation without audio files:
  - **UI Chirp (Hover)**: Triangle oscillator at 880Hz, 35ms envelope with exponential gain decay.
  - **UI Click (Select)**: Sine wave sweeping 1100Hz $\to$ 550Hz over 45ms.
  - **Channel Launch Chime**: Dual chord (E5 659.25Hz + B5 987.77Hz) with light harmonic delay.
  - **Sword Slice**: High-pass filtered white noise burst (cutoff 3500Hz) with 120ms exponential decay.
  - **Laser Blaster**: Square wave with sharp pitch modulation (2000Hz $\to$ 180Hz) over 70ms.
  - **Pin Strike**: 3 layered decaying square/triangle waves tuned to resonant cylinder frequencies with noise impact.

---

## 5. Game Architecture & Algorithms

### 5.1 Game Lifecycle Interface
Every game implements a standard lifecycle:

```ts
export interface IGameInstance {
  readonly id: string;
  readonly name: string;
  init(container: HTMLElement, audio: IAudioManager): Promise<void>;
  start(): void;
  pause(): void;
  resume(): void;
  handleInput(input: MotionInputFrame, pointer: PointerState): void;
  destroy(): void;
}
```

### 5.2 Game 1: Slice Party (Fruit Slicing)
- **Engine**: PixiJS Stage with container layers: Background, Fruit Container, Blade Trail Container, HUD Container.
- **Fruit Physics**: Spawns fruit objects (Watermelon, Orange, Kiwi, Bomb) along bottom edge with upward parabolic trajectories:
  $$x(t) = x_0 + v_x \cdot t, \quad y(t) = y_0 + v_y \cdot t - \frac{1}{2} g \cdot t^2$$
- **Slice Trail & Detection**:
  - The pointer keeps a rolling history of the last 6 screen positions: $[P_{t-5}, \dots, P_t]$.
  - If the instantaneous pointer velocity $|P_t - P_{t-1}| / \Delta t > V_{\text{slice\_threshold}}$, the blade is active.
  - For each flying fruit with circular boundary $(C_x, C_y, R)$, check line segment intersection between $(P_{t-1})$ and $(P_t)$.
  - On intersection:
    - Spawn two split sprite halves with outward horizontal velocities $+v_{\text{split}}, -v_{\text{split}}$ and rotational spin $\pm \omega$.
    - Spawn radial juice particle emitter using PixiJS `ParticleContainer`.
    - Synthesize slice slash audio.
    - Increment combo multiplier if multiple items sliced in $< 200$ ms.

### 5.3 Game 2: Star Defender (Aim-and-Shoot Space Combat)
- **Engine**: PixiJS Stage with 3 parallax starfield background layers scrolling vertically.
- **Controls**:
  - Pointer controls the targeted laser reticle / crosshair.
  - Holding/Pressing the **B trigger** fires laser bolts from player ship toward the reticle coordinate.
- **Targeting Mechanics**:
  - Laser projectiles travel along the 2D directional vector from player ship muzzle to reticle target:
    $$\vec{D} = \frac{\vec{P}_{\text{reticle}} - \vec{P}_{\text{ship}}}{|\vec{P}_{\text{reticle}} - \vec{P}_{\text{ship}}|}, \quad \vec{V}_{\text{laser}} = \vec{D} \cdot v_{\text{laser\_speed}}$$
- **Enemy Formations**:
  - Sine-wave gliding scout ships, dive-bombing drones, and shielded motherships.
  - AABB / Circle collision detection between laser bolts and enemy hitboxes.
  - Procedural explosion sound and shockwave ring effects.

### 5.4 Game 3: Bowl Blitz (Throw Motion Bowling)
- **Engine**: PixiJS pseudo-3D perspective projection representing a polished wood bowling lane with gutter gutters, foul line, and pin deck.
- **Throw Gesture Detection Algorithm**:
  1. **Preparation**: Player aims on lane by moving pointer horizontally. Player presses and holds the **B trigger**.
  2. **Backswing**: Player brings phone back; accelerometer registers negative longitudinal acceleration $a_y < -3.0 \text{ m/s}^2$.
  3. **Forward Swing**: Player swings arm forward; accelerometer registers sharp positive acceleration peak ($a_y > 8.0 \text{ m/s}^2$).
  4. **Ball Release Trigger**: Player releases the **B trigger** near peak acceleration:
     - **Ball Velocity**: Proportional to peak forward acceleration $v_{\text{ball}} = k_v \cdot \max(a_y)$.
     - **Release Timing**: Measured deviation from acceleration crest dictates launch angle $\theta_{\text{launch}}$.
     - **Hook / Spin Factor**: Gyroscopic roll rate $\omega_\gamma$ at the exact moment of B-button release imparts ball lateral spin hook:
       $$x_{\text{lane}}(t) = x_{\text{release}} + v_x \cdot t + \frac{1}{2} k_{\text{spin}} \cdot \omega_\gamma \cdot t^2$$
  5. **Pin Cluster Collision**:
    - 10 pins arranged in standard triangle formation.
    - Deterministic pin scattering physics based on ball impact location and velocity vector.
    - Real-time sound synthesis for heavy maple pin strikes.

