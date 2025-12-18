#!/usr/bin/env tsx
/**
 * Cleanup Script
 *
 * Kills zombie Node.js processes and cleans up ports.
 * Run this before starting the dev server to avoid port conflicts.
 *
 * Usage:
 *   npm run cleanup
 *   npx tsx scripts/cleanup.ts
 *
 * @module scripts/cleanup
 */

import { execSync } from 'child_process';
import { log, logSection, colors } from './dev-utils';

const PORT = 5000;

function killNodeProcesses(): number {
  try {
    if (process.platform === 'win32') {
      // Get count of node processes first
      const countResult = execSync(
        'powershell -Command "(Get-Process node -ErrorAction SilentlyContinue).Count"',
        { encoding: 'utf8', stdio: 'pipe' }
      ).trim();
      const count = parseInt(countResult) || 0;

      if (count > 0) {
        execSync('powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"', {
          stdio: 'pipe',
        });
      }
      return count;
    } else {
      // Unix-like systems
      const result = execSync('pgrep -c node || echo 0', { encoding: 'utf8' });
      const count = parseInt(result.trim()) || 0;
      if (count > 0) {
        execSync('pkill -f node || true', { stdio: 'pipe' });
      }
      return count;
    }
  } catch {
    return 0;
  }
}

function isPortInUse(port: number): boolean {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: 'pipe' });
      return result.trim().length > 0;
    } else {
      execSync(`lsof -i:${port}`, { stdio: 'pipe' });
      return true;
    }
  } catch {
    return false;
  }
}

function killProcessOnPort(port: number): boolean {
  try {
    if (process.platform === 'win32') {
      // Find PID using the port
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: 'pipe' });
      const lines = result.trim().split('\n');
      const pids = new Set<string>();

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          pids.add(pid);
        }
      }

      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
        } catch {
          // Process may have already exited
        }
      }
      return pids.size > 0;
    } else {
      execSync(`kill $(lsof -t -i:${port}) 2>/dev/null || true`, { stdio: 'pipe' });
      return true;
    }
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  logSection('TickerHub Cleanup');

  // Kill Node processes
  log('Killing Node.js processes...', 'blue');
  const killed = killNodeProcesses();
  if (killed > 0) {
    log(`  Killed ${killed} Node.js process(es)`, 'green');
  } else {
    log('  No Node.js processes found', 'gray');
  }

  // Wait a moment for processes to fully terminate
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Check port
  log(`\nChecking port ${PORT}...`, 'blue');
  if (isPortInUse(PORT)) {
    log(`  Port ${PORT} is in use, killing...`, 'yellow');
    killProcessOnPort(PORT);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (isPortInUse(PORT)) {
      log(`  ${colors.red}Could not free port ${PORT}${colors.reset}`);
    } else {
      log(`  Port ${PORT} is now free`, 'green');
    }
  } else {
    log(`  Port ${PORT} is free`, 'green');
  }

  log('\n✅ Cleanup complete!', 'green');
}

main().catch((error) => {
  log(`Error: ${error.message}`, 'red');
  process.exit(1);
});
