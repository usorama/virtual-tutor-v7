// Intelligent Fallback System Implementation for ERR-005
// Provides service availability through smart fallback strategy chains

import {
  FallbackStrategy,
  OperationContext,
  PerformanceTracker,
  FallbackExhaustedError
} from './types';
import { globalPerformanceTracker } from './error-monitor';

export abstract class BaseFallbackStrategy implements FallbackStrategy {
  abstract readonly name: string;
  abstract readonly priority: number;

  abstract canHandle(error: Error, context: OperationContext): Promise<boolean>;
  abstract execute(context: OperationContext): Promise<unknown>;

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (process.env.NODE_ENV === 'development') {
      const prefix = `[FallbackStrategy:${this.name}]`;
      switch (level) {
        case 'info':
          console.log(prefix, message);
          break;
        case 'warn':
          console.warn(prefix, message);
          break;
        case 'error':
          console.error(prefix, message);
          break;
      }
    }
  }
}

// AI Tutoring Fallback Strategies
export class CachedResponseStrategy extends BaseFallbackStrategy {
  readonly name = 'cached_response';
  readonly priority = 10;

  private cache = new Map<string, { response: unknown; timestamp: number }>();
  private readonly cacheTTL = 300000; // 5 minutes

  async canHandle(error: Error, context: OperationContext): Promise<boolean> {
    return context.operationType === 'ai_tutoring' &&
           this.hasValidCachedResponse(context);
  }

  async execute(context: OperationContext): Promise<unknown> {
    this.log('Executing cached response fallback');

    const cacheKey = this.generateCacheKey(context);
    const cached = this.cache.get(cacheKey);

    if (!cached || this.isCacheExpired(cached.timestamp)) {
      throw new Error('No valid cached response available');
    }

    this.log('Serving cached response');
    return cached.response;
  }

  private hasValidCachedResponse(context: OperationContext): boolean {
    const cacheKey = this.generateCacheKey(context);
    const cached = this.cache.get(cacheKey);

    return cached !== undefined && !this.isCacheExpired(cached.timestamp);
  }

  private generateCacheKey(context: OperationContext): string {
    // Create a cache key based on operation parameters
    const keyComponents = [
      context.operationType,
      JSON.stringify(context.parameters)
    ];
    return keyComponents.join('|');
  }

  private isCacheExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.cacheTTL;
  }

  // Public method to populate cache (would be called during successful operations)
  cacheResponse(context: OperationContext, response: unknown): void {
    const cacheKey = this.generateCacheKey(context);
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });

    // Cleanup old entries
    this.cleanupExpiredEntries();
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }
}

export class SimplifiedTutoringStrategy extends BaseFallbackStrategy {
  readonly name = 'simplified_tutoring';
  readonly priority = 8;

  async canHandle(error: Error, context: OperationContext): Promise<boolean> {
    return context.operationType === 'ai_tutoring';
  }

  async execute(context: OperationContext): Promise<unknown> {
    this.log('Executing simplified tutoring fallback');

    // Provide a simplified response based on the topic
    const topic = context.parameters.topic as string || 'general';
    const question = context.parameters.question as string || '';

    const simplifiedResponse = this.generateSimplifiedResponse(topic, question);

    this.log('Generated simplified tutoring response');
    return {
      content: simplifiedResponse,
      type: 'simplified',
      source: 'fallback'
    };
  }

  private generateSimplifiedResponse(topic: string, question: string): string {
    // Basic response templates for common topics
    const responses: Record<string, string> = {
      mathematics: "Let me help you with this math problem. Let's break it down step by step and work through the fundamentals.",
      science: "This is an interesting science question. Let's explore the basic concepts and build our understanding.",
      language: "Great question about language! Let's look at the key points and examples.",
      history: "This is a good historical question. Let me provide some context and key information.",
      general: "I'm here to help you learn. Let's work through this together step by step."
    };

    const baseResponse = responses[topic.toLowerCase()] || responses.general;

    if (question) {
      return `${baseResponse}\n\nRegarding your question: "${question.slice(0, 100)}${question.length > 100 ? '...' : ''}"\n\nI'll provide a focused explanation to help you understand the concept.`;
    }

    return baseResponse;
  }
}

