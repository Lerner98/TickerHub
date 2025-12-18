/**
 * FMP Service - Financial Modeling Prep Integration
 *
 * Provides real market movers (gainers/losers/actives), company profiles, and news.
 * Free tier: 250 calls/day - cache aggressively (5 min TTL for movers, 15 min for profiles)
 *
 * @module server/api/stocks/fmpService
 */

import { fetchWithTimeout } from '../../lib/apiClient';
import { cache } from '../../lib/cache';
import { log, logError } from '../../lib/logger';

const FMP_API_KEY = process.env.FMP_API_KEY || '';
// FMP migrated from /api/v3 to /stable endpoints in August 2025
const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';
const FMP_LEGACY_URL = 'https://financialmodelingprep.com/api'; // For endpoints not yet migrated
const hasFMP = FMP_API_KEY.length > 0;

// Cache TTLs in milliseconds
const MOVERS_CACHE_TTL = 5 * 60 * 1000;    // 5 minutes for movers
const PROFILE_CACHE_TTL = 15 * 60 * 1000;  // 15 minutes for profiles
const NEWS_CACHE_TTL = 10 * 60 * 1000;     // 10 minutes for news
const ANALYST_CACHE_TTL = 30 * 60 * 1000;  // 30 minutes for analyst data
const CALENDAR_CACHE_TTL = 15 * 60 * 1000; // 15 minutes for calendars
const FINANCIALS_CACHE_TTL = 60 * 60 * 1000; // 1 hour for financial statements
const SECTOR_CACHE_TTL = 10 * 60 * 1000;   // 10 minutes for sector data

// ============================================================================
// Types
// ============================================================================

export interface FMPMover {
  symbol: string;
  name: string;
  change: number;
  price: number;
  changesPercentage: number;
}

export interface FMPCompanyProfile {
  symbol: string;
  companyName: string;
  currency: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  sector: string;
  country: string;
  description: string;
  ceo: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  image: string;
  ipoDate: string;
  mktCap: number;           // Legacy field (v3 API)
  marketCap: number;        // New stable API field
  price: number;
  beta: number;
  volAvg: number;           // Legacy field (v3 API)
  averageVolume: number;    // New stable API field
  volume: number;           // Current day volume
  lastDiv: number;
  range: string;
  changes: number;
  dcf: number;
  dcfDiff: number;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isFund: boolean;
  isAdr: boolean;
}

export interface FMPNewsArticle {
  symbol: string;
  publishedDate: string;
  title: string;
  image: string;
  site: string;
  text: string;
  url: string;
}

// ============================================================================
// Phase 4D Types - Analyst Intelligence
// ============================================================================

export interface FMPAnalystEstimate {
  symbol: string;
  date: string;
  estimatedRevenueLow: number;
  estimatedRevenueHigh: number;
  estimatedRevenueAvg: number;
  estimatedEbitdaLow: number;
  estimatedEbitdaHigh: number;
  estimatedEbitdaAvg: number;
  estimatedEpsLow: number;
  estimatedEpsHigh: number;
  estimatedEpsAvg: number;
  estimatedNetIncomeLow: number;
  estimatedNetIncomeHigh: number;
  estimatedNetIncomeAvg: number;
  numberAnalystEstimatedRevenue: number;
  numberAnalystsEstimatedEps: number;
}

export interface FMPPriceTarget {
  symbol: string;
  publishedDate: string;
  newsURL: string;
  newsTitle: string;
  analystName: string;
  priceTarget: number;
  adjPriceTarget: number;
  priceWhenPosted: number;
  newsPublisher: string;
  newsBaseURL: string;
  analystCompany: string;
}

export interface FMPPriceTargetConsensus {
  symbol: string;
  targetHigh: number;
  targetLow: number;
  targetConsensus: number;
  targetMedian: number;
}

export interface FMPStockGrade {
  symbol: string;
  date: string;
  gradingCompany: string;
  previousGrade: string;
  newGrade: string;
}

export interface FMPGradeConsensus {
  symbol: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: string;
}

// ============================================================================
// Phase 4D Types - Earnings & Calendar Events
// ============================================================================

