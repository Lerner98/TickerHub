/**
 * Stock Summary Hook
 *
 * Fetches AI-generated stock summaries with sentiment analysis.
 * Results are cached by the server for 30 minutes.
 */

import { useQuery } from '@tanstack/react-query';

// Types matching server/api/ai/service.ts
export interface StockSummary {
  symbol: string;
  sentiment: {
    score: number; // 1-10
    label: 'Bearish' | 'Somewhat Bearish' | 'Neutral' | 'Somewhat Bullish' | 'Bullish';
  };
  summary: string;
  keyPoints: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  catalysts: string[];
  risks: string[];
  generatedAt: string;
  dataSource: string;
}

export interface MarketOverview {
  marketSentiment: 'Risk-On' | 'Risk-Off' | 'Mixed' | 'Neutral';
  summary: string;
  topThemes: string[];
  sectorsToWatch: {
    bullish: string[];
    bearish: string[];
  };
  outlook: string;
  generatedAt: string;
}

async function fetchStockSummary(symbol: string): Promise<StockSummary | null> {
  const response = await fetch(`/api/ai/summary/${symbol}`);

  if (response.status === 503) {
    // AI rate limited or overloaded - return null gracefully
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch summary: ${response.status}`);
  }

  const data = await response.json();
  // API returns the summary object directly, not {summary: ...}
  return data || null;
}

async function fetchMarketOverview(): Promise<MarketOverview | null> {
  const response = await fetch('/api/ai/market');

  if (response.status === 503) {
    // AI rate limited or overloaded - return null gracefully
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch market overview: ${response.status}`);
  }

  const data = await response.json();
  return data.overview || null;
}

/**
 * Hook for fetching AI-generated stock summaries
 *
 * @param symbol - Stock symbol (e.g., "AAPL")
 * @param enabled - Whether to fetch (default: true)
 *
 * @example
 * ```tsx
 * function StockInsights({ symbol }: { symbol: string }) {
 *   const { summary, isLoading, isAIAvailable } = useStockSummary(symbol);
 *
 *   if (isLoading) return <Spinner />;
 *   if (!summary) return <p>AI summary unavailable</p>;
 *
 *   return (
 *     <div>
 *       <SentimentGauge score={summary.sentiment.score} />
 *       <p>{summary.summary}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useStockSummary(symbol: string, enabled = true) {
  const query = useQuery({
    queryKey: ['stock-summary', symbol],
    queryFn: () => fetchStockSummary(symbol),
    enabled: enabled && !!symbol,
    staleTime: 2 * 60 * 60 * 1000, // 2 hours (matches server cache, conserves API quota)
    gcTime: 4 * 60 * 60 * 1000, // 4 hours
    retry: false, // Don't retry on AI failures
    refetchOnWindowFocus: false,
  });

  return {
    summary: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isAIAvailable: query.data !== null,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching AI-generated market overview
 *
 * @param enabled - Whether to fetch (default: true)
 *
 * @example
 * ```tsx
 * function MarketSummary() {
 *   const { overview, isLoading } = useMarketOverview();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!overview) return null;
 *
 *   return (
 *     <div>
 *       <Badge>{overview.marketSentiment}</Badge>
 *       <p>{overview.summary}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMarketOverview(enabled = true) {
  const query = useQuery({
    queryKey: ['market-overview'],
    queryFn: fetchMarketOverview,
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour (matches server cache, conserves API quota)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    overview: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isAIAvailable: query.data !== null,
    refetch: query.refetch,
  };
}
