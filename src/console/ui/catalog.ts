/**
 * NimbusPlay — Games Catalog & Channel Grid View
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
  sliceParty: {
    id: 'sliceParty',
    title: 'Slice Party',
    category: 'Party / Motion Action',
    rating: 'E (Everyone)',
    revision: 'Rev 1.02',
    bannerGradient: 'linear-gradient(135deg, #ffe6b3 0%, #ffedd5 50%, #d6f4ff 100%)',
    description: 'Fling, flick, and slice flying exotic melons, citrus wheels, and berries with precision wand slashing. Watch out for volatile party bombs!',
    artHtml: CHANNEL_ART.sliceParty
  },
  starDefender: {
    id: 'starDefender',
    title: 'Star Defender',
    category: 'Arcade / Aim & Shoot',
    rating: 'E (Everyone)',
    revision: 'Rev 1.00',
    bannerGradient: 'linear-gradient(180deg, #1b2b3a 0%, #101b24 60%, #080d12 100%)',
    description: 'Aim crosshairs at invading alien fighter fleets with the pointer and unleash rapid laser salvos with the B trigger to defend the orbital ring.',
    artHtml: CHANNEL_ART.starDefender
  },
  bowlBlitz: {
    id: 'bowlBlitz',
    title: 'Bowl Blitz',
    category: 'Sports / Motion Bowling',
    rating: 'E (Everyone)',
    revision: 'Rev 1.05',
    bannerGradient: 'linear-gradient(135deg, #e3efff 0%, #cce0f5 50%, #b3cde3 100%)',
    description: 'Hold B, swing your arm forward and release at peak acceleration. Add wrist spin to curve the bowling ball directly into the pocket for a strike!',
    artHtml: CHANNEL_ART.bowlBlitz
  }
};

export function renderChannelsGridHtml(): string {
  return `
    <!-- Slot 1: Slice Party -->
    <div class="channel-tile group" data-action="launch" data-game="sliceParty">
      <div class="tile-specular-glare"></div>
      ${CHANNEL_ART.sliceParty}
      <div class="tile-bottom-banner"><span class="tile-bottom-text">Disc Channel</span></div>
    </div>

    <!-- Slot 2: Star Defender -->
    <div class="channel-tile group" data-action="launch" data-game="starDefender">
      <div class="tile-specular-glare"></div>
      ${CHANNEL_ART.starDefender}
      <div class="tile-bottom-banner"><span class="tile-bottom-text">Arcade</span></div>
    </div>

    <!-- Slot 3: Bowl Blitz -->
    <div class="channel-tile group" data-action="launch" data-game="bowlBlitz">
      <div class="tile-specular-glare"></div>
      ${CHANNEL_ART.bowlBlitz}
      <div class="tile-bottom-banner"><span class="tile-bottom-text">Sports Hub</span></div>
    </div>

    <!-- Slot 4: Settings -->
    <div class="channel-tile group" data-action="settings">
      <div class="tile-specular-glare"></div>
      ${CHANNEL_ART.settings}
      <div class="tile-bottom-banner"><span class="tile-bottom-text">System v3.4</span></div>
    </div>

    <!-- Slot 5: Controller Sync -->
    <div class="channel-tile group" data-action="pairing">
      <div class="tile-specular-glare"></div>
      ${CHANNEL_ART.controllerSync}
      <div class="tile-bottom-banner"><span class="tile-bottom-text">Wireless Link</span></div>
    </div>

    <!-- Slot 6: Pointer Tuning -->
    <div class="channel-tile group" data-action="calibration">
      <div class="tile-specular-glare"></div>
      ${CHANNEL_ART.calibration}
      <div class="tile-bottom-banner"><span class="tile-bottom-text">Sensor Bar</span></div>
    </div>

    <!-- Slots 7 to 12: Empty Slots -->
    ${Array.from({ length: 6 }).map((_, i) => `
      <div class="channel-tile empty-slot group" data-slot="${i + 7}">
        <div class="tile-specular-glare"></div>
        ${CHANNEL_ART.emptySlot}
      </div>
    `).join('')}
  `;
}

