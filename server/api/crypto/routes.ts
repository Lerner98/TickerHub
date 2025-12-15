import { Router } from 'express';
import { cache } from '../../lib/cache';
import { CACHE_TTL } from '../../lib/constants';
import { asyncHandler } from '../../middleware/errorHandler';
import { validators } from '../../middleware/validateParams';
import * as cryptoService from './service';

const router = Router();

/**
 * Crypto Routes
 *
 * Provides cryptocurrency price data and historical charts.
 * Data sourced from CoinGecko API with caching layer.
 *
 * @module server/api/crypto/routes
 */

/**
 * GET /api/prices
 *
 * Returns top 20 cryptocurrencies with current price data.
 * No parameters required.
 *
 * @response {Array<CryptoPrice>} 200 - List of cryptocurrency prices
 * @response {Object} 500 - Server error (falls back to mock data)
 *
 * @example Response:
 * ```json
 * [
 *   {
 *     "id": "bitcoin",
 *     "symbol": "btc",
 *     "name": "Bitcoin",
 *     "current_price": 45000,
 *     "price_change_percentage_24h": 2.5
 *   }
 * ]
 * ```
 */
router.get('/prices', asyncHandler(async (_req, res) => {
  const cacheKey = 'prices';
  const cached = cache.get(cacheKey, CACHE_TTL.PRICES);

  if (cached) {
    return res.json(cached);
  }

  const prices = await cryptoService.fetchPrices();
  cache.set(cacheKey, prices);
  res.json(prices);
}));

/**
 * GET /api/prices/batch
 *
 * Returns specific cryptocurrencies by their CoinGecko IDs.
 * Useful for watchlist/portfolio views.
 *
 * @query {string} ids - Comma-separated CoinGecko IDs (required)
 *
 * @response {Array<PriceData>} 200 - List of cryptocurrency prices
 * @response {Object} 400 - Missing or invalid parameters
 *
 * @example Request: GET /api/prices/batch?ids=bitcoin,ethereum,solana
 */
router.get('/prices/batch', asyncHandler(async (req, res) => {
  const idsParam = req.query.ids as string;

  if (!idsParam) {
    return res.status(400).json({
      error: 'Missing ids parameter',
      message: 'Provide ids using ?ids=bitcoin,ethereum,solana',
    });
  }

  const ids = idsParam.split(',').map((id) => id.trim().toLowerCase());

  if (ids.length === 0) {
    return res.status(400).json({
      error: 'Invalid ids',
      message: 'Provide at least one valid coin ID',
    });
  }

  if (ids.length > 50) {
    return res.status(400).json({
      error: 'Too many ids',
      message: 'Maximum 50 coins per request',
    });
  }

  // Check cache for this specific batch
  const cacheKey = `prices-batch-${ids.sort().join(',')}`;
  const cached = cache.get(cacheKey, CACHE_TTL.PRICES);

  if (cached) {
    return res.json(cached);
  }

  const prices = await cryptoService.fetchPricesByIds(ids);
  cache.set(cacheKey, prices);
  res.json(prices);
}));

/**
 * GET /api/chart/:coinId/:range
 *
 * Returns historical price chart data for a specific cryptocurrency.
 *
 * @param {string} coinId - CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')
 *                          Must be lowercase alphanumeric with hyphens.
 * @param {string} range - Time range: '1D', '7D', '30D', '90D', or '1Y'
 *
 * @response {Object} 200 - Chart data with prices and timestamps
 * @response {Object} 400 - Invalid parameters
 * @response {Object} 500 - Server error (falls back to mock data)
 *
 * @example Response:
 * ```json
 * {
 *   "prices": [[1699920000000, 45000], [1699923600000, 45100]],
 *   "id": "bitcoin",
 *   "range": "1D"
 * }
 * ```
 */
router.get(
  '/chart/:coinId/:range',
  validators.chartParams,
  asyncHandler(async (req, res) => {
    const { coinId, range } = req.params;
    const cacheKey = `chart-${coinId}-${range}`;
    const cached = cache.get(cacheKey, CACHE_TTL.CHART);

    if (cached) {
      return res.json(cached);
    }

    const chartData = await cryptoService.fetchChart(coinId, range);
    cache.set(cacheKey, chartData);
    res.json(chartData);
  })
);

export default router;