export interface FMPEarningsCalendarItem {
  date: string;
  symbol: string;
  eps: number | null;
  epsEstimated: number | null;
  time: string;
  revenue: number | null;
  revenueEstimated: number | null;
  updatedFromDate: string;
  fiscalDateEnding: string;
}

export interface FMPDividendCalendarItem {
  date: string;
  label: string;
  adjDividend: number;
  symbol: string;
  dividend: number;
  recordDate: string;
  paymentDate: string;
  declarationDate: string;
}

export interface FMPIPOCalendarItem {
  date: string;
  company: string;
  symbol: string;
  exchange: string;
  actions: string;
  shares: number | null;
  priceRange: string;
  marketCap: number | null;
}

export interface FMPStockSplit {
  date: string;
  label: string;
  symbol: string;
  numerator: number;
  denominator: number;
}

// ============================================================================
// Phase 4D Types - Sector Performance
// ============================================================================

export interface FMPSectorPerformance {
  sector: string;
  changesPercentage: string;
}

// ============================================================================
// Phase 4D Types - Financial Statements
// ============================================================================

export interface FMPIncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  operatingExpenses: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  ebitda: number;
  ebitdaratio: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
}

export interface FMPBalanceSheet {
  date: string;
  symbol: string;
  reportedCurrency: string;
  totalAssets: number;
  totalCurrentAssets: number;
  cashAndCashEquivalents: number;
  totalLiabilities: number;
  totalCurrentLiabilities: number;
  totalDebt: number;
  netDebt: number;
  totalEquity: number;
  totalStockholdersEquity: number;
  retainedEarnings: number;
}

export interface FMPCashFlow {
  date: string;
  symbol: string;
  reportedCurrency: string;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  dividendsPaid: number;
  netCashUsedForInvestingActivites: number;
  netCashUsedProvidedByFinancingActivities: number;
  netChangeInCash: number;
}

export interface FMPKeyMetrics {
  symbol: string;
  date: string;
  period: string;
  revenuePerShare: number;
  netIncomePerShare: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  cashPerShare: number;
  bookValuePerShare: number;
  peRatio: number;
  priceToSalesRatio: number;
  pbRatio: number;
  evToEbitda: number;
  evToSales: number;
  debtToEquity: number;
  debtToAssets: number;
  currentRatio: number;
  roe: number;
  roa: number;
  roic: number;
  dividendYield: number;
  payoutRatio: number;
}

// ============================================================================
// Phase 4D Types - Institutional Tracking
// ============================================================================

export interface FMPInstitutionalHolder {
  holder: string;
  shares: number;
  dateReported: string;
  change: number;
  changePercentage: number;
}

// ============================================================================
// Market Movers
// ============================================================================

/**
 * Get top gainers from entire market
 */
export async function getTopGainers(): Promise<FMPMover[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping gainers fetch', 'fmp', 'debug');
    return null;
  }

  const cacheKey = 'fmp:gainers';
  const cached = cache.get<FMPMover[]>(cacheKey, MOVERS_CACHE_TTL);
  if (cached) {
    log('FMP gainers from cache', 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/biggest-gainers
    const url = `${FMP_BASE_URL}/biggest-gainers?apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP gainers error: ${response.status}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPMover[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP gainers fetched: ${data.length} stocks`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, 'FMP gainers fetch failed');
    return null;
  }
}

/**
 * Get top losers from entire market
 */
export async function getTopLosers(): Promise<FMPMover[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping losers fetch', 'fmp', 'debug');
    return null;
  }

  const cacheKey = 'fmp:losers';
  const cached = cache.get<FMPMover[]>(cacheKey, MOVERS_CACHE_TTL);
  if (cached) {
    log('FMP losers from cache', 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/biggest-losers
    const url = `${FMP_BASE_URL}/biggest-losers?apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP losers error: ${response.status}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPMover[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP losers fetched: ${data.length} stocks`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, 'FMP losers fetch failed');
    return null;
  }
}

/**
 * Get most active stocks by volume
 */
