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

### 2.1 Remake Channel Menu Flow & 5 Game Matrix
```mermaid
flowchart TD
    %% Styling Classes
    classDef fruitStyle fill:#ffedd5,stroke:#ea580c,stroke-width:2px,color:#9a3412;
    classDef alienStyle fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;
    classDef shootStyle fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e40af;
    classDef sketchStyle fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:#6b21a8;
    classDef turboStyle fill:#fef08a,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    classDef emptyStyle fill:#f1f5f9,stroke:#94a3b8,stroke-width:1px,stroke-dasharray: 4 4,color:#64748b;
    classDef menuStyle fill:#ffffff,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef modalStyle fill:#f8fafc,stroke:#334155,stroke-width:2px,color:#0f172a;

    Boot["Console Boot & Web Audio Gesture Init"]:::menuStyle --> Hub["Nimbus Domestic Channel Hub (4x3 Grid)"]:::menuStyle

    subgraph ActiveGames["Primary Playable Games Matrix"]
        Tile1["Tile 1: Fruit Ninja<br/>(Peach/Orange Gradient)"]:::fruitStyle
        Tile2["Tile 2: Alien Attack<br/>(Spring Green Gradient)"]:::alienStyle
        Tile3["Tile 3: Shooting Range<br/>(Royal Blue Gradient)"]:::shootStyle
        Tile4["Tile 4: Sketch<br/>(Royal Violet Gradient)"]:::sketchStyle
        Tile5["Tile 5: Turbo Circuit<br/>(Crimson/Gold Gradient)"]:::turboStyle
    end

    subgraph LowerRows["Ceramic Channel Cards"]
        EmptySlots["7 Translucent White Ceramic Cards<br/>(Future Expansion Slots)"]:::emptyStyle
    end

    subgraph BottomDock["Firmware Bottom Shelf Dock"]
        ShelfBtn["( ( ) Settings Disk )"]:::menuStyle
        Clock["14:32 Live Digital Clock & Date"]:::menuStyle
        DirectQR["Direct Embedded QR Code Canvas<br/>(Instant 1-Second Pairing)"]:::menuStyle
    end

    Hub --> ActiveGames
    Hub --> LowerRows
    Hub --> BottomDock

    Tile1 -->|"Pointer Hover & A Click"| Modal1["Launch Modal: Fruit Ninja"]:::modalStyle
    Tile2 -->|"Pointer Hover & A Click"| Modal2["Launch Modal: Alien Attack"]:::modalStyle
    Tile3 -->|"Pointer Hover & A Click"| Modal3["Launch Modal: Shooting Range"]:::modalStyle
    Tile4 -->|"Pointer Hover & A Click"| Modal4["Launch Modal: Sketch"]:::modalStyle
    Tile5 -->|"Pointer Hover & A Click"| Modal5["Launch Modal: Turbo Circuit"]:::modalStyle

    Modal1 -->|"Start Pill Click"| Game1["Fruit Ninja (PixiJS)"]:::fruitStyle
    Modal2 -->|"Start Pill Click"| Game2["Alien Attack (PixiJS 3D)"]:::alienStyle
    Modal3 -->|"Start Pill Click"| Game3["Shooting Range (PixiJS)"]:::shootStyle
    Modal4 -->|"Start Pill Click"| Game4["Sketch Canvas (PixiJS)"]:::sketchStyle
    Modal5 -->|"Start Pill Click"| Game5["Turbo Circuit (3D Kart Racer)"]:::turboStyle

    Game1 -->|"Press Home Button"| PauseOverlay["Home Pause Overlay HUD"]:::modalStyle
    Game2 -->|"Press Home Button"| PauseOverlay
    Game3 -->|"Press Home Button"| PauseOverlay
    Game4 -->|"Press Home Button"| PauseOverlay
    Game5 -->|"Press Home Button"| PauseOverlay

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
    classDef turboLandStyle fill:#fef08a,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    classDef gameMap fill:#ffffff,stroke:#475569,stroke-width:2px,color:#1e293b;

    InboundMsg["Console Layout Dispatcher"]:::phoneStyle --> CheckGame{"Active Game Context"}

    CheckGame -- "Menu / Fruit Ninja / Shooting Range / Sketch" --> SetPortrait["Set Controller Layout: Portrait Wand Mode"]:::portraitStyle
    CheckGame -- "Alien Attack" --> SetLandscapeFlight["Set Controller Layout: Landscape Flight Mode"]:::landStyle
    CheckGame -- "Turbo Circuit" --> SetLandscapeRacing["Set Controller Layout: Landscape Racing Wheel Mode"]:::turboLandStyle

    subgraph PortraitMode["Portrait Wand Mode (Single-Handed)"]
        SensorsP["Gyro Integration: Alpha (Yaw) & Beta (Pitch)"]:::portraitStyle
        FilterP["One Euro Adaptive Filter + Deadzone"]:::portraitStyle
        TouchP["Button Matrix: Large A, D-Pad, Minus, Home, Plus, B Trigger"]:::portraitStyle
        SensorsP --> FilterP
    end

    subgraph LandscapeFlightMode["Landscape Flight Mode (Alien Attack)"]
        SensorsL["Gyro Flight Yoke: Roll (Gamma) & Pitch (Beta)"]:::landStyle
        FilterL["Gravity Compensated Flight Heading Filter"]:::landStyle
        TouchL["Dual-Thumb Touch Zones: Left Cannon & Right Cannon"]:::landStyle
        SensorsL --> FilterL
    end

    subgraph LandscapeRacingMode["Landscape Racing Wheel Mode (Turbo Circuit)"]
        SensorsR["Steering Wheel Roll (Gamma) + Horizon Bar Filter"]:::turboLandStyle
        TouchRight["Right Thumb: GAS (Accelerate) + DRIFT/HOP (Arc)"]:::turboLandStyle
        TouchLeft["Left Thumb: ITEM (Use Weapon) + BRAKE/REVERSE (Arc)"]:::turboLandStyle
        TouchUtil["Top Utility: REAR VIEW, RECENTER, HOME PAUSE"]:::turboLandStyle
        SensorsR --> TouchRight
    end

    SetPortrait --> PortraitMode
    SetLandscapeFlight --> LandscapeFlightMode
    SetLandscapeRacing --> LandscapeRacingMode

    PortraitMode --> MapFN["Fruit Ninja: Aim Cursor + Hold A/B while Swiping"]:::gameMap
    PortraitMode --> MapSR["Shooting Range: Aim Crosshair + Tap A/B to Fire Hitscan"]:::gameMap
    PortraitMode --> MapSK["Sketch: Move Pen + Hold A/B to Draw Continuous Stroke"]:::gameMap
    LandscapeFlightMode --> MapAA["Alien Attack: Tilt Phone to Bank/Steer + Thumb Tap to Fire Lasers"]:::gameMap
    LandscapeRacingMode --> MapTC["Turbo Circuit: Tilt Phone as Wheel + Hold Gas + Drift Hop + Item Release"]:::gameMap
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

#### (e) Game 5: Turbo Circuit (3D Kart Racer Architecture)

##### 1. Master Race State Machine
```mermaid
flowchart TD
    classDef menuStyle fill:#f8fafc,stroke:#475569,stroke-width:2px,color:#0f172a;
    classDef countStyle fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef raceStyle fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b;
    classDef finishStyle fill:#fef2f2,stroke:#dc2626,stroke-width:2px,color:#991b1b;
    classDef resultStyle fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#5b21b6;
    classDef actionStyle fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;

    subgraph StateMachine["Turbo Circuit — Master Race State Machine"]
        Init["Channel Launch: Load Track & Assets"]:::menuStyle --> Staging["Grid Staging: 8 Racers in Dual Pole Slots"]:::menuStyle
        Staging --> Countdown["Countdown Phase: Camera Sweep + 3-2-1-GO!"]:::countStyle
        
        Countdown -->|"GO! (Rocket Start Window)"| Racing["Active Racing Loop: Laps 1..N"]:::raceStyle
        
        subgraph RacingSub["Active Race Simulation"]
            Racing --> CheckLap{"Crossed Finish Line?"}:::raceStyle
            CheckLap -- "Lap < MaxLaps" --> NextLap["Increment Lap + Trigger Lap Sound"]:::raceStyle
            NextLap --> Racing
        end
        
        CheckLap -- "Final Lap Completed" --> Finish["Finish Phase: 'FINISH!' Banner Displayed"]:::finishStyle
        Finish --> VictoryLap["Autopilot Deceleration + 360° Victory Camera Orbit"]:::finishStyle
        VictoryLap --> Results["Race Results Screen: 8-Racer Leaderboard"]:::resultStyle
        
        Results --> ActionChoice{"Player Selection"}:::actionStyle
        ActionChoice -- "Race Again Button" --> Staging
        ActionChoice -- "Exit to Menu Button" --> MenuHub["Return to Nimbus Channel Matrix"]:::menuStyle
    end
