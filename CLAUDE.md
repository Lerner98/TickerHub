# CLAUDE.md - TickerHub Development Guidelines

---

## 🎯 PROJECT PHASE STATUS

### ✅ PHASE 1: CORE FOUNDATION - COMPLETE
- [x] Project setup (React + Vite + Express + TypeScript)
- [x] Database setup (Neon PostgreSQL + Drizzle ORM)
- [x] Authentication (Better Auth + Google OAuth)
- [x] Basic routing and navigation
- [x] UI framework (shadcn/ui + TailwindCSS)

### ✅ PHASE 2: DATA INTEGRATION - COMPLETE
- [x] Stock data service (Twelve Data primary + Finnhub fallback)
- [x] Crypto data service (CoinGecko API)
- [x] Blockchain explorer (Blockchair - ETH/BTC)
- [x] Dual-provider pattern with fallback
- [x] Response caching system
- [x] Rate limiting protection

### ✅ PHASE 3: USER FEATURES - COMPLETE
- [x] User watchlist CRUD
- [x] Client-side fuzzy search (Fuse.js)
- [x] Stock/crypto detail pages
- [x] Historical price charts (TradingView Lightweight Charts)
- [x] User profile management

### ✅ PHASE 4: ADVANCED DATA - COMPLETE
- [x] **4A**: News integration (FMP primary + Finnhub fallback)
- [x] **4B**: Financial statements (income, balance sheet, cash flow)
- [x] **4C**: Analyst ratings & price targets
- [x] **4D**: Market movers (gainers/losers/most active)
- [x] **4E**: Key metrics & ratios (P/E, market cap, volume)
- [x] **4F**: Company profiles with full metadata
- [x] FMP stable API migration (v3/v4 → /stable/)

### ✅ PHASE 5: AI FEATURES - COMPLETE
- [x] **5A**: Gemini AI integration (gemini-1.5-flash-8b)
- [x] **5B**: AI stock summary with sentiment analysis
- [x] **5C**: Natural language search parsing
- [x] **5D**: AI-powered market overview
- [x] **5E**: Lazy loading for AI features (quota conservation)
  - AIInsightsCard: Button-triggered fetch
  - SmartSearchBar: AI only on form submit
  - Extended cache TTLs (2-4 hours)
- [x] JSON parsing with truncation repair
- [x] Sentiment gauge visualization

### 🔲 PHASE 6: POLISH & OPTIMIZATION - PENDING
- [ ] Performance optimization (bundle size, lazy loading)
- [ ] Error boundary improvements
- [ ] Accessibility audit (WCAG compliance)
- [ ] Mobile responsiveness polish
- [ ] SEO optimization

### 🔲 PHASE 7: DEPLOYMENT - PENDING
- [ ] Production build configuration
- [ ] Environment variable management
- [ ] CI/CD pipeline setup
- [ ] Monitoring & logging
- [ ] Documentation finalization

---

## Core Development Philosophy

### The Fundamental Doctrine: "If it exists, it works"

Every feature, every component, every data flow in TickerHub must be fully functional with real data. Nothing is decorative or "for show." This is a non-negotiable principle:

- **No placeholder data** - All displayed information must come from real, live sources
- **No broken flows** - Every user interaction path must complete successfully
- **No half-implementations** - Features are either fully working or not shipped
- **No silent failures** - Errors must be handled gracefully with user feedback

### Enterprise-Level Quality Standards

This application is built to enterprise standards. The following areas require zero tolerance for bugs or broken experiences:

1. **Search & Discovery** - Fuzzy search must return relevant results every time
2. **Data Visualization** - Charts/graphs must render correctly with real-time data
3. **Lists & Tables** - Pagination, sorting, filtering must work flawlessly
4. **State Management** - User state persists correctly across sessions
5. **Connections & OAuth** - Authentication flows complete without interruption
6. **Data Fetching** - API calls succeed or fail gracefully with proper feedback

### Think Deeper, Think Further

When implementing any feature, consider:

