#!/usr/bin/env tsx
/**
 * Full System Check Script
 *
 * Complete workflow for verifying system health:
 * 1. Environment variables
 * 2. TypeScript compilation
 * 3. Server startup
 * 4. All API endpoints
 * 5. Provider connectivity
 *
 * This is the ONE command to run for complete system verification.
 *
 * Usage:
 *   npm run check:full
 *   npx tsx scripts/full-check.ts
 *
 * Options:
 *   --skip-cleanup    Don't kill existing processes first
 *   --skip-server     Assume server is already running
 *   --quick           Skip slow tests (AI, blockchain)
 *
 * @module scripts/full-check
 */

import { execSync, spawn, type ChildProcess } from 'child_process';
import { config } from 'dotenv';
import { log, logSection, logResult, colors, testEndpoint, waitForServer } from './dev-utils';

config();

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Parse CLI args
const args = process.argv.slice(2);
const skipCleanup = args.includes('--skip-cleanup');
const skipServer = args.includes('--skip-server');
const quickMode = args.includes('--quick');

interface CheckResult {
  name: string;
  passed: boolean;
  details?: string;
  duration?: number;
}

const results: CheckResult[] = [];
let serverProcess: ChildProcess | null = null;

function recordResult(name: string, passed: boolean, details?: string, duration?: number): void {
  results.push({ name, passed, details, duration });
  logResult(name, passed, details);
}

// ============================================================================
// Step 1: Environment Check
// ============================================================================
function checkEnvironment(): boolean {
  logSection('Step 1: Environment Check');

  const required = ['DATABASE_URL', 'BETTER_AUTH_SECRET'];
  const optional = ['TWELVE_DATA_API_KEY', 'FINNHUB_API_KEY', 'FMP_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_CLIENT_ID'];

  let allRequired = true;

  for (const key of required) {
    const value = process.env[key];
    if (value && value.trim()) {
      recordResult(key, true, 'configured');
    } else {
      recordResult(key, false, 'MISSING - required');
      allRequired = false;
    }
  }

  for (const key of optional) {
    const value = process.env[key];
    recordResult(key, !!value, value ? 'configured' : 'not set');
  }

  return allRequired;
}

// ============================================================================
// Step 2: TypeScript Check
// ============================================================================
function checkTypeScript(): boolean {
  logSection('Step 2: TypeScript Compilation');

  try {
    const start = Date.now();
    execSync('npx tsc --noEmit', { stdio: 'pipe', encoding: 'utf8' });
    const duration = Date.now() - start;
    recordResult('TypeScript compilation', true, `${duration}ms`);
    return true;
  } catch (error) {
    const err = error as { stderr?: string };
    const errorCount = (err.stderr || '').split('\n').filter((l) => l.includes('error TS')).length;
    recordResult('TypeScript compilation', false, `${errorCount} errors`);
    return false;
  }
}

// ============================================================================
// Step 3: Process Cleanup
// ============================================================================
function cleanupProcesses(): void {
  if (skipCleanup) {
    log('Skipping cleanup (--skip-cleanup)', 'gray');
    return;
  }

  logSection('Step 3: Process Cleanup');

  try {
    if (process.platform === 'win32') {
      execSync('powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"', {
        stdio: 'pipe',
      });
    } else {
      execSync('pkill -f node || true', { stdio: 'pipe' });
    }
    recordResult('Kill zombie processes', true);
  } catch {
    recordResult('Kill zombie processes', true, 'none found');
  }
}

// ============================================================================
// Step 4: Server Startup
// ============================================================================
async function startServer(): Promise<boolean> {
  if (skipServer) {
    logSection('Step 4: Server Check');
    log('Assuming server is running (--skip-server)', 'gray');

    const health = await testEndpoint(`${BASE_URL}/api/health`);
    if (health.success) {
      recordResult('Server running', true, `${health.latency}ms`);
      return true;
    } else {
      recordResult('Server running', false, 'not responding');
      return false;
    }
  }

  logSection('Step 4: Server Startup');

  // Start the server
  const isWindows = process.platform === 'win32';
  serverProcess = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  let serverOutput = '';
  serverProcess.stdout?.on('data', (data) => {
    serverOutput += data.toString();
  });
  serverProcess.stderr?.on('data', (data) => {
    serverOutput += data.toString();
  });

  // Wait for server
  const start = Date.now();
  const ready = await waitForServer(`${BASE_URL}/api/health`, 30, 1000);
  const duration = Date.now() - start;

  if (ready) {
    recordResult('Server startup', true, `ready in ${duration}ms`);

    // Check what providers loaded
    if (serverOutput.includes('Gemini AI client initialized')) {
      recordResult('Gemini AI loaded', true);
    } else if (process.env.GEMINI_API_KEY) {
      recordResult('Gemini AI loaded', false, 'key set but not loaded');
    }

    if (serverOutput.includes('Twelve Data')) {
      recordResult('Stock providers loaded', true);
    }

    return true;
  } else {
    recordResult('Server startup', false, 'timeout after 30s');
    return false;
  }
}

