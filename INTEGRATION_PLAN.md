# TickerHub Integration Plan

> **Version:** 1.0
> **Created:** December 2024
> **Status:** Ready for Implementation

---

## Executive Summary

This document outlines the integration of three major enhancements to TickerHub:

1. **Financial Modeling Prep (FMP)** - Real market movers (top gainers/losers/actives)
2. **AI Features via Gemini** - Natural language search + AI stock summaries
3. **Premium Path Documentation** - Clear upgrade paths for all APIs

---

## Part 1: FMP Integration for Real Market Movers

### Why FMP?

Currently, "Top Stocks" shows the same 10 hardcoded symbols sorted differently. FMP provides **pre-sorted, market-wide** data:

| Endpoint | What It Returns | Use Case |
|----------|-----------------|----------|
| `/v3/stock_market/gainers` | Top 10 stocks by % gain today | "Top Gainers" dropdown |
| `/v3/stock_market/losers` | Top 10 stocks by % loss today | "Top Losers" dropdown |
| `/v3/stock_market/actives` | Most traded by volume today | "Most Active" dropdown |

### FMP Free Tier Limits

- **250 API calls/day** (free tier)
- No rate limiting per minute
- All endpoints available

### Implementation

#### 1. Server: FMP Service (`server/api/stocks/fmpService.ts`)

```typescript
/**
 * FMP Service - Real Market Movers
 *
 * Provides pre-sorted market-wide gainers, losers, and actives.
 * Free tier: 250 calls/day - cache aggressively (5 min TTL)
 */

import { fetchWithTimeout } from '../../lib/apiClient';
import { cache } from '../../lib/cache';
import { log, logError } from '../../lib/logger';

const FMP_API_KEY = process.env.FMP_API_KEY || '';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api';
const hasFMP = FMP_API_KEY.length > 0;

export interface FMPMover {
  symbol: string;
  name: string;
  change: number;
  price: number;
  changesPercentage: number;
}

/**
 * Get top gainers from entire market
 */
export async function getTopGainers(): Promise<FMPMover[] | null> {
  if (!hasFMP) return null;

  const cacheKey = 'fmp:gainers';
  const cached = cache.get<FMPMover[]>(cacheKey, 300); // 5 min TTL
  if (cached) return cached;

  try {
    const url = `${FMP_BASE_URL}/v3/stock_market/gainers?apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;

    const data = await response.json();
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    logError(error as Error, 'FMP gainers fetch failed');
    return null;
  }
}

/**
 * Get top losers from entire market
 */
export async function getTopLosers(): Promise<FMPMover[] | null> {
  if (!hasFMP) return null;

  const cacheKey = 'fmp:losers';
  const cached = cache.get<FMPMover[]>(cacheKey, 300);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE_URL}/v3/stock_market/losers?apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;

    const data = await response.json();
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    logError(error as Error, 'FMP losers fetch failed');
    return null;
  }
}

/**
 * Get most active stocks by volume
 */
