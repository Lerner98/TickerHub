# Security Documentation

TickerHub implements comprehensive security controls aligned with OWASP Top 10 2021 guidelines.

---

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [OWASP Compliance Matrix](#owasp-compliance-matrix)
3. [Security Middleware](#security-middleware)
4. [Input Validation](#input-validation)
5. [External API Security](#external-api-security)
6. [Security Headers](#security-headers)
7. [Rate Limiting](#rate-limiting)
8. [Error Handling](#error-handling)
9. [Security Checklist](#security-checklist)
10. [Reporting Vulnerabilities](#reporting-vulnerabilities)

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Security Middleware Stack                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Request → Helmet.js → CORS → Sanitize → Rate Limit → Validate → Route │
│                                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │  Security   │  │    Input     │  │   External    │  │   Error     │ │
│  │   Headers   │  │  Validation  │  │  API Client   │  │  Handling   │ │
│  │  (Helmet)   │  │    (Zod)     │  │(SSRF Protect) │  │ (Sanitized) │ │
│  └─────────────┘  └──────────────┘  └───────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## OWASP Compliance Matrix

| OWASP Top 10 2021 | Status | Implementation |
|-------------------|--------|----------------|
| A01 - Broken Access Control | ✅ N/A | Public API, no authentication required |
| A02 - Cryptographic Failures | ✅ OK | No sensitive data stored; HTTPS enforced in production |
| A03 - Injection | ✅ Protected | Zod schema validation on all parameters |
| A04 - Insecure Design | ✅ OK | Defense-in-depth architecture |
| A05 - Security Misconfiguration | ✅ Protected | Helmet.js, CORS, CSP headers |
| A06 - Vulnerable Components | ✅ Monitored | Regular npm audit, minimal dependencies |
| A07 - Auth Failures | ✅ N/A | No authentication system |
| A08 - Software Integrity | ✅ OK | npm ci in CI/CD, lockfile validation |
| A09 - Logging & Monitoring | ✅ OK | Structured logging, error tracking |
| A10 - SSRF | ✅ Protected | URL allowlist, private IP blocking |

---

## Security Middleware

### Middleware Order (Critical)

```typescript
// server/index.ts - Order matters for security!

// 1. Security headers (first - applies to all responses)
app.use(securityHeaders);

// 2. CORS (block unauthorized origins early)
app.use(corsMiddleware);

// 3. Request sanitization (clean input before processing)
app.use(sanitizeRequest());

// 4. API security headers (additional headers for /api routes)
app.use('/api', apiSecurityHeaders());

// 5. Body parsing with size limits (prevent payload attacks)
app.use(express.json({ limit: '10kb' }));

// 6. Rate limiting (prevent abuse)
app.use(rateLimiter);

// 7. Route handlers with validation
// 8. Error handling (last - catches all errors)
app.use(errorHandler);
```

---

## Input Validation

### Zod Schema Validation

All API endpoints use Zod schemas for strict input validation:

```typescript
// server/middleware/validateParams.ts

// Blockchain chain - enumerated values only
chain: z.enum(['bitcoin', 'ethereum'])

// Coin ID - alphanumeric with hyphens, max 100 chars
coinId: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/)

// Transaction hash - 64 hex chars with optional 0x prefix
txHash: z.string().regex(/^(0x)?[a-fA-F0-9]{64}$/)

// Address - Ethereum or Bitcoin format
address: z.string().regex(/^(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/)

// Pagination - bounded integers
limit: z.coerce.number().int().min(1).max(100).default(25)
page: z.coerce.number().int().min(1).default(1)
```

### Validation Response Format

Invalid requests receive a standardized 400 response:

```json
{
  "error": "Validation failed",
  "message": "One or more parameters are invalid",
  "details": {
    "chain": ["Chain must be \"bitcoin\" or \"ethereum\""]
  },
  "statusCode": 400
}
```

---

## External API Security

### SSRF Protection

All external API requests are validated against an allowlist:

```typescript
// server/lib/apiClient.ts

const ALLOWED_HOSTS = new Set([
  'api.coingecko.com',
  'api.etherscan.io',
  'blockchain.info',
  'finnhub.io',
  'api.finnhub.io',
]);

function isAllowedUrl(url: string): boolean {
  // 1. Parse URL
  const parsed = new URL(url);

  // 2. Check allowlist
  if (!ALLOWED_HOSTS.has(parsed.hostname)) return false;

  // 3. Block private IPs
  if (hostname === 'localhost' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.')) return false;

  // 4. HTTPS only in production
  if (NODE_ENV === 'production' && parsed.protocol !== 'https:') return false;

  return true;
}
```

### Request Timeouts

All external requests have configurable timeouts:

```typescript
const API_CONFIG = {
  TIMEOUT: 10000, // 10 seconds default
};

// AbortController for timeout enforcement
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);
```

---

## Security Headers

### Helmet.js Configuration

```typescript
// server/middleware/security.ts

helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...ALLOWED_API_HOSTS],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});
```

### Response Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | See above | Prevent XSS, data injection |
| `X-Frame-Options` | DENY | Prevent clickjacking |
| `X-Content-Type-Options` | nosniff | Prevent MIME sniffing |
| `X-XSS-Protection` | 1; mode=block | Legacy XSS filter |
| `Strict-Transport-Security` | max-age=31536000 | Force HTTPS |
| `Referrer-Policy` | strict-origin-when-cross-origin | Limit referrer leakage |
| `X-Download-Options` | noopen | Prevent IE file execution |

---

## Rate Limiting

### Configuration

```typescript
// server/lib/constants.ts

RATE_LIMIT: {
  WINDOW_MS: 60_000,    // 1 minute window
  MAX_REQUESTS: 100,    // 100 requests per window
}
```

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699920060
```

### Rate Limited Response (429)

```json
{
  "error": "Too many requests",
  "retryAfter": 45,
  "statusCode": 429
}
```

---

## Error Handling

### Production Error Sanitization

Sensitive information is never leaked in production:

```typescript
// server/middleware/errorHandler.ts

const message = process.env.NODE_ENV === 'production'
  ? 'Internal server error'  // Generic message
  : err.message;             // Detailed in development
```

### Error Response Format

```json
{
  "error": "Internal server error",
  "statusCode": 500
}
```

---

## Security Checklist

### Pre-Deployment

- [ ] Run `npm audit` - no high/critical vulnerabilities
- [ ] Environment variables set (API keys, secrets)
- [ ] HTTPS configured via reverse proxy
- [ ] CORS origins configured for production domain
- [ ] Rate limit values appropriate for expected traffic

### Production Monitoring

- [ ] Health check endpoint accessible: `/api/health`
- [ ] Error logs monitored for anomalies
- [ ] Rate limiting metrics reviewed
- [ ] External API connectivity verified

### Periodic Review

- [ ] Monthly: `npm audit` for new vulnerabilities
- [ ] Quarterly: Review OWASP Top 10 compliance
- [ ] Annually: Full security audit

---

## File Reference

| File | Purpose |
|------|---------|
| `server/middleware/security.ts` | Helmet, CORS, sanitization |
| `server/middleware/validateParams.ts` | Zod input validation |
| `server/middleware/rateLimiter.ts` | Rate limiting |
| `server/middleware/errorHandler.ts` | Error handling |
| `server/lib/apiClient.ts` | SSRF protection |
| `server/lib/logger.ts` | Structured logging |

---

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email security concerns to the repository owner
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)

We aim to respond within 48 hours and will work with you to address the issue.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-08 | Initial security implementation |
