# NimbusPlay — Reference Analysis & Game Remake Specification

This document provides a comprehensive technical breakdown of the target reference system analyzed from `/design/reference/Video-7889.mp4`, `/design/reference/reel-games.png`, and `/design/reference/reel-menu.png`. It serves as the single source of truth for the **NimbusPlay Game Remake**.

---

## 1. Executive Summary & Reference Overview

The reference implementation demonstrates an authentic Wii-inspired web console experience where an Android smartphone running Chrome acts as a wireless motion controller ("Wii Remote / Nimbus Wand").

The system features:
1. **Console Channel Matrix**: A 4×3 grid where the top row holds **exactly 4 colored game tiles**, with empty translucent tiles below, a live digital clock, and a direct pairing QR code badge in the bottom bar.
2. **Exactly 4 Games**:
   - **Game 1: Fruit Ninja** — Juicy fruit slicing on vertical cedar planks with glowing blade trails and juice splatter decals.
   - **Game 2: Alien Attack** — 3D perspective rail-shooter in cosmic deep space controlled via **two-handed landscape phone tilt & dual-thumb firing**.
   - **Game 3: Shooting Range** — Carnival target shooting with animated pop-up concentric bullseye targets against a sunny sky and rolling green grass.
   - **Game 4: Sketch** — Real-time interactive whiteboard canvas with multi-color palette, brush sizes, and fluid freehand vector drawing.
3. **Removed Legacy Games**: **Star Defender** (2D turret shooter) and **Bowl Blitz** (bowling simulation) are replaced and removed from the active plan.

---

## 2. Comprehensive Comparison: Current NimbusPlay vs. Reference Target

| System Component | Current NimbusPlay Implementation | Reference Target System (`Video-7889.mp4` & Images) | Remake Architectural Gap / Required Changes |
| :--- | :--- | :--- | :--- |
| **Channel Menu Grid** | 4×3 grid with Slice Party, Star Defender, Bowl Blitz, Settings, Pairing, Calibration, and Onboarding spread across rows 1–3. | 4×3 grid with **exactly 4 colored gradient tiles on the top row**: Fruit Ninja (orange), Alien Attack (green), Shooting Range (blue), Sketch (purple). Rows 2 & 3 are clean frosted white tiles. | Reorganize channel matrix so top row exclusively houses the 4 playable games with distinct gradient fills and custom SVGs; move utilities to bottom tray. |
| **Bottom Shelf & Pairing** | Bottom dock houses circular disk buttons and clock; QR code is inside a separate full modal dialog. | Bottom bar features molded dock with clock in center and a **small, high-contrast QR code badge directly on the bottom-right**. | Embed live pairing QR code canvas directly into the bottom-right shelf corner for instant 1-second pairing without opening a modal. |
| **Game 1: Fruit Slicing** | *Slice Party*: PixiJS 2D slicing, dojo background, 3 lives (hearts), basic combo banner. | *Fruit Ninja*: Vertical wooden cedar wall with realistic plank seams; top-left watermelon icon + score & `BEST`; top-right three red `X X X` strike markers; persistent sticky juice splatters on wood; explosive fruit cuts. | Restyle backdrop to authentic vertical planks; replace heart lives with `X X X` strikes; add sticky wall splatters; align typography and icons with reference. |
| **Game 2: Space Combat** | *Star Defender*: 2D bottom turret aiming upward at descending 2D alien saucers; portrait wand grip. | *Alien Attack*: **Into-the-screen 3D rail-shooter**! White starship with red delta wings flying into deep space; glowing nebula clouds, ringed gas giant planet; circular 3D targeting portal; **landscape two-handed phone tilt steering & dual firing**. | Complete game overhaul: migrate from 2D turret to 3D forward-flight perspective; implement controller landscape mode with tilt steering ($\beta, \gamma$) and dual-thumb touch triggers. |
| **Game 3: Target Shooting** | *Bowl Blitz*: Pseudo-3D bowling alley with accelerometer throw gestures, 10 pins, and scorecard. | *Shooting Range*: Sunny daytime carnival target range; bright blue sky, puffy white drifting clouds, lush green grass hill, pop-up concentric ring bullseye targets (red, orange, black), hitscan aiming, floating score popups (`+16`, `+20`). | Replace bowling game entirely with carnival target shooter module: cloud drift, grass backdrop, pop-up animated bullseye targets, hitscan pointer shooting. |
| **Game 4: Drawing Canvas** | *None* (Only Settings/Calibration channels existed). | *Sketch*: Clean digital whiteboard (`#FFFFFF`); left vertical color palette (red, orange, yellow, green, cyan, blue, purple, black); brush size selectors; continuous vector pen drawing with **A** button held. | Build new interactive drawing application module: Catmull-Rom / Bézier stroke smoothing, multi-color palette, brush radius, eraser, and clear tools. |
| **Controller Orientation** | Portrait-only orientation lock across all games. | **Dynamic Orientation**: Portrait for Menu, Fruit Ninja, Shooting Range, and Sketch; **Landscape for Alien Attack** with dual-thumb controls. | Introduce `orientation` protocol flag and dynamic controller UI switching between portrait wand and landscape flight yoke. |

