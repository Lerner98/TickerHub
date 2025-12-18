#!/usr/bin/env tsx
/**
 * Dev Start Script
 *
 * Clean start for development:
 * 1. Kills any zombie processes
 * 2. Waits for port to be free
 * 3. Starts the dev server
 * 4. Waits for server to be ready
 * 5. Reports provider status
 *
 * Usage:
 *   npm run dev:start
 *   npx tsx scripts/dev-start.ts
 *
 * @module scripts/dev-start
 */

import { spawn, execSync } from 'child_process';
import { log, logSection, colors, waitForServer, testEndpoint } from './dev-utils';

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

function killNodeProcesses(): void {
  try {
    if (process.platform === 'win32') {
      execSync('powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"', {
        stdio: 'pipe',
      });
    } else {
      execSync('pkill -f node || true', { stdio: 'pipe' });
    }
  } catch {
    // Ignore errors
  }
}

async function checkProviders(): Promise<void> {
  log('\nChecking API providers...', 'blue');

  // Check AI status
  const aiStatus = await testEndpoint(`${BASE_URL}/api/ai/status`);
  if (aiStatus.success && aiStatus.data) {
    const data = aiStatus.data as { configured: boolean; available: boolean; requestsRemaining: number };
    if (data.configured) {
      log(`  ${colors.green}✓${colors.reset} Gemini AI: ${data.requestsRemaining} requests remaining`, 'reset');
    } else {
      log(`  ${colors.yellow}○${colors.reset} Gemini AI: Not configured (set GEMINI_API_KEY)`, 'reset');
    }
  }

  // Check stock provider status
  const stockStatus = await testEndpoint(`${BASE_URL}/api/stocks/status`);
  if (stockStatus.success && stockStatus.data) {
    const data = stockStatus.data as { provider: string; twelveDataConfigured: boolean; finnhubConfigured: boolean };
    log(`  ${colors.green}✓${colors.reset} Stock Provider: ${data.provider}`, 'reset');
    if (data.twelveDataConfigured) {
      log(`  ${colors.green}✓${colors.reset} Twelve Data: Configured`, 'reset');
    }
    if (data.finnhubConfigured) {
      log(`  ${colors.green}✓${colors.reset} Finnhub: Configured`, 'reset');
    }
  }

  // Check a sample stock endpoint
  const stockTest = await testEndpoint(`${BASE_URL}/api/stocks/AAPL`);
  if (stockTest.success) {
    log(`  ${colors.green}✓${colors.reset} Stock Data: Working (${stockTest.latency}ms)`, 'reset');
  } else {
    log(`  ${colors.red}✗${colors.reset} Stock Data: Error (${stockTest.status || stockTest.error})`, 'reset');
  }

  // Check crypto
  const cryptoTest = await testEndpoint(`${BASE_URL}/api/prices`);
  if (cryptoTest.success) {
    log(`  ${colors.green}✓${colors.reset} Crypto Data: Working (${cryptoTest.latency}ms)`, 'reset');
  } else {
    log(`  ${colors.yellow}○${colors.reset} Crypto Data: ${cryptoTest.status || cryptoTest.error}`, 'reset');
  }
}

async function main(): Promise<void> {
  logSection('TickerHub Dev Start');

  // Step 1: Kill existing processes
  log('Stopping existing processes...', 'blue');
  killNodeProcesses();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  log('  Done', 'green');

  // Step 2: Start dev server
  log('\nStarting dev server...', 'blue');

  const isWindows = process.platform === 'win32';
  const child = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: true,
  });

  // Step 3: Wait for server
  log('Waiting for server to be ready...', 'blue');
  const ready = await waitForServer(`${BASE_URL}/api/health`, 30, 1000);

  if (!ready) {
    log('\n❌ Server failed to start within 30 seconds', 'red');
    child.kill();
    process.exit(1);
  }

  log(`\n${colors.green}✅ Server ready at ${BASE_URL}${colors.reset}`);

  // Step 4: Check providers
  await checkProviders();

  log(`\n${colors.cyan}Press Ctrl+C to stop the server${colors.reset}\n`);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\nShutting down...', 'yellow');
    child.kill();
    process.exit(0);
  });
}

main().catch((error) => {
  log(`Error: ${error.message}`, 'red');
  process.exit(1);
});
