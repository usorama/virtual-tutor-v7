/**
 * ERR-005: Self-Healing System
 * Automatically detects and heals common error types
 */

import type { EnrichedError, ErrorContext } from '@/lib/monitoring/types';
import type { HealingStrategy } from './strategies/healing-strategy.interface';
import type { HealingAttempt } from './types';

// Import healing strategies
import { DatabaseReconnectionStrategy } from './strategies/database-reconnection';
import { APIRetryStrategy } from './strategies/api-retry';
import { MemoryCleanupStrategy } from './strategies/memory-cleanup';
import { WebSocketReconnectionStrategy } from './strategies/websocket-reconnection';

/**
 * Self-Healing System
 *
 * Automatically detects and heals common error types using pluggable strategies.
 * Each strategy handles specific error patterns (database, API, memory, WebSocket).
 *
 * Features:
 * - Automatic error classification
 * - Strategy selection and execution
 * - Healing attempt tracking
 * - Escalation after max attempts
 * - Singleton pattern for global access
 */
export class SelfHealingSystem {
  private static instance: SelfHealingSystem;

  private strategies: Map<string, HealingStrategy> = new Map();
  private healingAttempts: Map<string, number> = new Map();
  private healingHistory: Map<string, HealingAttempt[]> = new Map();
  private readonly maxHealingAttempts = 3;

