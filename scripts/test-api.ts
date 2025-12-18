#!/usr/bin/env tsx
/**
 * API Health Check Script
 *
 * Tests API endpoints to verify they're working.
 * Assumes server is already running on localhost:5000.
 *
 * RATE LIMIT AWARE: By default, skips expensive API calls.
 * Use flags to enable additional tests.
 *
 * Usage:
 *   npm run check:api              # Core endpoints only (free, cached)
 *   npm run check:api -- --ai      # Include AI endpoints (uses Gemini quota)
 *   npm run check:api -- --fmp     # Include FMP endpoints (250/day limit)
 *   npm run check:api -- --full    # Test everything (uses all quotas)
 *
 * @module scripts/test-api
 */

import { log, logSection, logResult, testEndpoint, colors } from './dev-utils';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Parse CLI args
const args = process.argv.slice(2);
const includeAI = args.includes('--ai') || args.includes('--full');
const includeFMP = args.includes('--fmp') || args.includes('--full');
const includeBlockchain = args.includes('--blockchain') || args.includes('--full');

interface EndpointTest {
  name: string;
  path: string;
  method?: 'GET' | 'POST';
  body?: unknown;
  expectStatus?: number[];
  optional?: boolean; // Won't fail overall test if this fails
  category: 'core' | 'ai' | 'fmp' | 'crypto' | 'blockchain';
  apiCost?: 'free' | 'cached' | 'quota'; // How expensive is this call?
}

// Define all API endpoints to test
const endpoints: EndpointTest[] = [
  // ============================================================================
  // CORE - Always test (free/cached endpoints)
  // ============================================================================
  { name: 'Health Check', path: '/api/health', category: 'core', apiCost: 'free' },
  { name: 'Platform Stats', path: '/api/stats', category: 'core', apiCost: 'free' },
  { name: 'Stock Status', path: '/api/stocks/status', category: 'core', apiCost: 'free' },
  { name: 'AI Status', path: '/api/ai/status', category: 'core', apiCost: 'free' },

  // Stock data - uses caching, minimal API impact
  { name: 'Top Stocks', path: '/api/stocks', category: 'core', apiCost: 'cached' },
  { name: 'Stock Detail (AAPL)', path: '/api/stocks/AAPL', category: 'core', apiCost: 'cached' },
  { name: 'Stock Search', path: '/api/stocks/search?q=apple', category: 'core', apiCost: 'free' },

  // Chart - uses Twelve Data quota but results are cached
  { name: 'Stock Chart', path: '/api/stocks/AAPL/chart?timeframe=1D', category: 'core', apiCost: 'cached', optional: true },

  // Crypto - CoinGecko free tier is generous
  { name: 'Crypto Prices', path: '/api/prices', category: 'crypto', apiCost: 'cached' },

  // ============================================================================
  // AI - Only with --ai flag (15 RPM Gemini limit)
  // ============================================================================
  {
    name: 'AI Search Parse',
    path: '/api/ai/search',
    method: 'POST',
    body: { query: 'tech stocks' },
    expectStatus: [200, 503],
    category: 'ai',
    apiCost: 'quota',
  },
  {
    name: 'AI Stock Summary',
    path: '/api/ai/summary/AAPL',
    expectStatus: [200, 503],
    category: 'ai',
    apiCost: 'quota',
    optional: true,
  },
  {
    name: 'AI Market Overview',
    path: '/api/ai/market',
    expectStatus: [200, 503],
    category: 'ai',
    apiCost: 'quota',
    optional: true,
  },

  // ============================================================================
  // FMP - Only with --fmp flag (250/day limit)
  // ============================================================================
  { name: 'Market Gainers', path: '/api/stocks/movers/gainers', category: 'fmp', apiCost: 'quota', optional: true },
  { name: 'Market Losers', path: '/api/stocks/movers/losers', category: 'fmp', apiCost: 'quota', optional: true },
  { name: 'Most Active', path: '/api/stocks/movers/actives', category: 'fmp', apiCost: 'quota', optional: true },
  { name: 'Stock News', path: '/api/stocks/AAPL/news', category: 'fmp', apiCost: 'quota', optional: true },
  { name: 'Company Profile', path: '/api/stocks/AAPL/profile', category: 'fmp', apiCost: 'quota', optional: true },
  { name: 'Sector Performance', path: '/api/stocks/sectors', category: 'fmp', apiCost: 'quota', optional: true },
  { name: 'General News', path: '/api/stocks/news', category: 'fmp', apiCost: 'quota', optional: true },

  // ============================================================================
  // BLOCKCHAIN - Only with --blockchain flag (external API)
  // ============================================================================
  { name: 'Ethereum Network', path: '/api/network/ethereum', category: 'blockchain', apiCost: 'cached', optional: true },
  { name: 'Bitcoin Network', path: '/api/network/bitcoin', category: 'blockchain', apiCost: 'cached', optional: true },
];

