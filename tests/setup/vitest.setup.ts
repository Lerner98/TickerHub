/**
 * Vitest Global Setup
 *
 * Configures the test environment before tests run.
 * - Sets up MSW server lifecycle
 * - Adds testing-library matchers for component tests
 */

import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './msw/server';

// Extend Vitest matchers with jest-dom for component tests
import '@testing-library/jest-dom/vitest';

// =============================================================================
// MSW SERVER LIFECYCLE
// =============================================================================

beforeAll(() => {
  // Start MSW server before all tests
  // Use 'bypass' for local requests (Supertest), 'error' only for external APIs
  server.listen({
    onUnhandledRequest: (request, print) => {
      const url = new URL(request.url);

      // Allow local requests (Supertest creates in-memory server on 127.0.0.1)
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
        return; // Bypass without warning
      }

      // Error on unhandled external requests
      print.error();
    },
  });
});

afterEach(() => {
  // Reset handlers to default between tests
  // This ensures test isolation - one test's overrides don't affect others
  server.resetHandlers();
});

afterAll(() => {
  // Clean up MSW server after all tests complete
  server.close();
});

// =============================================================================
// GLOBAL TEST CONFIGURATION
// =============================================================================

// Suppress console.error for expected errors in tests
// Uncomment if needed:
// const originalConsoleError = console.error;
// beforeAll(() => {
//   console.error = (...args: unknown[]) => {
//     if (args[0]?.toString().includes('Expected error')) return;
//     originalConsoleError(...args);
//   };
// });
// afterAll(() => {
//   console.error = originalConsoleError;
// });
