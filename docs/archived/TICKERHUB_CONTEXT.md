# TickerHub - Complete Project Context for Claude

## Project Overview
**Name:** TickerHub  
**Type:** Unified Market Intelligence Platform  
**Vision:** Aggregate real-time cryptocurrency AND stock market data with AI-powered natural language queries and customizable alerts.

**Current State:** Crypto MVP complete - Bitcoin/Ethereum blockchain explorer with CoinGecko price data.  
**Next Milestone:** Stock market integration (Phase 1)

---

## Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Routing:** Wouter (lightweight)
- **State:** TanStack Query (React Query)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Charts:** Recharts
- **Animations:** Framer Motion

### Backend
- **Runtime:** Node.js + Express
- **Language:** TypeScript (ESM)
- **ORM:** Drizzle (PostgreSQL ready)
- **Validation:** Zod

### External APIs

**Current:**
| API | Purpose | Auth Required |
|-----|---------|---------------|
| CoinGecko | Crypto prices, charts, market data | No (free tier) |
| Blockchain.com | Bitcoin blocks/transactions | No |
| Etherscan | Ethereum blocks/transactions | Optional (has fallback) |

**Planned (Stock Market):**
| API | Purpose | Rate Limit | Auth |
|-----|---------|------------|------|
| Finnhub | Stock prices, company info | 60 calls/min | Free API key |
| Alpha Vantage | Stock historical data (backup) | 25 calls/day | Free API key |
| yfinance | Yahoo Finance (fallback) | Unofficial | None |

---

## Current File Structure
```
TickerHub/
├── client/
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── ui/           # shadcn/ui primitives
│   │   │   ├── Header.tsx
│   │   │   ├── PriceChart.tsx
│   │   │   ├── NetworkStats.tsx
│   │   │   ├── RecentBlocks.tsx
│   │   │   └── ...
│   │   ├── pages/            # Route pages
│   │   │   ├── LandingPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ExplorerPage.tsx
│   │   │   └── ...
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── index.html
├── server/
│   ├── index.ts              # Express app entry
│   ├── routes.ts             # API routes (ALL in one file)
│   ├── storage.ts            # DB interface
│   ├── static.ts             # Production static serving
│   └── vite.ts               # Dev server setup
├── shared/
│   └── schema.ts             # Shared types + Drizzle schema
├── package.json
└── docs/
    ├── STOCK_MARKET_EXPANSION.md  # Detailed expansion plan
    └── TICKERHUB_CONTEXT.md       # This file
```

---

## UI/UX Guidelines (DO NOT CHANGE)

### Theme: "Cyber Matrix"
- **DO NOT** change the theme, colors, or background animations
- **DO NOT** modify the existing visual aesthetic
- **ONLY** add new UI elements for stock market features
- New components should match the existing neon-cyberpunk style

### Design Tokens (Reference Only)
```css
--primary: #00F5FF (cyan)
--secondary: #B388FF (purple)
--accent: #00E676 (green)
--background: #0A0E27 (deep navy)
```

### Component Patterns
- All cards should have glass-morphism effect
- Use neon glow effects for hover states
- Animations should be smooth and subtle
- Icons from Lucide React (already in use)

---

## Stock Market Expansion Plan

### Phase 1: Data Layer (Current Priority)

**Goal:** Add stock price lookups alongside crypto

**Tasks:**
1. ✅ Choose primary stock API (Finnhub selected)
2. ⬜ Add Finnhub API key to environment
3. ⬜ Create stock service in `server/`
4. ⬜ Add stock types to `shared/schema.ts`
5. ⬜ Add stock routes to `server/routes.ts`
6. ⬜ Test stock API endpoints

**New Types Needed:**
```typescript
// shared/schema.ts additions
export interface StockPrice {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  sector?: string;
}

export interface AssetType {
  type: 'crypto' | 'stock';
  symbol: string;
  name: string;
  price: number;
  change: number;
}
```

**New API Endpoints:**
```typescript
// server/routes.ts additions
GET /api/stocks/price/:symbol        # Single stock price
GET /api/stocks/search?q=AAPL        # Search stocks
GET /api/stocks/trending             # Trending stocks
GET /api/stocks/chart/:symbol/:range # Historical data
GET /api/unified/search?q=BTC        # Search both crypto & stocks
```

**Finnhub Service Implementation:**
```typescript
// server/lib/finnhub.ts (NEW)
import axios from 'axios';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY;

export async function getStockPrice(symbol: string) {
  const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
    params: {
      symbol: symbol.toUpperCase(),
      token: API_KEY
    }
  });
  
  return {
    symbol: symbol.toUpperCase(),
    currentPrice: response.data.c,
    high24h: response.data.h,
    low24h: response.data.l,
    change24h: response.data.d,
    changePercent24h: response.data.dp
  };
}

export async function searchStocks(query: string) {
  const response = await axios.get(`${FINNHUB_BASE_URL}/search`, {
    params: {
      q: query,
      token: API_KEY
    }
  });
  
  return response.data.result.slice(0, 10);
}

export async function getCompanyProfile(symbol: string) {
  const response = await axios.get(`${FINNHUB_BASE_URL}/stock/profile2`, {
    params: {
      symbol: symbol.toUpperCase(),
      token: API_KEY
    }
  });
  
  return response.data;
}
```

