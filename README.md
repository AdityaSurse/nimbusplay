# NimbusPlay — Master Plan & Technical Specification

> **Project Concept**: A tactile, Wii-Menu-style game console running entirely inside a desktop web browser, where an Android smartphone running Chrome acts as the wireless motion-sensing controller ("Nimbus Wand"). The smartphone streams high-frequency inertial sensor data and touch inputs over a low-latency local WebSocket relay, driving an on-screen hand cursor and powering 3 custom motion games.

---

## 1. Executive Summary & Goals

### 1.1 Project Goals
1. **Authentic Console Feel**: Replicate the clean, glossy-minimal, optimistic domestic utility aesthetic of late-2000s Japanese home console firmware (the 2006–2012 era) using modern semantic HTML, CSS, and SVG without any copyrighted Nintendo assets.
2. **Hardware-Free Motion Gaming**: Turn any standard Android phone running mobile Chrome into a wireless motion controller with zero app installation (100% web-based).
3. **Ultra-Low Latency**: Maintain an end-to-end input-to-display latency of under 30 milliseconds over standard residential Wi-Fi.
4. **Fluid 60 FPS Visuals**: Deliver locked 60 frames per second for both the domestic channel hub and hardware-accelerated 2D games using PixiJS.
5. **Zero External Audio Dependencies**: Synthesize 100% of sound effects procedurally in real-time via the Web Audio API.
6. **Seamless Zero-Config Pairing**: Pair controller to console in seconds via on-screen QR code and 4-character PIN.
7. **Three Complete Motion Games**:
   - **Slice Party**: Rapid fruit slicing utilizing pointer velocity vectors.
   - **Star Defender**: Aim-and-shoot space blaster using crosshair targeting and trigger fire.
   - **Bowl Blitz**: Motion throw gesture bowling factoring arm acceleration, release timing, and wrist hook spin.

### 1.2 Non-Goals
- **No Nintendo IP or Trademarks**: No ripped Nintendo graphics, sound effects, fonts, Mii avatars, or trademarked terminology ("Wii", "Wiimote", etc.).
- **No Native App Store Builds**: No React Native, Flutter, or native Android/APK packaging. The system must remain entirely web-based.
- **No Public Cloud Relay Dependency**: Operation must be fully self-contained on the local Wi-Fi subnet; gameplay never depends on external internet servers.
- **No Complex 3D Polygon Engines**: Games avoid heavy WebGL 3D meshes or Three.js/Babylon.js; lightweight 2D sprite rendering via PixiJS ensures reliable 60 fps on standard hardware.

---

## 2. Technology Stack & Architectural Decisions

| Layer / Component | Technology Choice | Rationale & Justification |
| :--- | :--- | :--- |
| **Build & Bundler** | Vite + TypeScript | Instant HMR, strict type checking, native ESM compilation, built-in HTTPS development server support. |
| **Console Hub UI** | Plain Semantic DOM + Tailwind CSS | The console shell is a lightweight document structure. Plain DOM avoids virtual DOM reconciliation overhead and guarantees rock-solid 60 fps CSS transform animations. |
| **Game Engine** | PixiJS (v8) | High-performance 2D WebGL/WebGPU renderer with robust sprite batching, particle containers, and lightweight memory footprint. |
| **Local Transport Relay**| Node.js + `ws` | Extremely low memory and CPU overhead, zero protocol bloat, handles binary and JSON frame forwarding in $< 2$ ms. |
| **Audio Synthesis** | Web Audio API | Eliminates external audio assets, avoids network loading latency, and allows dynamic procedural audio manipulation (pitch sweeps, filter frequency changes). |
| **Secure Transport** | `@vitejs/plugin-basic-ssl` | Android Chrome strictly forbids `DeviceMotionEvent` and `DeviceOrientationEvent` on insecure origins (`http://`). Local SSL certificates unlock sensor access on mobile. |
| **QR Pairing** | `qrcode` | Fast, dependency-light SVG/canvas QR generation for instant mobile browser onboarding. |

---

## 3. System Architecture & Workflows (Mermaid Diagrams)

