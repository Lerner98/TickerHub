import { fetchWithTimeout } from '../../lib/apiClient';
import { API_URLS } from '../../lib/constants';
import type { Transaction, Address } from '@shared/schema';

/**
 * Explorer service using Blockchair API (free, no API key required)
 *
 * Blockchair provides unified API for multiple blockchains.
 * Free tier: 30 requests/minute without API key
 * @see https://blockchair.com/api/docs
 */

// ============ Transaction Services ============

/**
 * Fetch Ethereum transaction by hash
 */
export async function fetchEthTransaction(hash: string): Promise<Transaction | null> {
  const response = await fetchWithTimeout(
    `${API_URLS.BLOCKCHAIR}/ethereum/dashboards/transaction/${hash}`
  );
  const data = await response.json();

  if (!data.data || !data.data[hash]) {
    return null;
  }

  const tx = data.data[hash].transaction;

  return {
    hash: tx.hash,
    blockNumber: tx.block_id,
    timestamp: Math.floor(new Date(tx.time).getTime() / 1000),
    from: tx.sender,
    to: tx.recipient || 'Contract Creation',
    value: tx.value?.toString() || '0',
    fee: tx.fee?.toString() || '0',
    gasPrice: tx.gas_price ? (tx.gas_price / 1e9).toFixed(2) : '0',
    gasUsed: tx.gas_used || tx.gas_limit || 21000,
    status: tx.failed ? 'failed' : 'confirmed',
    confirmations: 100,
    input: tx.input_hex || '0x',
    chain: 'ethereum',
  };
}

/**
 * Fetch Bitcoin transaction by hash
 */
export async function fetchBtcTransaction(hash: string): Promise<Transaction | null> {
  const response = await fetchWithTimeout(
    `${API_URLS.BLOCKCHAIR}/bitcoin/dashboards/transaction/${hash}`
  );
  const data = await response.json();

  if (!data.data || !data.data[hash]) {
    return null;
  }

  const tx = data.data[hash].transaction;
  const inputs = data.data[hash].inputs || [];
  const outputs = data.data[hash].outputs || [];

  return {
    hash: tx.hash,
    blockNumber: tx.block_id || 0,
    timestamp: Math.floor(new Date(tx.time).getTime() / 1000),
    from: inputs[0]?.recipient || 'Coinbase',
    to: outputs[0]?.recipient || 'Unknown',
    value: (tx.output_total / 1e8).toFixed(8),
    fee: ((tx.fee || 0) / 1e8).toFixed(8),
    status: tx.block_id ? 'confirmed' : 'pending',
    confirmations: tx.block_id ? 6 : 0,
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
  const response = await fetchWithTimeout(
    `${API_URLS.BLOCKCHAIR}/ethereum/dashboards/address/${address}`
  );
  const data = await response.json();

  if (!data.data || !data.data[address.toLowerCase()]) {
    return {
      address,
      balance: '0',
      transactionCount: 0,
      chain: 'ethereum',
      lastActivity: Math.floor(Date.now() / 1000),
      firstSeen: Math.floor(Date.now() / 1000),
    };
  }

  const addrData = data.data[address.toLowerCase()].address;

  return {
    address,
    balance: addrData.balance?.toString() || '0',
    transactionCount: addrData.transaction_count || 0,
    chain: 'ethereum',
    lastActivity: addrData.last_seen_receiving
      ? Math.floor(new Date(addrData.last_seen_receiving).getTime() / 1000)
      : Math.floor(Date.now() / 1000),
    firstSeen: addrData.first_seen_receiving
      ? Math.floor(new Date(addrData.first_seen_receiving).getTime() / 1000)
      : Math.floor(Date.now() / 1000),
  };
}

/**
 * Fetch Bitcoin address info
 */
export async function fetchBtcAddress(address: string): Promise<Address | null> {
  const response = await fetchWithTimeout(
    `${API_URLS.BLOCKCHAIR}/bitcoin/dashboards/address/${address}`
  );
  const data = await response.json();

  if (!data.data || !data.data[address]) {
    return null;
  }

  const addrData = data.data[address].address;

  return {
    address,
    balance: addrData.balance?.toString() || '0',
    transactionCount: addrData.transaction_count || 0,
    chain: 'bitcoin',
    lastActivity: addrData.last_seen_receiving
      ? Math.floor(new Date(addrData.last_seen_receiving).getTime() / 1000)
      : undefined,
    firstSeen: addrData.first_seen_receiving
      ? Math.floor(new Date(addrData.first_seen_receiving).getTime() / 1000)
      : undefined,
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
    `${API_URLS.BLOCKCHAIR}/ethereum/dashboards/address/${address}?limit=25&transaction_details=true`
  );
  const data = await response.json();

  if (!data.data || !data.data[address.toLowerCase()] || !data.data[address.toLowerCase()].transactions) {
    return [];
  }

  return data.data[address.toLowerCase()].transactions.map((tx: any) => ({
    hash: tx.hash,
    blockNumber: tx.block_id,
    timestamp: Math.floor(new Date(tx.time).getTime() / 1000),
    from: tx.sender,
    to: tx.recipient || 'Contract Creation',
    value: tx.value?.toString() || '0',
    fee: tx.fee?.toString() || '0',
    gasPrice: tx.gas_price ? (tx.gas_price / 1e9).toFixed(2) : '0',
    gasUsed: tx.gas_used || 21000,
    status: tx.failed ? 'failed' : 'confirmed',
    confirmations: 100,
    chain: 'ethereum' as const,
  }));
}

/**
 * Fetch Bitcoin address transactions
 */
export async function fetchBtcAddressTransactions(address: string): Promise<Transaction[]> {
  const response = await fetchWithTimeout(
    `${API_URLS.BLOCKCHAIR}/bitcoin/dashboards/address/${address}?limit=25&transaction_details=true`
  );
  const data = await response.json();

  if (!data.data || !data.data[address] || !data.data[address].transactions) {
    return [];
  }

  return data.data[address].transactions.map((tx: any) => ({
    hash: tx.hash,
    blockNumber: tx.block_id || 0,
    timestamp: Math.floor(new Date(tx.time).getTime() / 1000),
    from: 'See Details',
    to: 'See Details',
    value: (tx.balance_change / 1e8).toFixed(8),
    fee: '0',
    status: tx.block_id ? 'confirmed' : 'pending',
    confirmations: tx.block_id ? 6 : 0,
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
