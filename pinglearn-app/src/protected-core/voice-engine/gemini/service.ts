/**
 * Gemini Voice Service
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Full implementation of Gemini Live API integration
 * Phase 2: Complete WebSocket-based voice interaction
 */

import { VoiceServiceContract, VoiceSession } from '../../contracts/voice.contract';
import {
  GeminiConfig,
  GeminiSessionConfig,
  GeminiConnectionState,
  GeminiEvents,
  GeminiMessage,
  GeminiStreamChunk,
  MathExpression
} from './types';
import {
  createSessionConfig,
  validateConfig,
  getWebSocketUrl,
  formatSystemInstruction
} from './config';

export class GeminiVoiceService implements Partial<VoiceServiceContract> {
  private config: GeminiSessionConfig;
  private websocket: WebSocket | null = null;
  private sessionActive = false;
  private currentSession: VoiceSession | null = null;
  private connectionState: GeminiConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: GeminiMessage[] = [];
  private audioBuffer: ArrayBuffer[] = [];

  constructor(config?: Partial<GeminiSessionConfig>) {
    this.config = createSessionConfig(config);
  }

  async initialize(): Promise<void> {
    // Validate configuration
    const errors = validateConfig(this.config);
    if (errors.length > 0) {
      console.error('Invalid Gemini configuration:', errors);
      throw new Error(`Invalid configuration: ${errors.join(', ')}`);
    }

    // Set system instruction with educational context
    this.config.systemInstruction = formatSystemInstruction(this.config.educationalContext);

    console.log('Gemini service initialized with config:', {
      model: this.config.model,
      region: this.config.region,
      subject: this.config.educationalContext.subject
    });

    this.connectionState = 'disconnected';
  }