```

##### 2. Per-Frame Game Loop (60 FPS)
```mermaid
flowchart TD
    classDef inputStyle fill:#e0e7ff,stroke:#4338ca,stroke-width:2px,color:#312e81;
    classDef physStyle fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#14532d;
    classDef aiStyle fill:#fef3c7,stroke:#b45309,stroke-width:2px,color:#78350f;
    classDef itemStyle fill:#fce7f3,stroke:#be185d,stroke-width:2px,color:#831843;
    classDef camStyle fill:#ccfbf1,stroke:#0f766e,stroke-width:2px,color:#134e4a;
    classDef renderStyle fill:#f1f5f9,stroke:#334155,stroke-width:2px,color:#0f172a;

    Tick["Frame Tick (dt <= 16.6ms)"]:::inputStyle --> PollIn["1. Ingest Landscape Tilt (Roll) & Touch Buttons (Gas, Drift, Item, Brake)"]:::inputStyle
    
    subgraph PhysicsPass["2. Player Physics & State Machine"]
        PollIn --> SurfaceCheck["Sample Track Spline: Surface Type (Tarmac, Offroad, Boost, Glider)"]:::physStyle
        SurfaceCheck --> IntegratePhysics["Integrate Drive Force, Friction, Aerodynamic Drag & Gravity"]:::physStyle
        IntegratePhysics --> DriftState["Evaluate Drift State & Charge Mini-Turbo Sparks (Blue/Orange/Purple)"]:::physStyle
        DriftState --> GliderState["Evaluate Glider Aerodynamics (Lift, Pitch Dive/Climb, Bank)"]:::physStyle
    end

    subgraph AIPass["3. AI Racers Simulation (x7)"]
        GliderState --> AISplineFollow["Follow Target Waypoints with Lane Offsets"]:::aiStyle
        AISplineFollow --> AIRubberBand["Apply Rubber-Band Speed Multiplier vs Player Gap"]:::aiStyle
        AIRubberBand --> AIAvoid["Obstacle & Hazard Raycast Avoidance"]:::aiStyle
    end

    subgraph ItemCollisionPass["4. Items, Hazards & Collisions"]
        AIAvoid --> UpdateProjectiles["Step Kinetic Orbs, Dropped Slime & Ricochet Discs"]:::itemStyle
        UpdateProjectiles --> KartCollisions["Resolve Kart-to-Kart Bumpers & Kart-to-Hazard Spin-outs"]:::itemStyle
        KartCollisions --> ItemBoxPickups["Detect Item Box Roulette Triggers"]:::itemStyle
    end

    subgraph CameraRenderPass["5. Camera & Visual Presentation"]
        ItemBoxPickups --> UpdateChaseCam["Update Spring-Damped Chase Camera & Dynamic Speed FOV"]:::camStyle
        UpdateChaseCam --> RenderScene["Render 3D Track Projection, Billboards, Particles & Audio"]:::renderStyle
        RenderScene --> UpdateHUD["Update HUD: Gold Placement, Minimap, Coins & Laps"]:::renderStyle
    end

    UpdateHUD --> Tick
