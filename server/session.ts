import type { WebSocket } from 'ws';
import type { ClientRole } from '../src/shared/protocol.js';

export interface RoomSession {
  roomId: string;
  consoleSocket: WebSocket | null;
  controllerSocket: WebSocket | null;
  createdAt: number;
  lastActive: number;
}

export class SessionManager {
  private rooms = new Map<string, RoomSession>();

  public createRoom(requestedId?: string): RoomSession {
    const roomId = requestedId && requestedId !== 'AUTO' 
      ? requestedId.toUpperCase() 
      : this.generateUniqueRoomCode();

    const session: RoomSession = {
      roomId,
      consoleSocket: null,
      controllerSocket: null,
      createdAt: Date.now(),
      lastActive: Date.now()
    };

    this.rooms.set(roomId, session);
    return session;
  }

  public getRoom(roomId: string): RoomSession | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  public joinRoom(roomId: string, role: ClientRole, socket: WebSocket): { session: RoomSession; peerConnected: boolean } {
    let session = this.getRoom(roomId);
    if (!session) {
      session = this.createRoom(roomId);
    }

    session.lastActive = Date.now();

    if (role === 'console') {
      session.consoleSocket = socket;
    } else {
      session.controllerSocket = socket;
    }

    const peerConnected = role === 'console' 
      ? Boolean(session.controllerSocket && session.controllerSocket.readyState === socket.OPEN)
      : Boolean(session.consoleSocket && session.consoleSocket.readyState === socket.OPEN);

    return { session, peerConnected };
  }

  public handleDisconnect(socket: WebSocket): { roomId: string; role: ClientRole; remainingPeer: WebSocket | null } | null {
    for (const [roomId, session] of this.rooms.entries()) {
      if (session.consoleSocket === socket) {
        session.consoleSocket = null;
        if (!session.controllerSocket) {
          this.rooms.delete(roomId);
        }
        return { roomId, role: 'console', remainingPeer: session.controllerSocket };
      }
      if (session.controllerSocket === socket) {
        session.controllerSocket = null;
        if (!session.consoleSocket) {
          this.rooms.delete(roomId);
        }
        return { roomId, role: 'controller', remainingPeer: session.consoleSocket };
      }
    }
    return null;
  }

  public cleanupStaleRooms(timeoutMs: number): void {
    const now = Date.now();
    for (const [roomId, session] of this.rooms.entries()) {
      if (!session.consoleSocket && !session.controllerSocket && (now - session.lastActive > timeoutMs)) {
        this.rooms.delete(roomId);
      }
    }
  }

  private generateUniqueRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like O, 0, 1, I
    let code = '';
    for (let attempts = 0; attempts < 1000; attempts++) {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (!this.rooms.has(code)) {
        return code;
      }
    }
    return code;
  }
}

