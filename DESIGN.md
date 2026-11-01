---
name: NimbusPlay
colors:
  surface: '#f7f9ff'
  surface-dim: '#cfdbeb'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf4ff'
  surface-container: '#e3efff'
  surface-container-high: '#dde9f9'
  surface-container-highest: '#d7e4f4'
  on-surface: '#111d28'
  on-surface-variant: '#3e484f'
  inverse-surface: '#26313e'
  inverse-on-surface: '#e8f2ff'
  outline: '#6e7980'
  outline-variant: '#bdc8d0'
  surface-tint: '#006688'
  primary: '#006688'
  on-primary: '#ffffff'
  primary-container: '#3cb4e7'
  on-primary-container: '#00435a'
  inverse-primary: '#76d1ff'
  secondary: '#006492'
  on-secondary: '#ffffff'
  secondary-container: '#5fbffe'
  on-secondary-container: '#004c70'
  tertiary: '#51606a'
  on-tertiary: '#ffffff'
  tertiary-container: '#9babb6'
  on-tertiary-container: '#314049'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c2e8ff'
  primary-fixed-dim: '#76d1ff'
  on-primary-fixed: '#001e2b'
  on-primary-fixed-variant: '#004d67'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#8bceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004b6f'
  tertiary-fixed: '#d5e5f1'
  tertiary-fixed-dim: '#b9c9d4'
  on-tertiary-fixed: '#0e1d26'
  on-tertiary-fixed-variant: '#3a4952'
  background: '#f7f9ff'
  on-background: '#111d28'
  surface-variant: '#d7e4f4'
typography:
  headline-xl:
    fontFamily: Nunito Sans
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.01em
  headline-xl-mobile:
    fontFamily: Nunito Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Nunito Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: 0em
  headline-lg-mobile:
    fontFamily: Nunito Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: 0em
  headline-md:
    fontFamily: Nunito Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Nunito Sans
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Nunito Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.12em
  display-clock:
    fontFamily: Nunito Sans
    fontSize: 56px
    fontWeight: '300'
    lineHeight: 60px
    letterSpacing: 0.02em
  display-clock-mobile:
    fontFamily: Nunito Sans
    fontSize: 36px
    fontWeight: '300'
    lineHeight: 40px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-tv: 1.75rem
  margin: 2rem
  margin-tv: 3.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
  space-2xl: 3.5rem
---

## Brand & Style

This design system channels the clean, tactile, and delightfully optimistic aesthetic of late-2000s Japanese home console firmware (specifically the 2006–2012 era of domestic gaming hardware). It rejects the oppressive, uniform dark-mode norms of modern gaming hubs, steering completely clear of heavy neon glows, purple gradients, frosted glass blurs, and sterile SaaS cards. 

Instead, the interface presents a bright, airy, glossy-minimal domestic utility. Surfaces feel physically molded out of pristine white lacquer, illuminated by cool ambient overhead light with crisp inner specular highlights. The target emotional response is instant approachability, cheerful calm, and physical responsiveness tailored for 10-foot television navigation as well as handheld viewing.

## Colors

The palette relies on pure optical clarity, crisp ceramic whites, and sky-derived cyan accents:

- **Primary Accent (`#3CB4E7`):** Electric console cyan. Used for active focus rings, primary CTA fills, and active indicator pips.
- **Secondary / Deep Accent (`#1B8FCB`):** Deep oceanic cyan. Employed for high-emphasis active press states, crisp icon accents, and focused text highlights.
- **Pale Wave / Background Track (`#D6E6F2`):** Subtle atmospheric cyan-tinted grey. Used at 20% opacity for animated background wave contours and inactive channel placeholders.
- **Canvas Backdrop:** Linear gradient transitioning vertically from near-white (`#F4F6F8`) at the crown to cool light grey (`#E3E9EF`) at the base, overlayed with a crisp diagonal 15-degree white specular sheen and faint sine-wave line accents.
- **Surfaces & Tile Fills:** Pure ceramic white (`#FFFFFF`) with calibrated top specular light.
- **Borders & Seams:** `#CFD8E0` provides a firm, physical perimeter edge that mimics molded plastic panels.
- **Typography Neutrals:**
  - Headings & Selected Labels: `#4A5663` (Charcoal Slate)
  - Body & Channel Captions: `#6B7785` (Cool Slate)
  - Muted, Sub-labels & Clock Dividers: `#8A96A3` (Soft Grey)

## Typography

The typography leverages `Nunito Sans` configured with softly rounded letterforms and generous aperture to convey friendliness and effortless distance legibility.

All uppercase utility tags, controller prompt callouts, and bottom navigation headers use expanded tracking (`0.08em` to `0.12em`) to echo mid-2000s console hardware labels. Headings maintain a balanced medium-to-bold presence without harsh angular cuts, ensuring numbers and kana-adjacent Latin glyphs look naturally integrated on 1080p and 4K displays.

## Layout & Spacing

The spatial model replicates a fixed-ratio, structured console channel matrix surrounded by overscan-safe margins:

- **Grid Architecture:** 
  - Standard 10-foot TV & Desktop viewports feature a 4×3 grid (12 channel slots) of 16:9 aspect ratio tiles flanked by dedicated lateral pagination wings (prev/next chevron bumpers).
  - Tablet environments compress into a 3×3 grid.
  - Mobile hand-held screens reflow into a vertically paginated 2×3 or 2-column infinite carousel with fixed lower toolbar docking.
- **TV Safe Margins:** Base viewports enforce a strict `3.5rem` (56px) outer perimeter margin to simulate CRT/Overscan broadcast compliance.
- **Rhythm:** Tile gaps use `1.75rem` on TV/desktop displays to ensure the visual impact of scale transforms during focus states never results in overlapping adjacent tiles.

