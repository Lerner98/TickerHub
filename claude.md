# TickerHub - Project Context for Claude

## Project Overview
**Name:** TickerHub
**Type:** Unified Market Intelligence Platform
**Vision:** Aggregate real-time cryptocurrency AND stock market data with AI-powered natural language queries and customizable alerts.

**Current State:** Crypto MVP complete, Stock market Phase 2 (UI integration) complete.

---

## MOCK DATA ISOLATION (ABSOLUTE LAW)

> **This is non-negotiable. Violations are critical bugs.**

### The Rule
```
Mock data exists ONLY for development/testing cost efficiency.
Production code MUST NEVER reference, fallback to, or touch mock data.
There must be ZERO trace of mock data in production runtime.
```

### What Mock Data Is For
- **Saving API costs** during development
- **Fast iteration** without rate limits
- **Testing** without external dependencies
- **NOTHING ELSE**

### Production Error Handling
When APIs fail in production, users see **graceful error messages**:

```typescript
// CORRECT - User-friendly response
res.status(503).json({
  error: 'Service temporarily unavailable',
  message: 'Stock data is currently unavailable. Please try again shortly.',
  retryAfter: 60
});

// WRONG - Raw null to user
return null;

// ABSOLUTELY FORBIDDEN - Mock fallback in production
catch (error) {
  return getMockData(); // NEVER DO THIS
}
```

### Production Fallback Chain
```
Real API → Stale Cache (short TTL) → Graceful User Error Message
```
**Mock data is NEVER in this chain.**

### Code Pattern Requirements
```typescript
// CORRECT: Mock gated by environment
if (shouldUseMock()) {
  return getMockData(); // Only in NODE_ENV=development/test
}
// Production continues to real API...

// CORRECT: Production error handling in routes
if (!data) {
  return res.status(503).json({
    error: 'Data unavailable',
    message: 'Unable to fetch data. Please try again.',
  });
}
```

### Pre-Deployment Checklist
- [ ] All `getMock*` calls behind `shouldUseMock()` guard
- [ ] No mock imports in production code paths
- [ ] Error handlers return user-friendly JSON responses
- [ ] `NODE_ENV=production` never triggers mock code

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
| API | Purpose | Auth Required |
|-----|---------|---------------|
| CoinGecko | Crypto prices, charts, market data | No (free tier) |
| Blockchain.com | Bitcoin blocks/transactions | No |
| Etherscan | Ethereum blocks/transactions | Optional |
| Finnhub | Stock prices and profiles | Yes (free tier) |

---

## Current File Structure
```
TickerHub/
├── client/src/
│   ├── components/       # UI components
│   ├── pages/            # Route pages
│   ├── hooks/            # Custom hooks
│   └── lib/              # Utilities
├── server/
│   ├── api/
│   │   ├── crypto/       # /api/prices, /api/chart
│   │   ├── blockchain/   # /api/network, /api/blocks
│   │   ├── explorer/     # /api/tx, /api/address
│   │   ├── stocks/       # /api/stocks endpoints
│   │   └── stats/        # /api/stats, /api/health
│   ├── lib/
│   │   ├── cache.ts
│   │   ├── apiClient.ts
│   │   ├── circuitBreaker.ts
│   │   └── logger.ts
│   ├── mocks/            # Dev-only mock data
│   └── middleware/
├── shared/
│   └── schema.ts         # Shared types
└── CHANGELOG/            # Version history
```

---

## UI/UX Guidelines (DO NOT CHANGE)

### Theme: "Cyber Matrix"
- **DO NOT** change the theme, colors, or background animations
- **DO NOT** modify the existing visual aesthetic
- **ONLY** add new UI elements for stock market features

### Design Tokens
```css
--primary: #00F5FF (cyan)
--secondary: #B388FF (purple)
--accent: #00E676 (green)
--background: #0A0E27 (deep navy)
```

---

## Stock Market Expansion

### Phase 1: Data Layer (COMPLETE)
- ✅ Finnhub API integration
- ✅ Unified Asset types in `shared/schema.ts`
- ✅ Circuit breaker pattern
- ✅ Mock data for development

### Phase 2: UI Integration (COMPLETE)
- ✅ StockCard component
- ✅ StockPage detail view
- ✅ Dashboard stocks section
- ✅ Header search with stocks
- ✅ useStocks hooks

