/**
 * Auth Hook
 *
 * Provides authentication state and methods for the application.
 * Wraps Better Auth's useSession with additional convenience methods.
 */

import { useCallback } from 'react';
import {
  useSession,
  signIn,
  signUp,
  signOut,
  type User,
} from '@/lib/auth-client';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => void;
}

export type UseAuthReturn = AuthState & AuthActions;

/**
 * Hook for accessing authentication state and actions
 *
 * @example
 * ```tsx
 * function Profile() {
 *   const { user, isAuthenticated, isLoading, login, logout } = useAuth();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!isAuthenticated) return <LoginForm onSubmit={login} />;
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user.name}!</p>
 *       <button onClick={logout}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const {
    data: session,
    isPending: isLoading,
    error,
    refetch,
  } = useSession();

  const user = session?.user ?? null;
  const isAuthenticated = !!user;

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn.email({
      email,
      password,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Login failed');
    }

    // Refetch session after login
    refetch();
  }, [refetch]);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Registration failed');
      }

      // Refetch session after registration
      refetch();
    },
    [refetch]
  );

  const logout = useCallback(async () => {
    await signOut();
    // Refetch session after logout
    refetch();
  }, [refetch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error: error ?? null,
    login,
    register,
    logout,
    refetch,
  };
}

export default useAuth;
