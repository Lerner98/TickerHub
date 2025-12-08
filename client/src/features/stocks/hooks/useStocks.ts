/**
 * Stock Hooks
 * Following Gold Standard: Hook connects service to UI via React Query
 */

import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS, CACHE_CONFIG } from '@/lib/constants';
import type { StockAsset, AssetSearchResult } from '@shared/schema';

/**
 * Fetch top stocks
 */
export function useStocks() {
  return useQuery<StockAsset[]>({
    queryKey: [API_ENDPOINTS.STOCKS],
    refetchInterval: CACHE_CONFIG.STOCKS_REFETCH_INTERVAL,
  });
}

/**
 * Fetch single stock by symbol
 */
export function useStock(symbol: string) {
  return useQuery<StockAsset>({
    queryKey: [API_ENDPOINTS.STOCKS, symbol],
    enabled: !!symbol,
  });
}

/**
 * Search stocks by query
 */
export function useStockSearch(query: string) {
  return useQuery<AssetSearchResult[]>({
    queryKey: [API_ENDPOINTS.STOCKS_SEARCH, query],
    queryFn: async () => {
      if (!query || query.length < 1) return [];
      const res = await fetch(`${API_ENDPOINTS.STOCKS_SEARCH}?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: query.length >= 1,
    staleTime: CACHE_CONFIG.STALE_TIME,
  });
}

/**
 * Fetch multiple stocks by symbols
 */
export function useStocksBatch(symbols: string[]) {
  return useQuery<StockAsset[]>({
    queryKey: [API_ENDPOINTS.STOCKS_BATCH, symbols.join(',')],
    queryFn: async () => {
      if (symbols.length === 0) return [];
      const res = await fetch(`${API_ENDPOINTS.STOCKS_BATCH}?symbols=${symbols.join(',')}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: symbols.length > 0,
    refetchInterval: CACHE_CONFIG.STOCKS_REFETCH_INTERVAL,
  });
}
