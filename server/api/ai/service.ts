/**
 * AI Service
 *
 * Business logic for AI-powered features:
 * - Natural language search parsing
 * - Stock summary generation
 * - Market overview analysis
 *
 * @module server/api/ai/service
 */

import { generateJSON, isGeminiConfigured } from './geminiClient';
import { buildSearchPrompt, buildStockSummaryPrompt, buildMarketOverviewPrompt } from './prompts';
import { cache } from '../../lib/cache';
import { log, logError } from '../../lib/logger';
import {
  getStockNews,
  getCompanyProfile,
  getGradeConsensus,
  getPriceTargetConsensus,
  getSectorPerformance,
  getTopGainers,
  getTopLosers,
} from '../stocks/fmpService';
import { getStockAsset } from '../stocks/service';

// Cache TTLs - Longer durations to conserve API quota
const SEARCH_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours (search patterns are stable)
const SUMMARY_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours (stock summaries don't change frequently)
const MARKET_OVERVIEW_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// =============================================================================
// Types
// =============================================================================

export interface SearchFilters {
  type: 'stock' | 'crypto' | 'both';
  sector: string | null;
  priceRange: { min: number | null; max: number | null } | null;
  changeDirection: 'up' | 'down' | 'any';
  symbols: string[];
  keywords: string[];
  action: 'search' | 'compare';
}

export interface StockSummary {
  symbol: string;
  sentiment: {
    score: number;
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

// =============================================================================
// Natural Language Search
// =============================================================================

/**
 * Parse a natural language search query into structured filters
 *
 * Uses Gemini to understand intent and extract:
 * - Asset type (stock/crypto)
 * - Sector filter
 * - Price range
 * - Direction (up/down)
 * - Specific symbols
 *
 * Falls back to keyword extraction if AI unavailable
 */
export async function parseSearchQuery(query: string): Promise<SearchFilters> {
  const normalizedQuery = query.toLowerCase().trim();

  // Check cache first
  const cacheKey = `ai:search:${normalizedQuery}`;
  const cached = cache.get<SearchFilters>(cacheKey, SEARCH_CACHE_TTL);
  if (cached) {
    log(`Search filters from cache: ${normalizedQuery}`, 'ai', 'debug');
    return cached;
  }

  // Try AI parsing if available
  if (isGeminiConfigured()) {
    try {
      const prompt = buildSearchPrompt(query);
      const result = await generateJSON<SearchFilters>(prompt);

      if (result) {
        // Validate and normalize the result
        const validated = validateSearchFilters(result);
        cache.set(cacheKey, validated);
        log(`Search query parsed by AI: ${normalizedQuery}`, 'ai', 'info');
        return validated;
      }
    } catch (error) {
      logError(error as Error, 'AI search parsing failed, using fallback');
    }
  }

  // Fallback: Basic keyword extraction
  const fallback = fallbackSearchParse(normalizedQuery);
  cache.set(cacheKey, fallback);
  log(`Search query parsed by fallback: ${normalizedQuery}`, 'ai', 'debug');
  return fallback;
}

/**
 * Validate and normalize search filters
 */
function validateSearchFilters(filters: Partial<SearchFilters>): SearchFilters {
  return {
    type: filters.type && ['stock', 'crypto', 'both'].includes(filters.type)
      ? filters.type
      : 'both',
    sector: filters.sector || null,
    priceRange: filters.priceRange || null,
    changeDirection: filters.changeDirection && ['up', 'down', 'any'].includes(filters.changeDirection)
      ? filters.changeDirection
      : 'any',
    symbols: Array.isArray(filters.symbols)
      ? filters.symbols.map(s => s.toUpperCase())
      : [],
    keywords: Array.isArray(filters.keywords) ? filters.keywords : [],
    action: filters.action === 'compare' ? 'compare' : 'search',
  };
}

/**
 * Fallback search parser using keyword matching
 */
function fallbackSearchParse(query: string): SearchFilters {
  const filters: SearchFilters = {
    type: 'both',
    sector: null,
    priceRange: null,
    changeDirection: 'any',
    symbols: [],
    keywords: [],
    action: 'search',
  };

  // Detect asset type
  if (query.includes('crypto') || query.includes('bitcoin') || query.includes('eth')) {
    filters.type = 'crypto';
  } else if (query.includes('stock') || query.includes('share')) {
    filters.type = 'stock';
  }

  // Detect direction
  if (query.includes('up') || query.includes('gain') || query.includes('rising')) {
    filters.changeDirection = 'up';
  } else if (query.includes('down') || query.includes('loss') || query.includes('falling') || query.includes('drop')) {
    filters.changeDirection = 'down';
  }

  // Detect sectors
  const sectorKeywords: Record<string, string[]> = {
    technology: ['tech', 'technology', 'software'],
    financials: ['bank', 'finance', 'financial'],
    healthcare: ['health', 'pharma', 'biotech', 'medical'],
    energy: ['energy', 'oil', 'gas'],
    semiconductors: ['semiconductor', 'chip', 'chips'],
    consumer: ['consumer', 'retail'],
  };

  for (const [sector, keywords] of Object.entries(sectorKeywords)) {
    if (keywords.some(kw => query.includes(kw))) {
      filters.sector = sector;
      filters.type = 'stock';
      break;
    }
  }

  // Detect compare action
  if (query.includes('compare') || query.includes('vs') || query.includes('versus')) {
    filters.action = 'compare';
  }

  // Extract potential ticker symbols (uppercase letters 1-5 chars)
  const symbolMatches = query.toUpperCase().match(/\b[A-Z]{1,5}\b/g);
  if (symbolMatches) {
    // Filter out common words
    const commonWords = new Set(['A', 'I', 'THE', 'AND', 'OR', 'FOR', 'TO', 'IN', 'ON', 'UP', 'DOWN', 'VS']);
    filters.symbols = symbolMatches.filter(s => !commonWords.has(s));
  }

  // Remaining words as keywords
  const words = query.split(/\s+/).filter(w => w.length > 2);
  filters.keywords = words;

  return filters;
}

// =============================================================================
// Stock Summary Generation
// =============================================================================

/**
 * Generate AI-powered stock summary with sentiment analysis
 *
 * Aggregates data from multiple sources:
 * - Current price and metrics
 * - Recent news headlines
 * - Analyst ratings and price targets
 *
 * Then uses Gemini to synthesize insights.
 */
export async function generateStockSummary(symbol: string): Promise<StockSummary | null> {
  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `ai:summary:${upperSymbol}`;

  // Check cache
  const cached = cache.get<StockSummary>(cacheKey, SUMMARY_CACHE_TTL);
  if (cached) {
    log(`Stock summary from cache: ${upperSymbol}`, 'ai', 'debug');
    return cached;
  }

  if (!isGeminiConfigured()) {
    log('Gemini not configured, cannot generate summary', 'ai', 'debug');
    return null;
  }

  try {
    // Fetch all required data in parallel
    const [stockAsset, profile, news, grades, priceTarget] = await Promise.all([
      getStockAsset(upperSymbol),
      getCompanyProfile(upperSymbol),
      getStockNews(upperSymbol, 5),
      getGradeConsensus(upperSymbol),
      getPriceTargetConsensus(upperSymbol),
    ]);

    if (!stockAsset) {
      log(`No stock data for ${upperSymbol}, skipping summary`, 'ai', 'warn');
      return null;
    }

    // Format headlines
    const headlinesText = news && news.length > 0
      ? news.map((n, i) => `${i + 1}. ${n.title} (${n.site})`).join('\n')
      : 'No recent news available';

    // Format analyst data
    const analystParts: string[] = [];
    if (grades) {
      analystParts.push(`Consensus: ${grades.consensus} (Buy: ${grades.buy + grades.strongBuy}, Hold: ${grades.hold}, Sell: ${grades.sell + grades.strongSell})`);
    }
    if (priceTarget) {
      analystParts.push(`Price Target: $${priceTarget.targetConsensus} (High: $${priceTarget.targetHigh}, Low: $${priceTarget.targetLow})`);
    }
    const analystText = analystParts.length > 0 ? analystParts.join('\n') : 'No analyst data available';

    // Build prompt
    const prompt = buildStockSummaryPrompt({
      symbol: upperSymbol,
      companyName: profile?.companyName || stockAsset.name || upperSymbol,
      price: stockAsset.price?.toFixed(2) || 'N/A',
      changePercent: stockAsset.changePercent24h?.toFixed(2) || '0',
      marketCap: formatMarketCap(profile?.mktCap || stockAsset.marketCap),
      peRatio: stockAsset.peRatio?.toString() || 'N/A',
      sector: profile?.sector || stockAsset.sector || 'Unknown',
      headlines: headlinesText,
      analystData: analystText,
    });

    // Generate summary
    const result = await generateJSON<Omit<StockSummary, 'symbol' | 'generatedAt' | 'dataSource'>>(prompt);

    if (!result) {
      return null;
    }

    const summary: StockSummary = {
      symbol: upperSymbol,
      sentiment: result.sentiment || { score: 5, label: 'Neutral' },
      summary: result.summary || 'Unable to generate summary.',
      keyPoints: result.keyPoints || { positive: [], negative: [], neutral: [] },
      catalysts: result.catalysts || [],
      risks: result.risks || [],
      generatedAt: new Date().toISOString(),
      dataSource: 'FMP News + Analyst Data',
    };

    // Cache result
    cache.set(cacheKey, summary);
    log(`Stock summary generated: ${upperSymbol}`, 'ai', 'info');

    return summary;

  } catch (error) {
    logError(error as Error, `Stock summary generation failed: ${upperSymbol}`);
    return null;
  }
}

/**
 * Format market cap for display
 */
function formatMarketCap(value: number | null | undefined): string {
  if (!value) return 'N/A';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

// =============================================================================
// Market Overview
// =============================================================================

/**
 * Generate AI-powered market overview
 */
export async function generateMarketOverview(): Promise<MarketOverview | null> {
  const cacheKey = 'ai:market:overview';

  const cached = cache.get<MarketOverview>(cacheKey, MARKET_OVERVIEW_CACHE_TTL);
  if (cached) {
    log('Market overview from cache', 'ai', 'debug');
    return cached;
  }

  if (!isGeminiConfigured()) {
    log('Gemini not configured, cannot generate overview', 'ai', 'debug');
    return null;
  }

  try {
    const [sectors, gainers, losers] = await Promise.all([
      getSectorPerformance(),
      getTopGainers(),
      getTopLosers(),
    ]);

    // Format sector data
    const sectorText = sectors
      ? sectors.map(s => `${s.sector}: ${s.changesPercentage}`).join('\n')
      : 'Sector data unavailable';

    // Format movers
    const gainerText = gainers
      ? gainers.slice(0, 5).map(g => `${g.symbol} +${g.changesPercentage.toFixed(1)}%`).join(', ')
      : 'N/A';

    const loserText = losers
      ? losers.slice(0, 5).map(l => `${l.symbol} ${l.changesPercentage.toFixed(1)}%`).join(', ')
      : 'N/A';

    const prompt = buildMarketOverviewPrompt({
      sectorData: sectorText,
      gainers: gainerText,
      losers: loserText,
    });

    const result = await generateJSON<Omit<MarketOverview, 'generatedAt'>>(prompt);

    if (!result) {
      return null;
    }

    const overview: MarketOverview = {
      marketSentiment: result.marketSentiment || 'Neutral',
      summary: result.summary || 'Unable to generate overview.',
      topThemes: result.topThemes || [],
      sectorsToWatch: result.sectorsToWatch || { bullish: [], bearish: [] },
      outlook: result.outlook || 'Market direction unclear.',
      generatedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, overview);
    log('Market overview generated', 'ai', 'info');

    return overview;

  } catch (error) {
    logError(error as Error, 'Market overview generation failed');
    return null;
  }
}
