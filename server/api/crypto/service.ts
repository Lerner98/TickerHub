import { fetchWithTimeout } from '../../lib/apiClient';
import { API_URLS, TIME_RANGE_DAYS } from '../../lib/constants';
import type { PriceData, ChartDataPoint } from '@shared/schema';

/**
 * Fetch top 20 cryptocurrencies from CoinGecko
 */
export async function fetchPrices(): Promise<PriceData[]> {
  const url = `${API_URLS.COINGECKO}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h`;

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();

  return data.map((coin: any) => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    image: coin.image,
    price: coin.current_price,
    priceChange24h: coin.price_change_24h,
    priceChangePercentage24h: coin.price_change_percentage_24h,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume,
    high24h: coin.high_24h,
    low24h: coin.low_24h,
    sparkline: coin.sparkline_in_7d?.price?.filter((_: unknown, i: number) => i % 4 === 0) || [],
  }));
}

/**
 * Fetch price chart data for a specific coin
 */
export async function fetchChart(coinId: string, range: string): Promise<ChartDataPoint[]> {
  const days = TIME_RANGE_DAYS[range] || 7;
  const url = `${API_URLS.COINGECKO}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();

  // Sample data points to reduce payload size
  const interval = Math.max(1, Math.floor(data.prices.length / 100));

  return data.prices
    .filter((_: unknown, i: number) => i % interval === 0)
    .map(([timestamp, price]: [number, number]) => ({
      timestamp: Math.floor(timestamp / 1000),
      price,
    }));
}
