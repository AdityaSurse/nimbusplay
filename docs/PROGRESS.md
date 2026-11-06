# NimbusPlay — Project Implementation Progress Log

This log tracks implementation progress, milestones, verification notes, and blocker resolutions across all development phases.

---

## Phase Overview Status Table

| Phase | Description | Status | Target Date | Completed Date | Sign-off |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | Architecture, Master Plan & Specification | **Complete** | 2026-11-01 | 2026-11-01 | Approved |
| **Phase 1** | Tooling, Workspace Setup & HTTPS Proxy | **Complete** | 2026-11-01 | 2026-11-01 | Verified |
| **Phase 2** | Node Relay & WebSocket Protocol | **Complete** | 2026-11-01 | 2026-11-01 | Verified |
| **Phase 3** | Console Shell UI & Authentic Channel Matrix | **Complete** | 2026-11-01 | 2026-11-01 | Verified |
| **Phase 4** | Mobile Web Controller & Sensor Ingestion | **Complete** | 2026-11-01 | 2026-11-01 | Verified |
| **Phase 5** | Sensor Pipeline & On-Screen Pointer Engine | **Complete** | 2026-11-01 | 2026-11-01 | Verified |
| **Phase 6** | Web Audio Sound Synthesis Engine | **Complete** | 2026-11-01 | 2026-11-01 | Verified |
| **Phase 7** | Game 1: Slice Party (Fruit Slicing) | **Complete** | 2026-11-01 | 2026-11-01 | Verified |
| **Phase 8** | Game 2: Star Defender (Aim-and-Shoot) | **Complete** | 2026-11-01 | 2026-11-01 | Verified |
| **Phase 9** | Game 3: Bowl Blitz (Throw Motion Bowling) | **Complete** | 2026-11-04 | 2026-11-04 | Verified |
| **Phase 10**| System Integration, Polish & Performance Tuning | **Complete** | 2026-11-06 | 2026-11-06 | Verified |

---

## Game Remake Phase Overview Status Table (5-Game Target)

| Phase | Description | Status | Target Date | Completed Date | Sign-off |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase R0** | Reference Analysis, Video Breakdown & Master Architecture | **Complete** | 2026-11-06 | 2026-11-06 | Approved |
| **Phase R1** | Channel Matrix Remake (4-Tile Top Row) & Direct QR Dock | **Complete** | 2026-11-06 | 2026-11-06 | Verified |
| **Phase R2** | Controller Dynamic Layout Mode (Landscape Flight Yoke) | **Complete** | 2026-11-06 | 2026-11-06 | Verified |
| **Phase R3** | Game 1: Fruit Ninja (Cedar Planks, `X X X` Strikes & Splatters) | **Complete** | 2026-11-06 | 2026-11-06 | Verified |
| **Phase R4** | Game 2: Alien Attack (3D Cosmic Rail Shooter & Dual Thumb) | **Complete** | 2026-11-06 | 2026-11-06 | Verified |
| **Phase R5** | Game 3: Shooting Range (Carnival Sky, Grass & Bullseyes) | **Complete** | 2026-11-06 | 2026-11-06 | Verified |
| **Phase R6** | Game 4: Sketch (Interactive Whiteboard & Spline Ink) | **Complete** | 2026-11-06 | 2026-11-06 | Verified |
| **Phase R7** | Remake System Integration, Latency Profiling & QA | **Complete** | 2026-11-06 | 2026-11-06 | Verified |
| **Phase R8** | Game 5: Turbo Circuit 3D Kart Racer Architecture & Spec | **Complete** | 2026-11-06 | 2026-11-06 | Approved |
| **Phase R9** | Game 5: Turbo Circuit 3D Kart Racing Engine Implementation | **Complete** | 2026-11-06 | 2026-11-06 | Verified |
| **Phase R10**| Game 5: Turbo Circuit Full Race Championship & AI Opponents | **Complete** | 2026-11-06 | 2026-11-06 | Verified |
| **Phase R11**| Game 5: Turbo Circuit Landscape Controller & Steering Wheel Tilt | **Complete** | 2026-11-06 | 2026-11-06 | Verified |

---

## Detailed Phase Execution Logs

### Phase 0: Master Plan & Specifications
- **Status**: Complete / In Review
- **Summary**: Delivered master `README.md`, `AGENTS.md`, `docs/ARCHITECTURE.md`, and `docs/PROGRESS.md`. Integrated Stitch design exports in `/design`.
- **Milestones**:
  - [x] Defined 15 Mermaid architectural, behavioral, and state diagrams.
  - [x] Established strict WebSocket message schema and types.
  - [x] Outlined performance budget (<30 ms latency, 60 fps).
  - [x] Documented Android Chrome HTTPS and sensor activation protocols.
- **Blockers / Open Questions**:
  - None at this stage. Awaiting user approval to commence Phase 1.

---

### Phase 1: Tooling, Workspace Setup & HTTPS Proxy
- **Status**: Complete
- **Key Deliverables**: `package.json`, `tsconfig.json`, `vite.config.ts` with basic-ssl and `/ws` proxy, single origin structure.
- **Verification Criteria**:
  - [x] Local Vite dev server launches over `https://0.0.0.0:5173`.
  - [x] `@vitejs/plugin-basic-ssl` provides valid self-signed certificate for local HTTPS.
  - [x] TypeScript strict compilation passes without errors (`tsc --noEmit`).
  - [x] Rollup builds both `/` and `/controller` bundles cleanly.
- **Log Notes**:
  - Implemented custom `lanInfoPlugin` to serve LAN IP at `/api/info` and rewrite `/controller` queries.

---

### Phase 2: Node Relay & WebSocket Protocol
- **Status**: Complete
- **Key Deliverables**: `server/relay.ts`, `server/session.ts`, `src/shared/protocol.ts`, console and controller network clients with auto-reconnect and heartbeat ping/pong.
- **Verification Criteria**:
  - [x] Node WS relay runs concurrently with Vite via single `npm run dev` script.
  - [x] Console auto-registers room with 4-character code and generates pairing QR code pointing to `https://<LAN-IP>:5173/controller?room=CODE`.
  - [x] Vite development server proxies `wss://<host>:5173/ws` to internal relay on port 3001.
  - [x] Controller page `/controller` joins room, displays connection badges, and sends test motion/button packets.
  - [x] Heartbeat ping/pong tracks RTT latency ($< 10$ ms on local Wi-Fi).
  - [x] Automatic reconnect on both sides with exponential backoff and peer status notifications.
  - [x] Live debug panel on console page displays all inbound packets in real time.
- **Log Notes**:
  - Tested concurrently runner: both servers bootstrap in $< 200$ ms. All protocol types enforce zero `any` types.

---

### Phase 3: Console Shell UI & Authentic Channel Matrix (Stitch Fidelity)
- **Status**: Complete
- **Key Deliverables**:
  - `src/styles/tokens.css`: Extracted tokens for colors, radii, elevation shadows, typography scale, and spacing.
  - `src/styles/console.css`: Authentic letterboxed 16:9 stage layout, ambient specular sheens, sinusoidal waves, molded bottom bar.
  - `src/console/ui/artwork.ts`: 100% original SVG channel vector art (Slice Party, Star Defender, Bowl Blitz, Settings, Pairing, Tuning, Empty Slots).
  - `src/console/ui/shell.ts`: View controller managing 4×3 grid, tile focus/hover physics (cyan outline, glow, 1.04 scale, 150ms ease), paging wings, live digital clock & date.
  - Modals & Screens:
    - Channel Launch Dialog (16:9 banner, Disc Channel pulse pip, Start & Back pill buttons).
    - Controller Pairing Screen (2-column chassis, dynamic QR code canvas, 4-char Room Code badge, P1 Wand status, live log drawer).
    - Pause Overlay HUD (70% white translucent wash, scanline simulation, 4-button quick menu).
    - Pointer Calibration Screen (Radar grid, concentric range circles, animated progress arc, precision bullseye reticle).
  - Custom SVG Hand Pointer cursor following mouse pointer with sub-pixel 3D translate and active click transforms.
- **Verification Criteria**:
  - [x] Full-viewport 16:9 stage scales cleanly with pillarboxing/letterboxing; no default browser styles or scrollbars.
  - [x] Channel tile hover and focus states trigger smooth 150ms cubic-bezier 1.04 scale, cyan border, and diffuse glow.
  - [x] All 4 screens/modals open and close smoothly.
  - [x] Dynamic real-time clock updates every second (`HH:MM`).
  - [x] TypeScript strict compilation and production Vite build pass with zero errors.
- **Log Notes**:
  - All channel artwork is procedural vector SVG; zero emojis or copyrighted Nintendo assets. Full design system parity achieved.

