/**
 * WebSocket Module Exports
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Central export point for all WebSocket-related functionality
 */

// Main WebSocket Manager
export { WebSocketManager } from './manager/singleton-manager';
export type { WebSocketConfig, ConnectionEvent } from './manager/singleton-manager';

// Retry functionality
export { ExponentialBackoff } from './retry/exponential-backoff';
export type { RetryConfig, RetryAttempt } from './retry/exponential-backoff';

// Health monitoring
export { WebSocketHealthMonitor } from './health/monitor';
export type { HealthMetrics, PingResult } from './health/monitor';

// Legacy compatibility (deprecated)
export * from './manager/singleton';