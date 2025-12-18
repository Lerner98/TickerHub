# TickerHub AI Features Specification

> **Document Version:** 1.0  
> **Last Updated:** December 2024  
> **Status:** Ready for Implementation  
> **Target:** Production-grade free tier deployment

---

## Executive Summary

This document specifies the AI-powered features to be added to TickerHub, transforming it from a basic market tracker into an intelligent financial platform. All features are designed to run on **free API tiers** while maintaining **production-grade architecture**.

### What We're Building

| Feature | Purpose | API Cost |
|---------|---------|----------|
| **Historical Charts** | Price visualization (7D/30D/1Y) | $0 (Finnhub free) |
| **Market Hours Indicator** | Show open/closed markets with countdowns | $0 (Pure JS) |
| **AI Stock Summary** | Sentiment analysis + key insights | $0 (Gemini free) |
| **Natural Language Search** | "Show me tech stocks that are down" | $0 (Gemini free) |

### Key Principles

1. **Free tier = Production quality** - Same code, same architecture, just lower rate limits
2. **Real data only** - No mocks, no hardcoded responses
3. **Graceful degradation** - If AI fails, fall back to keyword search
4. **Senior-level patterns** - Caching, validation, error handling, service layers

### Total Implementation Time

~12-15 hours of focused development

---

# Part 1: Understanding Natural Language Search

## What Natural Language Search Actually Is

Right now, your TickerHub search probably works like this:

**Current Search:**
```
User types: "AAPL"
→ Fuse.js matches "AAPL" to "Apple Inc."
→ Shows Apple stock
```

That's **keyword matching**. User must know the ticker or company name.

---

**Natural Language Search:**
```
User types: "tech companies that are down today"
→ Gemini understands the INTENT
→ Parses it into filters: { sector: "technology", change: "negative" }
→ Your backend filters your stock data
→ Shows: AAPL -2%, MSFT -1.5%, NVDA -3%
```

The user doesn't need to know tickers. They describe what they want in plain English.

---

## Real Examples (Not Demos - Actual Queries)

| User Types | Gemini Understands | System Returns |
|------------|-------------------|----------------|
| "show me crypto" | type: crypto | BTC, ETH, SOL... |
| "semiconductor stocks" | sector: semiconductors | NVDA, AMD, INTC, TSM |
| "what's going up today" | change: positive | Top gainers from your data |
| "cheap stocks under 50 dollars" | priceMax: 50 | Filtered list |
| "compare tesla and rivian" | symbols: [TSLA, RIVN], action: compare | Side-by-side view |
| "banks" | sector: financials | JPM, BAC, GS... |

---

## How It Works (Production Architecture)

```
┌─────────────────────────────────────────────┐
│  User: "energy stocks that dropped"         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  POST /api/ai/search                        │
│  { query: "energy stocks that dropped" }    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Gemini API (Free Tier)                     │
│                                             │
│  Prompt: "Parse this search query into      │
│  structured filters. Return only JSON."     │
│                                             │
│  Output: {                                  │
│    "type": "stock",                         │
│    "sector": "energy",                      │
│    "change": "negative"                     │
│  }                                          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Your Stock Service                         │
│                                             │
│  - Fetches stocks from Finnhub/cache        │
│  - Filters by sector === "energy"           │
│  - Filters by change24h < 0                 │
│  - Returns: XOM, CVX, SLB (all red today)   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Frontend displays filtered results         │
└─────────────────────────────────────────────┘
```

---

## Why This Is Production-Grade, Not a Demo

**It's not a demo because:**

1. **Real data** - Finnhub free tier gives you real stock prices, real sectors, real price changes. Not mock data.

2. **Real AI** - Gemini free tier is the same model as paid. 1500 requests/day is plenty for a portfolio app. The output quality is identical.

3. **Scales to paid** - If you hit limits, you just add a billing account. Zero code changes. The architecture is the same.

