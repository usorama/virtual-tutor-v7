/**
 * ARCH-007: API Versioning - V1 Session Types
 *
 * Session management endpoint types for V1 API (deprecated)
 * Sunset Date: 2026-12-31
 */

/**
 * V1 Session Start Response
 *
 * @deprecated Use V2 SessionStartResponseV2 instead
 */
export interface SessionStartResponseV1 {
  success: true;
  message: string;
}

/**
 * Session start request body (same across v1 and v2)
 */
export interface SessionStartRequest {
  sessionId: string;
  roomName: string;
  studentId: string;
  topic?: string;
}

/**
 * V1 Session Metrics Response
 *
 * @deprecated Use V2 SessionMetricsResponseV2 instead
 */
export interface SessionMetricsResponseV1 {
  success: true;
  metrics: {
    duration: number;
    messageCount: number;
    errorCount: number;
  };
}
