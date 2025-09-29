/**
 * Protected Core Mocks for Testing
 * TEST-001: Mock implementations for protected core services
 * TS-006: Enhanced WebSocket typing - eliminated all 'any' types
 */

import { vi } from 'vitest';
import type {
  VoiceConfig,
  VoiceSession,
  ProcessedText,
  DisplayItem,
  TranscriptionContract,
  VoiceServiceContract,
  WebSocketConfig,
  MathSegment
} from '@/protected-core';
import type { WebSocketSendData, WebSocketConnectionEvent } from '@/types/websocket';

// Enhanced WebSocket event handler type
type WebSocketEventHandler = (data: unknown) => void;

// Mock LiveKitVoiceService
export class MockLiveKitVoiceService implements VoiceServiceContract {
  private connectionState: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private currentSession: VoiceSession | null = null;

  async initialize(config: VoiceConfig): Promise<void> {
    this.connectionState = 'connecting';

    // Simulate initialization process
    await new Promise(resolve => setTimeout(resolve, 10));

    if (!config.apiKey || config.apiKey === 'invalid-key') {
      this.connectionState = 'disconnected'; // Reset state on failure
      throw new Error('Configuration validation failed');
    }

    this.connectionState = 'connected';
  }

  async startSession(studentId: string, topic: string): Promise<string> {
    if (this.connectionState !== 'connected') {
      throw new Error('Service not initialized');
    }

    if (this.currentSession && this.currentSession.status === 'active') {
      throw new Error('Session already active');
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.currentSession = {
      sessionId,
      studentId,
      topic,
      startTime: Date.now(),
      status: 'active'
    };

    return sessionId;
  }

  async endSession(sessionId: string): Promise<void> {
    if (this.currentSession && this.currentSession.sessionId === sessionId) {
      this.currentSession.status = 'ended';
      this.currentSession.endTime = Date.now();
    }
  }

  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      throw new Error('No active session');
    }

    if (!audioData || audioData.byteLength === 0) {
      throw new Error('Invalid audio data');
    }

    // Simulate audio processing delay
    await new Promise(resolve => setTimeout(resolve, 5));
  }

  getConnectionState(): 'connected' | 'disconnected' | 'connecting' {
    return this.connectionState;
  }

  getSession(): VoiceSession | null {
    return this.currentSession;
  }

  async cleanup(): Promise<void> {
    this.connectionState = 'disconnected';
    this.currentSession = null;
  }

  // Test helper methods
  simulateConnectionLoss(): void {
    this.connectionState = 'connecting';
  }

  simulateConnectionRecovery(): void {
    this.connectionState = 'connected';
  }
}

// Mock TranscriptionService - TS-006: Fixed to align with TranscriptionContract
export class MockTranscriptionService implements TranscriptionContract {
  private displayBuffer: DisplayItem[] = [];

  // TS-006: Fixed speaker parameter typing (was speaker as any)
  processTranscription(text: string, speaker?: string): ProcessedText {
    // Simple math detection for testing
    const mathExpressions = [
      'x squared', 'x plus', 'equals', 'square root', 'quadratic formula'
    ];

    const hasMath = mathExpressions.some(expr => text.toLowerCase().includes(expr));

    const segments = hasMath ? [
      {
        text: 'The equation ',
        type: 'text' as const,
        startIndex: 0,
        endIndex: 13
      },
      {
        text: '$x^2 + 5x + 6 = 0$',
        type: 'math' as const,
        startIndex: 13,
        endIndex: 31,
        latex: 'x^2 + 5x + 6 = 0'
      }
    ] : [
      {
        text,
        type: 'text' as const,
        startIndex: 0,
        endIndex: text.length
      }
    ];

    // TS-006: Fixed speaker typing to match contract
    const validSpeaker = this.validateSpeaker(speaker);

    return {
      originalText: text,
      processedText: hasMath ? 'The equation $x^2 + 5x + 6 = 0$' : text,
      segments,
      timestamp: Date.now(),
      speaker: validSpeaker
    };
  }

  renderMath(latex: string): string {
    if (latex.includes('\\invalid')) {
      throw new Error('Invalid LaTeX');
    }
    return `<span class="katex">${latex}</span>`;
  }

  // TS-006: Fixed return type to match contract (was any[])
  detectMath(text: string): MathSegment[] {
    const mathExpressions = [
      'x squared', 'x plus', 'pi r squared', 'one half plus'
    ];

    if (mathExpressions.some(expr => text.toLowerCase().includes(expr))) {
      return [{
        text: text,
        type: 'math' as const,
        startIndex: 0,
        endIndex: text.length,
        latex: this.convertToLatex(text),
        confidence: 0.95
      }];
    }

    return [];
  }

  getDisplayBuffer(): DisplayItem[] {
    return [...this.displayBuffer];
  }

  clearBuffer(): void {
    this.displayBuffer = [];
  }

