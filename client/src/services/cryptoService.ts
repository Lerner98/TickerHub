/**
 * Crypto Service
 * Following Gold Standard: Service layer for crypto-related API calls
 */

import { API_ENDPOINTS } from '@/lib/constants';
import { fetchApi } from './api';
import type { PriceData, ChartDataPoint, TimeRange } from './types';

export const cryptoService = {
  /**
   * Get all crypto prices
   */
  async getPrices(): Promise<PriceData[]> {
    return fetchApi<PriceData[]>(API_ENDPOINTS.PRICES);
  },

  /**
   * Get price chart data for a specific coin
   */
  async getChart(coinId: string, range: TimeRange): Promise<ChartDataPoint[]> {
    return fetchApi<ChartDataPoint[]>(`${API_ENDPOINTS.CHART}/${coinId}/${range}`);
  },

  /**
   * Get global crypto stats
   */
  async getStats(): Promise<{
    totalMarketCap: number;
    totalVolume24h: number;
    btcDominance: number;
    marketCapChange24h: number;
    activeCryptocurrencies: number;
  }> {
    return fetchApi(`${API_ENDPOINTS.STATS}`);
  },
};
