/**
 * NimbusPlay — WebSocket Protocol & Message Definitions
 * Zero `any` types, strictly typed protocol.
 */

export type ClientRole = 'console' | 'controller';

export const BUTTON_MASKS = {
  A: 1 << 0,          // 1
  B: 1 << 1,          // 2
  DPAD_UP: 1 << 2,    // 4
  DPAD_DOWN: 1 << 3,  // 8
  DPAD_LEFT: 1 << 4,  // 16
  DPAD_RIGHT: 1 << 5, // 32
  PLUS: 1 << 6,       // 64
  MINUS: 1 << 7,      // 128
  HOME: 1 << 8,       // 256
  BTN_1: 1 << 9,      // 512
  BTN_2: 1 << 10,     // 1024
  RECENTER: 1 << 11   // 2048
} as const;

export interface BaseMessage {
  type: string;
  seq: number;
  timestamp: number;
}

export interface JoinRoomRequest extends BaseMessage {
  type: 'JOIN_ROOM';
  role: ClientRole;
  roomId: string;
}

export interface JoinRoomAck extends BaseMessage {
  type: 'JOIN_ROOM_ACK';
  success: boolean;
  roomId: string;
  assignedRole: ClientRole;
  peerConnected: boolean;
  error?: string;
}

export interface PeerStatusUpdate extends BaseMessage {
  type: 'PEER_STATUS';
  peerRole: ClientRole;
  status: 'connected' | 'disconnected';
}

export interface PingMessage extends BaseMessage {
  type: 'PING';
}

export interface PongMessage extends BaseMessage {
  type: 'PONG';
  clientTimestamp: number;
}

export interface ControllerButtonState {
  a: boolean;
  b: boolean;
  dpadUp: boolean;
  dpadDown: boolean;
  dpadLeft: boolean;
  dpadRight: boolean;
  plus: boolean;
  minus: boolean;
  home: boolean;
  btn1: boolean;
  btn2: boolean;
  recenter?: boolean;
}

export interface RotationRateDegPerSec {
  alpha: number; // yaw
  beta: number;  // pitch
  gamma: number; // roll
}

export interface AccelerationMPerSec2 {
  x: number;
  y: number;
  z: number;
}

export interface MotionInputFrame extends BaseMessage {
  type: 'INPUT_FRAME';
  roomId: string;
  buttons: ControllerButtonState;
  rotationRate: RotationRateDegPerSec;
  acceleration: AccelerationMPerSec2;
  interval: number;
}

/**
 * High-performance compact frame packet (~80 bytes JSON)
 */
export interface CompactMotionPacket {
  t: 'F';
  s: number;                    // seq
  ts: number;                   // timestamp
  b: number;                    // button bitmask
  r: [number, number, number];  // [alpha, beta, gamma]
  a: [number, number, number];  // [x, y, z] accel with gravity
}

export interface RecenterCommand extends BaseMessage {
  type: 'COMMAND_RECENTER';
}

export interface HapticFeedbackCommand extends BaseMessage {
  type: 'COMMAND_HAPTIC';
  pattern: number[];
}

export type LayoutMode = 'portrait' | 'landscape' | 'landscape-racing';

export interface LayoutModeCommand extends BaseMessage {
  type: 'COMMAND_LAYOUT_MODE';
  mode: LayoutMode;
  gameId?: string;
}

export type StandardMessage =
  | JoinRoomRequest
  | JoinRoomAck
  | PeerStatusUpdate
  | PingMessage
  | PongMessage
  | MotionInputFrame
  | RecenterCommand
  | HapticFeedbackCommand
  | LayoutModeCommand;

export type NimbusNetworkMessage = StandardMessage | CompactMotionPacket;

export function isCompactPacket(msg: unknown): msg is CompactMotionPacket {
  return typeof msg === 'object' && msg !== null && (msg as { t?: unknown }).t === 'F';
}

let sequenceCounter = 0;

export function createMessage<T extends BaseMessage>(payload: Omit<T, 'seq' | 'timestamp'>): T {
  return {
    ...payload,
    seq: ++sequenceCounter,
    timestamp: Date.now()
  } as T;
}
