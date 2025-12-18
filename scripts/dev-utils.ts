/**
 * Development Utilities
 *
 * Common utilities for dev scripts:
 * - Process cleanup
 * - Server health checks
 * - API endpoint testing
 *
 * @module scripts/dev-utils
 */

import { execSync, spawn, type ChildProcess } from 'child_process';

// Colors for console output
export const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

export function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

export function logSection(title: string): void {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

export function logResult(name: string, success: boolean, details?: string): void {
  const status = success ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`  ${status} ${name}${details ? ` ${colors.gray}(${details})${colors.reset}` : ''}`);
}

/**
 * Kill all Node.js processes (Windows-specific)
 */
export function killNodeProcesses(): boolean {
  try {
    if (process.platform === 'win32') {
      execSync('powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"', {
        stdio: 'pipe',
      });
    } else {
      execSync('pkill -f node || true', { stdio: 'pipe' });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a port is in use
 */
export function isPortInUse(port: number): boolean {
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

/**
 * Wait for server to be ready
 */
export async function waitForServer(
  url: string,
  maxAttempts: number = 30,
  delayMs: number = 1000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

/**
 * Make an API request and return result
 */
export async function testEndpoint(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; status?: number; data?: unknown; error?: string; latency: number }> {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    const latency = Date.now() - start;
    const data = await response.json().catch(() => null);
    return {
      success: response.ok,
      status: response.status,
      data,
      latency,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - start,
    };
  }
}

/**
 * Start the dev server in background
 */
export function startDevServer(cwd: string): ChildProcess {
  const isWindows = process.platform === 'win32';
  const child = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: !isWindows,
  });

  return child;
}
