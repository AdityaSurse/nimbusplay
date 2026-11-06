import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SessionManager } from '../server/session.js';
import { isCompactPacket, type CompactMotionPacket, type NimbusNetworkMessage } from '../src/shared/protocol.js';

// Mock WebSocket implementation for unit testing relay session manager
class MockWebSocket {
  public readyState = 1; // WebSocket.OPEN
  public OPEN = 1;
  public sentMessages: string[] = [];

  public send(data: string): void {
    this.sentMessages.push(data);
  }

  public close(): void {
    this.readyState = 3; // WebSocket.CLOSED
  }
}

describe('Relay SessionManager & Room Protocol Unit Tests', () => {
  it('should generate a 4-character uppercase room code without confusing characters', () => {
    const manager = new SessionManager();
    const session = manager.createRoom();

    assert.equal(session.roomId.length, 4);
    assert.equal(session.roomId, session.roomId.toUpperCase());
    // Ensure confusing characters (0, O, 1, I) are excluded
    assert.match(session.roomId, /^[A-HJ-NP-Z2-9]{4}$/);
  });

  it('should accept a custom requested room ID in uppercase', () => {
    const manager = new SessionManager();
    const session = manager.createRoom('NP42');

    assert.equal(session.roomId, 'NP42');
    assert.equal(manager.getRoom('np42')?.roomId, 'NP42');
  });

  it('should allow console and controller to join room and track peer presence', () => {
    const manager = new SessionManager();
    const consoleWs = new MockWebSocket() as any;
    const controllerWs = new MockWebSocket() as any;

    // 1. Console creates/joins room
    const joinConsole = manager.joinRoom('TEST', 'console', consoleWs);
    assert.equal(joinConsole.session.roomId, 'TEST');
    assert.equal(joinConsole.peerConnected, false, 'Controller is not yet connected');

    // 2. Controller joins same room
    const joinController = manager.joinRoom('TEST', 'controller', controllerWs);
    assert.equal(joinController.session.roomId, 'TEST');
    assert.equal(joinController.peerConnected, true, 'Console is already present in room');

    // Verify room state
    const room = manager.getRoom('TEST');
    assert.ok(room !== undefined);
    assert.equal(room!.consoleSocket, consoleWs);
    assert.equal(room!.controllerSocket, controllerWs);
  });

  it('should notify remaining peer when one client disconnects and clean up when empty', () => {
    const manager = new SessionManager();
    const consoleWs = new MockWebSocket() as any;
    const controllerWs = new MockWebSocket() as any;

    manager.joinRoom('ROOM', 'console', consoleWs);
    manager.joinRoom('ROOM', 'controller', controllerWs);

    // Controller disconnects
    const dcResult = manager.handleDisconnect(controllerWs);
    assert.ok(dcResult !== null);
    assert.equal(dcResult!.roomId, 'ROOM');
    assert.equal(dcResult!.role, 'controller');
    assert.equal(dcResult!.remainingPeer, consoleWs);

    // Room still exists because console is still connected
    assert.ok(manager.getRoom('ROOM') !== undefined);

    // Console disconnects
    const consoleDc = manager.handleDisconnect(consoleWs);
    assert.ok(consoleDc !== null);
    assert.equal(consoleDc!.remainingPeer, null);

    // Room is deleted when both sockets disconnect
    assert.equal(manager.getRoom('ROOM'), undefined);
  });

  it('should clean up stale rooms with no sockets after timeout', () => {
    const manager = new SessionManager();
    const session = manager.createRoom('IDLE');
    session.lastActive = Date.now() - 60000; // 60s ago

    manager.cleanupStaleRooms(30000); // 30s threshold
    assert.equal(manager.getRoom('IDLE'), undefined);
  });
});

describe('Compact 60Hz Packet Fast-Path Validation Tests', () => {
  it('should recognize compact 60Hz motion packet', () => {
    const packet: CompactMotionPacket = {
      t: 'F',
      s: 42,
      ts: Date.now(),
      b: 1, // A pressed
      r: [-12.5, 3.2, 0.4],
      a: [0.1, 0.2, 9.8]
    };

    assert.equal(isCompactPacket(packet), true);
  });

  it('should reject non-compact verbose protocol messages', () => {
    const verbose: NimbusNetworkMessage = {
      type: 'JOIN_ROOM',
      seq: 1,
      timestamp: Date.now(),
      roomId: 'NP42',
      role: 'console'
    };

    assert.equal(isCompactPacket(verbose), false);
  });
});

