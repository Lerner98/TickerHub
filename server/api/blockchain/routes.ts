import { Router } from 'express';
import { cache } from '../../lib/cache';
import { CACHE_TTL } from '../../lib/constants';
import { asyncHandler } from '../../middleware/errorHandler';
import { validators } from '../../middleware/validateParams';
import { logError } from '../../lib/logger';
import * as ethereumService from './ethereum.service';
import * as bitcoinService from './bitcoin.service';
import type { SupportedChain } from '../../lib/constants';

const router = Router();

/**
 * Blockchain Routes
 *
 * Provides blockchain network statistics, block listings, and block details.
 * Supports Ethereum (via Etherscan) and Bitcoin (via Blockchain.info).
 *
 * All routes include input validation and graceful fallback to mock data.
 *
 * @module server/api/blockchain/routes
 */

/**
 * GET /api/network/:chain
 *
 * Returns real-time network statistics for the specified blockchain.
 *
 * @param {string} chain - Blockchain identifier: 'bitcoin' or 'ethereum'
 *
 * @response {Object} 200 - Network statistics
 * @response {Object} 400 - Invalid chain parameter
 *
 * @example Response (Ethereum):
 * ```json
 * {
 *   "chain": "ethereum",
 *   "blockHeight": 18500000,
 *   "gasPrice": "25 Gwei",
 *   "difficulty": "0",
 *   "hashRate": "N/A (PoS)",
 *   "pendingTransactions": 150000
 * }
 * ```
 */
router.get(
  '/network/:chain',
  validators.chainParam,
  asyncHandler(async (req, res) => {
    const chain = req.params.chain as SupportedChain;
    const cacheKey = `network-${chain}`;
    const cached = cache.get(cacheKey, CACHE_TTL.NETWORK);

    if (cached) {
      return res.json(cached);
    }

    try {
      const stats =
        chain === 'ethereum'
          ? await ethereumService.fetchNetworkStats()
          : await bitcoinService.fetchNetworkStats();

      cache.set(cacheKey, stats);
      res.json(stats);
    } catch (error) {
      logError(error as Error, `Failed to fetch ${chain} network stats`);

      // Return fallback stats on error (graceful degradation)
      const fallbackStats =
        chain === 'ethereum'
          ? ethereumService.getFallbackNetworkStats()
          : bitcoinService.getFallbackNetworkStats();

      res.json(fallbackStats);
    }
  })
);

/**
 * GET /api/blocks/:chain/:limit/:page
 *
 * Returns a paginated list of recent blocks for the specified blockchain.
 *
 * @param {string} chain - Blockchain identifier: 'bitcoin' or 'ethereum'
 * @param {number} limit - Number of blocks per page (1-100, default: 25)
 * @param {number} page - Page number (starts at 1)
 *
 * @response {Array<Block>} 200 - List of blocks
 * @response {Object} 400 - Invalid parameters
 *
 * @example Response:
 * ```json
 * [
 *   {
 *     "number": 18500000,
 *     "hash": "0x...",
 *     "timestamp": 1699920000,
 *     "transactions": 150,
 *     "miner": "0x..."
 *   }
 * ]
 * ```
 */
router.get(
  '/blocks/:chain/:limit/:page',
  validators.blocksParams,
  asyncHandler(async (req, res) => {
    const chain = req.params.chain as SupportedChain;
    // Values are validated and coerced by Zod
    const limit = req.params.limit as unknown as number;
    const page = req.params.page as unknown as number;
    const cacheKey = `blocks-${chain}-${limit}-${page}`;
    const cached = cache.get(cacheKey, CACHE_TTL.BLOCKS);

    if (cached) {
      return res.json(cached);
    }

    try {
      const blocks =
        chain === 'ethereum'
          ? await ethereumService.fetchBlocks(limit, page)
          : await bitcoinService.fetchBlocks(limit, page);

      cache.set(cacheKey, blocks);
      res.json(blocks);
    } catch (error) {
      logError(error as Error, `Failed to fetch ${chain} blocks`);

      // Return mock data as fallback (graceful degradation)
      const mockBlocks =
        chain === 'ethereum'
          ? ethereumService.getMockBlocks(limit, page)
          : bitcoinService.getMockBlocks(limit, page);

      res.json(mockBlocks);
    }
  })
);

/**
 * GET /api/block/:chain/:number
 *
 * Returns detailed information for a specific block.
 *
 * @param {string} chain - Blockchain identifier: 'bitcoin' or 'ethereum'
 * @param {string} number - Block number (must be a valid non-negative integer)
 *
 * @response {Object} 200 - Block details
 * @response {Object} 400 - Invalid parameters
 * @response {Object} 404 - Block not found
 *
 * @example Response:
 * ```json
 * {
 *   "number": 18500000,
 *   "hash": "0x...",
 *   "parentHash": "0x...",
 *   "timestamp": 1699920000,
 *   "transactions": 150,
 *   "gasUsed": "15000000",
 *   "gasLimit": "30000000"
 * }
 * ```
 */
router.get(
  '/block/:chain/:number',
  validators.blockParams,
  asyncHandler(async (req, res) => {
    const { chain, number } = req.params;
    const cacheKey = `block-${chain}-${number}`;
    const cached = cache.get(cacheKey, CACHE_TTL.BLOCK);

    if (cached) {
      return res.json(cached);
    }

    const block =
      chain === 'ethereum'
        ? await ethereumService.fetchBlock(number)
        : await bitcoinService.fetchBlock(number);

    if (!block) {
      return res.status(404).json({
        error: 'Block not found',
        message: `Block ${number} does not exist on ${chain}`,
        statusCode: 404,
      });
    }

    cache.set(cacheKey, block);
    res.json(block);
  })
);

/**
 * GET /api/block/:chain/:number/transactions
 *
 * Returns transactions contained in a specific block.
 *
 * @param {string} chain - Blockchain identifier: 'bitcoin' or 'ethereum'
 * @param {string} number - Block number
 *
 * @response {Array<Transaction>} 200 - List of transactions
 * @response {Object} 400 - Invalid parameters
 *
 * @note Bitcoin block transactions are not yet implemented (returns empty array)
 */
router.get(
  '/block/:chain/:number/transactions',
  validators.blockParams,
  asyncHandler(async (req, res) => {
    const { chain, number } = req.params;
    const cacheKey = `block-txs-${chain}-${number}`;
    const cached = cache.get(cacheKey, CACHE_TTL.BLOCK_TXS);

    if (cached) {
      return res.json(cached);
    }

    if (chain === 'ethereum') {
      const transactions = await ethereumService.fetchBlockTransactions(number);
      cache.set(cacheKey, transactions);
      res.json(transactions);
    } else {
      // Bitcoin block transactions not implemented yet
      // Return empty array with informational header
      res.setHeader('X-Feature-Status', 'not-implemented');
      res.json([]);
    }
  })
);

export default router;
