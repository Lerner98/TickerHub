# TickerHub API Testing Strategy

**Document Type:** Internal Reference
**Last Updated:** 2025-12-08
**Purpose:** Minimize API usage in dev/test while ensuring production reliability

---

## Core Principle

> **Never waste an API call. Every request should either:**
> 1. Serve a real user in production
> 2. Validate a specific integration that can't be mocked
> 3. Be cached and reused for subsequent tests

---

## Environment Modes

### 1. Development Mode (`NODE_ENV=development`)

**Default Behavior:**
- Use mock data for ALL external APIs
- Zero external API calls unless explicitly testing integration
- Hot reload with cached responses
- Full debug logging

**When Real APIs Used:**
- Manual trigger: `?real=true` query param
- Integration test suite only
- Explicit environment variable: `USE_REAL_API=true`

### 2. Test Mode (`NODE_ENV=test`)

**Default Behavior:**
- 100% mock data
- Deterministic responses
- Fast execution (no network latency)
- Snapshot-based validation

**Real API Tests:**
- Separate test suite: `npm run test:integration`
- Run manually before releases
- CI runs only on `main` branch merges

### 3. Production Mode (`NODE_ENV=production`)

**Behavior:**
- Real APIs with aggressive caching
- Fallback to mock on API failure
- Rate limit tracking
- Health monitoring

---

## Mock Data Strategy

### Mock Data Location

```
server/
├── mocks/
│   ├── coingecko/
│   │   ├── prices.json         # GET /api/prices response
│   │   ├── chart-bitcoin-7d.json
│   │   └── chart-ethereum-30d.json
│   ├── etherscan/
│   │   ├── block-latest.json
│   │   ├── block-19000000.json
│   │   └── transactions.json
│   ├── blockchain/
│   │   ├── latestblock.json
│   │   └── rawblock.json
│   ├── finnhub/
│   │   ├── quote-AAPL.json
│   │   ├── quote-TSLA.json
│   │   └── candles.json
│   └── index.ts                # Mock loader utility
```

### Mock Data Rules

1. **Snapshot Real Data Once**
   ```bash
   # One-time capture of real API response
   curl "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=20" \
     > server/mocks/coingecko/prices.json
   ```

2. **Keep Mocks Updated Quarterly**
   - Prices will be stale, that's OK for testing
   - Structure must match current API version
   - Document last update date in mock file

3. **Use Realistic Edge Cases**
   - Include null values where APIs return them
   - Include error responses for error handling tests
   - Include rate limit responses

### Mock Loader Implementation

```typescript
// server/mocks/index.ts
import { readFileSync } from 'fs';
import { join } from 'path';

const MOCKS_DIR = join(__dirname);

export function loadMock<T>(provider: string, filename: string): T {
  const path = join(MOCKS_DIR, provider, filename);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function shouldUseMock(): boolean {
  // Development: Always mock unless explicitly disabled
  if (process.env.NODE_ENV === 'development') {
    return process.env.USE_REAL_API !== 'true';
  }

  // Test: Always mock
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  // Production: Never mock (use real APIs)
  return false;
}
```

### Service Pattern

```typescript
// server/api/crypto/service.ts
import { loadMock, shouldUseMock } from '../../mocks';
import { fetchJson } from '../../lib/apiClient';

export async function fetchPrices(): Promise<CryptoPrice[]> {
  // Check mock mode first
  if (shouldUseMock()) {
    return loadMock('coingecko', 'prices.json');
  }

  // Real API call (production only, or explicit dev request)
  return fetchJson(`${API_URLS.COINGECKO}/coins/markets?...`);
}
```

---

## Caching Strategy

### Cache Layers

```
Request → Memory Cache → Mock Data → External API
              ↓              ↓            ↓
         (fastest)      (no network)  (last resort)
```

### Cache-First Pattern

```typescript
export async function fetchWithCache<T>(
  cacheKey: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // 1. Check memory cache
  const cached = cache.get<T>(cacheKey, ttl);
  if (cached) {
    log(`Cache HIT: ${cacheKey}`, 'cache', 'debug');
    return cached;
  }

  // 2. Check mock mode
  if (shouldUseMock()) {
    const mock = getMockForKey(cacheKey);
    if (mock) {
      cache.set(cacheKey, mock);
      return mock;
    }
  }

  // 3. Fetch from real API
  const data = await fetcher();
  cache.set(cacheKey, data);
  return data;
}
```

### TTL Strategy by Data Type

| Data Type | Dev TTL | Prod TTL | Rationale |
|-----------|---------|----------|-----------|
| Prices | ∞ (mock) | 60s | Real-time important |
| Charts | ∞ (mock) | 5min | Historical, less volatile |
| Blocks | ∞ (mock) | 15s | New blocks ~12s (ETH) |
| Network Stats | ∞ (mock) | 30s | Changes frequently |
| Stock Quotes | ∞ (mock) | 60s | Market hours only |

---

## Integration Test Strategy

### Test Categories

| Category | Mock/Real | When to Run | API Calls |
|----------|-----------|-------------|-----------|
| Unit Tests | Mock | Every commit | 0 |
| Component Tests | Mock | Every commit | 0 |
| Integration Tests | Real | Pre-release | ~50-100 |
| E2E Tests | Mock | Every commit | 0 |
| Smoke Tests | Real | Post-deploy | ~10 |

