/**
 * Blockchain Service
 * Following Gold Standard: Service layer for blockchain-related API calls
 */

import { API_ENDPOINTS } from '@/lib/constants';
import { fetchApi, buildUrl } from './api';
import type { NetworkStats, Block, ChainType } from './types';

export const blockchainService = {
  /**
   * Get network stats for a chain
   */
  async getNetwork(chain: ChainType): Promise<NetworkStats> {
    return fetchApi<NetworkStats>(`${API_ENDPOINTS.NETWORK}/${chain}`);
  },

  /**
   * Get recent blocks for a chain
   */
  async getBlocks(chain: ChainType, limit: number = 10, page: number = 1): Promise<Block[]> {
    return fetchApi<Block[]>(`${API_ENDPOINTS.BLOCKS}/${chain}/${limit}/${page}`);
  },

  /**
   * Get a specific block
   */
  async getBlock(blockNumber: string, chain?: ChainType): Promise<Block> {
    const url = buildUrl(`${API_ENDPOINTS.BLOCK}/${blockNumber}`, { chain });
    return fetchApi<Block>(url);
  },
};
