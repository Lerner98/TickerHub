# CryptoLens - Crypto Analytics Platform
## Architecture & Design Document

---

## 1. APPLICATION OVERVIEW

**Name:** CryptoLens  
**Tagline:** "Real-time blockchain insights at your fingertips"  
**Type:** Multi-chain blockchain explorer and analytics platform  
**Target Users:** Crypto traders, investors, researchers, and enthusiasts

**Core Value Proposition:**
- Real-time blockchain data aggregation
- Multi-chain support (Bitcoin, Ethereum, Solana, etc.)
- Clean, intuitive interface for complex data
- Transaction tracking and address monitoring
- Market analytics and price feeds

---

## 2. TECHNOLOGY STACK

### Frontend
- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand or React Context
- **Charts:** Recharts or Chart.js
- **HTTP Client:** Axios
- **Routing:** React Router v6

### Backend (Optional - can start with APIs only)
- **Runtime:** Node.js with Express
- **Language:** TypeScript
- **Caching:** Redis (for API response caching)
- **Rate Limiting:** express-rate-limit

### Data Sources (Third-party APIs)
- **Blockchain Data:** 
  - Etherscan API (Ethereum)
  - Blockchain.com API (Bitcoin)
  - Solscan API (Solana)
- **Price Data:** 
  - CoinGecko API (free tier)
  - CryptoCompare API
- **Gas Prices:** Etherscan Gas Tracker
- **Alternative:** Alchemy, Infura for direct node access

### Deployment
- **Frontend:** Vercel or Netlify
- **Backend (if needed):** Railway, Render, or AWS Lambda
- **Domain:** Custom domain via Namecheap/GoDaddy

---

## 3. APPLICATION ARCHITECTURE

### High-Level Architecture
```
┌─────────────────────────────────────────────────┐
│              USER INTERFACE (React)              │
├─────────────────────────────────────────────────┤
│  Dashboard | Explorer | Transactions | Analytics│
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│         API INTEGRATION LAYER                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Etherscan│  │CoinGecko │  │ Solscan  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│          CACHING LAYER (Optional)                │
│              Redis / LocalStorage                │
└──────────────────────────────────────────────────┘
```

### Frontend Architecture
```
src/
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Card.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   ├── dashboard/
│   │   ├── PriceCard.tsx
│   │   ├── MarketOverview.tsx
│   │   ├── TrendingCoins.tsx
│   │   └── NetworkStats.tsx
│   ├── explorer/
│   │   ├── BlockList.tsx
│   │   ├── BlockDetails.tsx
│   │   ├── TransactionList.tsx
│   │   └── AddressDetails.tsx
│   ├── charts/
│   │   ├── PriceChart.tsx
│   │   ├── HashRateChart.tsx
│   │   └── GasChart.tsx
│   └── search/
│       └── SearchBar.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── DashboardPage.tsx
│   ├── BlockExplorerPage.tsx
│   ├── TransactionPage.tsx
│   ├── AddressPage.tsx
│   └── AnalyticsPage.tsx
├── services/
│   ├── api/
│   │   ├── etherscan.ts
│   │   ├── coingecko.ts
│   │   ├── solscan.ts
│   │   └── blockchain.ts
│   └── cache/
│       └── cacheManager.ts
├── hooks/
│   ├── useBlockchain.ts
│   ├── usePriceData.ts
│   ├── useTransactions.ts
│   └── useWebSocket.ts
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
├── types/
│   ├── blockchain.ts
│   ├── transaction.ts
│   └── api.ts
├── store/
│   └── appStore.ts
├── App.tsx
└── main.tsx
```

---

## 4. CORE FEATURES & PAGES

### 4.1 Landing Page
**Purpose:** Marketing page that converts visitors to users  
**Components:**
- Hero section with real-time crypto ticker
- Feature highlights (3-4 key features)
- Live statistics (total blocks processed, transactions tracked)
- Call-to-action: "Explore Now"

### 4.2 Dashboard Page (Main Hub)
**Route:** `/dashboard`  
**Features:**
- **Market Overview Panel**
  - Top 10 cryptocurrencies by market cap
  - 24h price changes with color coding
  - Trading volume
- **Network Statistics Cards**
  - Bitcoin: Block height, hash rate, avg block time
  - Ethereum: Gas prices (low/avg/high), TPS, block number
  - Solana: TPS, active validators, epoch progress
- **Recent Blocks Widget**
  - Last 10 blocks across networks
  - Block height, timestamp, transactions count
