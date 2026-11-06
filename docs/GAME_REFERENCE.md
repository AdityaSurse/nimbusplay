# NimbusPlay — Reference Analysis & Game Remake Specification

This document provides a comprehensive technical breakdown of the target reference system analyzed from `/design/reference/Video-7889.mp4`, `/design/reference/reel-games.png`, and `/design/reference/reel-menu.png`. It serves as the single source of truth for the **NimbusPlay Game Remake**.

---

## 1. Executive Summary & Reference Overview

The reference implementation demonstrates an authentic Wii-inspired web console experience where an Android smartphone running Chrome acts as a wireless motion controller ("Wii Remote / Nimbus Wand").

The system features:
1. **Console Channel Matrix**: A 4×3 grid where the top row houses the primary game tiles, with empty translucent tiles below, a live digital clock, and a direct pairing QR code badge in the bottom bar.
2. **Exactly 5 Games (Including 5th Game: Turbo Circuit)**:
   - **Game 1: Fruit Ninja** — Juicy fruit slicing on vertical cedar planks with glowing blade trails and juice splatter decals.
   - **Game 2: Alien Attack** — 3D perspective rail-shooter in cosmic deep space controlled via **two-handed landscape phone tilt & dual-thumb firing**.
   - **Game 3: Shooting Range** — Carnival target shooting with animated pop-up concentric bullseye targets against a sunny sky and rolling green grass.
   - **Game 4: Sketch** — Real-time interactive whiteboard canvas with multi-color palette, brush sizes, and fluid freehand vector drawing.
   - **Game 5: Turbo Circuit** — An original high-octane 3D kart racing game featuring 8 racers on the grid, dynamic chase camera, 3-2-1-GO countdown, glider ramps, 3-tier drift mini-turbos, rubber-banded AI, and full landscape dual-hand tilt steering with touch gas/drift/item buttons.
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
| **Game 5: 3D Kart Racing** | *None* (Brand new 5th game). | *Turbo Circuit* (`Video-18621.mp4`): Full 3D kart racer; 8 racers on starting grid; dynamic chase camera; 3-2-1-GO countdown; big gold italic position badge bottom-right ("8th"); coin and lap counter (1/1) bottom-left; track minimap on right; glider ramp section; "FINISH!" banner; Race Results screen with "Race Again" button; two-handed landscape phone steering wheel controls. | Build new 3D kart racing engine: 3D track spline pipeline, pseudo-3D/WebGL projection, kart physics with 3-tier drift mini-turbos, 7 rubber-banded AI racers, glider flight physics, original item arsenal, and landscape racing wheel controller layout. |
| **Controller Orientation** | Portrait-only orientation lock across all games. | **Dynamic Orientation**: Portrait for Menu, Fruit Ninja, Shooting Range, and Sketch; **Landscape for Alien Attack & Turbo Circuit** with dual-thumb controls. | Introduce `orientation` protocol flag and dynamic controller UI switching between portrait wand and landscape flight yoke / racing wheel. |

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

## 7. Reference Game 5: Turbo Circuit (3D Kart Racer)

### 7.1 Visual Presentation & Environment (`Video-18621.mp4`)
- **Visual Style & Perspective**:
  - Full-fidelity 3D forward-view kart racer with a dynamic third-person chase camera positioned tightly behind and slightly above the player's kart.
  - High-saturation, optimistic arcade aesthetic: neon curbs, vibrant asphalt with tire marks, roadside grandstands, holographic chevron billboards, and drifting trackside clouds.
- **Starting Grid & Racers**:
  - Exactly **8 racers on the starting grid** in staggered dual-column pole positions:
    - 1 human player (P1) starting in 8th position at the back of the pack.
    - 7 autonomous AI opponents positioned ahead on the grid.
  - **Original Racer Roster (Zero Third-Party IP)**:
    1. **Volt**: High-speed neon-yellow cyber suit, driving the *Turbo Dart*.
    2. **Nova**: Sleek cyan-tinted astro-pilot, driving the *Comet-GT*.
    3. **Blaze**: Fiery crimson-armored speedster, driving the *Inferno-X*.
    4. **Pixel**: Retro teal-and-magenta robotic racer, driving the *Bit-Runner*.
    5. **Echo**: Emerald-green sonic specialist, driving the *Wave-Rider*.
    6. **Rex**: Heavyweight orange mech pilot, driving the *Titan-Cruiser*.
    7. **Luna**: Royal violet cosmic navigator, driving the *Lunar-Drifter*.
    8. **Apex**: Midnight-black elite rival, driving the *Phantom-V*.