```

##### 3. Kart Physics & Drifting Mechanics
```mermaid
flowchart TD
    classDef driveStyle fill:#ecfdf5,stroke:#047857,stroke-width:2px,color:#064e3b;
    classDef driftStyle fill:#eff6ff,stroke:#1d4ed8,stroke-width:2px,color:#1e3a8a;
    classDef sparkStyle fill:#faf5ff,stroke:#7e22ce,stroke-width:2px,color:#581c87;
    classDef boostStyle fill:#fff7ed,stroke:#c2410c,stroke-width:2px,color:#7c2d12;

    subgraph KartPhysics["Kart Longitudinal & Lateral Dynamics"]
        GasPressed{"Gas Button Held?"}:::driveStyle
        GasPressed -- Yes --> EngineForce["Apply Forward Engine Force: F_engine = T(RPM) * Throttle"]:::driveStyle
        GasPressed -- No --> CoastEngine["Engine Braking & Rolling Resistance"]:::driveStyle
        EngineForce --> NetVel["Integrate Velocity: a = (F_eng - F_drag - F_fric) / m"]:::driveStyle
        CoastEngine --> NetVel

        SteerTilt["Controller Roll Angle (Gamma)"]:::driveStyle --> Turning{"Steer Angle > Threshold?"}:::driveStyle
        Turning --> LateralGrip["Compute Lateral Slip & Centrifugal Force"]:::driveStyle
    end

    subgraph DriftPipeline["Power Slide Drift & Mini-Turbo System"]
        Turning -- "Drift Button Tapped" --> Hop["Vertical Hop (15px) + Lock Drift Direction"]:::driftStyle
        Hop --> Sliding["Sliding State: Lateral Slip with Counter-Steering Control"]:::driftStyle
        Sliding --> DriftTimer["Accumulate Drift Time t_drift"]:::driftStyle
        
        DriftTimer --> SparkCheck{"Drift Duration Thresholds"}:::sparkStyle
        SparkCheck -- "t >= 0.8s" --> SparkBlue["Stage 1: Blue Sparks (Mini-Turbo)"]:::sparkStyle
        SparkCheck -- "t >= 1.8s" --> SparkOrange["Stage 2: Orange Sparks (Super Mini-Turbo)"]:::sparkStyle
        SparkCheck -- "t >= 3.0s" --> SparkPurple["Stage 3: Purple Sparks (Ultra Mini-Turbo)"]:::sparkStyle

        SparkBlue --> ReleaseCheck{"Drift Button Released?"}:::boostStyle
        SparkOrange --> ReleaseCheck
        SparkPurple --> ReleaseCheck
        
        ReleaseCheck -- Yes --> BoostSurge["Discharge Boost Surge: Forward Speed Surge (+15% to +45%)<br/>Twin Exhaust Flames + Camera Speed FOV Widening"]:::boostStyle
        ReleaseCheck -- No --> Sliding
    end
