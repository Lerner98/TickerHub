# TickerHub Senior-Level Restructuring Plan

## Objective
Transform the existing working codebase into a production-grade, senior-level architecture while:
- **Preserving ALL existing functionality** (app works perfectly as-is)
- **NOT changing UI/theme** (locked per design guidelines)
- **Improving code organization, security, and maintainability**
- **Preparing for future stock market expansion**

---

## Current State Analysis

### What Works (DO NOT BREAK)
- All 11 API endpoints functional
- CoinGecko, Etherscan, Blockchain.info integrations
- In-memory caching with TTL
- Fallback mock data when APIs unavailable
- Full React frontend with TanStack Query
- Wouter routing (7 pages)
- Cyber Matrix theme with animations

### What Needs Improvement
1. **Monolithic routes.ts** (694 lines) - all logic in one file
2. **No input validation** on API parameters
3. **No rate limiting** for API protection
4. **No centralized error handling**
5. **Cache logic duplicated** throughout routes
6. **No health check endpoint**
7. **API constants scattered** in routes file
8. **No request timeout middleware**

---

## Phase 1: Server Restructuring (Backend)

### 1.1 New Folder Structure
```
server/
├── index.ts                 # Express app entry (minimal changes)
├── routes.ts                # Route aggregator (replaces monolith)
├── static.ts                # Keep as-is
├── vite.ts                  # Keep as-is
├── storage.ts               # Keep as-is
│
├── api/
│   ├── index.ts             # Aggregates all route modules
│   ├── crypto/
│   │   ├── routes.ts        # /api/prices, /api/chart
│   │   └── service.ts       # CoinGecko API calls
│   ├── blockchain/
│   │   ├── routes.ts        # /api/network, /api/blocks, /api/block
│   │   ├── ethereum.service.ts  # Etherscan API calls
│   │   └── bitcoin.service.ts   # Blockchain.info API calls
│   ├── explorer/
│   │   ├── routes.ts        # /api/tx, /api/address
│   │   └── service.ts       # Transaction/Address lookups
│   └── stats/
│       └── routes.ts        # /api/stats, /api/health
│
├── lib/
│   ├── cache.ts             # Extracted caching logic (generic)
│   ├── apiClient.ts         # fetchWithTimeout + error handling
│   ├── constants.ts         # API URLs, TTLs, config
│   └── logger.ts            # Structured logging utility
│
├── middleware/
│   ├── errorHandler.ts      # Centralized error handling
│   ├── rateLimiter.ts       # Rate limiting (simple in-memory)
│   ├── requestLogger.ts     # Request/response logging
│   └── validateParams.ts    # Input validation with Zod
│
└── types/
    └── api.ts               # API-specific types (extends shared/schema)
```

### 1.2 Implementation Order

**Step 1: Create lib/ utilities (no breaking changes)**
- Extract `cache.ts` from routes.ts cache logic
- Extract `apiClient.ts` (fetchWithTimeout)
- Create `constants.ts` with API URLs and TTLs
- Create `logger.ts` for structured logging

**Step 2: Create middleware/ (no breaking changes)**
- Create `errorHandler.ts` - centralized try/catch
- Create `rateLimiter.ts` - simple token bucket
- Create `validateParams.ts` - Zod schemas for params
- Create `requestLogger.ts` - extract from index.ts

**Step 3: Create api/ modules (gradual migration)**
- Create `api/crypto/service.ts` - extract CoinGecko calls
- Create `api/crypto/routes.ts` - /api/prices, /api/chart
- Create `api/blockchain/ethereum.service.ts` - Etherscan calls
- Create `api/blockchain/bitcoin.service.ts` - Blockchain.info calls
- Create `api/blockchain/routes.ts` - /api/network, /api/blocks, /api/block
- Create `api/explorer/service.ts` - tx/address lookups
- Create `api/explorer/routes.ts` - /api/tx, /api/address
- Create `api/stats/routes.ts` - /api/stats + new /api/health
- Create `api/index.ts` - aggregates all routers

**Step 4: Update entry points**
- Update `routes.ts` to use new api/index.ts
- Update `index.ts` to use new middleware
- Keep old routes.ts as backup until verified

---

## Phase 2: Detailed File Contents

### 2.1 lib/constants.ts
```typescript
// API Base URLs
export const API_URLS = {
  COINGECKO: 'https://api.coingecko.com/api/v3',
  ETHERSCAN: 'https://api.etherscan.io/v2/api',
  BLOCKCHAIN: 'https://blockchain.info',
} as const;

// Cache TTLs (milliseconds)
export const CACHE_TTL = {
  PRICES: 60_000,        // 1 minute
  CHART: 300_000,        // 5 minutes
  NETWORK: 30_000,       // 30 seconds
  BLOCKS: 15_000,        // 15 seconds
  BLOCK: 300_000,        // 5 minutes
  TRANSACTION: 600_000,  // 10 minutes
  ADDRESS: 60_000,       // 1 minute
  STATS: 300_000,        // 5 minutes
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10_000,       // 10 seconds
  RATE_LIMIT: {
    WINDOW_MS: 60_000,   // 1 minute
    MAX_REQUESTS: 100,   // per window
  },
} as const;
```

