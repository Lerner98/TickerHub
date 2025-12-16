import { API_CONFIG } from './constants';

/**
 * API Client Module
 *
 * Provides secure HTTP client utilities for external API communication.
 * Implements OWASP security controls:
 * - A10:2021 SSRF Protection (URL allowlist validation)
 * - Request timeouts to prevent resource exhaustion
 * - Centralized error handling
 *
 * @module server/lib/apiClient
 * @see https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/
 */

/**
 * Allowed external API hosts for SSRF protection
 *
 * Only requests to these domains are permitted.
 * Add new hosts here when integrating additional APIs.
 */
const ALLOWED_HOSTS = new Set([
  'api.coingecko.com',
  'api.blockchair.com',
  'blockchain.info',
  // Stock data providers (dual-provider: Twelve Data primary, Finnhub fallback)
  'api.twelvedata.com',  // Primary: Twelve Data ($29/mo paid, best coverage)
  'finnhub.io',          // Fallback: Finnhub (free tier: 60 calls/min)
  // FMP - Market movers, company profiles, news
  'financialmodelingprep.com', // FMP: 250 calls/day free
  // AI providers
  'api.groq.com', // AI: Free tier fallback (30 RPM)
  'generativelanguage.googleapis.com', // AI: Gemini primary (15 RPM)
]);

/**
 * Validates that a URL is allowed for external requests
 *
 * Implements SSRF protection by:
 * 1. Parsing the URL to extract hostname
 * 2. Checking against allowlist of permitted hosts
 * 3. Rejecting private IP ranges and localhost
 *
 * @param url - The URL to validate
 * @returns true if URL is allowed, false otherwise
 *
 * @example
 * ```typescript
 * isAllowedUrl('https://api.coingecko.com/api/v3/ping'); // true
 * isAllowedUrl('http://localhost:8080/admin'); // false
 * isAllowedUrl('http://192.168.1.1/internal'); // false
 * ```
 */
function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS in production
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      return false;
    }

    // Check against allowlist
    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return false;
    }

    // Block private IP ranges (additional safety)
    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    return true;
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Custom error class for API-related errors
 *
 * Provides structured error information for consistent error handling.
 *
 * @property statusCode - HTTP status code
 * @property isOperational - Whether error is expected/recoverable
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Fetch with timeout and SSRF protection
 *
 * Wraps native fetch with:
 * - URL validation against allowlist (SSRF protection)
 * - Configurable timeout with AbortController
 * - Automatic request abortion on timeout
 *
 * @param url - The URL to fetch (must be in allowlist)
 * @param options - Standard fetch options
 * @param timeout - Request timeout in milliseconds
 * @returns Promise resolving to Response
 *
 * @throws {ApiError} 403 if URL is not in allowlist
 * @throws {ApiError} 408 if request times out
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = API_CONFIG.TIMEOUT
): Promise<Response> {
  // SSRF Protection: Validate URL against allowlist
  if (!isAllowedUrl(url)) {
    throw new ApiError(
      `Request to ${new URL(url).hostname} is not allowed`,
      403,
      true
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'TickerHub/1.0',
        Accept: 'application/json',
        ...options.headers,
      },
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch and parse JSON response
 *
 * Convenience wrapper that:
 * 1. Fetches URL with timeout and SSRF protection
 * 2. Validates response status
 * 3. Parses JSON body
 *
 * @template T - Expected response type
 * @param url - The URL to fetch
 * @param timeout - Request timeout in milliseconds
 * @returns Promise resolving to parsed JSON
 *
 * @throws {ApiError} On non-2xx response or parse error
 */
export async function fetchJson<T>(
  url: string,
  timeout: number = API_CONFIG.TIMEOUT
): Promise<T> {
  const response = await fetchWithTimeout(url, {}, timeout);

  if (!response.ok) {
    throw new ApiError(
      `API error: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

/**
 * Safe fetch that returns null on error
 *
 * Wraps fetchJson with error suppression for optional data fetching.
 * Useful when external API failure should not break the application.
 *
 * @template T - Expected response type
 * @param url - The URL to fetch
 * @param timeout - Request timeout in milliseconds
 * @returns Promise resolving to parsed JSON or null on error
 *
 * @example
 * ```typescript
 * const data = await safeFetch<PriceData>(url);
 * if (data) {
 *   // Use data
 * } else {
 *   // Use fallback
 * }
 * ```
 */
export async function safeFetch<T>(
  url: string,
  timeout: number = API_CONFIG.TIMEOUT
): Promise<T | null> {
  try {
    return await fetchJson<T>(url, timeout);
  } catch {
    return null;
  }
}