```

##### 4. AI Opponent Pathing with Rubber-Banding
```mermaid
flowchart TD
    classDef splineStyle fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef bandStyle fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    classDef steerStyle fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e40af;
    classDef actionStyle fill:#fdf2f8,stroke:#db2777,stroke-width:2px,color:#831843;

    subgraph AIPathing["AI Path Navigation"]
        SplineTrack["Track Parametric Spline (x, y, z, tangent, width)"]:::splineStyle --> Lookahead["Calculate Dynamic Target Point: s_target = s_ai + d_lookahead"]:::splineStyle
        Lookahead --> LaneOffset["Apply Individual Lane Preference (Inside Apex on Hairpins)"]:::splineStyle
        LaneOffset --> SteerCorrection["Steering Controller: Heading Error Correction theta_err"]:::steerStyle
    end

    subgraph RubberBand["Dynamic Rubber-Banding System"]
        Compare["Compute Track Arc Distance Gap: Delta_s = s_player - s_ai"]:::bandStyle --> CheckGap{"Delta_s Position"}:::bandStyle
        
        CheckGap -- "AI is Behind (Delta_s > 0)" --> CatchUp["Scale AI Max Speed: v_max * (1.0 + min(0.12, Delta_s/1500 * 0.10))<br/>Aggressive Draft Catch-up & Item Roulette Bias"]:::bandStyle
        CheckGap -- "AI is Within Pack (|Delta_s| < 150m)" --> Neutral["Nominal Race Speed (1.0x Base Scale)"]:::bandStyle
        CheckGap -- "AI is Far Ahead (Delta_s < -800m)" --> Temper["Gently Temper Lead AI Speed (-5% to -8%)<br/>Bias Items toward Defensive Only"]:::bandStyle
    end

    subgraph AvoidanceAction["Obstacle Avoidance & Combat"]
        SteerCorrection --> RaySensors["Forward 3-Raycast Sensors (Left, Center, Right)"]:::actionStyle
        RaySensors --> DetectHazard{"Hazard / Slime in Path?"}:::actionStyle
        DetectHazard -- Yes --> LateralNudge["Nudge Steering Target away from Hazard"]:::actionStyle
        DetectHazard -- No --> FireCheck{"Has Offense Item & Target in Range?"}:::actionStyle
        FireCheck -- Yes --> AIUseItem["Deploy Item (Kinetic Orb / Boost Battery)"]:::actionStyle
        FireCheck -- No --> ApplyControls["Output Throttle & Steer to AI Kart Physics"]:::steerStyle
        LateralNudge --> ApplyControls
    end
```

##### 5. Item System Architecture
```mermaid
flowchart TD
    classDef boxStyle fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef rollStyle fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:#581c87;
    classDef itemStyle fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b;
    classDef useStyle fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;

    subgraph ItemBoxes["Track Item Box System"]
        ItemBox["Rotating Holographic Translucent Cube"]:::boxStyle --> CollectBox{"Kart Hits Box?"}:::boxStyle
        CollectBox -- Yes --> PlayShatter["Shatter Glass Animation + Respawn Timer (3.5s)"]:::boxStyle
        PlayShatter --> RouletteRoll["Start Item Roulette Animation (1.2s Duration)"]:::rollStyle
    end

    subgraph ItemOdds["Rank-Weighted Probability Matrix"]
        RouletteRoll --> GetRank["Sample Current Race Position (1st - 8th)"]:::rollStyle
        GetRank --> TableCheck{"Position Tier"}:::rollStyle
        TableCheck -- "1st Place" --> TierLead["High Odds: Slime Droplet (55%), Single Coin (35%), Triple Discs (10%)"]:::rollStyle
        TableCheck -- "2nd - 4th" --> TierMid["Balanced: Turbo Battery (30%), Triple Discs (30%), Kinetic Orb (20%), Slime (20%)"]:::rollStyle
        TableCheck -- "5th - 8th" --> TierBack["Catch-Up: Kinetic Orb (40%), Turbo Battery (35%), Supercharge Shield (15%), EMP (10%)"]:::rollStyle
    end

    subgraph ItemInventory["Racer Inventory & Activation"]
        TierLead --> AwardItem["Equip Selected Weapon in Item Slot"]:::itemStyle
        TierMid --> AwardItem
        TierBack --> AwardItem
        
        AwardItem --> ItemPress{"Item Button Pressed on Left Thumb?"}:::useStyle
        ItemPress -- Yes --> ItemType{"Equipped Item"}:::useStyle

        ItemType -- "Turbo Battery" --> ActBoost["Instant Speed Surge (+40% for 1.5s) + Plasma Flames"]:::itemStyle
        ItemType -- "Kinetic Homing Orb" --> ActOrb["Launch Seeking Orb tracking along track to flip leader ahead"]:::itemStyle
        ItemType -- "Slime Droplet" --> ActSlime["Drop puddle behind: causes 360° spin-out & drops 3 coins"]:::itemStyle
        ItemType -- "Triple Ricochet Discs" --> ActDiscs["Spawn 3 orbiting energy discs; tap to fire bouncing projectiles"]:::itemStyle
        ItemType -- "EMP Shockwave" --> ActEMP["Expand radial pulse (15m): slows opponents & knocks items"]:::itemStyle
        ItemType -- "Supercharge Shield" --> ActShield["7s Invincibility Aura + Top Speed Boost + Knockout Force"]:::itemStyle
    end
