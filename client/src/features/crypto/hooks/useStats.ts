/**
 * Global Stats Hook
 * Following Gold Standard: Hook connects service to UI via React Query
 */

import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS, CACHE_CONFIG } from '@/lib/constants';

export interface GlobalStats {
  totalMarketCap?: number;
  totalVolume24h?: number;
  btcDominance?: number;
  marketCapChange24h?: number;
  activeCryptocurrencies?: number;
  // Landing page stats
  totalBlocks?: number;
  totalTransactions?: number;
  networksSupported?: number;
  uptime?: string;
}

export function useStats() {
  return useQuery<GlobalStats>({
    queryKey: [API_ENDPOINTS.STATS],
    staleTime: CACHE_CONFIG.STALE_TIME,
  });
}
