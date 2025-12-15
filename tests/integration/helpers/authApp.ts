/**
 * Express App Factory for Auth Testing
 *
 * Creates isolated Express app instances with auth support for testing.
 * Unlike the standard test app, this one:
 * - Mounts Better Auth handler BEFORE express.json() (critical for auth to work)
 * - Includes database connection for session/user verification
 *
 * This enables Supertest to test auth flows in-memory.
 */

import express, { type Express } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../../../server/auth';
import { errorHandler } from '../../../server/middleware/errorHandler';
import {
  securityHeaders,
  corsMiddleware,
  apiSecurityHeaders,
  sanitizeRequest,
} from '../../../server/middleware/security';
import apiRoutes from '../../../server/api';

/**
 * Creates a fresh Express app instance with auth support for testing
 *
 * The auth handler is mounted BEFORE express.json() to allow
 * Better Auth to parse the request body correctly.
 *
 * @returns Express application instance with auth
 */
export function createTestAppWithAuth(): Express {
  const app = express();

  // =============================================================================
  // Security Middleware
  // =============================================================================

  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(sanitizeRequest());
  app.use('/api', apiSecurityHeaders());

  // =============================================================================
  // Better Auth Handler (MUST come BEFORE express.json!)
  // =============================================================================
  // CRITICAL: Better Auth needs to parse request body itself.
  // If express.json() runs first, the auth handler receives an empty body and hangs.

  app.all('/api/auth/*', toNodeHandler(auth));

  // =============================================================================
  // Body Parsing Middleware
  // =============================================================================

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));

  // =============================================================================
  // API Routes (no rate limiter for tests)
  // =============================================================================

  app.use('/api', apiRoutes);

  // =============================================================================
  // Error Handling
  // =============================================================================

  app.use(errorHandler);

  return app;
}

/**
 * Test user credentials for auth tests
 * Use unique email per test run to avoid conflicts
 */
export function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}@tickerhub.test`,
    password: 'TestPassword123!',
    name: 'Test User',
  };
}

/**
 * Helper to sign up a test user and return session cookies
 *
 * @param app - Express app instance
 * @param user - User credentials (email, password, name)
 * @returns Session cookie string for authenticated requests
 */
export async function signUpAndGetCookies(
  app: Express,
  user: { email: string; password: string; name: string }
): Promise<string[]> {
  // Dynamic import to avoid loading supertest at module load time
  const { default: request } = await import('supertest');

  const response = await request(app)
    .post('/api/auth/sign-up/email')
    .send(user)
    .expect(200);

  // Extract set-cookie headers
  const cookies = response.headers['set-cookie'];
  if (!cookies) {
    throw new Error('No cookies returned from sign-up');
  }

  return Array.isArray(cookies) ? cookies : [cookies];
}

/**
 * Helper to sign in a test user and return session cookies
 *
 * @param app - Express app instance
 * @param user - User credentials (email, password)
 * @returns Session cookie string for authenticated requests
 */
export async function signInAndGetCookies(
  app: Express,
  user: { email: string; password: string }
): Promise<string[]> {
  const { default: request } = await import('supertest');

  const response = await request(app)
    .post('/api/auth/sign-in/email')
    .send(user)
    .expect(200);

  const cookies = response.headers['set-cookie'];
  if (!cookies) {
    throw new Error('No cookies returned from sign-in');
  }

  return Array.isArray(cookies) ? cookies : [cookies];
}