---

## 3. Reference Game 1: Fruit Ninja

### 3.1 Visual Presentation & Environment
- **Backdrop**: Vertical hardwood timber planks (warm honey/amber cedar boards with visible woodgrain texture and recessed dark seams).
- **Spawn Mechanics**: Fruits are tossed from below the viewport bottom in gravity-curved parabolic arcs ($v_y \in [900, 1400]\,\text{px/s}$, $g \approx 1200\,\text{px/s}^2$) with random angular rotation ($\omega \in [-4, 4]\,\text{rad/s}$).
- **Fruit Entities**:
  - **Watermelon**: Large green striped spherical rind, bright crimson interior flesh with black seeds.
  - **Orange**: Citrus textured peel, bright orange pulp segments.
  - **Apple / Strawberry**: Glossy red skin, cream core.
  - **Banana / Pineapple**: Radiant yellow tropical fruit.
  - **Bomb**: Matte black iron sphere with glowing sparks spitting from the fuse cord.
- **Slice Physics & Splatters**:
  - When sliced, fruits separate cleanly along the cut plane into two halves.
  - Halves receive an outward impulse perpendicular to the cut vector: $\vec{v}_{\text{half}} = \pm v_{\text{sep}} \cdot \hat{n}_{\text{cut}}$ and spin apart.
  - **Sticky Juice Decals**: Radial juice droplet bursts splatter against the wooden planks behind the cut and slowly fade over 8–10 seconds.
  - **Blade Trail**: Glowing white-hot inner ribbon with cyan/yellow energy outer glow and fading spark particles.

### 3.2 HUD & Scoring
- **Top-Left Header**:
  - Stylized 2D sliced watermelon wedge icon.
  - Large bold white score readout with subtle dark outline (e.g. `49`).
  - Below score: Subtitle `BEST: 49` in muted gray/white tracking.
- **Top-Right Header**:
  - Three bold strike markers: `X X X`.
  - Unused strikes are translucent/gray (`#4B5563`); each dropped fruit activates a strike in vibrant red (`#EF4444`).
  - Three strikes trigger **Game Over**.
- **Scoring Rules**:
  - Slicing 1 fruit = $+1$ point.
  - Multi-fruit combo (2+ fruits in single continuous swipe) = $+N$ combo bonus points with musical arpeggio chimes and floating combo text (e.g., `COMBO x3!`).
  - Hitting a bomb detonates immediately, triggering full-screen flash, rumble, and instant Game Over.

### 3.3 Motion & Input Mapping
- **Phone Grip**: Portrait, single-handed wand grip.
- **Motion Sensor**: Gyroscopic yaw ($\alpha$) and pitch ($\beta$) mapped via One Euro filter to cursor position.
- **Input Action**:
  - Holding **A button** (or B trigger) engages the blade.
  - Quick physical swing of the arm generates velocity $> 1200\,\text{px/s}$, drawing the blade ribbon and testing swept-segment collisions against fruit hitboxes.