```

##### 6. Glider Ramp Section Architecture
```mermaid
flowchart TD
    classDef rampStyle fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef deployStyle fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef flightStyle fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b;
    classDef landStyle fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#581c87;

    subgraph GliderRamp["1. Ramp Approach & Launch"]
        Road["Standard Track Roadway"]:::rampStyle --> RampStrip["Glider Ramp: Cyan/Yellow Glowing Chevron Arrows"]:::rampStyle
        RampStrip --> LaunchTrigger{"Kart Hits Ramp Lip?"}:::rampStyle
        LaunchTrigger -- Yes --> LaunchImpulse["Vertical Launch Impulse (Vz > 0)<br/>Play Launch Woosh & Switch GroundState -> GliderState"]:::rampStyle
    end

    subgraph CanopyDeploy["2. Canopy Deployment & Transformation"]
        LaunchImpulse --> PopCanopy["Deploy Triangular Aerodynamic Glider Wing"]:::deployStyle
        PopCanopy --> ReduceGrav["Reduce Gravity to 25% + Engage Aerodynamic Lift Model"]:::deployStyle
    end

    subgraph FlightControls["3. 3D Glider Flight Controls"]
        ReduceGrav --> FlightLoop["Active Glider Aerodynamics (Lift, Drag, Airspeed)"]:::flightStyle
        
        FlightLoop --> PitchCheck{"Phone Pitch Tilt (Beta)"}:::flightStyle
        PitchCheck -- "Tilt Forward (Dive)" --> Dive["Nose Dives Down: Increase Descent Rate, Speed +25%"]:::flightStyle
        PitchCheck -- "Tilt Backward (Climb)" --> Climb["Nose Flares Up: Flattens Trajectory, Extends Airtime, Bleeds Speed"]:::flightStyle
        
        FlightLoop --> BankCheck{"Phone Roll Tilt (Gamma)"}:::flightStyle
        BankCheck --> BankWing["Bank Glider Wings Left/Right with Aerodynamic Yaw Coupling"]:::flightStyle

        BankWing --> RingCheck{"Fly through Aerial Boost Rings?"}:::flightStyle
        RingCheck -- Yes --> RingBonus["Collect Ring: +3 Coins + Instant Airtime Speed Surge"]:::flightStyle
    end

    subgraph Touchdown["4. Touchdown & Reversion"]
        FlightLoop --> AltitudeCheck{"Kart Altitude <= Road Surface Elevation?"}:::landStyle
        AltitudeCheck -- Yes --> RetractCanopy["Retract Glider Wing with Mechanical Sound"]:::landStyle
        RetractCanopy --> SusBounce["Suspension Compression Bounce + Revert to GroundState"]:::landStyle
        SusBounce --> LandingBoost["Award Clean Landing Mini-Boost on Level Pitch"]:::landStyle
    end
