/**
 * Express App Factory for Testing
 *
 * Creates isolated Express app instances for each test.
 * Uses the same middleware stack as production but without:
 * - HTTP server binding
 * - Vite dev server
 * - Static file serving
 *
 * This enables Supertest to run tests in-memory without network ports.
 */

import express, { type Express } from 'express';
import { errorHandler } from '../../../server/middleware/errorHandler';
import {
  securityHeaders,
  corsMiddleware,
  apiSecurityHeaders,
  sanitizeRequest,
} from '../../../server/middleware/security';
import { rateLimiter } from '../../../server/middleware/rateLimiter';
import apiRoutes from '../../../server/api';

/**
 * Creates a fresh Express app instance for testing
 *
 * Each test gets an isolated app to prevent state leakage.
 * The app is configured with all production middleware but
 * runs in-memory via Supertest.
 *
 * @returns Express application instance
 *
 * @example
 * ```typescript
 * import { createTestApp } from '../helpers/app';
 * import request from 'supertest';
 *
 * describe('API Tests', () => {
 *   const app = createTestApp();
 *
 *   it('should return stocks', async () => {
 *     const response = await request(app).get('/api/stocks');
 *     expect(response.status).toBe(200);
 *   });
 * });
 * ```
 */
export function createTestApp(): Express {
  const app = express();

  // =============================================================================
  // Security Middleware (same as production)
  // =============================================================================

  // Helmet.js security headers
  app.use(securityHeaders);

  // CORS configuration
  app.use(corsMiddleware);

  // Request sanitization
  app.use(sanitizeRequest());

  // API-specific security headers
  app.use('/api', apiSecurityHeaders());

  // =============================================================================
  // Body Parsing Middleware
  // =============================================================================

  app.use(
    express.json({
      limit: '10kb',
    })
  );

  app.use(express.urlencoded({ extended: false, limit: '10kb' }));

  // =============================================================================
  // Rate Limiting (optional for tests - can be disabled per test)
  // =============================================================================

  // Note: Rate limiter is included but tests may need to mock or reset it
  app.use(rateLimiter);

  // =============================================================================
  // API Routes
  // =============================================================================

  app.use('/api', apiRoutes);

  // =============================================================================
  // Error Handling
  // =============================================================================

  app.use(errorHandler);

  return app;
}

/**
 * Creates a test app without rate limiting
 *
 * Use this when testing endpoints that might hit rate limits
 * during rapid test execution.
 *
 * @returns Express application instance without rate limiter
 */
export function createTestAppWithoutRateLimiting(): Express {
  const app = express();

  // Security middleware
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(sanitizeRequest());
  app.use('/api', apiSecurityHeaders());

  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));

  // API routes (no rate limiter)
  app.use('/api', apiRoutes);

  // Error handling
  app.use(errorHandler);

  return app;
}
