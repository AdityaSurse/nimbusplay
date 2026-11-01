import { 
  HEARTBEAT_INTERVAL_MS, 
  RECONNECT_DELAY_MS, 
  MAX_RECONNECT_ATTEMPTS 
} from '../shared/constants.js';
import type { 
  NimbusNetworkMessage, 
  JoinRoomRequest, 
  JoinRoomAck, 
  PeerStatusUpdate, 
  PingMessage, 
  PongMessage 
} from '../shared/protocol.js';

export type ControllerNetworkStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface ControllerNetworkCallbacks {
  onStatusChange: (status: ControllerNetworkStatus, details?: string) => void;
  onRoomJoined: (roomId: string, peerConnected: boolean) => void;
  onConsoleStatus: (connected: boolean) => void;
  onMessage: (message: NimbusNetworkMessage) => void;
  onLatencyUpdate: (rttMs: number) => void;
}

export class ControllerNetworkClient {
  private socket: WebSocket | null = null;
  private wsUrl: string;
  private roomId: string;
  private callbacks: ControllerNetworkCallbacks;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isExplicitlyClosed = false;

  constructor(wsUrl: string, roomId: string, callbacks: ControllerNetworkCallbacks) {
    this.wsUrl = wsUrl;
    this.roomId = roomId;
    this.callbacks = callbacks;
  }

  public connect(): void {
    this.isExplicitlyClosed = false;
    this.callbacks.onStatusChange('connecting');

    try {
      this.socket = new WebSocket(this.wsUrl);
    } catch (err) {
      this.callbacks.onStatusChange('disconnected', err instanceof Error ? err.message : String(err));
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.callbacks.onStatusChange('connected');
      this.sendJoinRoom();
      this.startHeartbeat();
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as NimbusNetworkMessage;
        this.handleMessage(message);
      } catch (err) {
        console.error('[CtrlNet] Error parsing inbound packet:', err);
      }
    };

    this.socket.onclose = () => {
      this.stopHeartbeat();
      this.callbacks.onStatusChange('disconnected');
      if (!this.isExplicitlyClosed) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (err) => {
      console.warn('[CtrlNet] Socket error:', err);
    };
  }

  public send(msg: NimbusNetworkMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    }
  }

  public setRoomId(roomId: string): void {
    this.roomId = roomId;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendJoinRoom();
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.callbacks.onStatusChange('disconnected', 'Explicitly disconnected');
  }

  private sendJoinRoom(): void {
    const req: JoinRoomRequest = {
      type: 'JOIN_ROOM',
      seq: 1,
      timestamp: Date.now(),
      role: 'controller',
      roomId: this.roomId
    };
    this.send(req);
  }

  private handleMessage(msg: NimbusNetworkMessage): void {
    switch (msg.type) {
      case 'JOIN_ROOM_ACK': {
        const ack = msg as JoinRoomAck;
        if (ack.success) {
          this.callbacks.onRoomJoined(ack.roomId, ack.peerConnected);
        }
        break;
      }

      case 'PEER_STATUS': {
        const status = msg as PeerStatusUpdate;
        this.callbacks.onConsoleStatus(status.status === 'connected');
        break;
      }

      case 'PONG': {
        const pong = msg as PongMessage;
        const rtt = Date.now() - pong.clientTimestamp;
        this.callbacks.onLatencyUpdate(rtt);
        break;
      }

      default: {
        this.callbacks.onMessage(msg);
        break;
      }
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const ping: PingMessage = {
          type: 'PING',
          seq: Date.now(),
          timestamp: Date.now()
        };
        this.send(ping);
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.callbacks.onStatusChange('disconnected', 'Max reconnect attempts exceeded');
      return;
    }

    this.reconnectAttempts++;
    this.callbacks.onStatusChange('reconnecting', `Attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, RECONNECT_DELAY_MS);
  }
}

