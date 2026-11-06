/**
 * NimbusPlay — Original Procedural SVG Channel Artwork
 * Glossy gradient cards with crisp white icons & labels.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

export const CHANNEL_ART = {
  fruitNinja: `
    <div class="channel-card-body bg-gradient-to-br from-[#ea580c] via-[#f59e0b] to-[#facc15]">
      <div class="tile-specular-glare"></div>
      <div class="channel-icon-cluster">
        <svg viewBox="0 0 64 64" class="channel-svg-icon" fill="none">
          <!-- White Watermelon Wedge Rind -->
          <path d="M8 26 A24 24 0 0 0 56 26 Z" fill="rgba(255,255,255,0.25)" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
          <!-- White Watermelon Pulp Core -->
          <path d="M12 26 A20 20 0 0 0 52 26 Z" fill="#ffffff"/>
          <!-- Seed Cutouts -->
          <ellipse cx="22" cy="33" rx="2" ry="2.8" fill="#ea580c"/>
          <ellipse cx="32" cy="38" rx="2" ry="2.8" fill="#ea580c"/>
          <ellipse cx="42" cy="33" rx="2" ry="2.8" fill="#ea580c"/>
          <ellipse cx="27" cy="30" rx="1.6" ry="2.2" fill="#ea580c"/>
          <ellipse cx="37" cy="30" rx="1.6" ry="2.2" fill="#ea580c"/>
        </svg>
      </div>
      <div class="channel-label-box">
        <span class="channel-label-text">Fruit Ninja</span>
      </div>
    </div>
  `,

  alienAttack: `
    <div class="channel-card-body bg-gradient-to-br from-[#15803d] via-[#16a34a] to-[#4ade80]">
      <div class="tile-specular-glare"></div>
      <div class="channel-icon-cluster">
        <svg viewBox="0 0 64 64" class="channel-svg-icon" fill="#ffffff" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round">
          <!-- Antennae -->
          <path d="M22 13 L26 19 M42 13 L38 19" stroke="#ffffff" stroke-width="3"/>
          <!-- Outer Alien Body Silhouette -->
          <path d="M18 19 H46 V33 H18 Z M14 25 H50 V37 H14 Z M18 37 H24 V43 H18 Z M40 37 H46 V43 H40 Z M12 33 H16 V45 H12 Z M48 33 H52 V45 H48 Z" fill="#ffffff"/>
          <!-- Eye Cutouts -->
          <rect x="22" y="24" width="4" height="6" fill="#15803d"/>
          <rect x="38" y="24" width="4" height="6" fill="#15803d"/>
        </svg>
      </div>
      <div class="channel-label-box">
        <span class="channel-label-text">Alien Attack</span>
      </div>
    </div>
  `,

  shootingRange: `
    <div class="channel-card-body bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#38bdf8]">
      <div class="tile-specular-glare"></div>
      <div class="channel-icon-cluster">
        <svg viewBox="0 0 64 64" class="channel-svg-icon" fill="none" stroke="#ffffff" stroke-width="3">
          <!-- Concentric Target Rings -->
          <circle cx="32" cy="32" r="23" stroke="#ffffff" stroke-width="3.2"/>
          <circle cx="32" cy="32" r="15" stroke="#ffffff" stroke-width="2.6" fill="rgba(255,255,255,0.2)"/>
          <circle cx="32" cy="32" r="7.5" fill="#ffffff"/>
          <!-- Precision Crosshairs -->
          <path d="M32 4 V10 M32 54 V60 M4 32 H10 M54 32 H60" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="channel-label-box">
        <span class="channel-label-text">Shooting Range</span>
      </div>
    </div>
  `,

  sketch: `
    <div class="channel-card-body bg-gradient-to-br from-[#7e22ce] via-[#a855f7] to-[#ec4899]">
      <div class="tile-specular-glare"></div>
      <div class="channel-icon-cluster">
        <svg viewBox="0 0 64 64" class="channel-svg-icon" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round">
          <!-- Artist Palette Contour -->
          <path d="M32 9 C18 9 10 19 10 32 C10 45 19 53 29 53 C33 53 35 50 35 47 C35 44 34 42 36 40 C38 38 41 38 44 38 C50 38 54 34 54 28 C54 18 44 9 32 9 Z" fill="#ffffff"/>
          <!-- Palette Thumbhole Cutout -->
          <circle cx="42" cy="27" r="3.6" fill="#7e22ce"/>
          <!-- Color Paint Dabs -->
          <circle cx="21" cy="23" r="2.8" fill="#ec4899"/>
          <circle cx="28" cy="17" r="2.8" fill="#facc15"/>
          <circle cx="37" cy="18" r="2.8" fill="#38bdf8"/>
          <circle cx="20" cy="33" r="2.8" fill="#22c55e"/>
        </svg>
      </div>
      <div class="channel-label-box">
        <span class="channel-label-text">Sketch</span>
      </div>
    </div>
  `,

  ghostTile: `
    <div class="channel-card-body ghost-tile-body">
      <div class="ghost-specular-glare"></div>
    </div>
  `
};
