import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle as drizzleWs } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../../shared/schema';
import * as authSchema from '../../shared/auth-schema';

// Configure WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

// DATABASE_URL is validated in server/env.ts before this module loads
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// =============================================================================
// Connection Strategy (Neon Best Practices)
// =============================================================================
//
// We use TWO connection types:
//
// 1. POOLED CONNECTION (DATABASE_URL with -pooler hostname)
//    - Used for: Express app runtime queries
//    - Why: Handles concurrent connections efficiently via Neon's pgbouncer
//    - Connection: WebSocket-based Pool for persistent connections
//
// 2. DIRECT CONNECTION (DATABASE_URL_UNPOOLED)
//    - Used for: Drizzle Kit migrations only (in drizzle.config.ts)
//    - Why: Poolers don't handle schema changes well
//    - Note: NOT used in this file - only for CLI migrations
//
// =============================================================================

// Create a WebSocket-based connection pool for the Express app
// This uses the POOLED connection string for better concurrency handling
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Merge schemas for full type awareness
const allSchemas = { ...schema, ...authSchema };

// Export the Drizzle ORM instance with full schema awareness
export const db = drizzleWs(pool, { schema: allSchemas });

// Export pool for manual connection management if needed
export { pool };

// Type export for use in other files
export type Database = typeof db;