### 3.4 Web Audio Synthesis Recipe
- **Blade Whoosh**: Bandpass-filtered white noise burst ($Q = 3.5$, center frequency swept $800\,\text{Hz} \to 3200\,\text{Hz}$ in $90\,\text{ms}$).
- **Juicy Splat**: Layered dual-tone: high-frequency squelch ($1800\,\text{Hz} \to 400\,\text{Hz}$) + low-mid resonant pop ($220\,\text{Hz} \to 80\,\text{Hz}$) + short noise impact ($40\,\text{ms}$).
- **Bomb Detonation**: Sub-bass rumble ($45\,\text{Hz}$) combined with low-pass filtered white noise roar ($200\,\text{Hz}$ cutoff, $1.2\,\text{s}$ decay) and screen shake.
- **Combo Chime**: Pentatonic harmonic chord ($C_5, E_5, G_5, C_6$) synthesized with sine oscillators and soft decay.

---

## 4. Reference Game 2: Alien Attack

### 4.1 Visual Presentation & Environment
- **Perspective**: **True 3D forward rail-shooter** looking down a deep cosmic corridor into the screen ($Z$-depth perspective).
- **Environment Elements**:
  - Deep indigo/midnight blue space void.
  - Volumetric glowing nebula clouds in magenta, cyan, and deep purple floating in the background.
  - **Majestic Ringed Gas Giant**: A large Saturn-like planet with orange/tan cloud belts and diagonal concentric rings anchored in the upper-right quadrant.
  - Streaking warp starfield particles flying forward past the player ship to convey high-speed forward travel.
  - Floating 3D space debris and asteroids tumbling in space.
- **Player Starship**:
  - Centered at the bottom of the screen, facing forward into the depth.
  - Sleek aerodynamic white fuselage with vibrant red delta wings and blue canopy glass.
  - Twin animated blue thruster flame particles pulsating with speed.
  - Ship tilts and banks in roll and pitch as the player steers.
- **Targeting & Enemies**:
  - A glowing golden circular targeting portal / reticle ring hovers forward in 3D space.
  - Enemy alien saucers and drones fly out of the distance toward the player in sinusoidal formations.
  - Dual cyan laser bolts travel forward from ship wingtips toward the targeting reticle ring into the distance ($z: 0 \to 1000$).

### 4.2 HUD & Scoring
- **Top-Left Header**:
  - Clean digital score readout in bold white (e.g. `640`).
- **Top-Right Header**:
  - Three bright green spaceship / heart glyphs (`🚀 🚀 🚀`) indicating shield / hull integrity.
  - Taking enemy hits loses 1 shield; 0 shields triggers Game Over.
- **Scoring Rules**:
  - Destroying basic alien drone: $+20$ points.
  - Destroying elite formation leader: $+50$ points.
  - Wave clear bonus: $+200$ points.

### 4.3 Motion & Input Mapping (**Key Controller Innovation**)
- **Phone Grip**: **Two-handed horizontal landscape grip!**
- **Controller UI**:
  - When Alien Attack launches, the controller switches its UI to **Landscape Flight Mode**.
  - Left thumb touch pad / button: Primary laser fire.
  - Right thumb touch pad / button: Secondary / rapid laser fire.
- **Motion Sensors**:
  - **Roll ($\gamma$)**: Tilting the phone left or right banks the spaceship and steers horizontal aim ($X$).
  - **Pitch ($\beta$)**: Tilting the phone up or down raises or lowers the ship altitude and vertical aim ($Y$).
  - In landscape mode, gravity vector filtering ensures natural steering feel akin to a flight yoke.

