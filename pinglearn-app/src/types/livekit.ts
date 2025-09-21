/**
 * LiveKit Type Definitions
 * Following 2025 TypeScript best practices - eliminating 'any' types
 * Based on research: Context7 + Web Search + LiveKit patterns
 */

export interface ConnectionQuality {
  level: 'excellent' | 'good' | 'poor' | 'unknown';
  score: number;
  upstream: number;
  downstream: number;
}

export interface DisconnectionReason {
  code: number;
  reason: string;
  wasClean: boolean;
}

export interface AudioStats {
  type: string;
  kind: string;
  bytesReceived: number;
  bytesSent: number;
  packetsLost: number;
  packetsSent: number;
  latency: number;
  jitter: number;
  roundTripTime?: number;
  timestamp: number;
}

export interface LiveKitParticipant {
  id: string;
  identity: string;
  name?: string;
  metadata?: string;
  connectionQuality: ConnectionQuality;
}