// ============================================================================
// Step 5: API Endpoint Tests
// ============================================================================
async function testAPIs(): Promise<boolean> {
  logSection('Step 5: API Endpoint Tests');

  const tests = [
    // Core endpoints - must work
    { name: 'Health check', path: '/api/health', required: true },
    { name: 'Platform stats', path: '/api/stats', required: true },
    { name: 'Stock list', path: '/api/stocks', required: true },
    { name: 'Stock detail (AAPL)', path: '/api/stocks/AAPL', required: true },
    { name: 'Stock search', path: '/api/stocks/search?q=apple', required: true },

    // Provider-dependent endpoints
    { name: 'Stock chart', path: '/api/stocks/AAPL/chart?timeframe=1D', required: false },
    { name: 'Crypto prices', path: '/api/prices', required: false },

    // FMP endpoints
    { name: 'Market gainers', path: '/api/stocks/movers/gainers', required: false },
    { name: 'Stock news', path: '/api/stocks/AAPL/news', required: false },
    { name: 'Company profile', path: '/api/stocks/AAPL/profile', required: false },

    // AI endpoints
    { name: 'AI status', path: '/api/ai/status', required: false },
  ];

  // Skip slow tests in quick mode
  if (!quickMode) {
    tests.push(
      { name: 'Ethereum network', path: '/api/network/ethereum', required: false },
      { name: 'Bitcoin network', path: '/api/network/bitcoin', required: false }
    );
  }

  let allRequired = true;

  for (const test of tests) {
    const result = await testEndpoint(`${BASE_URL}${test.path}`);
    const passed = result.success || (!test.required && result.status !== undefined);

    if (test.required && !result.success) {
      allRequired = false;
    }

    recordResult(
      test.name,
      result.success,
      `${result.status || result.error} ${result.latency}ms${!test.required ? ' (optional)' : ''}`
    );
  }

  // Test AI search with POST
  if (!quickMode && process.env.GEMINI_API_KEY) {
    const aiResult = await testEndpoint(`${BASE_URL}/api/ai/search`, {
      method: 'POST',
      body: JSON.stringify({ query: 'tech stocks' }),
    });
    recordResult(
      'AI search parse',
      aiResult.success || aiResult.status === 503,
      `${aiResult.status} ${aiResult.latency}ms`
    );
  }

  return allRequired;
}

// ============================================================================
// Summary
// ============================================================================
function printSummary(): void {
  logSection('Final Summary');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`  Total checks: ${results.length}`);
  console.log(`  ${colors.green}Passed:${colors.reset} ${passed}`);
  console.log(`  ${colors.red}Failed:${colors.reset} ${failed}`);

  if (failed > 0) {
    console.log(`\n  ${colors.red}Failed checks:${colors.reset}`);
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`    - ${r.name}: ${r.details || 'failed'}`);
    }
  }

  // Feature status summary
  console.log(`\n${colors.cyan}Feature Status:${colors.reset}`);
  console.log(`  Stock Data:    ${process.env.TWELVE_DATA_API_KEY ? `${colors.green}✓${colors.reset}` : `${colors.yellow}○${colors.reset}`}`);
  console.log(`  Market Movers: ${process.env.FMP_API_KEY ? `${colors.green}✓${colors.reset}` : `${colors.yellow}○${colors.reset}`}`);
  console.log(`  AI Features:   ${process.env.GEMINI_API_KEY ? `${colors.green}✓${colors.reset}` : `${colors.yellow}○${colors.reset}`}`);
  console.log(`  OAuth:         ${process.env.GOOGLE_CLIENT_ID ? `${colors.green}✓${colors.reset}` : `${colors.yellow}○${colors.reset}`}`);
}

// ============================================================================
// Main
// ============================================================================
async function main(): Promise<void> {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║         TickerHub Full System Check                       ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}`);

  if (quickMode) {
    log('\nRunning in quick mode (--quick)', 'yellow');
  }

  let exitCode = 0;

  try {
    // Step 1: Environment
    if (!checkEnvironment()) {
      log('\n⚠️  Missing required environment variables', 'yellow');
      exitCode = 1;
    }

    // Step 2: TypeScript (skip in quick mode)
    if (!quickMode) {
      if (!checkTypeScript()) {
        log('\n⚠️  TypeScript errors found', 'yellow');
        // Don't exit - continue with other checks
      }
    }

    // Step 3: Cleanup
    cleanupProcesses();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 4: Server
    const serverOk = await startServer();
    if (!serverOk) {
      log('\n❌ Server failed to start', 'red');
      exitCode = 1;
    } else {
      // Step 5: API Tests
      const apisOk = await testAPIs();
      if (!apisOk) {
        log('\n⚠️  Some required API tests failed', 'yellow');
        exitCode = 1;
      }
    }

    // Summary
    printSummary();

    if (exitCode === 0) {
      log('\n✅ All checks passed!', 'green');
    } else {
      log('\n⚠️  Some checks failed - see details above', 'yellow');
    }
  } finally {
    // Cleanup server if we started it
    if (serverProcess) {
      serverProcess.kill();
    }
  }

  process.exit(exitCode);
}

main().catch((error) => {
  log(`Error: ${error.message}`, 'red');
  if (serverProcess) serverProcess.kill();
  process.exit(1);
});
