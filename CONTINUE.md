# TickerHub - Continuation Guide

> Created: December 8, 2025
> Branch: `feature/stock-market-expansion`
> Status: Phase 2.5 Testing Infrastructure IN PROGRESS

---

## What Was Completed

### Phase 1: Data Layer (DONE)
- Finnhub API integration with circuit breaker
- Mock data system for development
- StockAsset unified types
- `/api/stocks` endpoints fully functional

### Phase 2: UI Integration (DONE)
- `StockCard.tsx` - Matches PriceCard visual style
- `StockPage.tsx` - Detail view for individual stocks
- Dashboard stocks section - Shows top 10 stocks
- Header search dropdown - Searches stocks by symbol
- `useStocks` hooks - React Query integration
- ESM compatibility fixes for server modules

### Documentation (DONE)
- VSCode format-on-save documented in `claude.md`
- `docs/core-knowledge/DEVELOPMENT_EFFICIENCY.md`
- `docs/core-knowledge/CONTEXT_MANAGEMENT.md`

---

## Next Steps

### Phase 2.5: Testing Infrastructure (CURRENT)
**Goal:** Establish test harness before adding complexity. Prove "Production Ready" claim.

> **Rationale:** Adding Auth/DB without tests creates "Legacy Code" (code without tests).
> A Senior Developer never adds complex features to an untested codebase.

#### Selected Stack (Researched 2025-12-09)
| Tool | Purpose | Why |
|------|---------|-----|
| **Vitest** | Test runner | Native ESM, Vite integration, 1.5x faster than Jest |
| **Supertest** | API integration tests | In-memory Express testing (no network port opened) |
| **MSW** | External API mocking | Intercepts at network layer, reusable across environments |
| **@testing-library/react** | Component tests | User-behavior focused testing |
| **@vitest/coverage-v8** | Coverage | Fast native v8 coverage, identical to Istanbul since v3.2.0 |

#### Architecture: Two Test Layers

**1. API Integration Tests (Priority)**
- Test Express routes via Supertest (in-memory, no actual network)
- Mock external APIs (CoinGecko, Finnhub) via MSW
- Validates our "mock-first" architecture actually works
- Run sequentially (no parallelization for API tests)

**2. React Component Tests (Secondary)**
- Test key UI components (StockCard, PriceCard)
- Use React Testing Library
- Mock API responses via MSW

#### Folder Structure
```
tests/
├── setup/
│   ├── vitest.setup.ts      # Global test setup (MSW lifecycle)
│   └── msw/
│       ├── handlers.ts      # MSW request handlers (CoinGecko, Finnhub)
│       └── server.ts        # MSW server config
├── integration/
│   ├── api/
│   │   ├── stocks.test.ts   # /api/stocks endpoints
│   │   ├── prices.test.ts   # /api/prices endpoints
│   │   └── health.test.ts   # /api/health endpoint
│   └── helpers/
│       └── app.ts           # Express app factory for tests
└── components/
    ├── StockCard.test.tsx
    └── PriceCard.test.tsx
vitest.config.ts             # Vitest configuration
```

#### Dependencies to Install
```bash
npm install -D vitest @vitest/coverage-v8 supertest @types/supertest msw @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom vite-tsconfig-paths
```

#### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

#### Configuration: vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node', // Default: fast for API tests
    // Selectively use jsdom for React component tests (needs DOM APIs)
    environmentMatchGlobs: [
      ['tests/components/**', 'jsdom'],
    ],
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts', 'client/src/**/*.{ts,tsx}'],
      exclude: ['**/mocks/**', '**/*.d.ts'],
      reporter: ['text', 'html', 'json'],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
    sequence: { shuffle: false },
  },
});
```

**Note:** `environmentMatchGlobs` ensures API tests run fast in Node.js while component tests get the jsdom environment they need for DOM APIs (`document`, `window`).

#### MSW Setup: tests/setup/vitest.setup.ts
```typescript
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### Implementation Steps
- [ ] Install testing dependencies
- [ ] Create `vitest.config.ts`
- [ ] Create `tests/setup/vitest.setup.ts`
- [ ] Create MSW handlers for CoinGecko & Finnhub
- [ ] Create Express app factory for tests
- [ ] Write API integration tests for `/api/stocks`
- [ ] Write API integration tests for `/api/prices`
- [ ] Write API integration tests for `/api/health`
- [ ] Add coverage thresholds (70% minimum)
- [ ] Add `npm run test:coverage` to CI pipeline
- [ ] Write component tests for StockCard
- [ ] Write component tests for PriceCard

