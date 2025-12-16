# TickerHub - Continuation Guide

> **Last Updated:** December 16, 2025
> **Current Version:** 1.4.0
> **Status:** Phase 4 COMPLETE - Ready for Phase 4D (High-Value FMP Data)

---

## Current State Summary

### What's Working (v1.4.0)

| Feature | Status | Provider |
|---------|--------|----------|
| Stock Quotes | **DONE** | Twelve Data (primary) + Finnhub (fallback) |
| Stock Charts | **DONE** | Twelve Data (1D, 7D, 30D, 1Y) |
| Profile Enrichment | **DONE** | Finnhub (Market Cap, Sector) |
| **Market Movers** | **DONE** | FMP (gainers/losers/actives) |
| **Stock News** | **DONE** | FMP (per-symbol news) |
| **Company Profiles** | **DONE** | FMP (CEO, employees, description) |
| Crypto Prices | **DONE** | CoinGecko |
| Blockchain Explorer | **DONE** | Blockchair |
| Google OAuth | **DONE** | Better Auth |
| Watchlist | **DONE** | PostgreSQL + Drizzle |
| Market Hours | **DONE** | Client-side calculations |

### Recent Changes (v1.4.0)

1. **FMP Market Movers**: Real top gainers, losers, and most active stocks
2. **Stock News Tab**: Real news articles per stock with thumbnails
3. **Company Profile Tab**: Full company info (CEO, employees, description, dividends)
4. **TopStocksWithFilter**: Fetches real FMP data with local fallback

---

## Implementation Phases (Master Checklist)

> All phases with detailed step-by-step checklists

---

### Phase 4: FMP Integration (v1.4.0) - COMPLETE ✓

**Goal:** Real market movers + Stock News + Company Info + Earnings

> **Tested:** December 16, 2025 - All endpoints returning 200 OK

#### 4A: Market Movers ✓
- [x] Add `FMP_API_KEY` to `.env` and `.env.example`
- [x] Add `financialmodelingprep.com` to SSRF allowlist (`apiClient.ts`)
- [x] Create `server/api/stocks/fmpService.ts`
- [x] Implement `getTopGainers()` with 5min cache
- [x] Implement `getTopLosers()` with 5min cache
- [x] Implement `getMostActive()` with 5min cache
- [x] Add routes: `GET /api/stocks/movers/gainers`
- [x] Add routes: `GET /api/stocks/movers/losers`
- [x] Add routes: `GET /api/stocks/movers/actives`
- [x] Update `TopStocksWithFilter` to fetch real movers
- [x] Add fallback to local sorting if FMP unavailable
- [x] **TESTED** - Returns real market movers

#### 4B: Stock News ✓
- [x] Implement `getStockNews(symbol)` in fmpService
- [x] Add route: `GET /api/stocks/:symbol/news`
- [x] Create `NewsCard.tsx` component
- [x] Create `NewsList.tsx` component
- [x] Update StockPage News tab with real news
- [x] Add loading/empty states for news
- [x] **TESTED** - Returns real news articles

#### 4C: Company Info ✓
- [x] Implement `getCompanyProfile(symbol)` in fmpService
- [x] Add route: `GET /api/stocks/:symbol/profile`
- [x] Create `CompanyProfile.tsx` component
- [x] Add CEO, employees, description, website
- [x] Add dividend info if available
- [ ] Add analyst ratings (available in Phase 4D)
- [x] Update StockPage About tab
- [x] **TESTED** - Returns full company profiles

#### 4D: High-Value FMP Data (Retail Edge) - BACKEND COMPLETE ✓
> Maximize free tier (250 calls/day) for institutional-grade data. See [FMP.md](../FMP.md)
> **Backend Implemented:** December 16, 2025 - All services and routes ready

