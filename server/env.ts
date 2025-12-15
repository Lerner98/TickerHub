/**
 * Environment Configuration Loader
 *
 * This file MUST be imported first in server/index.ts to ensure
 * environment variables are available before any other modules load.
 */

import { config } from 'dotenv';

// Load .env file from project root
config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`[env] ERROR: Missing required environment variable: ${envVar}`);
    console.error(`[env] Make sure your .env file exists and contains ${envVar}`);
    process.exit(1);
  }
}

// Log loaded optional env vars for debugging
const optionalEnvVars = ['FINNHUB_API_KEY', 'finnhub_API_key', 'TWELVE_DATA_API_KEY', 'GOOGLE_CLIENT_ID'];
for (const envVar of optionalEnvVars) {
  if (process.env[envVar]) {
    console.log(`[env] ${envVar}: configured`);
  }
}