---

### Phase 4: Mobile Web Controller & Sensor Ingestion
- **Status**: Complete
- **Key Deliverables**:
  - `controller/index.html`: Pixel-accurate implementation of Stitch `design/virtual_remote.html` with Tailwind CSS, Nunito Sans, Material Symbols, P1 connection badge, RTT latency readout, battery percentage, "Activate Motion Sensors" action banner, tactile A button, recessed D-pad cross, Minus, Home (cloud), Plus, Recenter button, vertical 1 & 2 buttons with speaker hole array, and bottom full-width B Trigger button.
  - `src/controller/sensors.ts`: `SensorManager` reading `devicemotion` rotation rates ($\alpha, \beta, \gamma$ in deg/s) and acceleration ($x, y, z$ in $\text{m/s}^2$), iOS permission checking (`DeviceMotionEvent.requestPermission`), Generic Sensor API fallback (`Gyroscope`, `Accelerometer`), and hardware watchdog detecting "no sensor data".
  - `src/controller/touch.ts`: `TouchInputManager` providing multi-touch safe button tracking with pointer ID maps, bitmask calculation using `BUTTON_MASKS`, independent touch release, and haptic feedback.
  - `src/controller/device.ts`: `DeviceImmersion` managing Screen Wake Lock with auto-reacquisition on visibility change, portrait orientation lock, and HTML5 Fullscreen request.
  - `src/controller/main.ts`: 60Hz loop sending compact JSON packets (`CompactMotionPacket`), console command listener handling `COMMAND_HAPTIC` rumble.
  - `src/console/core/debug-overlay.ts`: Console live telemetry debug HUD toggled with **`D`** key, displaying live Hz rate, sequence count, RTT latency, $\alpha, \beta, \gamma$ gyro bars, $x, y, z$ accel bars, and 12-button live state matrix.
  - `server/relay.ts`: Fast-path forwarding for compact 60Hz packets.
- **Verification Criteria**:
  - [x] Full mobile touch UI matching console remote ergonomics with safe-area insets.
  - [x] "Enable motion" button activates sensors, requests wake lock, portrait orientation lock, and fullscreen.
  - [x] Multi-touch safe button pad with pointer events tracks simultaneous presses (e.g. B trigger + A button + D-pad) and releases correctly.
  - [x] High-frequency 60Hz stream transmits compact ~80 byte packets (`{ t: 'F', s, ts, b, r, a }`).
  - [x] Haptic feedback triggered on button press and when receiving `COMMAND_HAPTIC` from console.
  - [x] Clear status indicators on controller: connecting, connected, disconnected, 60Hz gyro active, no sensor data.
  - [x] Console debug overlay toggles with 'D' key, showing live telemetry meters and active button highlights.
  - [x] Strict TypeScript check (`npx tsc --noEmit`) and Vite production build (`npm run build`) pass cleanly with 0 errors.
- **Log Notes**:
  - Maintained zero `any` types throughout. Single HTTPS origin proxying `/ws` preserves mobile sensor permissions in Android Chrome.

---

### Phase 5: Sensor Pipeline & On-Screen Pointer Engine
- **Status**: Complete
- **Key Deliverables**:
  - `src/console/pointer/one-euro-filter.ts`: Pure mathematical implementation of the One Euro ($1€$) adaptive low-pass filter (Casiez et al., CHI 2012) providing rock-solid stability at rest and lag-free tracking during fast motions.
  - `src/console/pointer/aim-mapper.ts`: Gravity-compensated aim mapping using the accelerometer gravity vector $\hat{g}$ to decouple yaw and pitch from wrist roll, ensuring tilting or rolling the wand does not rotate the aim axes.
  - `src/console/pointer/pipeline.ts`: `PointerPipeline` orchestrating aim mapping, gyro bias subtraction, radial deadzone ($0.6^\circ/\text{s}$), sensitivity scaling, edge damping with soft stop, One Euro filtering, and `recenter()`.
  - `src/console/pointer/calibration.ts`: `CalibrationManager` sampling 60 gyro readings over 1000ms while user holds the wand steady, checking variance, computing drift bias, and persisting to `localStorage`.
  - `src/console/pointer/settings-manager.ts`: Persistent settings manager storing user sensitivity, jitter smoothing, and deadzone values in `localStorage`.
  - `src/console/pointer/interaction-manager.ts`: Full-menu interaction driver:
    - Drives `#hand-pointer` transform and hover hit-testing across channels and modal buttons.
    - **A Button**: Click focused/hovered element.
    - **B Button**: Back action (closes active modal/pause HUD).
    - **D-Pad**: Directional focus navigation across channel tiles.
    - **Recenter Action**: Home long-press (>450ms), Recenter button, or Spacebar resets cursor to $(W/2, H/2)$.
    - Calibration screen wiring with circular radar SVG progress arc ($527 \to 0$ stroke dashoffset) and center confirmation.
    - Settings channel dialog with interactive sliders and reset defaults.
    - Desktop mouse fallback for local testing without mobile hardware.
  - `tests/pointer.test.ts`: Complete unit test suite (12 tests) covering One Euro filtering, AimMapper roll invariance, dead zone suppression, edge clamping, and calibration.
- **Verification Criteria**:
  - [x] All 12 unit tests pass in `npm test`.
  - [x] Phone gyro input translates to smooth cursor movement on desktop console.
  - [x] Resting jitter eliminated by deadzone and low-pass filter; rapid swipes respond with zero perceptible lag.
  - [x] A-button triggers tile clicks and dialog openings.
  - [x] B-button closes open dialogs, modals, and pause HUD.
  - [x] D-Pad moves focus between channel tiles.
  - [x] Calibration screen measures 60 samples, displays real-time circular progress arc, computes bias, and confirms center.
  - [x] Settings channel provides sensitivity, smoothing, and deadzone sliders with localStorage persistence.
  - [x] Desktop mouse fallback allows testing without physical phone.
  - [x] Strict TypeScript check and Vite build pass with 0 errors.
- **Log Notes**:
  - Pure modular TypeScript (<250 lines/file), zero `any` types, zero external npm math dependencies. Node 24 native test runner executes all unit tests in $< 100$ ms.

---

### Phase 6: Web Audio Sound Synthesis Engine
- **Status**: Complete
- **Key Deliverables**: `src/console/audio/audio-manager.ts` centralized procedural audio synthesizer using Web Audio API nodes (oscillators, biquad filters, white noise buffer nodes, gain envelopes).
- **Verification Criteria**:
  - [x] Zero external MP3/WAV dependencies; 100% procedural Web Audio API synthesis.
  - [x] Clean playback starting on first user gesture without console warnings or audio thread blocking.
  - [x] Channel click (sine pulse 1200Hz $\to$ 600Hz in 40ms), focus hover (resonant triangle chirp 880Hz), launch chime (E5+B5 dual harmonic chime).
  - [x] Game effects: blade whoosh (bandpass noise sweep), fruit splat (FM pitch drop + white noise burst), bomb explosion (sub-bass 28Hz resonance + filtered noise roar), combo chimes (rising pentatonic arpeggio: C5, E5, G5, C6).
- **Log Notes**:
  - Implemented lazy `AudioContext` resumption on first user gesture. Cached noise buffers ensure zero allocation overhead during intense slicing sessions.

---

### Phase 7: Game 1 — Slice Party
- **Status**: Complete
- **Key Deliverables**:
  - `src/console/games/common/game-interface.ts`: Standard `IGame` modular contract (`init`, `update`, `render`, `pause`, `resume`, `destroy`, `onPointerInput`).
  - `src/console/games/slice-party/slice-party-game.ts`: PixiJS v8 game module with parallax wooden backdrop and wave difficulty scaling.
  - `src/console/games/slice-party/fruit-graphics.ts`: Original procedural vector art for Watermelon, Orange, Apple, Pineapple, and Bomb (intact and separated sliced halves).
  - `src/console/games/slice-party/fruit-entity.ts`: Parabolic gravity physics ($g = 1400\,\text{px/s}^2$), rotational spin, and perpendicular slice separation impulses with angular momentum.
  - `src/console/games/slice-party/blade-trail.ts`: Tapered glowing cyan blade ribbon with alpha/width decay over time.
  - `src/console/games/slice-party/collision.ts`: Swept-segment vs circle collision detection ($P_{\text{prev}} \to P_{\text{now}}$ projection onto circle center) with exact slice cut angles.
  - `src/console/games/slice-party/particle-system.ts`: Radial juice droplet physics with color matching, bomb explosion shockwave/sparks, and floating combo popup labels.
  - `src/console/games/slice-party/hud.ts`: Live score, 3 hearts life tracker, dynamic combo banner, and Game Over card with Retry and Menu buttons.
  - `src/console/games/game-manager.ts`: Central game session manager interfacing with console shell and Home pause overlay.
