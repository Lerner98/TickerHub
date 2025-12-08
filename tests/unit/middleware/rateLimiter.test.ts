/**
 * Rate Limiter Middleware Unit Tests
 *
 * Tests the rate limiting functionality for API endpoints.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimiter } from '../../../server/middleware/rateLimiter';
import type { Request, Response, NextFunction } from 'express';

// Mock the constants to control rate limit values
vi.mock('../../../server/lib/constants', () => ({
  API_CONFIG: {
    RATE_LIMIT: {
      WINDOW_MS: 60_000,
      MAX_REQUESTS: 5, // Low limit for testing
    },
  },
}));

describe('rateLimiter middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let headers: Record<string, string | number>;
  let statusCode: number;
  let jsonResponse: unknown;

  beforeEach(() => {
    vi.clearAllMocks();

    headers = {};
    statusCode = 200;
    jsonResponse = null;

    mockReq = {
      path: '/api/test',
      ip: `test-ip-${Math.random()}`, // Unique IP per test
      socket: { remoteAddress: undefined } as any,
    };

    mockRes = {
      setHeader: vi.fn((key: string, value: string | number) => {
        headers[key] = value;
        return mockRes as Response;
      }),
      status: vi.fn((code: number) => {
        statusCode = code;
        return mockRes as Response;
      }),
      json: vi.fn((data: unknown) => {
        jsonResponse = data;
        return mockRes as Response;
      }),
    };

    mockNext = vi.fn();
  });

  it('should call next() for non-API routes', () => {
    mockReq.path = '/some-page';

    rateLimiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.setHeader).not.toHaveBeenCalled();
  });

  it('should allow requests under rate limit', () => {
    rateLimiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(headers['X-RateLimit-Limit']).toBe(5);
    expect(headers['X-RateLimit-Remaining']).toBe(4);
    expect(headers['X-RateLimit-Reset']).toBeDefined();
  });

  it('should decrement remaining count with each request', () => {
    // First request
    rateLimiter(mockReq as Request, mockRes as Response, mockNext);
    expect(headers['X-RateLimit-Remaining']).toBe(4);

    // Second request (same IP)
    rateLimiter(mockReq as Request, mockRes as Response, mockNext);
    expect(headers['X-RateLimit-Remaining']).toBe(3);

    // Third request
    rateLimiter(mockReq as Request, mockRes as Response, mockNext);
    expect(headers['X-RateLimit-Remaining']).toBe(2);
  });

  it('should block requests when rate limit exceeded', () => {
    // Make MAX_REQUESTS + 1 requests
    for (let i = 0; i <= 5; i++) {
      rateLimiter(mockReq as Request, mockRes as Response, mockNext);
    }

    expect(statusCode).toBe(429);
    expect(jsonResponse).toEqual({
      error: 'Too many requests',
      retryAfter: expect.any(Number),
      statusCode: 429,
    });
    expect(headers['Retry-After']).toBeDefined();
  });

  it('should set correct rate limit headers', () => {
    rateLimiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
  });

  it('should use socket.remoteAddress when ip is undefined', () => {
    mockReq.ip = undefined;
    mockReq.socket = { remoteAddress: '192.168.1.1' } as any;

    rateLimiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle missing IP gracefully', () => {
    mockReq.ip = undefined;
    mockReq.socket = { remoteAddress: undefined } as any;

    rateLimiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should track different IPs separately', () => {
    // First IP
    mockReq.ip = 'ip-1';
    for (let i = 0; i < 3; i++) {
      rateLimiter(mockReq as Request, mockRes as Response, mockNext);
    }
    expect(headers['X-RateLimit-Remaining']).toBe(2);

    // Second IP should have fresh limit
    mockReq.ip = 'ip-2';
    rateLimiter(mockReq as Request, mockRes as Response, mockNext);
    expect(headers['X-RateLimit-Remaining']).toBe(4);
  });
});