- **Race Start Sequence**:
  - Cinematic 2-second starting grid camera sweep settling behind Player 1.
  - Large center-screen **"3... 2... 1... GO!"** animated countdown numbers with synchronized audio beeps (3 low warning tones at 440Hz followed by an energetic high-pitched GO chime at 880Hz).
  - **Rocket Start Mechanic**: Holding the Gas button on the controller at the exact moment "2" fades into "1" grants a burst of starting boost; holding too early causes engine burnout / wheelspin stall.
- **Glider Ramp Aerial Section**:
  - Key track spectacle featured in the reference video: the road leads to a prominent elevated ramp with bright cyan-and-yellow glowing chevron arrows.
  - Hitting the glider ramp launches the kart skyward, immediately deploying an **aerodynamic triangular hang-glider wing** above the chassis.
  - Gravity drops to 25%, and aerodynamic lift engages:
    - Pitching the phone forward dips the nose to dive (sacrificing altitude for forward velocity).
    - Pitching the phone backward flares the nose (trading airspeed for sustained airtime).
    - Rolling the phone banks the glider left or right through aerial boost rings suspended in the clouds.
  - When the kart descends to track elevation, the glider automatically retracts, the suspension compresses with a metallic bounce sound, and a mini-boost is awarded on clean touchdown.
- **Race Conclusion & Results Screen**:
  - Crossing the finish line on the final lap triggers a massive gold-and-checkered **"FINISH!"** banner across the viewport with confetti particles and an original victory fanfare.
  - Camera transitions into an autonomous cinematic victory orbit around the player's kart as AI autopilot safely guides the kart along the track deceleration lane.
  - Fade-in to the **Race Results Screen**:
    - Frosted glass leaderboard displaying the final standings for all 8 racers: Finish Position (1st–8th), Character Name, Kart Model, Total Time (`mm:ss.ms`), and Best Lap Time.
    - Large high-emphasis **"Race Again"** pill button (re-starts race on the starting grid) and secondary **"Exit to Menu"** pill button (returns cleanly to the Nimbus Channel Matrix).

### 7.2 HUD & Telemetry Layout (Reference Fidelity)
```
+---------------------------------------------------------------------------------------+
|                               [ ( ? ) ITEM ROULETTE ]                                 |
|                                                                                       |
|                                                                                       |
|                                                                    /|  (Minimap)      |
|                                                                   / |                 |
|                                                                  |  |  [P1] Cyan Dot  |
|                                                                   \ |  [*] AI Dots    |
|                                                                    \|                 |
|                                                                                       |
|                                                                                       |
|  🟡 x04 (Coins)                                                      // 8th //        |
|  LAP 1/1                                                           [GOLD ITALIC]      |
+---------------------------------------------------------------------------------------+
```
- **Bottom-Right**:
  - **Massive Gold Italic Position Badge**: Displays current race rank in bold expanded italic typography (`8th`, `7th`, ..., `1st`) with a polished metallic gold gradient (`#FACC15` to `#EAB308`), dark drop shadow, and dynamic scaling pop whenever position changes.
- **Bottom-Left**:
  - **Coin Counter**: Shiny golden coin icon with counter (`🟡 x04` / max 10). Collecting coins scattered along the track increases top speed by $+1.0\%$ per coin (up to $+10\%$). Getting hit drops 3 coins on the track.
  - **Lap Counter**: Bold high-contrast white text reading `LAP 1/1` (single-lap sprint) or `LAP 1/3` with pulsating red `FINAL LAP!` alert upon entering the last lap.
- **Center-Right**:
  - **Track Minimap Wireframe**: Semi-transparent vector contour of the circuit with live color-coded marker blips:
    - Player 1 = Bright Cyan circle with directional pointer arrow.
    - AI Opponents = Orange/Yellow circles.
    - 1st Place Leader = Glowing crown badge.
- **Top-Center**:
  - **Item Slot Box**: Translucent rounded square HUD frame. Running over an Item Box triggers a high-speed spinning roulette animation (cycling through item icons with ticking SFX for 1.2s) before locking onto the awarded weapon.

### 7.3 Motion & Input Mapping (Landscape Wheel Grip)
- **Physical Grip**: **Two-handed horizontal landscape grip**. The phone behaves as an ergonomic wireless racing steering wheel.
- **Sensor Ingestion & Steering**:
  - **Steering Angle ($\theta_{\text{steer}} \in [-1.0, +1.0]$)**: Derived from the phone's lateral tilt (roll angle $\gamma$).
  - **Adaptive Deadzone & Sensitivity**: A central deadzone of $\pm 0.6^\circ$ prevents resting tremors; non-linear cubic response curve provides gentle micro-adjustments on straights and aggressive lock on sharp hairpins.
  - **Horizon Balance Bar**: A subtle HUD indicator on the controller screen shows the phone's current tilt angle in real time.