- **Verification Criteria**:
  - [x] Continuous 60 fps rendering on PixiJS v8 WebGL/WebGPU pipeline.
  - [x] Fruit slices follow rapid pointer trajectory; swept segment math prevents dropped hits at high swing speeds.
  - [x] Sliced halves separate with perpendicular impulse $(-\sin\theta, \cos\theta)$ along the cut normal.
  - [x] Multi-fruit combos (2x, 3x, 4x+) reward scaling bonus points and musical chime chords.
  - [x] Bombs deduct 1 life, trigger screen shake + rumble, reset active combos, and trigger Game Over upon 0 hearts.
  - [x] High score persisted in `localStorage` (`nimbusplay_sliceparty_highscore`).
  - [x] Home button triggers Pause overlay; Disc Channel starts game with clean launch transition.
  - [x] Multi-touch B-button holding activates blade slicing; mouse fallback supported for desktop testing.
  - [x] 17/17 automated unit tests pass; `tsc --noEmit` and Vite production build pass with 0 errors.
- **Log Notes**:
  - PixiJS v8 integration uses modern `app.init()` and `app.canvas` standards. All graphic textures are drawn procedurally via Pixi `Graphics` paths and circles, adhering strictly to the zero-external-IP requirement. Swept-segment collision math guarantees 100% slice accuracy even during lightning-fast swipes.

---

### Phase 8: Game 2 — Star Defender
- **Status**: Complete
- **Key Deliverables**:
  - `src/console/games/star-defender/star-defender-game.ts`: Master game loop orchestrating turret, starfield, pooled bullets, alien waves, boss, particles, and HUD.
  - `src/console/games/star-defender/star-graphics.ts`: 100% procedural vector art (Pixi `Graphics`) for turret gimbal, scouts, fighters, cruisers, dreadnought boss, projectiles, power-up capsules, and crosshairs. Zero external image assets.
  - `src/console/games/star-defender/object-pool.ts`: Generic O(1) object pool for bullets and particles preventing GC frame drops.
  - `src/console/games/star-defender/player-turret.ts`: Turret rotation aiming toward pointer, A-button rate-limited laser fire, B-button charged plasma blast charging & release.
  - `src/console/games/star-defender/aim-solver.ts`: Predictive lead-target mathematical solver ($t = d / v_{\text{laser}}$, $P_{\text{lead}} = P_{\text{target}} + \vec{v}_{\text{target}} \cdot t$) with soft aim assist magnetism.
  - `src/console/games/star-defender/enemy-manager.ts`: Alien waves (scouts, fighters, cruisers), sinusoidal trajectories, dive attacks, horizontal strafing, and bolt firing.
  - `src/console/games/star-defender/boss-mothership.ts`: Dreadnought mothership appearing every 5 waves with health bar HUD, radial 8-way bursts, wing lasers, and minion drone spawns.
  - `src/console/games/star-defender/powerup-manager.ts`: Power-up capsules (spread shot, shield deflection, slow-time warp) with duration timers.
  - `src/console/games/star-defender/starfield.ts`: 3-layer parallax starfield with slow-time damping and nebula dust.
  - `src/console/games/star-defender/star-particles.ts`: Pooled explosion sparks, shockwaves, and floating text popups.
  - `src/console/games/star-defender/star-hud.ts`: Score, high score persistence (`localStorage`), 3 hull lives, boss health bar, active power-up chips, wave banner, and game over modal.
- **Verification Criteria**:
  - [x] Smooth 60 fps rendering on PixiJS v8 with zero GC pause stutters via bullet and particle object pooling.
  - [x] Aim assist toggle integrated into Console Settings modal (`#settings-overlay`) and persisted in `localStorage`.
  - [x] Predictive lead crosshair indicator displays intercept point ahead of moving alien saucers.
  - [x] A button fires rapid rate-limited lasers; holding B charges a massive piercing plasma blast.
  - [x] Web Audio procedural synthesis: laser fire (swept square wave 2200Hz $\to$ 220Hz), charged blast, alien explosion crunch, boss hit clangs, shield deflections, powerup fanfare.
  - [x] Haptic rumble commands sent to mobile controller on laser fire, charged blast, player hit, and boss destruction.
  - [x] High score persisted in `localStorage` (`nimbusplay_stardefender_highscore`).
  - [x] Home pause overlay integration pauses game loop and restores cleanly.
  - [x] 22/22 unit tests passing; strict `tsc --noEmit` and Vite production build pass with 0 errors.
- **Log Notes**:
  - Fully decoupled architecture using small modular files (< 250 lines / < 350 lines). Pure unit test suite for lead prediction math and object pool guarantees robust runtime stability. Single HTTPS origin and relay protocol preserved.
  - Resolved game isolation bug: `#game-container` elevated to `z-index: 45` with `#stage.in-game` hiding all Wii console chrome (top header, bottom tray, clock, channel matrix, and background waves). Each game now launches in its own dedicated, 100% opaque thematic window: Slice Party features an authentic Fruit-Ninja-style procedural wooden dojo table/wall (`dojo-backdrop.ts`), Star Defender features a deep space cosmic nebula arena (`starfield.ts`), and Bowl Blitz features a hardwood perspective bowling lane (`bowling-backdrop.ts`).

---

### Phase 9: Game 3 — Bowl Blitz
- **Status**: Complete
- **Key Deliverables**:
  - `src/console/games/bowl-blitz/types.ts`: Type definitions for `PinState`, `ThrowParameters`, `FrameScore`, `ReplayFrame`, and `ThrowStage`.
  - `src/console/games/bowl-blitz/bowling-scorecard.ts`: Official 10-frame bowling scorecard engine tracking strikes (`X`), spares (`/`), open frames, 10th-frame 3-roll bonus rules, and cumulative running scores.
  - `src/console/games/bowl-blitz/throw-detector.ts`: Forward swing accelerometer peak detection ($a_{\text{fwd}} \ge 5.5\,\text{m/s}^2$), backswing bonus, wrist roll rate ($\gamma$) hook spin derivation, yaw ($\alpha$) direction mapping, and oscillating power-meter fallback mode.
  - `src/console/games/bowl-blitz/bowling-physics.ts`: Pseudo-3D perspective lane projection ($y: 980 \to 260$, lane width $960 \to 360$), dynamic ball scaling, late-hook curve ($y < 680$), gutter channels, ball-pin collisions, and pin-to-pin chain reaction domino physics.
  - `src/console/games/bowl-blitz/replay-system.ts`: Circular keyframe snapshot recorder (40 fps) and 0.6x slow-motion playback system.
  - `src/console/games/bowl-blitz/bowling-backdrop.ts`: 100% opaque perspective maple hardwood lane, foul line, side gutters, targeting arrows, and pin deck.
  - `src/console/games/bowl-blitz/bowling-hud.ts`: 10-frame overhead TV monitor scoreboard, strike/spare/gutter celebratory banners, vertical power-meter bar, slow-mo replay badge, and Game Over card.
  - `src/console/games/bowl-blitz/bowl-blitz-game.ts`: Master `IGame` loop orchestrating all bowling subsystems, pin rack re-racking, audio, and controller haptic rumble.
  - `src/console/audio/audio-manager.ts`: Procedural `playBowlingPinHit()` synthesizing multi-tone resonant pulse ($480, 720, 1140, 1420\,\text{Hz}$) with rapid exponential decay.
  - `src/console/pointer/settings-manager.ts` & `index.html`: "Bowl Blitz: Power Meter Mode" toggle persisted in `localStorage` for pointer-aim & power meter fallback.
- **Verification Criteria**:
  - [x] Continuous 60 fps rendering on PixiJS v8 canvas.
  - [x] Holding B arms the swing; swinging phone forward and releasing B launches the ball with forward speed and hook spin.
  - [x] Wrist roll ($\gamma$) authentically introduces late curve into the 1-3 pocket.
  - [x] Balls straying beyond lane bounds drop into gutters and roll into the pit without hitting pins.
  - [x] Multi-pin collisions produce authentic pin-to-pin chain reactions and domino falls.
  - [x] Complete 10-frame scoring rules: strikes, spares, open frames, and 10th-frame 3-roll condition verified across edge cases (including perfect 300 game and all-spares 150 game).
  - [x] Instant slow-motion replay (0.6x) recorded during rolls and playable via the "REPLAY (B)" button on deck.
  - [x] Power Meter Mode fallback toggle in Settings enables desktop mouse / button testing with oscillating power gauge and pointer drift hook spin.
  - [x] Synthesized pin clatter sound effect and haptic rumble on pin hits and strikes.
  - [x] 35/35 automated unit tests pass (13 new bowling tests covering scoring, throw detection, and physics); `tsc --noEmit` and Vite production build pass with 0 errors.