export class TextOnlyFallbackStrategy extends BaseFallbackStrategy {
  readonly name = 'text_only_fallback';
  readonly priority = 5;

  async canHandle(error: Error, context: OperationContext): Promise<boolean> {
    return context.operationType === 'ai_tutoring' ||
           context.operationType === 'voice_session';
  }

  async execute(context: OperationContext): Promise<unknown> {
    this.log('Executing text-only fallback');

    return {
      content: "I'm currently experiencing technical difficulties with advanced features. However, I can still help you through text-based learning. Please type your questions, and I'll provide detailed explanations.",
      type: 'text_only',
      source: 'fallback',
      capabilities: ['text_response', 'basic_explanations']
    };
  }
}

// Voice Session Fallback Strategies
export class AudioRecordingFallbackStrategy extends BaseFallbackStrategy {
  readonly name = 'audio_recording_fallback';
  readonly priority = 9;

  async canHandle(error: Error, context: OperationContext): Promise<boolean> {
    return context.operationType === 'voice_session' &&
           this.isAudioRecordingAvailable();
  }

  async execute(context: OperationContext): Promise<unknown> {
    this.log('Executing audio recording fallback');

    // Simulate audio recording capability check
    await this.delay(500);

    return {
      mode: 'audio_recording',
      message: "Live voice interaction is unavailable, but you can record your questions. I'll process them and provide detailed responses.",
      capabilities: ['audio_recording', 'text_response', 'offline_processing']
    };
  }

  private isAudioRecordingAvailable(): boolean {
    // Check if browser supports audio recording
    return typeof navigator !== 'undefined' &&
           navigator.mediaDevices &&
           navigator.mediaDevices.getUserMedia !== undefined;
  }
}

export class TextChatFallbackStrategy extends BaseFallbackStrategy {
  readonly name = 'text_chat_fallback';
  readonly priority = 7;

  async canHandle(error: Error, context: OperationContext): Promise<boolean> {
    return context.operationType === 'voice_session';
  }

  async execute(context: OperationContext): Promise<unknown> {
    this.log('Executing text chat fallback');

    return {
      mode: 'text_chat',
      message: "Voice features are temporarily unavailable. Let's continue with text-based learning! Type your questions and I'll provide comprehensive explanations.",
      capabilities: ['text_chat', 'rich_formatting', 'interactive_exercises']
    };
  }
}

export class OfflineModeStrategy extends BaseFallbackStrategy {
  readonly name = 'offline_mode';
  readonly priority = 3;

  async canHandle(error: Error, context: OperationContext): Promise<boolean> {
    // Always can handle as last resort
    return true;
  }

  async execute(context: OperationContext): Promise<unknown> {
    this.log('Executing offline mode fallback');

    return {
      mode: 'offline',
      message: "Connection issues detected. Switching to offline mode with cached content and local capabilities.",
      capabilities: ['offline_content', 'local_exercises', 'basic_calculations'],
      content: this.getOfflineContent(context.operationType) as Record<string, unknown>
    };
  }

  private getOfflineContent(operationType: string): Record<string, unknown> {
    const offlineContent: Record<string, Record<string, unknown>> = {
      ai_tutoring: {
        basicLessons: ['Math fundamentals', 'Science basics', 'Language principles'],
        exercises: ['Practice problems', 'Quick quizzes', 'Review materials']
      },
      voice_session: {
        alternatives: ['Text interaction', 'Visual learning', 'Practice exercises'],
        guidance: 'Voice features will resume when connection is restored'
      },
      database_query: {
        cachedData: 'Limited cached information available',
        functionality: 'Read-only access to recent data'
      }
    };

    return offlineContent[operationType] || offlineContent.ai_tutoring;
  }
}

// Database Operation Fallback Strategies
export class CachedDataStrategy extends BaseFallbackStrategy {
  readonly name = 'cached_data';
  readonly priority = 9;

  private dataCache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly cacheTTL = 600000; // 10 minutes

  async canHandle(error: Error, context: OperationContext): Promise<boolean> {
    return context.operationType === 'database_query' &&
           this.hasValidCachedData(context);
  }

