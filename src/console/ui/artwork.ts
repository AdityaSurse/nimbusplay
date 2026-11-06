/**
 * NimbusPlay — Procedural SVG Channel Artwork
 * Matches the reference monitor menu: vibrant colorful icons on glossy gradient tiles.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

export const CHANNEL_ART = {
  fruitNinja: `
    <div class="channel-card-body bg-gradient-to-b from-[#fca558] to-[#f47833]">
      <div class="tile-specular-glare"></div>
      <div class="channel-icon-cluster">
        <svg viewBox="0 0 64 64" class="channel-svg-icon" fill="none">
          <filter id="fn-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
          </filter>
          <g filter="url(#fn-shadow)">
            <!-- Outer Green Watermelon Rind -->
            <path d="M8 26 A24 24 0 0 0 56 26 Z" fill="#22c55e" stroke="#15803d" stroke-width="1.5" stroke-linejoin="round"/>
            <!-- Rind Stripes -->
            <path d="M16 38 A24 24 0 0 0 20 44 M26 44 A24 24 0 0 0 32 46 M38 44 A24 24 0 0 0 44 44" stroke="#166534" stroke-width="2" stroke-linecap="round"/>
            <!-- Inner White Rind Layer -->
            <path d="M11 26 A21 21 0 0 0 53 26 Z" fill="#ffffff"/>
            <!-- Juicy Ruby-Red Pulp -->
            <path d="M13 26 A19 19 0 0 0 51 26 Z" fill="#ff3355"/>
            <!-- Glossy Pulp Highlight -->
            <path d="M17 28 A15 15 0 0 0 32 42" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Black Watermelon Seeds -->
            <ellipse cx="22" cy="33" rx="1.6" ry="2.4" fill="#1e293b"/>
            <ellipse cx="32" cy="37" rx="1.6" ry="2.4" fill="#1e293b"/>
            <ellipse cx="42" cy="33" rx="1.6" ry="2.4" fill="#1e293b"/>
            <ellipse cx="27" cy="30" rx="1.4" ry="2.0" fill="#1e293b"/>
            <ellipse cx="37" cy="30" rx="1.4" ry="2.0" fill="#1e293b"/>
          </g>
        </svg>
      </div>
      <div class="channel-label-box">
        <span class="channel-label-text">Fruit Ninja</span>
      </div>
    </div>
  `,

  alienAttack: `
    <div class="channel-card-body bg-gradient-to-b from-[#8cd54f] to-[#5cb52e]">
      <div class="tile-specular-glare"></div>
      <div class="channel-icon-cluster">
        <svg viewBox="0 0 64 64" class="channel-svg-icon" fill="none">
          <filter id="alien-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
          </filter>
          <g filter="url(#alien-shadow)">
            <!-- Purple Retro Alien Invader Sprite -->
            <!-- Antennae with bulb tips -->
            <path d="M22 14 L26 21 M42 14 L38 21" stroke="#9333ea" stroke-width="3" stroke-linecap="round"/>
            <circle cx="21" cy="13" r="2.5" fill="#c084fc"/>
            <circle cx="43" cy="13" r="2.5" fill="#c084fc"/>
            <!-- Alien Head & Body -->
            <path d="M20 21 H44 C49 21 52 25 52 30 V38 C52 42 49 45 44 45 H20 C15 45 12 42 12 38 V30 C12 25 15 21 20 21 Z" fill="#a855f7"/>
            <!-- Shading Highlight on Head -->
            <path d="M22 24 H42" stroke="#e9d5ff" stroke-width="2" stroke-linecap="round"/>
            <!-- Little alien arms/claws -->
            <path d="M12 34 L7 37 V43 L12 40 M52 34 L57 37 V43 L52 40" stroke="#9333ea" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
            <!-- Alien Feet -->
            <path d="M22 45 L20 49 M42 45 L44 49 M28 45 V48 M36 45 V48" stroke="#9333ea" stroke-width="3" stroke-linecap="round"/>
            <!-- Big Round Eyes -->
            <ellipse cx="25" cy="32" rx="4.5" ry="5.5" fill="#ffffff"/>
            <ellipse cx="39" cy="32" rx="4.5" ry="5.5" fill="#ffffff"/>
            <!-- Dark Pupils Looking Center -->
            <circle cx="26" cy="32" r="2.4" fill="#1e1b4b"/>
            <circle cx="38" cy="32" r="2.4" fill="#1e1b4b"/>
            <!-- Cute Eye Specular Dots -->
            <circle cx="25" cy="30.5" r="1" fill="#ffffff"/>
            <circle cx="37" cy="30.5" r="1" fill="#ffffff"/>
          </g>
        </svg>
      </div>
      <div class="channel-label-box">
        <span class="channel-label-text">Alien Attack</span>
      </div>
    </div>
  `,

  shootingRange: `
    <div class="channel-card-body bg-gradient-to-b from-[#5fa7fa] to-[#2563eb]">
      <div class="tile-specular-glare"></div>
      <div class="channel-icon-cluster">
        <svg viewBox="0 0 64 64" class="channel-svg-icon" fill="none">
          <filter id="sr-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.3"/>
          </filter>
          <g filter="url(#sr-shadow)">
            <!-- Outer Red Target Ring -->
            <circle cx="32" cy="32" r="23" fill="#ef4444" stroke="#ffffff" stroke-width="1.8"/>
            <!-- White Ring -->
            <circle cx="32" cy="32" r="17" fill="#ffffff"/>
            <!-- Middle Red Ring -->
            <circle cx="32" cy="32" r="11" fill="#ef4444"/>
            <!-- Center White Bullseye Core -->
            <circle cx="32" cy="32" r="5.5" fill="#ffffff"/>
            <!-- Center Red Bullseye Dot -->
            <circle cx="32" cy="32" r="2.8" fill="#ef4444"/>
            <!-- Target Crosshairs -->
            <path d="M32 6 V11 M32 53 V58 M6 32 H11 M53 32 H58" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
            <!-- Glossy Highlight Arc -->
            <path d="M16 20 A20 20 0 0 1 44 14" stroke="rgba(255,255,255,0.6)" stroke-width="2" stroke-linecap="round"/>
          </g>
        </svg>
      </div>
      <div class="channel-label-box">
        <span class="channel-label-text">Shooting Range</span>
      </div>
    </div>
  `,

  sketch: `
    <div class="channel-card-body bg-gradient-to-b from-[#c374f6] to-[#9333ea]">
      <div class="tile-specular-glare"></div>
      <div class="channel-icon-cluster">
        <svg viewBox="0 0 64 64" class="channel-svg-icon" fill="none">
          <filter id="sk-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="#000000" flood-opacity="0.3"/>
          </filter>
          <g filter="url(#sk-shadow)">
            <!-- Golden Birch Wood Artist Palette -->
            <path d="M32 10 C19 10 11 19 11 31 C11 44 19 52 29 52 C33 52 35 49 35 46 C35 43 34 41 36 39 C38 37 41 37 44 37 C50 37 54 33 54 27 C54 18 44 10 32 10 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.8" stroke-linejoin="round"/>
            <!-- Palette Specular Sheen -->
            <path d="M16 22 C18 16 26 13 34 13" stroke="rgba(255,255,255,0.6)" stroke-width="2" stroke-linecap="round"/>
            <!-- Thumbhole Cutout -->
            <ellipse cx="42" cy="27" rx="3.5" ry="4" fill="#9333ea"/>
            <!-- Wet Paint Blobs -->
            <circle cx="21" cy="23" r="3.2" fill="#ef4444"/>
            <circle cx="29" cy="18" r="3.2" fill="#3b82f6"/>
            <circle cx="37" cy="19" r="3.2" fill="#10b981"/>
            <circle cx="21" cy="33" r="3.2" fill="#ec4899"/>
            <!-- Paint Blob Specular Dots -->
            <circle cx="20" cy="22" r="0.8" fill="#ffffff"/>
            <circle cx="28" cy="17" r="0.8" fill="#ffffff"/>
            <circle cx="36" cy="18" r="0.8" fill="#ffffff"/>
            <circle cx="20" cy="32" r="0.8" fill="#ffffff"/>
          </g>
        </svg>
      </div>
      <div class="channel-label-box">
        <span class="channel-label-text">Sketch</span>
      </div>
    </div>
  `,

  turboCircuit: `
    <div class="channel-card-body bg-gradient-to-b from-[#f97316] via-[#ef4444] to-[#0d9488]">
      <div class="tile-specular-glare"></div>
      <div class="channel-icon-cluster">
        <svg viewBox="0 0 64 64" class="channel-svg-icon" fill="none">
          <filter id="tc-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
          </filter>
          <g filter="url(#tc-shadow)">
            <!-- Rear Spoiler Wing -->
            <path d="M12 17 H52 V21 H12 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
            <path d="M20 21 L18 27 M44 21 L46 27" stroke="#ffffff" stroke-width="2"/>
            <!-- Driver Helmet -->
            <circle cx="32" cy="27" r="6.5" fill="#ffffff"/>
            <path d="M28 27 H36" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Kart Chassis -->
            <path d="M18 27 L23 48 H41 L46 27 Z" fill="#ef4444" stroke="#ffffff" stroke-width="1.6"/>
            <path d="M25 33 H39 L37 46 H27 Z" fill="#0d9488"/>
            <!-- Front Bumper -->
            <path d="M21 48 H43 V52 H21 Z" fill="#ffffff"/>
            <!-- Wheels -->
            <rect x="9" y="44" width="7" height="11" rx="2.5" fill="#1e293b"/>
            <rect x="48" y="44" width="7" height="11" rx="2.5" fill="#1e293b"/>
            <rect x="7" y="23" width="7" height="13" rx="2.5" fill="#1e293b"/>
            <rect x="50" y="23" width="7" height="13" rx="2.5" fill="#1e293b"/>
          </g>
        </svg>
      </div>
      <div class="channel-label-box">
        <span class="channel-label-text">Turbo Circuit</span>
      </div>
    </div>
  `,

  ghostTile: `
    <div class="channel-card-body ghost-tile-body">
      <div class="ghost-specular-glare"></div>
    </div>
  `
};
