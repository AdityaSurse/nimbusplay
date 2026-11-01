/**
 * NimbusPlay — WebSocket Protocol & Message Definitions
 * Zero `any` types, strictly typed protocol.
 */

export type ClientRole = 'console' | 'controller';

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

export interface RecenterCommand extends BaseMessage {
  type: 'COMMAND_RECENTER';
}

export interface HapticFeedbackCommand extends BaseMessage {
  type: 'COMMAND_HAPTIC';
  pattern: number[];
}

export type NimbusNetworkMessage =
  | JoinRoomRequest
  | JoinRoomAck
  | PeerStatusUpdate
  | PingMessage
  | PongMessage
  | MotionInputFrame
  | RecenterCommand
  | HapticFeedbackCommand;

let sequenceCounter = 0;

export function createMessage<T extends BaseMessage>(payload: Omit<T, 'seq' | 'timestamp'>): T {
  return {
    ...payload,
    seq: ++sequenceCounter,
    timestamp: Date.now()
  } as T;
}