### Phase 2: UI Integration

**Goal:** Display stocks in existing dashboard

**New Components:**
1. `StockCard.tsx` - Match crypto PriceCard style
2. `StockSearch.tsx` - Search bar with auto-complete
3. `UnifiedSearch.tsx` - Search both crypto & stocks
4. `StockDetailPage.tsx` - Detailed stock view

**Dashboard Updates:**
```tsx
// pages/DashboardPage.tsx modifications
- Add "Stocks" tab alongside "Crypto"
- Display top stocks (S&P 500 movers)
- Unified search bar at top
- Toggle between crypto/stock view
```

**Example StockCard Component:**
```tsx
// components/StockCard.tsx (NEW)
interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  sector?: string;
}

export function StockCard({ symbol, name, price, change, sector }: StockCardProps) {
  const isPositive = change >= 0;
  
  return (
    <Card className="bg-slate-900/50 backdrop-blur border-cyan-500/20 hover:border-cyan-500/50 transition-all">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-cyan-400 font-bold text-lg">{symbol}</h3>
            <p className="text-gray-400 text-sm">{name}</p>
            {sector && <span className="text-xs text-purple-400">{sector}</span>}
          </div>
          <div className="text-right">
            <p className="text-white font-semibold">${price.toFixed(2)}</p>
            <p className={isPositive ? "text-green-400" : "text-red-400"}>
              {isPositive ? "+" : ""}{change.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Phase 3: Future Features (Not Current Scope)

These are planned but NOT to be implemented yet:
- Gemini AI natural language queries
- Telegram price alerts
- Portfolio tracking
- Technical indicators (RSI, MACD)
- Wallet tracking (Arkham-style)

---

## Best Practices to Follow

### Code Organization (When Refactoring)

**Current State:** All routes in `server/routes.ts` (acceptable for MVP)

**Future Structure (when adding stocks):**
```
server/
├── api/
│   ├── crypto/
│   │   ├── routes.ts      # Crypto endpoints
│   │   └── service.ts     # CoinGecko wrapper
│   ├── stocks/
│   │   ├── routes.ts      # Stock endpoints
│   │   └── service.ts     # Finnhub wrapper
│   └── index.ts           # Route aggregator
├── lib/
│   ├── cache.ts           # Caching utilities
│   ├── finnhub.ts         # Finnhub API client
│   ├── coingecko.ts       # CoinGecko API client
│   └── fetchWithTimeout.ts
└── index.ts               # Express app
```

### API Design Patterns
- ✅ Use caching with appropriate TTLs (already implemented)
- ✅ Provide fallback data when APIs fail (already implemented for Etherscan)
- ✅ Type all API responses with Zod or TypeScript interfaces
- ⬜ Add rate limiting for production (consider express-rate-limit)
- ⬜ Implement circuit breaker for external APIs

### Error Handling Philosophy
```typescript
// Always handle API failures gracefully
try {
  const stockData = await getStockPrice(symbol);
  return stockData;
} catch (error) {
  console.error(`Failed to fetch stock ${symbol}:`, error);
  // Return cached data or fallback
  return getCachedStock(symbol) || {
    symbol,
    error: 'Unable to fetch current price',
    currentPrice: 0
  };
}
```

### TypeScript Conventions
- Use `interface` for data shapes
- Use `type` for unions and complex types
- All API responses must be typed
- Prefer `unknown` over `any`
- Use Zod for runtime validation of external API responses

---

## Environment Variables

```env
# Current (Required: None)
NODE_ENV=development
PORT=5000

# Current (Optional)
ETHERSCAN_API_KEY=your_key_here     # For Ethereum data (has fallback)

# Phase 1 (Required for stock features)
FINNHUB_API_KEY=your_key_here       # Get from https://finnhub.io

# Phase 1 (Optional backup)
ALPHA_VANTAGE_KEY=your_key_here     # Backup stock API

