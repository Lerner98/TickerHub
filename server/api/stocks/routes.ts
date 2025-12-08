/**
 * Stock Market Routes
 * Prepared for Stock Market Expansion (Finnhub API)
 *
 * TODO: Implement when ready for Phase 1 expansion
 *
 * Planned endpoints:
 * GET /api/stocks/quote/:symbol     - Real-time stock quote
 * GET /api/stocks/profile/:symbol   - Company profile
 * GET /api/stocks/search?q=         - Symbol search
 * GET /api/stocks/candles/:symbol   - Historical candle data
 *
 * See: STOCK_MARKET_EXPANSION.md for full implementation plan
 */

import { Router } from 'express';
import { stockService } from './service';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

/**
 * GET /api/stocks/quote/:symbol
 * Get real-time stock quote
 */
router.get('/quote/:symbol', asyncHandler(async (req, res) => {
  // TODO: Implement when Finnhub API key is configured
  res.status(501).json({
    error: 'Stock market feature not yet implemented',
    message: 'See STOCK_MARKET_EXPANSION.md for implementation plan',
    plannedFeatures: [
      'Real-time stock quotes',
      'Company profiles',
      'Symbol search',
      'Historical data',
      'Technical indicators'
    ]
  });
}));

/**
 * GET /api/stocks/profile/:symbol
 * Get company profile
 */
router.get('/profile/:symbol', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Stock market feature not yet implemented',
    message: 'See STOCK_MARKET_EXPANSION.md for implementation plan'
  });
}));

/**
 * GET /api/stocks/search?q=
 * Search for stock symbols
 */
router.get('/search', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Stock market feature not yet implemented',
    message: 'See STOCK_MARKET_EXPANSION.md for implementation plan'
  });
}));

/**
 * GET /api/stocks/candles/:symbol
 * Get historical candle data
 */
router.get('/candles/:symbol', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Stock market feature not yet implemented',
    message: 'See STOCK_MARKET_EXPANSION.md for implementation plan'
  });
}));

export default router;