export async function getMostActive(): Promise<FMPMover[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping actives fetch', 'fmp', 'debug');
    return null;
  }

  const cacheKey = 'fmp:actives';
  const cached = cache.get<FMPMover[]>(cacheKey, MOVERS_CACHE_TTL);
  if (cached) {
    log('FMP actives from cache', 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/most-actives
    const url = `${FMP_BASE_URL}/most-actives?apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP actives error: ${response.status}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPMover[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP actives fetched: ${data.length} stocks`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, 'FMP actives fetch failed');
    return null;
  }
}

// ============================================================================
// Company Profile
// ============================================================================

/**
 * Get detailed company profile
 */
export async function getCompanyProfile(symbol: string): Promise<FMPCompanyProfile | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping profile fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:profile:${upperSymbol}`;
  const cached = cache.get<FMPCompanyProfile>(cacheKey, PROFILE_CACHE_TTL);
  if (cached) {
    log(`FMP profile from cache: ${upperSymbol}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/profile?symbol=SYMBOL
    const url = `${FMP_BASE_URL}/profile?symbol=${upperSymbol}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP profile error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPCompanyProfile[] = await response.json();

    if (!data || data.length === 0) {
      log(`FMP profile not found: ${upperSymbol}`, 'fmp', 'debug');
      return null;
    }

    const profile = data[0];
    cache.set(cacheKey, profile);
    log(`FMP profile fetched: ${upperSymbol}`, 'fmp', 'info');
    // Debug: Log the actual fields returned for volume and marketCap analysis
    log(`FMP profile ${upperSymbol} - vol keys: ${Object.keys(profile).filter(k => k.toLowerCase().includes('vol')).join(', ')}, cap keys: ${Object.keys(profile).filter(k => k.toLowerCase().includes('cap') || k.toLowerCase().includes('mkt')).join(', ')}`, 'fmp', 'debug');
    return profile;
  } catch (error) {
    logError(error as Error, `FMP profile fetch failed: ${upperSymbol}`);
    return null;
  }
}

// ============================================================================
// Stock News
// ============================================================================

/**
 * Get latest news for a stock
 */
export async function getStockNews(symbol: string, limit: number = 10): Promise<FMPNewsArticle[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping news fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:news:${upperSymbol}`;
  const cached = cache.get<FMPNewsArticle[]>(cacheKey, NEWS_CACHE_TTL);
  if (cached) {
    log(`FMP news from cache: ${upperSymbol}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/stock-news?symbol=SYMBOL
    const url = `${FMP_BASE_URL}/stock-news?symbol=${upperSymbol}&limit=${limit}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP news error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPNewsArticle[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP news fetched: ${data.length} articles for ${upperSymbol}`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, `FMP news fetch failed: ${upperSymbol}`);
    return null;
  }
}

// ============================================================================
// Status Check
// ============================================================================

/**
 * Check if FMP is configured
 */
export function isFMPConfigured(): boolean {
  return hasFMP;
}

/**
 * Get FMP service status
 */
export function getFMPStatus(): { configured: boolean; baseUrl: string } {
  return {
    configured: hasFMP,
    baseUrl: FMP_BASE_URL,
  };
}

// ============================================================================
// Phase 4D: Analyst Intelligence
// ============================================================================

/**
 * Get analyst estimates for a stock (revenue, EPS projections)
 */
export async function getAnalystEstimates(symbol: string, limit: number = 4): Promise<FMPAnalystEstimate[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping estimates fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:estimates:${upperSymbol}`;
  const cached = cache.get<FMPAnalystEstimate[]>(cacheKey, ANALYST_CACHE_TTL);
  if (cached) {
    log(`FMP estimates from cache: ${upperSymbol}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/analyst-estimates?symbol=SYMBOL
    const url = `${FMP_BASE_URL}/analyst-estimates?symbol=${upperSymbol}&limit=${limit}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP estimates error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPAnalystEstimate[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP estimates fetched: ${data.length} periods for ${upperSymbol}`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, `FMP estimates fetch failed: ${upperSymbol}`);
    return null;
  }
}

/**
 * Get price target consensus for a stock
 */
export async function getPriceTargetConsensus(symbol: string): Promise<FMPPriceTargetConsensus | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping price target fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:pricetarget:${upperSymbol}`;
  const cached = cache.get<FMPPriceTargetConsensus>(cacheKey, ANALYST_CACHE_TTL);
  if (cached) {
    log(`FMP price target from cache: ${upperSymbol}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/price-target-consensus?symbol=SYMBOL
    const url = `${FMP_BASE_URL}/price-target-consensus?symbol=${upperSymbol}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP price target error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPPriceTargetConsensus[] = await response.json();
    if (!data || data.length === 0) {
      return null;
    }

    cache.set(cacheKey, data[0]);
    log(`FMP price target fetched for ${upperSymbol}`, 'fmp', 'info');
    return data[0];
  } catch (error) {
    logError(error as Error, `FMP price target fetch failed: ${upperSymbol}`);
    return null;
  }
}

/**
 * Get recent price targets from analysts
 */
export async function getPriceTargets(symbol: string, limit: number = 10): Promise<FMPPriceTarget[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping price targets fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:pricetargets:${upperSymbol}`;
  const cached = cache.get<FMPPriceTarget[]>(cacheKey, ANALYST_CACHE_TTL);
  if (cached) {
    log(`FMP price targets from cache: ${upperSymbol}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/price-target?symbol=SYMBOL
    const url = `${FMP_BASE_URL}/price-target?symbol=${upperSymbol}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP price targets error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPPriceTarget[] = await response.json();
    const limited = data.slice(0, limit);
    cache.set(cacheKey, limited);
    log(`FMP price targets fetched: ${limited.length} for ${upperSymbol}`, 'fmp', 'info');
    return limited;
  } catch (error) {
    logError(error as Error, `FMP price targets fetch failed: ${upperSymbol}`);
    return null;
  }
}

/**
 * Get upgrade/downgrade history for a stock
 */
export async function getStockGrades(symbol: string, limit: number = 20): Promise<FMPStockGrade[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping grades fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:grades:${upperSymbol}`;
  const cached = cache.get<FMPStockGrade[]>(cacheKey, ANALYST_CACHE_TTL);
  if (cached) {
    log(`FMP grades from cache: ${upperSymbol}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/grade?symbol=SYMBOL
    const url = `${FMP_BASE_URL}/grade?symbol=${upperSymbol}&limit=${limit}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP grades error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPStockGrade[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP grades fetched: ${data.length} for ${upperSymbol}`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, `FMP grades fetch failed: ${upperSymbol}`);
    return null;
  }
}

/**
 * Get consensus grades (buy/hold/sell distribution)
 */
export async function getGradeConsensus(symbol: string): Promise<FMPGradeConsensus | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping consensus fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:consensus:${upperSymbol}`;
  const cached = cache.get<FMPGradeConsensus>(cacheKey, ANALYST_CACHE_TTL);
  if (cached) {
    log(`FMP consensus from cache: ${upperSymbol}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/upgrades-downgrades-consensus?symbol=SYMBOL
    const url = `${FMP_BASE_URL}/upgrades-downgrades-consensus?symbol=${upperSymbol}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP consensus error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPGradeConsensus[] = await response.json();
    if (!data || data.length === 0) {
      return null;
    }

    cache.set(cacheKey, data[0]);
    log(`FMP consensus fetched for ${upperSymbol}`, 'fmp', 'info');
    return data[0];
  } catch (error) {
    logError(error as Error, `FMP consensus fetch failed: ${upperSymbol}`);
    return null;
  }
}

// ============================================================================
// Phase 4D: Earnings & Calendar Events
// ============================================================================

/**
 * Get upcoming earnings calendar (next 30 days by default)
 */
export async function getEarningsCalendar(from?: string, to?: string): Promise<FMPEarningsCalendarItem[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping earnings calendar fetch', 'fmp', 'debug');
    return null;
  }

  // Default: next 30 days
  const today = new Date();
  const fromDate = from || today.toISOString().split('T')[0];
  const toDate = to || new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const cacheKey = `fmp:earnings:${fromDate}:${toDate}`;
  const cached = cache.get<FMPEarningsCalendarItem[]>(cacheKey, CALENDAR_CACHE_TTL);
  if (cached) {
    log('FMP earnings calendar from cache', 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/earning-calendar?from=DATE&to=DATE
    const url = `${FMP_BASE_URL}/earning-calendar?from=${fromDate}&to=${toDate}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP earnings calendar error: ${response.status}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPEarningsCalendarItem[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP earnings calendar fetched: ${data.length} events`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, 'FMP earnings calendar fetch failed');
    return null;
  }
}

/**
 * Get historical earnings for a specific stock
 */
export async function getStockEarnings(symbol: string, limit: number = 8): Promise<FMPEarningsCalendarItem[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping stock earnings fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:stockearnings:${upperSymbol}`;
  const cached = cache.get<FMPEarningsCalendarItem[]>(cacheKey, CALENDAR_CACHE_TTL);
  if (cached) {
    log(`FMP stock earnings from cache: ${upperSymbol}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/historical-earning-calendar?symbol=SYMBOL
    const url = `${FMP_BASE_URL}/historical-earning-calendar?symbol=${upperSymbol}&limit=${limit}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP stock earnings error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPEarningsCalendarItem[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP stock earnings fetched: ${data.length} for ${upperSymbol}`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, `FMP stock earnings fetch failed: ${upperSymbol}`);
    return null;
  }
}

/**
 * Get upcoming dividend calendar
 */
export async function getDividendCalendar(from?: string, to?: string): Promise<FMPDividendCalendarItem[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping dividend calendar fetch', 'fmp', 'debug');
    return null;
  }

  const today = new Date();
  const fromDate = from || today.toISOString().split('T')[0];
  const toDate = to || new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const cacheKey = `fmp:dividends:${fromDate}:${toDate}`;
  const cached = cache.get<FMPDividendCalendarItem[]>(cacheKey, CALENDAR_CACHE_TTL);
  if (cached) {
    log('FMP dividend calendar from cache', 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/dividend-calendar?from=DATE&to=DATE
    const url = `${FMP_BASE_URL}/dividend-calendar?from=${fromDate}&to=${toDate}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP dividend calendar error: ${response.status}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPDividendCalendarItem[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP dividend calendar fetched: ${data.length} events`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, 'FMP dividend calendar fetch failed');
    return null;
  }
}

/**
 * Get upcoming IPO calendar
 */
export async function getIPOCalendar(from?: string, to?: string): Promise<FMPIPOCalendarItem[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping IPO calendar fetch', 'fmp', 'debug');
    return null;
  }

  const today = new Date();
  const fromDate = from || today.toISOString().split('T')[0];
  const toDate = to || new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const cacheKey = `fmp:ipos:${fromDate}:${toDate}`;
  const cached = cache.get<FMPIPOCalendarItem[]>(cacheKey, CALENDAR_CACHE_TTL);
  if (cached) {
    log('FMP IPO calendar from cache', 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/ipo-calendar?from=DATE&to=DATE
    const url = `${FMP_BASE_URL}/ipo-calendar?from=${fromDate}&to=${toDate}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP IPO calendar error: ${response.status}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPIPOCalendarItem[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP IPO calendar fetched: ${data.length} events`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, 'FMP IPO calendar fetch failed');
    return null;
  }
}

/**
 * Get upcoming stock splits
 */
export async function getStockSplitsCalendar(from?: string, to?: string): Promise<FMPStockSplit[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping splits calendar fetch', 'fmp', 'debug');
    return null;
  }

  const today = new Date();
  const fromDate = from || today.toISOString().split('T')[0];
  const toDate = to || new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const cacheKey = `fmp:splits:${fromDate}:${toDate}`;
  const cached = cache.get<FMPStockSplit[]>(cacheKey, CALENDAR_CACHE_TTL);
  if (cached) {
    log('FMP splits calendar from cache', 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/stock-split-calendar?from=DATE&to=DATE
    const url = `${FMP_BASE_URL}/stock-split-calendar?from=${fromDate}&to=${toDate}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP splits calendar error: ${response.status}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPStockSplit[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP splits calendar fetched: ${data.length} events`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, 'FMP splits calendar fetch failed');
    return null;
  }
}

// ============================================================================
// Phase 4D: Sector Performance
// ============================================================================

/**
 * Get sector performance (for heatmap)
 */
export async function getSectorPerformance(): Promise<FMPSectorPerformance[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping sector performance fetch', 'fmp', 'debug');
    return null;
  }

  const cacheKey = 'fmp:sectors';
  const cached = cache.get<FMPSectorPerformance[]>(cacheKey, SECTOR_CACHE_TTL);
  if (cached) {
    log('FMP sector performance from cache', 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/sector-performance
    const url = `${FMP_BASE_URL}/sector-performance?apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP sector performance error: ${response.status}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPSectorPerformance[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP sector performance fetched: ${data.length} sectors`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, 'FMP sector performance fetch failed');
    return null;
  }
}

// ============================================================================
// Phase 4D: Financial Statements
// ============================================================================

/**
 * Get income statement for a stock
 */
export async function getIncomeStatement(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 4): Promise<FMPIncomeStatement[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping income statement fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:income:${upperSymbol}:${period}`;
  const cached = cache.get<FMPIncomeStatement[]>(cacheKey, FINANCIALS_CACHE_TTL);
  if (cached) {
    log(`FMP income statement from cache: ${upperSymbol}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/income-statement?symbol=SYMBOL
    const url = `${FMP_BASE_URL}/income-statement?symbol=${upperSymbol}&period=${period}&limit=${limit}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP income statement error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPIncomeStatement[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP income statement fetched: ${data.length} periods for ${upperSymbol}`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, `FMP income statement fetch failed: ${upperSymbol}`);
    return null;
  }
}

/**
 * Get balance sheet for a stock
 */
export async function getBalanceSheet(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 4): Promise<FMPBalanceSheet[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping balance sheet fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:balance:${upperSymbol}:${period}`;
  const cached = cache.get<FMPBalanceSheet[]>(cacheKey, FINANCIALS_CACHE_TTL);
  if (cached) {
    log(`FMP balance sheet from cache: ${upperSymbol}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/balance-sheet-statement?symbol=SYMBOL
    const url = `${FMP_BASE_URL}/balance-sheet-statement?symbol=${upperSymbol}&period=${period}&limit=${limit}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP balance sheet error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPBalanceSheet[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP balance sheet fetched: ${data.length} periods for ${upperSymbol}`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, `FMP balance sheet fetch failed: ${upperSymbol}`);
    return null;
  }
}

