/**
 * Base API Client
 * Following Gold Standard: Centralized API fetching with error handling
 */

import { ApiError } from './types';

/**
 * Fetch JSON from API with error handling
 */
export async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(
      `API Error: ${response.status} - ${text}`,
      response.status
    );
  }

  return response.json();
}

/**
 * Build URL with query parameters
 */
export function buildUrl(base: string, params?: Record<string, string | number | undefined>): string {
  if (!params) return base;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `${base}?${query}` : base;
}