## Elevation & Depth

Depth in this system is defined by physical injection-molded industrial design rather than dark ambient shadows or software drop shadows:

1. **Resting Surfaces (Level 1):** Pure `#FFFFFF` surfaces are constructed with a 1px solid perimeter boundary of `#CFD8E0`, an inner top border highlight (`box-shadow: inset 0 2px 0 0 #FFFFFF`), and a cool-tinted resting ambient drop shadow (`0 6px 14px rgba(120, 140, 160, 0.25)`).
2. **Elevated Trays & Modal Pods (Level 2):** Layered dialogue panels and floating prompt overlays lift with `0 14px 28px rgba(100, 125, 150, 0.28)`, reinforced with an internal 1.5px semi-opaque white rim to simulate a clear-coated acrylic bevel.
3. **Active Focus & Hover State:** When a remote pointer or directional D-pad focuses any channel or actionable item:
   - Scale elevates immediately to `scale(1.04)`.
   - The boundary swaps to a 3px solid `#3CB4E7` outer frame.
   - Depth expands via a dual-ring cyan glow: `0 0 0 2px rgba(255,255,255,0.8), 0 8px 24px rgba(60, 180, 231, 0.45)`.
4. **Depressed / Engaged State:** Scale snaps to `0.98`, reducing the bottom shadow to `0 2px 4px rgba(120, 140, 160, 0.3)` and deepening the inner upper border to `#CFD8E0` for an authentic hardware button click.

## Shapes

The design uses distinct shape tiers to categorize function:
- **16:9 Channel Cards:** Explicitly rounded corners between `18px` and `22px` (`1.25rem`), preserving the iconic "channel screen" silhouette without collapsing into a squircle.
- **Action Buttons & Modals:** 100% full pill geometry (`border-radius: 9999px`) on all primary buttons, back buttons, and input fields.
- **Bottom Navigation Hubs:** Pure circular disks (`border-radius: 50%`) for the system utility hubs (Options, Message Board, SD Card, Address Book) positioned along the bottom chrome bar.
- **Badge Counters & Status Pods:** Stadium pills with a constant minimum height of 24px and centered text metrics.

## Components

### 1. Channel Tiles (Primary Grid Cards)
- **Geometry:** Strict 16:9 aspect ratio with `20px` corner radii.
- **Surface Fill:** Pure `#FFFFFF` base. Empty channels display an animated subtle sine-wave vector across the bottom third in `#D6E6F2` (20% opacity) against an off-white `#F9FBFC` interior canvas.
- **Inner Rim:** `inset 0 2px 0 0 #FFFFFF` simulates an overhead shelf light source, enclosed by a 1px border of `#CFD8E0`.
- **Focus Transition:** Snappy cubic-bezier response (`transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)`), scaling to `1.04` with a 3px `#3CB4E7` outline and soft cyan diffuse halo.
- **Channel Banner / Graphic:** Centered animated loop or crisp SVG icon, accompanied by a fixed bottom title container in `label-md` uppercase `#6B7785`.

### 2. Pill Action Buttons
- **Primary Variant:** Pill-shaped (`rounded-full`), `#3CB4E7` fill transitioning vertically to `#2FA2D4` with a 1.5px top highlight line in `rgba(255,255,255,0.65)`. Text is pure `#FFFFFF` bold.
- **Secondary / Cancel Variant:** Ceramic white `#FFFFFF` fill, 1.5px border `#CFD8E0`, text `#4A5663`.
- **Focus:** 3px `#3CB4E7` offset ring with a scale transform of `1.05`.

### 3. Circular Navigation Disks (Bottom Toolbar)
- **Dimensions:** 64px × 64px circular buttons located in the bottom console tray.
- **Resting:** `#FFFFFF` background, centered icon in `#4A5663`, encased in a 1px `#CFD8E0` outer ring and subtle inset top highlight.
- **Hover/Pointer Over:** Icon shifts to `#3CB4E7`, circle scales up to `1.08` with a 3px cyan outline and tactile audio click feedback.

### 4. Selection Chips & Toggles
- **Structure:** Pill shapes with `8px` vertical padding and `18px` lateral padding.
- **Selected State:** Glossy fill in `#3CB4E7` with white text.
- **Unselected State:** Crisp white fill with a 1px border of `#CFD8E0` and text in `#6B7785`.

### 5. Checkboxes & Radio Knobs
- **Checkboxes:** 22px × 22px with `6px` soft corners. Inactive state features a `#F4F6F8` fill and `#CFD8E0` border. Active state fills with `#3CB4E7` featuring a bold white checkmark.
- **Radio Buttons:** Pure 22px circles with a raised ceramic rim. Active state nests a glossy 10px `#3CB4E7` inner orb.

### 6. System Modals & Prompt Enclosures
- **Panel Surface:** Smooth white dialog with `28px` corner radius, a 2px boundary line in `#CFD8E0`, and an inset specular rim.
- **Header:** Upper panel features an expansive, soft grey headline in `headline-lg` (`#4A5663`) underscored by a gentle horizontal divider line (`#E3E9EF`).
- **Button Row:** Paired pill actions ("Back" on the left in neutral ceramic, "Confirm / Start" on the right in high-gloss cyan).

### 7. Global Top & Bottom Chrome Bar
- **Top Status Bar:** Floats unobtrusively on the gradient canvas with a large digital clock in `display-clock` (`#6B7785`), companion calendar date badge, and remote battery indicators (4 horizontal segments in `#3CB4E7`).
- **Bottom Shelf:** A sculpted horizontal docking ledge spanning the full viewport width, tapering slightly toward the outer margins with molded curved wings housing the system disks and message counter.