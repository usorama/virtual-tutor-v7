/**
 * Session & Transcript Type Definitions
 * Following 2025 TypeScript best practices - eliminating 'any' types
 * Based on research: Context7 + Web Search + Existing patterns
 */

export interface SessionMetrics {
  duration: number;
  interactionCount: number;
  responseLatency: number;
  audioQuality: number;
  transcriptAccuracy: number;
}

export interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: number;
  speaker: 'student' | 'tutor';
  confidence?: number;
  mathContent?: boolean;
}

export interface SessionEvent {
  type: 'start' | 'end' | 'error' | 'transcript';
  timestamp: number;
  data?: unknown;
}

export interface VoiceSession {
  id: string;
  studentId: string;
  topic: string;
  startTime: number;
  endTime?: number;
  metrics?: SessionMetrics;
  transcripts: TranscriptEntry[];
}

export interface VoiceSessionMetrics extends SessionMetrics {
  sessionId: string;
  totalDuration: number;
  wordsPerMinute?: number;
}