// API Base URLs
export const API_URLS = {
  COINGECKO: 'https://api.coingecko.com/api/v3',
  ETHERSCAN: 'https://api.etherscan.io/v2/api',
  BLOCKCHAIN: 'https://blockchain.info',
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
} as const;

// API Configuration
export const API_CONFIG: {
  TIMEOUT: number;
  RATE_LIMIT: { WINDOW_MS: number; MAX_REQUESTS: number };
  ETHERSCAN_API_KEY: string;
} = {
  TIMEOUT: 10_000,       // 10 seconds
  RATE_LIMIT: {
    WINDOW_MS: 60_000,   // 1 minute
    MAX_REQUESTS: 100,   // per window
  },
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY || '',
};

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