**Earnings & Calendar Events - Backend ✓**
- [x] `getEarningsCalendar(from, to)` - upcoming earnings dates with EPS estimates
- [x] `getStockEarnings(symbol)` - EPS estimates vs actuals
- [x] `getDividendCalendar(from, to)` - upcoming dividend payments
- [x] `getIPOCalendar(from, to)` - upcoming IPOs
- [x] `getStockSplitsCalendar(from, to)` - upcoming splits
- [x] Routes: `/api/stocks/calendar/earnings`, `/dividends`, `/ipos`, `/splits`
- [x] Route: `/api/stocks/:symbol/earnings` - per-stock earnings history
- [ ] Components: `EarningsCalendar`, `DividendCalendar`, `IPOCalendar`
- [ ] Dashboard widget: "Upcoming Events" unified calendar

**Analyst Intelligence (Free!) - Backend ✓**
- [x] `getAnalystEstimates(symbol)` - revenue/EPS projections
- [x] `getPriceTargetConsensus(symbol)` - high/low/median targets
- [x] `getPriceTargets(symbol)` - individual analyst targets
- [x] `getStockGrades(symbol)` - upgrade/downgrade history
- [x] `getGradeConsensus(symbol)` - buy/hold/sell distribution
- [x] Routes: `/api/stocks/:symbol/estimates`, `/price-target`, `/price-targets`, `/grades`, `/consensus`
- [ ] Components: `AnalystRatings`, `PriceTargetGauge`, `GradesHistory`
- [ ] StockPage: Add "Analyst" tab with all ratings data

**Market Performance & Sectors - Backend ✓**
- [x] `getSectorPerformance()` - sector heatmap data
- [x] Route: `/api/stocks/sectors`
- [ ] Components: `SectorHeatmap`, `IndustryPerformance`
- [ ] Dashboard: Sector performance widget

**News Aggregation - Backend ✓**
- [x] `getGeneralNews(limit)` - market-wide news feed
- [x] Route: `/api/stocks/news`
- [ ] Components: `MarketNews`
- [ ] Dashboard: Market news ticker/widget

**Financial Statements (Deep Dive) - Backend ✓**
- [x] `getIncomeStatement(symbol, period, limit)` - revenue, net income, margins
- [x] `getBalanceSheet(symbol, period, limit)` - assets, liabilities, equity
- [x] `getCashFlow(symbol, period, limit)` - operating/investing/financing cash
- [x] `getKeyMetrics(symbol, period, limit)` - P/E, EV/EBITDA, ROE, etc.
- [x] Routes: `/api/stocks/:symbol/income`, `/balance-sheet`, `/cash-flow`, `/metrics`
- [ ] Components: `FinancialsTable`, `RatiosCard`, `MetricsOverview`
- [ ] StockPage: Add "Financials" tab

**Institutional Tracking (13F) - Backend ✓**
- [x] `getInstitutionalHolders(symbol)` - who owns this stock
- [x] Route: `/api/stocks/:symbol/institutions`
- [ ] Components: `InstitutionalOwners`, `HedgeFundActivity`
- [ ] StockPage: Add to About tab or new "Ownership" tab

**AI Integration Points (for Gemini)**
> These FMP endpoints provide structured data perfect for AI analysis:
- Analyst estimates + price targets → AI can explain consensus
- Financial statements → AI can summarize health/trends
- Earnings transcripts → AI can extract key insights
- News + press releases → AI can summarize sentiment

**Phase 4D API Endpoints Summary:**
| Endpoint | Description |
|----------|-------------|
| `GET /api/stocks/sectors` | Sector performance for heatmap |
| `GET /api/stocks/news` | General market news |
| `GET /api/stocks/calendar/earnings` | Upcoming earnings (30 days) |
| `GET /api/stocks/calendar/dividends` | Upcoming dividends |
| `GET /api/stocks/calendar/ipos` | Upcoming IPOs |
| `GET /api/stocks/calendar/splits` | Upcoming stock splits |
| `GET /api/stocks/:symbol/estimates` | Analyst revenue/EPS estimates |
| `GET /api/stocks/:symbol/price-target` | Price target consensus |
| `GET /api/stocks/:symbol/price-targets` | Individual analyst targets |
| `GET /api/stocks/:symbol/grades` | Upgrade/downgrade history |
| `GET /api/stocks/:symbol/consensus` | Buy/hold/sell distribution |
| `GET /api/stocks/:symbol/earnings` | Historical earnings vs estimates |
| `GET /api/stocks/:symbol/income` | Income statement |
| `GET /api/stocks/:symbol/balance-sheet` | Balance sheet |
| `GET /api/stocks/:symbol/cash-flow` | Cash flow statement |
| `GET /api/stocks/:symbol/metrics` | Key financial metrics |
| `GET /api/stocks/:symbol/institutions` | Institutional holders |

