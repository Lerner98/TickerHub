import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';

// =============================================================================
// Better Auth Configuration
// =============================================================================
//
// This is the central auth configuration for TickerHub.
// Better Auth handles:
// - Email/password authentication
// - Google OAuth authentication
// - Session management
// - CSRF protection
//
// CRITICAL: The auth handler MUST be mounted BEFORE express.json() middleware
// in server/index.ts, or API requests will hang.
//
// =============================================================================

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  // Email + password authentication
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  // Social providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },

  // Session configuration - Short sessions for security
  // Since we don't have persistent user data (no working watchlists yet),
  // keeping sessions short reduces attack surface
  session: {
    expiresIn: 60 * 60, // 1 hour - security focused
    updateAge: 60 * 15, // Refresh session every 15 minutes of activity
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Trust proxy for secure cookies behind reverse proxy
  trustedOrigins: [
    'http://localhost:5000',
    'http://localhost:3000',
    process.env.APP_URL || '',
  ].filter(Boolean),
});

// Export type for client-side usage
export type Auth = typeof auth;
