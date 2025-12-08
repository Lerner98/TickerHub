/**
 * Blocks Hook
 * Following Gold Standard: Hook connects service to UI via React Query
 */

import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS, CACHE_CONFIG, PAGINATION } from '@/lib/constants';
import type { Block, ChainType } from '@/services/types';

export function useBlocks(chain: ChainType, limit: number = PAGINATION.BLOCKS_PER_PAGE, page: number = 1) {
  return useQuery<Block[]>({
    queryKey: [API_ENDPOINTS.BLOCKS, chain, limit, page],
    refetchInterval: CACHE_CONFIG.BLOCKS_REFETCH_INTERVAL,
    enabled: !!chain,
  });
}
