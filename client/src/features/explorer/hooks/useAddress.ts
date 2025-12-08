/**
 * Address Hook
 * Following Gold Standard: Hook connects service to UI via React Query
 */

import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS, CACHE_CONFIG } from '@/lib/constants';
import type { Address, ChainType } from '@/services/types';

export function useAddress(address: string, chain?: ChainType) {
  const queryKey = chain
    ? [API_ENDPOINTS.ADDRESS, address, { chain }]
    : [API_ENDPOINTS.ADDRESS, address];

  return useQuery<Address>({
    queryKey,
    enabled: !!address,
    staleTime: CACHE_CONFIG.STALE_TIME,
  });
}
