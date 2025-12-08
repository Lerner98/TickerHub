/**
 * Stock Market Routes
 *
 * Provides REST API endpoints for stock market data.
 * Uses unified Asset types (ADR-007) and mock data in development.
 *
 * Endpoints:
 * - GET /api/stocks              - Top 10 stocks
 * - GET /api/stocks/:symbol      - Single stock details
 * - GET /api/stocks/search       - Search stocks by query
 * - GET /api/stocks/batch        - Multiple stocks by symbols
 * - GET /api/stocks/status       - Service health status
 *
 * @module server/api/stocks/routes
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import {
  getTopStocks,
  getStockAsset,
  getStockAssets,
  searchStocks,
  getServiceStatus,
} from './service';

const router = Router();

/**
 * GET /api/stocks
 *
 * Returns top 10 stock assets with real-time quotes.
 * Uses mock data in development mode.
 *
 * @response {StockAsset[]} 200 - List of stock assets
 *
 * @example Response:
 * ```json
 * [
 *   {
 *     "id": "AAPL",
 *     "type": "stock",
 *     "symbol": "AAPL",
 *     "name": "Apple Inc",
 *     "price": 178.72,
 *     "change24h": 2.15,
 *     "changePercent24h": 1.22,
 *     "exchange": "NASDAQ",
 *     ...
 *   }
 * ]
 * ```
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const stocks = await getTopStocks();
    res.json(stocks);
  })
);

/**
 * GET /api/stocks/search
 *
 * Search stocks by symbol or company name.
 * Returns up to 10 matching results.
 *
 * @query {string} q - Search query (required)
 *
 * @response {AssetSearchResult[]} 200 - Search results
 * @response {Object} 400 - Missing query parameter
 *
 * @example Request: GET /api/stocks/search?q=apple
 * @example Response:
 * ```json
 * [
 *   {
 *     "id": "AAPL",
 *     "type": "stock",
 *     "symbol": "AAPL",
 *     "name": "Apple Inc",
 *     "exchange": "NASDAQ"
 *   }
 * ]
 * ```
 */
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const query = req.query.q as string;

    if (!query || query.length < 1) {
      return res.status(400).json({
        error: 'Missing query parameter',
        message: 'Provide a search query using ?q=',
      });
    }

    const results = await searchStocks(query);
    res.json(results);
  })
);

/**
 * GET /api/stocks/batch
 *
 * Get multiple stocks by symbol list.
 * Useful for watchlist/portfolio views.
 *
 * @query {string} symbols - Comma-separated stock symbols (required)
 *
 * @response {StockAsset[]} 200 - List of stock assets
 * @response {Object} 400 - Missing symbols parameter
 *
 * @example Request: GET /api/stocks/batch?symbols=AAPL,MSFT,GOOGL
 */
router.get(
  '/batch',
  asyncHandler(async (req, res) => {
    const symbolsParam = req.query.symbols as string;

    if (!symbolsParam) {
      return res.status(400).json({
        error: 'Missing symbols parameter',
        message: 'Provide symbols using ?symbols=AAPL,MSFT,GOOGL',
      });
    }

    const symbols = symbolsParam.split(',').map((s) => s.trim().toUpperCase());

    if (symbols.length === 0) {
      return res.status(400).json({
        error: 'Invalid symbols',
        message: 'Provide at least one valid symbol',
      });
    }

    if (symbols.length > 20) {
      return res.status(400).json({
        error: 'Too many symbols',
        message: 'Maximum 20 symbols per request',
      });
    }

    const stocks = await getStockAssets(symbols);
    res.json(stocks);
  })
);

/**
 * GET /api/stocks/status
 *
 * Service health status for monitoring.
 * Includes API configuration status and circuit breaker state.
 *
 * @response {Object} 200 - Service status
 *
 * @example Response:
 * ```json
 * {
 *   "service": "stocks",
 *   "configured": true,
 *   "mockMode": false,
 *   "circuitState": "closed"
 * }
 * ```
 */
router.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const status = getServiceStatus();
    res.json({
      service: 'stocks',
      ...status,
    });
  })
);

/**
 * GET /api/stocks/:symbol
 *
 * Get detailed stock data for a single symbol.
 *
 * @param {string} symbol - Stock ticker symbol (e.g., AAPL)
 *
 * @response {StockAsset} 200 - Stock asset details
 * @response {Object} 404 - Stock not found
 *
 * @example Request: GET /api/stocks/AAPL
 */
router.get(
  '/:symbol',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const stock = await getStockAsset(symbol);

    if (!stock) {
      return res.status(404).json({
        error: 'Stock not found',
        message: `No data found for symbol: ${symbol.toUpperCase()}`,
        symbol: symbol.toUpperCase(),
      });
    }

    res.json(stock);
  })
);

export default router;