- **Controller Touch Zones**:
  - **Right Thumb Zone**:
    - **GAS (Accelerate)**: Large primary circular button on the lower-right; holding accelerates the kart with simulated engine RPM build.
    - **DRIFT / HOP**: Ergonomic arc button placed directly above GAS; tapping initiates a hop, holding during a turn locks into a power slide drift.
  - **Left Thumb Zone**:
    - **ITEM**: Large primary circular button on the lower-left; tapping deploys the currently held item (forward throw by default; pulling down fires backward).
    - **BRAKE / REVERSE**: Secondary arc button placed below ITEM; tapping brakes, holding reverses.
  - **Top Utility Row**:
    - **REAR VIEW**: Hold to temporarily look backward with the camera.
    - **RECENTER**: Tap to re-zero the steering wheel center angle.
    - **HOME**: Opens the console Pause Overlay HUD.

### 7.4 Kart Physics, Drifting & Boost Sparks
- **Longitudinal Physics**:
  $$F_{\text{net}} = F_{\text{engine}} - F_{\text{drag}} - F_{\text{friction}} - F_{\text{grade}}$$
  $$F_{\text{engine}} = T(\text{RPM}) \cdot \text{gasInput}, \quad F_{\text{drag}} = \frac{1}{2} C_d \rho A v^2, \quad F_{\text{friction}} = \mu_{\text{surface}} m g$$
- **Drift Mechanics**:
  1. **Hop Initiation**: Pressing **DRIFT** while turning makes the kart hop ($15\,\text{px}$ vertical displacement with suspension sound).
  2. **Drift Lock**: Upon landing, the kart locks into drift mode, angling inward while rear tires slide outward. Counter-steering allows widening or tightening the turning radius without breaking drift.
  3. **3-Stage Mini-Turbo Charging**:
     - Sustaining the drift charges spark particles from the rear wheel hubs:
       - **Stage 1 (Mini-Turbo)**: Reached after $0.8\,\text{s}$ of continuous drifting. Bright **Blue sparks** $\implies$ release awards $+15\%$ speed boost for $0.8\,\text{s}$.
       - **Stage 2 (Super Mini-Turbo)**: Reached after $1.8\,\text{s}$. Vibrant **Orange/Yellow sparks** $\implies$ release awards $+30\%$ speed boost for $1.4\,\text{s}$.
       - **Stage 3 (Ultra Mini-Turbo)**: Reached after $3.0\,\text{s}$. Radiant **Purple/Magenta sparks** $\implies$ release awards $+45\%$ speed boost for $2.0\,\text{s}$.
     - Releasing the **DRIFT** button unleashes the boost surge: camera FOV widens, exhaust pipes spit matching colored flames, and a punchy audio boost whoosh plays.

### 7.5 Glider Flight Aerodynamics
- **Flight Model**:
  $$\text{Lift} = \frac{1}{2} C_L \rho v^2 A_{\text{wing}}, \quad \text{Drag} = \frac{1}{2} C_D \rho v^2 A_{\text{wing}}$$
- **Glide Controls**:
  - Glider deploys automatically off marked jump ramps.
  - Tilting phone forward (pitch down) dips the nose: increases descent rate, converts gravity into forward speed ($+25\%$).
  - Tilting phone backward (pitch up) pulls the nose up: levels out trajectory, extends airtime across chasms, but gradually bleeds airspeed.
  - Rolling phone banks the glider through floating aerial rings that yield speed boosts and coin clusters.

### 7.6 AI Opponent Pathing & Rubber-Banding
- **Spline Path Navigation**:
  - The track is encoded as a 3D parametric Catmull-Rom spline with center coordinates and track width $W(s)$.
  - Each of the 7 AI racers follows a dynamic target point $s_{\text{target}} = s_{\text{current}} + d_{\text{lookahead}}$ with individual lane preferences (inside apex on turns, outside for passing).
