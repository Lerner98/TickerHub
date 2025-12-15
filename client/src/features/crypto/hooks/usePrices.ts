/**
 * Crypto Prices Hook
 * Following Gold Standard: Hook connects service to UI via React Query
 */

import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS, CACHE_CONFIG } from '@/lib/constants';
import type { PriceData } from '@/services/types';

export function usePrices() {
  return useQuery<PriceData[]>({
    queryKey: [API_ENDPOINTS.PRICES],
    refetchInterval: CACHE_CONFIG.PRICES_REFETCH_INTERVAL,
  });
}

/**
 * Fetch multiple cryptocurrencies by their CoinGecko IDs
 */
export function useCryptoBatch(ids: string[]) {
  return useQuery<PriceData[]>({
    queryKey: [API_ENDPOINTS.PRICES_BATCH, ids.join(',')],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const res = await fetch(`${API_ENDPOINTS.PRICES_BATCH}?ids=${ids.join(',')}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: ids.length > 0,
    refetchInterval: CACHE_CONFIG.PRICES_REFETCH_INTERVAL,
  });
}
