import { Router } from 'express';
import { cache } from '../../lib/cache';
import { CACHE_TTL } from '../../lib/constants';
import { asyncHandler } from '../../middleware/errorHandler';
import { validators } from '../../middleware/validateParams';
import * as explorerService from './service';

const router = Router();

/**
 * Explorer Routes
 *
 * Provides blockchain explorer functionality for transactions and addresses.
 * Automatically detects chain from input format:
 * - Ethereum: 0x prefix for hashes and addresses
 * - Bitcoin: Various address formats (1..., 3..., bc1...)
 *
 * All routes include strict input validation to prevent injection attacks.
 *
 * @module server/api/explorer/routes
 */

/**
 * GET /api/tx/:hash
 *
 * Returns detailed information for a specific transaction.
 * Chain is automatically detected from hash format.
 *
 * @param {string} hash - Transaction hash (64 hex chars, optional 0x prefix)
 *
 * @response {Object} 200 - Transaction details
 * @response {Object} 400 - Invalid hash format
 * @response {Object} 404 - Transaction not found
 *
 * @example Request:
 * GET /api/tx/0x1234567890abcdef...
 *
 * @example Response:
 * ```json
 * {
 *   "hash": "0x...",
 *   "blockNumber": 18500000,
 *   "from": "0x...",
 *   "to": "0x...",
 *   "value": "1.5",
 *   "gasUsed": "21000",
 *   "status": "success"
 * }
 * ```
 */
router.get(
  '/tx/:hash',
  validators.txParams,
  asyncHandler(async (req, res) => {
    const { hash } = req.params;
    const cacheKey = `tx-${hash}`;
    const cached = cache.get(cacheKey, CACHE_TTL.TRANSACTION);

    if (cached) {
      return res.json(cached);
    }

    const transaction = await explorerService.fetchTransaction(hash);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
        message: `No transaction found with hash ${hash}`,
        statusCode: 404,
      });
    }

    cache.set(cacheKey, transaction);
    res.json(transaction);
  })
);

/**
 * GET /api/address/:address
 *
 * Returns account information for a blockchain address.
 * Chain is automatically detected from address format.
 *
 * Supported formats:
 * - Ethereum: 0x + 40 hex characters
 * - Bitcoin Legacy: starts with 1 or 3
 * - Bitcoin Bech32: starts with bc1
 *
 * @param {string} address - Blockchain address
 *
 * @response {Object} 200 - Address information
 * @response {Object} 400 - Invalid address format
 * @response {Object} 404 - Address not found
 *
 * @example Response (Ethereum):
 * ```json
 * {
 *   "address": "0x...",
 *   "balance": "1.5",
 *   "transactionCount": 42,
 *   "chain": "ethereum"
 * }
 * ```
 */
router.get(
  '/address/:address',
  validators.addressParams,
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const cacheKey = `address-${address}`;
    const cached = cache.get(cacheKey, CACHE_TTL.ADDRESS);

    if (cached) {
      return res.json(cached);
    }

    const addressInfo = await explorerService.fetchAddress(address);

    if (!addressInfo) {
      return res.status(404).json({
        error: 'Address not found',
        message: `No data found for address ${address}`,
        statusCode: 404,
      });
    }

    cache.set(cacheKey, addressInfo);
    res.json(addressInfo);
  })
);

/**
 * GET /api/address/:address/transactions
 *
 * Returns recent transactions for a blockchain address.
 * Chain is automatically detected from address format.
 *
 * @param {string} address - Blockchain address
 *
 * @response {Array<Transaction>} 200 - List of transactions
 * @response {Object} 400 - Invalid address format
 *
 * @example Response:
 * ```json
 * [
 *   {
 *     "hash": "0x...",
 *     "from": "0x...",
 *     "to": "0x...",
 *     "value": "1.5",
 *     "timestamp": 1699920000
 *   }
 * ]
 * ```
 */
router.get(
  '/address/:address/transactions',
  validators.addressParams,
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const cacheKey = `address-txs-${address}`;
    const cached = cache.get(cacheKey, CACHE_TTL.ADDRESS_TXS);

    if (cached) {
      return res.json(cached);
    }

    const transactions = await explorerService.fetchAddressTransactions(address);
    cache.set(cacheKey, transactions);
    res.json(transactions);
  })
);

export default router;