---

### Phase 5: AI Features (v1.4.0)

**Goal:** Natural language search + AI insights

#### 5A: Gemini Setup
- [ ] Install `@google/generative-ai`
- [ ] Add `GEMINI_API_KEY` to `.env`
- [ ] Add `generativelanguage.googleapis.com` to SSRF allowlist
- [ ] Create `server/api/ai/geminiClient.ts`
- [ ] Create `server/api/ai/prompts.ts`
- [ ] Implement rate limiting (15 RPM free tier)
- [ ] Add Groq fallback (`api.groq.com`)

#### 5B: Natural Language Search
- [ ] Create `server/api/ai/service.ts`
- [ ] Implement `parseSearchQuery()` function
- [ ] Add route: `POST /api/ai/search`
- [ ] Create `client/src/hooks/useAISearch.ts`
- [ ] Create `SmartSearchBar.tsx` component
- [ ] Create `SearchResults.tsx` component
- [ ] Integrate into Header search

#### 5C: AI Stock Summaries
- [ ] Implement `generateStockSummary(symbol)` function
- [ ] Add route: `GET /api/ai/summary/:symbol`
- [ ] Create `client/src/hooks/useStockSummary.ts`
- [ ] Create `AIInsightsCard.tsx` component
- [ ] Create `SentimentGauge.tsx` component
- [ ] Add to StockPage About tab
- [ ] Cache AI responses (10min TTL)

---

### Phase 6: Testing Expansion (v1.4.0)

**Goal:** Contract tests + Zod schemas + CI/CD

#### 6A: Zod Schema Validation
- [ ] Install `zod`
- [ ] Create `server/lib/schemas/crypto.ts`
- [ ] Create `server/lib/schemas/stocks.ts`
- [ ] Create `server/lib/schemas/fmp.ts`
- [ ] Add runtime validation to API responses
- [ ] Add Zod error handling middleware

#### 6B: Contract Tests
- [ ] Create `server/test/contracts/` directory
- [ ] Add CoinGecko contract test
- [ ] Add Twelve Data contract test
- [ ] Add Finnhub contract test
- [ ] Add FMP contract test
- [ ] Add `npm run test:contracts` script

#### 6C: CI/CD & Health Checks
- [ ] Create `.github/workflows/test.yml`
- [ ] Create `.github/workflows/api-health.yml`
- [ ] Add daily cron for contract tests
- [ ] Add README badge for test status
- [ ] Add README badge for API health

#### 6D: Component Tests
- [ ] Add MSW handlers for Twelve Data
- [ ] Add MSW handlers for FMP
- [ ] Add tests for StockChart component
- [ ] Add tests for StockPage tabs
- [ ] Add tests for TopStocksWithFilter

---

### Phase 7: Documentation (v1.4.0)

**Goal:** Swagger docs + README polish

#### 7A: Swagger/OpenAPI
- [ ] Install `swagger-jsdoc` and `swagger-ui-express`
- [ ] Create `server/lib/swagger.ts` config
- [ ] Add JSDoc annotations to all routes
- [ ] Mount Swagger UI at `/api/docs`
- [ ] Document all request/response schemas

#### 7B: README Polish
- [ ] Add API documentation section
- [ ] Add premium upgrade paths
- [ ] Add architecture diagram
- [ ] Add screenshots/GIFs
- [ ] Add contributing guide

---

### Phase 8: User Features (v1.5.0)

**Goal:** Portfolio + Alerts

