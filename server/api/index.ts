import { Router } from 'express';
import cryptoRoutes from './crypto/routes';
import blockchainRoutes from './blockchain/routes';
import explorerRoutes from './explorer/routes';
import statsRoutes from './stats/routes';
import stockRoutes from './stocks/routes';
import watchlistRoutes from './watchlist/routes';
import aiRoutes from './ai/routes';

const router = Router();

/**
 * API Route Aggregator
 * Mounts all API routes under /api prefix
 *
 * Crypto Routes:
 * - /api/prices          - Crypto prices
 * - /api/chart/:id/:range - Price charts
 *
 * Blockchain Routes:
 * - /api/network/:chain  - Network stats
 * - /api/blocks/:chain/:limit/:page - Block list
 * - /api/block/:chain/:number - Block details
 *
 * Explorer Routes:
 * - /api/tx/:hash        - Transaction details
 * - /api/address/:address - Address info
 * - /api/address/:address/transactions - Address transactions
 *
 * System Routes:
 * - /api/stats           - Platform stats
 * - /api/health          - Health check
 *
 * Stock Routes:
 * - /api/stocks          - Top 10 stocks
 * - /api/stocks/:symbol  - Single stock details
 * - /api/stocks/search   - Search stocks
 * - /api/stocks/batch    - Multiple stocks by symbols
 * - /api/stocks/status   - Service health status
 *
 * Watchlist Routes (Protected - Requires Auth):
 * - GET    /api/watchlist              - Get user's watchlist
 * - POST   /api/watchlist              - Add asset to watchlist
 * - DELETE /api/watchlist/:assetId     - Remove asset from watchlist
 * - GET    /api/watchlist/check/:assetId - Check if asset in watchlist
 *
 * AI Routes:
 * - POST   /api/ai/search              - Parse natural language to filters
 * - GET    /api/ai/summary/:symbol     - Generate stock summary
 * - GET    /api/ai/market              - Generate market overview
 * - GET    /api/ai/status              - AI service health status
 */

// Mount all route modules
router.use(cryptoRoutes);
router.use(blockchainRoutes);
router.use(explorerRoutes);
router.use(statsRoutes);
router.use('/stocks', stockRoutes);
router.use('/watchlist', watchlistRoutes); // Protected routes (requires auth)
router.use('/ai', aiRoutes); // AI-powered features

export default router;
