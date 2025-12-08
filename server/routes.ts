import type { Express } from 'express';
import { createServer, type Server } from 'http';
import apiRoutes from './api';

/**
 * Register all API routes
 * Routes are organized in modular files under /api
 *
 * Structure:
 * - /api/crypto   - Cryptocurrency prices and charts
 * - /api/blockchain - Network stats and blocks
 * - /api/explorer - Transactions and addresses
 * - /api/stats    - Platform statistics and health
 */
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Mount all API routes under /api prefix
  app.use('/api', apiRoutes);

  return httpServer;
}