# Future (Phase 3)
GEMINI_API_KEY=your_key_here        # For AI features
TELEGRAM_BOT_TOKEN=your_token_here  # For alerts
```

---

## Current API Endpoints

### Crypto (Working)
```
GET /api/prices                     # Top 20 crypto prices
GET /api/chart/:coinId/:range       # Price history
GET /api/network/:chain             # Network stats (ethereum/bitcoin)
GET /api/blocks/:chain/:limit/:page # Block list
GET /api/block/:chain/:number       # Single block
GET /api/tx/:hash                   # Transaction details
GET /api/address/:address           # Address info
GET /api/stats                      # Platform stats
```

### Stocks (To Be Implemented)
```
GET /api/stocks/price/:symbol        # Single stock price (AAPL, TSLA, etc.)
GET /api/stocks/search?q=apple       # Search stocks by name/symbol
GET /api/stocks/trending             # Trending stocks
GET /api/stocks/chart/:symbol/:range # Historical stock data
GET /api/stocks/profile/:symbol      # Company profile (sector, market cap, etc.)
GET /api/unified/search?q=btc        # Search both crypto & stocks
```

---

## Git Workflow

- **Branch:** `crypto-mvp` - Current stable crypto-only version
- **Branch:** `stock-integration` - Working branch for stock features (create this)
- **Branch:** `main` - Production after stock expansion
- **Commit style:** Conventional commits (feat:, fix:, docs:, etc.)

**Example commits:**
```bash
feat(api): add finnhub stock price endpoint
feat(ui): create StockCard component matching cyber theme
fix(api): handle finnhub rate limit gracefully
docs: update README with stock market features
```

---

## Key Architectural Decisions

1. **No Etherscan dependency** - App works with mock data when API unavailable
2. **CoinGecko only for crypto** - Free tier sufficient for crypto prices
3. **Finnhub primary for stocks** - Best free tier rate limits (60/min)
4. **Single routes.ts for now** - Refactor to modular structure when adding stocks
5. **UI theme locked** - Cyber Matrix aesthetic is final, only additive changes
6. **Cache everything** - Reduce API calls, improve performance
7. **TypeScript strict mode** - No implicit any, all types explicit

---

## Testing Checklist (Before Deployment)

### Phase 1 (Stock Integration)
- [ ] Finnhub API key works
- [ ] GET `/api/stocks/price/AAPL` returns valid data
- [ ] GET `/api/stocks/search?q=apple` returns results
- [ ] Unified search returns both crypto and stocks
- [ ] Error handling works when API fails
- [ ] Caching works for stock prices
- [ ] Frontend can display StockCard component
- [ ] Stock prices update on dashboard

### Phase 2 (UI Polish)
- [ ] StockCard matches PriceCard styling
- [ ] Cyber theme preserved across all new components
- [ ] Animations smooth and consistent
- [ ] Mobile responsive
- [ ] Search autocomplete works
- [ ] Loading states implemented

---

## Performance Considerations

### Caching Strategy
```typescript
// Recommended TTLs
crypto prices: 30 seconds
stock prices: 60 seconds (markets closed = 5 minutes)
company profiles: 1 hour
historical data: 15 minutes
search results: 5 minutes
```

### Rate Limiting
- Finnhub: 60 calls/min (client-side throttle at 50/min)
- CoinGecko: 10-30 calls/min (already handled)
- Implement exponential backoff on failures

### Bundle Size
- Current build: ~150kb gzipped
- Target: Stay under 200kb with stock features
- Use code splitting for stock pages if needed

---

## Deployment Notes

### Production Checklist
- [ ] Environment variables set on VPS
- [ ] Health check endpoint (`/health`) added
- [ ] Rate limiting enabled (express-rate-limit)
- [ ] CORS configured properly
- [ ] Error tracking setup (Sentry optional)
- [ ] Database migrations run (if using Drizzle)
- [ ] Static assets optimized
- [ ] SSL certificate valid

### Coolify Deployment
- Build command: `npm run build`
- Start command: `npm start`
- Port: 5000
- Environment: Node.js 20+

---

## Common Troubleshooting

### "Stock price not loading"
1. Check Finnhub API key is set
2. Verify stock symbol exists (use search endpoint)
3. Check rate limits not exceeded
4. Inspect network tab for API errors

### "UI looks different from crypto section"
1. Ensure using same Tailwind classes
2. Check color variables match design tokens
3. Verify glass-morphism backdrop-blur is applied
4. Compare with existing PriceCard component

### "Build fails"
1. Run `npm install` to update dependencies
2. Check TypeScript errors: `npm run type-check`
3. Verify all imports are correct (ESM vs CommonJS)
4. Clear node_modules and reinstall if needed

---

## Resources & Documentation

- [Finnhub API Docs](https://finnhub.io/docs/api)
- [CoinGecko API Docs](https://www.coingecko.com/en/api/documentation)
- [Recharts Documentation](https://recharts.org)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query/latest)

---

## Next Immediate Steps

1. **Get Finnhub API key** - https://finnhub.io (free, instant)
2. **Add to .env file** - `FINNHUB_API_KEY=your_key_here`
3. **Create stock service** - `server/lib/finnhub.ts`
4. **Add stock routes** - Update `server/routes.ts`
5. **Test endpoints** - Use Postman/Thunder Client
6. **Create StockCard** - Match crypto PriceCard style
7. **Update Dashboard** - Add stocks section

**Estimated time:** Phase 1 = 1-2 days of focused work

---

## Project Philosophy

**What TickerHub IS:**
- A unified view of crypto + stock markets
- Real-time price tracking with elegant UI
- Portfolio project showcasing full-stack + API integration skills
- Practical tool for retail investors

**What TickerHub is NOT (yet):**
- A trading platform (no buy/sell)
- A full Bloomberg terminal clone
- An AI-powered trading bot
- A social trading network

Stay focused on Phase 1-2. Phase 3 features are aspirational.

---

**Last Updated:** December 2024  
**Version:** 1.1 (Stock integration planning)  
**Maintainer:** Guy (Ruppin Academic Center graduate, actively job searching in Israeli tech)