- **Price Charts**
  - BTC/ETH price charts (1D, 7D, 30D views)
  - Interactive with zoom and tooltip

### 4.3 Block Explorer
**Route:** `/explorer/:chain`  
**Supported Chains:** Bitcoin, Ethereum, Solana (phase 1)  
**Features:**
- **Search Bar** (prominent)
  - Accept: Block number, transaction hash, address
  - Auto-detect input type
  - Search history dropdown
- **Block List View**
  - Table: Block #, Timestamp, Transactions, Miner/Validator, Reward
  - Pagination (25 per page)
  - Real-time updates for latest blocks
- **Block Details Page** (`/block/:hash`)
  - Block metadata
  - Transaction list within block
  - Parent/child block links

### 4.4 Transaction Viewer
**Route:** `/tx/:hash`  
**Features:**
- Transaction status (confirmed/pending/failed)
- From/To addresses with labels if known
- Value transferred
- Gas used and gas price (for EVM chains)
- Block confirmation count
- Timestamp
- Input data (for contract interactions)
- Event logs (for smart contracts)

### 4.5 Address Lookup
**Route:** `/address/:address`  
**Features:**
- Balance (current)
- Transaction history (paginated)
- Token holdings (for Ethereum)
- Historical balance chart
- QR code for address
- "Add to watchlist" feature

### 4.6 Analytics Page
**Route:** `/analytics`  
**Features:**
- **Network Health Metrics**
  - Transaction throughput trends
  - Average fees over time
  - Network congestion indicators
- **Market Sentiment**
  - Fear & Greed Index integration
  - Top movers (gainers/losers)
- **Compare Mode**
  - Side-by-side comparison of chains
  - TPS, fees, block time comparisons

### 4.7 Search Functionality (Global)
**Location:** Header (always visible)  
**Capabilities:**
- Universal search across all chains
- Auto-suggestions as user types
- Search history (localStorage)
- Quick filters: "BTC only", "ETH only", etc.

---

## 5. KEY APIs & INTEGRATION

### Blockchain APIs

#### Etherscan API
```typescript
// API Key required (free tier: 5 calls/second)
const ETHERSCAN_ENDPOINTS = {
  latestBlock: 'https://api.etherscan.io/api?module=proxy&action=eth_blockNumber',
  blockByNumber: 'https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber',
  transaction: 'https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash',
  addressBalance: 'https://api.etherscan.io/api?module=account&action=balance',
  gasOracle: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle'
}
```

#### Blockchain.com API (Bitcoin)
```typescript
// No API key needed for basic endpoints
const BLOCKCHAIN_ENDPOINTS = {
  latestBlock: 'https://blockchain.info/latestblock',
  blockByHash: 'https://blockchain.info/rawblock/',
  transaction: 'https://blockchain.info/rawtx/',
  address: 'https://blockchain.info/rawaddr/'
}
```

#### CoinGecko API (Price Data)
```typescript
// Free tier: 10-50 calls/minute
const COINGECKO_ENDPOINTS = {
  prices: 'https://api.coingecko.com/api/v3/simple/price',
  marketData: 'https://api.coingecko.com/api/v3/coins/markets',
  trending: 'https://api.coingecko.com/api/v3/search/trending',
  historical: 'https://api.coingecko.com/api/v3/coins/{id}/market_chart'
}
```

### API Service Pattern
```typescript
// services/api/etherscan.ts
export class EtherscanService {
  private baseURL = 'https://api.etherscan.io/api';
  private apiKey = import.meta.env.VITE_ETHERSCAN_KEY;
  
  async getLatestBlock(): Promise<Block> {
    // Implementation with error handling
  }
  
  async getTransaction(hash: string): Promise<Transaction> {
    // Implementation with caching
  }
}
```

---

## 6. DATA MODELS

### TypeScript Interfaces

```typescript
// types/blockchain.ts

export interface Block {
  number: number;
  hash: string;
  timestamp: number;
  transactionCount: number;
  miner?: string; // Bitcoin/Ethereum
  validator?: string; // Solana/PoS chains
  size: number;
  gasUsed?: number; // Ethereum
  gasLimit?: number; // Ethereum
  difficulty?: string; // Bitcoin/PoW
  reward: string;
  parentHash: string;
}

export interface Transaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string; // Use string for big numbers
  fee: string;
  gasPrice?: string;
  gasUsed?: number;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  input?: string; // Contract data
}

export interface Address {
  address: string;
  balance: string;
  transactionCount: number;
  tokens?: Token[]; // For EVM chains
  firstSeen?: number;
  lastActivity?: number;
}

export interface Token {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  contractAddress: string;
}

export interface PriceData {
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export interface NetworkStats {
  chain: 'bitcoin' | 'ethereum' | 'solana';
  blockHeight: number;
  tps: number;
  averageBlockTime: number;
  hashRate?: string; // Bitcoin
  gasPrice?: GasPrice; // Ethereum
  activeValidators?: number; // PoS chains
}

export interface GasPrice {
  low: number;
  average: number;
  high: number;
  unit: 'gwei' | 'lamports';
}
```