### (a) High-Level System Architecture
```mermaid
flowchart TD
    subgraph MobileDevice["Android Phone (Mobile Chrome)"]
        Sensors["Device Sensors (Gyro + Accel)"] --> SensorReader["Sensor Ingestion Loop (60Hz)"]
        TouchUI["Virtual Controller Touchpad"] --> TouchHandler["Multi-touch Input Handler"]
        SensorReader --> NetClient["Mobile WebSocket Client"]
        TouchHandler --> NetClient
        HapticEng["Haptic Feedback Engine"]
    end

    subgraph LocalNetwork["Local Wi-Fi Subnet"]
        NetClient -->|"WSS (Secure WebSocket)"| ProxyLayer["Vite Dev Server (/ws proxy)"]
        ProxyLayer -->|"Internal WS"| RelayServer["Node.js Local Relay"]
        RelayServer -->|"Loopback WS"| ConsoleNet["Console WebSocket Client"]
    end

    subgraph DesktopHost["Desktop Console (Chrome / Edge / Safari)"]
        ConsoleNet --> InputBus["Inbound Frame Dispatcher"]
        InputBus --> PointerPipeline["Sensor-to-Pointer Pipeline (1€ Filter)"]
        InputBus --> GameBus["Game Input Router"]
        PointerPipeline --> VirtualCursor["GPU-Accelerated Hand Cursor"]
        VirtualCursor --> DOMEvents["DOM Hit-testing & Focus Engine"]
        DOMEvents --> ChannelShell["Domestic Channel Matrix Shell"]
        GameBus --> PixiStage["PixiJS 60 FPS Game Canvas"]
        ChannelShell --> AudioSynth["Procedural Web Audio Synthesizer"]
        PixiStage --> AudioSynth
    end
```

---

### (b) Network & Deployment Topology
```mermaid
flowchart LR
    subgraph LAN["Local Wi-Fi Subnet (192.168.1.0/24)"]
        subgraph LaptopHost["Host Computer (192.168.1.50)"]
            VitePort["Vite HTTPS Server (Port 5173)"]
            NodeRelay["Node WS Relay (Port 3001)"]
            ConsoleApp["Browser Tab (Console UI)"]
            
            VitePort <-->|"Proxy /ws"| NodeRelay
            ConsoleApp <-->|"ws://localhost:5173/ws"| VitePort
        end

        subgraph PhoneClient["Android Smartphone (192.168.1.85)"]
            PhoneBrowser["Chrome Mobile Tab"]
        end

        PhoneBrowser <-->|"HTTPS Assets (Port 5173)"| VitePort
        PhoneBrowser <-->|"WSS Frame Stream (/ws)"| VitePort
    end
```

---

### (c) Pairing Sequence Diagram with QR Code
```mermaid
sequenceDiagram
    autonumber
    actor User as Player
    participant Console as Desktop Console
    participant Relay as Node WS Relay
    participant Phone as Android Phone

    Console->>Relay: Connect WebSocket (/ws)
    Console->>Relay: JOIN_ROOM { role: "console", roomId: "AUTO" }
    Relay-->>Console: JOIN_ROOM_ACK { roomId: "NP42", success: true }
    Console->>Console: Generate QR Code (URL: https://192.168.1.50:5173/controller?room=NP42)
    Console->>Console: Display Pairing Screen with QR Code and PIN "NP42"
    
    User->>Phone: Scan QR Code with Camera / Chrome
    Phone->>Phone: Open Controller Page over HTTPS
    Phone->>Phone: Request Wake Lock & Motion Permissions
    Phone->>Relay: Connect WebSocket (/ws)
    Phone->>Relay: JOIN_ROOM { role: "controller", roomId: "NP42" }
    Relay-->>Phone: JOIN_ROOM_ACK { roomId: "NP42", peerConnected: true }
    Relay->>Console: PEER_STATUS { peerRole: "controller", status: "connected" }
    
    Console->>Console: Play "Controller Synced" Chime & Dismiss Dialog
    Console->>Phone: COMMAND_HAPTIC { pattern: [60, 40, 60] }
    Phone->>User: Vibrate Controller & Show Active Wand UI
```

---