```

##### 7. Camera System Architecture
```mermaid
flowchart TD
    classDef followStyle fill:#e0f2fe,stroke:#0369a1,stroke-width:2px,color:#082f49;
    classDef fovStyle fill:#fef3c7,stroke:#b45309,stroke-width:2px,color:#78350f;
    classDef driftCam fill:#fce7f3,stroke:#be185d,stroke-width:2px,color:#831843;
    classDef orbitStyle fill:#ede9fe,stroke:#6d28d9,stroke-width:2px,color:#4c1d95;

    subgraph CameraChase["1. Dynamic 3D Chase Camera Math"]
        TargetKart["Player Kart Position P_kart & Forward Heading F_kart"]:::followStyle --> CamIdeal["Compute Ideal Camera Position:<br/>P_cam = P_kart - F_kart * d_dist + Up * h_height<br/>T_cam = P_kart + F_kart * d_lookahead"]:::followStyle
        CamIdeal --> SpringDamper["Critically Damped Spring Interpolation:<br/>P_cur = SmoothDamp(P_cur, P_cam, v_cam, lambda_smooth)"]:::followStyle
    end

    subgraph DriftCamera["2. Drift Lag & Banking Reaction"]
        SpringDamper --> CheckDrift{"Player Drifting?"}:::driftCam
        CheckDrift -- Yes --> SwingCam["Swing Camera to Outside of Turn Arc<br/>Tilt Camera Roll with Kart Banking (-10° to +10°)"]:::driftCam
        CheckDrift -- No --> AlignCam["Maintain Center Alignment behind Chassis"]:::followStyle
    end

    subgraph DynamicFOV["3. Speed-Responsive Dynamic FOV"]
        AlignCam --> SampleSpeed["Sample Current Forward Airspeed v"]:::fovStyle
        SwingCam --> SampleSpeed
        SampleSpeed --> FOVCalc["FOV Formula: FOV = BaseFOV (60°) + (v / v_max) * 15°"]:::fovStyle
        FOVCalc --> BoostWarp{"Active Boost or Glider?"}:::fovStyle
        BoostWarp -- Yes --> MaxFOV["Expand FOV to 75° + Blit Radial Motion Warp Lines"]:::fovStyle
        BoostWarp -- No --> StandardFOV["Smooth Interpolation towards Base 60°"]:::fovStyle
    end

    subgraph VictoryCam["4. Cinematic Victory Orbit"]
        StandardFOV --> FinishCheck{"Race Finished?"}:::orbitStyle
        MaxFOV --> FinishCheck
        FinishCheck -- Yes --> OrbitMode["Detach Chase Camera & Enter 360° Smooth Victory Orbit<br/>Focus on Kart Front & Celebrate Confetti"]:::orbitStyle
    end
```

##### 8. Phone Landscape Controller Input Mapping (Turbo Circuit)
```mermaid
flowchart TD
    classDef gripStyle fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef steerStyle fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b;
    classDef rightThumb fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e40af;
    classDef leftThumb fill:#fce7f3,stroke:#db2777,stroke-width:2px,color:#831843;
    classDef utilStyle fill:#f1f5f9,stroke:#475569,stroke-width:2px,color:#0f172a;

    subgraph Grip["Horizontal Two-Handed Landscape Grip (Racing Wheel)"]
        PhoneGrip["Phone held with both hands like a Formula / Kart Steering Wheel"]:::gripStyle
    end

    subgraph Steering["Motion Steering Pipeline"]
        PhoneGrip --> GyroRoll["Ingest Gyroscope Roll Angle (Gamma)"]:::steerStyle
        GyroRoll --> Deadzone["Deadzone Filter: Ignore micro-jitters |Gamma| < 0.6 deg"]:::steerStyle
        Deadzone --> NonLinear["Non-Linear Sensitivity Curve: Steer = sign(Gamma) * (|Gamma| / MaxAngle)^1.4"]:::steerStyle
        NonLinear --> HorizonBar["Update Real-Time Horizon Tilt Meter on Controller UI"]:::steerStyle
    end

    subgraph RightHand["Right Thumb Control Cluster"]
        PhoneGrip --> RightPad["Right Thumb Touch Area"]:::rightThumb
        RightPad --> GasBtn["GAS (Accelerate): Hold for Forward Drive Force"]:::rightThumb
        RightPad --> DriftBtn["DRIFT / HOP: Tap to Hop, Hold to Slide & Charge Mini-Turbo"]:::rightThumb
    end

    subgraph LeftHand["Left Thumb Control Cluster"]
        PhoneGrip --> LeftPad["Left Thumb Touch Area"]:::leftThumb
        LeftPad --> ItemBtn["ITEM: Tap to Deploy Equipped Weapon (Homing, Boost, Slime)"]:::leftThumb
        LeftPad --> BrakeBtn["BRAKE / REVERSE: Tap to Slow Down, Hold to Reverse"]:::leftThumb
    end

    subgraph Utilities["Center Utility Controls"]
        PhoneGrip --> CenterBar["Top Utility Bar"]:::utilStyle
        CenterBar --> RearBtn["REAR VIEW: Hold to Look Backward"]:::utilStyle
        CenterBar --> RecenterBtn["RECENTER: Re-zero Steering Wheel Center Angle"]:::utilStyle
        CenterBar --> HomeBtn["HOME: Open Pause Overlay HUD on Console"]:::utilStyle
    end
