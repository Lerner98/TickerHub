# CLAUDE.md - TickerHub Development Guidelines

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
  - Finnhub (stock quotes - fallback)
  - Blockchair (blockchain explorer)

### API Integration Standards

1. **SSRF Protection** - All external URLs validated against allowlist in `apiClient.ts`
2. **Timeout Handling** - All API calls have configurable timeouts
3. **Error Propagation** - Errors bubble up with meaningful messages
4. **Rate Limiting** - Respect API rate limits:
   - CoinGecko: 10-30 calls/min (free tier)
   - Twelve Data: 800 calls/day, 8/min (free tier)
   - Finnhub: 60 calls/min (free tier)
   - Blockchair: free tier limits
5. **Dual-Provider Pattern** - Stock data uses Twelve Data (primary) → Finnhub (fallback) → null

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
