/**
 * Asset Search Hook
 *
 * Provides instant client-side fuzzy search across stocks and crypto.
 * Uses Fuse.js for fast, weighted search results.
 */

import { useMemo } from 'react';
import { getSuggestions, type SearchResult } from '@/services/search';

/**
 * Hook for searching assets with fuzzy matching
 *
 * @param query - Search query string
 * @param limit - Maximum number of results (default: 8)
 * @returns Object with search results and loading state
 *
 * @example
 * ```tsx
 * function SearchDropdown() {
 *   const [query, setQuery] = useState('');
 *   const { results, hasResults } = useAssetSearch(query);
 *
 *   return (
 *     <div>
 *       <input value={query} onChange={(e) => setQuery(e.target.value)} />
 *       {hasResults && results.map(r => <Result key={r.id} {...r} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAssetSearch(query: string, limit = 8) {
  // Memoize search results to prevent unnecessary recalculations
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return getSuggestions(query, limit);
  }, [query, limit]);

  return {
    results,
    hasResults: results.length > 0,
    stockResults: results.filter((r) => r.type === 'stock'),
    cryptoResults: results.filter((r) => r.type === 'crypto'),
  };
}

export type { SearchResult };
