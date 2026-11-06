# NimbusPlay — System Architecture & Technical Specifications (Game Remake)

This document defines the technical architecture, mathematical models, module boundaries, and TypeScript interfaces for the **NimbusPlay Game Remake**, based on the reference analysis in [`docs/GAME_REFERENCE.md`](file:///Users/adityasurse/Documents/NimbusPlay/docs/GAME_REFERENCE.md) derived from `/design/reference/Video-7889.mp4`, `reel-games.png`, and `reel-menu.png`.

---

## 1. Architectural Overview & Design Tenets

NimbusPlay bridges a desktop browser terminal with an Android smartphone motion controller over an ultra-low-latency local WebSocket mesh:
1. **Console Host Terminal**: A desktop browser running Vite, rendering the authentic domestic console shell (4×3 Channel Matrix) via semantic DOM/CSS and hardware-accelerated games via PixiJS v8.
2. **Motion Input Terminal (Nimbus Wand)**: An Android smartphone running Chrome Mobile, capturing inertial measurements (`DeviceMotionEvent`) and multi-touch interactions at 60Hz.
3. **Dynamic Layout Switching**: The controller dynamically adapts its UI between **Portrait Wand Mode** (for Menu, Fruit Ninja, Shooting Range, Sketch) and **Landscape Flight Mode** (for Alien Attack).
4. **Local Transport Relay**: Lightweight Node.js WebSocket relay bridging controller and console over the local Wi-Fi subnet with sub-10ms packet transport.

```
+----------------------------------------------------------------------------------+
|                              LOCAL WI-FI NETWORK                                 |
|                                                                                  |
|  +-------------------------+             +------------------------------------+  |
|  |     Android Phone       |   HTTPS     |       Laptop / Workstation         |  |
|  |  (Chrome 110+ Mobile)   |<===========>|  Vite Dev Server (Port 5173/HTTPS) |  |
|  |                         |  Web Assets |  + basic-ssl self-signed cert     |  |
|  |  [Portrait Wand /       |             +-----------------+------------------+  |
|  |   Landscape Flight UI]  |                               |                      |
|  |  [Gyro & Accelerometer] |                               | Proxy /ws            |
|  +------------+------------+                               |                      |
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
|                                                   | - 4 Pixi Games  |             |
|                                                   | - Web Audio     |             |
|                                                   +-----------------+             |
+----------------------------------------------------------------------------------+
```

---

## 2. Colorful System Diagrams (Mermaid)

### 2.1 Remake Channel Menu Flow & 4 Game Matrix
```mermaid
flowchart TD
    %% Styling Classes
    classDef fruitStyle fill:#ffedd5,stroke:#ea580c,stroke-width:2px,color:#9a3412;
    classDef alienStyle fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;
    classDef shootStyle fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e40af;
    classDef sketchStyle fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:#6b21a8;
    classDef emptyStyle fill:#f1f5f9,stroke:#94a3b8,stroke-width:1px,stroke-dasharray: 4 4,color:#64748b;
    classDef menuStyle fill:#ffffff,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef modalStyle fill:#f8fafc,stroke:#334155,stroke-width:2px,color:#0f172a;

    Boot["Console Boot & Web Audio Gesture Init"]:::menuStyle --> Hub["Nimbus Domestic Channel Hub (4x3 Grid)"]:::menuStyle

    subgraph TopRow["Top Row: Exactly 4 Playable Games"]
        Tile1["Tile 1: Fruit Ninja<br/>(Peach/Orange Gradient)"]:::fruitStyle
        Tile2["Tile 2: Alien Attack<br/>(Spring Green Gradient)"]:::alienStyle
        Tile3["Tile 3: Shooting Range<br/>(Royal Blue Gradient)"]:::shootStyle
        Tile4["Tile 4: Sketch<br/>(Royal Violet Gradient)"]:::sketchStyle
    end

    subgraph LowerRows["Rows 2 & 3: Frosted Channel Cards"]
        EmptySlots["8 Translucent White Ceramic Cards<br/>(Future Expansion Slots)"]:::emptyStyle
    end

    subgraph BottomDock["Firmware Bottom Shelf Dock"]
        ShelfBtn["( ( ) Settings Disk )"]:::menuStyle
        Clock["14:32 Live Digital Clock & Date"]:::menuStyle
        DirectQR["Direct Embedded QR Code Canvas<br/>(Instant 1-Second Pairing)"]:::menuStyle
    end

    Hub --> TopRow
    Hub --> LowerRows
    Hub --> BottomDock

    Tile1 -->|"Pointer Hover & A Click"| Modal1["Launch Modal: Fruit Ninja"]:::modalStyle
    Tile2 -->|"Pointer Hover & A Click"| Modal2["Launch Modal: Alien Attack"]:::modalStyle
    Tile3 -->|"Pointer Hover & A Click"| Modal3["Launch Modal: Shooting Range"]:::modalStyle
    Tile4 -->|"Pointer Hover & A Click"| Modal4["Launch Modal: Sketch"]:::modalStyle

    Modal1 -->|"Start Pill Click"| Game1["Fruit Ninja (PixiJS)"]:::fruitStyle
    Modal2 -->|"Start Pill Click"| Game2["Alien Attack (PixiJS 3D)"]:::alienStyle
    Modal3 -->|"Start Pill Click"| Game3["Shooting Range (PixiJS)"]:::shootStyle
    Modal4 -->|"Start Pill Click"| Game4["Sketch Canvas (PixiJS)"]:::sketchStyle

    Game1 -->|"Press Home Button"| PauseOverlay["Home Pause Overlay HUD"]:::modalStyle
    Game2 -->|"Press Home Button"| PauseOverlay
    Game3 -->|"Press Home Button"| PauseOverlay
    Game4 -->|"Press Home Button"| PauseOverlay

    PauseOverlay -->|"Console Menu"| Hub
```

---

### 2.2 Controller Dynamic Input Mapping per Game
```mermaid
flowchart TD
    %% Styling Classes
    classDef phoneStyle fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef portraitStyle fill:#ecfeff,stroke:#0891b2,stroke-width:2px,color:#155e75;
    classDef landStyle fill:#fdf2f8,stroke:#db2777,stroke-width:2px,color:#9d174d;
    classDef gameMap fill:#ffffff,stroke:#475569,stroke-width:2px,color:#1e293b;

    InboundMsg["Console Layout Dispatcher"]:::phoneStyle --> CheckGame{"Active Game Context"}

    CheckGame -- "Menu / Fruit Ninja / Shooting Range / Sketch" --> SetPortrait["Set Controller Layout: Portrait Wand Mode"]:::portraitStyle
    CheckGame -- "Alien Attack" --> SetLandscape["Set Controller Layout: Landscape Flight Mode"]:::landStyle

    subgraph PortraitMode["Portrait Wand Mode (Single-Handed)"]
        SensorsP["Gyro Integration: Alpha (Yaw) & Beta (Pitch)"]:::portraitStyle
        FilterP["One Euro Adaptive Filter + Deadzone"]:::portraitStyle
        TouchP["Button Matrix: Large A, D-Pad, Minus, Home, Plus, B Trigger"]:::portraitStyle
        SensorsP --> FilterP
    end

    subgraph LandscapeMode["Landscape Flight Mode (Two-Handed)"]
        SensorsL["Gyro Flight Yoke: Roll (Gamma) & Pitch (Beta)"]:::landStyle
        FilterL["Gravity Compensated Flight Heading Filter"]:::landStyle
        TouchL["Dual-Thumb Touch Zones: Left Cannon & Right Cannon"]:::landStyle
        SensorsL --> FilterL
    end

    SetPortrait --> PortraitMode
    SetLandscape --> LandscapeMode

    PortraitMode --> MapFN["Fruit Ninja: Aim Cursor + Hold A/B while Swiping"]:::gameMap
    PortraitMode --> MapSR["Shooting Range: Aim Crosshair + Tap A/B to Fire Hitscan"]:::gameMap
    PortraitMode --> MapSK["Sketch: Move Pen + Hold A/B to Draw Continuous Stroke"]:::gameMap
    LandscapeMode --> MapAA["Alien Attack: Tilt Phone to Bank/Steer + Thumb Tap to Fire Lasers"]:::gameMap
```

---

### 2.3 Individual Game Loops & State Machines

#### (a) Game 1: Fruit Ninja Loop
```mermaid
flowchart TD
    classDef loopStyle fill:#fff7ed,stroke:#c2410c,stroke-width:2px,color:#7c2d12;
    classDef alertStyle fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;
    classDef scoreStyle fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#065f46;

    StartFN["Start Wave (dt)"]:::loopStyle --> SpawnCheck{"Spawn Interval Elapsed?"}
    SpawnCheck -- Yes --> SpawnFruits["Launch Fruits in Parabolic Arcs (g = 1200 px/s^2)"]:::loopStyle
    SpawnCheck -- No --> IngestSlice["Sample Pointer Blade Velocity V"]:::loopStyle
    SpawnFruits --> IngestSlice

    IngestSlice --> SpeedCheck{"Blade Active? (Hold A/B & V > 1200 px/s)"}
    SpeedCheck -- Yes --> SweptCheck["Test Swept-Segment vs Fruit Hitboxes"]:::loopStyle
    SpeedCheck -- No --> CheckFloor["Check if Unsliced Fruits Fell Below Viewport"]:::loopStyle

    SweptCheck --> HitFruit{"Fruit or Bomb?"}
    HitFruit -- "Fruit" --> SliceFruit["Split Fruit into 2 Halves with Rotation<br/>Spawn Sticky Wall Splatters on Wood Planks<br/>Play Juicy Splat Sound"]:::scoreStyle
    HitFruit -- "Bomb" --> DetonateBomb["Explosion Flash, Screen Shake & Audio<br/>Instant Strike / Game Over"]:::alertStyle

    SliceFruit --> ComboCalc["Evaluate Multi-Slice Combo (<200ms)<br/>Play Pentatonic Chord Chime"]:::scoreStyle
    ComboCalc --> CheckFloor

    CheckFloor --> Dropped{"Unsliced Fruit Dropped?"}
    Dropped -- Yes --> AddStrike["Mark Red 'X' Strike Marker (Max 3)"]:::alertStyle
    Dropped -- No --> RenderFrame["Render PixiJS Frame with Wood Background"]:::loopStyle
    AddStrike --> StrikeCheck{"Strikes >= 3?"}
    StrikeCheck -- Yes --> GameOverFN["Game Over Screen with Score & Retry"]:::alertStyle
    StrikeCheck -- No --> RenderFrame
    DetonateBomb --> GameOverFN
    RenderFrame --> StartFN
```

#### (b) Game 2: Alien Attack (3D Cosmic Rail Shooter) Loop
```mermaid
flowchart TD
    classDef spaceStyle fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef combatStyle fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#f3e8ff;
    classDef bossStyle fill:#450a0a,stroke:#ef4444,stroke-width:2px,color:#fee2e2;

    StartAA["Frame Tick (60 FPS)"]:::spaceStyle --> StepWarp["Advance Warp Particles & 3D Nebula Starfield"]:::spaceStyle
    StepWarp --> SteerShip["Update Ship Tilt & Position from Landscape Gyro (Roll/Pitch)"]:::spaceStyle
    SteerShip --> CheckFire{"Dual Thumb Fire Pressed?"}

    CheckFire -- Yes --> SpawnLasers["Emit Dual Plasma Bolts from Wing Cannons<br/>towards 3D Target Reticle (Z: 0 -> 1000)"]:::combatStyle
    CheckFire -- No --> UpdateEnemies["Step Alien Formations along 3D Vectors"]:::combatStyle
    SpawnLasers --> UpdateEnemies

    UpdateEnemies --> Collision3D{"Laser Reaches Alien Target?"}
    Collision3D -- Yes --> AlienExplode["Crunchy Noise Explosion<br/>Spawn Cosmic Debris Particles<br/>Score +20 / +50"]:::combatStyle
    Collision3D -- No --> CheckPlayerHit{"Alien Bolt Hits Player Ship?"}
    AlienExplode --> CheckPlayerHit

    CheckPlayerHit -- Yes --> ShieldDown["Lose 1 Shield Icon (Green Ship Glyphs)<br/>Screen Flash & Haptic Rumble"]:::bossStyle
    CheckPlayerHit -- No --> WaveCheck{"Wave Enemies Cleared?"}
    ShieldDown --> ShieldCheck{"Shields <= 0?"}
    ShieldCheck -- Yes --> GameOverAA["Game Over: Cosmic Fleet Destroyed"]:::bossStyle

    ShieldCheck -- No --> WaveCheck
    WaveCheck -- Yes --> NextSector["Advance Sector: Dreadnought Boss or Faster Warp"]:::bossStyle
    WaveCheck -- No --> RenderAA["Render 3D Camera Projection in PixiJS"]:::spaceStyle
    NextSector --> RenderAA
    RenderAA --> StartAA
```

#### (c) Game 3: Shooting Range Loop
```mermaid
flowchart TD
    classDef carnivalStyle fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef targetStyle fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef scoreStyle fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#713f12;

    StartSR["Frame Tick: 60s Round Timer"]:::carnivalStyle --> UpdateClouds["Drift Cartoon Clouds across Sunny Sky"]:::carnivalStyle
    UpdateClouds --> PopTargets["Pop Concentric Ring Targets from Grass Hill / Balloons"]:::targetStyle
    PopTargets --> TrackAim["Update Crosshair from Wand Gyro Aim"]:::targetStyle

    TrackAim --> TriggerCheck{"Player Pressed A or B Trigger?"}
    TriggerCheck -- No --> DecTimer["Decrement 60s Game Timer"]:::carnivalStyle
    TriggerCheck -- Yes --> HitscanCheck["Perform Hitscan Raycast from Crosshair"]:::targetStyle

    HitscanCheck --> TargetHit{"Hit Detected?"}
    TargetHit -- "Bullseye Center" --> Score20["Pop Target + Play Clear Bell Ping<br/>Spawn Floating '+20' Score Popup"]:::scoreStyle
    TargetHit -- "Outer Ring" --> Score10["Pop Target + Play Wood Crack<br/>Spawn Floating '+10' Score Popup"]:::scoreStyle
    TargetHit -- "Miss / Blank" --> RifleSound["Play Carnival Air Rifle Puff"]:::targetStyle
    Score20 --> DecTimer
    Score10 --> DecTimer
    RifleSound --> DecTimer

    DecTimer --> TimeOver{"Timer <= 0?"}
    TimeOver -- Yes --> ResultSR["Show Round Summary & High Score Card"]:::carnivalStyle
    TimeOver -- No --> RenderSR["Render Sunny Sky, Grass & Targets"]:::carnivalStyle
    RenderSR --> StartSR
```

#### (d) Game 4: Sketch Loop
```mermaid
flowchart TD
    classDef sketchStyle fill:#ffffff,stroke:#9333ea,stroke-width:2px,color:#581c87;
    classDef toolStyle fill:#faf5ff,stroke:#c084fc,stroke-width:2px,color:#6b21a8;

    StartSK["Frame Tick: Interactive Whiteboard"]:::sketchStyle --> IngestPen["Sample Wand Pointer (X, Y)"]:::sketchStyle
    IngestPen --> HoverCheck{"Pointer Over Left Toolbar?"}

    HoverCheck -- Yes --> ToolSelect{"Player Taps A on Swatch / Tool?"}
    ToolSelect -- "Color Dot" --> SetColor["Set Active Ink Color (Red, Green, Blue, etc.)<br/>Play Bubble Pop Chime"]:::toolStyle
    ToolSelect -- "Brush Size" --> SetWidth["Set Stroke Width (Thin, Medium, Thick)"]:::toolStyle
    ToolSelect -- "Eraser" --> SetEraser["Toggle Eraser Mode"]:::toolStyle
    ToolSelect -- "Clear Button" --> ClearBoard["Wipe Canvas + Play Glockenspiel Chime"]:::toolStyle
    ToolSelect -- No --> RenderCursor["Render Pen Cursor with Active Color Pip"]:::sketchStyle
    SetColor --> RenderCursor
    SetWidth --> RenderCursor
    SetEraser --> RenderCursor
    ClearBoard --> RenderCursor

    HoverCheck -- No --> DrawCheck{"A Button or B Trigger Held Down?"}
    DrawCheck -- Yes --> AddSpline["Append (X, Y) to Active Stroke History<br/>Compute Catmull-Rom Smoothing Spline<br/>Blit Antialiased Vector Ribbon to Canvas<br/>Play Subtle Marker Squeak Audio"]:::sketchStyle
    DrawCheck -- No --> LiftPen["Finalize Stroke Path into Render Texture"]:::sketchStyle
    AddSpline --> RenderCursor
    LiftPen --> RenderCursor
    RenderCursor --> StartSK
```

---

### 2.4 Remake Engineering Roadmap
```mermaid
flowchart LR
    classDef done fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#065f46;
    classDef active fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e40af;
    classDef future fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#334155;

    R0["✔ Phase R0: Reference Spec & Master Architecture"]:::done --> R1["Phase R1: Menu 4-Tile Grid & Direct QR Dock"]:::active
    R1 --> R2["Phase R2: Controller Landscape Flight Mode"]:::future
    R2 --> R3["Phase R3: Fruit Ninja Cedar Wall & Slicing Remake"]:::future
    R3 --> R4["Phase R4: Alien Attack 3D Rail Cosmic Shooter"]:::future
    R4 --> R5["Phase R5: Shooting Range Carnival Targets"]:::future
    R5 --> R6["Phase R6: Sketch Interactive Whiteboard"]:::future
    R6 --> R7["Phase R7: Final Polish, Latency & QA Sign-off"]:::future
```

---

## 3. Complete TypeScript Protocol Extensions

To support dynamic orientation and two-handed controls, the protocol is extended with layout modes:

```ts
/**
 * Controller Layout Configuration
 */
export type ControllerLayoutMode = 'portrait' | 'landscape';

export interface SetLayoutMessage extends BaseMessage {
  type: 'SET_LAYOUT';
  mode: ControllerLayoutMode;
  gameId?: 'fruit-ninja' | 'alien-attack' | 'shooting-range' | 'sketch' | 'menu';
}

/**
 * Extended Button State supporting Landscape Dual-Thumb Controls
 */
export interface ControllerButtonState {
  a: boolean;         // Primary trigger / select (portrait) / Right thumb (landscape)
  b: boolean;         // Underside trigger (portrait) / Left thumb (landscape)
  dpadUp: boolean;
  dpadDown: boolean;
  dpadLeft: boolean;
  dpadRight: boolean;
  plus: boolean;      // + button
  minus: boolean;     // - button
  home: boolean;      // Home overlay menu
  btn1: boolean;      // 1 button / Left thumb alternate
  btn2: boolean;      // 2 button / Right thumb alternate
  recenter: boolean;  // Recenter anchor button
}
```

---

## 4. Mathematical Models & Physics

### 4.1 Landscape Flight Steering Model (Alien Attack)
In landscape mode, the phone is held horizontally. Angular rates are re-projected onto flight coordinates:
$$\Delta \text{Yaw}_{\text{flight}} = -\omega_\gamma \cdot \Delta t \quad (\text{lateral phone tilt / roll banking})$$
$$\Delta \text{Pitch}_{\text{flight}} = -\omega_\beta \cdot \Delta t \quad (\text{forward/back phone tilt})$$

The starship position and aim reticle are updated with elastic centering:
$$X_{\text{ship}}(t + \Delta t) = X_{\text{ship}}(t) + \Delta \text{Yaw}_{\text{flight}} \cdot S_{\text{flight}} - k_{\text{center}} \cdot (X_{\text{ship}} - X_{\text{mid}}) \cdot \Delta t$$
$$Y_{\text{ship}}(t + \Delta t) = Y_{\text{ship}}(t) + \Delta \text{Pitch}_{\text{flight}} \cdot S_{\text{flight}} - k_{\text{center}} \cdot (Y_{\text{ship}} - Y_{\text{mid}}) \cdot \Delta t$$

### 4.2 Catmull-Rom Stroke Smoothing (Sketch)
Given sampled points $P_{i-1}, P_i, P_{i+1}, P_{i+2}$, intermediate spline points are calculated:
$$P(t) = \frac{1}{2} \left[ (2P_i) + (-P_{i-1} + P_{i+1})t + (2P_{i-1} - 5P_i + 4P_{i+1} - P_{i+2})t^2 + (-P_{i-1} + 3P_i - 3P_{i+1} + P_{i+2})t^3 \right]$$
for $t \in [0, 1]$, producing silky, rounded vector strokes with zero polygonal creasing.
