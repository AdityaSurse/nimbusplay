/**
 * NimbusPlay — P2P WebRTC DataChannel Transport
 * High-speed, unordered, unchoked (maxRetransmits: 0) UDP-like transport
 * for low-latency motion sensor frames with automatic fallback.
 * Strictly typed with zero `any`. Target < 200 lines.
 */

import type { WebRtcSignalMessage } from './protocol.js';

export interface WebRtcCallbacks {
  sendSignal: (signal: WebRtcSignalMessage['signal']) => void;
  onOpen: () => void;
  onClose: () => void;
  onMessage: (raw: string) => void;
  onError?: (err: unknown) => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export class NimbusDataChannelPeer {
  private role: 'controller' | 'console';
  private callbacks: WebRtcCallbacks;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private isClosed = false;

  constructor(role: 'controller' | 'console', callbacks: WebRtcCallbacks) {
    this.role = role;
    this.callbacks = callbacks;
  }

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.RTCPeerConnection !== 'undefined';
  }

  public async start(): Promise<void> {
    if (!NimbusDataChannelPeer.isSupported()) {
      return;
    }
    this.cleanup();
    this.isClosed = false;

    try {
      this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      this.pc.onicecandidate = (event) => {
        if (event.candidate && !this.isClosed) {
          this.callbacks.sendSignal({
            type: 'candidate',
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex
            }
          });
        }
      };

      this.pc.onconnectionstatechange = () => {
        if (this.pc?.connectionState === 'failed' || this.pc?.connectionState === 'closed') {
          this.callbacks.onClose();
        }
      };

      if (this.role === 'controller') {
        // Offerer: Controller initiates the DataChannel
        this.dc = this.pc.createDataChannel('nimbus-motion', {
          ordered: false,
          maxRetransmits: 0
        });
        this.bindDataChannel(this.dc);

        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.callbacks.sendSignal({
          type: 'offer',
          sdp: offer.sdp
        });
      } else {
        // Answerer: Console listens for incoming DataChannel
        this.pc.ondatachannel = (event) => {
          this.dc = event.channel;
          this.bindDataChannel(this.dc);
        };
      }
    } catch (err) {
      this.callbacks.onError?.(err);
      this.cleanup();
    }
  }

  public async handleSignal(signal: WebRtcSignalMessage['signal']): Promise<void> {
    if (!this.pc || this.isClosed) return;

    try {
      if (signal.type === 'offer' && signal.sdp) {
        await this.pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.callbacks.sendSignal({
          type: 'answer',
          sdp: answer.sdp
        });
      } else if (signal.type === 'answer' && signal.sdp) {
        await this.pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
      } else if (signal.type === 'candidate' && signal.candidate) {
        await this.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (err) {
      this.callbacks.onError?.(err);
    }
  }

  public send(rawString: string): boolean {
    if (this.dc && this.dc.readyState === 'open') {
      try {
        this.dc.send(rawString);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  public isOpen(): boolean {
    return this.dc !== null && this.dc.readyState === 'open';
  }

  public close(): void {
    this.cleanup();
  }

  private bindDataChannel(dc: RTCDataChannel): void {
    dc.onopen = () => {
      if (!this.isClosed) {
        this.callbacks.onOpen();
      }
    };

    dc.onclose = () => {
      this.callbacks.onClose();
    };

    dc.onerror = (e) => {
      this.callbacks.onError?.(e);
      this.callbacks.onClose();
    };

    dc.onmessage = (event: MessageEvent<string>) => {
      if (typeof event.data === 'string') {
        this.callbacks.onMessage(event.data);
      }
    };
  }

  private cleanup(): void {
    this.isClosed = true;
    if (this.dc) {
      try { this.dc.close(); } catch { /* ignore */ }
      this.dc = null;
    }
    if (this.pc) {
      try { this.pc.close(); } catch { /* ignore */ }
      this.pc = null;
    }
  }
}

