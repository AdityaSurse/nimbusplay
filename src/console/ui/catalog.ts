/**
 * NimbusPlay — Games Catalog & Channel Grid View
 * Matches reference monitor layout: 4 top-row game tiles + 8 faint ghost tiles.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { CHANNEL_ART } from './artwork.js';

export interface GameMetadata {
  id: string;
  title: string;
  category: string;
  rating: string;
  revision: string;
  bannerGradient: string;
  description: string;
  artHtml: string;
}

export const GAMES_CATALOG: Record<string, GameMetadata> = {
  fruitNinja: {
    id: 'fruitNinja',
    title: 'Fruit Ninja',
    category: 'Action / Slice Arcade',
    rating: 'E (Everyone)',
    revision: 'Rev 1.00',
    bannerGradient: 'linear-gradient(145deg, #ea580c 0%, #f59e0b 60%, #facc15 100%)',
    description: 'Slash flying watermelons, citrus wheels, and berries with fast wand sweeps! Slice multi-fruit combos for bonus points, but beware of party bombs.',
    artHtml: CHANNEL_ART.fruitNinja
  },
  alienAttack: {
    id: 'alienAttack',
    title: 'Alien Attack',
    category: 'Arcade / 3D Rail Shooter',
    rating: 'E (Everyone)',
    revision: 'Rev 1.00',
    bannerGradient: 'linear-gradient(145deg, #15803d 0%, #16a34a 50%, #4ade80 100%)',
    description: 'Pilot your delta starship through cosmic nebulae into deep space! Steer with horizontal phone tilt and blast descending alien saucers with dual plasma lasers.',
    artHtml: CHANNEL_ART.alienAttack
  },
  shootingRange: {
    id: 'shootingRange',
    title: 'Shooting Range',
    category: 'Carnival / Precision Target',
    rating: 'E (Everyone)',
    revision: 'Rev 1.00',
    bannerGradient: 'linear-gradient(145deg, #1d4ed8 0%, #2563eb 50%, #38bdf8 100%)',
    description: 'Aim your wand pointer at pop-up bullseye targets across sunny carnival hills! Tap A for hitscan shots and rack up high scores against the clock.',
    artHtml: CHANNEL_ART.shootingRange
  },
  sketch: {
    id: 'sketch',
    title: 'Sketch',
    category: 'Creative / Digital Easel',
    rating: 'E (Everyone)',
    revision: 'Rev 1.00',
    bannerGradient: 'linear-gradient(145deg, #7e22ce 0%, #a855f7 50%, #ec4899 100%)',
    description: 'An interactive drawing canvas! Pick vibrant ink colors from the palette and paint smooth vector curves by holding the A button.',
    artHtml: CHANNEL_ART.sketch
  },
  turboCircuit: {
    id: 'turboCircuit',
    title: 'Turbo Circuit',
    category: 'Racing / 3D Arcade Kart',
    rating: 'E (Everyone)',
    revision: 'Rev 1.00',
    bannerGradient: 'linear-gradient(145deg, #ef4444 0%, #f97316 50%, #0d9488 100%)',
    description: 'High-octane 3D kart racing! Steer with horizontal phone tilt, drift through stadium hairpins with mini-turbo sparks, and rocket across the finish line.',
    artHtml: CHANNEL_ART.turboCircuit
  }
};

export function renderChannelsGridHtml(page = 0): string {
  if (page === 1) {
    // Page 2: Turbo Circuit in slot 1 + 11 ghost tiles
    return `
      <div class="channel-tile game-tile group" data-action="launch" data-game="turboCircuit" data-slot="1">
        ${CHANNEL_ART.turboCircuit}
      </div>
      ${Array.from({ length: 11 }).map((_, i) => `
        <div class="channel-tile ghost-tile empty-slot group" data-slot="${i + 2}">
          ${CHANNEL_ART.ghostTile}
        </div>
      `).join('')}
    `;
  }

  // Page 0: Exactly matches reference photo
  // Top Row: 4 colorful tiles (Fruit Ninja, Alien Attack, Shooting Range, Sketch)
  // Rows 2 & 3: 8 faint empty ghost tiles
  return `
    <div class="channel-tile game-tile group" data-action="launch" data-game="fruitNinja" data-slot="1">
      ${CHANNEL_ART.fruitNinja}
    </div>

    <div class="channel-tile game-tile group" data-action="launch" data-game="alienAttack" data-slot="2">
      ${CHANNEL_ART.alienAttack}
    </div>

    <div class="channel-tile game-tile group" data-action="launch" data-game="shootingRange" data-slot="3">
      ${CHANNEL_ART.shootingRange}
    </div>

    <div class="channel-tile game-tile group" data-action="launch" data-game="sketch" data-slot="4">
      ${CHANNEL_ART.sketch}
    </div>

    ${Array.from({ length: 8 }).map((_, i) => `
      <div class="channel-tile ghost-tile empty-slot group" data-slot="${i + 5}">
        ${CHANNEL_ART.ghostTile}
      </div>
    `).join('')}
  `;
}
