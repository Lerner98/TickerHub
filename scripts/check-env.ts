#!/usr/bin/env tsx
/**
 * Environment Check Script
 *
 * Validates all required and optional environment variables.
 * Shows which API providers are configured.
 *
 * Usage:
 *   npm run check:env
 *   npx tsx scripts/check-env.ts
 *
 * @module scripts/check-env
 */

import { config } from 'dotenv';
import { log, logSection, colors } from './dev-utils';

// Load env
config();

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  mask?: boolean;
}

const envVars: EnvVar[] = [
  // Database
  { name: 'DATABASE_URL', required: true, description: 'Neon PostgreSQL connection (pooled)', mask: true },
  { name: 'DATABASE_URL_UNPOOLED', required: false, description: 'Neon PostgreSQL (for migrations)', mask: true },

  // Auth
  { name: 'BETTER_AUTH_SECRET', required: true, description: 'Auth secret key', mask: true },
  { name: 'GOOGLE_CLIENT_ID', required: false, description: 'Google OAuth client ID', mask: true },
  { name: 'GOOGLE_CLIENT_SECRET', required: false, description: 'Google OAuth secret', mask: true },

  // Stock Data
  { name: 'TWELVE_DATA_API_KEY', required: false, description: 'Primary stock provider', mask: true },
  { name: 'FINNHUB_API_KEY', required: false, description: 'Fallback stock provider', mask: true },
  { name: 'FMP_API_KEY', required: false, description: 'Market movers, news, financials', mask: true },

  // AI
  { name: 'GEMINI_API_KEY', required: false, description: 'Google Gemini AI', mask: true },
  { name: 'GROQ_API_KEY', required: false, description: 'Groq AI fallback', mask: true },

  // Server
  { name: 'NODE_ENV', required: false, description: 'Environment mode' },
  { name: 'PORT', required: false, description: 'Server port (default: 5000)' },
];

function checkEnvVar(envVar: EnvVar): { configured: boolean; value?: string } {
  const value = process.env[envVar.name];
  if (!value || value.trim() === '') {
    return { configured: false };
  }
  return {
    configured: true,
    value: envVar.mask ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : value,
  };
}

function main(): void {
  logSection('TickerHub Environment Check');

  let requiredMissing = 0;
  let optionalMissing = 0;
  let configured = 0;

  // Group by category
  const categories: Record<string, EnvVar[]> = {
    Database: envVars.filter((e) => e.name.includes('DATABASE')),
    Authentication: envVars.filter((e) => e.name.includes('AUTH') || e.name.includes('GOOGLE')),
    'Stock Data': envVars.filter((e) => ['TWELVE_DATA_API_KEY', 'FINNHUB_API_KEY', 'FMP_API_KEY'].includes(e.name)),
    AI: envVars.filter((e) => e.name.includes('GEMINI') || e.name.includes('GROQ')),
    Server: envVars.filter((e) => ['NODE_ENV', 'PORT'].includes(e.name)),
  };

  for (const [category, vars] of Object.entries(categories)) {
    console.log(`\n${colors.cyan}${category}:${colors.reset}`);

    for (const envVar of vars) {
      const result = checkEnvVar(envVar);

      if (result.configured) {
        configured++;
        console.log(
          `  ${colors.green}✓${colors.reset} ${envVar.name} ${colors.gray}(${envVar.description})${colors.reset}`
        );
        if (result.value) {
          console.log(`    ${colors.gray}Value: ${result.value}${colors.reset}`);
        }
      } else if (envVar.required) {
        requiredMissing++;
        console.log(
          `  ${colors.red}✗${colors.reset} ${envVar.name} ${colors.red}[REQUIRED]${colors.reset} ${colors.gray}(${envVar.description})${colors.reset}`
        );
      } else {
        optionalMissing++;
        console.log(
          `  ${colors.yellow}○${colors.reset} ${envVar.name} ${colors.gray}(${envVar.description})${colors.reset}`
        );
      }
    }
  }

  // Summary
  logSection('Summary');
  console.log(`  ${colors.green}Configured:${colors.reset}       ${configured}`);
  console.log(`  ${colors.yellow}Optional Missing:${colors.reset} ${optionalMissing}`);
  console.log(`  ${colors.red}Required Missing:${colors.reset} ${requiredMissing}`);

  // Provider status
  console.log(`\n${colors.cyan}Provider Status:${colors.reset}`);
  const hasStocks = process.env.TWELVE_DATA_API_KEY || process.env.FINNHUB_API_KEY;
  const hasFMP = !!process.env.FMP_API_KEY;
  const hasAI = !!process.env.GEMINI_API_KEY;
  const hasAuth = !!process.env.GOOGLE_CLIENT_ID;

  console.log(`  Stock Data:    ${hasStocks ? `${colors.green}✓ Ready${colors.reset}` : `${colors.yellow}○ Limited (local data only)${colors.reset}`}`);
  console.log(`  Market Movers: ${hasFMP ? `${colors.green}✓ Ready${colors.reset}` : `${colors.yellow}○ Disabled${colors.reset}`}`);
  console.log(`  AI Features:   ${hasAI ? `${colors.green}✓ Ready${colors.reset}` : `${colors.yellow}○ Disabled${colors.reset}`}`);
  console.log(`  Google OAuth:  ${hasAuth ? `${colors.green}✓ Ready${colors.reset}` : `${colors.yellow}○ Disabled${colors.reset}`}`);

  if (requiredMissing > 0) {
    log('\n❌ Missing required environment variables!', 'red');
    log('Copy .env.example to .env and fill in the required values.', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ Environment configuration valid!', 'green');
  }
}

main();
