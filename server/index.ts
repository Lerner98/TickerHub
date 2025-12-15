// Load environment variables FIRST - before any other imports
import './env';

import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import { serveStatic } from './static';
import { createServer } from 'http';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import {
  securityHeaders,
  corsMiddleware,
  apiSecurityHeaders,
  sanitizeRequest,
} from './middleware/security';
import { log, logRequest } from './lib/logger';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth';

const app = express();
const httpServer = createServer(app);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// =============================================================================
// Security Middleware (OWASP Top 10 Compliance)
// =============================================================================

// Helmet.js security headers (XSS, Clickjacking, MIME sniffing protection)
app.use(securityHeaders);

// CORS configuration (origin whitelist, method restrictions)
app.use(corsMiddleware);

// Request sanitization (remove control characters)
app.use(sanitizeRequest());

// API-specific security headers
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

app.use(
  express.json({
    limit: '10kb', // Prevent large payload attacks
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// =============================================================================
// Rate Limiting
// =============================================================================

app.use(rateLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      logRequest(req.method, path, res.statusCode, duration, capturedJsonResponse);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Centralized error handling
  app.use(errorHandler);

  // Setup static serving or Vite dev server
  if (process.env.NODE_ENV === 'production') {
    serveStatic(app);
  } else {
    const { setupVite } = await import('./vite');
    await setupVite(httpServer, app);
  }

  // Start server
  const port = parseInt(process.env.PORT || '5000', 10);
  httpServer.listen(port, 'localhost', () => {
    log(`serving on http://localhost:${port}`);
  });
})();

// Re-export log for backward compatibility
export { log };