### Integration Test Suite

```typescript
// tests/integration/api.test.ts
describe('External API Integration', () => {
  // Skip in CI unless explicitly enabled
  const shouldRun = process.env.RUN_INTEGRATION === 'true';

  beforeAll(() => {
    if (!shouldRun) {
      console.log('Skipping integration tests (set RUN_INTEGRATION=true)');
    }
  });

  it.skipIf(!shouldRun)('CoinGecko prices endpoint responds', async () => {
    const response = await fetch(`${COINGECKO_URL}/ping`);
    expect(response.ok).toBe(true);
  });

  it.skipIf(!shouldRun)('Etherscan block endpoint responds', async () => {
    const response = await fetch(`${ETHERSCAN_URL}?module=proxy&action=eth_blockNumber`);
    expect(response.ok).toBe(true);
  });
});
```

### Running Integration Tests

```bash
# Local: Run with real APIs (uses your rate limit)
RUN_INTEGRATION=true npm run test:integration

# CI: Only on main branch, after hours
# See .github/workflows/integration.yml
```

---

## WebSocket Strategy

### Development Mode

```typescript
// WebSocket mock server for development
class MockWebSocketServer {
  private interval: NodeJS.Timeout | null = null;

  start() {
    // Emit mock price updates every 5 seconds
    this.interval = setInterval(() => {
      this.emit('price', {
        symbol: 'BTC',
        price: 45000 + Math.random() * 1000,
        timestamp: Date.now()
      });
    }, 5000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }
}
```

### Production Mode

```typescript
// Real WebSocket with reconnection
class PriceWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;

  connect() {
    // Only connect in production
    if (process.env.NODE_ENV !== 'production') {
      return new MockWebSocketServer();
    }

    this.ws = new WebSocket(FINNHUB_WS_URL);
    this.ws.onmessage = this.handleMessage;
    this.ws.onclose = this.handleReconnect;
  }
}
```

---

## API Budget Tracking

### Monthly Budget (Free Tiers)

| Provider | Monthly Limit | Daily Budget | Alert At |
|----------|---------------|--------------|----------|
| CoinGecko | ~10,000 | 333/day | 250/day |
| Etherscan | 100,000 | 3,333/day | 2,500/day |
| Finnhub | 60/min = 86,400/day | N/A | 50/min |
| Gemini | 15 RPM = 21,600/day | N/A | 12 RPM |
| Groq | 30 RPM = 43,200/day | N/A | 24 RPM |

### Tracking Implementation

```typescript
// server/lib/apiUsage.ts
interface UsageTracker {
  [provider: string]: {
    calls: number;
    windowStart: number;
    dailyCalls: number;
    dayStart: number;
  };
}

const usage: UsageTracker = {};

export function trackApiCall(provider: string): void {
  const now = Date.now();

  if (!usage[provider]) {
    usage[provider] = {
      calls: 0,
      windowStart: now,
      dailyCalls: 0,
      dayStart: now
    };
  }

  // Reset minute window
  if (now - usage[provider].windowStart > 60_000) {
    usage[provider].calls = 0;
    usage[provider].windowStart = now;
  }

  // Reset daily counter
  if (now - usage[provider].dayStart > 86_400_000) {
    usage[provider].dailyCalls = 0;
    usage[provider].dayStart = now;
  }

  usage[provider].calls++;
  usage[provider].dailyCalls++;

  // Log warning if approaching limit
  checkLimits(provider);
}
```

---

## Specific Test Scenarios

### When Real API is Required

| Scenario | Why | Frequency |
|----------|-----|-----------|
| API version upgrade | Contract validation | On upgrade |
| New endpoint integration | Verify response format | Once |
| Rate limit behavior | Understand throttling | Once |
| Error response format | Handle edge cases | Once |
| Authentication flow | Verify credentials | On key rotation |

### When Mock is Sufficient

| Scenario | Why |
|----------|-----|
| UI development | Only need data shape |
| Unit tests | Testing our logic, not theirs |
| CI pipeline | Speed and reliability |
| Demo/presentation | Predictable data |
| Offline development | No network required |

---

## Quick Reference

### Environment Variables

```bash
# Development (default: mocks)
NODE_ENV=development
USE_REAL_API=false  # Set to 'true' to use real APIs

# Testing (always mocks)
NODE_ENV=test

# Production (always real)
NODE_ENV=production
```

### npm Scripts

```bash
npm run dev              # Mock data, fast reload
npm run dev:real         # Real APIs (burns rate limit)
npm run test             # All mocked, fast
npm run test:integration # Real APIs, run sparingly
npm run build            # Production build
```

### Decision Tree

```
Is this a unit test?
  → YES: Use mock
  → NO: Continue

Is this UI development?
  → YES: Use mock
  → NO: Continue

Is this validating API contract?
  → YES: Use real API (one-time)
  → NO: Use mock

Is this production?
  → YES: Use real API + cache
  → NO: Use mock
```

---

## Implementation Checklist

- [ ] Create `server/mocks/` directory structure
- [ ] Snapshot current API responses to mock files
- [ ] Add `shouldUseMock()` utility
- [ ] Refactor services to check mock mode
- [ ] Add `npm run dev:real` script
- [ ] Create integration test suite
- [ ] Add API usage tracking
- [ ] Document mock data update process