### (d) Per-Frame Input Sequence Diagram (Phone $\to$ Relay $\to$ Console)
```mermaid
sequenceDiagram
    autonumber
    participant Sensors as Android Hardware
    participant Controller as Phone Web App
    participant Relay as Node WS Relay
    participant Console as Desktop Console
    participant Game as Active PixiJS Game

    loop Every 16.6ms (60 Hz Sampling)
        Sensors->>Controller: DeviceMotionEvent (rotationRate, acceleration)
        Controller->>Controller: Sample Touch Buttons (A, B, DPad, Home)
        Controller->>Relay: INPUT_FRAME { seq, buttons, rotationRate, accel, timestamp }
        Relay->>Console: Forward INPUT_FRAME directly (zero mutation)
        Console->>Console: Update Pointer Pipeline (Deadzone + 1€ Filter)
        alt Inside Console Hub
            Console->>Console: Update Hand Cursor & Dispatch Virtual Hover/Clicks
        else Game Running
            Console->>Game: Pass filtered pointer & button triggers
            Game->>Game: Execute Frame Physics & Render Call
        end
    end
```

---

### (e) Controller Connection State Machine (Including Reconnect)
```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> Connecting: Open /controller?room=ID
    Connecting --> Paired: WebSocket Opened & JOIN_ROOM_ACK
    Connecting --> ConnectionError: Socket Error / Timeout

    state Paired {
        [*] --> IdleStandby
        IdleStandby --> StreamingInput: Motion Sensor Active
        StreamingInput --> StreamingInput: Continuous 60Hz Input Stream
        StreamingInput --> Calibrating: CALIBRATION_START
        Calibrating --> StreamingInput: Calibration Finished
    }

    Paired --> Reconnecting: Wi-Fi Glitch / Socket Dropped
    Reconnecting --> Paired: Reconnect within 10s & Re-join Room
    Reconnecting --> Disconnected: Reconnect Max Retries Exceeded (10s)
    ConnectionError --> Disconnected: User Taps "Retry Connection"
```

---

### (f) Sensor-to-Pointer Pipeline Flowchart
```mermaid
flowchart TD
    RawMotion["Raw DeviceMotionEvent (alpha, beta, gamma in deg/s)"] --> AxisMap["Axis Remapping & Screen Orientation Inversion"]
    AxisMap --> DeadZone{"|rate| < DeadZone Threshold (0.6 deg/s)?"}
    DeadZone -- Yes --> ZeroVelocity["Set Angular Velocity = 0"]
    DeadZone -- No --> DeltaAngle["Compute Delta: dTheta = rate * dt"]
    ZeroVelocity --> Integrate["Integrate to Screen Position: P = P_prev + dTheta * Sensitivity"]
    DeltaAngle --> Integrate
    Integrate --> OneEuroFilter["One Euro (1€) Adaptive Filter"]
    OneEuroFilter --> RecenterCheck{"Recenter Button Pressed?"}
    RecenterCheck -- Yes --> SetCenter["Set Position = (ViewportWidth/2, ViewportHeight/2)"]
    RecenterCheck -- No --> ViewportClamp["Clamp to Viewport Bounds (0 <= x <= W, 0 <= y <= H)"]
    SetCenter --> ViewportClamp
    ViewportClamp --> SmoothCursor["Final Filtered Pointer Coordinates (Px, Py)"]
    SmoothCursor --> RenderCursor["Render SVG Hand Cursor with CSS translate3d"]
```

---

### (g) Calibration Flow
```mermaid
flowchart TD
    Start["User Triggers Pointer Calibration"] --> ShowTarget["Display Center Target Crosshair on Screen"]
    ShowTarget --> PromptUser["Instruct User: 'Point phone at center screen & hold A'"]
    PromptUser --> WaitHold{"Player Holding A Button Stationary?"}
    WaitHold -- No --> PromptUser
    WaitHold -- Yes --> SampleGyro["Collect 60 Gyro Samples over 1000ms"]
    SampleGyro --> CalcOffset["Calculate Gyro Bias Drift: Bias_x = Mean(Rate_x), Bias_y = Mean(Rate_y)"]
    CalcOffset --> StoreOffset["Save Calibration Offsets to LocalStorage"]
    StoreOffset --> PlaySuccess["Play Calibration Chime & Reset Pointer Anchor"]
    PlaySuccess --> ReturnMenu["Return to Settings / Channel Menu"]
```

---

