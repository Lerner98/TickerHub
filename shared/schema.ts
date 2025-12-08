import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export interface Block {
  number: number;
  hash: string;
  timestamp: number;
  transactionCount: number;
  miner?: string;
  validator?: string;
  size: number;
  gasUsed?: number;
  gasLimit?: number;
  difficulty?: string;
  reward: string;
  parentHash: string;
  chain: 'bitcoin' | 'ethereum';
}

export interface Transaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  fee: string;
  gasPrice?: string;
  gasUsed?: number;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  input?: string;
  chain: 'bitcoin' | 'ethereum';
}

export interface Address {
  address: string;
  balance: string;
  transactionCount: number;
  tokens?: Token[];
  firstSeen?: number;
  lastActivity?: number;
  chain: 'bitcoin' | 'ethereum';
}

export interface Token {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  contractAddress: string;
}

export interface PriceData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  sparkline?: number[];
}

export interface NetworkStats {
  chain: 'bitcoin' | 'ethereum';
  blockHeight: number;
  tps: number;
  averageBlockTime: number;
  hashRate?: string;
  gasPrice?: GasPrice;
  activeValidators?: number;
}

export interface GasPrice {
  low: number;
  average: number;
  high: number;
  unit: 'gwei' | 'satoshi';
}

export interface ChartDataPoint {
  timestamp: number;
  price: number;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  marketCapRank: number;
  priceChange24h?: number;
}

export type ChainType = 'bitcoin' | 'ethereum';
export type TimeRange = '1D' | '7D' | '30D' | '90D' | '1Y';
export type SearchType = 'block' | 'transaction' | 'address' | 'unknown';

// =============================================================================
// UNIFIED ASSET SYSTEM (ADR-007)
// =============================================================================

/**
 * Asset type discriminator
 * Enables unified search, watchlist, and alerts across crypto and stocks
 */
export type AssetType = 'crypto' | 'stock';

/**
 * Base asset interface - shared fields across all asset types
 */
export interface BaseAsset {
  id: string;              // Unique identifier (e.g., 'bitcoin', 'AAPL')
  type: AssetType;         // Discriminator
  symbol: string;          // Trading symbol (e.g., 'BTC', 'AAPL')
  name: string;            // Full name (e.g., 'Bitcoin', 'Apple Inc.')
  price: number;           // Current price in USD
  change24h: number;       // Absolute price change (24h)
  changePercent24h: number; // Percentage change (24h)
  volume24h: number;       // 24h trading volume
  high24h: number;         // 24h high
  low24h: number;          // 24h low
  lastUpdated: number;     // Unix timestamp of last update
}

/**
 * Crypto-specific asset fields
 */
export interface CryptoAsset extends BaseAsset {
  type: 'crypto';
  image: string;           // Logo URL
  marketCap: number;       // Market capitalization
  marketCapRank?: number;  // Rank by market cap
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
  ath?: number;            // All-time high
  athDate?: string;        // ATH date
  atl?: number;            // All-time low
  atlDate?: string;        // ATL date
  sparkline?: number[];    // 7-day price sparkline
}

/**
 * Stock-specific asset fields
 */
export interface StockAsset extends BaseAsset {
  type: 'stock';
  exchange: string;        // Exchange (e.g., 'NASDAQ', 'NYSE')
  currency: string;        // Trading currency (e.g., 'USD')
  marketCap?: number;      // Market capitalization
  peRatio?: number;        // Price-to-earnings ratio
  eps?: number;            // Earnings per share
  dividend?: number;       // Dividend yield (%)
  sector?: string;         // Business sector
  industry?: string;       // Industry classification
  country?: string;        // Country of incorporation
  marketState?: 'pre' | 'open' | 'post' | 'closed'; // Market session
  previousClose?: number;  // Previous day close price
  open?: number;           // Today's open price
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

/**
 * Unified Asset type - discriminated union
 * Use type narrowing: if (asset.type === 'stock') { ... }
 */
export type Asset = CryptoAsset | StockAsset;

/**
 * Type guard for crypto assets
 */
export function isCryptoAsset(asset: Asset): asset is CryptoAsset {
  return asset.type === 'crypto';
}

/**
 * Type guard for stock assets
 */
export function isStockAsset(asset: Asset): asset is StockAsset {
  return asset.type === 'stock';
}

/**
 * Stock quote response from Finnhub API (mapped to StockAsset)
 */
export interface FinnhubQuote {
  c: number;   // Current price
  d: number;   // Change
  dp: number;  // Percent change
  h: number;   // High of the day
  l: number;   // Low of the day
  o: number;   // Open price
  pc: number;  // Previous close
  t: number;   // Timestamp
}

/**
 * Stock profile response from Finnhub API
 */
export interface FinnhubProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

/**
 * Search result for unified asset search
 */
export interface AssetSearchResult {
  id: string;
  type: AssetType;
  symbol: string;
  name: string;
  exchange?: string;  // For stocks
}