  async execute(context: OperationContext): Promise<unknown> {
    this.log('Executing cached data fallback');

    const cacheKey = this.generateDataCacheKey(context);
    const cached = this.dataCache.get(cacheKey);

    if (!cached || this.isCacheExpired(cached.timestamp)) {
      throw new Error('No valid cached data available');
    }

    this.log('Serving cached data');
    return {
      data: cached.data,
      source: 'cache',
      timestamp: cached.timestamp,
      note: 'This data may not reflect the most recent changes'
    };
  }

  private hasValidCachedData(context: OperationContext): boolean {
    const cacheKey = this.generateDataCacheKey(context);
    const cached = this.dataCache.get(cacheKey);

    return cached !== undefined && !this.isCacheExpired(cached.timestamp);
  }

  private generateDataCacheKey(context: OperationContext): string {
    const query = context.parameters.query || context.parameters.table || 'default';
    return `${context.operationType}:${query}`;
  }

  private isCacheExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.cacheTTL;
  }

  // Public method to populate cache
  cacheData(context: OperationContext, data: unknown): void {
    const cacheKey = this.generateDataCacheKey(context);
    this.dataCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }
}

export class ReadOnlyModeStrategy extends BaseFallbackStrategy {
  readonly name = 'read_only_mode';
  readonly priority = 6;

  async canHandle(error: Error, context: OperationContext): Promise<boolean> {
    return context.operationType === 'database_query' &&
           this.isReadOperation(context);
  }

  async execute(context: OperationContext): Promise<unknown> {
    this.log('Executing read-only mode fallback');

    // Simulate read-only database access
    await this.delay(200);

    return {
      mode: 'read_only',
      message: 'Database is in read-only mode. Write operations are temporarily unavailable.',
      data: this.getMockReadData(context),
      limitations: ['no_writes', 'no_updates', 'no_deletes']
    };
  }

  private isReadOperation(context: OperationContext): boolean {
    const operation = (context.parameters.operation as string || '').toLowerCase();
    const readOperations = ['select', 'get', 'find', 'query', 'read'];

    return readOperations.some(readOp => operation.includes(readOp));
  }

  private getMockReadData(context: OperationContext): unknown {
    // Return appropriate mock data based on context
    const table = context.parameters.table as string || 'default';

    const mockData: Record<string, unknown> = {
      users: [{ id: 1, name: 'Sample User', status: 'active' }],
      courses: [{ id: 1, title: 'Sample Course', level: 'beginner' }],
      progress: [{ id: 1, completion: 0.5, lastAccessed: Date.now() }],
      default: { message: 'Sample data for fallback operation' }
    };

    return mockData[table] || mockData.default;
  }
}

export class LocalStorageStrategy extends BaseFallbackStrategy {
  readonly name = 'local_storage';
  readonly priority = 4;

  async canHandle(error: Error, context: OperationContext): Promise<boolean> {
    return context.operationType === 'database_query' &&
           this.isLocalStorageAvailable();
  }

  async execute(context: OperationContext): Promise<unknown> {
    this.log('Executing local storage fallback');

    const key = this.generateStorageKey(context);
    const stored = this.getFromLocalStorage(key);

    return {
      mode: 'local_storage',
      data: stored,
      message: 'Using local storage for temporary data access',
      limitations: ['limited_data', 'session_only', 'no_sync']
    };
  }

  private isLocalStorageAvailable(): boolean {
    try {
      return typeof Storage !== 'undefined' && localStorage !== undefined;
    } catch {
      return false;
    }
  }

  private generateStorageKey(context: OperationContext): string {
    return `fallback_${context.operationType}_${context.parameters.table || 'data'}`;
  }

  private getFromLocalStorage(key: string): Record<string, unknown> {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) as Record<string, unknown> : { message: 'No local data available' };
    } catch {
      return { message: 'Error accessing local storage' };
    }
  }

  // Public method to store data locally
  storeLocally(context: OperationContext, data: unknown): void {
    try {
      const key = this.generateStorageKey(context);
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
        source: 'fallback_cache'
      }));
    } catch (error) {
      this.log(`Failed to store data locally: ${error}`, 'warn');
    }
  }
}

export class IntelligentFallbackSystem {
  private fallbackStrategies = new Map<string, FallbackStrategy[]>();
  private readonly performanceTracker: PerformanceTracker;

  constructor(performanceTracker?: PerformanceTracker) {
    this.performanceTracker = performanceTracker || globalPerformanceTracker;
    this.initializeFallbackStrategies();
  }