### 4.4 Web Audio Synthesis Recipe
- **Twin Plasma Laser**: Dual square-wave chirps ($2400\,\text{Hz} \to 280\,\text{Hz}$ in $65\,\text{ms}$) with light resonant low-pass filter and stereo panning.
- **Alien Explosion**: Crunchy noise burst through a modulated bandpass filter ($600\,\text{Hz} \to 120\,\text{Hz}$) with mid-frequency crunch.
- **Shield Deflection**: Metallic ping ($1500\,\text{Hz}$ sine with fast exponential decay and chorus modulation).
- **Warp Ambiance**: Subtle low-frequency sine drone ($55\,\text{Hz}$) with gentle phase flange conveying cosmic flight.

---

## 5. Reference Game 3: Shooting Range

### 5.1 Visual Presentation & Environment
- **Theme**: Cheerful carnival / archery target range on a bright, sunny afternoon.
- **Environment Layers**:
  - **Background Sky**: Vibrant cartoon sky blue (`#38BDF8` to `#60A5FA` vertical gradient).
  - **Clouds Layer**: Stylized puffy white cartoon cumulus clouds drifting horizontally across the sky with gentle parallax.
  - **Foreground Hills**: Smooth lush green rolling grassy horizon (`#4ADE80` to `#22C55E`) occupying the bottom third of the screen, with cute rounded cartoon trees on the flanks.
- **Target Entities**:
  - **Red Concentric Bullseye**: Outer dark rim, alternating red and white rings, vibrant red central bullseye.
  - **Orange Bullseye**: Warm orange and cream rings with orange center pip.
  - **Black/Yellow Bullseye**: High-contrast black and white rings with golden yellow center.
  - Targets pop up dynamically from behind the grass hill on wooden poles or float across the sky on balloons.
- **Reticle & Impact**:
  - Circular dark crosshair with outer ring and precision center dot following the wand pointer.
  - On trigger pull: instantaneous hitscan line-of-sight check.
  - Hitting a target triggers a wood shatter / balloon pop animation, target spinning away, and floating colorful score text (`+16`, `+20`, etc.).

### 5.2 HUD & Scoring
- **Top-Left Header**:
  - Frosted rounded pill card containing the score in crisp dark font (e.g. `355`).
- **Scoring Mechanics**:
  - Center bullseye hit: $+20$ points (clean ping sound).
  - Middle ring hit: $+15$ points.
  - Outer ring hit: $+10$ points.
  - Penalty / Obstacle target (if hit): $-20$ points (buzzer sound).
  - Timed round: 60-second timer to score as many points as possible.

### 5.3 Motion & Input Mapping
- **Phone Grip**: Portrait, single-handed wand grip.
- **Motion Sensor**: Gyro yaw ($\alpha$) and pitch ($\beta$) direct the on-screen crosshair with high precision and low jitter.
- **Input Action**:
  - Tapping the **A button** (or pulling the **B trigger**) fires an instantaneous hitscan shot at the crosshair position.
  - Recenter action (Home button or Recenter button) resets crosshair to center screen.

### 5.4 Web Audio Synthesis Recipe
- **Rifle / Carnival Pop**: Sharp high-frequency transient click ($3000\,\text{Hz}$) followed by a short white-noise puff ($45\,\text{ms}$) with low-pass dampening.
- **Bullseye Bell**: Clear resonant metallic bell tone ($1760\,\text{Hz}$ sine wave with slow $500\,\text{ms}$ harmonic decay).
- **Target Splinter**: Quick cluster of 3 micro noise clicks simulating wooden dowel snapping.
- **Buzzer / Penalty**: Sawtooth double buzz ($140\,\text{Hz} \to 120\,\text{Hz}$) for invalid or penalty target hits.

---

## 6. Reference Game 4: Sketch