### (h) UI Navigation Flow
```mermaid
flowchart TD
    ConsoleBoot["Console Boot / Idle"] --> ChannelMenu["4x3 Channel Matrix Grid"]
    
    ChannelMenu --> HoverTile["Pointer Hovers Channel Slot"]
    HoverTile --> TileFocus["Tile Scales 1.04x, Cyan Glow & Specular Sheen, Focus Audio"]
    TileFocus --> ClickA["Player Clicks A Button"]
    
    ClickA --> LaunchDialog["Channel Launch Modal Dialog Opens"]
    LaunchDialog --> DialogOptions{"Player Selection"}
    
    DialogOptions -- "Back Pill Button" --> ChannelMenu
    DialogOptions -- "Start Pill Button" --> PlayChime["Play Harmonic Launch Chime"]
    
    PlayChime --> GameSession["Active Game Session (PixiJS Canvas)"]
    GameSession --> PressHome["Player Presses 'Home' Button on Controller"]
    
    PressHome --> HomeOverlay["Home Menu Overlay HUD (Pause State)"]
    HomeOverlay --> OverlayOptions{"Overlay Selection"}
    
    OverlayOptions -- "Resume Game" --> GameSession
    OverlayOptions -- "Reset Game" --> ResetGame["Restart Game Instance"]
    ResetGame --> GameSession
    OverlayOptions -- "Console Menu" --> TeardownGame["Destroy PixiJS Canvas & Return"]
    TeardownGame --> ChannelMenu
```

---

### (i) Generic Game Loop Flowchart
```mermaid
flowchart TD
    GameStart["Game Initialized"] --> FrameLoop["RequestAnimationFrame (60 FPS)"]
    
    FrameLoop --> IngestInput["Ingest Latest Controller Input & Pointer State"]
    IngestInput --> CheckPause{"Is Game Paused by Home Overlay?"}
    
    CheckPause -- Yes --> RenderPauseState["Render Frosted Pause Frame"]
    RenderPauseState --> FrameLoop
    
    CheckPause -- No --> StepPhysics["Update Entity Positions & Physics (dt)"]
    StepPhysics --> CheckCollisions["Broadphase & Narrowphase Collision Checks"]
    CheckCollisions --> ProcessRules["Evaluate Score, Combos, Health, Game Over Conditions"]
    ProcessRules --> RenderSprites["PixiJS WebGL Render Pass"]
    RenderSprites --> CheckOver{"Game Over?"}
    
    CheckOver -- No --> FrameLoop
    CheckOver -- Yes --> ShowResults["Display Game Over Summary & High Scores"]
    ShowResults --> AwaitRestart{"Player Restarts or Exits?"}
    AwaitRestart -- Restart --> StepPhysics
    AwaitRestart -- Exit --> TeardownGame["Teardown & Return to Channel Menu"]
```

---

### (j) Slice Party: Slice-Detection Flowchart
```mermaid
flowchart TD
    PointerTick["Per-Frame Pointer Update"] --> AppendHistory["Append Coordinate to Rolling History Array (Last 6 Frames)"]
    AppendHistory --> CalcVelocity["Calculate Blade Velocity: V = Distance(P_now, P_prev) / dt"]
    
    CalcVelocity --> SpeedCheck{"Velocity > SliceSpeedThreshold (1200 px/sec)?"}
    SpeedCheck -- No --> FadeTrail["Fade Existing Blade Trail Ribbons"]
    SpeedCheck -- Yes --> ActiveBlade["Activate Blade Trail & Emit Spark Particles"]
    
    ActiveBlade --> BuildSegment["Construct Line Segment L = (P_prev, P_now)"]
    BuildSegment --> LoopFruits["For Each Active Fruit with Circle Bounds (C, R)"]
    
    LoopFruits --> Intersect{"Line Segment Intersects Fruit Circle?"}
    Intersect -- No --> LoopFruits
    Intersect -- Yes --> CheckType{"Fruit or Bomb?"}
    
    CheckType -- Bomb --> Detonate["Explosion Flash, Screen Shake, Lose 1 Life, Bomb Audio"]
    CheckType -- Fruit --> SplitFruit["Slice Cut: Split Sprite into 2 Halves with Angular Velocities"]
    
    SplitFruit --> SplashParticles["Spawn Radial Color-matched Juice Particles"]
    SplashParticles --> AudioSlice["Synthesize Exponential Slash Tone"]
    AudioSlice --> UpdateCombo["Increment Multiplier & Add Score"]
    UpdateCombo --> LoopFruits
```

---

