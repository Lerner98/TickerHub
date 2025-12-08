import { Router } from 'express';
import cryptoRoutes from './crypto/routes';
import blockchainRoutes from './blockchain/routes';
import explorerRoutes from './explorer/routes';
import statsRoutes from './stats/routes';
import stockRoutes from './stocks/routes';

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
 * Stock Routes (Prepared for expansion):
 * - /api/stocks/quote/:symbol   - Stock quote
 * - /api/stocks/profile/:symbol - Company profile
 * - /api/stocks/search          - Symbol search
 * - /api/stocks/candles/:symbol - Historical data
 */

// Mount all route modules
router.use(cryptoRoutes);
router.use(blockchainRoutes);
router.use(explorerRoutes);
router.use(statsRoutes);
router.use('/stocks', stockRoutes); // Prepared for stock market expansion

export default router;
