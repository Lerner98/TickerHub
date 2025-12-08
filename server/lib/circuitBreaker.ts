/**
 * Circuit Breaker Pattern Implementation (ADR-008)
 *
 * Prevents cascade failures by stopping calls to failing services.
 * Based on unified_ai_engineering_knowledge_system_v2.md Section 3.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Fast fail, reject all requests immediately
 * - HALF_OPEN: Test with single request to see if service recovered
 *
 * @module server/lib/circuitBreaker
 * @see https://martinfowler.com/bliki/CircuitBreaker.html
 */

import { log } from './logger';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

/**
 * Configuration for circuit breaker behavior
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Number of successes in HALF_OPEN to close circuit */
  successThreshold: number;
  /** Time in ms to wait before attempting reset (OPEN → HALF_OPEN) */
  resetTimeout: number;
  /** Optional name for logging */
  name: string;
}

/**
 * Default configuration for circuit breakers
 */
export const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 60_000, // 1 minute
  name: 'default',
};

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker "${name}" is OPEN - request rejected`);
    this.name = 'CircuitOpenError';
  }
}

/**
 * Circuit Breaker implementation
 *
 * Usage:
 * ```typescript
 * const breaker = new CircuitBreaker({ name: 'finnhub' });
 *
 * // Wrap external API calls
 * const data = await breaker.execute(() => fetchFinnhubQuote(symbol));
 * ```
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number | null;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Execute a function through the circuit breaker
   *
   * @param fn - Async function to execute
   * @returns Result of fn() if successful
   * @throws CircuitOpenError if circuit is open
   * @throws Original error if fn() fails
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we should attempt reset
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitOpenError(this.config.name);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Execute with fallback on circuit open or failure
   *
   * @param fn - Primary async function
   * @param fallback - Fallback function if primary fails or circuit is open
   * @returns Result from fn() or fallback()
   */
  async executeWithFallback<T>(
    fn: () => Promise<T>,
    fallback: () => T | Promise<T>
  ): Promise<T> {
    try {
      return await this.execute(fn);
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        log(`${this.config.name}: Circuit open, using fallback`, 'circuit', 'warn');
      } else {
        log(`${this.config.name}: Execution failed, using fallback`, 'circuit', 'warn');
      }
      return fallback();
    }
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.transitionTo(CircuitState.CLOSED);
    log(`${this.config.name}: Manually reset`, 'circuit', 'info');
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
        this.successCount = 0;
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open immediately opens circuit
      this.transitionTo(CircuitState.OPEN);
    } else if (
      this.state === CircuitState.CLOSED &&
      this.failureCount >= this.config.failureThreshold
    ) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Check if enough time has passed to attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime >= this.config.resetTimeout;
  }

  /**
   * Transition to new state with logging
   */
  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      log(
        `${this.config.name}: ${this.state} → ${newState}`,
        'circuit',
        newState === CircuitState.OPEN ? 'warn' : 'info'
      );
      this.state = newState;
    }
  }
}

// =============================================================================
// PRE-CONFIGURED CIRCUIT BREAKERS FOR EXTERNAL APIS
// =============================================================================

/**
 * Circuit breaker for CoinGecko API
 */
export const coingeckoBreaker = new CircuitBreaker({
  name: 'coingecko',
  failureThreshold: 3,
  resetTimeout: 60_000, // 1 minute
});

/**
 * Circuit breaker for Etherscan API
 */
export const etherscanBreaker = new CircuitBreaker({
  name: 'etherscan',
  failureThreshold: 3,
  resetTimeout: 60_000,
});

/**
 * Circuit breaker for Blockchain.info API
 */
export const blockchainBreaker = new CircuitBreaker({
  name: 'blockchain',
  failureThreshold: 3,
  resetTimeout: 60_000,
});

/**
 * Circuit breaker for Finnhub API (stocks)
 */
export const finnhubBreaker = new CircuitBreaker({
  name: 'finnhub',
  failureThreshold: 5,
  resetTimeout: 120_000, // 2 minutes (rate limits)
});

/**
 * Circuit breaker for Gemini AI API
 */
export const geminiBreaker = new CircuitBreaker({
  name: 'gemini',
  failureThreshold: 3,
  resetTimeout: 60_000,
});

/**
 * Circuit breaker for Groq AI API
 */
export const groqBreaker = new CircuitBreaker({
  name: 'groq',
  failureThreshold: 3,
  resetTimeout: 60_000,
});

/**
 * Get all circuit breaker stats for health check
 */
export function getAllCircuitStats(): Record<
  string,
  { state: CircuitState; failureCount: number }
> {
  return {
    coingecko: {
      state: coingeckoBreaker.getState(),
      failureCount: coingeckoBreaker.getStats().failureCount,
    },
    etherscan: {
      state: etherscanBreaker.getState(),
      failureCount: etherscanBreaker.getStats().failureCount,
    },
    blockchain: {
      state: blockchainBreaker.getState(),
      failureCount: blockchainBreaker.getStats().failureCount,
    },
    finnhub: {
      state: finnhubBreaker.getState(),
      failureCount: finnhubBreaker.getStats().failureCount,
    },
    gemini: {
      state: geminiBreaker.getState(),
      failureCount: geminiBreaker.getStats().failureCount,
    },
    groq: {
      state: groqBreaker.getState(),
      failureCount: groqBreaker.getStats().failureCount,
    },
  };
}
