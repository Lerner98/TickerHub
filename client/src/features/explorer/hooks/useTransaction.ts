/**
 * Transaction Hook
 * Following Gold Standard: Hook connects service to UI via React Query
 */

import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/lib/constants';
import type { Transaction, ChainType } from '@/services/types';

export function useTransaction(hash: string, chain?: ChainType) {
  const queryKey = chain
    ? [API_ENDPOINTS.TRANSACTION, hash, { chain }]
    : [API_ENDPOINTS.TRANSACTION, hash];

  return useQuery<Transaction>({
    queryKey,
    enabled: !!hash,
    staleTime: 10 * 60 * 1000, // 10 minutes - confirmed transactions don't change
  });
}