```

##### 9. HUD Layout Architecture
```mermaid
flowchart TD
    classDef hudBase fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef posStyle fill:#fef08a,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    classDef statStyle fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b;
    classDef mapStyle fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#082f49;
    classDef alertStyle fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;

    subgraph HUDCanvas["Turbo Circuit — 1920x1080 Viewport HUD"]
        Viewport["Screen Viewport (16:9 Immersion Stage)"]:::hudBase
        
        subgraph BottomRightCorner["Bottom-Right: Position Display"]
            PosBadge["Massive Gold Italic Rank Badge: '8th' -> '1st'<br/>Metallic Gold Gradient (#FACC15 -> #EAB308)<br/>Drop Shadow + Ordinal Suffix + Dynamic Scale Pulse on Overtake"]:::posStyle
        end

        subgraph BottomLeftCorner["Bottom-Left: Race Telemetry"]
            CoinCard["Coin Counter: Shiny Gold Coin Glyph '🟡 x04' (Max 10)<br/>Each coin grants +1% top speed"]:::statStyle
            LapCard["Lap Counter: 'LAP 1/1' (Sprint) or 'LAP 1/3'<br/>Pulsing 'FINAL LAP!' Alert upon entering final lap"]:::statStyle
        end

        subgraph CenterRightCorner["Center-Right: Circuit Map"]
            Minimap["Track Minimap Wireframe:<br/>- Semi-transparent Circuit Vector Outline<br/>- Cyan Blip = Player 1<br/>- Orange Blips = AI Racers (x7)<br/>- Gold Crown = Current 1st Place Leader"]:::mapStyle
        end

        subgraph TopCenterSlot["Top-Center: Item Roulette Box"]
            ItemBoxSlot["Translucent Rounded Square Frame:<br/>- Spinning Roulette Reel on Pickup (1.2s)<br/>- Static Equipped Item Icon when Ready<br/>- Pulsing Glow when Usable"]:::statStyle
        end

        subgraph CenterAlerts["Center Screen Dynamic Banners"]
            CountBanner["Start Countdown: '3', '2', '1', 'GO!' (with audio tones)"]:::alertStyle
            FinishBanner["'FINISH!' Banner with Confetti on Final Lap Crossing"]:::alertStyle
            WrongWay["'WRONG WAY' Flashing Warning if driving reverse on spline"]:::alertStyle
        end

        Viewport --> BottomRightCorner
        Viewport --> BottomLeftCorner
        Viewport --> CenterRightCorner
        Viewport --> TopCenterSlot
        Viewport --> CenterAlerts
    end
```

##### 10. Track Data Pipeline
```mermaid
flowchart TD
    classDef defStyle fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef splineStyle fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef genStyle fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b;
    classDef renderStyle fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#581c87;

    subgraph TrackDefinition["1. Raw Track Waypoint Definition"]
        NodesJSON["Track Waypoint Nodes Array (x, y, z, yaw, pitch, roll, width, surfaceType)"]:::defStyle
        Surfaces["Surface Enums: TARMAC, OFFROAD, BOOST_PAD, GLIDER_RAMP, FINISH_LINE"]:::defStyle
        NodesJSON --> Surfaces
    end

    subgraph SplineProcessing["2. Catmull-Rom 3D Spline Interpolation"]
        Surfaces --> SplineGen["Generate Smooth Continuous 3D Centerline Spline S(t)"]:::splineStyle
        SplineGen --> TangentNorm["Compute Perpendicular Track Normals & Banking Vectors"]:::splineStyle
        TangentNorm --> RoadRibbon["Extrude Left/Right Track Edges: P_left(s) = S(s) - N(s)*W/2, P_right(s) = S(s) + N(s)*W/2"]:::splineStyle
    end

    subgraph AssetPlacement["3. Trackside Entities & Collectibles"]
        RoadRibbon --> ItemNodes["Place Item Box Clusters across Track Width"]:::genStyle
        RoadRibbon --> CoinNodes["Distribute Coin Lines (Straights, Apexes, Glider Rings)"]:::genStyle
        RoadRibbon --> AIWaypoints["Generate Precomputed AI Racing Line (Optimal Apex Curve)"]:::genStyle
        RoadRibbon --> Barriers["Build Lateral Guardrail & Collision Boundaries"]:::genStyle
    end

    subgraph RuntimeEngine["4. Runtime Ingestion & Projection"]
        Barriers --> MapProjection["Project 2D Minimap Vector Outline for HUD"]:::renderStyle
        AIWaypoints --> RuntimeSim["Fast-Path Track Distance Lookup: s = Projection(Kart_pos)"]:::renderStyle
        RuntimeSim --> Render3D["Render 3D Perspective Track Segments with PixiJS"]:::renderStyle
    end
