# TickerHub

A unified market intelligence platform for stocks, crypto, and blockchain data with real-time tracking, AI-powered features, and Google OAuth authentication.

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-20-339933)
![License](https://img.shields.io/badge/License-MIT-green)

---

## What It Does

TickerHub consolidates financial data that's typically fragmented across multiple platforms:

- **Stock Tracking** - 270+ US stocks (NASDAQ, NYSE) with real-time prices, charts, and metrics
- **Crypto Tracking** - 160+ cryptocurrencies with prices, market cap, and 7-day sparklines
- **Blockchain Explorer** - Bitcoin & Ethereum block/transaction/address lookup
- **Watchlists** - Save favorite assets with Google OAuth login
- **Market Hours** - Live status for NYSE, NASDAQ, LSE, TASE, and crypto (24/7)

---

## Live Features

| Feature | Status | Description |
|---------|--------|-------------|
| Dual-Provider Stocks | **Live** | Twelve Data (primary) + Finnhub (fallback) |
| Crypto Prices | **Live** | CoinGecko API with sparkline charts |
| Historical Charts | **Live** | 1D, 7D, 30D, 1Y timeframes |
| Market Hours | **Live** | Real-time open/close status with countdowns |
| Watchlists | **Live** | PostgreSQL + Better Auth + Google OAuth |
| Blockchain Explorer | **Live** | Blockchair API for BTC/ETH |
| Smart Search | **Live** | Fuse.js fuzzy search across all assets |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                          │
│              TanStack Query · Tailwind · Recharts               │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Express Backend                          │
│    Dual-Provider · Cache Layer · Rate Limiting · Better Auth    │
└─────────────────────────────────────────────────────────────────┘
                                 │
         ┌───────────────┬───────┴───────┬───────────────┐
         ▼               ▼               ▼               ▼
   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
   │  Twelve   │   │  Finnhub  │   │ CoinGecko │   │Blockchair │
   │   Data    │   │ (fallback)│   │  (crypto) │   │  (chain)  │
   └───────────┘   └───────────┘   └───────────┘   └───────────┘
```

### Key Design Patterns

- **Dual-Provider Fallback** - Twelve Data primary, Finnhub fallback for stocks
- **Cache-First Strategy** - 30s TTL for quotes, 5min for charts
- **Graceful Degradation** - Shows "N/A" when data unavailable instead of crashing
- **Type-Safe Unions** - `Asset = CryptoAsset | StockAsset` with discriminated types

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, Recharts |
| Backend | Node.js 20, Express, TypeScript |
| Database | PostgreSQL (Neon serverless) + Drizzle ORM |
| Auth | Better Auth + Google OAuth |
| Search | Fuse.js (client-side fuzzy) |
| APIs | Twelve Data, Finnhub, CoinGecko, Blockchair |

---

## API Endpoints

```bash
# Stocks
GET /api/stocks                    # Top stocks
GET /api/stocks/:symbol            # Single stock with metrics
GET /api/stocks/:symbol/chart      # Historical chart data

# Crypto
GET /api/prices                    # Top cryptocurrencies
GET /api/chart/:coinId/:range      # Crypto historical data

# Blockchain Explorer
GET /api/network/:chain            # Network stats (BTC/ETH)
GET /api/blocks/:chain/:limit      # Recent blocks
GET /api/tx/:hash                  # Transaction lookup
GET /api/address/:address          # Address balance/txs

# Auth & User
GET /api/auth/session              # Current session
POST /api/auth/signin/social       # Google OAuth
GET /api/watchlist                 # User's saved assets
POST /api/watchlist                # Add to watchlist
DELETE /api/watchlist/:id          # Remove from watchlist

# System
GET /api/health                    # Health check
GET /api/stats                     # Platform statistics
```

---

## Project Structure

```
TickerHub/
├── client/src/
│   ├── components/          # UI components (GlassCard, StockChart, etc.)
│   ├── pages/               # Route pages (Dashboard, Stock, Explorer, etc.)
│   ├── hooks/               # useAuth, useWatchlist, useAssetSearch
│   ├── features/            # Feature modules (stocks, crypto)
│   ├── services/            # API clients
│   └── data/                # Static datasets (stocks.ts, crypto.ts)
├── server/
│   ├── api/
│   │   ├── stocks/          # Twelve Data + Finnhub integration
│   │   ├── crypto/          # CoinGecko integration
│   │   ├── blockchain/      # Network stats
│   │   ├── explorer/        # Transaction/address lookup
│   │   └── watchlist/       # User watchlists
│   ├── auth/                # Better Auth configuration
│   ├── db/                  # Drizzle schema + migrations
│   ├── lib/                 # Cache, apiClient, logger, constants
│   └── middleware/          # Auth, rate limiting, security
├── shared/
│   └── schema.ts            # Shared TypeScript types
└── INTEGRATION_PLAN.md      # AI features + FMP roadmap
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- PostgreSQL (or Neon account for serverless)

### Installation

```bash
git clone https://github.com/Lerner98/TickerHub.git
cd TickerHub
npm install
cp .env.example .env
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TWELVE_DATA_API_KEY` | Recommended | Primary stock data (800 calls/day free) |
| `FINNHUB_API_KEY` | Recommended | Stock fallback + profiles (60 calls/min free) |
| `DATABASE_URL` | For watchlists | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | For auth | Random secret for sessions |
| `GOOGLE_CLIENT_ID` | For auth | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For auth | Google OAuth client secret |

All APIs have free tiers. App works without any keys (shows "N/A" for missing data).

### Running

```bash
npm run dev        # Development server
npm run build      # Production build
npm run check      # TypeScript validation
```

---

## Data Coverage

### Stocks (270+)
- US Markets: NASDAQ, NYSE
- Metrics: Price, Change, Volume, Market Cap, Sector, Day Range
- Charts: 1D, 7D, 30D, 1Y timeframes via Twelve Data

### Crypto (160+)
- Top cryptocurrencies by market cap
- Metrics: Price, Change, Market Cap, Volume, 7-day sparkline
- Categories: Currency, Smart Contract, DeFi, Meme, Gaming

### Blockchain
- Bitcoin: Blocks, transactions, addresses
- Ethereum: Blocks, transactions, addresses
- No API key required (Blockchair free tier)

---

## Premium Configuration

TickerHub runs on **free API tiers** by default with zero cost.

### Current Free Tier Usage

| API | Free Limit | What It Powers |
|-----|------------|----------------|
| Twelve Data | 800 calls/day | Stock prices, charts |
| Finnhub | 60 calls/min | Stock fallback, profiles, market cap |
| CoinGecko | 30 calls/min | Crypto prices, sparklines |
| Blockchair | Unlimited basic | Blockchain explorer |

### Upgrading for Production

| API | Premium Plan | Price | What You Get |
|-----|--------------|-------|--------------|
| Twelve Data | Growth | $29/mo | 12,000 calls/day, websockets |
| Finnhub | Premium | $50/mo | Unlimited, full fundamental data |
| FMP | Starter | $15/mo | P/E ratio, top gainers/losers |
| Gemini | Pay-as-you-go | ~$0.001/call | AI search, stock summaries |

**For demos:** Free tiers are sufficient
**For production:** Twelve Data ($29) + FMP ($15) = $44/mo for full features

---

## Roadmap

See [INTEGRATION_PLAN.md](INTEGRATION_PLAN.md) for detailed implementation plan.

### Coming Soon

- [ ] **FMP Integration** - Real top gainers/losers from entire market
- [ ] **AI Natural Language Search** - "show me tech stocks that are up"
- [ ] **AI Stock Summaries** - Sentiment analysis + insights via Gemini
- [ ] **More Metrics** - P/E ratio, EPS, 52-week range via FMP

### Recently Completed

- [x] Google OAuth authentication
- [x] Watchlist with PostgreSQL persistence
- [x] Dual-provider stock data (Twelve Data + Finnhub)
- [x] Historical charts (1D/7D/30D/1Y)
- [x] Market hours indicator
- [x] Stock metrics panel (Market Cap, Volume, Sector)

---

## License

MIT

---

## Contact

Guy Lerner - [GitHub](https://github.com/Lerner98)
