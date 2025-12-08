/**
 * Single Block Hook
 * Following Gold Standard: Hook connects service to UI via React Query
 */

import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/lib/constants';
import type { Block, ChainType } from '@/services/types';

export function useBlock(blockNumber: string, chain?: ChainType) {
  const queryKey = chain
    ? [API_ENDPOINTS.BLOCK, blockNumber, { chain }]
    : [API_ENDPOINTS.BLOCK, blockNumber];

  return useQuery<Block>({
    queryKey,
    enabled: !!blockNumber,
    staleTime: 5 * 60 * 1000, // 5 minutes - blocks don't change
  });
}
