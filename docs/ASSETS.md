# NimbusPlay — Asset Pipeline & 3D Geometry Specifications

This document catalogs and specifies the visual and procedural assets used in NimbusPlay, with particular emphasis on the 3D racing game **Turbo Circuit**.

---

## 1. Architectural Philosophy: Procedural First & Zero Third-Party IP

NimbusPlay avoids heavyweight external 3D asset downloads and copyright liabilities by generating all 3D geometries, textures, materials, particles, and audio dynamically through procedural code:
- **Zero Nintendo IP**: No trademarks, karts, characters, or audio dumps from Mario Kart or Nintendo franchises. All karts, tracks, items, characters, and sounds are original NimbusPlay domestic console creations.
- **Instant Zero-Network Boot**: Procedural geometry compiles in under $10\text{ms}$ upon game launch, requiring $0\text{ MB}$ of external asset network requests.
- **High-Performance PBR Rendering**: Built on Three.js with `ACESFilmicToneMapping`, `SRGBColorSpace`, and `PCFSoftShadowMap`.

---

## 2. Turbo Circuit: Kart & Driver Specifications

### Procedural Kart Model (`KartModel`)
- **Polygon Budget**: $\approx 640$ triangles per kart for 60 fps rendering on mobile and desktop GPUs.
- **Component Hierarchy**:
  ```
  KartModel (Group)
  ├── Chassis Group
  │   ├── Base Frame (BoxGeometry 2.0 × 0.35 × 3.8, Dark Slate PBR)
  │   ├── Aerodynamic Body Shell (BoxGeometry 1.6 × 0.45 × 2.6, Primary Color PBR)
  │   ├── Front Nose & Splitter (BoxGeometry 1.2 × 0.25 × 0.9, Accent Color PBR)
  │   ├── Side Pods (BoxGeometry 0.35 × 0.32 × 1.8 × 2, Accent Color PBR)
  │   ├── Rear Engine Intake (BoxGeometry 0.7 × 0.45 × 0.65)
  │   └── High-Downforce Rear Wing (BoxGeometry 2.2 × 0.12 × 0.5 with uprights)
  ├── Articulated Steering & Suspension
  │   ├── Front Left Pivot & Wheel (CylinderGeometry 0.38 radius × 0.32 width)
  │   ├── Front Right Pivot & Wheel
  │   ├── Rear Left Wheel (CylinderGeometry 0.46 radius × 0.42 width)
  │   └── Rear Right Wheel
  ├── Driver Figure ("Volt")
  │   ├── Torso & Racing Suit (BoxGeometry 0.75 × 0.85 × 0.5, leaning pivot)
  │   ├── Racing Helmet (SphereGeometry 0.38 radius)
  │   └── Aerodynamic Gold Visor (BoxGeometry 0.42 × 0.18 × 0.18, High Metalness PBR)
  ├── Dynamic Lighting & Emissives
  │   ├── Twin Front Headlights (Emissive 0xfef08a, SpotLights casting forward beam)
  │   └── Rear Brake Lights (Emissive 0xef4444, dynamic intensity 0.3 cruising → 2.5 braking)
  ├── Deployable Glider Wing (BoxGeometry 5.2 × 0.08 × 1.2, deployed during glider flight)
  └── Exhaust Flumes & Sparks (MeshBasicMaterial with AdditiveBlending)
  ```

### Material Specifications
- **Body Paint**: `MeshStandardMaterial` (`roughness: 0.22`, `metalness: 0.35`).
- **Tire Rubber**: `MeshStandardMaterial` (`roughness: 0.92`, `metalness: 0.08`, dark slate `#0f172a`).
- **Alloy Rims**: `MeshStandardMaterial` (`roughness: 0.25`, `metalness: 0.85`, `#e2e8f0`).
- **Visor Glass**: `MeshStandardMaterial` (`roughness: 0.12`, `metalness: 0.95`, `#f59e0b`).

---

## 3. Track & Circuit Architecture