---

## 7. UI/UX DESIGN GUIDELINES

### Design System

#### Theme: "Cyber Matrix" - Futuristic Blockchain Aesthetic

#### Color Palette
```css
/* Primary Colors - Neon Cyber Theme */
--primary: #00F5FF;      /* Cyan - electric blue */
--primary-dark: #00B8D4;
--primary-light: #B2EBF2;
--primary-glow: rgba(0, 245, 255, 0.5);

/* Secondary Colors */
--secondary: #B388FF;    /* Purple - digital violet */
--secondary-glow: rgba(179, 136, 255, 0.4);
--accent: #00E676;       /* Green - matrix green */
--accent-glow: rgba(0, 230, 118, 0.4);
--warning: #FFD600;      /* Yellow - alert */
--danger: #FF1744;       /* Red - critical */

/* Neutral Colors - Deep Space */
--background: #0A0E27;   /* Deep navy - space */
--surface: #141B3D;      /* Card background - dark blue */
--surface-light: #1E2749;
--surface-elevated: #252F56;
--text-primary: #FFFFFF;
--text-secondary: #8B9DC3;
--text-tertiary: #5A6B8C;
--border: #2A3555;
--grid-line: rgba(0, 245, 255, 0.1);
```

#### Animated Background System

**Background Theme: "Digital Matrix Flow"**
Create a dynamic, multi-layered animated background that evokes blockchain networks and data flow:

##### Layer 1: Base Gradient Animation
```css
/* Animated gradient background */
.background-base {
  background: linear-gradient(135deg, 
    #0A0E27 0%, 
    #141B3D 25%, 
    #1E2749 50%, 
    #141B3D 75%, 
    #0A0E27 100%);
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

##### Layer 2: Animated Grid Network
```css
/* Moving hexagonal grid pattern */
.grid-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridScroll 30s linear infinite;
  opacity: 0.3;
}

@keyframes gridScroll {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}
```

##### Layer 3: Floating Particles (Data Nodes)
```javascript
// Implement with canvas or CSS
// 50-100 small glowing particles that:
// - Float upward slowly (blockchain transactions metaphor)
// - Glow with cyan/purple colors
// - Fade in/out randomly
// - Move in smooth sine wave patterns
// - Connect with thin lines when near each other (network effect)

const particleConfig = {
  count: 80,
  colors: ['#00F5FF', '#B388FF', '#00E676'],
  size: { min: 2, max: 5 },
  speed: { min: 0.5, max: 2 },
  opacity: { min: 0.2, max: 0.8 },
  glowRadius: 10,
  connectionDistance: 150, // pixels
  connectionOpacity: 0.15
}
```

##### Layer 4: Flowing Data Streams
```css
/* Vertical flowing lines of "code" - Matrix style */
.data-stream {
  position: absolute;
  width: 2px;
  height: 100px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--primary-glow) 50%,
    transparent 100%
  );
  animation: streamFlow 4s linear infinite;
  opacity: 0.4;
}

@keyframes streamFlow {
  0% { 
    transform: translateY(-100%);
    opacity: 0;
  }
  50% { opacity: 0.6; }
  100% { 
    transform: translateY(100vh);
    opacity: 0;
  }
}

/* Spawn 15-20 streams at random X positions */
```

##### Layer 5: Glowing Orbs (Blockchain Nodes)
```css
/* Large, slow-moving glowing orbs */
.glow-orb {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    var(--primary-glow) 0%,
    transparent 70%
  );
  filter: blur(40px);
  animation: orbFloat 25s ease-in-out infinite;
  opacity: 0.2;
}

@keyframes orbFloat {
  0%, 100% { 
    transform: translate(0, 0) scale(1);
  }
  33% { 
    transform: translate(100px, -50px) scale(1.2);
  }
  66% { 
    transform: translate(-50px, 100px) scale(0.8);
  }
}