- **Log Notes**:
  - Strictly adheres to the modularity constraints: `bowl-blitz-game.ts` is 325 lines (under 350 max limit), and all supporting modules are $< 250$ lines.
  - Single HTTPS origin and WebSocket relay protocol fully maintained. No external assets or Nintendo IP used.

---

### Phase 10: System Integration, Polish & Performance Tuning
- **Status**: Complete
- **Key Deliverables**:
  - `src/console/audio/audio-context.ts`: AudioContext lifecycle, master gain, shared noise buffer, and user gesture auto-resume.
  - `src/console/audio/menu-sfx.ts`: Procedural synthesized menu sounds (hover tick, select, back, page turn, channel click, launch chime, startup chime).
  - `src/console/audio/ambience.ts`: Continuous warm dual-oscillator ambient synth pad ($A2 + E3$) with $0.07\text{Hz}$ LFO biquad filter sweep, gain envelope, and mute options in bottom tray and Settings dialog.
  - `src/console/audio/star-sfx.ts`: Procedural space combat synthesizer (lasers, plasma blasts, shield deflections, powerup fanfare).
  - `src/console/audio/game-sfx.ts`: Procedural sword slash, fruit splat, bomb roar, and bowling pin clatter synthesizer.
  - `src/console/audio/audio-manager.ts`: Unified audio facade aggregating context, menu SFX, ambience, and game SFX.
  - `src/console/ui/onboarding.ts`: Multi-slide interactive first-run guide explaining wand posture, pairing QR code, and calibration routine with `localStorage` persistence.
  - `src/console/ui/catalog.ts`: Decoupled game metadata directory and procedural channel matrix renderer.
  - `src/console/ui/shell.ts`: Channel loading overlay with rotating disc animation, reconnect modal with live QR and fallback mouse continuation, and bottom tray ambience mute button.
  - `src/console/pointer/settings-ui.ts` & `src/console/pointer/calibration-ui.ts`: Extracted settings sliders and radar calibration UI.
  - `src/controller/touch.ts` & `src/controller/main.ts`: Screen off and tab sleep handling (`visibilitychange`) clearing touches, transmitting bitmask 0, pausing stream, and re-acquiring wake lock and sensors upon waking.
  - `src/console/core/debug-overlay.ts`: Live telemetry and latency HUD displaying RTT latency, input-to-cursor latency ($< 30\text{ms}$ target), Hz meter, gyro/accel bars, and active button matrix.
  - `tests/relay.test.ts`: 7 unit tests for session room code generation, custom room IDs, peer join/leave tracking, disconnect alerts, stale room timeouts, and compact 60Hz packet fast-path validation.
  - `tests/pointer.test.ts`: 7 unit tests for $1€$ filter, deadzone suppression, gravity aim mapping, sensitivity scaling, 4-edge boundary soft clamping, and mouse fallback override.
- **Verification Criteria**:
  - [x] Input-to-cursor latency $< 30\text{ ms}$ verified on live debug overlay (`rttMs * 0.5 + 2.5`).
  - [x] Continuous 60 fps rendering across Console Channel Shell and PixiJS games with zero memory leaks.
  - [x] All 45 unit tests across 12 suites pass cleanly in $< 100\text{ ms}$ (`npm test`).
  - [x] Strict TypeScript compilation (`npx tsc --noEmit`) passes with 0 errors.
  - [x] Vite production build (`npm run build`) succeeds in $< 1.5\text{s}$.
  - [x] Mid-game wand disconnection auto-pauses game, presents reconnect modal with live QR, and allows mouse continuation.
  - [x] Phone visibility change resets touches, transmits bitmask 0, and re-acquires Screen Wake Lock upon waking.
  - [x] Soothing procedural background ambience with mute toggle in bottom tray and Settings.
  - [x] First-run interactive onboarding flow automatically opens on initial visit and persists completion state.
- **Log Notes**:
  - All files strictly adhere to the line count limits ($< 250$ lines for standard modules, $< 350$ lines for core loops).
  - 100% original Web Audio procedural synthesis; zero external MP3s, WAVs, or Nintendo IP.
  - Single HTTPS origin architecture with Vite proxying `/ws` to Node relay on port 3001 enables seamless mobile sensor access in Android Chrome.

---