/**
 * Get cash flow statement for a stock
 */
export async function getCashFlow(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 4): Promise<FMPCashFlow[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping cash flow fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:cashflow:${upperSymbol}:${period}`;
  const cached = cache.get<FMPCashFlow[]>(cacheKey, FINANCIALS_CACHE_TTL);
  if (cached) {
    log(`FMP cash flow from cache: ${upperSymbol}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/cash-flow-statement?symbol=SYMBOL
    const url = `${FMP_BASE_URL}/cash-flow-statement?symbol=${upperSymbol}&period=${period}&limit=${limit}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP cash flow error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPCashFlow[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP cash flow fetched: ${data.length} periods for ${upperSymbol}`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, `FMP cash flow fetch failed: ${upperSymbol}`);
    return null;
  }
}

/**
 * Get key metrics for a stock (P/E, EV/EBITDA, ROE, etc.)
 */
export async function getKeyMetrics(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 4): Promise<FMPKeyMetrics[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping key metrics fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:metrics:${upperSymbol}:${period}`;
  const cached = cache.get<FMPKeyMetrics[]>(cacheKey, FINANCIALS_CACHE_TTL);
  if (cached) {
    log(`FMP key metrics from cache: ${upperSymbol}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/key-metrics?symbol=SYMBOL
    const url = `${FMP_BASE_URL}/key-metrics?symbol=${upperSymbol}&period=${period}&limit=${limit}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP key metrics error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPKeyMetrics[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP key metrics fetched: ${data.length} periods for ${upperSymbol}`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, `FMP key metrics fetch failed: ${upperSymbol}`);
    return null;
  }
}

