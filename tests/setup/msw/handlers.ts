/**
 * MSW Request Handlers
 *
 * Mock external API responses for testing.
 * These handlers intercept network requests at the network layer.
 */

import { http, HttpResponse } from 'msw';

// =============================================================================
// FINNHUB API HANDLERS
// =============================================================================

const mockFinnhubQuotes: Record<string, object> = {
  AAPL: { c: 178.72, d: 2.15, dp: 1.22, h: 179.63, l: 176.21, o: 176.38, pc: 176.57, t: 1702425600 },
  MSFT: { c: 374.58, d: -1.23, dp: -0.33, h: 377.44, l: 373.52, o: 376.80, pc: 375.81, t: 1702425600 },
  GOOGL: { c: 140.93, d: 0.87, dp: 0.62, h: 141.50, l: 139.80, o: 140.20, pc: 140.06, t: 1702425600 },
  AMZN: { c: 153.42, d: 1.56, dp: 1.03, h: 154.20, l: 151.80, o: 152.10, pc: 151.86, t: 1702425600 },
  TSLA: { c: 251.05, d: -3.45, dp: -1.36, h: 256.80, l: 249.50, o: 255.00, pc: 254.50, t: 1702425600 },
  NVDA: { c: 465.25, d: 8.75, dp: 1.92, h: 468.00, l: 455.50, o: 458.00, pc: 456.50, t: 1702425600 },
  META: { c: 325.48, d: 4.23, dp: 1.32, h: 327.00, l: 320.50, o: 321.50, pc: 321.25, t: 1702425600 },
  JPM: { c: 165.32, d: 1.12, dp: 0.68, h: 166.00, l: 163.80, o: 164.50, pc: 164.20, t: 1702425600 },
  V: { c: 258.90, d: 2.35, dp: 0.92, h: 260.00, l: 256.50, o: 257.00, pc: 256.55, t: 1702425600 },
  WMT: { c: 156.78, d: 0.45, dp: 0.29, h: 157.50, l: 155.80, o: 156.20, pc: 156.33, t: 1702425600 },
};

const mockFinnhubProfiles: Record<string, object> = {
  AAPL: { country: 'US', currency: 'USD', exchange: 'NASDAQ', ipo: '1980-12-12', marketCapitalization: 2800000, name: 'Apple Inc', phone: '14089961010', shareOutstanding: 15700, ticker: 'AAPL', weburl: 'https://www.apple.com/', logo: 'https://static.finnhub.io/logo/87cb30d8-80df-11ea-8951-00000000092a.png', finnhubIndustry: 'Technology' },
  MSFT: { country: 'US', currency: 'USD', exchange: 'NASDAQ', ipo: '1986-03-13', marketCapitalization: 2780000, name: 'Microsoft Corporation', phone: '14258828080', shareOutstanding: 7430, ticker: 'MSFT', weburl: 'https://www.microsoft.com/', logo: 'https://static.finnhub.io/logo/87cb30d8-80df-11ea-8951-00000000092b.png', finnhubIndustry: 'Technology' },
  GOOGL: { country: 'US', currency: 'USD', exchange: 'NASDAQ', ipo: '2004-08-19', marketCapitalization: 1750000, name: 'Alphabet Inc', phone: '16502530000', shareOutstanding: 12400, ticker: 'GOOGL', weburl: 'https://abc.xyz/', logo: 'https://static.finnhub.io/logo/87cb30d8-80df-11ea-8951-00000000092c.png', finnhubIndustry: 'Technology' },
};

// =============================================================================
// COINGECKO API HANDLERS
// =============================================================================

const mockCoinGeckoPrices = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 43250.00, market_cap: 847000000000, market_cap_rank: 1, price_change_percentage_24h: 2.15, total_volume: 28500000000 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 2280.50, market_cap: 274000000000, market_cap_rank: 2, price_change_percentage_24h: 1.85, total_volume: 12500000000 },
  { id: 'tether', symbol: 'usdt', name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', current_price: 1.00, market_cap: 91000000000, market_cap_rank: 3, price_change_percentage_24h: 0.01, total_volume: 45000000000 },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', current_price: 312.75, market_cap: 48000000000, market_cap_rank: 4, price_change_percentage_24h: -0.45, total_volume: 890000000 },
  { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', current_price: 72.30, market_cap: 31000000000, market_cap_rank: 5, price_change_percentage_24h: 3.25, total_volume: 1200000000 },
];

// =============================================================================
// HANDLERS
// =============================================================================

export const handlers = [
  // Finnhub: Quote endpoint
  http.get('https://finnhub.io/api/v1/quote', ({ request }) => {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol')?.toUpperCase();

    if (!symbol || !mockFinnhubQuotes[symbol]) {
      return HttpResponse.json({ error: 'Symbol not found' }, { status: 404 });
    }

    return HttpResponse.json(mockFinnhubQuotes[symbol]);
  }),

  // Finnhub: Profile endpoint
  http.get('https://finnhub.io/api/v1/stock/profile2', ({ request }) => {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol')?.toUpperCase();

    if (!symbol || !mockFinnhubProfiles[symbol]) {
      return HttpResponse.json({});
    }

    return HttpResponse.json(mockFinnhubProfiles[symbol]);
  }),

  // CoinGecko: Markets endpoint
  http.get('https://api.coingecko.com/api/v3/coins/markets', () => {
    return HttpResponse.json(mockCoinGeckoPrices);
  }),

  // CoinGecko: Simple price endpoint
  http.get('https://api.coingecko.com/api/v3/simple/price', ({ request }) => {
    const url = new URL(request.url);
    const ids = url.searchParams.get('ids')?.split(',') || [];

    const result: Record<string, { usd: number; usd_24h_change: number }> = {};
    for (const id of ids) {
      const coin = mockCoinGeckoPrices.find((c) => c.id === id);
      if (coin) {
        result[id] = {
          usd: coin.current_price,
          usd_24h_change: coin.price_change_percentage_24h,
        };
      }
    }

    return HttpResponse.json(result);
  }),

  // CoinGecko: Chart data endpoint
  http.get('https://api.coingecko.com/api/v3/coins/:coinId/market_chart', () => {
    // Generate mock chart data
    const prices: [number, number][] = [];
    const now = Date.now();
    for (let i = 0; i < 24; i++) {
      prices.push([now - i * 3600000, 43000 + Math.random() * 500]);
    }
    return HttpResponse.json({ prices: prices.reverse() });
  }),

  // =============================================================================
  // HEALTH CHECK ENDPOINT MOCKS
  // =============================================================================

  // CoinGecko: Ping endpoint (used by health check)
  http.get('https://api.coingecko.com/api/v3/ping', () => {
    return HttpResponse.json({ gecko_says: '(V3) To the Moon!' });
  }),

  // Etherscan: Block number endpoint (used by health check)
  http.get('https://api.etherscan.io/v2/api', ({ request }) => {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'eth_blockNumber') {
      return HttpResponse.json({
        jsonrpc: '2.0',
        id: 1,
        result: '0x1234567',
      });
    }

    return HttpResponse.json({ status: '1', message: 'OK' });
  }),

  // Blockchain.info: Latest block endpoint (used by health check)
  http.get('https://blockchain.info/latestblock', () => {
    return HttpResponse.json({
      hash: '0000000000000000000123456789abcdef',
      time: Math.floor(Date.now() / 1000),
      block_index: 850000,
      height: 850000,
    });
  }),
];

// Export mock data for test assertions
export { mockFinnhubQuotes, mockFinnhubProfiles, mockCoinGeckoPrices };