### 2.2 lib/cache.ts
```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string, maxAge: number): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < maxAge) {
      return entry.data as T;
    }
    return null;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cache = new CacheService();
```

### 2.3 lib/apiClient.ts
```typescript
import { API_CONFIG } from './constants';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = API_CONFIG.TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchJson<T>(url: string, timeout?: number): Promise<T> {
  const response = await fetchWithTimeout(url, {}, timeout);
  if (!response.ok) {
    throw new ApiError(`API error: ${response.status}`, response.status);
  }
  return response.json();
}
```

### 2.4 middleware/errorHandler.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/apiClient';
import { log } from '../index';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    log(`API Error: ${err.message} [${err.statusCode}]`, 'error');
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Unexpected errors
  log(`Unexpected Error: ${err.message}`, 'error');
  console.error(err.stack);

  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
  });
}
```

### 2.5 middleware/rateLimiter.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { API_CONFIG } from '../lib/constants';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const clients = new Map<string, RateLimitEntry>();

export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let entry = clients.get(clientIp);

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + API_CONFIG.RATE_LIMIT.WINDOW_MS,
    };
  }

  entry.count++;
  clients.set(clientIp, entry);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', API_CONFIG.RATE_LIMIT.MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, API_CONFIG.RATE_LIMIT.MAX_REQUESTS - entry.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

  if (entry.count > API_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    });
    return;
  }

  next();
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of clients.entries()) {
    if (now > entry.resetTime) {
      clients.delete(ip);
    }
  }
}, 60_000);
```

### 2.6 middleware/validateParams.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
export const schemas = {
  chain: z.enum(['bitcoin', 'ethereum']),
  coinId: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  timeRange: z.enum(['1D', '7D', '30D', '90D', '1Y']),
  blockNumber: z.string().regex(/^\d+$/),
  txHash: z.string().regex(/^(0x)?[a-fA-F0-9]{64}$/),
  address: z.string().min(26).max(62),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  page: z.coerce.number().int().min(1).default(1),
};

export function validate<T extends z.ZodSchema>(
  schema: T,
  source: 'params' | 'query' = 'params'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({
        error: 'Invalid parameters',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req[source] = result.data;
    next();
  };
}
```

### 2.7 api/crypto/service.ts
```typescript
import { fetchJson } from '../../lib/apiClient';
import { API_URLS } from '../../lib/constants';
import type { PriceData, ChartDataPoint } from '@shared/schema';

export async function fetchPrices(): Promise<PriceData[]> {
  const url = `${API_URLS.COINGECKO}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h`;

  const data = await fetchJson<any[]>(url);

  return data.map((coin) => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    image: coin.image,
    price: coin.current_price,
    priceChange24h: coin.price_change_24h,
    priceChangePercentage24h: coin.price_change_percentage_24h,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume,
    high24h: coin.high_24h,
    low24h: coin.low_24h,
    sparkline: coin.sparkline_in_7d?.price?.filter((_: unknown, i: number) => i % 4 === 0) || [],
  }));
}

