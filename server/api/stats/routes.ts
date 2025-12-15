import { Router } from 'express';
import { cache } from '../../lib/cache';
import { CACHE_TTL, API_URLS } from '../../lib/constants';
import { asyncHandler } from '../../middleware/errorHandler';
import { safeFetch } from '../../lib/apiClient';

const router = Router();

/**
 * Stats & Health Routes
 *
 * Provides platform statistics and health check endpoints.
 * Health checks monitor connectivity to external API dependencies.
 *
 * @module server/api/stats/routes
 */

/**
 * Service health check result type
 */
interface ServiceHealth {
  status: 'ok' | 'error';
  responseTime?: number;
  error?: string;
}

/**
 * GET /api/stats
 *
 * Returns platform-wide statistics and metrics.
 * Data is cached for efficient retrieval.
 *
 * @response {Object} 200 - Platform statistics
 *
 * @example Response:
 * ```json
 * {
 *   "totalBlocks": 19500000,
 *   "totalTransactions": 2100000000,
 *   "networksSupported": 2,
 *   "uptime": "99.9"
 * }
 * ```
 */
router.get('/stats', asyncHandler(async (_req, res) => {
  const cacheKey = 'stats';
  const cached = cache.get(cacheKey, CACHE_TTL.STATS);

  if (cached) {
    return res.json(cached);
  }

  const stats = {
    totalBlocks: 19500000,
    totalTransactions: 2100000000,
    networksSupported: 2,
    uptime: '99.9',
  };

  cache.set(cacheKey, stats);
  res.json(stats);
}));

/**
 * GET /api/health
 *
 * Comprehensive health check endpoint for monitoring and deployment.
 * Checks connectivity to all external API dependencies.
 *
 * Returns:
 * - 200 OK: All services healthy
 * - 503 Service Unavailable: One or more services degraded
 *
 * @response {Object} 200 - Health status (all healthy)
 * @response {Object} 503 - Health status (degraded)
 *
 * @example Response:
 * ```json
 * {
 *   "status": "ok",
 *   "timestamp": "2025-12-08T00:00:00.000Z",
 *   "uptime": 3600,
 *   "responseTime": 150,
 *   "services": {
 *     "coingecko": { "status": "ok", "responseTime": 200 },
 *     "etherscan": { "status": "ok", "responseTime": 150 },
 *     "blockchain": { "status": "ok", "responseTime": 100 }
 *   },
 *   "cache": { "size": 15, "hitRate": 0.85 },
 *   "environment": "production"
 * }
 * ```
 *
 * @see DEPLOYMENT.md for health check configuration
 */
router.get('/health', asyncHandler(async (_req, res) => {
  const startTime = Date.now();

  // Check external services in parallel
  const [coingeckoHealth, blockchairHealth, blockchainHealth] = await Promise.all([
    checkService(`${API_URLS.COINGECKO}/ping`),
    checkService(`${API_URLS.BLOCKCHAIR}/ethereum/stats`),
    checkService(`${API_URLS.BLOCKCHAIN}/latestblock`),
  ]);

  const services = {
    coingecko: coingeckoHealth,
    blockchair: blockchairHealth,
    blockchain: blockchainHealth,
  };

  const allHealthy = Object.values(services).every((s) => s.status === 'ok');

  const healthCheck = {
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: Date.now() - startTime,
    services,
    cache: cache.stats(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Return appropriate status code
  res.status(allHealthy ? 200 : 503).json(healthCheck);
}));

/**
 * Check if an external service is reachable
 *
 * @param url - The URL to check
 * @returns Service health status with response time
 *
 * @internal
 */
async function checkService(url: string): Promise<ServiceHealth> {
  const start = Date.now();

  try {
    const data = await safeFetch(url, 5000);
    const responseTime = Date.now() - start;

    if (data !== null) {
      return { status: 'ok', responseTime };
    }

    return { status: 'error', error: 'No response' };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default router;
