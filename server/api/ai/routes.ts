/**
 * AI Routes
 *
 * REST API endpoints for AI-powered features:
 * - Natural language search parsing
 * - Stock sentiment summaries
 * - Market overview generation
 *
 * Endpoints:
 * - POST /api/ai/search     - Parse natural language to filters
 * - GET /api/ai/summary/:symbol - Generate stock summary
 * - GET /api/ai/market      - Generate market overview
 * - GET /api/ai/status      - Service health status
 *
 * @module server/api/ai/routes
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { parseSearchQuery, generateStockSummary, generateMarketOverview } from './service';
import { isGeminiConfigured, getGeminiStatus } from './geminiClient';
import { log } from '../../lib/logger';

const router = Router();

/**
 * POST /api/ai/search
 *
 * Parse natural language search query into structured filters.
 * Falls back to keyword extraction if AI unavailable.
 *
 * @body {string} query - Natural language search query
 *
 * @response {SearchFilters} 200 - Parsed search filters
 * @response {Object} 400 - Missing query parameter
 *
 * @example Request:
 * ```json
 * { "query": "tech stocks that are up" }
 * ```
 *
 * @example Response:
 * ```json
 * {
 *   "type": "stock",
 *   "sector": "technology",
 *   "priceRange": null,
 *   "changeDirection": "up",
 *   "symbols": [],
 *   "keywords": ["tech", "stocks", "that", "are", "up"],
 *   "action": "search"
 * }
 * ```
 */
router.post(
  '/search',
  asyncHandler(async (req, res) => {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Missing query parameter',
        message: 'Provide a search query in the request body: { "query": "..." }',
      });
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length > 500) {
      return res.status(400).json({
        error: 'Query too long',
        message: 'Search query must be 500 characters or less',
      });
    }

    log(`AI search parse: "${trimmedQuery}"`, 'ai', 'debug');
    const filters = await parseSearchQuery(trimmedQuery);

    res.json(filters);
  })
);

/**
 * GET /api/ai/summary/:symbol
 *
 * Generate AI-powered stock summary with sentiment analysis.
 * Aggregates news, analyst data, and metrics into insights.
 *
 * @param {string} symbol - Stock ticker symbol (e.g., AAPL)
 *
 * @response {StockSummary} 200 - AI-generated stock summary
 * @response {Object} 404 - Stock not found or no data available
 * @response {Object} 503 - AI service unavailable
 *
 * @example Response:
 * ```json
 * {
 *   "symbol": "AAPL",
 *   "sentiment": {
 *     "score": 7,
 *     "label": "Somewhat Bullish"
 *   },
 *   "summary": "Apple continues to show strength...",
 *   "keyPoints": {
 *     "positive": ["Strong iPhone demand", "Services revenue growth"],
 *     "negative": ["China sales concerns"],
 *     "neutral": ["New product launches expected Q1"]
 *   },
 *   "catalysts": ["WWDC 2024", "iPhone 16 launch"],
 *   "risks": ["Regulatory pressure in EU", "Supply chain dependencies"],
 *   "generatedAt": "2024-01-15T12:00:00Z",
 *   "dataSource": "FMP News + Analyst Data"
 * }
 * ```
 */
router.get(
  '/summary/:symbol',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;

    if (!symbol || symbol.length > 10) {
      return res.status(400).json({
        error: 'Invalid symbol',
        message: 'Provide a valid stock ticker symbol',
      });
    }

    if (!isGeminiConfigured()) {
      return res.status(503).json({
        error: 'AI service unavailable',
        message: 'Gemini API key not configured. Stock summaries require AI.',
        configured: false,
      });
    }

    log(`AI summary requested: ${symbol.toUpperCase()}`, 'ai', 'debug');
    const summary = await generateStockSummary(symbol);

    if (!summary) {
      return res.status(404).json({
        error: 'Summary unavailable',
        message: `Could not generate summary for ${symbol.toUpperCase()}. Stock may not exist or data unavailable.`,
        symbol: symbol.toUpperCase(),
      });
    }

    res.json(summary);
  })
);

/**
 * GET /api/ai/market
 *
 * Generate AI-powered market overview.
 * Analyzes sector performance and top movers.
 *
 * @response {MarketOverview} 200 - AI-generated market overview
 * @response {Object} 503 - AI service unavailable
 *
 * @example Response:
 * ```json
 * {
 *   "marketSentiment": "Risk-On",
 *   "summary": "Markets are showing broad strength with technology leading...",
 *   "topThemes": ["AI momentum", "Rate cut expectations"],
 *   "sectorsToWatch": {
 *     "bullish": ["Technology", "Semiconductors"],
 *     "bearish": ["Utilities", "Real Estate"]
 *   },
 *   "outlook": "Near-term bullish bias with caution around earnings season.",
 *   "generatedAt": "2024-01-15T12:00:00Z"
 * }
 * ```
 */
router.get(
  '/market',
  asyncHandler(async (_req, res) => {
    if (!isGeminiConfigured()) {
      return res.status(503).json({
        error: 'AI service unavailable',
        message: 'Gemini API key not configured. Market overview requires AI.',
        configured: false,
      });
    }

    log('AI market overview requested', 'ai', 'debug');
    const overview = await generateMarketOverview();

    if (!overview) {
      return res.status(503).json({
        error: 'Overview unavailable',
        message: 'Could not generate market overview. Data may be temporarily unavailable.',
      });
    }

    res.json(overview);
  })
);

/**
 * GET /api/ai/status
 *
 * AI service health status.
 * Shows configuration state and rate limit info.
 *
 * @response {Object} 200 - Service status
 *
 * @example Response:
 * ```json
 * {
 *   "service": "ai",
 *   "configured": true,
 *   "available": true,
 *   "requestsRemaining": 12,
 *   "features": {
 *     "search": true,
 *     "summary": true,
 *     "market": true
 *   }
 * }
 * ```
 */
router.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const status = getGeminiStatus();

    res.json({
      service: 'ai',
      ...status,
      features: {
        search: true, // Fallback always available
        summary: status.configured,
        market: status.configured,
      },
    });
  })
);

export default router;