export async function fetchChart(coinId: string, range: string): Promise<ChartDataPoint[]> {
  const days = { '1D': 1, '7D': 7, '30D': 30, '90D': 90, '1Y': 365 }[range] || 7;
  const url = `${API_URLS.COINGECKO}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

  const data = await fetchJson<{ prices: [number, number][] }>(url);

  const interval = Math.max(1, Math.floor(data.prices.length / 100));
  return data.prices
    .filter((_, i) => i % interval === 0)
    .map(([timestamp, price]) => ({
      timestamp: Math.floor(timestamp / 1000),
      price,
    }));
}
```

### 2.8 api/crypto/routes.ts
```typescript
import { Router } from 'express';
import { cache } from '../../lib/cache';
import { CACHE_TTL } from '../../lib/constants';
import * as cryptoService from './service';

const router = Router();

router.get('/prices', async (req, res, next) => {
  try {
    const cacheKey = 'prices';
    const cached = cache.get(cacheKey, CACHE_TTL.PRICES);
    if (cached) {
      return res.json(cached);
    }

    const prices = await cryptoService.fetchPrices();
    cache.set(cacheKey, prices);
    res.json(prices);
  } catch (error) {
    next(error);
  }
});

router.get('/chart/:coinId/:range', async (req, res, next) => {
  try {
    const { coinId, range } = req.params;
    const cacheKey = `chart-${coinId}-${range}`;
    const cached = cache.get(cacheKey, CACHE_TTL.CHART);
    if (cached) {
      return res.json(cached);
    }

    const chartData = await cryptoService.fetchChart(coinId, range);
    cache.set(cacheKey, chartData);
    res.json(chartData);
  } catch (error) {
    next(error);
  }
});

export default router;
```

### 2.9 api/index.ts (Route Aggregator)
```typescript
import { Router } from 'express';
import cryptoRoutes from './crypto/routes';
import blockchainRoutes from './blockchain/routes';
import explorerRoutes from './explorer/routes';
import statsRoutes from './stats/routes';

const router = Router();

// Mount all API routes
router.use('/api', cryptoRoutes);
router.use('/api', blockchainRoutes);
router.use('/api', explorerRoutes);
router.use('/api', statsRoutes);

export default router;
```

---

## Phase 3: Security Improvements

### 3.1 Input Validation
- All route parameters validated with Zod schemas
- Block numbers: numeric only
- Transaction hashes: valid hex format
- Addresses: valid length and format
- Chain: enum of 'bitcoin' | 'ethereum'

### 3.2 Rate Limiting
- 100 requests per minute per IP
- Returns 429 with retry-after header
- In-memory (suitable for single instance)

### 3.3 Error Handling
- No stack traces in production
- Consistent error response format
- Operational vs programmer errors

### 3.4 Headers
- X-RateLimit-* headers
- Proper CORS (already handled by Vite proxy)

---

## Phase 4: Health Check & Monitoring

### 4.1 New Endpoint: GET /api/health
```typescript
router.get('/health', async (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      coingecko: await checkCoingecko(),
      etherscan: await checkEtherscan(),
      blockchain: await checkBlockchain(),
    },
  };

  const allHealthy = Object.values(checks.services).every(s => s.status === 'ok');
  res.status(allHealthy ? 200 : 503).json(checks);
});
```

---

## Phase 5: Testing Strategy

### 5.1 Manual Testing Checklist
After each phase, verify:
- [ ] `npm run dev` starts successfully
- [ ] Dashboard loads with crypto prices
- [ ] Price charts render correctly
- [ ] Explorer shows blocks for both chains
- [ ] Block details page works
- [ ] Transaction lookup works
- [ ] Address lookup works
- [ ] Network stats display correctly
- [ ] Search functionality works
- [ ] No console errors

### 5.2 API Contract Tests (Optional)
If time permits, add simple integration tests:
```typescript
// tests/api.test.ts
describe('API Endpoints', () => {
  test('GET /api/prices returns array', async () => {
    const res = await fetch('http://localhost:5000/api/prices');
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
  // ... more tests
});
```

---

## Implementation Timeline

### Step-by-Step Order:
1. **lib/constants.ts** - No dependencies, safe to add
2. **lib/cache.ts** - Generic cache, no changes to existing code
3. **lib/apiClient.ts** - fetchWithTimeout extraction
4. **lib/logger.ts** - Optional logging utility
5. **middleware/errorHandler.ts** - Centralized error handling
6. **middleware/rateLimiter.ts** - Rate limiting
7. **middleware/validateParams.ts** - Input validation schemas
8. **api/crypto/service.ts** - CoinGecko service
9. **api/crypto/routes.ts** - Prices + chart routes
10. **api/blockchain/ethereum.service.ts** - Etherscan service
11. **api/blockchain/bitcoin.service.ts** - Blockchain.info service
12. **api/blockchain/routes.ts** - Network + blocks routes
13. **api/explorer/service.ts** - Tx + address services
14. **api/explorer/routes.ts** - Explorer routes
15. **api/stats/routes.ts** - Stats + health
16. **api/index.ts** - Route aggregator
17. **Update routes.ts** - Use new aggregator
18. **Update index.ts** - Add middleware
19. **Delete old routes.ts** - After verification

---

## Risk Mitigation

### Backup Strategy
- Keep original `routes.ts` as `routes.backup.ts` until fully verified
- Can instantly rollback by reverting routes.ts import

### Rollback Plan
If any issues:
1. Rename `routes.ts` to `routes.new.ts`
2. Rename `routes.backup.ts` to `routes.ts`
3. Remove middleware from index.ts
4. App returns to original state

---

## Success Criteria

1. **Functionality**: All existing features work identically
2. **Structure**: Clean separation of concerns
3. **Security**: Input validation + rate limiting active
4. **Maintainability**: Each module < 150 lines
5. **Extensibility**: Easy to add stock market routes later
6. **Health**: /api/health endpoint responds correctly

---

## Notes

- **NO UI CHANGES** - Theme and components remain untouched
- **API contracts preserved** - Same request/response formats
- **Cache keys unchanged** - Frontend TanStack Query unaffected
- **Gradual migration** - One module at a time, test after each