### Phase 3: Persistence Layer (NEXT)
See `CONTINUE.md` for detailed plan.

---

## Environment Variables
```env
ETHERSCAN_API_KEY=     # Optional
FINNHUB_API_KEY=       # For stock data (mocks in dev)
USE_REAL_API=true      # Override mock mode
```

---

## Git Workflow

### Commit Message Guidelines (MANDATORY)
**NEVER include:**
- AI attribution
- Tool attribution
- Emojis
- Replit metadata

**Format:**
```
type: Short description

Optional longer description.
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`

---

## Key Decisions
1. **Mock data is dev-only** - Production NEVER uses mock data
2. **Graceful errors** - Users see friendly messages, not raw errors
3. **Circuit breaker** - Prevents cascade failures
4. **Modular API structure** - Domain-driven design

---

## Research Before Major Changes (MANDATORY)

> **Before adding new dependencies, changing architecture, or major pivots: RESEARCH FIRST.**

### The Rule
```
Major changes require web research to validate:
- Current library status (deprecated? maintained?)
- Compatibility with existing stack (ESM/CJS, Express, etc.)
- Production best practices
- Security implications
```

### What Requires Research
- New authentication systems
- Database/ORM changes
- New external service integrations
- Architecture pattern changes
- Major dependency additions

### Research Checklist
1. **Library status** - Is it actively maintained? Deprecated?
2. **Stack compatibility** - Works with our ESM source + CJS production build?
3. **Security** - Known vulnerabilities? Best practices documented?
4. **Migration path** - How do we adopt without breaking existing code?

### Document Decisions
After research, document the decision in:
- `CONTINUE.md` - For implementation plans
- `CHANGELOG/` - For completed changes
- This file - For permanent rules/patterns

---

## API Endpoints
```
# Crypto
GET /api/prices
GET /api/chart/:coinId/:range

# Blockchain
GET /api/network/:chain
GET /api/blocks/:chain/:limit/:page
GET /api/block/:chain/:number

# Explorer
GET /api/tx/:hash
GET /api/address/:address

# Stocks
GET /api/stocks
GET /api/stocks/:symbol
GET /api/stocks/search?q=
GET /api/stocks/batch?symbols=
GET /api/stocks/status

# System
GET /api/stats
GET /api/health
```

---

## Changelog System (MANDATORY)

### Location: `CHANGELOG/`
- `README.md` - System documentation
- `vX.Y.Z.md` - Version changelogs (max 500-600 lines each)

### Current Versions
- **v0.1.0** - Crypto MVP (complete)
- **v0.2.0** - Stock market expansion (in progress)

---

## API Testing Rules

### Environment Behavior
| Mode | External APIs |
|------|---------------|
| `development` | Mock data |
| `test` | Always mock |
| `production` | Real APIs + graceful errors (NEVER MOCK) |

### Commands
```bash
npm run dev        # Mock data (default)
npm run dev:real   # Real APIs
npm run test       # All mocked
```

---

## AI Provider Strategy

### Free Tier Stack ($0)
| Provider | Limit |
|----------|-------|
| Gemini | 15 RPM |
| Groq | 30 RPM |
| **Combined** | ~45 RPM |

SSRF Allowlist: `generativelanguage.googleapis.com`, `api.groq.com`

---

## Development Environment Quirks

### VSCode Format-on-Save Conflicts
**Problem:** VSCode auto-formats files on save, causing "file unexpectedly modified" errors when making sequential edits.

**Impact:** When Claude makes an edit, VSCode immediately reformats -> second edit fails because file hash changed.

**Solutions:**
1. **Make complete edits in one shot** - Combine related changes into single edit
2. **Read fresh before each edit** - If file was just modified, re-read it
3. **Expect reformatting** - The linter's changes are intentional, incorporate them

**Key Insight:** File modifications from VSCode/linters are INTENTIONAL. Don't fight them - work with the formatted result.

### ESM Module Compatibility
**Problem:** `__dirname` and `__filename` are not available in ES modules.

**Solution:** Add this at top of affected files:
```typescript
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### Background Processes
**Note:** Multiple dev server instances can accumulate. Kill stale processes:
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## Core Knowledge Files

Additional development guidance is in `docs/core-knowledge/`:
- `DEVELOPMENT_EFFICIENCY.md` - Token/cost optimization strategies
- `CONTEXT_MANAGEMENT.md` - Context and session continuity
