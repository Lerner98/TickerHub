# Changelog

All notable changes to TickerHub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

> **Detailed Release Notes**: See [docs/changelog/](docs/changelog/) for version-specific changelogs.

---

## [Unreleased]

### Planned (Phase 6: Polish & Optimization)
- Performance optimization (bundle size, lazy loading)
- Error boundary improvements
- Accessibility audit (WCAG compliance)
- Mobile responsiveness polish
- SEO optimization

---

## [1.5.0] - 2025-12-16 - AI Features Complete

### Added

#### Phase 5: AI Features (COMPLETE)
- **5A: Gemini AI Integration** (`gemini-1.5-flash-8b` model)
  - Natural language search parsing (`POST /api/ai/search`)
  - AI stock summaries with sentiment analysis (`GET /api/ai/summary/:symbol`)
  - Market overview generation (`GET /api/ai/market`)
  - AI service status endpoint (`GET /api/ai/status`)
  - Rate limiting: 15 requests/minute (free tier)
  - Response caching with 2-hour TTL

- **5B: AI Stock Summary with Sentiment**
  - Sentiment score (1-10) with visual gauge
  - Key points extraction (positive/negative/neutral)
  - Catalysts and risks identification
  - Data source attribution

- **5C: Natural Language Search**
  - Intent detection (stock/crypto/both)
  - Sector filtering
  - Price direction detection
  - Symbol extraction
  - Fallback keyword parsing when AI unavailable

- **5D: AI-Powered Market Overview**
  - Market sentiment indicator (Risk-On/Risk-Off/Mixed/Neutral)
  - Top market themes
  - Sectors to watch (bullish/bearish)
  - Outlook summary

- **5E: Lazy Loading for AI Features (Quota Conservation)**
  - `AIInsightsCard`: Button-triggered fetch (not auto-fetch)
  - `SmartSearchBar`: AI parsing only on form submit (not while typing)
  - Extended cache TTLs:
    - Search cache: 4 hours (server)
    - Summary cache: 2 hours (server + client)
    - Market overview: 1 hour (server + client)
    - AI response cache: 2 hours (geminiClient)
  - Fuse.js instant search works without AI quota

- **AI Frontend Components**
  - `SmartSearchBar.tsx` - Natural language search with AI parsing
  - `AIInsightsCard.tsx` - Lazy-loaded stock insights
  - `SentimentGauge.tsx` - Visual sentiment indicator (1-10 scale)
  - `useStockSummary.ts` hook with React Query
  - `useAISearch.ts` hook for search parsing

- **JSON Parsing Improvements**
  - Robust extraction from markdown code blocks
  - Truncation repair for incomplete AI responses
  - Balance tracking for nested JSON structures

### Changed
- Extended all AI-related cache TTLs (from 10-30min to 1-4 hours)
- SmartSearchBar no longer calls AI on every keystroke
- AIInsightsCard requires button click to fetch (preserves API quota)

---

## [1.4.0] - 2025-12-16 - FMP Integration

### Added
- **FMP Integration** (Phase 4): Full backend integration COMPLETE
  - Market Movers: `/api/stocks/movers/gainers`, `/losers`, `/actives`
  - Stock News: `/api/stocks/:symbol/news`
  - Company Profiles: `/api/stocks/:symbol/profile`
  - Components: `NewsCard`, `NewsList`, `CompanyProfile`
  - `TopStocksWithFilter` now fetches real FMP data with local fallback

- **Phase 4D: High-Value FMP Data (Retail Edge)** - Backend COMPLETE
  - **Analyst Intelligence**:
    - `/api/stocks/:symbol/estimates` - Revenue/EPS projections
    - `/api/stocks/:symbol/price-target` - Consensus price targets
    - `/api/stocks/:symbol/price-targets` - Individual analyst targets
    - `/api/stocks/:symbol/grades` - Upgrade/downgrade history
    - `/api/stocks/:symbol/consensus` - Buy/hold/sell distribution
  - **Calendar Events**:
    - `/api/stocks/calendar/earnings` - Upcoming earnings (30 days)
    - `/api/stocks/calendar/dividends` - Upcoming dividends
    - `/api/stocks/calendar/ipos` - Upcoming IPOs
    - `/api/stocks/calendar/splits` - Stock splits
    - `/api/stocks/:symbol/earnings` - Per-stock earnings history
  - **Sector Performance**:
    - `/api/stocks/sectors` - Sector heatmap data
  - **Financial Statements**:
    - `/api/stocks/:symbol/income` - Income statement (annual/quarter)
    - `/api/stocks/:symbol/balance-sheet` - Balance sheet
    - `/api/stocks/:symbol/cash-flow` - Cash flow statement
    - `/api/stocks/:symbol/metrics` - Key metrics (P/E, EV/EBITDA, ROE, etc.)
  - **Institutional Tracking**:
    - `/api/stocks/:symbol/institutions` - Institutional holders (13F data)
  - **News Aggregation**:
    - `/api/stocks/news` - General market news