1. **Edge Cases** - What happens when user has no data? Only one account? Network fails?
2. **User Lockout Prevention** - Never create a state where user cannot recover (e.g., can't unlink last OAuth account)
3. **Complete Flows** - Follow every code path to its conclusion before shipping
4. **Real-World Testing** - Test with actual API responses, not mocked data

---

## Technical Guidelines

### Architecture

```
TickerHub/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   │   ├── auth/     # Auth dialog, user menu
│   │   │   ├── layout/   # Header, navigation
│   │   │   └── ui/       # shadcn/ui components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom React hooks (useAuth, useWatchlist)
│   │   ├── features/     # Feature modules (crypto, stocks)
│   │   ├── services/     # Client-side services (search)
│   │   ├── data/         # Static datasets (stocks, crypto)
│   │   └── lib/          # Utilities and auth client
│   └── ...
├── server/          # Express backend
│   ├── api/         # API routes and services
│   │   ├── blockchain/   # Ethereum, Bitcoin services
│   │   ├── stocks/       # Twelve Data + Finnhub integration
│   │   ├── crypto/       # CoinGecko integration
│   │   ├── explorer/     # Transaction/address lookup
│   │   └── watchlist/    # User watchlist CRUD
│   ├── auth/        # Better Auth configuration
│   ├── db/          # Drizzle ORM and Neon connection
│   ├── middleware/  # Auth, rate limiting, security
│   └── lib/         # Utilities (apiClient, cache, logger)
├── shared/          # Shared types and schemas
│   ├── schema.ts    # Zod schemas, Asset types
│   └── auth-schema.ts # Auth database schema
└── migrations/      # Drizzle database migrations
```

### Key Technologies

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: Neon PostgreSQL via Drizzle ORM
- **Auth**: Better Auth with Google OAuth
- **Search**: Fuse.js for fuzzy client-side search
- **Charts**: TradingView Lightweight Charts (stock historical data)
- **APIs**:
  - CoinGecko (crypto prices)
  - Twelve Data (stock quotes + historical - primary)
  - Finnhub (stock quotes, profiles, news - fallback)
  - FMP / Financial Modeling Prep (company profiles, market movers, financials)
  - Blockchair (blockchain explorer)

### API Integration Standards

1. **SSRF Protection** - All external URLs validated against allowlist in `apiClient.ts`
2. **Timeout Handling** - All API calls have configurable timeouts
3. **Error Propagation** - Errors bubble up with meaningful messages
4. **Rate Limiting** - Respect API rate limits:
   - CoinGecko: 10-30 calls/min (free tier)
   - Twelve Data: 800 calls/day, 8/min (free tier)
   - Finnhub: 60 calls/min (free tier)
   - FMP: 250 calls/day (free tier)
   - Blockchair: free tier limits
5. **Dual-Provider Pattern** - Stock data uses Twelve Data (primary) → Finnhub (fallback) → null
6. **News Fallback** - Stock news uses FMP (primary) → Finnhub (fallback) → empty

### FMP API Migration (December 2025)

**IMPORTANT**: FMP deprecated `/api/v3/` and `/api/v4/` endpoints. All calls must use `/stable/` base URL.

| Old Endpoint | New Endpoint |
|--------------|--------------|
| `/api/v3/stock_market/gainers` | `/stable/biggest-gainers` |
| `/api/v3/stock_market/losers` | `/stable/biggest-losers` |
| `/api/v3/stock_market/actives` | `/stable/most-actives` |
| `/api/v3/profile/AAPL` | `/stable/profile?symbol=AAPL` |
| `/api/v3/stock_news?tickers=X` | `/stable/stock-news?symbol=X` (returns 404 on free tier) |
| `/api/v3/income-statement/X` | `/stable/income-statement?symbol=X` |
| `/api/v4/price-target-consensus` | `/stable/price-target-consensus?symbol=X` |

**Working FMP Endpoints (free tier)**:
- Company profiles, market movers (gainers/losers/actives), key metrics, financials
- **NOT working on free tier**: stock-news (returns 404, use Finnhub fallback)

### Authentication & Account Management

Using Better Auth with these key behaviors:

- `authClient.listAccounts()` returns linked OAuth providers
- Users cannot unlink their last authentication method
- Check for password-based account OR multiple OAuth providers before allowing unlink

### Search Implementation

- **Client-side** with Fuse.js for instant results
- **Datasets**: 300+ US stocks, 170+ crypto assets
- **Weights**: Symbol (2x) > Name (1.5x) > Sector/Category (0.5x)
- **Threshold**: 0.4 (balanced fuzzy matching)

---

## Data Coverage Goals

### Stocks
- US Markets: NASDAQ, NYSE (300+ major stocks)
- EU Markets: Major ADRs and European exchanges (planned)
- Real-time quotes via Twelve Data / Finnhub dual-provider
- Historical charts via Twelve Data (1D, 7D, 30D, 1Y timeframes)
- TradingView Lightweight Charts for visualization

### Crypto
- Top 170+ cryptocurrencies by market cap
- Categories: Currency, Smart Contract, DeFi, Meme, Gaming, etc.
- Real-time pricing via CoinGecko API

### Blockchain Explorer
- Ethereum: Blocks, transactions, addresses via Blockchair
- Bitcoin: Blocks, transactions, addresses via Blockchair
- No API keys required for basic exploration

### AI Features (Gemini)
- **Model**: `gemini-1.5-flash-8b` (best free tier availability)
- **Rate Limit**: 15 requests/minute (free tier)
- **Features**:
  - Stock sentiment analysis with key points, catalysts, risks
  - Natural language search parsing ("tech stocks going up")
  - Market overview with sector analysis
- **Quota Conservation** (IMPORTANT):
  - AIInsightsCard: Lazy loaded via button click (not auto-fetch)
  - SmartSearchBar: AI parsing only on Enter/submit (not while typing)
  - Cache TTLs: 2-4 hours (server and client)
  - Fuse.js instant search works without AI quota

---

## Testing & Development Workflow

### MANDATORY: Use Scripts Instead of Manual Commands

**NEVER run these commands manually - use the provided scripts:**

| Instead of... | Use this script |
|---------------|-----------------|
| `taskkill /f /im node.exe` | `npm run cleanup` |
| Manually checking env vars | `npm run check:env` |
| Manually curling APIs | `npm run check:api` |
| Killing + restarting server | `npm run dev:start` |

### Available Test Scripts

```bash
# Quick system check (env + server health only - NO API quota used)
npm run check:quick

# Full system check (env + startup + API tests)
npm run check:full

# API testing with rate-limit awareness
npm run check:api              # Core endpoints only (free/cached)
npm run check:api -- --ai      # Include AI endpoints (uses Gemini quota)
npm run check:api -- --fmp     # Include FMP endpoints (250/day limit)
npm run check:api -- --full    # Test everything (use sparingly!)

# Utility scripts
npm run cleanup                # Kill zombie processes, free port 5000
npm run check:env              # Validate environment variables
npm run dev:start              # Clean start (cleanup + wait + dev)
```

### When to Use Each Script

| Scenario | Script |
|----------|--------|
| Starting work session | `npm run dev:start` |
| After code changes | `npm run check:quick` |
| Before committing | `npm run check:api` |
| Testing AI features | `npm run check:api -- --ai` |
| Testing stock data | `npm run check:api -- --fmp` |
| Full regression test | `npm run check:api -- --full` (rate limit aware!) |
| Port 5000 stuck | `npm run cleanup` |

### Rate Limit Awareness

Tests are categorized by API cost:
- **free**: No quota impact (health checks, cached data)
- **cached**: Uses server cache (minimal impact)
- **quota**: Counts against daily/minute limits

Default `npm run check:api` only tests free/cached endpoints to preserve quotas.

### Maintaining Tests

When modifying code that affects APIs:
1. Run `npm run check:api` to verify core functionality
2. If you changed AI code: `npm run check:api -- --ai`
3. If you changed stock/FMP code: `npm run check:api -- --fmp`
4. Update test scripts in `scripts/` if endpoints change

---

## Development Checklist

Before marking any feature complete:

- [ ] Works with real data from live APIs
- [ ] Handles loading states appropriately
- [ ] Handles error states with user feedback
- [ ] Handles empty states gracefully
- [ ] Does not create user lockout scenarios
- [ ] Tested all user paths to completion
- [ ] No console errors or warnings
- [ ] TypeScript compiles without errors

---

## Common Patterns

### Fetching External Data
```typescript
import { fetchWithTimeout, safeFetch, ApiError } from '@/lib/apiClient';

// Use fetchWithTimeout for required data
const data = await fetchWithTimeout(url);

// Use safeFetch when failure is acceptable
const optional = await safeFetch<T>(url); // Returns null on error
```

### React Query for Data
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['unique-key', dependencies],
  queryFn: async () => { /* fetch logic */ },
});
```

### Connected Accounts Check
```typescript
const accounts = await authClient.listAccounts();
const hasPassword = user.password !== null;
const canUnlink = accounts.length > 1 || hasPassword;
```