### 6.1 Visual Presentation & Environment
- **Theme**: Minimalist, responsive digital whiteboard and creative studio easel.
- **Canvas Surface**: Clean ceramic white drawing area (`#FFFFFF`) filling the stage.
- **Left Vertical Toolbar**:
  - Pinned elegantly to the left margin with rounded corners and subtle drop shadow.
  - **Vertical Color Swatches**:
    1. Crimson Red (`#EF4444`)
    2. Vibrant Orange (`#F97316`)
    3. Sunny Yellow (`#FACC15`)
    4. Leaf Green (`#22C55E`)
    5. Sky Blue / Cyan (`#06B6D4`)
    6. Royal Navy Blue (`#2563EB`)
    7. Deep Violet / Purple (`#8B5CF6`)
    8. Charcoal Black (`#1F2937`)
  - **Tool Controls**:
    - Brush Size Selectors: Thin ($4\,\text{px}$), Medium ($8\,\text{px}$), Thick ($16\,\text{px}$).
    - Eraser Mode: Erases existing strokes to canvas white.
    - Clear Canvas Button: Instantly clears the entire board with an animated erase sweep.
- **Drawing Stroke Quality**:
  - Smooth, anti-aliased freehand vector strokes with round caps and joins.
  - Catmull-Rom spline interpolation between sampled pointer coordinates to eliminate jagged polygon edges during fast hand movements.
  - In the reference video, the phrase `"I ❤️ VIBECODING"` is written with fluid, natural calligraphy.

### 6.2 HUD & Status
- Minimalist unobtrusive status indicator showing current color and stroke width in the toolbar.
- No timer or lives; pure sandbox creative utility.

### 6.3 Motion & Input Mapping
- **Phone Grip**: Portrait, single-handed wand grip.
- **Motion Sensor**: Pointer tracks phone gyroscopic heading.
- **Input Action**:
  - Hover over a toolbar swatch and tap **A** to select color or tool.
  - Point at the canvas, press and **hold A button** (or B trigger) to lower the pen and draw continuously.
  - Releasing the button lifts the pen from the virtual canvas.
  - Recenter action (Home button) re-anchors pointer to screen center.

### 6.4 Web Audio Synthesis Recipe
- **Pen Scratch / Marker Squeak**: Continuous subtle filtered noise envelope ($1200\,\text{Hz} \to 1800\,\text{Hz}$ bandpass) playing softly while drawing is active.
- **Color Click**: Soft bubble pop sine blip ($660\,\text{Hz} \to 990\,\text{Hz}$).
- **Clear Canvas Chime**: Ascending 3-note glockenspiel chime ($E_5 \to G_5 \to B_5$) on canvas wipe.

---

## 7. Assumptions & Engineering Decisions

1. **Orientation Auto-Switching Protocol**:
   - The console communicates the required controller layout via WebSocket message:
     `{ type: 'LAYOUT_MODE', mode: 'portrait' | 'landscape' }`.
   - On launching **Alien Attack**, the console sends `mode: 'landscape'`, instructing the controller web app to rotate its UI and prompt the user to hold the phone sideways.
   - For all other games (Fruit Ninja, Shooting Range, Sketch) and the Channel Menu, `mode: 'portrait'` is used.

2. **Game Module Boundaries**:
   - Every game implements the standard `IGameInstance` lifecycle interface (`init`, `start`, `pause`, `resume`, `handleInput`, `destroy`).
   - Old game modules (`star-defender` and `bowl-blitz`) are archived from active rotation; new modules are built in `src/console/games/`:
     - `fruit-ninja/` (upgraded from slice-party with vertical cedar plank art, `X X X` strikes, wall splatters)
     - `alien-attack/` (new 3D forward rail-shooter)
     - `shooting-range/` (new carnival target shooter)
     - `sketch/` (new interactive whiteboard)

3. **Asset Synthesis & Zero-Nintendo Rule**:
   - All visual elements remain 100% original vector SVG and procedural PixiJS graphics.
   - No copyrighted Nintendo assets, characters, sounds, or trademarks.
   - All audio is procedurally synthesized via the Web Audio API.

4. **Pairing QR Code Integration**:
   - The pairing QR code is rendered directly on the bottom-right corner of the console firmware shelf, matching the reference video.

