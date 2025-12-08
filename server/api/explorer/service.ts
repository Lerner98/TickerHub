import { fetchWithTimeout } from '../../lib/apiClient';
import { API_URLS, API_CONFIG } from '../../lib/constants';
import type { Transaction, Address } from '@shared/schema';

const ETHERSCAN_API_KEY = API_CONFIG.ETHERSCAN_API_KEY;

// ============ Transaction Services ============

/**
 * Fetch Ethereum transaction by hash
 */
export async function fetchEthTransaction(hash: string): Promise<Transaction | null> {
  const response = await fetchWithTimeout(
    `${API_URLS.ETHERSCAN}?module=proxy&action=eth_getTransactionByHash&txhash=${hash}&apikey=${ETHERSCAN_API_KEY}`
  );
  const data = await response.json();

  if (!data.result) {
    return null;
  }

  // Get receipt for additional details
  const receiptResponse = await fetchWithTimeout(
    `${API_URLS.ETHERSCAN}?module=proxy&action=eth_getTransactionReceipt&txhash=${hash}&apikey=${ETHERSCAN_API_KEY}`
  );
  const receiptData = await receiptResponse.json();

  return {
    hash: data.result.hash,
    blockNumber: parseInt(data.result.blockNumber, 16),
    timestamp: Math.floor(Date.now() / 1000) - 300,
    from: data.result.from,
    to: data.result.to || 'Contract Creation',
    value: data.result.value,
    fee: (parseInt(data.result.gas, 16) * parseInt(data.result.gasPrice, 16)).toString(),
    gasPrice: (parseInt(data.result.gasPrice, 16) / 1e9).toFixed(2),
    gasUsed: receiptData.result ? parseInt(receiptData.result.gasUsed, 16) : parseInt(data.result.gas, 16),
    status: receiptData.result?.status === '0x1' ? 'confirmed' : 'failed',
    confirmations: 100,
    input: data.result.input,
    chain: 'ethereum',
  };
}

/**
 * Fetch Bitcoin transaction by hash
 */
export async function fetchBtcTransaction(hash: string): Promise<Transaction | null> {
  const response = await fetchWithTimeout(`${API_URLS.BLOCKCHAIN}/rawtx/${hash}`);

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  return {
    hash: data.hash,
    blockNumber: data.block_height || 0,
    timestamp: data.time,
    from: data.inputs?.[0]?.prev_out?.addr || 'Unknown',
    to: data.out?.[0]?.addr || 'Unknown',
    value: data.out?.reduce((sum: number, out: any) => sum + out.value, 0).toString() || '0',
    fee: data.fee?.toString() || '0',
    status: data.block_height ? 'confirmed' : 'pending',
    confirmations: data.block_height ? 6 : 0,
    chain: 'bitcoin',
  };
}

/**
 * Detect chain type from transaction hash and fetch
 */
export async function fetchTransaction(hash: string): Promise<Transaction | null> {
  const isEth = hash.startsWith('0x');

  if (isEth) {
    return fetchEthTransaction(hash);
  } else {
    return fetchBtcTransaction(hash);
  }
}

// ============ Address Services ============

/**
 * Fetch Ethereum address info
 */
export async function fetchEthAddress(address: string): Promise<Address> {
  const [balanceResponse, txCountResponse] = await Promise.all([
    fetchWithTimeout(
      `${API_URLS.ETHERSCAN}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`
    ),
    fetchWithTimeout(
      `${API_URLS.ETHERSCAN}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`
    ),
  ]);

  const balanceData = await balanceResponse.json();
  const txCountData = await txCountResponse.json();

  return {
    address,
    balance: balanceData.result || '0',
    transactionCount: parseInt(txCountData.result, 16) || 0,
    chain: 'ethereum',
    lastActivity: Math.floor(Date.now() / 1000) - 3600,
    firstSeen: Math.floor(Date.now() / 1000) - 86400 * 365,
  };
}

/**
 * Fetch Bitcoin address info
 */
export async function fetchBtcAddress(address: string): Promise<Address | null> {
  const response = await fetchWithTimeout(`${API_URLS.BLOCKCHAIN}/rawaddr/${address}?limit=0`);

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  return {
    address,
    balance: data.final_balance?.toString() || '0',
    transactionCount: data.n_tx || 0,
    chain: 'bitcoin',
    lastActivity: data.txs?.[0]?.time,
    firstSeen: data.txs?.[data.txs?.length - 1]?.time,
  };
}

/**
 * Detect chain type from address and fetch
 */
export async function fetchAddress(address: string): Promise<Address | null> {
  const isEth = address.startsWith('0x');

  if (isEth) {
    return fetchEthAddress(address);
  } else {
    return fetchBtcAddress(address);
  }
}

// ============ Address Transaction Services ============

/**
 * Fetch Ethereum address transactions
 */
export async function fetchEthAddressTransactions(address: string): Promise<Transaction[]> {
  const response = await fetchWithTimeout(
    `${API_URLS.ETHERSCAN}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc&apikey=${ETHERSCAN_API_KEY}`
  );
  const data = await response.json();

  if (!data.result || !Array.isArray(data.result)) {
    return [];
  }

  return data.result.map((tx: any) => ({
    hash: tx.hash,
    blockNumber: parseInt(tx.blockNumber),
    timestamp: parseInt(tx.timeStamp),
    from: tx.from,
    to: tx.to,
    value: tx.value,
    fee: (parseInt(tx.gasUsed) * parseInt(tx.gasPrice)).toString(),
    gasPrice: (parseInt(tx.gasPrice) / 1e9).toFixed(2),
    gasUsed: parseInt(tx.gasUsed),
    status: tx.isError === '0' ? 'confirmed' : 'failed',
    confirmations: 100,
    chain: 'ethereum' as const,
  }));
}

/**
 * Fetch Bitcoin address transactions
 */
export async function fetchBtcAddressTransactions(address: string): Promise<Transaction[]> {
  const response = await fetchWithTimeout(`${API_URLS.BLOCKCHAIN}/rawaddr/${address}?limit=25`);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  if (!data.txs) {
    return [];
  }

  return data.txs.map((tx: any) => ({
    hash: tx.hash,
    blockNumber: tx.block_height || 0,
    timestamp: tx.time,
    from: tx.inputs?.[0]?.prev_out?.addr || 'Unknown',
    to: tx.out?.[0]?.addr || 'Unknown',
    value: tx.out?.reduce((sum: number, out: any) => sum + out.value, 0).toString() || '0',
    fee: tx.fee?.toString() || '0',
    status: tx.block_height ? 'confirmed' : 'pending',
    confirmations: tx.block_height ? 6 : 0,
    chain: 'bitcoin' as const,
  }));
}

/**
 * Detect chain type from address and fetch transactions
 */
export async function fetchAddressTransactions(address: string): Promise<Transaction[]> {
  const isEth = address.startsWith('0x');

  if (isEth) {
    return fetchEthAddressTransactions(address);
  } else {
    return fetchBtcAddressTransactions(address);
  }
}