function shouldTest(endpoint: EndpointTest): boolean {
  switch (endpoint.category) {
    case 'core':
    case 'crypto':
      return true;
    case 'ai':
      return includeAI;
    case 'fmp':
      return includeFMP;
    case 'blockchain':
      return includeBlockchain;
    default:
      return false;
  }
}

async function runTests(): Promise<void> {
  logSection('TickerHub API Health Check');
  log(`Testing against: ${BASE_URL}`, 'blue');

  // Show what's being tested
  console.log(`\n${colors.gray}Test scope:${colors.reset}`);
  console.log(`  Core/Crypto: ${colors.green}✓${colors.reset} always`);
  console.log(`  AI (Gemini): ${includeAI ? `${colors.green}✓${colors.reset} enabled` : `${colors.gray}○ use --ai${colors.reset}`}`);
  console.log(`  FMP:         ${includeFMP ? `${colors.green}✓${colors.reset} enabled` : `${colors.gray}○ use --fmp${colors.reset}`}`);
  console.log(`  Blockchain:  ${includeBlockchain ? `${colors.green}✓${colors.reset} enabled` : `${colors.gray}○ use --blockchain${colors.reset}`}`);
  console.log('');

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let notTested = 0;
  const results: { name: string; success: boolean; latency: number; status?: number }[] = [];

  for (const endpoint of endpoints) {
    if (!shouldTest(endpoint)) {
      notTested++;
      continue;
    }

    const url = `${BASE_URL}${endpoint.path}`;
    const result = await testEndpoint(url, {
      method: endpoint.method || 'GET',
      body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
    });

    const expectedStatuses = endpoint.expectStatus || [200];
    const isExpectedStatus = result.status !== undefined && expectedStatuses.includes(result.status);
    const success = result.success || isExpectedStatus;

    results.push({
      name: endpoint.name,
      success,
      latency: result.latency,
      status: result.status,
    });

    const costLabel = endpoint.apiCost === 'quota' ? ` ${colors.yellow}[quota]${colors.reset}` : '';

    if (success) {
      passed++;
      logResult(endpoint.name, true, `${result.status} ${result.latency}ms${costLabel}`);
    } else if (endpoint.optional) {
      skipped++;
      console.log(
        `  ${colors.yellow}○ SKIP${colors.reset} ${endpoint.name} ${colors.gray}(${result.status || result.error})${colors.reset}`
      );
    } else {
      failed++;
      logResult(endpoint.name, false, `${result.status || result.error}`);
    }
  }

  // Summary
  logSection('Results Summary');
  console.log(`  ${colors.green}Passed:${colors.reset}     ${passed}`);
  console.log(`  ${colors.red}Failed:${colors.reset}     ${failed}`);
  console.log(`  ${colors.yellow}Skipped:${colors.reset}    ${skipped}`);
  console.log(`  ${colors.gray}Not tested:${colors.reset} ${notTested}`);

  // Performance stats
  if (results.length > 0) {
    const avgLatency = Math.round(results.reduce((sum, r) => sum + r.latency, 0) / results.length);
    const maxLatency = Math.max(...results.map((r) => r.latency));
    console.log(`\n  Avg Latency: ${avgLatency}ms`);
    console.log(`  Max Latency: ${maxLatency}ms`);
  }

  // Exit code
  if (failed > 0) {
    log('\n❌ Some tests failed!', 'red');
    process.exit(1);
  } else {
    log('\n✅ All required tests passed!', 'green');
    process.exit(0);
  }
}

// Run if called directly
runTests().catch((error) => {
  log(`Error: ${error.message}`, 'red');
  process.exit(1);
});
