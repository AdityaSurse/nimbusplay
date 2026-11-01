import { WebSocketServer, WebSocket } from 'ws';
import { SessionManager } from './session.js';
import { RELAY_INTERNAL_PORT, WS_PATH } from '../src/shared/constants.js';
import type { 
  NimbusNetworkMessage, 
  JoinRoomRequest, 
  JoinRoomAck, 
  PeerStatusUpdate, 
  PongMessage 
} from '../src/shared/protocol.js';

const port = Number(process.env.RELAY_PORT) || RELAY_INTERNAL_PORT;
const wss = new WebSocketServer({ port });
const sessions = new SessionManager();

console.log(`[Relay] Internal WebSocket Relay listening on ws://127.0.0.1:${port}${WS_PATH}`);

wss.on('connection', (ws: WebSocket) => {
  let boundRoomId: string | null = null;
  let boundRole: 'console' | 'controller' | null = null;

  ws.on('message', (data: Buffer | string) => {
    try {
      const message = JSON.parse(data.toString()) as NimbusNetworkMessage;

      switch (message.type) {
        case 'JOIN_ROOM': {
          const req = message as JoinRoomRequest;
          const { session, peerConnected } = sessions.joinRoom(req.roomId, req.role, ws);
          boundRoomId = session.roomId;
          boundRole = req.role;

          const ack: JoinRoomAck = {
            type: 'JOIN_ROOM_ACK',
            seq: message.seq + 1,
            timestamp: Date.now(),
            success: true,
            roomId: session.roomId,
            assignedRole: req.role,
            peerConnected
          };
          ws.send(JSON.stringify(ack));

          console.log(`[Relay] Client joined room ${session.roomId} as ${req.role}. Peer connected: ${peerConnected}`);

          // Notify peer if present
          const peer = req.role === 'console' ? session.controllerSocket : session.consoleSocket;
          if (peer && peer.readyState === WebSocket.OPEN) {
            const peerUpdate: PeerStatusUpdate = {
              type: 'PEER_STATUS',
              seq: Date.now(),
              timestamp: Date.now(),
              peerRole: req.role,
              status: 'connected'
            };
            peer.send(JSON.stringify(peerUpdate));
          }
          break;
        }

        case 'PING': {
          const pong: PongMessage = {
            type: 'PONG',
            seq: message.seq + 1,
            timestamp: Date.now(),
            clientTimestamp: message.timestamp
          };
          ws.send(JSON.stringify(pong));
          break;
        }

        case 'INPUT_FRAME':
        case 'COMMAND_RECENTER': {
          if (!boundRoomId) return;
          const session = sessions.getRoom(boundRoomId);
          if (session?.consoleSocket && session.consoleSocket.readyState === WebSocket.OPEN) {
            session.consoleSocket.send(data.toString());
          }
          break;
        }

        case 'COMMAND_HAPTIC': {
          if (!boundRoomId) return;
          const session = sessions.getRoom(boundRoomId);
          if (session?.controllerSocket && session.controllerSocket.readyState === WebSocket.OPEN) {
            session.controllerSocket.send(data.toString());
          }
          break;
        }

        default: {
          // Forward any other message to peer in room
          if (!boundRoomId) return;
          const session = sessions.getRoom(boundRoomId);
          if (!session) return;
          const peer = boundRole === 'console' ? session.controllerSocket : session.consoleSocket;
          if (peer && peer.readyState === WebSocket.OPEN) {
            peer.send(data.toString());
          }
          break;
        }
      }
    } catch (err) {
      console.error('[Relay] Failed to parse inbound packet:', err);
    }
  });

  ws.on('close', () => {
    const disconnected = sessions.handleDisconnect(ws);
    if (disconnected) {
      console.log(`[Relay] Client disconnected from room ${disconnected.roomId} (${disconnected.role})`);
      if (disconnected.remainingPeer && disconnected.remainingPeer.readyState === WebSocket.OPEN) {
        const update: PeerStatusUpdate = {
          type: 'PEER_STATUS',
          seq: Date.now(),
          timestamp: Date.now(),
          peerRole: disconnected.role,
          status: 'disconnected'
        };
        disconnected.remainingPeer.send(JSON.stringify(update));
      }
    }
  });

  ws.on('error', (err) => {
    console.error('[Relay] Socket error:', err.message);
  });
});

setInterval(() => {
  sessions.cleanupStaleRooms(60000);
}, 30000);