  addToBuffer(item: DisplayItem): void {
    this.displayBuffer.push(item);

    // Simulate buffer size limit
    if (this.displayBuffer.length > 500) {
      this.displayBuffer = this.displayBuffer.slice(-250);
    }
  }

  getBufferSize(): number {
    return this.displayBuffer.length;
  }

  // TS-006: Helper method to validate speaker types
  private validateSpeaker(speaker?: string): 'student' | 'teacher' | 'system' | undefined {
    if (!speaker) return undefined;

    const validSpeakers = ['student', 'teacher', 'system'] as const;
    return validSpeakers.includes(speaker as any)
      ? speaker as 'student' | 'teacher' | 'system'
      : 'system'; // Default fallback
  }

  private convertToLatex(text: string): string {
    const conversions: Record<string, string> = {
      'x squared plus five x plus six': 'x^2 + 5x + 6',
      'pi r squared': '\\pi r^2',
      'one half plus three quarters': '\\frac{1}{2} + \\frac{3}{4}',
      'negative b plus or minus square root': '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
    };

    for (const [phrase, latex] of Object.entries(conversions)) {
      if (text.toLowerCase().includes(phrase)) {
        return latex;
      }
    }

    return 'x + 5'; // Default
  }
}

// Mock SessionOrchestrator
export class MockSessionOrchestrator {
  private static instance: MockSessionOrchestrator;
  private sessionState: any = null;

  static getInstance(): MockSessionOrchestrator {
    if (!MockSessionOrchestrator.instance) {
      MockSessionOrchestrator.instance = new MockSessionOrchestrator();
    }
    return MockSessionOrchestrator.instance;
  }

  async startSession(studentId: string, topic: string): Promise<string> {
    const sessionId = `orchestrator-session-${Date.now()}`;

    this.sessionState = {
      sessionId,
      status: 'initializing',
      studentId,
      topic,
      startedAt: Date.now(),
      voiceServiceConnected: false,
      transcriptionActive: false
    };

    // Simulate initialization process
    setTimeout(() => {
      if (this.sessionState) {
        this.sessionState.status = 'active';
        this.sessionState.voiceServiceConnected = true;
        this.sessionState.transcriptionActive = true;
      }
    }, 50);

    return sessionId;
  }

  async endSession(sessionId: string): Promise<void> {
    if (this.sessionState && this.sessionState.sessionId === sessionId) {
      this.sessionState.status = 'ended';
      this.sessionState.endedAt = Date.now();
    } else {
      throw new Error('No active session found with the provided ID');
    }
  }

  getSessionState(): any {
    return this.sessionState;
  }

  // Test helper methods
  reset(): void {
    this.sessionState = null;
  }
}

// Mock WebSocketManager - TS-006: Enhanced with proper typing
export class MockWebSocketManager {
  private static instance: MockWebSocketManager;
  private connected = false;
  private eventListeners: Map<string, WebSocketEventHandler[]> = new Map();
  private activeListenerCount = 0;

  static getInstance(): MockWebSocketManager {
    if (!MockWebSocketManager.instance) {
      MockWebSocketManager.instance = new MockWebSocketManager();
    }
    return MockWebSocketManager.instance;
  }

  // TS-006: Fixed typing - was 'config: any'
  async connect(config: WebSocketConfig): Promise<void> {
    if (config.url.includes('invalid')) {
      throw new Error('Connection failed');
    }

    this.connected = true;
    this.emit('connect', {});
  }

  disconnect(): void {
    this.connected = false;
    this.emit('disconnect', { code: 1000, reason: 'Normal closure' });
    this.activeListenerCount = 0;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnectionState(): 'connected' | 'disconnected' | 'connecting' {
    return this.connected ? 'connected' : 'disconnected';
  }

  // TS-006: Fixed typing - was 'message: any'
  send(message: WebSocketSendData): void {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    // Simulate message sending
  }

  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(handler);
    this.activeListenerCount++;
  }

  off(event: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        this.activeListenerCount--;
      }
    }
  }

  // TS-006: Fixed typing - was 'data: any'
  emit(event: string, data: unknown): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  getActiveListenerCount(): number {
    return this.activeListenerCount;
  }

  // Test helper methods
  // TS-006: Fixed typing - was 'data: any'
  simulateMessage(data: unknown): void {
    this.emit('message', data);
  }

  // TS-006: Fixed typing - was 'error: any'
  simulateError(error: Error): void {
    this.emit('error', error);
  }

  reset(): void {
    this.connected = false;
    this.eventListeners.clear();
    this.activeListenerCount = 0;
  }
}

// Export mock instances for testing
export const mockVoiceService = new MockLiveKitVoiceService();
export const mockTranscriptionService = new MockTranscriptionService();
export const mockSessionOrchestrator = MockSessionOrchestrator.getInstance();
export const mockWebSocketManager = MockWebSocketManager.getInstance();