### Procedural Track Spline (`TrackSpline`)
- **Mathematical Base**: Closed 3D CatmullRom spline generated from 16 control anchors forming a classic stadium Grand Prix circuit with chicane, sweeper, and glider jump sections.
- **Road Width**: 24.0 world units.
- **Asphalt Surface**:
  - Procedural $512 \times 512$ procedural canvas texture with subtle micro-grain noise ($\pm 18$ RGB variance).
  - Continuous painted edge guidance lines (`#f8fafc`).
  - Dashed central lane dividers (`#facc15`).
- **Curbs & Rumble Strips**:
  - Dual-tone red and white chevron chevrons extruded along inner and outer track bounds.
- **Tire Barriers**:
  - Cylindrical rubber barriers stacked in pairs around high-speed outer curves (Turn 1 sweeper, hairpin exit, Turn 8).

---

## 4. Stadium & Atmospheric Geometry

### Stadium Grandstands & Lighting (`StadiumBuilder`)
- **Seating Bleachers**: Tiered concrete grandstand structures with stylized procedural spectator billboards (`#1e293b`, `#334155`).
- **Light Towers**: 4 tall steel lattice towers with cross-arms mounting directional floodlight fixtures and soft warm point lights (`0xffedd5`, 18m radius).
- **Start/Finish Gantry**: Heavy steel arch spanning the track with dual vertical pylons, high-resolution checkered border banner, and illuminated "TURBO CIRCUIT" signage.
- **Atmospheric Fog**: Exponential height fog (`FogExp2`, color `#7dd3fc`, density `0.0032`) softening distant stadium architecture.

---

## 5. Particle Systems & VFX (`TurboParticleSystem`)

Dedicated pooled particle engine for GPU efficiency and zero runtime allocations:

| VFX Effect | Implementation | Visual Behavior |
|:---|:---|:---|
| **Tire Smoke** | 40 pooled spheres (`radius: 0.35`) | Billowing white smoke during hard braking and drifts; expands with upward drift. |
| **Drift Sparks** | 50 pooled spark points | 3-tier dynamic progression: Blue (`0x38bdf8`) &rarr; Orange (`0xf97316`) &rarr; Purple (`0xc084fc`). |
| **Skid Marks** | 30 planar road decals (`PlaneGeometry`) | Stamped on asphalt along kart heading during hard braking/drifting; gradual opacity fade. |
| **Boost Flames** | Additive exhaust meshes + sparks | High-velocity orange/yellow flame bursts trailing behind exhausts during turbo boost. |
| **Coin Sparkles** | 30 golden spark points with gravity | Upward fountain burst upon coin pickup, arcing downwards under gravity. |

---

## 6. Procedural Audio Synthesis

NimbusPlay contains zero sampled or copyrighted audio files. 100% of sound effects are synthesized in real-time through the Web Audio API:

- **Kart Engine Audio**: Dynamic dual-oscillator FM synthesis modulated by instantaneous RPM and kart velocity ($80\text{Hz}$ idle &rarr; $380\text{Hz}$ top speed).
- **Turbo Boost Whoosh**: Exponential frequency sweep combined with filtered pink noise burst ($1800\text{Hz}$ &rarr; $350\text{Hz}$).
- **Drift Screech**: Resonant bandpass-filtered noise modulated at $14\text{Hz}$ to simulate tire friction on asphalt.
- **Coin Pickup Chime**: High-purity sine harmonic interval ($1318\text{Hz}$ E6 &rarr; $1760\text{Hz}$ A6) with exponential amplitude decay.
- **Hazard Explosion**: Dual low-frequency sub-bass drop ($90\text{Hz}$ &rarr; $30\text{Hz}$) with crushed white noise envelope.

---

## 7. Graphics Quality Presets

Configured via Console Settings and automatically adapted by the frame watchdog:

| Setting Preset | Shadow Map Resolution | Particle Pool Scale | Pixel Ratio | Low-FPS Trigger |
|:---|:---:|:---:|:---:|:---|
| **High** (Default) | $2048 \times 2048$ PCF Soft | $1.0\times$ (Full density) | Native (up to $2.0\times$) | Downgrades if $<45\text{ fps}$ for 3s |
| **Medium** | $1024 \times 1024$ PCF Soft | $0.65\times$ | $1.0\times$ locked | Downgrades if $<45\text{ fps}$ for 3s |
| **Low** | Shadows Disabled | $0.35\times$ | $0.85\times$ downscale | Baseline minimum |

