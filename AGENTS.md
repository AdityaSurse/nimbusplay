# NimbusPlay — Engineering Guidelines & Agent Rules

These rules are mandatory for all agents and contributors implementing phases of **NimbusPlay**. Every instruction here is binding.

---

## 1. Zero-Application-Code Phase Gate

- **Phase 0 is planning and specification only.**
- Do **NOT** write application code (HTML games, JavaScript/TypeScript game loops, server code) during planning turns.
- Only proceed to implementation after explicit user confirmation of the master plan.

---

## 2. Single Origin & Network Topology Rule

- All client traffic (Console UI, Controller Web App, Assets) and WebSocket traffic **must run on a single HTTPS origin** served by Vite (`https://<laptop-ip>:<port>`).
- The WebSocket server (Node + `ws`) runs on an internal port (e.g., `3001`).
- Vite's development server **must proxy `/ws`** to the internal Node relay:
  ```ts
  // vite.config.ts proxy rule
  proxy: {
    '/ws': {
      target: 'ws://localhost:3001',
      ws: true,
      changeOrigin: true
    }
  }
  ```
- **Never** require the mobile phone to connect to a different port or non-HTTPS URL directly. Android Chrome blocks insecure mixed content and restricts motion sensor APIs to secure origins (`https://` or `localhost`).

---

## 3. TypeScript & Code Standards

- **Strict Mode Enabled**: `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true` in `tsconfig.json`.
- **Zero `any` Types**: Every message, state object, and callback must have an explicit interface or type alias.
- **Small, Modular Files**:
  - Target `< 250` lines per file.
  - Maximum limit `350` lines for core game loops.
  - One primary responsibility per module (Single Responsibility Principle).
- **ES Modules Only**: Native ESM throughout (`import`/`export`), no CommonJS in client code.
- **No Global Leakage**: Do not attach custom runtime state to `window` or global scope. Use structured dependency injection or explicit singletons.

---

## 4. UI, Styling & Design Token Adherence

- **Design System First**: Adhere to design tokens in `design/DESIGN.md` (colors, typography, spacing, corner radii, elevation shadows).
- **Tailwind CSS & Plain DOM**: The console shell (channels, dialogue modals, overlay HUD) is built using standard semantic DOM and Tailwind CSS utility classes.
- **No Arbitrary Inline Style Hacks**: Avoid ad-hoc `style="..."` attributes for layout. Use CSS variables or Tailwind tokens for dynamic transforms (e.g., cursor pointer position `style="transform: translate3d(var(--x), var(--y), 0)"` is acceptable for performance).
- **No Framework Sprawl**: No React, Vue, or Angular for the console shell. Plain DOM/TypeScript keeps the shell lightweight, predictable, and fast (60 fps rendering).

---

## 5. Intellectual Property & Asset Rules

- **Zero Nintendo IP**:
  - Do **NOT** use Nintendo trademarks, logos, brand names ("Wii", "Wiimote", "Mii", "Nintendo", "Virtual Console").
  - Use original NimbusPlay terminology:
    - *Console*: **NimbusPlay Domestic Console**
    - *Controller*: **Nimbus Wand / Virtual Remote**
    - *Pointer*: **Nimbus Hand Pointer**
    - *Channels*: **Nimbus Channel Matrix**
    - *Games*: **Slice Party**, **Star Defender**, **Bowl Blitz**
- **Original Assets**:
  - Use original SVGs, procedural vector art, and CSS-rendered surfaces.
  - All sound effects must be synthesized via the Web Audio API (oscillators, noise nodes, envelopes). Never embed copyrighted Nintendo audio dumps.

---

## 6. Audio Synthesis Principles

- Implement synthesized sound effects via a centralized `AudioManager` class:
  - *Channel Click*: Quick pitch envelope sine pulse (1200Hz to 600Hz in 40ms).
  - *Focus Hover*: Soft resonant triangle chirp (880Hz, 30ms, subtle low-pass).
  - *Launch Chime*: Dual harmonic chime with decaying reverb (E5 + B5).
  - *Slice Slash*: Filtered white noise burst shaped with exponential amplitude decay.
  - *Laser Fire*: Pitch-swept square wave (2200Hz down to 220Hz in 60ms).
  - *Bowling Pin Collision*: Multi-tone resonant pulse with fast decay.
- **AudioContext Gesture Requirement**: Create and resume `AudioContext` only after the first user gesture (click/touch).

---

## 7. Motion Sensor & Pointer Pipeline Rules

- **Coordinate Conventions**:
  - Gyroscope angular velocity $\omega_x, \omega_y$ (rad/s or deg/s) integrated with $\Delta t$.
  - Android Chrome delivers `DeviceMotionEvent.rotationRate` in degrees per second ($\alpha, \beta, \gamma$).
- **Filtering Standard**:
  - Raw gyro integration **must** pass through:
    1. Dead zone thresholding ($\approx 0.5^\circ/\text{s}$ to eliminate hardware resting jitter).
    2. One Euro ($1€$) Filter for adaptive lag-free smoothing (high smoothing when still, zero lag during rapid swipes).
    3. Sensitivity multiplier with boundary clamping (`0` to `viewportWidth`, `0` to `viewportHeight`).
- **Recenter Mechanism**:
  - Any press of the **Home** button, mobile **Recenter** button, or console key (e.g., Spacebar) resets the pointer anchor to the center of the screen (`viewportWidth / 2`, `viewportHeight / 2`).

---

## 8. Workflow, Dependencies & Progress Tracking

- **Ask Before Adding Dependencies**:
  - Approved stack:
    - `vite`
    - `typescript`
    - `pixi.js` (for game canvases)
    - `ws` & `@types/ws` (for Node relay)
    - `@vitejs/plugin-basic-ssl` (for HTTPS)
    - `qrcode` & `@types/qrcode` (for pairing QR generator)
    - `tailwindcss`
  - Any additional library requires explicit confirmation.
- **Update Documentation After Every Phase**:
  - Update `docs/PROGRESS.md` immediately upon completing any milestone.
  - Log verification steps and passing test criteria.
  - Never mark a phase complete without testing sensor input, rendering, and WebSocket communication.