/* Place 3-5 orbs in different corners with different colors */
.orb-cyan { background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%); }
.orb-purple { background: radial-gradient(circle, var(--secondary-glow) 0%, transparent 70%); }
.orb-green { background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%); }
```

##### Layer 6: Pulsing Scanlines
```css
/* Subtle horizontal scanlines for retro-tech feel */
.scanlines {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    rgba(0, 245, 255, 0.03) 1px,
    transparent 2px,
    transparent 4px
  );
  pointer-events: none;
  animation: scanlineMove 8s linear infinite;
}

@keyframes scanlineMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}
```

##### Layer 7: Interactive Ripples (User Interaction)
```javascript
// On mouse move or click, create expanding ripple effects
const createRipple = (x, y) => {
  // SVG circle that expands and fades
  // Color: cyan with glow
  // Duration: 1.5s
  // Easing: ease-out
  // Remove after animation
}

document.addEventListener('mousemove', throttle((e) => {
  if (Math.random() > 0.95) { // Only 5% of moves create ripples
    createRipple(e.clientX, e.clientY);
  }
}, 100));
```

#### Implementation Stack for Animations
```json
{
  "canvas": {
    "library": "canvas or react-three-fiber",
    "purpose": "Particle system and connections"
  },
  "css": {
    "purpose": "Grid, gradients, orbs, scanlines, streams"
  },
  "svg": {
    "purpose": "Ripple effects and vector animations"
  },
  "performance": {
    "useRequestAnimationFrame": true,
    "enableGPUAcceleration": true,
    "reducedMotionQuery": "prefers-reduced-motion: reduce"
  }
}
```

#### Accessibility Note for Animations
```css
/* Respect user preferences for reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .data-stream,
  .floating-particle,
  .glow-orb {
    display: none;
  }
}
```

#### Typography
- **Headings:** Inter or Poppins (700 weight)
- **Body:** Inter (400 weight)
- **Monospace:** JetBrains Mono (for addresses, hashes)

#### Component Guidelines

**Visual Hierarchy with Depth:**
- **Cards:** 
  - Glass-morphism style with backdrop blur
  - Border: 1px solid with gradient (cyan to purple)
  - Background: rgba(20, 27, 61, 0.6) with blur(10px)
  - Box shadow: 0 8px 32px rgba(0, 245, 255, 0.1)
  - Hover: Lift with enhanced glow and scale(1.02)
  - Border glow animation on hover
  
- **Buttons:** 
  - Primary: Gradient background (cyan to purple), glow effect on hover
  - Secondary: Outlined with animated border gradient
  - Ghost: Text only with animated underline on hover
  - All buttons: Ripple effect on click, scale animation
  
- **Tables:** 
  - Transparent background with grid lines
  - Zebra striping with subtle glow on alternate rows
  - Sticky header with blur backdrop
  - Hover row: Cyan glow from left edge
  - Animated sorting indicators
  
- **Charts:** 
  - Dark theme with neon colors
  - Animated line drawing on load
  - Glowing data points
  - Interactive tooltips with glass-morphism
  - Gradient fills under area charts
  
- **Search:** 
  - Prominent placement with animated focus state
  - Glowing border on focus (cyan glow)
  - Animated placeholder text
  - Dropdown with slide-in animation
  - Keyboard navigation with visual feedback
  
- **Loading States:**
  - Skeleton screens with shimmer effect (cyan highlight)
  - Animated progress bars with glow
  - Pulse animations for loading indicators
  - Particle burst on successful load

**Interactive Elements:**
- Cursor: Custom glowing cursor trail (optional)
- Hover effects: Scale + glow for all interactive elements
- Click feedback: Ripple effect expanding from click point
- Scroll indicators: Animated with parallax effect
- Data updates: Pulse animation when values change

**Micro-interactions:**
- Copy to clipboard: Success glow animation
- Number counters: Animated count-up effect
- Status indicators: Pulsing glow for "live" status
- Notifications: Slide in with bounce from top-right

### Responsive Breakpoints
```css
/* Mobile First */
sm: 640px   /* Mobile landscape, small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktop */
2xl: 1536px /* Large desktop */
```

### Key UX Patterns
1. **Loading States:** Skeleton screens for data fetching
2. **Error Handling:** Toast notifications for errors, fallback UI
3. **Empty States:** Helpful messages with suggested actions
4. **Infinite Scroll:** For transaction lists and block lists
5. **Copy-to-Clipboard:** One-click copy for addresses/hashes
6. **Dark Mode:** Default theme (light mode optional)

---

## 8. PERFORMANCE OPTIMIZATION

### Caching Strategy
```typescript
// Cache configuration
const CACHE_DURATIONS = {
  priceData: 60 * 1000,        // 1 minute
  blockData: 5 * 60 * 1000,    // 5 minutes
  transactionData: 10 * 60 * 1000, // 10 minutes
  networkStats: 30 * 1000,     // 30 seconds
}