- **Dynamic Rubber-Banding Model**:
  - To maintain authentic competitive tension without unfair rubber-banding:
    - **Behind Player ($\Delta s = s_{\text{player}} - s_{\text{AI}} > 0$)**: AI receives progressive catch-up scaling:
      $$v_{\text{AI\_max}} = v_{\text{base}} \cdot \left(1.0 + \min\left(0.12, \frac{\Delta s}{1500} \cdot 0.10\right)\right)$$
    - **Far Ahead of Player ($\Delta s < -800\,\text{m}$)**: Leading AI speed is gently tempered by $-5\%$ to $-8\%$, and item probabilities tilt toward defensive items, giving the player an achievable chase target.
  - AI racers detect track obstacles (slime droplets, dropped items, walls) via 3-ray forward sensors and steer laterally to evade hazards.

### 7.7 Original Item Arsenal (100% Original IP)
1. **Turbo Battery (Boost)**:
   - Instant rocket boost surge ($+40\%$ speed for $1.5\,\text{s}$), spits cyan plasma from twin exhausts. Can be used off-road without speed penalty.
2. **Kinetic Homing Orb (Projectile)**:
   - Guided glowing spherical plasma orb that tracks along the track spline toward the racer directly ahead, detonating on impact with an electrical shockwave that flips the target kart.
3. **Slime Droplet (Hazard)**:
   - Dropped directly behind the kart. Leaves a glowing neon-green puddle on the tarmac; any kart running over it spins out $360^\circ$, loses forward momentum, and drops 3 coins.
4. **Triple Ricochet Discs (Orbit / Attack)**:
   - Three glowing energy discs orbit the player's kart as a protective barrier. Tapping Item fires them forward (bouncing off track barriers up to 3 times) or backward.
5. **EMP Shockwave (Area of Effect)**:
   - Emits an expanding circular electromagnetic pulse around the user ($15\,\text{m}$ radius), temporarily disabling nearby opponents' engines for $2.0\,\text{s}$ and knocking loose their held items.
6. **Supercharge Shield (Invincibility)**:
   - Surrounds the kart with an iridescent rainbow forcefield for $7.0\,\text{s}$. Increases top speed, provides complete immunity to all hazards, and violently knocks aside any karts in the player's path.

### 7.8 Web Audio Synthesis Recipe
- **Kart Engine Audio**: Dynamic FM synthesis with pitch and harmonic modulation proportional to simulated engine RPM ($60\,\text{Hz} \to 450\,\text{Hz}$ carrier with dual modulators).
- **Tire Drift Screech**: Resonant bandpass-filtered white noise ($Q = 6.0$, center frequency modulated $1400\,\text{Hz} \to 2600\,\text{Hz}$ based on lateral slip velocity).
- **Boost Whoosh**: Layered sub-bass sine drop ($90\,\text{Hz} \to 30\,\text{Hz}$) + rising pink noise whoosh ($300\,\text{Hz} \to 3200\,\text{Hz}$).
- **Item Roulette Ticker**: Rapid staccato woodblock clicks ($1800\,\text{Hz}$, $15\,\text{ms}$) decelerating into a dual chime upon item reveal.
- **Glider Deployment**: Mechanical pneumatic pop ($40\,\text{ms}$ noise click) + soft wind turbulence hiss while gliding.
- **Finish Fanfare**: Victorious brass-style chord arpeggio ($C_5 \to G_5 \to C_6 \to E_6$) with decaying hall reverb.

---

## 8. Assumptions & Engineering Decisions

1. **Orientation Auto-Switching Protocol**:
   - The console communicates the required controller layout via WebSocket message:
     `{ type: 'LAYOUT_MODE', mode: 'portrait' | 'landscape' }`.
   - On launching **Alien Attack** or **Turbo Circuit**, the console sends `mode: 'landscape'`, instructing the controller web app to rotate its UI and prompt the user to hold the phone sideways.
   - For Fruit Ninja, Shooting Range, Sketch, and the Channel Menu, `mode: 'portrait'` is used.

2. **Game Module Boundaries**:
   - Every game implements the standard `IGame` lifecycle interface (`init`, `update`, `pause`, `resume`, `destroy`).
   - Active game modules live in `src/console/games/`:
     - `slice-party/` (Fruit Ninja)
     - `alien-attack/` (Alien Attack)
     - `shooting-range/` (Shooting Range)
     - `sketch/` (Sketch)
     - `turbo-circuit/` (Turbo Circuit 3D Kart Racer)

3. **Asset Synthesis & Zero-Nintendo Rule**:
   - All visual elements remain 100% original vector SVG and procedural PixiJS / 3D projection graphics.
   - Strictly zero Nintendo, Mario Kart, or third-party trademarks, characters, sounds, or logos.
   - All audio is procedurally synthesized via the Web Audio API.

4. **Pairing QR Code Integration**:
   - The pairing QR code is rendered directly on the bottom-right corner of the console firmware shelf, matching the reference video.


