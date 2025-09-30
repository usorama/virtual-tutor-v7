/**
 * ARCH-007: API Versioning - V2 Session Types
 *
 * Session management endpoint types for V2 API (current version)
 */

/**
 * V2 Session Start Response Data
 *
 * Breaking change from V1:
 * - More structured response with session details
 * - Wrapped in ApiResponse<SessionStartResponseV2>
 */
export interface SessionStartResponseV2 {
  message: string;
  sessionId: string;
  roomName: string;
  startedAt: string; // ISO 8601 timestamp
}

/**
 * Session start request body (same as V1)
 */
export interface SessionStartRequest {
  sessionId: string;
  roomName: string;
  studentId: string;
  topic?: string;
}

/**
 * V2 Session Metrics Response Data
 *
 * Breaking change from V1:
 * - More detailed nested metrics structure
 * - Wrapped in ApiResponse<SessionMetricsResponseV2>
 */
export interface SessionMetricsResponseV2 {
  sessionId: string;
  metrics: {
    duration: {
      total: number; // milliseconds
      active: number; // milliseconds
    };
    messages: {
      total: number;
      fromUser: number;
      fromAgent: number;
    };
    errors: {
      total: number;
      byType: Record<string, number>;
    };
  };
  timestamp: string; // ISO 8601 timestamp
}