// Use localStorage for client-side caching
// Use Redis for server-side caching if backend exists
```

### API Rate Limiting
- Implement request queuing for API calls
- Show "rate limit reached" message gracefully
- Cache responses aggressively
- Batch requests where possible

### Code Splitting
```typescript
// Lazy load pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BlockExplorerPage = lazy(() => import('./pages/BlockExplorerPage'));
```

### Image Optimization
- Use WebP format with fallbacks
- Lazy load images below fold
- Use SVG for icons and logos

---

## 9. DEVELOPMENT PHASES

### Phase 1: MVP (2-3 weeks)
- [ ] Landing page
- [ ] Dashboard with live price data
- [ ] Basic Ethereum explorer (blocks, transactions)
- [ ] Search functionality
- [ ] Responsive design

### Phase 2: Multi-Chain (1-2 weeks)
- [ ] Bitcoin integration
- [ ] Solana integration
- [ ] Chain selector UI
- [ ] Network comparison feature

### Phase 3: Advanced Features (2-3 weeks)
- [ ] Address watchlist
- [ ] Advanced analytics
- [ ] Price alerts
- [ ] Historical data charts
- [ ] Export data (CSV/JSON)

### Phase 4: Polish & Scale (Ongoing)
- [ ] Performance optimization
- [ ] SEO implementation
- [ ] User accounts (optional)
- [ ] API documentation
- [ ] Mobile app considerations

---

## 10. ENVIRONMENT VARIABLES

```bash
# .env file structure
VITE_ETHERSCAN_API_KEY=your_key_here
VITE_COINGECKO_API_KEY=optional
VITE_SOLSCAN_API_KEY=optional
VITE_ENABLE_ANALYTICS=true
VITE_API_BASE_URL=http://localhost:3000
```

---

## 11. DEPLOYMENT CHECKLIST

### Pre-deployment
- [ ] Environment variables configured
- [ ] API rate limits tested
- [ ] Error boundaries implemented
- [ ] Loading states for all data fetches
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Accessibility audit (WCAG 2.1)

### Deployment
- [ ] Build optimization enabled
- [ ] CDN configured for static assets
- [ ] HTTPS/SSL enabled
- [ ] Domain configured with DNS
- [ ] Analytics tracking (Google Analytics/Plausible)
- [ ] Error monitoring (Sentry/LogRocket)

### Post-deployment
- [ ] Performance monitoring
- [ ] API usage tracking
- [ ] User feedback collection
- [ ] Regular dependency updates

---

## 12. SECURITY CONSIDERATIONS

1. **API Key Protection:** Never expose keys in frontend code
2. **Input Validation:** Sanitize all user inputs (addresses, hashes)
3. **XSS Prevention:** Use React's built-in protections
4. **HTTPS Only:** Force HTTPS in production
5. **Rate Limiting:** Implement on both client and server
6. **CORS:** Configure properly if backend exists

---

## 13. TESTING STRATEGY

### Unit Tests
- Utility functions (formatters, validators)
- API service methods
- React hooks

### Integration Tests
- Component interactions
- API integrations
- State management

### E2E Tests (Optional)
- Critical user flows
- Search functionality
- Navigation between pages

---

## 14. MAINTENANCE & MONITORING

### Key Metrics to Track
- Page load time
- API response times
- Error rates
- User engagement
- Search queries
- Most viewed transactions/blocks

### Monitoring Tools
- **Performance:** Vercel Analytics or Lighthouse CI
- **Errors:** Sentry
- **Usage:** Google Analytics or Plausible
- **Uptime:** UptimeRobot

---

## CONCLUSION

This architecture provides a solid foundation for building **CryptoLens**, a production-ready crypto analytics platform. The modular design allows for incremental development while maintaining code quality and scalability.

**Next Steps:**
1. Set up project repository
2. Initialize React + TypeScript + Tailwind
3. Obtain API keys for Etherscan and CoinGecko
4. Start with Phase 1 MVP features
5. Deploy to Vercel for public preview

**Estimated Timeline:** 6-8 weeks for full implementation (all phases)
**Budget (API costs):** $0 - $50/month (free tiers initially)

Good luck with your build! 🚀