  private constructor() {
    // Register default healing strategies
    this.registerDefaultStrategies();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SelfHealingSystem {
    if (!SelfHealingSystem.instance) {
      SelfHealingSystem.instance = new SelfHealingSystem();
    }
    return SelfHealingSystem.instance;
  }

  /**
   * Register default healing strategies
   */
  private registerDefaultStrategies(): void {
    this.registerStrategy(new DatabaseReconnectionStrategy());
    this.registerStrategy(new APIRetryStrategy());
    this.registerStrategy(new MemoryCleanupStrategy());
    this.registerStrategy(new WebSocketReconnectionStrategy());

    console.log('[SelfHealing] Registered default strategies:', {
      strategies: Array.from(this.strategies.keys()),
    });
  }

  /**
   * Register a new healing strategy
   */
  registerStrategy(strategy: HealingStrategy): void {
    this.strategies.set(strategy.name, strategy);
    console.log(`[SelfHealing] Registered strategy: ${strategy.name}`);
  }

  /**
   * Unregister a healing strategy
   */
  unregisterStrategy(strategyName: string): void {
    this.strategies.delete(strategyName);
    console.log(`[SelfHealing] Unregistered strategy: ${strategyName}`);
  }

  /**
   * Get all registered strategies
   */
  getStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Handle an error and attempt to heal it
   *
   * @param error - The error to heal
   * @param context - Error context
   * @returns true if healing was successful, false otherwise
   */
  async handleError(error: EnrichedError, context: ErrorContext): Promise<boolean> {
    const errorKey = this.generateErrorKey(error, context);

    console.log('[SelfHealing] Handling error:', {
      errorCode: error.code,
      errorKey,
      message: error.message,
      category: error.category,
    });

    // Check if we've exceeded max healing attempts for this error
    const attempts = this.healingAttempts.get(errorKey) || 0;
    if (attempts >= this.maxHealingAttempts) {
      console.warn('[SelfHealing] Max healing attempts exceeded, escalating:', {
        errorKey,
        attempts,
        maxAttempts: this.maxHealingAttempts,
      });
      this.escalateError(error, context);
      return false;
    }

    // Find a strategy that can handle this error
    const strategy = this.findStrategy(error, context);
    if (!strategy) {
      console.log('[SelfHealing] No suitable strategy found for error:', {
        errorCode: error.code,
        category: error.category,
      });
      return false;
    }

    console.log(`[SelfHealing] Found strategy: ${strategy.name}`);

    // Attempt healing
    const startTime = Date.now();
    try {
      await strategy.heal(error, context);
      const duration = Date.now() - startTime;

      // Record successful healing attempt
      this.recordHealingAttempt(errorKey, {
        strategy: strategy.name,
        success: true,
        duration,
        timestamp: Date.now(),
      });

      // Increment attempt counter
      this.healingAttempts.set(errorKey, attempts + 1);

      console.log('[SelfHealing] Successfully healed error:', {
        errorKey,
        strategy: strategy.name,
        duration,
        attempts: attempts + 1,
      });

      return true;
    } catch (healError) {
      const duration = Date.now() - startTime;

      // Record failed healing attempt
      this.recordHealingAttempt(errorKey, {
        strategy: strategy.name,
        success: false,
        duration,
        timestamp: Date.now(),
        error: healError instanceof Error ? healError.message : String(healError),
      });

      // Increment attempt counter
      this.healingAttempts.set(errorKey, attempts + 1);

      console.error('[SelfHealing] Healing attempt failed:', {
        errorKey,
        strategy: strategy.name,
        duration,
        error: healError,
        attempts: attempts + 1,
      });

      // Check if we should escalate
      if (attempts + 1 >= this.maxHealingAttempts) {
        this.escalateError(error, context);
      }

      return false;
    }
  }

  /**
   * Find a suitable healing strategy for the error
   */
  private findStrategy(
    error: EnrichedError,
    context: ErrorContext
  ): HealingStrategy | undefined {
    for (const strategy of this.strategies.values()) {
      try {
        if (strategy.canHandle(error, context)) {
          return strategy;
        }
      } catch (checkError) {
        console.error(`[SelfHealing] Strategy check failed: ${strategy.name}`, {
          error: checkError,
        });
      }
    }
    return undefined;
  }

  /**
   * Generate a unique key for error tracking
   */
  private generateErrorKey(error: EnrichedError, context: ErrorContext): string {
    const parts = [
      error.code || 'unknown',
      error.category || 'unknown',
      context.component || '',
      context.sessionId || '',
    ];
    return parts.filter(Boolean).join(':');
  }

  /**
   * Record a healing attempt in history
   */
  private recordHealingAttempt(errorKey: string, attempt: HealingAttempt): void {
    const history = this.healingHistory.get(errorKey) || [];
    history.push(attempt);

    // Keep only last 10 attempts per error key
    if (history.length > 10) {
      history.shift();
    }

    this.healingHistory.set(errorKey, history);
  }

  /**
   * Escalate error after max healing attempts
   */
  private escalateError(error: EnrichedError, context: ErrorContext): void {
    const errorKey = this.generateErrorKey(error, context);
    const history = this.healingHistory.get(errorKey) || [];

    console.error('[SelfHealing] Escalating error:', {
      errorKey,
      errorCode: error.code,
      message: error.message,
      attempts: this.healingAttempts.get(errorKey),
      history: history.map((h) => ({
        strategy: h.strategy,
        success: h.success,
        duration: h.duration,
      })),
    });

    // Dispatch escalation event for monitoring systems to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('error-escalated', {
          detail: {
            error,
            context,
            errorKey,
            healingHistory: history,
          },
        })
      );
    }

    // Reset counter after escalation
    this.healingAttempts.delete(errorKey);
  }

  /**
   * Get healing history for an error
   */
  getHealingHistory(errorKey: string): HealingAttempt[] {
    return this.healingHistory.get(errorKey) || [];
  }

  /**
   * Get healing statistics
   */
  getStatistics(): {
    totalAttempts: number;
    successfulHealing: number;
    failedHealing: number;
    strategiesUsed: Record<string, number>;
  } {
    let totalAttempts = 0;
    let successfulHealing = 0;
    let failedHealing = 0;
    const strategiesUsed: Record<string, number> = {};

    for (const history of this.healingHistory.values()) {
      for (const attempt of history) {
        totalAttempts++;
        if (attempt.success) {
          successfulHealing++;
        } else {
          failedHealing++;
        }
        strategiesUsed[attempt.strategy] = (strategiesUsed[attempt.strategy] || 0) + 1;
      }
    }

    return {
      totalAttempts,
      successfulHealing,
      failedHealing,
      strategiesUsed,
    };
  }

  /**
   * Reset all healing state (useful for testing)
   */
  reset(): void {
    this.healingAttempts.clear();
    this.healingHistory.clear();
    console.log('[SelfHealing] Reset all healing state');
  }
}