### (k) Star Defender: Game Flow & State Diagram
```mermaid
stateDiagram-v2
    [*] --> SectorIntro
    SectorIntro --> WaveActive: Wave Title Card Finished
    
    state WaveActive {
        [*] --> SpawningEnemies
        SpawningEnemies --> CombatEngaged: Enemies Enter Formation
        CombatEngaged --> CrosshairAiming: Pointer Moves Reticle
        CrosshairAiming --> PlayerFiring: B Trigger Held (Rapid Fire)
        PlayerFiring --> CrosshairAiming: Projectiles Travel to Target
        CombatEngaged --> PlayerDamaged: Enemy Bolt Hits Player Shield
        PlayerDamaged --> CombatEngaged: Shield Recharges / Hull Decrements
    }

    WaveActive --> WaveCleared: All Enemies in Wave Destroyed
    WaveCleared --> SectorIntro: Advance to Next Wave
    WaveActive --> GameOver: Player Hull Reaches 0%
    GameOver --> SectorIntro: Player Chooses 'Try Again'
    GameOver --> [*]: Player Exits to Console Menu
```

---

### (l) Bowl Blitz: Throw-Gesture Detection Flowchart
```mermaid
flowchart TD
    AimState["Player Aims Pointer at Lane Pins"] --> HoldB["Player Presses & Holds B Trigger"]
    HoldB --> ArmReady["Arming Throw Sensor: Record Baseline Accelerations"]
    
    ArmReady --> CheckSwing{"Backswing Detected? (Accel Y < -3.0 m/s^2)"}
    CheckSwing -- No --> ArmReady
    CheckSwing -- Yes --> ForwardSwing["Swing Forward: Monitor Rapid Accel Y Growth"]
    
    ForwardSwing --> PeakDetect["Track Forward Acceleration Crest (Peak Accel > 8.0 m/s^2)"]
    PeakDetect --> ReleaseCheck{"Did Player Release B Trigger?"}
    
    ReleaseCheck -- Released Early --> Foul["Foul Throw: Ball Dropped Before Line"]
    ReleaseCheck -- Released Near Peak --> CalcThrow["Compute Throw Parameters: Speed = k * AccelPeak"]
    ReleaseCheck -- Not Released --> ForwardSwing
    
    CalcThrow --> ComputeSpin["Calculate Hook Spin: Spin = Gyro Roll Rate (Gamma) at Release"]
    ComputeSpin --> LaunchBall["Animate Ball Down Lane with Perspective Scaling & Curved Spin"]
    LaunchBall --> PinImpact["Calculate Ball-to-Pin Cluster Physics"]
    PinImpact --> PinSound["Synthesize Dynamic Heavy Pin Clatter Audio"]
    PinSound --> ScoreCard["Update Bowling 10-Frame Scorecard"]
```

---

### (m) Repository Folder Tree
```mermaid
flowchart TD
    Root["NimbusPlay / (Workspace Root)"]
    
    Root --> Config["Configuration Files<br/>(package.json, tsconfig.json, vite.config.ts, tailwind.config.js)"]
    Root --> Docs["docs/<br/>- ARCHITECTURE.md<br/>- PROGRESS.md"]
    Root --> Design["design/<br/>- DESIGN.md (Design System Tokens)<br/>- home_menu.html<br/>- home_overlay.html<br/>- channel_launch_dialog.html<br/>- pointer_calibration.html<br/>- controller_pairing.html<br/>- virtual_remote.html<br/>- console_hand_pointer.svg"]
    Root --> Server["server/<br/>- relay.ts (Node.js WebSocket Hub)<br/>- session.ts (Room Manager)"]
    Root --> Src["src/"]
    
    Src --> Shared["shared/<br/>- protocol.ts (TypeScript Message Schemas)<br/>- constants.ts (Ports, Dimensions, Timers)"]
    Src --> Controller["controller/<br/>- index.html (Mobile Entrypoint)<br/>- main.ts (Controller Controller Loop)<br/>- sensors.ts (DeviceMotion Ingestion)<br/>- touch.ts (Multitouch Virtual Remote UI)<br/>- haptics.ts (Vibration Feedback)"]
    Src --> Console["console/<br/>- index.html (Console Entrypoint)<br/>- main.ts (Console Bootstrapper)<br/>- core/<br/>  - network.ts (WS Client & Reconnect)<br/>  - eventbus.ts (Internal Events)<br/>- pointer/<br/>  - pipeline.ts (Motion Processing)<br/>  - one_euro_filter.ts (Adaptive Filter)<br/>  - cursor.ts (SVG Pointer Renderer)<br/>- audio/<br/>  - synthesizer.ts (Web Audio Procedural FX)<br/>- ui/<br/>  - shell.ts (4x3 Channel Matrix)<br/>  - dialog.ts (Launch Modal)<br/>  - overlay.ts (Home Pause HUD)<br/>  - clock.ts (Analog / Digital Clock)<br/>- games/<br/>  - base_game.ts (Game Interface & Loop)<br/>  - slice_party/ (Fruit Ninja Slicing Game)<br/>  - star_defender/ (Aim & Shoot Space Blaster)<br/>  - bowl_blitz/ (Throw Motion Bowling)"]
```

