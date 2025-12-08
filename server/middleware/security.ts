/**
 * Security Middleware Configuration
 *
 * Implements OWASP Top 10 security controls:
 * - A03: Injection Prevention (via Zod validation in validateParams.ts)
 * - A05: Security Misconfiguration (Helmet.js headers)
 * - A07: XSS Protection (CSP headers)
 *
 * @module server/middleware/security
 * @see https://owasp.org/www-project-top-ten/
 */

import helmet from 'helmet';
import cors from 'cors';
import type { RequestHandler } from 'express';

/**
 * Environment-aware configuration
 */
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = IS_PRODUCTION
  ? [
      process.env.APP_URL || 'https://tickerhub.com',
      // Add additional production origins as needed
    ]
  : [
      'http://localhost:5000',
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5173',
    ];

/**
 * Helmet.js Security Headers Configuration
 *
 * Provides protection against:
 * - XSS attacks (X-XSS-Protection, CSP)
 * - Clickjacking (X-Frame-Options)
 * - MIME sniffing (X-Content-Type-Options)
 * - Information disclosure (X-Powered-By removal)
 *
 * @see https://helmetjs.github.io/
 */
export const securityHeaders: RequestHandler = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Vite HMR in dev
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for inline styles
      imgSrc: ["'self'", 'data:', 'https:'], // Allow external images (coin logos)
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: [
        "'self'",
        // External APIs we connect to
        'https://api.coingecko.com',
        'https://api.etherscan.io',
        'https://blockchain.info',
        'https://finnhub.io', // Future: Stock market
        // WebSocket for Vite HMR in development
        ...(IS_PRODUCTION ? [] : ['ws://localhost:5173', 'ws://127.0.0.1:5173']),
      ],
      frameSrc: ["'none'"], // Prevent embedding in iframes
      objectSrc: ["'none'"], // Prevent Flash/plugins
      upgradeInsecureRequests: IS_PRODUCTION ? [] : null, // Force HTTPS in production
    },
  },

  // Prevent clickjacking
  frameguard: { action: 'deny' },

  // Prevent MIME type sniffing
  noSniff: true,

  // Remove X-Powered-By header
  hidePoweredBy: true,

  // Strict Transport Security (HTTPS only)
  hsts: IS_PRODUCTION
    ? {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      }
    : false,

  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // XSS Filter (legacy browsers)
  xssFilter: true,

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },

  // IE No Open
  ieNoOpen: true,

  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Disable for external resources
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow external resources
});

/**
 * CORS Configuration
 *
 * Implements Cross-Origin Resource Sharing controls:
 * - Whitelist allowed origins
 * - Restrict HTTP methods
 * - Limit exposed headers
 * - Configure credentials handling
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
 */
export const corsMiddleware: RequestHandler = cors({
  // Dynamic origin validation
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else if (!IS_PRODUCTION) {
      // Allow all origins in development for easier testing
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'OPTIONS'],

  // Allowed request headers
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],

  // Headers exposed to the client
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After',
  ],

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Preflight cache duration (24 hours)
  maxAge: 86400,

  // Pass preflight response to next handler
  preflightContinue: false,

  // Provide 204 for OPTIONS requests
  optionsSuccessStatus: 204,
});

/**
 * Security headers for API responses
 * Additional headers not covered by Helmet
 */
export function apiSecurityHeaders(): RequestHandler {
  return (_req, res, next) => {
    // Prevent caching of sensitive API responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    next();
  };
}

/**
 * Request sanitization middleware
 * Removes potentially dangerous characters from query parameters
 */
export function sanitizeRequest(): RequestHandler {
  return (req, _res, next) => {
    // Sanitize query parameters
    if (req.query) {
      for (const key of Object.keys(req.query)) {
        const value = req.query[key];
        if (typeof value === 'string') {
          // Remove null bytes and control characters
          req.query[key] = value.replace(/[\x00-\x1f\x7f]/g, '');
        }
      }
    }

    // Sanitize URL parameters
    if (req.params) {
      for (const key of Object.keys(req.params)) {
        const value = req.params[key];
        if (typeof value === 'string') {
          req.params[key] = value.replace(/[\x00-\x1f\x7f]/g, '');
        }
      }
    }

    next();
  };
}
