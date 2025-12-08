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
