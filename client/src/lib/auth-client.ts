/**
 * Better Auth React Client
 *
 * Creates the auth client for React with all auth methods and hooks.
 * The client communicates with the Better Auth server at /api/auth/*.
 *
 * @see https://www.better-auth.com/docs/concepts/client
 */

import { createAuthClient } from 'better-auth/react';

// Create the auth client
// Since our auth server is on the same domain, we don't need baseURL
const authClient = createAuthClient({
  // baseURL is optional when auth server is on same origin
  // Our Express server handles /api/auth/* routes
});

// Export individual methods and hooks for convenience
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  // Account management
  updateUser,
  changePassword,
  deleteUser,
  // Social account linking
  linkSocial,
  unlinkAccount,
  listAccounts,
} = authClient;

// Export the full client for advanced use cases
export { authClient };

// =============================================================================
// Type Exports
// =============================================================================

export type Session = NonNullable<ReturnType<typeof useSession>['data']>;
export type User = Session['user'];
