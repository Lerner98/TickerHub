import { type Request, type Response, type NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth';

// Extend Express Request to include session and user
declare global {
  namespace Express {
    interface Request {
      session?: {
        id: string;
        userId: string;
        token: string;
        expiresAt: Date;
      };
      user?: {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
        image?: string | null;
      };
    }
  }
}

/**
 * Middleware that requires authentication.
 * Attaches session and user to request if authenticated.
 * Returns 401 if not authenticated.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    // Attach session and user to request for downstream handlers
    req.session = session.session;
    req.user = session.user;

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify authentication',
    });
  }
}

/**
 * Optional auth middleware - attaches user if present but doesn't require it.
 * Useful for routes that behave differently for logged-in users.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session) {
      req.session = session.session;
      req.user = session.user;
    }

    next();
  } catch (error) {
    // Don't fail on auth errors for optional auth
    console.warn('[Auth Middleware] Optional auth error:', error);
    next();
  }
}
