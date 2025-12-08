# TickerHub - Continuation Guide

> Created: December 8, 2025
> Branch: `feature/stock-market-expansion`
> Status: Phase 2 UI Integration COMPLETE

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

## Next Steps (Phase 3+)

### Phase 3: Persistence Layer (FOUNDATION)
**Goal:** Enable user-specific features (watchlists, portfolios, alerts)

#### Stack Decision (Researched 2025-12-08)
| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Database** | Neon | Serverless PostgreSQL, free tier, auto-scaling, PITR backups |
| **ORM** | Drizzle | Already in project, type-safe, excellent migrations |
| **Auth** | Better Auth | Self-hosted, Express-native, Lucia successor (Lucia deprecated March 2025) |

#### Research Findings
- **Better Auth:** Requires ESM (`"type": "module"`). CJS not supported.
  - **Risk:** Our production build outputs CJS. Need to verify compatibility or adjust build.
  - Source: [Better Auth Express Docs](https://www.better-auth.com/docs/integrations/express)
- **Drizzle + Neon:** Native `neon-http` driver for serverless.
  - Migrations via `drizzle-kit generate` + `drizzle-kit migrate`
  - Source: [Drizzle Neon Guide](https://orm.drizzle.team/docs/tutorials/drizzle-with-neon)
- **Lucia Auth:** Deprecated as of March 2025. Better Auth is recommended successor.
  - Source: [Lucia Discussion #1707](https://github.com/lucia-auth/lucia/discussions/1707)

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

export const watchlistItems = pgTable('watchlist_items', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  assetId: text('asset_id').notNull(),       // "AAPL" or "bitcoin"
  assetType: text('asset_type').notNull(),   // "stock" | "crypto"
  addedAt: timestamp('added_at').defaultNow(),
});
```

#### Migration Strategy
- **Tool:** `drizzle-kit` for schema management
- **Naming:** Timestamped migrations (`20251208_initial_schema.sql`)
- **Tracking:** `__drizzle_migrations` table
- **Environments:** Separate Neon branches for dev/staging/prod
- **Pre-deploy:** Always snapshot before schema changes

#### Database Security & Best Practices
- **Backups:** Neon PITR (30 days), manual snapshots before migrations
- **External backups:** GitHub Actions → S3 (for compliance)
- **Connection:** Use pooled connections in production, direct for migrations
- **Secrets:** `DATABASE_URL` in environment, never committed

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
1. **Infrastructure:** Create Neon project, get `DATABASE_URL`
2. **Drizzle setup:** `drizzle.config.ts`, schema file
3. **Run migration:** `drizzle-kit generate` + `drizzle-kit migrate`
4. **Better Auth:** Mount on `/api/auth/*`, configure session storage
5. **Protected routes:** Middleware for `/api/watchlist/*`
6. **Frontend:** Auth context, login UI

#### Compatibility Check (BEFORE IMPLEMENTATION)
- [ ] Verify Better Auth works with CJS production build
- [ ] Test Neon connection from Docker container
- [ ] Confirm Drizzle migrations run in CI/CD pipeline

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
