/**
 * Stock Service
 * Prepared for Stock Market Expansion (Finnhub API)
 *
 * TODO: Implement when ready for Phase 1 expansion
 * API: Finnhub (https://finnhub.io/)
 * Free tier: 60 calls/min
 *
 * See: STOCK_MARKET_EXPANSION.md for full implementation plan
 */

import { API_ENDPOINTS } from '@/lib/constants';
import { fetchApi, buildUrl } from './api';

// Stock-specific types (to be moved to types.ts when implementing)
export interface StockQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface StockProfile {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  marketCap: number;
  logo?: string;
  webUrl?: string;
}

export interface StockCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Stock Service - Placeholder for Finnhub API integration
 * Will be implemented during Phase 1 of Stock Market Expansion
 */
export const stockService = {
  /**
   * Get real-time stock quote
   * TODO: Implement with Finnhub /quote endpoint
   */
  async getQuote(symbol: string): Promise<StockQuote> {
    throw new Error('Stock service not yet implemented. See STOCK_MARKET_EXPANSION.md');
  },

  /**
   * Get company profile
   * TODO: Implement with Finnhub /stock/profile2 endpoint
   */
  async getProfile(symbol: string): Promise<StockProfile> {
    throw new Error('Stock service not yet implemented. See STOCK_MARKET_EXPANSION.md');
  },

  /**
   * Search for stock symbols
   * TODO: Implement with Finnhub /search endpoint
   */
  async search(query: string): Promise<{ symbol: string; description: string }[]> {
    throw new Error('Stock service not yet implemented. See STOCK_MARKET_EXPANSION.md');
  },

  /**
   * Get historical candle data
   * TODO: Implement with Finnhub /stock/candle endpoint
   */
  async getCandles(
    symbol: string,
    resolution: '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M',
    from: number,
    to: number
  ): Promise<StockCandle[]> {
    throw new Error('Stock service not yet implemented. See STOCK_MARKET_EXPANSION.md');
  },
};
