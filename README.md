# TickerHub

A unified market intelligence platform aggregating real-time cryptocurrency and stock market data with a modular, production-ready architecture.

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-20-339933)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Overview

TickerHub addresses a common pain point: financial data is fragmented across multiple platforms. Crypto traders check one app, stock investors check another. This project consolidates both asset classes into a single, responsive interface with shared infrastructure.

### Core Objectives

1. **Unified Data Layer** - Single API abstraction over multiple data providers
2. **Production Reliability** - Circuit breakers, graceful degradation, structured error handling
3. **Developer Experience** - Zero external API calls during development (mock-first approach)
4. **Extensibility** - Type-safe architecture enabling new asset classes without refactoring

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
│         Domain Routes · Cache Layer · Circuit Breakers          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
          ┌───────────┐   ┌───────────┐   ┌───────────┐
          │ CoinGecko │   │  Finnhub  │   │ Etherscan │
          │  (Crypto) │   │  (Stocks) │   │   (Chain) │
          └───────────┘   └───────────┘   └───────────┘
```

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Discriminated Union Types** | `Asset = CryptoAsset \| StockAsset` enables type-safe handling while sharing common UI components |
| **Circuit Breaker Pattern** | Prevents cascade failures when external APIs degrade; automatic recovery with half-open state |
| **Cache-First Strategy** | 60s TTL for quotes, 24h for profiles; stale data preferred over errors |
| **Mock-First Development** | Zero API costs during development; instant feedback loops |

---

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **TanStack Query** for server state management
- **Tailwind CSS** + shadcn/ui components
- **Recharts** for data visualization
- **Wouter** for lightweight routing

### Backend
- **Node.js 20** + Express
- **TypeScript** (ESM source, CJS production bundle)
- **Zod** for runtime validation
- **esbuild** for fast production builds

### Infrastructure
- **Docker** multi-stage builds
- **GitHub Actions** CI/CD pipeline
- **Coolify** deployment integration

---

## API Endpoints

```
# Cryptocurrency
GET /api/prices                    # Top cryptocurrencies
GET /api/chart/:coinId/:range      # Historical price data

# Stock Market
GET /api/stocks                    # Top stocks
GET /api/stocks/:symbol            # Single stock details
GET /api/stocks/search?q=          # Symbol search
GET /api/stocks/batch?symbols=     # Batch lookup (max 20)

# Blockchain Explorer
GET /api/network/:chain            # Network statistics
GET /api/blocks/:chain/:limit      # Recent blocks
GET /api/tx/:hash                  # Transaction details
GET /api/address/:address          # Address lookup

# System
GET /api/health                    # Service health check
GET /api/stats                     # Platform statistics
```

---

## Project Structure

```
TickerHub/
├── client/src/
│   ├── components/          # Reusable UI components
│   ├── pages/               # Route-level components
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utilities and helpers
├── server/
│   ├── api/
│   │   ├── crypto/          # CoinGecko integration
│   │   ├── stocks/          # Finnhub integration
│   │   ├── blockchain/      # Chain data routes
│   │   └── explorer/        # Transaction/address lookup
│   ├── lib/
│   │   ├── cache.ts         # In-memory cache with TTL
│   │   ├── apiClient.ts     # SSRF-safe HTTP client
│   │   ├── circuitBreaker.ts # Failure isolation
│   │   └── logger.ts        # Structured logging
│   └── mocks/               # Development mock data
├── shared/
│   └── schema.ts            # Shared TypeScript types
└── CHANGELOG/               # Version documentation
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+

### Installation

```bash
# Clone and install
git clone https://github.com/Lerner98/TickerHub.git
cd TickerHub
npm install

# Start development server (uses mock data by default)
npm run dev
```

### Environment Variables

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `FINNHUB_API_KEY` | No* | Stock market data (mocked in dev) |
| `ETHERSCAN_API_KEY` | No | Enhanced blockchain data |
| `USE_REAL_API` | No | Set `true` to use live APIs in dev |

*Mock data is used by default in development.

### Available Scripts

```bash
npm run dev        # Development server (mock data)
npm run dev:real   # Development with live APIs
npm run build      # Production build
npm run check      # TypeScript validation
npm run lint       # ESLint check
```

---

## Development Approach

### Mock-First Strategy

Development uses pre-seeded mock data by default. This provides:
- **Zero API costs** during development
- **Consistent test data** across environments
- **Offline development** capability
- **Fast iteration** without rate limits

Production never falls back to mock data. The fallback chain is:
```
Real API → Stale Cache (5 min) → Graceful Error Response
```

### Error Handling Philosophy

External API failures are expected, not exceptional. The system degrades gracefully:

```typescript
// User sees friendly message, not stack trace
res.status(503).json({
  error: 'Service temporarily unavailable',
  message: 'Stock data is currently unavailable. Please try again shortly.',
  retryAfter: 60
});
```

---

## CI/CD Pipeline

```
Push to main
     │
     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Lint     │ ──▶ │    Build    │ ──▶ │   Deploy    │
│  (ESLint)   │     │   (Vite +   │     │  (Coolify)  │
│             │     │   esbuild)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

- **Lint**: Code quality validation
- **Build**: TypeScript compilation, Vite client bundle, esbuild server bundle
- **Deploy**: Webhook trigger to Coolify for container deployment

---

## Current Status

| Phase | Status | Description |
|-------|--------|-------------|
| Crypto MVP | Complete | Price tracking, charts, blockchain explorer |
| Stock Data Layer | Complete | Finnhub integration, unified types |
| Stock UI | Complete | Dashboard integration, stock cards |
| Production Audit | Complete | ESM/CJS compatibility, build verification |

### Next Milestones
- Unified asset search (crypto + stocks)
- User watchlists with persistence
- Price alerts system

---

## License

MIT

---

## Contact

Guy Lerner - [GitHub](https://github.com/Lerner98)