/**
 * Get the latest P/E ratio for a stock from ratios-ttm endpoint
 * Returns just the P/E ratio number, or null if unavailable
 */
export async function getLatestPERatio(symbol: string): Promise<number | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping P/E ratio fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:pe:${upperSymbol}`;
  const cached = cache.get<number>(cacheKey, PROFILE_CACHE_TTL);
  // Only use cache if we have an actual positive value (don't cache null)
  if (cached !== undefined && cached !== null && cached > 0) {
    log(`P/E ratio from cache: ${upperSymbol} = ${cached}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // FMP stable API: /stable/ratios-ttm for trailing twelve months ratios
    const url = `${FMP_BASE_URL}/ratios-ttm?symbol=${upperSymbol}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP ratios-ttm error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data = await response.json();

    if (!data || (Array.isArray(data) && data.length === 0)) {
      log(`FMP ratios-ttm not found: ${upperSymbol}`, 'fmp', 'debug');
      return null;
    }

    const ratios = Array.isArray(data) ? data[0] : data;

    // Look for P/E ratio in the response - FMP stable API uses priceToEarningsRatioTTM
    const pe = ratios.priceToEarningsRatioTTM ?? ratios.peRatioTTM ?? ratios.priceEarningsRatioTTM ?? ratios.peRatio;

    log(`DEBUG P/E for ${upperSymbol}: pe=${pe}, keys=${Object.keys(ratios).filter(k => k.toLowerCase().includes('pe') || k.toLowerCase().includes('price') && k.toLowerCase().includes('earning')).join(',')}`, 'fmp', 'debug');

    if (pe != null) {
      // Validate P/E ratio - must be finite and reasonable (within ±10000)
      // Allow negative P/E for companies with negative earnings
      if (isFinite(pe) && pe !== 0 && Math.abs(pe) < 10000) {
        log(`P/E ratio for ${upperSymbol}: ${pe}`, 'fmp', 'debug');
        cache.set(cacheKey, pe);
        return pe;
      }
      log(`P/E ratio invalid for ${upperSymbol}: ${pe}`, 'fmp', 'debug');
    }

    return null;
  } catch (error) {
    logError(error as Error, `FMP ratios-ttm fetch failed: ${upperSymbol}`);
    return null;
  }
}

// ============================================================================
// Phase 4D: Institutional Tracking
// ============================================================================

/**
 * Get institutional holders for a stock
 */
export async function getInstitutionalHolders(symbol: string): Promise<FMPInstitutionalHolder[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping institutional holders fetch', 'fmp', 'debug');
    return null;
  }

  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `fmp:institutions:${upperSymbol}`;
  const cached = cache.get<FMPInstitutionalHolder[]>(cacheKey, FINANCIALS_CACHE_TTL);
  if (cached) {
    log(`FMP institutional holders from cache: ${upperSymbol}`, 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/institutional-holder?symbol=SYMBOL
    const url = `${FMP_BASE_URL}/institutional-holder?symbol=${upperSymbol}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP institutional holders error: ${response.status} for ${upperSymbol}`, 'fmp', 'warn');
      return null;
    }

    const data: FMPInstitutionalHolder[] = await response.json();
    cache.set(cacheKey, data);
    log(`FMP institutional holders fetched: ${data.length} for ${upperSymbol}`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, `FMP institutional holders fetch failed: ${upperSymbol}`);
    return null;
  }
}

// ============================================================================
// Phase 4D: General News
// ============================================================================

/**
 * Get general market news
 */
export async function getGeneralNews(limit: number = 20): Promise<FMPNewsArticle[] | null> {
  if (!hasFMP) {
    log('FMP not configured, skipping general news fetch', 'fmp', 'debug');
    return null;
  }

  const cacheKey = 'fmp:generalnews';
  const cached = cache.get<FMPNewsArticle[]>(cacheKey, NEWS_CACHE_TTL);
  if (cached) {
    log('FMP general news from cache', 'fmp', 'debug');
    return cached;
  }

  try {
    // New stable API: /stable/fmp-articles?page=0&size=LIMIT
    const url = `${FMP_BASE_URL}/fmp-articles?page=0&size=${limit}&apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      log(`FMP general news error: ${response.status}`, 'fmp', 'warn');
      return null;
    }

    const result = await response.json();
    const data: FMPNewsArticle[] = result.content || [];
    cache.set(cacheKey, data);
    log(`FMP general news fetched: ${data.length} articles`, 'fmp', 'info');
    return data;
  } catch (error) {
    logError(error as Error, 'FMP general news fetch failed');
    return null;
  }
}
