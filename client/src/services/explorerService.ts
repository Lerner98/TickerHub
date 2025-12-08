/**
 * Explorer Service
 * Following Gold Standard: Service layer for blockchain explorer API calls
 */

import { API_ENDPOINTS } from '@/lib/constants';
import { fetchApi, buildUrl } from './api';
import type { Transaction, Address, ChainType } from './types';

export const explorerService = {
  /**
   * Get transaction details
   */
  async getTransaction(hash: string, chain?: ChainType): Promise<Transaction> {
    const url = buildUrl(`${API_ENDPOINTS.TRANSACTION}/${hash}`, { chain });
    return fetchApi<Transaction>(url);
  },

  /**
   * Get address details
   */
  async getAddress(address: string, chain?: ChainType): Promise<Address> {
    const url = buildUrl(`${API_ENDPOINTS.ADDRESS}/${address}`, { chain });
    return fetchApi<Address>(url);
  },

  /**
   * Get address transactions
   */
  async getAddressTransactions(
    address: string,
    chain?: ChainType,
    page: number = 1,
    limit: number = 20
  ): Promise<Transaction[]> {
    const url = buildUrl(`${API_ENDPOINTS.ADDRESS}/${address}/transactions`, {
      chain,
      page,
      limit,
    });
    return fetchApi<Transaction[]>(url);
  },
};
