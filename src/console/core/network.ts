import { 
  HEARTBEAT_INTERVAL_MS, 
  RECONNECT_DELAY_MS, 
  MAX_RECONNECT_ATTEMPTS 
} from '../../shared/constants.js';
import { 
  isCompactPacket,
  type NimbusNetworkMessage, 
  type JoinRoomRequest, 
  type JoinRoomAck, 
  type PeerStatusUpdate, 
  type PingMessage, 
  type PongMessage 
} from '../../shared/protocol.js';

export type NetworkStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface ConsoleNetworkCallbacks {
  onStatusChange: (status: NetworkStatus, info?: string) => void;
  onPeerStatus: (connected: boolean) => void;
  onRoomJoined: (roomId: string) => void;
  onMessage: (message: NimbusNetworkMessage) => void;
  onLatencyUpdate: (rttMs: number) => void;
}

export class ConsoleNetworkClient {
  private socket: WebSocket | null = null;
  private wsUrl: string;
  private targetRoomId: string;
  private callbacks: ConsoleNetworkCallbacks;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isExplicitlyClosed = false;

  constructor(wsUrl: string, targetRoomId: string, callbacks: ConsoleNetworkCallbacks) {
    this.wsUrl = wsUrl;
    this.targetRoomId = targetRoomId;
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
        console.error('[ConsoleNet] Error parsing message:', err);
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
      console.warn('[ConsoleNet] WebSocket error:', err);
    };
  }

  public send(msg: NimbusNetworkMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
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
    this.callbacks.onStatusChange('disconnected', 'Explicitly closed');
  }

  private sendJoinRoom(): void {
    const req: JoinRoomRequest = {
      type: 'JOIN_ROOM',
      seq: 1,
      timestamp: Date.now(),
      role: 'console',
      roomId: this.targetRoomId
    };
    this.send(req);
  }

  private handleMessage(msg: NimbusNetworkMessage): void {
    if (isCompactPacket(msg)) {
      this.callbacks.onMessage(msg);
      return;
    }

    switch (msg.type) {
      case 'JOIN_ROOM_ACK': {
        const ack = msg as JoinRoomAck;
        if (ack.success) {
          this.targetRoomId = ack.roomId;
          this.callbacks.onRoomJoined(ack.roomId);
          this.callbacks.onPeerStatus(ack.peerConnected);
        }
        break;
      }

      case 'PEER_STATUS': {
        const status = msg as PeerStatusUpdate;
        this.callbacks.onPeerStatus(status.status === 'connected');
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

