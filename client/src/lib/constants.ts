/**
 * Design tokens and configuration constants
 * Following Gold Standard: Never use magic numbers in components
 */

export const API_ENDPOINTS = {
  // Crypto endpoints
  PRICES: '/api/prices',
  CHART: '/api/chart',
  STATS: '/api/stats',

  // Blockchain endpoints
  NETWORK: '/api/network',
  BLOCKS: '/api/blocks',
  BLOCK: '/api/block',

  // Explorer endpoints
  TRANSACTION: '/api/tx',
  ADDRESS: '/api/address',

  // Stock endpoints
  STOCKS: '/api/stocks',
  STOCKS_SEARCH: '/api/stocks/search',
  STOCKS_BATCH: '/api/stocks/batch',
  STOCKS_STATUS: '/api/stocks/status',

  // System endpoints
  HEALTH: '/api/health',
} as const;

export const CACHE_CONFIG = {
  PRICES_REFETCH_INTERVAL: 30_000,      // 30 seconds
  NETWORK_REFETCH_INTERVAL: 15_000,     // 15 seconds
  BLOCKS_REFETCH_INTERVAL: 10_000,      // 10 seconds
  STOCKS_REFETCH_INTERVAL: 60_000,      // 60 seconds
  STALE_TIME: 60_000,                   // 1 minute
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  BLOCKS_PER_PAGE: 8,
  TRANSACTIONS_PER_PAGE: 20,
} as const;

export const SUPPORTED_CHAINS = ['bitcoin', 'ethereum'] as const;
export type SupportedChain = typeof SUPPORTED_CHAINS[number];

export const TIME_RANGES = ['1D', '7D', '30D', '90D', '1Y'] as const;
export type TimeRange = typeof TIME_RANGES[number];

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1400,
  popover: 1500,
  toast: 1800,
} as const;

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;