---

### (n) Phase Roadmap Timeline
```mermaid
flowchart LR
    P0["Phase 0: Master Architecture & Spec"] --> P1["Phase 1: Tooling, Vite & Basic-SSL Setup"]
    P1 --> P2["Phase 2: Node Relay & Protocol Layer"]
    P2 --> P3["Phase 3: Mobile Web Controller & Sensors"]
    P3 --> P4["Phase 4: Sensor-to-Pointer Pipeline & Filter"]
    P4 --> P5["Phase 5: Console UI & Channel Matrix"]
    P5 --> P6["Phase 6: Web Audio Procedural Synthesizer"]
    P6 --> P7["Phase 7: Game 1 - Slice Party"]
    P7 --> P8["Phase 8: Game 2 - Star Defender"]
    P8 --> P9["Phase 9: Game 3 - Bowl Blitz"]
    P9 --> P10["Phase 10: Performance Tuning & Polish"]
```

---

### (o) Error Handling & Troubleshooting Decision Tree
```mermaid
flowchart TD
    ErrorDetect["Issue Observed during Setup / Play"] --> CheckType{"What symptom is occurring?"}
    
    CheckType -- "Phone can't connect to Laptop URL" --> CheckWiFi{"Are Phone and Laptop on identical Wi-Fi?"}
    CheckWiFi -- No --> JoinSame["Connect both devices to the same Wi-Fi network / AP"]
    CheckWiFi -- Yes --> CheckFirewall["Check Laptop Firewall: Allow inbound on port 5173"]
    
    CheckType -- "Browser SSL / HTTPS Certificate Warning" --> SelfSignedCert["Expected: basic-ssl uses a self-signed cert.<br/>In Chrome: Tap 'Advanced' -> 'Proceed to unsafe'"]
    
    CheckType -- "No Pointer Movement on Screen" --> CheckPerms{"Did Phone grant Motion Permissions?"}
    CheckPerms -- No --> ToggleSensors["In Chrome Android: Settings -> Site Settings -> Motion Sensors -> Allow"]
    CheckPerms -- Yes --> CheckRoom["Verify 4-char Room PIN matches Console screen"]
    
    CheckType -- "Pointer Drifting Constantly" --> RestPhone["Place phone on flat surface and trigger 'Calibrate' in Settings"]
    
    CheckType -- "Laggy or Stuttering Pointer" --> CheckNetworkLatency["Check ping times: Reduce interference or switch to 5GHz Wi-Fi band"]
```

---

## 4. WebSocket Message Protocol Specification

All frames exchange structured JSON packets with a unified schema over the `/ws` route.

| Message Type | Direction | Target Frequency | Required Fields | Description |
| :--- | :--- | :--- | :--- | :--- |
| `JOIN_ROOM` | Client $\to$ Relay | On connection | `role` ('console' \| 'controller'), `roomId` (string) | Registers client in specified room session. |
| `JOIN_ROOM_ACK` | Relay $\to$ Client | Response to Join | `success` (bool), `roomId` (string), `peerConnected` (bool) | Confirms room admission and peer presence status. |
| `PEER_STATUS` | Relay $\to$ Client | On state change | `peerRole` (string), `status` ('connected' \| 'disconnected') | Notifies peer of connect/disconnect events. |
| `INPUT_FRAME` | Controller $\to$ Console | 60 Hz ($\approx 16.6\text{ms}$) | `buttons` (object), `rotationRate` (object), `accel` (object), `timestamp` | High-frequency sensor & touch frame. |
| `COMMAND_RECENTER` | Controller $\to$ Console | On demand (Home/Btn) | `timestamp` | Re-anchors cursor to screen viewport midpoint. |
| `COMMAND_HAPTIC` | Console $\to$ Controller | Event-triggered | `pattern` (number array in ms) | Triggers device vibration (e.g. on click/slice). |
| `CALIBRATION_START`| Console $\to$ Controller | On user request | `timestamp` | Enters high-precision bias drift sampling mode. |
| `CALIBRATION_OFFSET`| Controller $\to$ Console| Post-calibration | `offsetBeta` (float), `offsetGamma` (float) | Sends computed resting gyro bias to console. |
| `PING` / `PONG` | Both directions | Every 3000 ms | `timestamp` | Calculates real-time round-trip latency (RTT). |