export async function getMostActive(): Promise<FMPMover[] | null> {
  if (!hasFMP) return null;

  const cacheKey = 'fmp:actives';
  const cached = cache.get<FMPMover[]>(cacheKey, 300);
  if (cached) return cached;

  try {
    const url = `${FMP_BASE_URL}/v3/stock_market/actives?apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;

    const data = await response.json();
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    logError(error as Error, 'FMP actives fetch failed');
    return null;
  }
}

export function isFMPConfigured(): boolean {
  return hasFMP;
}
```

#### 2. Server: New Routes (`server/api/stocks/routes.ts`)

Add these endpoints:

```typescript
// GET /api/stocks/movers/gainers
router.get('/movers/gainers', async (req, res) => {
  const data = await getTopGainers();
  if (!data) {
    return res.status(503).json({ error: 'Market movers unavailable' });
  }
  res.json(data);
});

// GET /api/stocks/movers/losers
router.get('/movers/losers', async (req, res) => {
  const data = await getTopLosers();
  if (!data) {
    return res.status(503).json({ error: 'Market movers unavailable' });
  }
  res.json(data);
});

// GET /api/stocks/movers/actives
router.get('/movers/actives', async (req, res) => {
  const data = await getMostActive();
  if (!data) {
    return res.status(503).json({ error: 'Market movers unavailable' });
  }
  res.json(data);
});
```

#### 3. Client: Enhanced TopStocksWithFilter

Update `TopStocksWithFilter` to fetch real movers:

```tsx
// When sortBy is 'gainers' - fetch from /api/stocks/movers/gainers
// When sortBy is 'losers' - fetch from /api/stocks/movers/losers
// When sortBy is 'volume' - fetch from /api/stocks/movers/actives
// Fallback to local sorting if FMP unavailable
```

#### 4. Additional Stock Metrics

FMP also provides these valuable fields per stock:

| Metric | Field | Display |
|--------|-------|---------|
| P/E Ratio | `pe` | Key valuation metric |
| Market Cap | `marketCap` | Company size |
| Volume | `volume` | Trading activity |
| EPS | `eps` | Earnings per share |
| 52-Week High | `yearHigh` | Price context |
| 52-Week Low | `yearLow` | Price context |

**FMP Quote Endpoint:** `/v3/quote/AAPL?apikey=KEY`

---

## Part 2: AI Features Integration

### What Already Exists

| Feature | Status | Location |
|---------|--------|----------|
| Market Hours Indicator | **DONE** | `client/src/components/MarketHours.tsx` |
| Historical Charts | **DONE** | `server/api/stocks/service.ts` (`getStockChart`) |
| Price Charts | **DONE** | `client/src/components/PriceChart.tsx` |

### What Needs to Be Built

| Feature | Description | Effort |
|---------|-------------|--------|
| Gemini Client | Wrapper for Google Generative AI | 1-2 hours |
| Search Parser | NL query to structured filters | 2-3 hours |
| AI Stock Summary | Sentiment + insights from news | 2-3 hours |
| SmartSearchBar | AI-powered search UI | 2-3 hours |
| AIInsightsCard | Display AI analysis | 2-3 hours |

### Gemini Integration

#### 1. Install Gemini SDK

```bash
npm install @google/generative-ai
```

#### 2. Server: Gemini Client (`server/api/ai/geminiClient.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const hasGemini = GEMINI_API_KEY.length > 0;

let genAI: GoogleGenerativeAI | null = null;
if (hasGemini) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

export async function generateContent(prompt: string): Promise<string | null> {
  if (!genAI) return null;

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export function isGeminiConfigured(): boolean {
  return hasGemini;
}
```

#### 3. Server: AI Service (`server/api/ai/service.ts`)

```typescript
// Natural Language Search Parser
export async function parseSearchQuery(query: string): Promise<SearchFilters>

// AI Stock Summary Generator
export async function generateStockSummary(symbol: string): Promise<AISummary>
```

#### 4. Server: AI Routes (`server/api/ai/routes.ts`)

```typescript
// POST /api/ai/search
// Body: { query: "tech stocks that are up" }
// Returns: { parsedFilters, results }

// GET /api/ai/summary/:symbol
// Returns: { sentiment, summary, keyPoints, catalysts, risks }
```

### Client Components

#### SmartSearchBar Location

Replace existing search or add as enhanced option in:
- `client/src/components/Header.tsx`
- Or create new `SmartSearchBar.tsx`

#### AIInsightsCard Location

Add to stock detail page:
- `client/src/pages/StockPage.tsx` (if exists, or create)
- Or embed in `StockCard.tsx` as expandable section

---

## Part 3: File Structure After Integration

```
server/
├── api/
│   ├── ai/                    # NEW
│   │   ├── routes.ts          # /api/ai/* endpoints
│   │   ├── service.ts         # AI business logic
│   │   ├── geminiClient.ts    # Gemini API wrapper
│   │   └── prompts.ts         # Prompt templates
│   │
│   ├── stocks/
│   │   ├── routes.ts          # Existing + /movers/*
│   │   ├── service.ts         # Existing (Twelve Data + Finnhub)
│   │   └── fmpService.ts      # NEW - FMP integration
│   │
│   ├── crypto/                # Existing
│   ├── blockchain/            # Existing
│   └── explorer/              # Existing
│
├── lib/
│   ├── cache.ts               # Existing
│   ├── constants.ts           # Add FMP_BASE_URL, GEMINI configs
│   └── apiClient.ts           # Add FMP to allowlist

client/
├── components/
│   ├── search/                # NEW
│   │   ├── SmartSearchBar.tsx
│   │   └── SearchResults.tsx
│   │
│   ├── ai/                    # NEW
│   │   ├── AIInsightsCard.tsx
│   │   └── SentimentGauge.tsx
│   │
│   ├── StockCard.tsx          # Update for FMP metrics
│   └── TopAssetsWithFilter.tsx # Update to use FMP movers
│
├── hooks/
│   ├── useAISearch.ts         # NEW
│   └── useStockSummary.ts     # NEW
│
└── services/
    ├── stockService.ts        # Add FMP calls
    └── aiService.ts           # NEW
```

---

## Part 4: API Cost Summary

### Free Tier Configuration

| API | Free Tier | Daily Calls | Monthly Cost |
|-----|-----------|-------------|--------------|
| **Twelve Data** | 800 calls/day | ~500 used | $0 |
| **Finnhub** | 60 calls/min | ~1000/day | $0 |
| **CoinGecko** | 10-30 calls/min | ~500/day | $0 |
| **FMP** | 250 calls/day | ~100 used | $0 |
| **Gemini** | 1500 calls/day | ~200 used | $0 |
| **Blockchair** | Unlimited basic | ~50/day | $0 |

**Total Monthly Cost: $0**

### Premium Tier Pricing

| API | Premium Plan | Price | What You Get |
|-----|--------------|-------|--------------|
| **Twelve Data** | Growth | $29/mo | 12,000 calls/day, 800 symbols |
| **Finnhub** | Premium | $50/mo | Unlimited, websocket, full data |
| **FMP** | Starter | $15/mo | 10,000 calls/day, all endpoints |
| **Gemini** | Pay-as-you-go | ~$0.001/call | Unlimited, faster |

**For unlimited showcase:** ~$95-100/month total

---

## Part 5: Premium Upgrade Path

### In README.md - Add This Section:

```markdown
## Premium Configuration

TickerHub runs on free API tiers by default. For unlimited usage:

### Market Data (Twelve Data)
- **Free:** 800 calls/day - sufficient for demo
- **Premium ($29/mo):** 12,000 calls/day, real-time websockets
- Get key: https://twelvedata.com/pricing

### Market Movers (FMP)
- **Free:** 250 calls/day - sufficient for demo
- **Premium ($15/mo):** 10,000 calls/day, bulk endpoints
- Get key: https://financialmodelingprep.com/developer/docs/pricing

### AI Features (Gemini)
- **Free:** 1,500 calls/day - sufficient for demo
- **Premium:** Pay-as-you-go (~$0.001/call)
- Get key: https://makersuite.google.com/app/apikey

### Recommended Setup for Production

| Usage Level | APIs | Monthly Cost |
|-------------|------|--------------|
| Portfolio Demo | Free tiers | $0 |
| Active Development | Free tiers | $0 |
| Production (moderate) | Twelve Data Growth | $29 |
| Production (full) | All premium | ~$95 |
```

---

## Part 6: Implementation Priority

### Phase 1: FMP Integration (Day 1)
1. Add `FMP_API_KEY` to `.env.example`
2. Create `fmpService.ts`
3. Add `/api/stocks/movers/*` routes
4. Update `TopStocksWithFilter` to use real movers
5. Add additional metrics to stock cards (P/E, Market Cap)

### Phase 2: AI Foundation (Day 1-2)
1. Install Gemini SDK
2. Create `geminiClient.ts`
3. Create `prompts.ts` with templates
4. Test basic prompt/response flow

### Phase 3: AI Stock Summary (Day 2)
1. Implement `generateStockSummary()`
2. Create `/api/ai/summary/:symbol` endpoint
3. Build `AIInsightsCard` component
4. Build `SentimentGauge` component
5. Add to stock detail view

### Phase 4: Natural Language Search (Day 2-3)
1. Implement `parseSearchQuery()`
2. Create `/api/ai/search` endpoint
3. Build `SmartSearchBar` component
4. Build `SearchResults` component
5. Integrate into Header

### Phase 5: Polish & Documentation (Day 3)
1. Update README with premium paths
2. Test all flows
3. Add loading states
4. Handle errors gracefully

---

## Environment Variables (Complete)

```bash
# .env.example - FULL CONFIGURATION

# ============================================
# STOCK MARKET DATA
# ============================================

# Twelve Data - Primary stock provider
# Free: 800 calls/day | Premium: $29/mo for 12K calls
# Get key: https://twelvedata.com/pricing
TWELVE_DATA_API_KEY=your_key_here

# Finnhub - Stock fallback + company profiles
# Free: 60 calls/min | Premium: $50/mo unlimited
# Get key: https://finnhub.io/register
FINNHUB_API_KEY=your_key_here

# FMP - Market movers (gainers/losers/actives)
# Free: 250 calls/day | Premium: $15/mo for 10K calls
# Get key: https://financialmodelingprep.com/developer/docs
FMP_API_KEY=your_key_here

# ============================================
# AI FEATURES
# ============================================

# Google Gemini - AI search + stock summaries
# Free: 1,500 calls/day | Premium: pay-as-you-go
# Get key: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_key_here

# ============================================
# BLOCKCHAIN DATA
# ============================================

# Blockchair - Bitcoin + Ethereum explorer
# Free tier has generous limits, no key needed for basic use
# Premium: Contact sales for high volume

# ============================================
# DATABASE & AUTH
# ============================================

# PostgreSQL - Neon serverless
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=your_secret_here
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

---

## Success Metrics

| Feature | Success Criteria |
|---------|------------------|
| FMP Integration | Dropdown shows REAL top gainers/losers from entire market |
| AI Search | "tech stocks down" returns actual tech stocks with negative change |
| AI Summary | Returns valid sentiment 1-10 with real insights |
| Performance | All pages load under 2s |
| Free Tier | App runs without hitting any rate limits |

---

## Interview Talking Points

After implementation, you can say:

> "TickerHub aggregates data from 6 different APIs - Twelve Data, Finnhub, CoinGecko, FMP, Gemini, and Blockchair. It runs on free tiers but has production-grade architecture with caching, fallbacks, and graceful degradation. The AI features use Gemini for natural language search - users can type 'semiconductor stocks that are up' and get real-time filtered results."

> "The market movers section shows actual top gainers and losers from the entire market using FMP's pre-sorted endpoints, not just sorting a static list. When Gemini is available, users get AI-generated sentiment analysis and investment insights for any stock."

---

*Integration Plan for TickerHub*
*Ready for Claude Code execution*