#### 8A: Portfolio Tracking
- [ ] Create `portfolios` table in DB
- [ ] Create `holdings` table in DB
- [ ] Add CRUD routes for portfolios
- [ ] Add routes for adding/removing holdings
- [ ] Create `PortfolioPage.tsx`
- [ ] Create `HoldingsTable.tsx`
- [ ] Calculate P&L and performance
- [ ] Add diversification chart

#### 8B: Price Alerts
- [ ] Create `alerts` table in DB
- [ ] Add CRUD routes for alerts
- [ ] Create `AlertsPage.tsx`
- [ ] Create `AlertForm.tsx` component
- [ ] Implement Service Worker for push
- [ ] Add browser notification permission
- [ ] Add email notification (optional)

#### 8C: Multi-device Sync
- [ ] Ensure watchlist syncs via DB
- [ ] Ensure portfolio syncs via DB
- [ ] Ensure alerts sync via DB
- [ ] Add real-time updates (polling/websocket)

---

### Phase 9: Advanced Features (v2.0.0)

**Goal:** Pro-level analytics

#### 9A: Advanced Charting
- [ ] Add candlestick chart option
- [ ] Add volume overlay
- [ ] Add moving averages (SMA, EMA)
- [ ] Add RSI indicator
- [ ] Add MACD indicator
- [ ] Add drawing tools

#### 9B: Cross-Asset Correlation
- [ ] Create correlation calculation service
- [ ] Add BTC vs NASDAQ correlation
- [ ] Create heatmap visualization
- [ ] Add hedging suggestions

#### 9C: Tax Reports
- [ ] Track cost basis per holding
- [ ] Calculate realized gains
- [ ] Generate tax report PDF
- [ ] Support multi-currency

#### 9D: Time-Shifted Comparison
- [ ] Overlay historical patterns
- [ ] Compare earnings across quarters
- [ ] Pattern matching visualization

---

## API Provider Summary

| Provider | Purpose | Free Tier | Premium |
|----------|---------|-----------|---------|
| **Twelve Data** | Primary stock data | 800/day | $29/mo (12K/day) |
| **Finnhub** | Fallback + profiles | 60/min | $50/mo |
| **CoinGecko** | Crypto prices | 30/min | N/A |
| **Blockchair** | Blockchain explorer | Unlimited basic | N/A |
| **FMP** | Market movers | 250/day | $15/mo |
| **Gemini** | AI features | 1,500/day | Pay-as-you-go |

**Total Free Tier Cost: $0**
**Full Premium: ~$95/mo**

---

## Technical Debt

### To Address
1. **P/E Ratio**: Shows "N/A" when not available from API
2. **News Tab**: Currently placeholder, needs FMP news integration
3. **Test Coverage**: Add tests for new chart and tab components

### Completed
- [x] Stock search by name (Fuse.js)
- [x] Loading states for dashboard
- [x] Error handling in StockPage
- [x] ESM compatibility for server

---

## Testing Strategy (Professional Standard)

> For data-heavy apps relying on external APIs, the key challenges are **API Rot** and **Data Drift**.

### The Stack (Already Implemented in v1.1.0)

| Capability | Tool | Purpose |
|------------|------|---------|
| **Runner** | Vitest | Fast, native TS support, Jest-compatible API |
| **API Mocking** | MSW (Mock Service Worker) | Intercepts network requests at the layer level |
| **HTTP Testing** | Supertest | Integration tests for Express routes |
| **Coverage** | Vitest Coverage | 69.66% statements, 54.46% branches |

### Test Types for TickerHub

| Test Type | What It Checks | Data Source | Frequency |
|-----------|----------------|-------------|-----------|
| **Contract Tests** | "Is the API returning expected JSON structure?" | Real Live API | Daily (Cron) |
| **Feature Tests** | "Does the app handle data correctly (red/green)?" | Mocked Data | On every commit |
| **Unit Tests** | "Does this function work in isolation?" | None (pure logic) | On every commit |

### Contract Testing (Anti-Rot Defense)

Since we don't control external APIs (Twelve Data, Finnhub, CoinGecko), the biggest risk is the API changing its format.