### Planned (Frontend Components Needed)
- **Phase 4D UI Components**: `EarningsCalendar`, `AnalystRatings`, `SectorHeatmap`, `FinancialsTable`, `InstitutionalOwners`
- **AI Integration (Phase 5)**: Gemini-powered analysis of FMP data

---

## [1.3.0] - 2025-12-16

> [Detailed Release Notes](docs/changelog/v1.3.0.md)

### Added
- **Dual-Provider Stock Data**: Twelve Data (primary) + Finnhub (fallback) architecture
- **Finnhub Profile Enrichment**: Market Cap and Sector data now enriched from Finnhub when Twelve Data is used
- **Historical Stock Charts**: TradingView Lightweight Charts with 1D, 7D, 30D, 1Y timeframes
- **StockPage Tabs**: Chart, News, and About tabs for organized stock information
- **Market Hours Indicator**: Real-time open/close status for NYSE, NASDAQ, LSE, TASE
- **TopStocksWithFilter**: Dropdown filter component for stock sorting

### Changed
- **StockPage Layout Reorganized**:
  - Two-row metrics layout: Price action (Open, Prev Close, High, Low) + Fundamentals (Market Cap, Volume, Sector, P/E)
  - Removed duplicate Exchange and Symbol info
  - Added tabbed interface for Chart/News/About
- **Stock Chart**: Improved panning, scrolling, and timeframe-specific bar spacing
- **README.md**: Complete revamp with current architecture, API endpoints, premium configuration

### Fixed
- Stock chart data compression issue on 1D timeframe
- Chart not filling container width properly
- Finnhub profile data not being merged with Twelve Data quotes
- Hebrew locale date formatting in charts (changed to en-US)

---

## [1.2.0] - 2025-12-15

### Added
- **Google OAuth Authentication**: Better Auth with Google OAuth provider
- **Watchlist Feature**: PostgreSQL-backed watchlist with add/remove functionality
- **Neon PostgreSQL**: Serverless database integration with Drizzle ORM
- **Dashboard Reorganization**: Metric dropdowns and improved layout

### Changed
- Migrated from local storage to database-backed persistence
- Updated auth flow with Better Auth (replaced Lucia)

---

## [1.1.0] - 2025-12-09

### Added
- **Testing Infrastructure**: 69 tests across 6 test files
- **Vitest + Supertest + MSW**: Full testing stack
- **API Integration Tests**: `/api/stocks`, `/api/prices`, `/api/health`
- **Unit Tests**: `rateLimiter`, `errorHandler`, `cache`
- **Coverage Thresholds**: 69.66% statements, 54.46% branches

### Changed
- Backend converted to ESM for Better Auth compatibility
- Added `environmentMatchGlobs` for hybrid Node/jsdom testing

---

## [1.0.0] - 2025-12-08

### Added
- **Initial Release**
- **Crypto Tracking**: 160+ cryptocurrencies via CoinGecko API
- **Blockchain Explorer**: Bitcoin & Ethereum via Blockchair API
- **Fuse.js Search**: Client-side fuzzy search across all assets
- **React + Vite Frontend**: TailwindCSS, shadcn/ui components
- **Express Backend**: TypeScript, rate limiting, caching

### Features
- Real-time crypto prices with 7-day sparklines
- Stock quotes with Finnhub integration
- Transaction and address lookup
- Block explorer for BTC/ETH
- Responsive glass-morphism UI design

---

## API Providers

| Provider | Purpose | Free Tier |
|----------|---------|-----------|
| Twelve Data | Primary stock data | 800 calls/day |
| Finnhub | Stock fallback + profiles | 60 calls/min |
| CoinGecko | Crypto prices | 30 calls/min |
| Blockchair | Blockchain explorer | Unlimited basic |
| **FMP** | Market movers, news, profiles | 250 calls/day |

> **FMP API Coverage**: See [FMP.md](../FMP.md) for full capabilities - financial statements, charts, 13F filings, earnings transcripts, economic data, and more.

---

## Future Releases

### [1.6.0] - Planned (Phase 6: Polish & Optimization)
- Performance optimization (bundle size, lazy loading)
- Error boundary improvements
- Accessibility audit (WCAG compliance)
- Mobile responsiveness polish
- SEO optimization

### [1.7.0] - Planned (Phase 7: Deployment)
- Production build configuration
- Environment variable management
- CI/CD pipeline setup
- Monitoring & logging
- Documentation finalization

### [2.0.0] - Planned (User Features)
- Portfolio Tracking
- Price Alerts (Browser + Email)
- Multi-device Watchlist Sync
- Cross-Asset Correlation Engine
- Advanced Charting (candlestick, indicators)
- Tax Report Generation
