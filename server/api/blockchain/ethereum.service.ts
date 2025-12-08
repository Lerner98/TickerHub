import { fetchWithTimeout } from '../../lib/apiClient';
import { API_URLS, API_CONFIG } from '../../lib/constants';
import type { Block, NetworkStats } from '@shared/schema';

const ETHERSCAN_API_KEY = API_CONFIG.ETHERSCAN_API_KEY;

/**
 * Fetch Ethereum network statistics
 */
export async function fetchNetworkStats(): Promise<NetworkStats> {
  const [blockNumResponse, gasResponse] = await Promise.all([
    fetchWithTimeout(
      `${API_URLS.ETHERSCAN}?module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_API_KEY}`
    ),
    fetchWithTimeout(
      `${API_URLS.ETHERSCAN}?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`
    ),
  ]);

  const blockNumData = await blockNumResponse.json();
  const gasData = await gasResponse.json();

  const blockHeight = parseInt(blockNumData.result, 16);

  return {
    chain: 'ethereum',
    blockHeight,
    tps: 15,
    averageBlockTime: 12.1,
    gasPrice: gasData.result ? {
      low: parseInt(gasData.result.SafeGasPrice) || 10,
      average: parseInt(gasData.result.ProposeGasPrice) || 20,
      high: parseInt(gasData.result.FastGasPrice) || 30,
      unit: 'gwei',
    } : {
      low: 10,
      average: 20,
      high: 35,
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
 * Fetch recent Ethereum blocks
 */
export async function fetchBlocks(limit: number, page: number): Promise<Block[]> {
  console.log('Using Etherscan API key:', ETHERSCAN_API_KEY ? ETHERSCAN_API_KEY.slice(0, 8) + '...' : 'NONE');

  const blockNumResponse = await fetchWithTimeout(
    `${API_URLS.ETHERSCAN}?chainid=1&module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_API_KEY}`
  );
  const blockNumData = await blockNumResponse.json();
  console.log('Etherscan response:', JSON.stringify(blockNumData));

  if (!blockNumData.result || blockNumData.result === 'Max rate limit reached') {
    throw new Error('Etherscan rate limited');
  }

  const latestBlock = parseInt(blockNumData.result, 16);
  if (isNaN(latestBlock)) {
    throw new Error('Invalid block number from Etherscan: ' + blockNumData.result);
  }

  const startBlock = latestBlock - (page - 1) * limit;
  const blocks: Block[] = [];

  // Fetch blocks (limited to 10 to avoid rate limits)
  for (let i = 0; i < Math.min(limit, 10); i++) {
    const blockNum = startBlock - i;
    const blockHex = '0x' + blockNum.toString(16);

    try {
      const blockResponse = await fetchWithTimeout(
        `${API_URLS.ETHERSCAN}?chainid=1&module=proxy&action=eth_getBlockByNumber&tag=${blockHex}&boolean=false&apikey=${ETHERSCAN_API_KEY}`
      );
      const blockData = await blockResponse.json();

      if (blockData.result && blockData.result.number) {
        blocks.push({
          number: parseInt(blockData.result.number, 16),
          hash: blockData.result.hash,
          timestamp: parseInt(blockData.result.timestamp, 16),
          transactionCount: blockData.result.transactions?.length || 0,
          miner: blockData.result.miner,
          size: parseInt(blockData.result.size, 16),
          gasUsed: parseInt(blockData.result.gasUsed, 16),
          gasLimit: parseInt(blockData.result.gasLimit, 16),
          parentHash: blockData.result.parentHash,
          reward: '2.0',
          chain: 'ethereum',
        });
      }
    } catch (e) {
      console.error(`Error fetching block ${blockNum}:`, e);
    }
  }

  if (blocks.length === 0) {
    throw new Error('No blocks retrieved from Etherscan');
  }

  return blocks;
}

/**
 * Generate mock Ethereum blocks for fallback
 */
export function getMockBlocks(limit: number, page: number): Block[] {
  return Array.from({ length: 10 }, (_, i) => ({
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
  const blockHex = '0x' + parseInt(blockNumber).toString(16);
  const response = await fetchWithTimeout(
    `${API_URLS.ETHERSCAN}?module=proxy&action=eth_getBlockByNumber&tag=${blockHex}&boolean=true&apikey=${ETHERSCAN_API_KEY}`
  );
  const data = await response.json();

  if (!data.result) {
    return null;
  }

  return {
    number: parseInt(data.result.number, 16),
    hash: data.result.hash,
    timestamp: parseInt(data.result.timestamp, 16),
    transactionCount: data.result.transactions?.length || 0,
    miner: data.result.miner,
    size: parseInt(data.result.size, 16),
    gasUsed: parseInt(data.result.gasUsed, 16),
    gasLimit: parseInt(data.result.gasLimit, 16),
    parentHash: data.result.parentHash,
    reward: '2.0',
    chain: 'ethereum',
  };
}

/**
 * Fetch transactions for a specific block
 */
export async function fetchBlockTransactions(blockNumber: string): Promise<any[]> {
  const blockHex = '0x' + parseInt(blockNumber).toString(16);
  const response = await fetchWithTimeout(
    `${API_URLS.ETHERSCAN}?module=proxy&action=eth_getBlockByNumber&tag=${blockHex}&boolean=true&apikey=${ETHERSCAN_API_KEY}`
  );
  const data = await response.json();

  if (!data.result || !data.result.transactions) {
    return [];
  }

  return data.result.transactions.slice(0, 50).map((tx: any) => ({
    hash: tx.hash,
    blockNumber: parseInt(tx.blockNumber, 16),
    timestamp: parseInt(data.result.timestamp, 16),
    from: tx.from,
    to: tx.to || 'Contract Creation',
    value: tx.value,
    fee: (parseInt(tx.gas, 16) * parseInt(tx.gasPrice, 16)).toString(),
    gasPrice: (parseInt(tx.gasPrice, 16) / 1e9).toFixed(2),
    gasUsed: parseInt(tx.gas, 16),
    status: 'confirmed',
    confirmations: 100,
    input: tx.input,
    chain: 'ethereum',
  }));
}