---

## 5. Performance Budget & Latency Engineering

To deliver an authentic console experience, NimbusPlay operates under a strict budget:

| Pipeline Stage | Target Latency Budget | Implementation Strategy |
| :--- | :--- | :--- |
| **Sensor Hardware Sampling** | $\le 16.6\text{ ms}$ (60Hz) | `DeviceMotionEvent` in Chrome Android runs at display refresh rate. |
| **Phone JSON Serialization** | $\le 1.0\text{ ms}$ | Pre-allocated flat payload object; no deep object cloning. |
| **Wi-Fi Transport (Phone $\to$ Relay)** | $\le 5.0\text{ ms}$ | Local LAN WebSocket framing; minimal TCP buffer bloat. |
| **Node Relay Forwarding** | $\le 1.0\text{ ms}$ | Zero parsing/mutation: in-memory socket forwarding. |
| **Console Filtering & 1€ Math** | $\le 0.5\text{ ms}$ | Direct numeric arithmetic; zero memory allocations per tick. |
| **DOM / PixiJS GPU Render Pass**| $\le 5.0\text{ ms}$ | Hardware-accelerated CSS 3D transforms & WebGL batched rendering. |
| **Total End-to-End Latency** | **$< 30.0\text{ ms}$** | **Completely imperceptible lag on standard 60Hz displays.** |

---

## 6. Design Tokens & Visual Fidelity

