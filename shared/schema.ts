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