```typescript
// Example: Contract test for CoinGecko
test('CoinGecko API contract', async () => {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
  const data = await response.json();

  // DO NOT assert: price === 50000 (volatile!)
  // DO assert: structure is correct
  expect(data.bitcoin).toBeDefined();
  expect(typeof data.bitcoin.usd).toBe('number');
  expect(data.bitcoin.usd).toBeGreaterThan(0);
});
```

### Schema Validation with Zod (Planned)

For runtime safety, validate all API responses:

```typescript
import { z } from 'zod';

const CryptoResponseSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  current_price: z.number().positive(),
  market_cap: z.number(),
  price_change_percentage_24h: z.number(),
});

// If API changes, Zod throws immediately with clear error
const validated = CryptoResponseSchema.parse(apiResponse);
```

### MSW Handlers (Existing)

Already implemented in `server/test/mocks/handlers.ts`:
- CoinGecko mock responses
- Finnhub mock responses
- Twelve Data mock responses (add if missing)

### Daily Health Check (Autonomous)

**Goal:** Know immediately if an API breaks, not days later.

```yaml
# .github/workflows/api-health.yml
name: API Health Check
on:
  schedule:
    - cron: '0 8 * * *'  # Every day at 8 AM
jobs:
  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:contracts
```

### Implementation Checklist

- [x] Vitest + Supertest + MSW setup (v1.1.0)
- [x] 69 tests across 6 test files
- [x] MSW handlers for CoinGecko, Finnhub
- [ ] Add Zod schemas for API response validation
- [ ] Create contract test suite (separate from unit tests)
- [ ] GitHub Action for daily API health checks
- [ ] Add MSW handlers for Twelve Data
- [ ] Add tests for StockChart component
- [ ] Add tests for StockPage tabs

---

## Long-Term Roadmap

### v1.4.0 - AI & Market Movers
- FMP real market movers
- AI natural language search
- AI stock summaries
- Swagger/OpenAPI docs

### v1.5.0 - User Features
- Portfolio tracking
- Price alerts (browser + email)
- Multi-device watchlist sync

### v2.0.0 - Advanced Features
- Cross-asset correlation engine
- Advanced charting (candlestick, indicators)
- Tax report generation
- Time-shifted comparison

---

## Environment Variables

```bash
# Stock Data
TWELVE_DATA_API_KEY=    # Primary stock provider
FINNHUB_API_KEY=        # Fallback + profiles
FMP_API_KEY=            # Market movers (Phase 4)

# AI Features
GEMINI_API_KEY=         # Natural language search (Phase 4)

# Database & Auth
DATABASE_URL=           # Neon PostgreSQL (pooled)
DATABASE_URL_UNPOOLED=  # For Drizzle migrations
BETTER_AUTH_SECRET=     # Auth secret
GOOGLE_CLIENT_ID=       # OAuth
GOOGLE_CLIENT_SECRET=   # OAuth
```

---

## Quick Start

```bash
# Start development server
cd TickerHub
npm run dev

# Test endpoints
curl http://localhost:5000/api/stocks
curl http://localhost:5000/api/stocks/AAPL
curl http://localhost:5000/api/stocks/AAPL/chart?timeframe=30D

# View app
open http://localhost:5000
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [INTEGRATION_PLAN.md](INTEGRATION_PLAN.md) | AI + FMP integration plan |
| [server/api/stocks/service.ts](server/api/stocks/service.ts) | Stock data service |
| [client/src/pages/StockPage.tsx](client/src/pages/StockPage.tsx) | Stock detail page |
| [client/src/components/StockChart.tsx](client/src/components/StockChart.tsx) | TradingView chart |
| [server/lib/apiClient.ts](server/lib/apiClient.ts) | SSRF-protected fetch |

---

## Decision Points

When continuing development:

1. **FMP vs Local Sorting**: Implement FMP for real movers or keep local sorting?
2. **AI Provider**: Gemini (free tier) vs Groq (fallback)?
3. **News Source**: FMP news API or alternative?

---

*Last generated: December 16, 2025*
