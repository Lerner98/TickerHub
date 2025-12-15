/**
 * Stock List Generator
 *
 * Fetches comprehensive US stock list from Finnhub API
 * and generates a TypeScript dataset for client-side search.
 *
 * Run: npx ts-node scripts/generateStockList.ts
 *
 * Output: client/src/data/stocks.generated.ts
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const OUTPUT_PATH = join(__dirname, '../client/src/data/stocks.generated.ts');

interface FinnhubSymbol {
  symbol: string;
  description: string;
  type: string;
  displaySymbol: string;
  mic?: string;
  currency?: string;
}

interface StockEntry {
  symbol: string;
  name: string;
  exchange: 'NASDAQ' | 'NYSE' | 'AMEX';
}

async function fetchUSStocks(): Promise<FinnhubSymbol[]> {
  if (!FINNHUB_API_KEY) {
    console.error('ERROR: FINNHUB_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('Fetching US stock symbols from Finnhub...');

  const response = await fetch(
    `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${FINNHUB_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`);
  }

  const symbols: FinnhubSymbol[] = await response.json();
  console.log(`Received ${symbols.length} total symbols`);

  return symbols;
}

function filterAndCleanStocks(symbols: FinnhubSymbol[]): StockEntry[] {
  const stocks: StockEntry[] = [];
  const seenSymbols = new Set<string>();

  for (const s of symbols) {
    // Skip non-common stocks (ETFs, warrants, preferred, etc.)
    if (s.type !== 'Common Stock') continue;

    // Skip symbols with special characters (except .)
    if (/[^A-Z0-9.]/.test(s.symbol)) continue;

    // Skip duplicates
    if (seenSymbols.has(s.symbol)) continue;
    seenSymbols.add(s.symbol);

    // Skip very short descriptions (likely invalid)
    if (!s.description || s.description.length < 2) continue;

    // Determine exchange from MIC code
    let exchange: 'NASDAQ' | 'NYSE' | 'AMEX' = 'NYSE';
    if (s.mic === 'XNAS' || s.mic === 'XNGS' || s.mic === 'XNCM') {
      exchange = 'NASDAQ';
    } else if (s.mic === 'XASE') {
      exchange = 'AMEX';
    }

    stocks.push({
      symbol: s.symbol,
      name: cleanCompanyName(s.description),
      exchange,
    });
  }

  // Sort alphabetically by symbol
  stocks.sort((a, b) => a.symbol.localeCompare(b.symbol));

  console.log(`Filtered to ${stocks.length} common stocks`);
  return stocks;
}

function cleanCompanyName(name: string): string {
  return name
    .replace(/ - Common Stock$/i, '')
    .replace(/ Common Stock$/i, '')
    .replace(/ Class [A-Z]$/i, '')
    .replace(/ Inc\.?$/i, ' Inc')
    .replace(/ Corp\.?$/i, ' Corp')
    .replace(/ Ltd\.?$/i, ' Ltd')
    .replace(/ LLC$/i, ' LLC')
    .replace(/ PLC$/i, ' PLC')
    .replace(/ SA$/i, ' SA')
    .replace(/ NV$/i, ' NV')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateTypeScript(stocks: StockEntry[]): string {
  const timestamp = new Date().toISOString();

  return `/**
 * US Stock Symbols Dataset
 *
 * Auto-generated from Finnhub API on ${timestamp}
 * Contains ${stocks.length} common stocks from NYSE, NASDAQ, AMEX
 *
 * DO NOT EDIT MANUALLY - Run scripts/generateStockList.ts to regenerate
 */

export type Exchange = 'NASDAQ' | 'NYSE' | 'AMEX';

export interface StockSymbol {
  symbol: string;
  name: string;
  exchange: Exchange;
}

export const stocks: StockSymbol[] = [
${stocks.map((s) => `  { symbol: '${s.symbol}', name: '${escapeString(s.name)}', exchange: '${s.exchange}' },`).join('\n')}
];

export default stocks;
`;
}

function escapeString(str: string): string {
  return str.replace(/'/g, "\\'").replace(/\\/g, '\\\\');
}

async function main() {
  try {
    const symbols = await fetchUSStocks();
    const stocks = filterAndCleanStocks(symbols);

    const output = generateTypeScript(stocks);
    writeFileSync(OUTPUT_PATH, output, 'utf-8');

    console.log(`\nGenerated ${OUTPUT_PATH}`);
    console.log(`Total stocks: ${stocks.length}`);

    // Show breakdown
    const nasdaq = stocks.filter((s) => s.exchange === 'NASDAQ').length;
    const nyse = stocks.filter((s) => s.exchange === 'NYSE').length;
    const amex = stocks.filter((s) => s.exchange === 'AMEX').length;

    console.log(`\nBreakdown:`);
    console.log(`  NASDAQ: ${nasdaq}`);
    console.log(`  NYSE: ${nyse}`);
    console.log(`  AMEX: ${amex}`);
  } catch (error) {
    console.error('Failed to generate stock list:', error);
    process.exit(1);
  }
}

main();
