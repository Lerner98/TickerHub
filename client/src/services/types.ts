/**
 * API Response Types
 * Following Gold Standard: Centralized type definitions for all API interactions
 */

// Re-export shared types for convenience
export type {
  Block,
  Transaction,
  Address,
  Token,
  PriceData,
  NetworkStats,
  GasPrice,
  ChartDataPoint,
  TrendingCoin,
  ChainType,
  TimeRange,
  SearchType,
} from '@shared/schema';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string | number;
    statusCode?: number;
  };
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total?: number;
  hasMore?: boolean;
}

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