#### CI Integration
Add to `.github/workflows/deploy.yml` before build step:
```yaml
- name: Run tests
  run: npm run test:coverage
```

#### Sources
- [Vitest Guide](https://vitest.dev/guide/)
- [Vitest Coverage](https://vitest.dev/guide/coverage)
- [MSW Quick Start](https://mswjs.io/docs/quick-start/)
- [MSW Node.js Integration](https://mswjs.io/docs/integrations/node/)
- [goldbergyoni/nodejs-testing-best-practices](https://github.com/goldbergyoni/nodejs-testing-best-practices)
- [Supertest npm](https://www.npmjs.com/package/supertest)

---

### Phase 3: The Persistence Layer (User State)
**Goal:** Transition from a public dashboard to a personalized platform.

#### Selected Stack
| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Database** | **Neon** | Serverless Postgres. Scales to zero. **Note:** Free tier PITR is ~6 hours. |
| **ORM** | **Drizzle** | Type-safe. Zero-dependency on runtime. Uses standard SQL migrations. |
| **Auth** | **Better Auth** | Successor to Lucia. Self-hosted. Works natively with our ESM build. |

#### Technical Constraints & Standards

**1. Dual Connection Strategy (Critical for Neon+Drizzle):**
We must maintain two environment variables to prevent migration failures:
```env
DATABASE_URL=postgresql://...?sslmode=require           # Pooled - for App (port 6543)
DATABASE_URL_UNPOOLED=postgresql://...?sslmode=require  # Direct - for Drizzle Kit (port 5432)
```
- **Pooled connection:** Used by Express app for runtime queries (handles concurrency)
- **Direct connection:** Used by `drizzle-kit` for migrations (poolers hate schema changes)

**2. Migration Workflow:**
- Dev: `npm run db:generate` (Create SQL) → `npm run db:migrate` (Apply)
- **Rule:** No `db:push` in production. Ever.

**3. Backups:**
- **Constraint:** Neon Free Tier only supports ~6 hours of Point-in-Time Recovery (PITR)
- **Action:** For major milestones, perform manual `pg_dump` to local storage
- **Paid tiers:** Launch ($19/mo) = 7 days, Enterprise = 30 days

#### Database Schema (Initial)
```typescript
// server/db/schema.ts
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const watchlists = pgTable('watchlists', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  assetId: text('asset_id').notNull(),       // "AAPL" or "bitcoin"
  assetType: text('asset_type').notNull(),   // "stock" | "crypto"
  addedAt: timestamp('added_at').defaultNow(),
});
```

#### Files to Create
```
server/
├── db/
│   ├── index.ts          # Drizzle client (Neon connection)
│   ├── schema.ts         # Table definitions
│   └── migrate.ts        # Migration runner script
├── auth/
│   └── index.ts          # Better Auth configuration
└── api/
    └── watchlist/
        └── routes.ts     # CRUD endpoints (protected)
drizzle/
└── migrations/           # Generated SQL files
drizzle.config.ts         # Drizzle Kit configuration
```

#### Implementation Steps
- [x] **Pre-requisite:** Convert backend build to ESM (Completed 2025-12-09)
- [ ] **Infra:** Provision Neon project & get keys (Pooled + Direct)
- [ ] **Schema:** Define `users`, `sessions`, `verifications`, `watchlists`
- [ ] **Auth:** Mount Better Auth middleware
- [ ] **API:** Create CRUD endpoints for Watchlist
- [ ] **Test:** Neon connection from Docker container
- [ ] **CI/CD:** Confirm Drizzle migrations run in pipeline

---

### Phase 4: User Features (Requires Phase 3)
1. **Watchlist**
   - Save favorite assets (crypto + stocks)
   - Dashboard widget
   - Sync across devices

2. **Portfolio Tracking**
   - Track holdings and performance
   - P&L calculations
   - Diversification view

3. **Price Alerts**
   - Set price thresholds
   - Browser notifications (Service Worker)
   - Email notifications (optional)

### Phase 5: AI Integration
1. **Natural Language Queries**
   - "What's Apple stock doing today?"
   - "Compare TSLA vs BTC performance"
   - Use Gemini/Groq free tiers

2. **Market Insights**
   - AI-generated summaries
   - Trend detection
   - Anomaly alerts

### Phase 6: Advanced Features
1. **Stock Charts**
   - Historical price chart (Finnhub candles)
   - Timeframe selectors (1D, 1W, 1M, 3M, 1Y)

2. **Enhanced Search**
   - Search by company name
   - Combined crypto + stock results
   - Categorized results

3. **Multi-Asset Dashboard**
   - Custom layouts
   - Widget system

---

## Technical Debt to Address

1. **Stock Search by Name**
   - Current: Only matches symbol (AAPL, MSFT)
   - Fix: Also match against profile name

2. **Loading States**
   - Dashboard shows crypto loading only
   - Should combine: `isLoading = pricesLoading || stocksLoading`

3. **Error Handling in UI**
   - StockPage: Handle API errors gracefully
   - Show retry buttons

4. **Test Coverage**
   - Add tests for stock hooks
   - Add tests for StockCard component

---

## Architecture Considerations

### For AI Integration
- Use client-side API calls to Gemini/Groq
- Implement rate limiting on client
- Cache AI responses

### For Watchlist
- Start with localStorage
- Later: User auth + database storage
- Sync across devices (future)

### For Alerts
- Service Worker for background
- Push notifications API
- Fallback to polling

---

## Quick Start Tomorrow

```bash
# 1. Ensure on feature branch
git checkout feature/stock-market-expansion

# 2. Start dev server
npm run dev

# 3. Test stocks API
curl http://localhost:5000/api/stocks

# 4. View dashboard
# Open http://localhost:5000/dashboard
```

---

## Key Files for Reference

| File | Purpose |
|------|---------|
| `claude.md` | Project context + rules |
| `client/src/components/StockCard.tsx` | Stock card UI |
| `client/src/pages/StockPage.tsx` | Stock detail page |
| `client/src/components/layout/Header.tsx` | Search with dropdown |
| `server/api/stocks/service.ts` | Stock data service |
| `docs/STOCK_MARKET_EXPANSION.md` | Full expansion plan |

---

## Decision Points for Tomorrow

1. **Which Phase 3 feature first?**
   - Stock charts (visual impact)
   - Search enhancement (usability)
   - Watchlist (user value)

2. **AI Integration approach?**
   - Start simple: single query endpoint
   - Or build full conversational interface?

3. **When to merge to main?**
   - After Phase 3?
   - After basic AI integration?
   - Need production testing first?

---

## Notes

- Dev server runs on `http://localhost:5000`
- Mock data is active in development (10 stocks)
- VSCode format-on-save is active - work with it, not against it
- All stock APIs tested and working

---

## Long-Term Vision (Endgame)

### Differentiation Strategy
What makes TickerHub unique beyond "yet another dashboard":

1. **Cross-Asset Correlation Engine**
   - BTC vs NASDAQ correlation analysis
   - Hedging suggestions
   - Heatmap visualization
   - *Why:* Institutional feature in a retail package

2. **Time-Shifted Comparison**
   - Overlay historical patterns on current charts
   - "Compare AAPL post-earnings across 8 quarters"
   - Pattern matching / visual backtesting

3. **Smart Alerts with Context**
   - Not just "price hit $X"
   - "NVDA dropped 5% but sector is flat" (anomaly)
   - Volume spike detection

4. **Unified Tax Reports**
   - Export realized gains
   - Cost basis tracking across crypto + stocks
   - Multi-currency support

### The "4 Tabs → 1 Dashboard" Goal
Replace:
- Coinbase (crypto prices)
- Yahoo Finance (stocks)
- TradingView (charts)
- Spreadsheet (portfolio tracking)

### Infrastructure Scaling (When Needed)
- Redis for distributed caching
- Horizontal scaling considerations
- CDN for static assets

### Observability (Production)
- Error tracking (Sentry)
- Usage analytics
- Performance monitoring

---

## Sources & References

- [Better Auth Docs](https://www.better-auth.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs)
- [Neon PostgreSQL Docs](https://neon.com/docs)
- [Lucia Deprecation Notice](https://github.com/lucia-auth/lucia/discussions/1707)
- [Drizzle Migrations Guide](https://orm.drizzle.team/docs/migrations)
- [Neon Backup Guide](https://neon.com/docs/manage/backups)
