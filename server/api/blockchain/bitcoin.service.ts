import { fetchWithTimeout } from '../../lib/apiClient';
import { API_URLS } from '../../lib/constants';
import type { Block, NetworkStats } from '@shared/schema';

/**
 * Fetch Bitcoin network statistics
 */
export async function fetchNetworkStats(): Promise<NetworkStats> {
  const response = await fetchWithTimeout(`${API_URLS.BLOCKCHAIN}/latestblock`);
  const data = await response.json();

  return {
    chain: 'bitcoin',
    blockHeight: data.height,
    tps: 5,
    averageBlockTime: 10,
    hashRate: '450 EH/s',
  };
}

/**
 * Fetch fallback network stats when API fails
 */
export function getFallbackNetworkStats(): NetworkStats {
  return {
    chain: 'bitcoin',
    blockHeight: 830000 + Math.floor(Math.random() * 1000),
    tps: 5,
    averageBlockTime: 10,
    hashRate: '450 EH/s',
  };
}

/**
 * Fetch recent Bitcoin blocks
 */
export async function fetchBlocks(limit: number, page: number): Promise<Block[]> {
  const blocksResponse = await fetchWithTimeout(`${API_URLS.BLOCKCHAIN}/blocks?format=json`);
  const blocksData = await blocksResponse.json();

  if (!blocksData.blocks || blocksData.blocks.length === 0) {
    throw new Error('No Bitcoin blocks retrieved');
  }

  const startIndex = (page - 1) * limit;

  return blocksData.blocks.slice(startIndex, startIndex + limit).map((block: any) => ({
    number: block.height,
    hash: block.hash,
    timestamp: block.time,
    transactionCount: block.n_tx || 0,
    miner: block.pool_name || 'Unknown Pool',
    size: block.size || 0,
    parentHash: block.prev_hash || '',
    reward: '6.25',
    chain: 'bitcoin' as const,
  }));
}

/**
 * Fetch a single Bitcoin block by number/hash
 */
export async function fetchBlock(blockId: string): Promise<Block | null> {
  const blockResponse = await fetchWithTimeout(
    `${API_URLS.BLOCKCHAIN}/rawblock/${blockId}?format=json`
  );

  if (!blockResponse.ok) {
    return null;
  }

  const blockData = await blockResponse.json();

  return {
    number: blockData.height,
    hash: blockData.hash,
    timestamp: blockData.time,
    transactionCount: blockData.n_tx || 0,
    miner: blockData.pool_name || 'Unknown Pool',
    size: blockData.size || 0,
    parentHash: blockData.prev_block || '',
    reward: '6.25',
    chain: 'bitcoin',
  };
}

/**
 * Generate mock Bitcoin blocks for fallback
 */
export function getMockBlocks(limit: number, page: number): Block[] {
  return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
    number: 830000 - (page - 1) * limit - i,
    hash: Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
    timestamp: Math.floor(Date.now() / 1000) - i * 600,
    transactionCount: Math.floor(Math.random() * 3000) + 1000,
    miner: ['Foundry USA', 'AntPool', 'F2Pool', 'Binance Pool', 'ViaBTC'][Math.floor(Math.random() * 5)],
    size: Math.floor(Math.random() * 1500000) + 500000,
    parentHash: Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
    reward: '6.25',
    chain: 'bitcoin' as const,
  }));
}