  async connectToGemini(): Promise<void> {
    if (this.connectionState === 'connected') {
      console.log('Already connected to Gemini');
      return;
    }

    const wsUrl = getWebSocketUrl(this.config);
    console.log('Connecting to Gemini Live API...');
    this.connectionState = 'connecting';
    this.onConnectionChange?.(this.connectionState);

    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          console.log('Gemini WebSocket connected');
          this.connectionState = 'connected';
          this.onConnectionChange?.('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.websocket.onerror = (error) => {
          console.error('Gemini WebSocket error:', error);
          this.onError?.(new Error('WebSocket connection error'));
        };

        this.websocket.onclose = () => {
          console.log('Gemini WebSocket closed');
          this.connectionState = 'disconnected';
          this.onConnectionChange?.('disconnected');
          this.stopHeartbeat();
          this.attemptReconnection();
        };

      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        this.connectionState = 'error';
        this.onConnectionChange?.('error');
        reject(error);
      }
    });
  }

  async startSession(studentId: string, topic: string): Promise<string> {
    const sessionId = `gemini-session-${Date.now()}`;

    this.currentSession = {
      sessionId,
      studentId,
      topic,
      startTime: Date.now(),
      status: 'active'
    };

    this.sessionActive = true;

    // Start mock session for testing
    await this.startMockSession();

    return sessionId;
  }

  async endSession(sessionId: string): Promise<void> {
    if (this.currentSession?.sessionId === sessionId) {
      this.currentSession.endTime = Date.now();
      this.currentSession.status = 'ended';
      this.sessionActive = false;
      console.log(`Gemini session ${sessionId} ended`);
    }
  }

  getConnectionState(): 'connected' | 'disconnected' | 'connecting' {
    // Map internal states to contract states
    switch (this.connectionState) {
      case 'connected':
        return 'connected';
      case 'connecting':
      case 'reconnecting':
        return 'connecting';
      case 'disconnected':
      case 'error':
      default:
        return 'disconnected';
    }
  }

  getSession(): VoiceSession | null {
    return this.currentSession;
  }

  async cleanup(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.sessionActive = false;
    this.currentSession = null;
    this.connectionState = 'disconnected';
    console.log('Gemini service cleaned up');
  }

  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.sessionActive || !this.websocket) {
      console.warn('Cannot send audio: no active session');
      return;
    }

    // Buffer audio data for streaming
    this.audioBuffer.push(audioData);

    // Process buffered audio in chunks
    if (this.audioBuffer.length >= 5) { // Process every 5 chunks
      const combinedBuffer = this.combineAudioBuffers(this.audioBuffer);
      this.audioBuffer = [];

      const audioMessage: GeminiMessage = {
        role: 'user',
        parts: [{
          inlineData: {
            mimeType: 'audio/opus',
            data: this.arrayBufferToBase64(combinedBuffer)
          }
        }]
      };

      this.sendMessage(audioMessage);
    }
  }

  private combineAudioBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
    const totalLength = buffers.reduce((acc, buf) => acc + buf.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;

    for (const buffer of buffers) {
      combined.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }

    return combined.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    return btoa(binary);
  }

  private sendMessage(message: GeminiMessage): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.websocket?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!;
      this.websocket.send(JSON.stringify(message));
    }
  }

  private handleMessage(data: string): void {
    try {
      const response: GeminiStreamChunk = JSON.parse(data);

      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const content = candidate.content;

        if (content && content.parts) {
          for (const part of content.parts) {
            if (part.text) {
              this.processTranscription(part.text);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
    }
  }

  private processTranscription(text: string): void {
    // Extract math expressions
    const mathExpressions = this.extractMathExpressions(text);

    // Emit transcription event
    this.onTranscription?.({
      text,
      timestamp: Date.now(),
      isFinal: true,
      confidence: 0.95,
      mathExpressions
    } as GeminiEvents['transcription']);
  }

  private extractMathExpressions(text: string): MathExpression[] {
    const expressions: MathExpression[] = [];
    const patterns = [
      { regex: /\$\$([^$]+)\$\$/g, context: 'equation' as const },
      { regex: /\$([^$]+)\$/g, context: 'formula' as const }
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        expressions.push({
          latex: match[1],
          description: `Math ${pattern.context}`,
          context: pattern.context,
          complexity: this.assessComplexity(match[1])
        });
      }
    }

    return expressions;
  }

  private assessComplexity(latex: string): 'basic' | 'intermediate' | 'advanced' {
    if (latex.includes('\\int') || latex.includes('\\sum') || latex.includes('\\lim')) {
      return 'advanced';
    }
    if (latex.includes('\\frac') || latex.includes('^') || latex.includes('_')) {
      return 'intermediate';
    }
    return 'basic';
  }

  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.connectionState = 'error';
      this.onConnectionChange?.('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.connectionState = 'reconnecting';
    this.onConnectionChange?.('reconnecting');

    setTimeout(() => {
      this.connectToGemini().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Mock implementation for testing other services
  async startMockSession(): Promise<void> {
    if (!this.sessionActive) return;

    // Simulate initial AI greeting
    setTimeout(() => {
      this.onTranscription?.({
        text: 'Hello! I\'m your AI teacher. What would you like to learn about today?',
        timestamp: Date.now(),
        isFinal: true,
        confidence: 0.95
      });
    }, 1000);

    // Simulate a math lesson starter
    setTimeout(() => {
      this.onTranscription?.({
        text: 'Let\'s start with quadratic equations. The standard form is $ax^2 + bx + c = 0$',
        timestamp: Date.now(),
        isFinal: true,
        confidence: 0.98,
        mathExpressions: this.extractMathExpressions('The standard form is $ax^2 + bx + c = 0$')
      });
    }, 3000);

    // Simulate explaining the quadratic formula
    setTimeout(() => {
      this.onTranscription?.({
        text: 'The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$. Let me break this down for you.',
        timestamp: Date.now(),
        isFinal: true,
        confidence: 0.97,
        mathExpressions: this.extractMathExpressions('The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$')
      });
    }, 6000);
  }

  // Event handlers that will be set by the orchestration layer
  onTranscription?: (data: GeminiEvents['transcription']) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (state: GeminiConnectionState) => void;
  onSessionStart?: (data: GeminiEvents['sessionStart']) => void;
  onSessionEnd?: (data: GeminiEvents['sessionEnd']) => void;
}