/**
 * WebSocket Singleton Manager (Legacy)
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * This is a legacy implementation. Use WebSocketManager from singleton-manager.ts
 * for new implementations. This file is kept for backward compatibility.
 *
 * @deprecated Use WebSocketManager from './singleton-manager' instead
 */

// Re-export the enhanced WebSocket manager
export { WebSocketManager } from './singleton-manager';

// Legacy compatibility exports
export type { WebSocketConfig, ConnectionEvent } from './singleton-manager';