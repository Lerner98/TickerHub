import type { Request, Response, NextFunction } from 'express';
import { API_CONFIG } from '../lib/constants';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const clients = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter
 * Limits requests per IP address within a time window
 */
export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip rate limiting for non-API routes
  if (!req.path.startsWith('/api')) {
    next();
    return;
  }

  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let entry = clients.get(clientIp);

  // Reset if window has passed
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + API_CONFIG.RATE_LIMIT.WINDOW_MS,
    };
  }

  entry.count++;
  clients.set(clientIp, entry);

  // Set rate limit headers
  const remaining = Math.max(0, API_CONFIG.RATE_LIMIT.MAX_REQUESTS - entry.count);
  res.setHeader('X-RateLimit-Limit', API_CONFIG.RATE_LIMIT.MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

  // Check if rate limit exceeded
  if (entry.count > API_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      error: 'Too many requests',
      retryAfter,
      statusCode: 429,
    });
    return;
  }

  next();
}

/**
 * Cleanup old rate limit entries periodically
 * Prevents memory leaks from stale entries
 */
function cleanupRateLimitEntries(): void {
  const now = Date.now();
  const entries = Array.from(clients.entries());
  for (const [ip, entry] of entries) {
    if (now > entry.resetTime) {
      clients.delete(ip);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupRateLimitEntries, 60_000);