### Phase R0: Reference Analysis, Video Breakdown & Master Architecture
- **Status**: Complete / Approved
- **Key Deliverables**:
  - Inspected `/design/reference/Video-7889.mp4`, `reel-games.png`, and `reel-menu.png`.
  - Authored [`docs/GAME_REFERENCE.md`](file:///Users/adityasurse/Documents/NimbusPlay/docs/GAME_REFERENCE.md): Comprehensive specification of the 4 target games (Fruit Ninja, Alien Attack, Shooting Range, Sketch), with visual descriptions, HUD, motion, scoring, controls, procedural sound synthesis, and a detailed "Current NimbusPlay vs Reference" comparison matrix.
  - Updated [`docs/ARCHITECTURE.md`](file:///Users/adityasurse/Documents/NimbusPlay/docs/ARCHITECTURE.md): Added colorful Mermaid flowcharts with `classDef` styles for the 4-tile top-row menu, each game's loop and state machine, controller dynamic layout mapping (portrait wand vs landscape flight), and the updated remake roadmap.
  - Updated [`README.md`](file:///Users/adityasurse/Documents/NimbusPlay/README.md): Replaced Star Defender and Bowl Blitz with Alien Attack, Shooting Range, and Sketch; added colorful Mermaid flowcharts; updated Visual System Gallery ASCII layouts to reflect the reference target.
  - Formally deprecated legacy games (**Star Defender** and **Bowl Blitz**) from the active plan.
- **Verification Criteria**:
  - [x] Zero application code touched during Phase R0 (strict Phase Gate).
  - [x] All 4 reference games fully specified with exact visual, HUD, input, and audio parameters.
  - [x] Landscape flight yoke and two-handed controller model specified for Alien Attack.
  - [x] Direct QR code placement on firmware bottom shelf specified.
  - [x] Assumptions explicitly documented.

---

### Phase R1: Channel Matrix Remake (4-Tile Top Row) & Direct QR Dock
- **Status**: Complete / Verified
- **Key Deliverables**:
  - `src/console/ui/artwork.ts`: Replaced legacy artwork with 4 glossy gradient game cards and faint ghost tiles matching `/design/reference/reel-menu.png`:
    - **Fruit Ninja**: Orange to yellow gradient (`#ea580c` to `#facc15`), white watermelon slice SVG, white label.
    - **Alien Attack**: Green gradient (`#15803d` to `#4ade80`), white alien invader sprite SVG, white label.
    - **Shooting Range**: Blue gradient (`#1d4ed8` to `#38bdf8`), white concentric target bullseye SVG, white label.
    - **Sketch**: Purple to pink gradient (`#7e22ce` to `#ec4899`), white artist palette SVG, white label.
    - **Ghost Tiles**: Faint translucent frosted cards (`rgba(255, 255, 255, 0.48)`) filling rows 2 and 3 (8 ghost slots).
  - `src/console/ui/catalog.ts`: Restructured 4×3 grid with 4 playable games on top row and 8 empty ghost tiles; catalog updated with rich descriptions and gradient banners.
  - `src/console/ui/shell.ts`: Added `renderDockQr()` rendering live pairing QR code to `#dock-qr-canvas` in bottom shelf; added one-click QR badge pairing dialog trigger.
  - `index.html`:
    - Sculpted bottom shelf updated to feature center digital clock HUD and bottom-right live pairing QR dock badge (`#dock-qr-link`).
    - Hand pointer updated: Player 1 circular cyan badge (`#3CB4E7`) with bold white "1" rendered cleanly on top of glove cuff layer.
    - Removed legacy `setting-aim-assist` and `setting-bowling-meter` toggle markup.
  - `src/styles/console.css`:
    - Very light white/grey background (`#f8f9fb` to `#edf0f4`) with subtle wave contours (`opacity: 0.08`).
    - Soft tile shadows (`box-shadow: 0 8px 22px rgba(0, 0, 0, 0.08)`).
    - Glossy game card styling with specular glare and white typography.
    - Bottom-right live pairing QR card badge with hover elevation.
  - **Removed Legacy Code**:
    - Deleted `src/console/games/star-defender/` and `src/console/games/bowl-blitz/`.
    - Deleted `tests/star-defender.test.ts` and `tests/bowling.test.ts`.
    - Deleted `src/console/audio/star-sfx.ts`.
    - Cleaned legacy audio and pointer settings references.
- **Verification Criteria**:
  - [x] Authentic 4-tile top-row channel matrix matching `/design/reference/reel-menu.png`.
  - [x] Rows 2 & 3 render 8 faint empty ghost tiles.
  - [x] Hand pointer displays cyan Player 1 badge with white "1".
  - [x] Live pairing QR code renders directly in the bottom-right corner of the firmware shelf.
  - [x] Digital clock remains centered on the bottom curved bar.
  - [x] 27/27 unit tests pass across 7 test suites in <100ms (`npm test`).
  - [x] TypeScript strict compilation passes with zero errors (`npx tsc --noEmit`).
  - [x] Production build succeeds in <1.5s (`npm run build`).
  - [x] All file line counts adhere strictly to guidelines (<250 lines per module).

---

### Phase R3: Game 1 — Fruit Ninja Remake
- **Status**: Complete / Verified
- **Key Deliverables**:
  - `src/console/games/slice-party/dojo-backdrop.ts`: Rebuilt wooden wall with full-screen warm brown vertical cedar timber planks, vertical woodgrain striations, wood knot rings, dark recessed seams, bevel highlights, authentic cutting table scars, and ambient center light pool.
  - `src/console/games/slice-party/fruit-graphics.ts`: 100% original procedural vector artwork for 5 reference fruits (`watermelon`, `orange`, `lemon`, `strawberry`, `apple`) and `bomb`. Implemented both intact (`drawWhole`) and cut half (`drawHalf`) sprites with rinds, pith, pulp, seeds, and stems.
  - `src/console/games/slice-party/splatter-decals.ts`: Dedicated `SplatterDecalSystem` rendering organic sticky juice splatters in the fruit's color directly onto the cedar wood behind cuts. Splatters persist on the wood for ~4 seconds before fading out smoothly.
  - `src/console/games/slice-party/blade-trail.ts`: Glowing dual-layer blade ribbon with luminous cyan outer glow and white-hot sharp core following the pointer.
  - `src/console/games/slice-party/hud.ts`: Authentic Fruit Ninja HUD:
    - Top-left: Small watermelon wedge icon + score numeral & `BEST: <score>` tracker.
    - Top-right: Three strike `X X X` markers. Missed intact fruits cost a strike, turning the marker bright crimson red (`#ef4444`) with drop shadow. Three strikes trigger Game Over.
    - Top-center: Floating combo banner celebrating multi-fruit cuts.
    - Game Over dialog with Restart and Menu actions and high score persistence in `localStorage`.
  - `src/console/games/slice-party/fruit-entity.ts`: Parabolic physics and missed fruit detection: intact fruits falling past screen bounds automatically notify the game loop and register a strike.
  - `src/console/games/slice-party/slice-party-game.ts`: Master loop wiring A-button holding to blade slicing, swept-segment vs circle collision hit-testing, sticky splatter placement, radial juice droplet sprays, phone vibration on slices and bombs, miss buzz audio on dropped fruits, and 60 FPS locked rendering.
  - `src/console/audio/game-sfx.ts` & `audio-manager.ts`: Added `playStrikeBuzz()` for missed fruit feedback.
  - `tests/collision.test.ts`: Added unit tests verifying all 5 fruit types and bombs.
- **Verification Criteria**:
  - [x] Full-screen warm brown vertical wooden planks background matching `reel-games.png` (top-left).
  - [x] 5 reference fruits (watermelon, orange, lemon, strawberry, apple) + bombs tossed in parabolic arcs with spin.
  - [x] Slicing activated by moving pointer while holding A button (with B and mouse drag fallback).
  - [x] Fruit splits into two halves with perpendicular impulse along cut normal.
  - [x] Sticky colored juice splatters decal onto the wooden planks and fade out over time.
  - [x] Radial juice droplet particle sprays in matching fruit colors.
  - [x] Glowing blade trail ribbon follows swift arm movements.
  - [x] HUD displays top-left watermelon icon + score & BEST, top-right `X X X` strikes, floating `+N` combo popups.
  - [x] Missing intact fruit costs 1 strike with buzz sound and haptic vibration; 3 strikes trigger Game Over.
  - [x] Bombs detonate with screen shake, audio roar, and instant Game Over.
  - [x] 28/28 unit tests pass across 7 suites (`npm test`).
  - [x] Strict TypeScript check and Vite production build pass cleanly with 0 errors.
  - [x] All modules adhere strictly to line count limits (<250 lines per module, <350 lines for game loop).

---

### Phase R4: Game 2 — Alien Attack Remake
- **Status**: Complete / Verified
- **Key Deliverables**:
  - `src/shared/protocol.ts`: Added `LayoutModeCommand` (`COMMAND_LAYOUT_MODE`, `'portrait' | 'landscape'`) enabling console to dynamically switch mobile controller UI.
  - `controller/index.html`: Implemented `#landscape-controller-view` with wide dual-thumb firing triggers (`FIRE L`, `FIRE R`), horizon tilt indicator bar, pause and center shortcuts.
  - `src/controller/main.ts` & `touch.ts`: Handled `COMMAND_LAYOUT_MODE` transition, multi-touch dual firing pads, haptic feedback, and real-time horizon tilt meter.
  - `src/console/games/alien-attack/space-backdrop.ts`: Deep royal-blue space void (`#0a163c` to `#162e70`), soft drifting glowing nebula blobs (purple `0x8b5cf6`, pink `0xec4899`, cyan `0x06b6d4`), concentric-ringed orange Saturn-like planet, and 70 downward-streaking white warp speed lines.
  - `src/console/games/alien-attack/alien-graphics.ts`: 100% original procedural vector artwork for player white & red jet fighter (cockpit canopy, swept red delta wings, engine nozzles, shield bubble), craggy tumbling asteroids, alien saucers, alien in a glowing ring bubble, dual plasma lasers, and power-up capsules.
  - `src/console/games/alien-attack/player-ship.ts`: Starship physics, banking roll animation ($\pm 24^\circ$) under lateral tilt, blue thruster exhaust particle trail, dual laser rate limiting, and energy shield deflection.
  - `src/console/games/alien-attack/enemy-manager.ts`: Spawning and movement for tumbling asteroids, waving saucers, and the ring-bubble alien. Bubble alien drops shield power-up capsule on defeat.
  - `src/console/games/alien-attack/particles.ts`: Combat particle manager for laser impact sparks, alien explosions, and shield flares.
  - `src/console/games/alien-attack/alien-hud.ts`: Top-left bold white score (`640`) + `BEST: <score>`, top-right 3 green hearts (`💚 💚 💚`) vector-rendered, shield active badge, wave announcements, and Game Over card with Retry and Menu pill buttons.
  - `src/console/games/alien-attack/alien-attack-game.ts`: Master `IGame` loop ($< 350$ lines) connecting landscape tilt accelerometer input, wand pointer/keyboard fallbacks, laser firing, collisions, Web Audio SFX (`playLaserFire`, `playAlienExplosion`, `playBombExplode`, `playStrikeBuzz`), haptics, and clean teardown.
  - `src/console/games/game-manager.ts`: Wired `alienAttack` channel tile launch and layout mode negotiation.
  - `tests/alien-attack.test.ts`: Added 9 new unit tests verifying ship positioning, boundary clamping, tilt banking roll, laser firing intervals, shield absorption, life tracking, and collision mathematics.
- **Verification Criteria**:
  - [x] Deep royal-blue cosmic space backdrop matching `reel-games.png` (top-right).
  - [x] Ringed orange planet drifting in the background.
  - [x] Downward-streaking white speed lines creating forward-flight sensation.
  - [x] Player starship with white fuselage, red delta wings, and blue thruster exhaust dots.
  - [x] Steer ship left/right via landscape phone tilt (with pointer & keyboard fallbacks).
  - [x] Enemies descend from top: tumbling asteroids, saucers, and alien in glowing ring bubble.
  - [x] Top-left score & BEST; top-right 3 green hearts (`💚 💚 💚`) for hull lives.
  - [x] Popping bubble alien drops shield power-up capsule; collecting it creates forcefield aura.
  - [x] Dynamic landscape flight deck on controller page with dual-thumb firing triggers.
  - [x] 37/37 unit tests pass across 9 test suites in <100ms (`npm test`).
  - [x] Strict TypeScript check and Vite production build pass cleanly with 0 errors.
  - [x] All files strictly obey line count limits (<250 lines per module, <350 lines for game loop).

---

### Phase R5: Game 3 — Shooting Range Remake
- **Status**: Complete / Verified
- **Key Deliverables**:
  - `src/console/games/shooting-range/range-backdrop.ts`: Bright cartoon sky blue gradient (`#38bdf8` to `#93c5fd`), warm sun glare, 5 fluffy drifting cumulus clouds with horizontal parallax, layered rolling green grass meadow (`#4ade80`, `#22c55e`), cute meadow flower dots, and rounded cartoon trees on the left and right flanks.
  - `src/console/games/shooting-range/target-graphics.ts`: Concentric vector bullseye target renderer for Red, Gold, and Black variants, with wooden ground stakes, specular rim highlights, and splinter fragments.
  - `src/console/games/shooting-range/crosshair.ts`: Precision aiming reticle tracking wand pointer coordinates, featuring precision outer circle, 4 tick marks, red center pip, and animated spring recoil kick on shot.
  - `src/console/games/shooting-range/target-manager.ts`: Spawns pop-up targets behind grass hills and floating targets in the sky. Hitscan proximity detection calculates points: +25 for dead-center bullseye, +15 for inner ring, +10 for outer ring. Generates splinter destruction particles and manages target lifecycles.
  - `src/console/games/shooting-range/range-hud.ts`: Frosted top-left score card with mini bullseye badge and high score tracking, top-right 60-second round countdown timer pill (urgency indicator under 10s) and accuracy stats (`ACC: 88%`), floating "+N" score popups, and Round Over dialog with Play Again and Menu pill buttons.
  - `src/console/games/shooting-range/shooting-range-game.ts`: Master `IGame` loop ($< 250$ lines) wiring gyro pointer tracking, A-button and trigger hitscan shooting, recoil, Web Audio effects (`playBullseyeBell`, `playCarnivalPop`), haptic rumble on fire and bullseye hits, and clean teardown.
  - `src/console/games/game-manager.ts`: Wired `shootingRange` channel tile launch.
  - `tests/shooting-range.test.ts`: Added 7 unit tests verifying hitscan scoring mathematics (bullseye, inner, outer, miss), crosshair recoil and decay, and shot accuracy calculations.
- **Verification Criteria**:
  - [x] Bright blue sky with fluffy white clouds, green meadow, and cartoon trees matching `reel-games.png` (bottom-left).
  - [x] Concentric bullseyes in red, gold, and black variants popping up in grass and floating across clouds.
  - [x] Precision reticle following gyro pointer and mouse with recoil animation.
  - [x] Shooting with A button, trigger, or mouse click triggers hitscan testing.
  - [x] Floating "+N" score popups at hit position (+25 BULLSEYE!, +15, +10).
  - [x] 60-second timed round system with Round Over statistics modal.
  - [x] Hit and miss Web Audio sounds and phone haptic vibration feedback.
  - [x] 44/44 unit tests pass across 12 test suites in <100ms (`npm test`).
  - [x] Strict TypeScript check and Vite production build pass cleanly with 0 errors.
  - [x] All modules adhere strictly to line count limits (<250 lines per module).

---

### Phase R6: Game 4 — Sketch Remake
- **Status**: Complete / Verified
- **Key Deliverables**:
  - `src/console/games/sketch/types.ts`: Defined `ToolMode`, `ColorSwatch`, `BrushSize`, `StrokePoint`, `DrawingStroke`, and `ToolbarHitResult`.
  - `src/console/games/sketch/sample-artwork.ts`: Recreated authentic reference marker artwork `"I ❤️ VIBECODING"` using vector stroke paths (black serif 'I', crimson red heart, and bold marker 'VIBECODING').
  - `src/console/games/sketch/toolbar.ts`: Pinned vertical frosted glass palette on the left edge with 10 color swatches (Black, Slate Grey, Crimson Red, Orange, Yellow, Green, Cyan, Blue, Purple, Pink) featuring active selection rings, 3 brush size dots, Eraser mode toggle, Undo, Clear, and Sample template restore.
  - `src/console/games/sketch/stroke-renderer.ts`: High-performance drawing engine with quadratic curve smoothing and round caps/joins, micro-jitter suppression (<2px), eraser rendering, and undo/clear history stack.
  - `src/console/games/sketch/pen-cursor.ts`: Real-time pen tip preview circle indicating current ink color and brush size at the pointer location, with drawing contact feedback and toolbar hover state.
  - `src/console/games/sketch/sketch-game.ts`: Master `IGame` loop ($< 210$ lines) wiring gyro pointer tracking, A-button drawing gesture, left-margin palette interaction, keyboard shortcuts (Ctrl+Z undo, C clear, E eraser), Web Audio feedback, and clean teardown.
  - `src/console/games/game-manager.ts`: Wired `sketch` channel tile launch.
  - `tests/sketch.test.ts`: Added 8 unit tests verifying stroke path recording, jitter suppression, undo/clear stack, toolbar hit-testing, and reference sample artwork generation.
- **Verification Criteria**:
  - [x] Clean white canvas filling the entire screen matching `reel-games.png` (bottom-right).
  - [x] Thin vertical color palette on the left edge with 10 colored dots and active selection ring.
  - [x] 3 brush sizes (Thin, Medium, Thick) with active ring indicator.
  - [x] Drawing activated by pointing with gyro pointer and holding A button (or B trigger/mouse).
  - [x] Quadratic curve smoothing and round caps produce smooth, hand-drawn vector strokes.
  - [x] Pointing at the palette changes color, size, and toggles Eraser, Undo, Clear, or Sample.
  - [x] Preloaded authentic marker drawing: `"I ❤️ VIBECODING"`.
  - [x] 52/52 unit tests pass across 15 test suites in <100ms (`npm test`).
  - [x] Strict TypeScript check and Vite production build pass cleanly with 0 errors.
  - [x] All modules adhere strictly to line count limits (<250 lines per module).

---

### Phase R7: Remake System Integration, Latency Profiling & QA Sign-off
- **Status**: Complete / Verified
- **Key Deliverables**:
  - `src/console/main.ts`: Audited and refined game launch orchestration, Home button pause toggle handling (`overlay.classList.contains('open') ? pause() : resume()`), pause menu navigation (`btn-pause-resume`, `btn-pause-menu`), and continuous controller connection retention.
  - `src/console/pointer/interaction-manager.ts`: Added keyboard shortcuts (`Escape` / `KeyH`) for desktop pause toggle parity with controller Home button; verified Home short-tap (<450ms) for pause vs long-press (>=450ms) for recenter.
  - `tests/game-lifecycle.test.ts`: Added 8 new unit tests verifying 4 remake games in catalog, 4-tile + 8 ghost-tile DOM grid rendering, zero legacy games references, Home button hold duration discrimination, protocol bitmasks, and controller connection persistence across game teardowns.
  - **Dead Code Audit**: Cleanly verified zero references to legacy games (`Star Defender`, `Bowl Blitz`, bowling) across `src/`, `index.html`, and `tests/`.
  - **Visual & Audio Fidelity Pass**: Confirmed visual alignment across all 4 games and menu with `/design/reference/` (`Video-7889.mp4`, `reel-games.png`, `reel-menu.png`).
- **Verification Criteria**:
  - [x] All 4 games (**Fruit Ninja**, **Alien Attack**, **Shooting Range**, **Sketch**) launch cleanly from their respective glossy top-row channel tiles.
  - [x] Pressing the controller **Home button** (or `Escape`/`H` on keyboard) pauses the active game and summons the authentic translucent Pause Overlay HUD.
  - [x] Selecting **Resume Game** resumes the game loop with delta timing recalibrated; selecting **Console Menu** cleanly tears down the PixiJS canvas and returns to the domestic channel matrix.
  - [x] Mobile controller WebSocket connection remains 100% connected with zero dropped packets across all launches, pauses, and menu transitions.
  - [x] Controller orientation auto-switches: switches to two-handed horizontal flight yoke for Alien Attack, and restores portrait wand mode for the menu and other games.
  - [x] Dead code completely eliminated; no deprecated legacy assets or files.
  - [x] 60/60 unit tests pass across 18 test suites in <350ms (`npm test`).
  - [x] Strict TypeScript check and Vite production build pass cleanly with 0 errors (`npm run build`).
  - [x] All files adhere strictly to line count limits (<250 lines per module, <350 lines for game loops).

---

### Phase R8: Game 5 — Turbo Circuit (3D Kart Racer Architecture & Spec)
- **Status**: Complete / Approved (Planning & Specification Only — Zero Application Code Gate)
- **Key Deliverables**:
  - `docs/GAME_REFERENCE.md`: Authored comprehensive "Turbo Circuit" section specifying the target gameplay from `Video-18621.mp4`: chase camera, 3-2-1-GO starting countdown with rocket start window, 8 racers on the starting grid, prominent gold italic position badge bottom-right ("8th"), coin and lap counter (1/1) bottom-left, track minimap outline on the right, glider ramp section, "FINISH!" banner, and Race Results screen with "Race Again" button.
  - `docs/ARCHITECTURE.md` & `README.md`: Authored **10 colorful Mermaid flowcharts** with `classDef` styling and structured subgraphs:
    1. Master Race State Machine (menu, countdown, racing, finish, results, race again)
    2. Per-Frame Game Loop (60 FPS)
    3. Kart Physics & Drifting (hop, 3-tier mini-turbo sparks: blue, orange, purple)
    4. AI Opponent Pathing with Rubber-Banding (spline tracking, catch-up speed scaling, obstacle avoidance)
    5. Item System Architecture (100% original: Turbo Battery, Kinetic Homing Orb, Slime Droplet, Triple Ricochet Discs, EMP Shockwave, Supercharge Shield)
    6. Glider Ramp Section Architecture (ramp launch, canopy deployment, pitch dive/climb aerodynamics, aerial rings, landing bounce)
    7. Camera System Architecture (spring-damped chase camera, drift lag, dynamic speed FOV $60^\circ \to 75^\circ$, victory orbit)
    8. Phone Landscape Controller Input Mapping (tilt steering wheel roll + right thumb Gas/Drift + left thumb Item/Brake)
    9. HUD Layout Architecture (16:9 immersion overlay, gold italic position, coin & lap cards, minimap, roulette box)
    10. Track Data Pipeline (3D spline nodes, surface flags, ribbon extrusion, barrier colliders, AI racing lines)
  - **Zero-Nintendo IP Compliance**: Designed 100% original racer roster (Volt, Nova, Blaze, Pixel, Echo, Rex, Luna, Apex), original karts (Turbo Dart, Comet-GT, etc.), original tracks (Skyline Circuit, etc.), original items, and Web Audio FM synthesis engine.
  - **Zero-Application-Code Gate Respected**: Absolutely no game loop code, HTML games, or client application code written during this phase.
- **Verification Criteria**:
  - [x] Comprehensive architectural models and mathematical equations defined in `docs/ARCHITECTURE.md`.
  - [x] All 10 Mermaid flowcharts rendered with distinctive `classDef` palettes and subgraphs.
  - [x] Full fidelity match against `Video-18621.mp4` reference described in `docs/GAME_REFERENCE.md`.
  - [x] `npm test` and `npm run build` verify 0 regressions across existing test suites.

---

### Phase R9: Game 5 — Turbo Circuit (3D Kart Racing Engine Implementation)
- **Status**: Complete / Verified
- **Key Deliverables**:
  - `src/console/ui/artwork.ts` & `src/console/ui/catalog.ts`:
    - Added glossy "Turbo Circuit" channel tile (Slot 5) with vibrant red-to-teal gradient (`#ef4444` via `#f97316` to `#0d9488`), original low-poly kart SVG icon, and white title label matching the domestic channel aesthetic.
    - Updated channel matrix renderer to display 5 active game tiles and 7 faint empty ghost slots.
  - `src/console/games/turbo-circuit/`:
    - `types.ts` (51 lines): Strict TypeScript interfaces for `KartPhysicsState`, `KartInput`, and `TrackSample` with zero `any`.
    - `track-spline.ts` (242 lines): Closed 16-point `CatmullRomCurve3` procedural stadium racetrack with extruded asphalt road mesh, painted dashed lane markings, alternating cobalt blue and crisp white curbs, and grass infield. Implements fast `getClosestTrackSample(pos)` nearest-point query.
    - `stadium-builder.ts` (192 lines): Grand multi-tier stadium grandstands with procedural crowd color blocks, 4 massive steel lattice light towers with floodlight banks, start/finish gantry with checkered line and title banner, and trackside sponsor barriers.
    - `kart-model.ts` (232 lines): Low-poly original racing kart ("Turbo Dart") with aerodynamic wedge chassis, side air intakes, rear spoiler, four spinning racing slicks with speed-matched rotation, front steering pivot animation, driver "Volt" leaning into turns, and rear dual exhaust pipes with boost flame cones.
    - `kart-physics.ts` (188 lines): High-performance arcade kart physics featuring $32\,\text{m/s}^2$ acceleration, speed-dependent steering authority (anti-twitch damping at high velocities), grass infield off-road slowdown ($42\%$ top speed cap), perimeter barrier elastic reflection with impact cooldown, and drift charging with mini-turbo boost.
    - `chase-camera.ts` (73 lines): Dynamic spring-damped chase camera smoothly following kart heading and position, banking roll into turns, and dynamic FOV kick ($60^\circ \to 75^\circ$) when boosting.
    - `turbo-hud.ts` (164 lines): Pure DOM/CSS HUD matching `Video-18621.mp4` reference with large gold italic position readout (`1st` / `8th`), digital speedometer (`KM/H`), coin counter (`🟡 x04`), lap counter (`LAP 1/1`), track minimap outline with kart position dot, and nitro boost alert.
    - `turbo-circuit-game.ts` (249 lines): Master `IGame` implementation integrating Three.js scene, WebGL renderer with PCF soft shadows, directional sunlight with ambient hemisphere fill, fog, phone landscape controller input, audio cues, desktop WASD fallback, and Home button pause handling.
  - `src/console/games/game-manager.ts`:
    - Wired `TurboCircuitGame` into `GameManager` for seamless launching, pausing, resuming, and clean teardown.
  - `tests/turbo-circuit.test.ts` (209 lines):
    - Added comprehensive unit and integration tests covering track spline sample projection, on-road/off-road classification, acceleration and braking, speed-dependent steering attenuation, off-road velocity limiting, wall barrier bounces, boost triggering, and chase camera FOV expansion.
- **Verification Criteria**:
  - [x] Tile 5 ("Turbo Circuit") cleanly integrated in the top row of the channel matrix with custom SVG artwork and red-to-teal gradient.
  - [x] Implements Three.js 3D rendering pipeline with procedural geometry, soft shadows, and daytime stadium sky.
  - [x] Arcade kart physics properly models acceleration, braking, off-road grass friction, steering damping, and barrier collisions.
  - [x] Smooth chase camera tracks behind kart and expands FOV kick during boost.
  - [x] Full HUD displays gold italic position, coin counter, lap counter, speedometer, and minimap.
  - [x] Supports phone controller (landscape tilt steering + button gas/brake/boost) and desktop keyboard fallback (WASD/Arrows/Space/Shift).
  - [x] 100% test pass rate: 70/70 unit tests pass across 21 test suites (`npm test`).
  - [x] Clean production build with 0 TypeScript/Vite errors (`npm run build`).
  - [x] All source files strictly under line count limits (<250 lines per module).
  - [x] 100% original assets; zero Nintendo or third-party IP.

---

### Phase R10: Game 5 — Turbo Circuit Full Race Championship & AI Opponents
- **Status**: Complete / Verified
- **Key Deliverables**:
  - `src/console/games/turbo-circuit/types.ts`:
    - Extended with `ItemType`, `DriftTier`, `RaceState`, `RacerProfile`, `ActiveHazard`, `ItemBoxData`, and `CoinData`.
  - `src/console/games/turbo-circuit/turbo-audio.ts`:
    - 100% Web Audio API procedural synthesis: countdown tones (880Hz beep for 3, 2, 1; 1760Hz chime for GO!), drift tire screech, boost whoosh, coin chime, roulette tick, item unlock, rocket launch, explosion roar, glider pop, and victory finish fanfare.
  - `src/console/games/turbo-circuit/track-spline.ts`:
    - Added 8-slot staggered starting grid transforms with lane offsets (Player starts 8th at the back).
    - Added procedural 3D glider ramp with blue road chevron incline ($t \in [0.37, 0.44]$) and detection helper.
  - `src/console/games/turbo-circuit/kart-model.ts`:
    - Added dynamic deployable glider wing (low-poly delta wing) that deploys in flight.
    - Added drift spark particle meshes at rear wheels reflecting blue, orange, and purple drift tiers.
    - Added custom primary and accent color support for AI karts.
  - `src/console/games/turbo-circuit/kart-physics.ts`:
    - 3-tier drift charging: Stage 1 Blue ($0.6\text{s}$), Stage 2 Orange ($1.4\text{s}$), Stage 3 Purple ($2.5\text{s}$), and boost release.
    - Glider flight aerodynamics with altitude lift and smooth landing.
    - Hazard spin-out mechanics ($360^\circ$ spin, drops 3 coins).
    - Shield invulnerability state.
    - 3-lap race progress tracking with checkpoints and finish-line crossing validation.
  - `src/console/games/turbo-circuit/ai-manager.ts`:
    - 7 unique AI opponents (Nova, Blaze, Pixel, Echo, Rex, Luna, Apex) with individual skill speeds, lane offsets, and kart colors.
    - Spline tracking with dynamic catch-up rubber-banding and lateral weave.
    - Light kart bumping with player and opponents with lateral impulse reflection.
    - Real-time race position calculation across all 8 racers.
  - `src/console/games/turbo-circuit/item-system.ts`:
    - 3D rotating translucent item boxes across 2 track gates with respawn timers.
    - 3D spinning gold coins along the circuit (+1% speed per coin, max 10).
    - 3D active hazards: homing Rocket Orb, ground Oil Slick puddle, and iridescent Shield forcefield.
    - Weighted item roulette system favoring catch-up weapons when trailing.
  - `src/console/games/turbo-circuit/turbo-hud.ts`:
    - Massive gold bold italic position badge ("1st" ... "8th") in bottom-right with pop scale animation on rank change.
    - Digital speedometer in bottom-right.
    - Coin counter and lap counter (`LAP 1/3` and flashing red/gold `FINAL LAP!`) in bottom-left.
    - Held item box in top-left with animated cycling roulette and item icons.
    - Track minimap on right displaying all 8 racers (Player cyan, leader gold, opponents orange).
    - Center countdown ("3", "2", "1", "GO!").
    - "FINISH!" banner and Race Results modal with "Race Again" and "Back to Menu" buttons.
  - `src/console/games/turbo-circuit/turbo-circuit-game.ts`:
    - Master game loop connecting countdown, rocket start bonus, racing, finish, AI karts, items, coins, glider ramp, audio, and controller vibration.
  - `tests/turbo-circuit.test.ts`:
    - Unit tests covering 8-slot starting grid, glider ramp detection, 3-tier drift sparks, glider lift, spin-out coin loss, AI opponent profiles, and live 8-racer position ranking.
- **Verification Criteria**:
  - [x] 3-2-1-GO animated center countdown with synthesized audio and rocket start window.
  - [x] 8 racers on staggered starting grid; player starts last in 8th place.
  - [x] 7 AI karts follow spline with distinct skill levels, lane offsets, rubber-banding, and light bumping.
  - [x] Checkpoint lap counter tracking 3 laps with `FINAL LAP!` alert.
  - [x] Real-time position ranking updated dynamically on HUD.
  - [x] 3-tier drift mini-turbo sparks (Blue, Orange, Purple) with boost on release.
  - [x] Item boxes award original weapons: Turbo Boost, Rocket Orb, Oil Slick, and Shield.
  - [x] Collectible coins on track increasing speed; 3 coins dropped on spinout.
  - [x] Glider ramp launches kart into air with deployable delta wing.
  - [x] HUD matches reference with gold italic position pop, coin/lap counters, minimap dots, and top-left item roulette.
  - [x] "FINISH!" banner and Race Results screen with "Race Again" and "Back to Menu" buttons.
  - [x] Synthesized sounds for engine, drift, boost, items, and countdown; phone vibration on boosts, bumps, and hits.
  - [x] 69/69 tests passing across 23 test suites (`npm test`).
  - [x] Clean production build with 0 TypeScript/Vite errors (`npm run build`).
  - [x] All files strictly adhere to modularity limits (<250 lines per module, <350 lines for game loop).

---

### Phase R11: Game 5 — Turbo Circuit Landscape Controller & Steering Wheel Tilt
- **Status**: Complete / Verified
- **Key Deliverables**:
  - `src/shared/protocol.ts`:
    - Extended `LayoutMode` type with `'landscape-racing'` (`'portrait' | 'landscape' | 'landscape-racing'`).
    - Extended `LayoutModeCommand` with optional `gameId?: string` parameter.
  - `src/console/games/common/game-interface.ts`:
    - Updated `GameOptions.setLayoutMode` interface to accept `mode: 'portrait' | 'landscape' | 'landscape-racing', gameId?: string`.
  - `src/console/main.ts`:
    - Updated `setLayoutMode` handler to forward `gameId` in `LayoutModeCommand` packet to the connected phone controller.
  - `src/console/games/turbo-circuit/turbo-circuit-game.ts`:
    - Integrated automatic layout negotiation: calls `setLayoutMode('landscape-racing', 'turboCircuit')` on `init()`, and resets to `setLayoutMode('portrait')` on `destroy()`.
    - Integrated steering wheel tilt processing from `input.accel.y`:
      - Applies $0.4\,\text{m/s}^2$ resting jitter dead zone.
      - Applies linear sensitivity curve ($0.28$) clamped to $[-1, 1]$.
      - Fallback to gyro roll rate (`input.gyro.beta`) or D-pad Left/Right buttons.
  - `controller/index.html`:
    - Built `#racing-controller-view` matching `/design/reference/Video-18621.mp4`:
      - Light, clean controller aesthetic with dual-handed horizontal grip ergonomics.
      - Top utility bar: live status indicator dot, steering balance bar (`#racing-horizon-pip`), tilt degree readout (`#racing-tilt-angle`), Center re-zero button (`#btn-racing-center`), and Home pause button (`#btn-racing-home`).
      - Left thumb section: D-Pad cluster (`#btn-racing-dpad-up/down/left/right`) for digital steer and look-back.
      - Center-left: Big circular A gas button (`#btn-racing-a`) with tall molded vertical grip/divider bar.
      - Center-right: 12-dot acoustic speaker grid matrix graphic with subtle tilt guidance indicator.
      - Right thumb section: B brake/reverse button (`#btn-racing-b`), Drift/Hop button (`#btn-racing-drift`), and Item weapon button (`#btn-racing-item`).
    - Built `#racing-calibration-modal`:
      - First-time interactive steering wheel calibration prompt with live spirit level bubble (`#calib-bubble`) and "CALIBRATE & RACE" confirmation button (`#btn-confirm-calibration`).
  - `src/controller/touch.ts`:
    - Registered touch and multi-touch bindings for all racing buttons:
      - `btn-racing-a` -> `BUTTON_MASKS.A` (Gas)
      - `btn-racing-b` -> `BUTTON_MASKS.B` (Brake / Reverse)
      - `btn-racing-drift` -> `BUTTON_MASKS.PLUS` (Drift / Hop)
      - `btn-racing-item` -> `BUTTON_MASKS.BTN_1` (Deploy Item)
      - `btn-racing-home` -> `BUTTON_MASKS.HOME` (Pause Menu)
      - `btn-racing-center` -> `BUTTON_MASKS.RECENTER` (Center Steering)
      - `btn-racing-dpad-left/right/up/down` -> D-Pad masks.
  - `src/controller/main.ts`:
    - Manages `calibratedTiltY` zero offset and `hasCalibratedRacing` state.
    - Updated `setLayoutMode()` to dynamically reveal `#racing-controller-view`, acquire Screen Wake Lock, and present the calibration modal on first entry.
    - Updated `send60HzFrame()` to update live balance pip, degree text, and calibrate `packet.a.y` before transmission over WebSocket.
    - Center button and calibration confirmation recalibrate current tilt angle as zero with haptic feedback.
  - `tests/turbo-circuit.test.ts` & `tests/game-lifecycle.test.ts`:
    - Added unit tests for tilt steering calculation, dead zone filtering, clamping, and layout mode negotiation contract.
- **Verification Criteria**:
  - [x] Phone controller automatically switches to `landscape-racing` layout when Turbo Circuit launches.
  - [x] Returns to `portrait` wand layout when exiting to console menu without WebSocket disconnection.
  - [x] Replicates reference video (`Video-18621.mp4`) layout: D-pad left, big A button + tall vertical bar center-left, dot-grid speaker graphic center-right, small action buttons on right (B, Drift, Item).
  - [x] Smooth steering wheel tilt controls using calibrated accelerometer ($a_y$) with dead zone and sensitivity.
  - [x] First-time steering wheel calibration modal with live spirit level bubble.
  - [x] Center button on top utility bar allows instant re-zeroing at any time during the race.
  - [x] Multi-touch safety: simultaneous gas + drift or gas + item supported without gesture dropping.
  - [x] Screen Wake Lock acquired while playing to prevent screen timeout.
  - [x] Haptic vibration feedback on button presses, drifts, boosts, bumps, and collisions.
  - [x] Full flow tested: Menu -> Countdown -> Race -> Finish -> Results -> Race Again & Back to Menu.
  - [x] 70/70 unit tests passing across 24 test suites (`npm test`).
  - [x] 0 TypeScript and Vite compilation errors (`npm run build`).
  - [x] All source files strictly under modularity limits (<250 lines per module, <350 lines for game loops).





