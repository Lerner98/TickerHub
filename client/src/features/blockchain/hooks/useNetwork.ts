/**
 * Network Stats Hook
 * Following Gold Standard: Hook connects service to UI via React Query
 */

import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS, CACHE_CONFIG } from '@/lib/constants';
import type { NetworkStats, ChainType } from '@/services/types';

export function useNetwork(chain: ChainType) {
  return useQuery<NetworkStats>({
    queryKey: [API_ENDPOINTS.NETWORK, chain],
    refetchInterval: CACHE_CONFIG.NETWORK_REFETCH_INTERVAL,
    enabled: !!chain,
  });
}