```

---

### 2.4 Remake Engineering Roadmap
```mermaid
flowchart LR
    classDef done fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#065f46;
    classDef active fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e40af;
    classDef future fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#334155;

    R0["✔ Phase R0: Reference Spec & Master Architecture"]:::done --> R1["✔ Phase R1: Menu 4-Tile Grid & Direct QR Dock"]:::done
    R1 --> R2["✔ Phase R2: Controller Landscape Flight Mode"]:::done
    R2 --> R3["✔ Phase R3: Fruit Ninja Cedar Wall & Slicing Remake"]:::done
    R3 --> R4["✔ Phase R4: Alien Attack 3D Rail Cosmic Shooter"]:::done
    R4 --> R5["✔ Phase R5: Shooting Range Carnival Targets"]:::done
    R5 --> R6["✔ Phase R6: Sketch Interactive Whiteboard"]:::done
    R6 --> R7["✔ Phase R7: System Integration, Latency & QA Sign-off"]:::done
    R7 --> R8["✔ Phase R8: 5th Game (Turbo Circuit) Architecture & Spec"]:::done
    R8 --> R9["Phase R9: Turbo Circuit 3D Kart Racer Implementation"]:::future
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
  gameId?: 'fruit-ninja' | 'alien-attack' | 'shooting-range' | 'sketch' | 'turbo-circuit' | 'menu';
}

/**
 * Extended Button State supporting Landscape Dual-Thumb Controls
 */
export interface ControllerButtonState {
  a: boolean;         // Primary trigger / select (portrait) / Right thumb GAS (landscape racing)
  b: boolean;         // Underside trigger (portrait) / Left thumb BRAKE (landscape racing)
  dpadUp: boolean;
  dpadDown: boolean;
  dpadLeft: boolean;
  dpadRight: boolean;
  plus: boolean;      // + button / DRIFT (landscape racing)
  minus: boolean;     // - button / ITEM (landscape racing)
  home: boolean;      // Home overlay menu
  btn1: boolean;      // 1 button / Rear view alternate
  btn2: boolean;      // 2 button / Recenter alternate
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

### 4.3 Kart Physics, Friction & Aerodynamic Drag (Turbo Circuit)
The longitudinal motion of the kart is modeled via net tractive force:
$$F_{\text{net}} = F_{\text{traction}} - F_{\text{drag}} - F_{\text{roll}} - F_{\text{brake}}$$
where:
$$F_{\text{traction}} = \tau_{\text{engine}}(\text{RPM}) \cdot \frac{G_{\text{ratio}}}{R_{\text{wheel}}} \cdot u_{\text{gas}}, \quad F_{\text{drag}} = \frac{1}{2} C_d \rho A_{\text{kart}} v^2, \quad F_{\text{roll}} = \mu_{\text{surface}} m g$$

Surface friction coefficient $\mu_{\text{surface}}$ adapts dynamically:
- Tarmac: $\mu = 0.015$ (high grip, nominal roll resistance)
- Off-road (grass/dirt): $\mu = 0.120$ (heavy drag penalty unless boosted)
- Boost Pad: $+8000\,\text{N}$ forward tractive impulse for $1.2\,\text{s}$

Lateral slip velocity and centrifugal force dictate drift dynamics:
$$F_{\text{centrifugal}} = \frac{m v^2}{R_{\text{curve}}}, \quad v_{\text{lateral}} = \vec{v} \cdot \hat{n}_{\text{lateral}}$$
During drift mode, lateral grip drops to $30\%$, enabling sustained power-sliding with counter-steer control.

### 4.4 Glider Flight Aerodynamics & Lift/Drag Polar (Turbo Circuit)
When launching off a glider ramp, aerodynamic lift balances kart gravity:
$$L = \frac{1}{2} C_L(\alpha_{\text{pitch}}) \rho v^2 A_{\text{wing}}, \quad D = \frac{1}{2} C_D(\alpha_{\text{pitch}}) \rho v^2 A_{\text{wing}}$$
where $\alpha_{\text{pitch}}$ is derived from the player's phone forward/backward tilt:
- **Diving ($\alpha < 0$)**: $C_L$ decreases, airspeed $v$ increases by $+25\%$, altitude $Z$ drops rapidly.
- **Climbing / Flaring ($\alpha > 0$)**: $C_L$ increases, extending flight distance across aerial chasms while airspeed bleeds off gradually.

### 4.5 AI Opponent Rubber-Banding Velocity Scaling Model (Turbo Circuit)
To maintain thrilling pack racing while respecting fair competition, AI max speed $v_{\text{AI}}$ scales as a continuous function of arc-length distance gap $\Delta s = s_{\text{player}} - s_{\text{AI}}$ along the track spline:
$$v_{\text{AI\_target}}(\Delta s) = v_{\text{base}} \cdot \begin{cases}
1.0 + \min\left(0.12, \frac{\Delta s}{1500} \cdot 0.10\right) & \text{if } \Delta s > 0 \text{ (AI is behind)} \\
1.0 & \text{if } -800 \le \Delta s \le 0 \text{ (AI in pack)} \\
1.0 - \min\left(0.08, \frac{|\Delta s| - 800}{1500} \cdot 0.08\right) & \text{if } \Delta s < -800 \text{ (AI far ahead)}
\end{cases}$$
This ensures pack cohesion, exhilarating photo-finishes, and an achievable victory for skilled driving without immersion-breaking artificial teleportation.
