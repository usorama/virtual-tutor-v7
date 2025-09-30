/**
 * ERR-005: Database Reconnection Healing Strategy
 * Automatically reconnects to database on connection errors
 */

import type { EnrichedError, ErrorContext } from '@/lib/monitoring/types';
import type { HealingStrategy } from './healing-strategy.interface';
import { matchesErrorPattern } from './healing-strategy.interface';
import { createClient } from '@/lib/supabase/client';

/**
 * Healing strategy for database connection errors
 *
 * Handles:
 * - Connection timeouts
 * - Connection pool exhaustion
 * - Network disconnections
 * - Connection closed errors
 */
export class DatabaseReconnectionStrategy implements HealingStrategy {
  readonly name = 'database-reconnection';

  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private readonly reconnectDelay = 1000; // Start with 1 second

  canHandle(error: EnrichedError, _context: ErrorContext): boolean {
    return matchesErrorPattern(error, {
      code: [
        'DATABASE_CONNECTION_ERROR',
        'DATABASE_ERROR',
        'NETWORK_ERROR',
        'API_TIMEOUT',
      ],
      message: /connection|timeout|ECONNREFUSED|pool|closed/i,
      category: ['connection', 'api'],
    });
  }

  async heal(error: EnrichedError, context: ErrorContext): Promise<void> {
    console.log(`[DatabaseReconnection] Attempting to heal database connection error`, {
      errorCode: error.code,
      message: error.message,
      attempt: this.reconnectAttempts + 1,
      maxAttempts: this.maxReconnectAttempts,
    });

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.reconnectAttempts = 0;
      throw new Error(
        `Database reconnection failed after ${this.maxReconnectAttempts} attempts`
      );
    }

    this.reconnectAttempts++;

    try {
      // Calculate exponential backoff delay
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      // Wait before attempting reconnection
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Attempt to create a new Supabase client connection
      // This will trigger a fresh connection to the database
      const supabase = createClient();

      // Test the connection with a simple query
      const { error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      if (testError) {
        throw new Error(`Database connection test failed: ${testError.message}`);
      }

      // Connection successful
      console.log(`[DatabaseReconnection] Successfully reconnected to database`, {
        attempts: this.reconnectAttempts,
        delay,
      });

      // Reset reconnection counter on success
      this.reconnectAttempts = 0;
    } catch (healError) {
      console.error(`[DatabaseReconnection] Reconnection attempt failed`, {
        attempt: this.reconnectAttempts,
        error: healError,
      });

      // If this was the last attempt, throw
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.reconnectAttempts = 0;
        throw healError;
      }

      // Otherwise, try again recursively
      return this.heal(error, context);
    }
  }

  /**
   * Reset the reconnection counter (useful for testing)
   */
  reset(): void {
    this.reconnectAttempts = 0;
  }
}