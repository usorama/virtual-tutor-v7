/**
 * Exponential Backoff Retry Handler
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Provides configurable exponential backoff logic for WebSocket reconnections
 * with jitter to prevent thundering herd problems.
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
  backoffFactor: number;
}

export interface RetryAttempt {
  attempt: number;
  delay: number;
  timestamp: number;
  reason?: string;
}

export class ExponentialBackoff {
  private readonly config: RetryConfig;
  private attempts: RetryAttempt[] = [];
  private currentAttempt = 0;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 10,
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      jitter: config.jitter ?? true,
      backoffFactor: config.backoffFactor ?? 2
    };
  }

  /**
   * Calculate the next retry delay
   */
  getNextDelay(): number {
    if (this.currentAttempt >= this.config.maxAttempts) {
      throw new Error('Maximum retry attempts exceeded');
    }

    // Calculate exponential backoff delay
    const exponentialDelay = this.config.baseDelay *
      Math.pow(this.config.backoffFactor, this.currentAttempt);

    // Apply maximum delay limit
    let delay = Math.min(exponentialDelay, this.config.maxDelay);

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
      delay = Math.max(0, delay + jitter);
    }

    return Math.floor(delay);
  }

  /**
   * Record a retry attempt
   */
  recordAttempt(reason?: string): RetryAttempt {
    const delay = this.getNextDelay();
    const attempt: RetryAttempt = {
      attempt: this.currentAttempt + 1,
      delay,
      timestamp: Date.now(),
      reason
    };

    this.attempts.push(attempt);
    this.currentAttempt++;

    return attempt;
  }

  /**
   * Check if more retries are allowed
   */
  canRetry(): boolean {
    return this.currentAttempt < this.config.maxAttempts;
  }

  /**
   * Reset the retry counter (on successful connection)
   */
  reset(): void {
    this.currentAttempt = 0;
    this.attempts = [];
  }

  /**
   * Get retry statistics
   */
  getStats(): {
    totalAttempts: number;
    remainingAttempts: number;
    averageDelay: number;
    totalDelay: number;
    config: RetryConfig;
  } {
    const totalDelay = this.attempts.reduce((sum, attempt) => sum + attempt.delay, 0);
    const averageDelay = this.attempts.length > 0 ? totalDelay / this.attempts.length : 0;

    return {
      totalAttempts: this.currentAttempt,
      remainingAttempts: Math.max(0, this.config.maxAttempts - this.currentAttempt),
      averageDelay,
      totalDelay,
      config: { ...this.config }
    };
  }

  /**
   * Get all recorded attempts
   */
  getAttempts(): RetryAttempt[] {
    return [...this.attempts];
  }

  /**
   * Create a promise that resolves after the calculated delay
   */
  async wait(reason?: string): Promise<RetryAttempt> {
    if (!this.canRetry()) {
      throw new Error('Maximum retry attempts exceeded');
    }

    const attempt = this.recordAttempt(reason);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(attempt);
      }, attempt.delay);
    });
  }

  /**
   * Calculate expected time until next retry
   */
  getTimeUntilNextRetry(): number {
    if (!this.canRetry()) {
      return 0;
    }

    try {
      return this.getNextDelay();
    } catch {
      return 0;
    }
  }

  /**
   * Get human-readable retry status
   */
  getStatusMessage(): string {
    const stats = this.getStats();

    if (!this.canRetry()) {
      return `Maximum retry attempts (${this.config.maxAttempts}) exceeded`;
    }

    if (this.currentAttempt === 0) {
      return 'No retry attempts yet';
    }

    const nextDelay = this.getTimeUntilNextRetry();
    return `Attempt ${this.currentAttempt}/${this.config.maxAttempts}, next retry in ${nextDelay}ms`;
  }
}