The visual presentation adheres to the specifications in [`design/DESIGN.md`](file:///Users/adityasurse/Documents/NimbusPlay/design/DESIGN.md):
- **Primary Electric Cyan (`#3CB4E7`)**: Active channel focus outlines, primary pill fills, pointer indicator pips.
- **Deep Oceanic Cyan (`#1B8FCB`)**: Active click/press states, high-emphasis icons.
- **Pale Wave Background (`#D6E6F2`)**: Animated background sinusoidal wave overlays.
- **Ceramic White Surfaces (`#FFFFFF`)**: Injection-molded channel card tiles with 1px borders (`#CFD8E0`) and inner specular top highlights (`inset 0 2px 0 0 #FFF`).
- **Typography**: Clean, friendly `Nunito Sans` paired with mid-2000s expanded tracking (`0.08em` to `0.12em`) on utility badges and clocks.

---

## 7. How to Run on Android over HTTPS

1. **Start the Vite Dev Server & Relay**:
   ```bash
   npm run dev
   ```
2. **Retrieve Local Host IP Address**:
   The terminal will output the local network URL, e.g.:
   `https://192.168.1.50:5173`
3. **Open Console on Laptop**:
   Visit `https://localhost:5173` in your desktop browser.
4. **Accept Self-Signed Certificate on Android**:
   - Open Chrome on Android and navigate to `https://192.168.1.50:5173/controller?room=...` (or scan the console QR code).
   - Chrome will show "Your connection is not private".
   - Tap **Advanced** $\to$ **Proceed to 192.168.1.50 (unsafe)**.
5. **Sensor Permissions**:
   - Modern Chrome Android enables `DeviceMotionEvent` on secure (`https://`) origins by default.
   - If prompted, tap **Allow** for motion sensors.
   - The phone screen will automatically engage the Screen Wake Lock API and enter Fullscreen.

---

## 8. Verification & Testing Checklist

- [ ] **Network Connectivity**: Phone and laptop establish WebSocket connection on same subnet in $< 200$ ms.
- [ ] **Sensor Feed**: Continuous stream of `INPUT_FRAME` packets delivered at steady 60Hz.
- [ ] **Filter Smoothing**: Pointer is rock-steady when hand is resting; immediate $< 1$ frame response on rapid swings.
- [ ] **Recenter Action**: Home button instantly snaps pointer back to screen center.
- [ ] **Audio Initialization**: Web Audio starts smoothly on first user gesture with zero console errors.
- [ ] **Game 1 (Slice Party)**: Flying fruit arcs intersect blade line segments cleanly; split halves render with slice angle; bombs deduct lives.
- [ ] **Game 2 (Star Defender)**: Reticle tracks pointer; B trigger fires rapid laser pulses; enemies explode with synthesized sound.
- [ ] **Game 3 (Bowl Blitz)**: Backswing $\to$ forward swing $\to$ B release accurately measures arm velocity and spin hook.
- [ ] **Home Overlay HUD**: Pressing Home button cleanly pauses active game; selecting Console Menu restores hub cleanly without memory leaks.

---

## 9. Risk List & Mitigation Strategies

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Gyroscope Drift** | Pointer slowly drifts away from physical pointing angle over time. | 1. Deadzone thresholding cutoffs.<br/>2. One-touch Recenter button on Home button.<br/>3. Resting bias calibration routine in settings. |
| **Android Chrome Throttling** | Chrome reduces timer resolution when battery is low or tab is backgrounded. | 1. Screen Wake Lock API prevents sleep.<br/>2. Passive sensor event listeners avoid main-thread throttling.<br/>3. Fullscreen mode ensures maximum foreground priority. |
| **Self-Signed SSL Warning** | Users unfamiliar with development certificates might get stuck. | Clear visual instructions on pairing screen explaining how to tap "Advanced $\to$ Proceed". |
| **Wi-Fi Packet Jitter** | Sporadic bursts of dropped or clustered packets on noisy 2.4GHz Wi-Fi. | Sequence numbers with client-side interpolation; $1€$ filter absorbs bursty velocity spikes. |

---

## 10. Phase Execution Checklist

- [x] **Phase 1: Tooling & Workspace Setup**
  - [x] Initialize `package.json` with TypeScript, Vite, `@vitejs/plugin-basic-ssl`, `pixi.js`, `ws`, `qrcode`.
  - [x] Configure `vite.config.ts` with SSL certificates and `/ws` reverse proxy.
  - [x] Configure design tokens in `src/styles/tokens.css` with NimbusPlay specifications.
- [x] **Phase 2: Local Relay & Protocol Layer**
  - [x] Implement `server/relay.ts` room manager and WebSocket router.
  - [x] Implement `src/shared/protocol.ts` TypeScript schemas.
  - [x] Verify local Wi-Fi pairing and ping-pong round-trip latency.
- [ ] **Phase 3: Mobile Controller Client**
  - [ ] Build mobile touch UI matching console remote ergonomics.
  - [ ] Ingest `DeviceMotionEvent` with axis remapping and orientation lock.
  - [ ] Implement Screen Wake Lock and haptic vibration feedback.
- [ ] **Phase 4: Sensor-to-Pointer Pipeline**
  - [ ] Implement One Euro filter and deadzone mathematics.
  - [x] Render custom SVG cursor with hardware-accelerated transforms.
  - [ ] Add Recenter command handling.
- [x] **Phase 5: Console Shell UI & Channel Matrix**
  - [x] Build 4×3 Channel Grid matching Stitch design tokens.
  - [x] Implement Channel Launch modal dialog.
  - [x] Implement Home Overlay pause menu.
  - [x] Implement Controller Connection Setup & Pointer Calibration screens.
- [ ] **Phase 6: Web Audio Procedural Synthesizer**
  - [ ] Synthesize UI chirps, clicks, and launch chimes.
  - [ ] Synthesize game sound effects (sword slash, laser blaster, bowling pin strike).
- [ ] **Phase 7: Game 1 — Slice Party**
  - [ ] Build fruit physics, blade trail geometry, line intersection, and combo scoring.
- [ ] **Phase 8: Game 2 — Star Defender**
  - [ ] Build starfield parallax, target crosshair, laser pooling, and enemy wave combat.
- [ ] **Phase 9: Game 3 — Bowl Blitz**
  - [ ] Build perspective lane, swing/release gesture detector, and pin cluster physics.
- [ ] **Phase 10: Performance Tuning & Final Polish**
  - [ ] Measure end-to-end latency, audit 60 fps rendering, and verify error recoveries.
