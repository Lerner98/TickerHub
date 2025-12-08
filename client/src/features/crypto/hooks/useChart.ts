/**
 * Price Chart Hook
 * Following Gold Standard: Hook connects service to UI via React Query
 */

import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/lib/constants';
import type { ChartDataPoint, TimeRange } from '@/services/types';

export function useChart(coinId: string, range: TimeRange) {
  return useQuery<ChartDataPoint[]>({
    queryKey: [API_ENDPOINTS.CHART, coinId, range],
    refetchInterval: 60_000,
    enabled: !!coinId,
  });
}
