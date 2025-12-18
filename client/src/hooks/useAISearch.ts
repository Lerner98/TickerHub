/**
 * AI Search Hook
 *
 * Provides natural language search parsing via Gemini AI.
 * Falls back to basic Fuse.js search if AI is unavailable.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

// Types matching server/api/ai/service.ts
export interface SearchFilters {
  type: 'stock' | 'crypto' | 'both';
  sector: string | null;
  priceRange: { min: number | null; max: number | null } | null;
  changeDirection: 'up' | 'down' | 'any';
  symbols: string[];
  keywords: string[];
  action: 'search' | 'compare';
}

export interface AISearchResponse {
  filters: SearchFilters;
  fromCache: boolean;
  aiParsed: boolean;
}

async function parseSearchQuery(query: string): Promise<AISearchResponse> {
  const response = await fetch('/api/ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`AI search failed: ${response.status}`);
  }

  return response.json();
}

async function fetchAIStatus(): Promise<{
  configured: boolean;
  available: boolean;
  requestsRemaining: number;
}> {
  const response = await fetch('/api/ai/status');
  if (!response.ok) {
    return { configured: false, available: false, requestsRemaining: 0 };
  }
  return response.json();
}

/**
 * Hook for AI-powered natural language search
 *
 * @example
 * ```tsx
 * function SmartSearch() {
 *   const { parseQuery, filters, isLoading, error, isAIAvailable } = useAISearch();
 *
 *   const handleSearch = async (query: string) => {
 *     const result = await parseQuery(query);
 *     console.log(result.filters);
 *   };
 *
 *   return (
 *     <input
 *       placeholder={isAIAvailable ? "Try: 'tech stocks going up'" : "Search..."}
 *       onChange={(e) => handleSearch(e.target.value)}
 *     />
 *   );
 * }
 * ```
 */
export function useAISearch() {
  const [filters, setFilters] = useState<SearchFilters | null>(null);

  // Check AI availability (cached for 5 minutes)
  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: fetchAIStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Mutation for parsing search queries
  const mutation = useMutation({
    mutationFn: parseSearchQuery,
    onSuccess: (data) => {
      setFilters(data.filters);
    },
  });

  const parseQuery = useCallback(
    async (query: string): Promise<AISearchResponse | null> => {
      if (!query.trim()) {
        setFilters(null);
        return null;
      }

      try {
        const result = await mutation.mutateAsync(query);
        return result;
      } catch {
        // AI unavailable, return null to trigger fallback
        return null;
      }
    },
    [mutation]
  );

  const reset = useCallback(() => {
    setFilters(null);
    mutation.reset();
  }, [mutation]);

  return {
    parseQuery,
    reset,
    filters,
    isLoading: mutation.isPending,
    error: mutation.error,
    isAIAvailable: aiStatus?.available ?? false,
    isAIConfigured: aiStatus?.configured ?? false,
    requestsRemaining: aiStatus?.requestsRemaining ?? 0,
  };
}