  private initializeFallbackStrategies(): void {
    // AI tutoring fallbacks
    this.fallbackStrategies.set('ai_tutoring', [
      new CachedResponseStrategy(),
      new SimplifiedTutoringStrategy(),
      new TextOnlyFallbackStrategy(),
      new OfflineModeStrategy()
    ]);

    // Voice session fallbacks
    this.fallbackStrategies.set('voice_session', [
      new AudioRecordingFallbackStrategy(),
      new TextChatFallbackStrategy(),
      new TextOnlyFallbackStrategy(),
      new OfflineModeStrategy()
    ]);

    // Database operation fallbacks
    this.fallbackStrategies.set('database_query', [
      new CachedDataStrategy(),
      new ReadOnlyModeStrategy(),
      new LocalStorageStrategy(),
      new OfflineModeStrategy()
    ]);

    this.logInitialization();
  }

  private logInitialization(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[IntelligentFallbackSystem] Initialized with strategies:');
      for (const [operationType, strategies] of this.fallbackStrategies) {
        console.log(`  ${operationType}: ${strategies.map(s => s.name).join(', ')}`);
      }
    }
  }

  async executeWithFallback<T>(
    operation: () => Promise<T>,
    operationType: string,
    context: OperationContext
  ): Promise<T> {
    const strategies = this.fallbackStrategies.get(operationType) || [];

    try {
      const result = await operation();
      this.performanceTracker.recordSuccess(operationType);
      return result;
    } catch (error) {
      this.performanceTracker.recordFailure(operationType, error as Error);

      if (process.env.NODE_ENV === 'development') {
        console.warn(`[IntelligentFallbackSystem] Primary operation failed for ${operationType}:`, error);
      }

      return this.executeFallbackChain(strategies, error as Error, context, operationType);
    }
  }

  private async executeFallbackChain<T>(
    strategies: FallbackStrategy[],
    error: Error,
    context: OperationContext,
    operationType: string
  ): Promise<T> {
    // Sort strategies by priority (higher priority first)
    const sortedStrategies = [...strategies].sort((a, b) => b.priority - a.priority);

    for (const strategy of sortedStrategies) {
      try {
        if (await strategy.canHandle(error, context)) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[IntelligentFallbackSystem] Trying fallback strategy: ${strategy.name}`);
          }

          const fallbackResult = await strategy.execute(context);
          this.performanceTracker.recordFallbackSuccess(operationType, strategy.name);

          if (process.env.NODE_ENV === 'development') {
            console.log(`[IntelligentFallbackSystem] Fallback successful with strategy: ${strategy.name}`);
          }

          return fallbackResult as T;
        }
      } catch (fallbackError) {
        this.performanceTracker.recordFallbackFailure(operationType, strategy.name);

        if (process.env.NODE_ENV === 'development') {
          console.warn(`[IntelligentFallbackSystem] Fallback strategy ${strategy.name} failed:`, fallbackError);
        }

        // Continue to next strategy
        continue;
      }
    }

    // All fallback strategies failed
    throw new FallbackExhaustedError(
      `All fallback strategies failed for operation type: ${operationType}`,
      error
    );
  }

  addStrategy(operationType: string, strategy: FallbackStrategy): void {
    const current = this.fallbackStrategies.get(operationType) || [];
    current.push(strategy);
    this.fallbackStrategies.set(operationType, current);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[IntelligentFallbackSystem] Added strategy ${strategy.name} for ${operationType}`);
    }
  }

  removeStrategy(operationType: string, strategyName: string): boolean {
    const current = this.fallbackStrategies.get(operationType) || [];
    const filtered = current.filter(strategy => strategy.name !== strategyName);

    if (filtered.length < current.length) {
      this.fallbackStrategies.set(operationType, filtered);
      return true;
    }

    return false;
  }

  getStrategies(operationType: string): string[] {
    const strategies = this.fallbackStrategies.get(operationType) || [];
    return strategies.map(strategy => strategy.name);
  }

  getAllStrategies(): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const [operationType, strategies] of this.fallbackStrategies) {
      result[operationType] = strategies.map(strategy => strategy.name);
    }

    return result;
  }
}

// Global instance for easy access
export const globalFallbackSystem = new IntelligentFallbackSystem();