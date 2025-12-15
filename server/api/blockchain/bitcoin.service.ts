import { fetchWithTimeout } from '../../lib/apiClient';
import { API_URLS } from '../../lib/constants';
import type { Block, NetworkStats } from '@shared/schema';

/**
 * Bitcoin service using Blockchair API (free, no API key required)
 *
 * Blockchair provides unified API for multiple blockchains.
 * Free tier: 30 requests/minute without API key
 * @see https://blockchair.com/api/docs
 */

/**
 * Fetch Bitcoin network statistics
 */
export async function fetchNetworkStats(): Promise<NetworkStats> {
  const response = await fetchWithTimeout(`${API_URLS.BLOCKCHAIR}/bitcoin/stats`);
  const data = await response.json();

  if (!data.data) {
    throw new Error('Invalid response from Blockchair');
  }

  const stats = data.data;

  return {
    chain: 'bitcoin',
    blockHeight: stats.blocks,
    tps: Math.round((stats.transactions_24h || 350000) / 86400), // txs per day to TPS
    averageBlockTime: 10,
    hashRate: stats.hashrate_24h
      ? `${(stats.hashrate_24h / 1e18).toFixed(0)} EH/s`
      : '450 EH/s',
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
 * Fetch recent Bitcoin blocks using Blockchair
 */
export async function fetchBlocks(limit: number, page: number): Promise<Block[]> {
  const offset = (page - 1) * limit;
  const response = await fetchWithTimeout(
    `${API_URLS.BLOCKCHAIR}/bitcoin/blocks?limit=${Math.min(limit, 25)}&offset=${offset}&s=id(desc)`
  );
  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    throw new Error('No Bitcoin blocks retrieved from Blockchair');
  }

  return data.data.map((block: any) => ({
    number: block.id,
    hash: block.hash,
    timestamp: Math.floor(new Date(block.time).getTime() / 1000),
    transactionCount: block.transaction_count || 0,
    miner: block.guessed_miner || 'Unknown Pool',
    size: block.size || 0,
    parentHash: '', // Blockchair doesn't return parent hash in list
    reward: (block.generation / 1e8).toFixed(4), // Convert satoshi to BTC
    chain: 'bitcoin' as const,
  }));
}

/**
 * Fetch a single Bitcoin block by number/hash
 */
export async function fetchBlock(blockId: string): Promise<Block | null> {
  const response = await fetchWithTimeout(
    `${API_URLS.BLOCKCHAIR}/bitcoin/dashboards/block/${blockId}`
  );
  const data = await response.json();

  if (!data.data || !data.data[blockId]) {
    return null;
  }

  const block = data.data[blockId].block;

  return {
    number: block.id,
    hash: block.hash,
    timestamp: Math.floor(new Date(block.time).getTime() / 1000),
    transactionCount: block.transaction_count || 0,
    miner: block.guessed_miner || 'Unknown Pool',
    size: block.size || 0,
    parentHash: '', // Can be fetched separately if needed
    reward: (block.generation / 1e8).toFixed(4),
    chain: 'bitcoin',
  };
}

/**
 * Generate mock Bitcoin blocks for fallback
 */
export function getMockBlocks(limit: number, page: number): Block[] {
  const pools = ['Foundry USA', 'AntPool', 'F2Pool', 'Binance Pool', 'ViaBTC'];
  return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
    number: 830000 - (page - 1) * limit - i,
    hash: Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
    timestamp: Math.floor(Date.now() / 1000) - i * 600,
    transactionCount: Math.floor(Math.random() * 3000) + 1000,
    miner: pools[Math.floor(Math.random() * pools.length)],
    size: Math.floor(Math.random() * 1500000) + 500000,
    parentHash: Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
    reward: '6.25',
    chain: 'bitcoin' as const,
  }));
}

/**
 * Fetch transactions for a specific block
 */
export async function fetchBlockTransactions(blockId: string): Promise<any[]> {
  const response = await fetchWithTimeout(
    `${API_URLS.BLOCKCHAIR}/bitcoin/dashboards/block/${blockId}?limit=50`
  );
  const data = await response.json();

  if (!data.data || !data.data[blockId] || !data.data[blockId].transactions) {
    return [];
  }

  const blockData = data.data[blockId];
  const timestamp = Math.floor(new Date(blockData.block.time).getTime() / 1000);

  return blockData.transactions.map((tx: any) => ({
    hash: tx.hash,
    blockNumber: blockData.block.id,
    timestamp,
    from: tx.inputs?.[0]?.recipient || 'Coinbase',
    to: tx.outputs?.[0]?.recipient || 'Unknown',
    value: (tx.output_total / 1e8).toFixed(8),
    fee: ((tx.fee || 0) / 1e8).toFixed(8),
    status: 'confirmed',
    confirmations: 100,
    chain: 'bitcoin',
  }));
}
