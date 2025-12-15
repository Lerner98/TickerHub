import { fetchWithTimeout } from '../../lib/apiClient';
import { API_URLS } from '../../lib/constants';
import type { Block, NetworkStats } from '@shared/schema';

/**
 * Ethereum service using Blockchair API (free, no API key required)
 *
 * Blockchair provides unified API for multiple blockchains.
 * Free tier: 30 requests/minute without API key
 * @see https://blockchair.com/api/docs
 */

/**
 * Fetch Ethereum network statistics
 */
export async function fetchNetworkStats(): Promise<NetworkStats> {
  const response = await fetchWithTimeout(`${API_URLS.BLOCKCHAIR}/ethereum/stats`);
  const data = await response.json();

  if (!data.data) {
    throw new Error('Invalid response from Blockchair');
  }

  const stats = data.data;

  return {
    chain: 'ethereum',
    blockHeight: stats.blocks,
    tps: Math.round((stats.transactions_24h || 1000000) / 86400), // txs per day to TPS
    averageBlockTime: 12.1,
    gasPrice: {
      low: Math.round((stats.suggested_transaction_fee_gwei_low || 10)),
      average: Math.round((stats.suggested_transaction_fee_gwei_average || 20)),
      high: Math.round((stats.suggested_transaction_fee_gwei_high || 35)),
      unit: 'gwei',
    },
  };
}

/**
 * Fetch fallback network stats when API fails
 */
export function getFallbackNetworkStats(): NetworkStats {
  return {
    chain: 'ethereum',
    blockHeight: 19000000 + Math.floor(Math.random() * 10000),
    tps: 15,
    averageBlockTime: 12.1,
    gasPrice: { low: 10, average: 20, high: 35, unit: 'gwei' },
  };
}

/**
 * Fetch recent Ethereum blocks using Blockchair
 */
export async function fetchBlocks(limit: number, page: number): Promise<Block[]> {
  // Blockchair returns latest blocks in a single call
  const offset = (page - 1) * limit;
  const response = await fetchWithTimeout(
    `${API_URLS.BLOCKCHAIR}/ethereum/blocks?limit=${Math.min(limit, 25)}&offset=${offset}&s=id(desc)`
  );
  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    throw new Error('No Ethereum blocks retrieved from Blockchair');
  }

  return data.data.map((block: any) => ({
    number: block.id,
    hash: block.hash,
    timestamp: Math.floor(new Date(block.time).getTime() / 1000),
    transactionCount: block.transaction_count || 0,
    miner: block.miner || 'Unknown',
    size: block.size || 0,
    gasUsed: block.gas_used || 0,
    gasLimit: block.gas_limit || 30000000,
    parentHash: '', // Blockchair doesn't return parent hash in list
    reward: (block.generation / 1e18).toFixed(4), // Convert wei to ETH
    chain: 'ethereum' as const,
  }));
}

/**
 * Generate mock Ethereum blocks for fallback
 */
export function getMockBlocks(limit: number, page: number): Block[] {
  return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
    number: 21300000 - (page - 1) * limit - i,
    hash: `0x${(Math.random().toString(16) + Math.random().toString(16)).slice(2, 66)}`,
    timestamp: Math.floor(Date.now() / 1000) - i * 12,
    transactionCount: Math.floor(Math.random() * 200) + 100,
    miner: `0x${Math.random().toString(16).slice(2, 42)}`,
    size: Math.floor(Math.random() * 50000) + 30000,
    gasUsed: Math.floor(Math.random() * 15000000) + 10000000,
    gasLimit: 30000000,
    parentHash: `0x${(Math.random().toString(16) + Math.random().toString(16)).slice(2, 66)}`,
    reward: '2.0',
    chain: 'ethereum' as const,
  }));
}

/**
 * Fetch a single Ethereum block by number
 */
export async function fetchBlock(blockNumber: string): Promise<Block | null> {
  const response = await fetchWithTimeout(
    `${API_URLS.BLOCKCHAIR}/ethereum/dashboards/block/${blockNumber}`
  );
  const data = await response.json();

  if (!data.data || !data.data[blockNumber]) {
    return null;
  }

  const block = data.data[blockNumber].block;

  return {
    number: block.id,
    hash: block.hash,
    timestamp: Math.floor(new Date(block.time).getTime() / 1000),
    transactionCount: block.transaction_count || 0,
    miner: block.miner || 'Unknown',
    size: block.size || 0,
    gasUsed: block.gas_used || 0,
    gasLimit: block.gas_limit || 30000000,
    parentHash: '', // Can be fetched separately if needed
    reward: (block.generation / 1e18).toFixed(4),
    chain: 'ethereum',
  };
}

/**
 * Fetch transactions for a specific block
 */
export async function fetchBlockTransactions(blockNumber: string): Promise<any[]> {
  const response = await fetchWithTimeout(
    `${API_URLS.BLOCKCHAIR}/ethereum/dashboards/block/${blockNumber}?limit=50`
  );
  const data = await response.json();

  if (!data.data || !data.data[blockNumber] || !data.data[blockNumber].transactions) {
    return [];
  }

  const blockData = data.data[blockNumber];
  const timestamp = Math.floor(new Date(blockData.block.time).getTime() / 1000);

  return blockData.transactions.map((tx: any) => ({
    hash: tx.hash,
    blockNumber: parseInt(blockNumber),
    timestamp,
    from: tx.sender,
    to: tx.recipient || 'Contract Creation',
    value: tx.value?.toString() || '0',
    fee: tx.fee?.toString() || '0',
    gasPrice: tx.gas_price ? (tx.gas_price / 1e9).toFixed(2) : '0',
    gasUsed: tx.gas_used || 0,
    status: tx.failed ? 'failed' : 'confirmed',
    confirmations: 100,
    input: tx.input_hex || '0x',
    chain: 'ethereum',
  }));
}