4. **Production patterns:**
   - Request validation (Zod schema for the parsed output)
   - Error handling (what if Gemini returns garbage?)
   - Caching (don't call Gemini twice for same query)
   - Rate limiting (protect your API key)
   - Fallback (if Gemini fails, fall back to keyword search)

---

## The Difference Between "Demo" and "Free Tier Production"

| Demo | Free Tier Production |
|------|---------------------|
| Hardcoded responses | Real API calls |
| Works for 3 examples | Works for any input |
| Breaks in edge cases | Handles errors gracefully |
| No caching | Proper caching |
| No validation | Schema validation |
| "Look what it could do" | "This is what it does" |

Your app would be **free tier production** - it's a real working system that happens to run on free API tiers. When someone asks "what if I search for something weird?", it handles it. That's production.

---

## What You'd Tell an Interviewer

> "TickerHub has natural language search powered by Gemini. Users can type queries like 'semiconductor stocks that are up today' and the system parses intent, applies filters to real market data from Finnhub, and returns relevant results. It's running on free API tiers but the architecture is production-grade - proper caching, error handling, schema validation. Scaling to paid tiers requires zero code changes."

That's not a demo. That's a working product.

---

# Part 2: Complete Technical Specification

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      TickerHub Frontend                          │
│                      (React + TypeScript)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ SearchBar   │  │ StockPage   │  │ MarketHoursIndicator    │  │
│  │ (NL Search) │  │ (Charts+AI) │  │ (Live status)           │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│                    /api/ai/*  /api/stocks/*  /api/crypto/*      │
└─────────┬────────────────┬─────────────────────┬────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│   AI Service    │ │  Market Service │ │     Cache Service       │
│                 │ │                 │ │                         │
│ - parseQuery()  │ │ - getStock()    │ │ - get(key)              │
│ - getSummary()  │ │ - getHistory()  │ │ - set(key, val, ttl)    │
│ - getSentiment()│ │ - getNews()     │ │ - invalidate(pattern)   │
│                 │ │ - getCrypto()   │ │                         │
└────────┬────────┘ └────────┬────────┘ └─────────────────────────┘
         │                   │
         ▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│   Gemini API    │ │  Finnhub API    │
│   (Free Tier)   │ │  CoinGecko API  │
│   1500 req/day  │ │  (Free Tiers)   │
└─────────────────┘ └─────────────────┘
```

---

## File Structure

```
server/
├── services/
│   ├── ai/
│   │   ├── index.ts              # AI service exports
│   │   ├── geminiClient.ts       # Gemini API wrapper
│   │   ├── searchParser.ts       # NL query → filters
│   │   ├── summaryGenerator.ts   # Stock → AI insights
│   │   ├── sentimentAnalyzer.ts  # News → sentiment
│   │   └── prompts.ts            # All prompt templates
│   │
│   ├── market/
│   │   ├── index.ts              # Market service exports
│   │   ├── finnhubClient.ts      # Finnhub API wrapper
│   │   ├── coingeckoClient.ts    # CoinGecko API wrapper
│   │   ├── stockService.ts       # Stock data operations
│   │   ├── cryptoService.ts      # Crypto data operations
│   │   └── historyService.ts     # Historical data
│   │
│   └── cache/
│       ├── index.ts              # Cache service exports
│       └── memoryCache.ts        # In-memory cache (or Redis)
│
├── routes/
│   ├── ai.ts                     # /api/ai/* endpoints
│   ├── stocks.ts                 # /api/stocks/* endpoints
│   └── crypto.ts                 # /api/crypto/* endpoints
│
├── schemas/
│   ├── ai.ts                     # Zod schemas for AI responses
│   ├── market.ts                 # Zod schemas for market data
│   └── search.ts                 # Zod schemas for search
│
├── utils/
│   ├── marketHours.ts            # Market hours calculations
│   ├── rateLimiter.ts            # API rate limiting
│   └── errors.ts                 # Custom error classes
│
└── types/
    └── index.ts                  # Shared TypeScript types

client/
├── components/
│   ├── search/
│   │   ├── SmartSearchBar.tsx    # NL search input
│   │   ├── SearchResults.tsx     # Results display
│   │   └── SearchSuggestions.tsx # Query suggestions
│   │
│   ├── market/
│   │   ├── MarketHoursIndicator.tsx  # Market status
│   │   ├── MarketHoursBadge.tsx      # Individual market badge
│   │   └── CountdownTimer.tsx        # Time to open/close
│   │
│   ├── stock/
│   │   ├── StockChart.tsx        # Price chart component
│   │   ├── ChartControls.tsx     # 1D/7D/30D/1Y buttons
│   │   ├── AIInsightsCard.tsx    # AI summary display
│   │   └── SentimentGauge.tsx    # Visual sentiment meter
│   │
│   └── ui/                       # Existing shadcn components
│
├── hooks/
│   ├── useAISearch.ts            # NL search hook
│   ├── useStockSummary.ts        # AI insights hook
│   ├── useMarketHours.ts         # Market hours hook
│   └── useStockHistory.ts        # Historical data hook
│
└── lib/
    ├── api.ts                    # API client functions
    └── marketHours.ts            # Client-side market utils
```

---

## Feature 1: Historical Charts

### API Endpoint

```typescript
// GET /api/stocks/:symbol/history?range=7d
// GET /api/stocks/:symbol/history?range=30d
// GET /api/stocks/:symbol/history?range=1y

interface HistoryParams {
  symbol: string;
  range: '1d' | '7d' | '30d' | '1y';
}

interface HistoryResponse {
  symbol: string;
  range: string;
  data: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  meta: {
    currency: string;
    exchange: string;
    fetchedAt: string;
  };
}
```

### Backend Implementation

```typescript
// server/services/market/historyService.ts
import { finnhubClient } from './finnhubClient';
import { cache } from '../cache';

export async function getStockHistory(
  symbol: string, 
  range: '1d' | '7d' | '30d' | '1y'
): Promise<HistoryResponse> {
  const cacheKey = `history:${symbol}:${range}`;
  
  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  // Calculate date range
  const now = Math.floor(Date.now() / 1000);
  const ranges = {
    '1d': 86400,
    '7d': 604800,
    '30d': 2592000,
    '1y': 31536000
  };
  const from = now - ranges[range];
  
  // Fetch from Finnhub
  const data = await finnhubClient.stockCandles(symbol, 'D', from, now);
  
  // Transform response
  const history: HistoryResponse = {
    symbol,
    range,
    data: data.t.map((timestamp: number, i: number) => ({
      timestamp,
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i]
    })),
    meta: {
      currency: 'USD',
      exchange: 'US',
      fetchedAt: new Date().toISOString()
    }
  };
  
  // Cache with TTL based on range
  const ttl = range === '1d' ? 300 : range === '7d' ? 900 : 3600;
  await cache.set(cacheKey, history, ttl);
  
  return history;
}
```

### Frontend Component

```tsx
// client/components/stock/StockChart.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartControls } from './ChartControls';

interface StockChartProps {
  symbol: string;
}

export function StockChart({ symbol }: StockChartProps) {
  const [range, setRange] = useState<'1d' | '7d' | '30d' | '1y'>('7d');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['stockHistory', symbol, range],
    queryFn: () => fetch(`/api/stocks/${symbol}/history?range=${range}`).then(r => r.json()),
    staleTime: range === '1d' ? 60000 : 300000, // 1min for 1d, 5min for others
  });
  
  if (isLoading) return <ChartSkeleton />;
  if (error) return <ChartError error={error} />;
  
  const chartData = data.data.map((d: any) => ({
    date: new Date(d.timestamp * 1000).toLocaleDateString(),
    price: d.close,
  }));
  
  const priceChange = chartData[chartData.length - 1]?.price - chartData[0]?.price;
  const isPositive = priceChange >= 0;
  
  return (
    <div className="w-full">
      <ChartControls 
        range={range} 
        onChange={setRange}
        className="mb-4"
      />
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tick={{ fontSize: 12 }}
            tickLine={false}
            tickFormatter={(v) => `$${v.toFixed(2)}`}
          />
          <Tooltip 
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Cache Strategy

| Range | TTL | Reason |
|-------|-----|--------|
| 1d | 5 min | Intraday changes matter |
| 7d | 15 min | Recent but not critical |
| 30d | 1 hour | Slower changes |
| 1y | 1 hour | Historical, stable |

---

## Feature 2: Market Hours Indicator

### Market Data (Pure TypeScript - No API)

```typescript
// server/utils/marketHours.ts

interface MarketSchedule {
  name: string;
  timezone: string;
  openTime: string;  // HH:mm format
  closeTime: string;
  weekends: boolean; // closed on weekends?
}

const MARKETS: Record<string, MarketSchedule> = {
  NYSE: {
    name: 'New York Stock Exchange',
    timezone: 'America/New_York',
    openTime: '09:30',
    closeTime: '16:00',
    weekends: true
  },
  NASDAQ: {
    name: 'NASDAQ',
    timezone: 'America/New_York',
    openTime: '09:30',
    closeTime: '16:00',
    weekends: true
  },
  CRYPTO: {
    name: 'Cryptocurrency',
    timezone: 'UTC',
    openTime: '00:00',
    closeTime: '23:59',
    weekends: false  // 24/7
  },
  LSE: {
    name: 'London Stock Exchange',
    timezone: 'Europe/London',
    openTime: '08:00',
    closeTime: '16:30',
    weekends: true
  },
  TASE: {
    name: 'Tel Aviv Stock Exchange',
    timezone: 'Asia/Jerusalem',
    openTime: '09:59',
    closeTime: '17:14',
    weekends: true  // Also closed Friday
  }
};

export interface MarketStatus {
  market: string;
  name: string;
  isOpen: boolean;
  currentTime: string;
  nextEvent: {
    type: 'open' | 'close';
    time: string;
    countdown: number; // seconds
  };
  session?: 'pre-market' | 'regular' | 'after-hours' | 'closed';
}

export function getMarketStatus(marketId: string): MarketStatus {
  const market = MARKETS[marketId];
  if (!market) throw new Error(`Unknown market: ${marketId}`);
  
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: market.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const currentTime = formatter.format(now);
  const [currentHour, currentMinute] = currentTime.split(':').map(Number);
  const currentMinutes = currentHour * 60 + currentMinute;
  
  const [openHour, openMinute] = market.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = market.closeTime.split(':').map(Number);
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  
  // Check weekend
  const dayOfWeek = new Date().toLocaleDateString('en-US', { 
    timeZone: market.timezone, 
    weekday: 'short' 
  });
  const isWeekend = ['Sat', 'Sun'].includes(dayOfWeek);
  
  // Crypto is always open
  if (marketId === 'CRYPTO') {
    return {
      market: marketId,
      name: market.name,
      isOpen: true,
      currentTime,
      nextEvent: { type: 'close', time: 'Never', countdown: Infinity },
      session: 'regular'
    };
  }
  
  // Check if market is open
  const isOpen = !isWeekend && 
                 currentMinutes >= openMinutes && 
                 currentMinutes < closeMinutes;
  
  // Calculate next event
  let nextEvent: MarketStatus['nextEvent'];
  if (isOpen) {
    const minutesToClose = closeMinutes - currentMinutes;
    nextEvent = {
      type: 'close',
      time: market.closeTime,
      countdown: minutesToClose * 60
    };
  } else {
    // Calculate time to next open
    let minutesToOpen: number;
    if (currentMinutes >= closeMinutes) {
      // After close, next open is tomorrow
      minutesToOpen = (24 * 60 - currentMinutes) + openMinutes;
    } else {
      // Before open
      minutesToOpen = openMinutes - currentMinutes;
    }
    // Add extra days for weekend
    if (isWeekend) {
      const daysToAdd = dayOfWeek === 'Sat' ? 2 : 1;
      minutesToOpen += daysToAdd * 24 * 60;
    }
    nextEvent = {
      type: 'open',
      time: market.openTime,
      countdown: minutesToOpen * 60
    };
  }
  
  // Determine session (US markets have pre/after hours)
  let session: MarketStatus['session'] = 'closed';
  if (isOpen) {
    session = 'regular';
  } else if (['NYSE', 'NASDAQ'].includes(marketId) && !isWeekend) {
    if (currentMinutes >= openMinutes - 330 && currentMinutes < openMinutes) {
      session = 'pre-market'; // 4:00 AM - 9:30 AM
    } else if (currentMinutes >= closeMinutes && currentMinutes < closeMinutes + 240) {
      session = 'after-hours'; // 4:00 PM - 8:00 PM
    }
  }
  
  return {
    market: marketId,
    name: market.name,
    isOpen,
    currentTime,
    nextEvent,
    session
  };
}

export function getAllMarketStatuses(): MarketStatus[] {
  return Object.keys(MARKETS).map(getMarketStatus);
}
```

### Frontend Component

```tsx
// client/components/market/MarketHoursIndicator.tsx
import { useState, useEffect } from 'react';
import { MarketHoursBadge } from './MarketHoursBadge';

interface MarketStatus {
  market: string;
  name: string;
  isOpen: boolean;
  currentTime: string;
  nextEvent: {
    type: 'open' | 'close';
    time: string;
    countdown: number;
  };
  session?: string;
}

export function MarketHoursIndicator() {
  const [markets, setMarkets] = useState<MarketStatus[]>([]);
  
  useEffect(() => {
    // Fetch initial status
    fetchMarketStatus();
    
    // Update every minute
    const interval = setInterval(fetchMarketStatus, 60000);
    return () => clearInterval(interval);
  }, []);
  
  async function fetchMarketStatus() {
    const res = await fetch('/api/market/hours');
    const data = await res.json();
    setMarkets(data);
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {markets.map((market) => (
        <MarketHoursBadge 
          key={market.market}
          market={market}
        />
      ))}
    </div>
  );
}

// MarketHoursBadge.tsx
interface MarketHoursBadgeProps {
  market: MarketStatus;
}

export function MarketHoursBadge({ market }: MarketHoursBadgeProps) {
  const statusColors = {
    open: 'bg-green-500/20 text-green-400 border-green-500/50',
    closed: 'bg-red-500/20 text-red-400 border-red-500/50',
    'pre-market': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    'after-hours': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  };
  
  const status = market.isOpen ? 'open' : (market.session || 'closed');
  
  return (
    <div className={`
      px-3 py-1.5 rounded-lg border text-sm font-medium
      ${statusColors[status as keyof typeof statusColors]}
    `}>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${
          market.isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'
        }`} />
        <span>{market.market}</span>
        <span className="text-xs opacity-70">
          {market.isOpen ? (
            `Closes in ${formatCountdown(market.nextEvent.countdown)}`
          ) : (
            `Opens in ${formatCountdown(market.nextEvent.countdown)}`
          )}
        </span>
      </div>
    </div>
  );
}

function formatCountdown(seconds: number): string {
  if (seconds === Infinity) return '24/7';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
```

---

## Feature 3: AI Stock Summary

### API Endpoint

```typescript
// GET /api/ai/summary/:symbol

interface AISummaryResponse {
  symbol: string;
  sentiment: {
    score: number;      // 1-10
    label: 'Bearish' | 'Somewhat Bearish' | 'Neutral' | 'Somewhat Bullish' | 'Bullish';
  };
  summary: string;      // 2-3 sentence overview
  keyPoints: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  catalysts: string[];  // Upcoming events that could move price
  risks: string[];      // Key risks to watch
  generatedAt: string;
  dataSource: string;   // "Finnhub News API"
}
```

### Backend Implementation

```typescript
// server/services/ai/summaryGenerator.ts
import { geminiClient } from './geminiClient';
import { finnhubClient } from '../market/finnhubClient';
import { cache } from '../cache';
import { AISummaryResponse } from '../../types';

const SUMMARY_PROMPT = `
You are a senior financial analyst. Analyze the following news headlines for {symbol} ({companyName}) and provide a concise investment summary.

NEWS HEADLINES:
{headlines}

CURRENT PRICE: ${price} (${changePercent}% today)

Respond with ONLY valid JSON matching this exact schema:
{
  "sentiment": {
    "score": <number 1-10, where 1=very bearish, 10=very bullish>,
    "label": "<Bearish|Somewhat Bearish|Neutral|Somewhat Bullish|Bullish>"
  },
  "summary": "<2-3 sentence overview of current situation>",
  "keyPoints": {
    "positive": ["<bullet point>", ...],
    "negative": ["<bullet point>", ...],
    "neutral": ["<bullet point>", ...]
  },
  "catalysts": ["<upcoming event that could move price>", ...],
  "risks": ["<key risk to watch>", ...]
}

Be specific, cite actual events from the headlines. Maximum 3 items per array.
`;

export async function generateStockSummary(symbol: string): Promise<AISummaryResponse> {
  const cacheKey = `ai:summary:${symbol}`;
  
  // Check cache (summaries valid for 30 min)
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  // Fetch required data
  const [quote, news, profile] = await Promise.all([
    finnhubClient.quote(symbol),
    finnhubClient.companyNews(symbol, getDateRange()),
    finnhubClient.companyProfile(symbol)
  ]);
  
  // Prepare headlines
  const headlines = news
    .slice(0, 10)
    .map((n: any) => `- ${n.headline} (${n.source}, ${formatDate(n.datetime)})`)
    .join('\n');
  
  // Build prompt
  const prompt = SUMMARY_PROMPT
    .replace('{symbol}', symbol)
    .replace('{companyName}', profile.name || symbol)
    .replace('{headlines}', headlines)
    .replace('{price}', quote.c.toFixed(2))
    .replace('{changePercent}', ((quote.c - quote.pc) / quote.pc * 100).toFixed(2));
  
  // Call Gemini
  const response = await geminiClient.generateContent(prompt);
  const text = response.response.text();
  
  // Parse and validate JSON
  let parsed: any;
  try {
    // Remove markdown code blocks if present
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Failed to parse Gemini response: ${text}`);
  }
  
  const result: AISummaryResponse = {
    symbol,
    sentiment: parsed.sentiment,
    summary: parsed.summary,
    keyPoints: parsed.keyPoints,
    catalysts: parsed.catalysts || [],
    risks: parsed.risks || [],
    generatedAt: new Date().toISOString(),
    dataSource: 'Finnhub News API'
  };
  
  // Cache for 30 minutes
  await cache.set(cacheKey, result, 1800);
  
  return result;
}

function getDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0]
  };
}
```

### Frontend Component

```tsx
// client/components/stock/AIInsightsCard.tsx
import { useQuery } from '@tanstack/react-query';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Calendar } from 'lucide-react';
import { SentimentGauge } from './SentimentGauge';

interface AIInsightsCardProps {
  symbol: string;
}

export function AIInsightsCard({ symbol }: AIInsightsCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['aiSummary', symbol],
    queryFn: () => fetch(`/api/ai/summary/${symbol}`).then(r => r.json()),
    staleTime: 1800000, // 30 minutes
    retry: 1,
  });
  
  if (isLoading) return <AIInsightsSkeleton />;
  if (error) return <AIInsightsError onRetry={() => refetch()} />;
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">AI Insights</h3>
        </div>
        <span className="text-xs text-slate-400">
          Updated {formatTimeAgo(data.generatedAt)}
        </span>
      </div>
      
      {/* Sentiment Gauge */}
      <div className="flex items-center gap-4 mb-6">
        <SentimentGauge score={data.sentiment.score} />
        <div>
          <div className="text-2xl font-bold text-white">
            {data.sentiment.score}/10
          </div>
          <div className={`text-sm font-medium ${getSentimentColor(data.sentiment.label)}`}>
            {data.sentiment.label}
          </div>
        </div>
      </div>
      
      {/* Summary */}
      <p className="text-slate-300 mb-6">{data.summary}</p>
      
      {/* Key Points */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {data.keyPoints.positive.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-green-400 text-sm font-medium mb-2">
              <TrendingUp className="w-4 h-4" />
              Positive
            </div>
            <ul className="space-y-1">
              {data.keyPoints.positive.map((point, i) => (
                <li key={i} className="text-sm text-slate-400">• {point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {data.keyPoints.negative.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-red-400 text-sm font-medium mb-2">
              <TrendingDown className="w-4 h-4" />
              Negative
            </div>
            <ul className="space-y-1">
              {data.keyPoints.negative.map((point, i) => (
                <li key={i} className="text-sm text-slate-400">• {point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {data.keyPoints.neutral.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-slate-400 text-sm font-medium mb-2">
              Neutral
            </div>
            <ul className="space-y-1">
              {data.keyPoints.neutral.map((point, i) => (
                <li key={i} className="text-sm text-slate-400">• {point}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Catalysts & Risks */}
      <div className="grid grid-cols-2 gap-4">
        {data.catalysts.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-blue-400 text-sm font-medium mb-2">
              <Calendar className="w-4 h-4" />
              Upcoming Catalysts
            </div>
            <ul className="space-y-1">
              {data.catalysts.map((item, i) => (
                <li key={i} className="text-sm text-slate-400">• {item}</li>
              ))}
            </ul>
          </div>
        )}
        
        {data.risks.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-orange-400 text-sm font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              Key Risks
            </div>
            <ul className="space-y-1">
              {data.risks.map((item, i) => (
                <li key={i} className="text-sm text-slate-400">• {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Data Source */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">
          Analysis based on {data.dataSource}. AI-generated summary, not financial advice.
        </p>
      </div>
    </div>
  );
}

function getSentimentColor(label: string): string {
  const colors = {
    'Bullish': 'text-green-400',
    'Somewhat Bullish': 'text-green-300',
    'Neutral': 'text-slate-400',
    'Somewhat Bearish': 'text-red-300',
    'Bearish': 'text-red-400',
  };
  return colors[label as keyof typeof colors] || 'text-slate-400';
}
```

---

## Feature 4: Natural Language Search

### API Endpoint

```typescript
// POST /api/ai/search
// Body: { query: string }

interface SearchFilters {
  type: 'stock' | 'crypto' | 'both';
  sector?: string;
  priceRange?: { min?: number; max?: number };
  changeDirection?: 'up' | 'down' | 'any';
  symbols?: string[];
  keywords?: string[];
  action?: 'search' | 'compare';
}

interface SearchResponse {
  query: string;
  parsedFilters: SearchFilters;
  results: (StockResult | CryptoResult)[];
  resultCount: number;
  processingTime: number;
}
```

### Gemini Prompt Template

```typescript
// server/services/ai/prompts.ts

export const SEARCH_PARSE_PROMPT = `
You are a financial search query parser. Convert natural language into structured filters.

User query: "{query}"

Return ONLY valid JSON matching this exact schema:
{
  "type": "stock" | "crypto" | "both",
  "sector": string | null,
  "priceRange": { "min": number | null, "max": number | null } | null,
  "changeDirection": "up" | "down" | "any",
  "symbols": string[],
  "keywords": string[],
  "action": "search" | "compare"
}

SECTOR VALUES (use exactly):
- "technology" - Tech companies (AAPL, MSFT, GOOG)
- "financials" - Banks, insurance (JPM, BAC, GS)
- "healthcare" - Pharma, biotech (JNJ, PFE, UNH)
- "energy" - Oil, gas, renewables (XOM, CVX, NEE)
- "consumer" - Retail, consumer goods (AMZN, WMT, PG)
- "industrials" - Manufacturing, aerospace (BA, CAT, GE)
- "semiconductors" - Chip makers (NVDA, AMD, INTC)
- "communications" - Media, telecom (META, DIS, VZ)
- "utilities" - Electric, water (NEE, DUK, SO)
- "realestate" - REITs (AMT, PLD, SPG)

EXAMPLES:

Query: "tech stocks"
Result: { "type": "stock", "sector": "technology", "changeDirection": "any", "symbols": [], "keywords": [], "action": "search" }

Query: "bitcoin and ethereum"
Result: { "type": "crypto", "symbols": ["BTC", "ETH"], "changeDirection": "any", "action": "search" }

Query: "stocks under $50"
Result: { "type": "stock", "priceRange": { "max": 50 }, "changeDirection": "any", "symbols": [], "action": "search" }

Query: "semiconductor stocks that are up"
Result: { "type": "stock", "sector": "semiconductors", "changeDirection": "up", "symbols": [], "action": "search" }

Query: "compare NVDA and AMD"
Result: { "type": "stock", "symbols": ["NVDA", "AMD"], "action": "compare" }

Query: "energy stocks down today"
Result: { "type": "stock", "sector": "energy", "changeDirection": "down", "action": "search" }

Query: "show me crypto"
Result: { "type": "crypto", "changeDirection": "any", "symbols": [], "action": "search" }

Query: "cheap bank stocks"
Result: { "type": "stock", "sector": "financials", "priceRange": { "max": 50 }, "action": "search" }

Respond with ONLY the JSON object, no explanation.
`;
```

### Backend Implementation

```typescript
// server/services/ai/searchParser.ts
import { geminiClient } from './geminiClient';
import { cache } from '../cache';
import { SEARCH_PARSE_PROMPT } from './prompts';
import { SearchFilters } from '../../types';
import { z } from 'zod';

// Zod schema for validation
const SearchFiltersSchema = z.object({
  type: z.enum(['stock', 'crypto', 'both']),
  sector: z.string().nullable().optional(),
  priceRange: z.object({
    min: z.number().nullable().optional(),
    max: z.number().nullable().optional(),
  }).nullable().optional(),
  changeDirection: z.enum(['up', 'down', 'any']).default('any'),
  symbols: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  action: z.enum(['search', 'compare']).default('search'),
});

export async function parseSearchQuery(query: string): Promise<SearchFilters> {
  // Normalize query
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check cache first (queries are often repeated)
  const cacheKey = `ai:search:${normalizedQuery}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  // Build prompt
  const prompt = SEARCH_PARSE_PROMPT.replace('{query}', query);
  
  try {
    // Call Gemini
    const response = await geminiClient.generateContent(prompt);
    const text = response.response.text();
    
    // Parse JSON
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    
    // Validate with Zod
    const validated = SearchFiltersSchema.parse(parsed);
    
    // Cache for 1 hour (search patterns are stable)
    await cache.set(cacheKey, validated, 3600);
    
    return validated;
    
  } catch (error) {
    console.error('Failed to parse search query:', error);
    
    // Fallback: basic keyword extraction
    return {
      type: 'both',
      changeDirection: 'any',
      symbols: [],
      keywords: query.split(/\s+/).filter(w => w.length > 2),
      action: 'search',
    };
  }
}
```

### Search Service

```typescript
// server/services/ai/searchService.ts
import { parseSearchQuery } from './searchParser';
import { stockService } from '../market/stockService';
import { cryptoService } from '../market/cryptoService';
import { SearchResponse, SearchFilters } from '../../types';

export async function executeSearch(query: string): Promise<SearchResponse> {
  const startTime = Date.now();
  
  // Parse the query with Gemini
  const filters = await parseSearchQuery(query);
  
  // Execute search based on filters
  let results: any[] = [];
  
  if (filters.action === 'compare' && filters.symbols.length >= 2) {
    // Comparison mode
    results = await Promise.all(
      filters.symbols.map(symbol => 
        filters.type === 'crypto' 
          ? cryptoService.getCrypto(symbol)
          : stockService.getStock(symbol)
      )
    );
  } else {
    // Search mode
    if (filters.type === 'stock' || filters.type === 'both') {
      const stocks = await stockService.searchStocks(filters);
      results.push(...stocks);
    }
    
    if (filters.type === 'crypto' || filters.type === 'both') {
      const cryptos = await cryptoService.searchCryptos(filters);
      results.push(...cryptos);
    }
  }
  
  // Apply additional filters
  results = applyFilters(results, filters);
  
  return {
    query,
    parsedFilters: filters,
    results,
    resultCount: results.length,
    processingTime: Date.now() - startTime,
  };
}

function applyFilters(items: any[], filters: SearchFilters): any[] {
  return items.filter(item => {
    // Price range filter
    if (filters.priceRange) {
      if (filters.priceRange.min && item.price < filters.priceRange.min) return false;
      if (filters.priceRange.max && item.price > filters.priceRange.max) return false;
    }
    
    // Change direction filter
    if (filters.changeDirection === 'up' && item.change24h < 0) return false;
    if (filters.changeDirection === 'down' && item.change24h > 0) return false;
    
    // Sector filter (stocks only)
    if (filters.sector && item.sector?.toLowerCase() !== filters.sector.toLowerCase()) {
      return false;
    }
    
    return true;
  });
}
```

### Frontend Search Component

```tsx
// client/components/search/SmartSearchBar.tsx
import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { SearchResults } from './SearchResults';

export function SmartSearchBar() {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  const searchMutation = useMutation({
    mutationFn: async (q: string) => {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      return res.json();
    },
  });
  
  const debouncedSearch = useDebounce((q: string) => {
    if (q.length >= 3) {
      searchMutation.mutate(q);
      setShowResults(true);
    }
  }, 500);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length >= 3) {
      searchMutation.mutate(query);
      setShowResults(true);
    }
  };
  
  return (
    <div className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Try: 'tech stocks that are up' or 'compare NVDA and AMD'"
            className="
              w-full pl-12 pr-12 py-3 
              bg-slate-800/50 border border-slate-700 rounded-xl
              text-white placeholder-slate-400
              focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
            "
          />
          
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {searchMutation.isPending ? (
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-purple-400" />
            )}
          </div>
        </div>
      </form>
      
      {/* AI badge */}
      <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
        <Sparkles className="w-3 h-3" />
        AI-powered search • Try natural language queries
      </div>
      
      {/* Results dropdown */}
      {showResults && searchMutation.data && (
        <SearchResults 
          data={searchMutation.data}
          onClose={() => setShowResults(false)}
        />
      )}
    </div>
  );
}
```

---

## API Routes Summary

```typescript
// server/routes/ai.ts
import { Router } from 'express';
import { generateStockSummary } from '../services/ai/summaryGenerator';
import { executeSearch } from '../services/ai/searchService';

const router = Router();

// Natural Language Search
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    if (query.length < 3) {
      return res.status(400).json({ error: 'Query too short' });
    }
    
    const results = await executeSearch(query);
    res.json(results);
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// AI Stock Summary
router.get('/summary/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const summary = await generateStockSummary(symbol.toUpperCase());
    res.json(summary);
    
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Market Hours
router.get('/market/hours', async (req, res) => {
  const statuses = getAllMarketStatuses();
  res.json(statuses);
});

export default router;
```

---

## Caching Strategy

| Data Type | Cache Key Pattern | TTL | Reason |
|-----------|-------------------|-----|--------|
| Stock Quote | `quote:{symbol}` | 60s | Prices change frequently |
| Stock History | `history:{symbol}:{range}` | 5-60 min | Based on range |
| AI Summary | `ai:summary:{symbol}` | 30 min | Expensive to generate |
| Search Parse | `ai:search:{query}` | 1 hour | Same queries = same filters |
| Company Profile | `profile:{symbol}` | 24 hours | Rarely changes |
| Market Hours | None | N/A | Computed, not fetched |

---

## Error Handling

```typescript
// server/utils/errors.ts

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class GeminiError extends APIError {
  constructor(message: string) {
    super(message, 503, 'AI_SERVICE_UNAVAILABLE');
  }
}

export class RateLimitError extends APIError {
  constructor(service: string) {
    super(`Rate limit exceeded for ${service}`, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);
  
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
```

---

## Environment Variables

```bash
# .env.example

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Market Data
FINNHUB_API_KEY=your_finnhub_api_key_here
TWELVE_DATA_API_KEY=optional_backup_key

# Server
PORT=5000
NODE_ENV=development

# Cache (optional - defaults to in-memory)
REDIS_URL=redis://localhost:6379
```

---

## Implementation Order

### Phase 1: Foundation (Day 1)
1. ✅ Add Finnhub API key to `.env`
2. Set up cache service (in-memory first)
3. Create AI service folder structure
4. Implement Gemini client wrapper

### Phase 2: Market Hours (Day 1)
1. Implement `marketHours.ts` utility
2. Create `/api/market/hours` endpoint
3. Build `MarketHoursIndicator` component
4. Add to header/dashboard

### Phase 3: Historical Charts (Day 1-2)
1. Implement `historyService.ts`
2. Create `/api/stocks/:symbol/history` endpoint
3. Build `StockChart` component with Recharts
4. Add `ChartControls` for range selection
5. Integrate into `StockPage`

### Phase 4: AI Summary (Day 2)
1. Create prompt template
2. Implement `summaryGenerator.ts`
3. Create `/api/ai/summary/:symbol` endpoint
4. Build `AIInsightsCard` component
5. Build `SentimentGauge` component
6. Integrate into `StockPage`

### Phase 5: Natural Language Search (Day 2-3)
1. Create search prompt template
2. Implement `searchParser.ts`
3. Implement `searchService.ts`
4. Create `/api/ai/search` endpoint
5. Build `SmartSearchBar` component
6. Build `SearchResults` component
7. Replace existing search bar

### Phase 6: Testing & Polish (Day 3)
1. Test all endpoints manually
2. Handle edge cases
3. Add loading states
4. Add error states
5. Test on mobile
6. Deploy to Coolify

---

## Success Criteria

| Feature | Success Metric |
|---------|---------------|
| Historical Charts | Charts render for any valid symbol, all ranges work |
| Market Hours | Accurate open/close status, countdown works |
| AI Summary | Returns valid JSON, sentiment score is reasonable |
| NL Search | "tech stocks" returns tech stocks, "crypto" returns crypto |
| Overall | All features work on free tier without hitting limits |

---

## Interview Talking Points

### What This Demonstrates

1. **API Integration** - Multiple external services (Finnhub, CoinGecko, Gemini)
2. **LLM Engineering** - Structured outputs, prompt design, error handling
3. **Caching Strategy** - Different TTLs for different data types
4. **Service Layer Pattern** - Clean separation of concerns
5. **Type Safety** - Zod validation, TypeScript throughout
6. **Production Mindset** - Rate limiting, fallbacks, error handling

### Key Phrases for Interviews

> "I built a natural language search using Gemini that parses user intent into structured filters. It's not a demo - it runs on production architecture with proper caching, validation, and fallbacks."

> "The AI summary feature fetches news from Finnhub, sends it to Gemini with a structured prompt, and returns validated JSON with sentiment scores and key points."

> "Everything runs on free API tiers but the architecture scales to paid. Zero code changes required - just update the API keys."

---

*Document created for TickerHub AI Features implementation*  
*Ready for Claude Code execution*
