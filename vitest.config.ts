import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node', // Default: fast for API tests
    // Selectively use jsdom for React component tests (needs DOM APIs)
    environmentMatchGlobs: [
      ['tests/components/**', 'jsdom'],
    ],
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Phase 2.5: Focus on server API coverage first
      // Client coverage will be added when component tests are written
      include: ['server/**/*.ts'],
      exclude: [
        '**/mocks/**',
        '**/*.d.ts',
        '**/index.ts',
        'server/vite.ts',           // Dev-only Vite integration
        'server/static.ts',         // Static file serving (production)
        'server/storage.ts',        // In-memory storage (placeholder)
        'server/routes.ts',         // Route registration (trivial)
        'server/api/blockchain/**', // TODO: Add tests in future phase
        'server/api/explorer/**',   // TODO: Add tests in future phase
      ],
      reporter: ['text', 'html', 'json'],
      thresholds: {
        // Thresholds for tested API modules
        statements: 60,
        branches: 45,
        functions: 60,
        lines: 60,
      },
    },
    sequence: { shuffle: false },
  },
});
