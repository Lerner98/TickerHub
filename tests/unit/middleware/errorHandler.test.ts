/**
 * Error Handler Middleware Unit Tests
 *
 * Tests centralized error handling for API endpoints.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { errorHandler, asyncHandler, notFoundHandler } from '../../../server/middleware/errorHandler';
import { ApiError } from '../../../server/lib/apiClient';
import type { Request, Response, NextFunction } from 'express';

// Mock logger to prevent console output during tests
vi.mock('../../../server/lib/logger', () => ({
  logError: vi.fn(),
}));

describe('errorHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusCode: number;
  let jsonResponse: unknown;

  beforeEach(() => {
    vi.clearAllMocks();

    statusCode = 200;
    jsonResponse = null;

    mockReq = {
      method: 'GET',
      path: '/api/test',
    };

    mockRes = {
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

  it('should handle ApiError with correct status code', () => {
    const error = new ApiError('Not found', 404);

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusCode).toBe(404);
    expect(jsonResponse).toEqual({
      error: 'Not found',
      statusCode: 404,
    });
  });

  it('should handle ApiError with 500 status code', () => {
    const error = new ApiError('Server error', 500);

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusCode).toBe(500);
    expect(jsonResponse).toEqual({
      error: 'Server error',
      statusCode: 500,
    });
  });

  it('should handle generic Error with 500 status in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Something went wrong');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusCode).toBe(500);
    expect(jsonResponse).toEqual({
      error: 'Something went wrong',
      statusCode: 500,
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should hide error details in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Sensitive internal error message');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(statusCode).toBe(500);
    expect(jsonResponse).toEqual({
      error: 'Internal server error',
      statusCode: 500,
    });

    process.env.NODE_ENV = originalEnv;
  });
});

describe('asyncHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { method: 'GET', path: '/api/test' };
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  it('should call the wrapped function', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);

    wrapped(mockReq as Request, mockRes as Response, mockNext);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });
  });

  it('should call next with error when async function throws', async () => {
    const error = new Error('Async error');
    const handler = vi.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(handler);

    wrapped(mockReq as Request, mockRes as Response, mockNext);

    await vi.waitFor(() => {
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  it('should not call next when async function succeeds', async () => {
    const handler = vi.fn().mockResolvedValue({ data: 'success' });
    const wrapped = asyncHandler(handler);

    wrapped(mockReq as Request, mockRes as Response, mockNext);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalled();
    });

    // Give it a moment to ensure next wasn't called with an error
    await new Promise((r) => setTimeout(r, 10));
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('notFoundHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusCode: number;
  let jsonResponse: unknown;

  beforeEach(() => {
    statusCode = 200;
    jsonResponse = null;

    mockReq = {
      path: '/unknown-route',
    };

    mockRes = {
      status: vi.fn((code: number) => {
        statusCode = code;
        return mockRes as Response;
      }),
      json: vi.fn((data: unknown) => {
        jsonResponse = data;
        return mockRes as Response;
      }),
    };
  });

  it('should return 404 with path info', () => {
    notFoundHandler(mockReq as Request, mockRes as Response);

    expect(statusCode).toBe(404);
    expect(jsonResponse).toEqual({
      error: 'Not found',
      statusCode: 404,
      path: '/unknown-route',
    });
  });
});
