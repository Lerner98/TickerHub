/**
 * Search Service
 *
 * Provides fuzzy search across stocks and crypto assets using Fuse.js.
 * Supports searching by symbol, name, sector/category.
 */

import Fuse from 'fuse.js';
import { stocks, cryptoAssets, type StockSymbol, type CryptoAsset } from '@/data';

// Search result types
export type SearchResultType = 'stock' | 'crypto';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  symbol: string;
  name: string;
  category: string;
  exchange?: string;
  score: number;
}

// Fuse.js options for optimal fuzzy matching
const fuseOptions = {
  includeScore: true,
  threshold: 0.4, // Lower = stricter matching
  ignoreLocation: true,
  useExtendedSearch: true,
  findAllMatches: true,
  minMatchCharLength: 1,
};

// Create Fuse instances for stocks and crypto
const stocksFuse = new Fuse(stocks, {
  ...fuseOptions,
  keys: [
    { name: 'symbol', weight: 2 },
    { name: 'name', weight: 1.5 },
    { name: 'sector', weight: 0.5 },
  ],
});

const cryptoFuse = new Fuse(cryptoAssets, {
  ...fuseOptions,
  keys: [
    { name: 'symbol', weight: 2 },
    { name: 'name', weight: 1.5 },
    { name: 'category', weight: 0.5 },
    { name: 'id', weight: 0.3 },
  ],
});

/**
 * Search for stocks by query
 */
export function searchStocks(query: string, limit = 10): SearchResult[] {
  if (!query.trim()) return [];

  const results = stocksFuse.search(query, { limit });

  return results.map(({ item, score }) => ({
    type: 'stock' as const,
    id: item.symbol,
    symbol: item.symbol,
    name: item.name,
    category: item.sector,
    exchange: item.exchange,
    score: score || 0,
  }));
}

/**
 * Search for crypto assets by query
 */
export function searchCrypto(query: string, limit = 10): SearchResult[] {
  if (!query.trim()) return [];

  const results = cryptoFuse.search(query, { limit });

  return results.map(({ item, score }) => ({
    type: 'crypto' as const,
    id: item.id,
    symbol: item.symbol,
    name: item.name,
    category: item.category,
    score: score || 0,
  }));
}

/**
 * Search across all assets (stocks + crypto)
 *
 * Returns combined results sorted by relevance score.
 */
export function searchAll(query: string, limit = 20): SearchResult[] {
  if (!query.trim()) return [];

  const stockResults = searchStocks(query, limit);
  const cryptoResults = searchCrypto(query, limit);

  // Combine and sort by score (lower score = better match)
  const combined = [...stockResults, ...cryptoResults];
  combined.sort((a, b) => a.score - b.score);

  return combined.slice(0, limit);
}

/**
 * Get suggestions for autocomplete
 *
 * Returns quick suggestions optimized for typing.
 */
export function getSuggestions(query: string, limit = 8): SearchResult[] {
  if (!query.trim() || query.length < 1) return [];

  return searchAll(query, limit);
}

/**
 * Search with type filter
 */
export function search(
  query: string,
  options?: {
    type?: SearchResultType | 'all';
    limit?: number;
  }
): SearchResult[] {
  const { type = 'all', limit = 20 } = options || {};

  switch (type) {
    case 'stock':
      return searchStocks(query, limit);
    case 'crypto':
      return searchCrypto(query, limit);
    default:
      return searchAll(query, limit);
  }
}

/**
 * Get stock by exact symbol
 */
export function getStockBySymbol(symbol: string): StockSymbol | undefined {
  return stocks.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
}

/**
 * Get crypto by exact ID or symbol
 */
export function getCryptoById(id: string): CryptoAsset | undefined {
  const lowerId = id.toLowerCase();
  return cryptoAssets.find(
    (c) => c.id.toLowerCase() === lowerId || c.symbol.toLowerCase() === lowerId
  );
}

/**
 * Get popular/trending assets for empty state
 */
export function getPopularAssets(): SearchResult[] {
  const popularCrypto = ['bitcoin', 'ethereum', 'solana', 'ripple', 'dogecoin'];
  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'];

  const results: SearchResult[] = [];

  for (const id of popularCrypto) {
    const crypto = getCryptoById(id);
    if (crypto) {
      results.push({
        type: 'crypto',
        id: crypto.id,
        symbol: crypto.symbol,
        name: crypto.name,
        category: crypto.category,
        score: 0,
      });
    }
  }

  for (const symbol of popularStocks) {
    const stock = getStockBySymbol(symbol);
    if (stock) {
      results.push({
        type: 'stock',
        id: stock.symbol,
        symbol: stock.symbol,
        name: stock.name,
        category: stock.sector,
        exchange: stock.exchange,
        score: 0,
      });
    }
  }

  return results;
}

// Export data counts for stats
export const searchStats = {
  totalStocks: stocks.length,
  totalCrypto: cryptoAssets.length,
  total: stocks.length + cryptoAssets.length,
};

export default {
  search,
  searchAll,
  searchStocks,
  searchCrypto,
  getSuggestions,
  getStockBySymbol,
  getCryptoById,
  getPopularAssets,
  searchStats,
};
