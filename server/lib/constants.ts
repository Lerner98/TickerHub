// API Base URLs
export const API_URLS = {
  COINGECKO: 'https://api.coingecko.com/api/v3',
  BLOCKCHAIR: 'https://api.blockchair.com',
  BLOCKCHAIN: 'https://blockchain.info',
  // Stock data providers (dual-provider: Twelve Data primary, Finnhub fallback)
  TWELVE_DATA: 'https://api.twelvedata.com',
  FINNHUB: 'https://finnhub.io/api/v1',
  // Stock symbols list (free, no API key required)
  DUMB_STOCK_API: 'https://dumbstockapi.com',
} as const;

// Cache TTLs (milliseconds)
export const CACHE_TTL = {
  PRICES: 60_000,        // 1 minute
  CHART: 300_000,        // 5 minutes
  NETWORK: 30_000,       // 30 seconds
  BLOCKS: 15_000,        // 15 seconds
  BLOCK: 300_000,        // 5 minutes
  BLOCK_TXS: 300_000,    // 5 minutes
  TRANSACTION: 600_000,  // 10 minutes
  ADDRESS: 60_000,       // 1 minute
  ADDRESS_TXS: 60_000,   // 1 minute
  STATS: 300_000,        // 5 minutes
  // Stock data caching
  STOCK_QUOTE: 60_000,   // 1 minute (balance between freshness and rate limits)
  STOCK_PROFILE: 86_400_000, // 24 hours (company info rarely changes)
  STOCK_CHART: 300_000,  // 5 minutes (charts don't need real-time, save API credits)
  NEWS: 600_000,         // 10 minutes (news doesn't change frequently)
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10_000,       // 10 seconds
  RATE_LIMIT: {
    WINDOW_MS: 60_000,   // 1 minute
    MAX_REQUESTS: 100,   // per window
  },
} as const;

// Supported chains
export const SUPPORTED_CHAINS = ['bitcoin', 'ethereum'] as const;
export type SupportedChain = typeof SUPPORTED_CHAINS[number];

// Time range mappings
export const TIME_RANGE_DAYS: Record<string, number> = {
  '1D': 1,
  '7D': 7,
  '30D': 30,
  '90D': 90,
  '1Y': 365,
};
