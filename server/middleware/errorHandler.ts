import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/apiClient';
import { logError } from '../lib/logger';

/**
 * Centralized error handling middleware
 * Catches all errors and returns consistent error responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle known API errors
  if (err instanceof ApiError) {
    logError(err, `API Error on ${req.method} ${req.path}`);
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Handle unexpected errors
  logError(err, `Unexpected error on ${req.method} ${req.path}`);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(500).json({
    error: message,
    statusCode: 500,
  });
}

/**
 * Wrapper for async route handlers to catch errors
 * Passes errors to the error handling middleware
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not found',
    statusCode: 404,
    path: req.path,
  });
}
