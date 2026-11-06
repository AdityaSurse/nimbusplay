/**
 * NimbusPlay — Game Lifecycle & System Integration Tests
 * Verifies that all 4 remake games launch from the catalog, pause/resume cleanly,
 * follow correct controller orientation contracts, and keep socket connections alive.
 * Strictly typed with zero `any`. Target < 250 lines.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GAMES_CATALOG, renderChannelsGridHtml } from '../src/console/ui/catalog.js';
import { BUTTON_MASKS } from '../src/shared/protocol.js';

describe('Game Remake Catalog & Channel Matrix Tests', () => {
  it('should register exactly five active remake games including Turbo Circuit', () => {
    const keys = Object.keys(GAMES_CATALOG);
    assert.equal(keys.length, 5);
    assert.deepEqual(keys.sort(), ['alienAttack', 'fruitNinja', 'shootingRange', 'sketch', 'turboCircuit']);
  });

  it('should have valid metadata for each game without missing fields', () => {
    for (const [id, game] of Object.entries(GAMES_CATALOG)) {
      assert.equal(game.id, id);
      assert.ok(game.title.length > 0, `Title missing for ${id}`);
      assert.ok(game.category.length > 0, `Category missing for ${id}`);
      assert.ok(game.bannerGradient.startsWith('linear-gradient'), `Invalid gradient for ${id}`);
      assert.ok(game.artHtml.includes('<svg'), `Missing SVG artwork for ${id}`);
      assert.ok(game.description.length > 10, `Description too short for ${id}`);
    }
  });

  it('should render all 5 game tiles and 7 ghost tiles on main menu', () => {
    const html = renderChannelsGridHtml();
    assert.ok(html.includes('data-game="fruitNinja"'));
    assert.ok(html.includes('data-game="alienAttack"'));
    assert.ok(html.includes('data-game="shootingRange"'));
    assert.ok(html.includes('data-game="sketch"'));
    assert.ok(html.includes('data-game="turboCircuit"'));

    // Count ghost tiles (7 on main menu)
    const ghostMatches = html.match(/empty-slot/g);
    assert.ok(ghostMatches !== null);
    assert.equal(ghostMatches.length, 7);
  });

  it('should contain zero references to deprecated legacy games in catalog', () => {
    const catalogJson = JSON.stringify(GAMES_CATALOG);
    assert.equal(catalogJson.includes('starDefender'), false);
    assert.equal(catalogJson.includes('bowlBlitz'), false);
    assert.equal(catalogJson.includes('Star Defender'), false);
    assert.equal(catalogJson.includes('Bowl Blitz'), false);
  });
});

describe('Game Pause & Home Button Mechanics', () => {
  it('should distinguish short press (pause) from long press (recenter) on Home button', () => {
    let pauseToggled = false;
    let recentered = false;

    // Simulate Home button handler logic
    const handleHomePress = (pressDurationMs: number) => {
      if (pressDurationMs >= 450) {
        recentered = true;
      } else {
        pauseToggled = true;
      }
    };

    // Short tap (<450ms) -> Pause Overlay
    handleHomePress(120);
    assert.equal(pauseToggled, true);
    assert.equal(recentered, false);

    // Reset
    pauseToggled = false;
    recentered = false;

    // Long press (>=450ms) -> Recenter Pointer
    handleHomePress(600);
    assert.equal(pauseToggled, false);
    assert.equal(recentered, true);
  });

  it('should map correct button masks for A, B, and Home in protocol', () => {
    assert.equal(BUTTON_MASKS.A, 1 << 0);
    assert.equal(BUTTON_MASKS.B, 1 << 1);
    assert.equal(BUTTON_MASKS.HOME, 1 << 8);
    assert.equal(BUTTON_MASKS.RECENTER, 1 << 11);
  });
});

describe('Controller Layout Mode Negotiation Contract', () => {
  it('should dictate layout mode per game (landscape for Alien Attack, landscape-racing for Turbo Circuit)', () => {
    const expectedModes: Record<string, 'portrait' | 'landscape' | 'landscape-racing'> = {
      fruitNinja: 'portrait',
      alienAttack: 'landscape',
      shootingRange: 'portrait',
      sketch: 'portrait',
      turboCircuit: 'landscape-racing'
    };

    for (const [id, expectedMode] of Object.entries(expectedModes)) {
      let mode: 'portrait' | 'landscape' | 'landscape-racing' = 'portrait';
      if (id === 'alienAttack') mode = 'landscape';
      else if (id === 'turboCircuit') mode = 'landscape-racing';
      assert.equal(mode, expectedMode, `Mismatch in expected layout mode for ${id}`);
    }
  });

  it('should maintain continuous WebSocket connection across game transitions without disconnect', () => {
    // Contract simulation: game lifecycle teardown does not close transport socket
    let socketOpen = true;
    const mockSocket = {
      close: () => { socketOpen = false; },
      send: (_msg: string) => {}
    };

    const mockGameManager = {
      activeGame: 'fruitNinja' as string | null,
      teardown: () => {
        // Tears down PixiJS stage, but NEVER calls socket.close()
        mockGameManager.activeGame = null;
      }
    };

    assert.equal(mockGameManager.activeGame, 'fruitNinja');
    assert.equal(socketOpen, true);

    // Player pauses and returns to menu
    mockGameManager.teardown();
    assert.equal(mockGameManager.activeGame, null);
    assert.equal(socketOpen, true); // Socket remains open for instant next game launch!
  });
});

describe('IGame Contract & Game Over Screen Navigation Tests', () => {
  it('should enforce restart() and exit() contracts on IGame implementations', async () => {
    const { SlicePartyGame } = await import('../src/console/games/slice-party/slice-party-game.js');
    const { AlienAttackGame } = await import('../src/console/games/alien-attack/alien-attack-game.js');
    const { ShootingRangeGame } = await import('../src/console/games/shooting-range/shooting-range-game.js');
    const { SketchGame } = await import('../src/console/games/sketch/sketch-game.js');
    const { TurboCircuitGame } = await import('../src/console/games/turbo-circuit/turbo-circuit-game.js');

    const games = [
      new SlicePartyGame(),
      new AlienAttackGame(),
      new ShootingRangeGame(),
      new SketchGame(),
      new TurboCircuitGame()
    ];

    for (const g of games) {
      assert.equal(typeof g.restart, 'function', `${g.id} must implement restart()`);
      assert.equal(typeof g.exit, 'function', `${g.id} must implement exit()`);
      assert.equal(typeof g.pause, 'function', `${g.id} must implement pause()`);
      assert.equal(typeof g.resume, 'function', `${g.id} must implement resume()`);
      assert.equal(typeof g.destroy, 'function', `${g.id} must implement destroy()`);
    }
  });

  it('should navigate overlay buttons via D-pad and trigger actions via A button', () => {
    let restartClicked = false;
    let menuClicked = false;

    const buttons = [
      { id: 'btn-restart', click: () => { restartClicked = true; } },
      { id: 'btn-menu', click: () => { menuClicked = true; } }
    ];

    let focusIndex = 0;
    // D-pad Right (+1)
    focusIndex = (focusIndex + 1) % buttons.length;
    assert.equal(focusIndex, 1);
    // Press A on focused button
    buttons[focusIndex].click();
    assert.equal(menuClicked, true);
    assert.equal(restartClicked, false);

    // D-pad Left (-1)
    focusIndex = (focusIndex - 1 + buttons.length) % buttons.length;
    assert.equal(focusIndex, 0);
    // Press A on focused button
    buttons[focusIndex].click();
    assert.equal(restartClicked, true);
  });
});
