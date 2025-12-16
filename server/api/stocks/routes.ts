/**
 * Stock Market Routes
 *
 * Provides REST API endpoints for US stock market data.
 * Dual-provider architecture: Twelve Data (primary) + Finnhub (fallback).
 * Returns null/empty when no API keys configured (UI shows N/A).
 *
 * Endpoints:
 * - GET /api/stocks              - Top 10 stocks
 * - GET /api/stocks/:symbol      - Single stock details + charts
 * - GET /api/stocks/search       - Search stocks by query
 * - GET /api/stocks/batch        - Multiple stocks by symbols
 * - GET /api/stocks/status       - Service health status
 *
 * @module server/api/stocks/routes
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import {
  getTopStocks,
  getStockAsset,
  getStockAssets,
  searchStocks,
  getProviderStatus,
  getStockChart,
  type ChartTimeframe,
} from './service';
import {
  getTopGainers,
  getTopLosers,
  getMostActive,
  getCompanyProfile,
  getStockNews,
  isFMPConfigured,
  // Phase 4D: Analyst Intelligence
  getAnalystEstimates,
  getPriceTargetConsensus,
  getPriceTargets,
  getStockGrades,
  getGradeConsensus,
  // Phase 4D: Calendar Events
  getEarningsCalendar,
  getStockEarnings,
  getDividendCalendar,
  getIPOCalendar,
  getStockSplitsCalendar,
  // Phase 4D: Sector & Market
  getSectorPerformance,
  // Phase 4D: Financials
  getIncomeStatement,
  getBalanceSheet,
  getCashFlow,
  getKeyMetrics,
  // Phase 4D: Institutional
  getInstitutionalHolders,
  // Phase 4D: News
  getGeneralNews,
} from './fmpService';

const router = Router();

/**
 * GET /api/stocks
 *
 * Returns top 10 stock assets with real-time quotes.
 * Returns empty array when no API keys configured.
 *
 * @response {StockAsset[]} 200 - List of stock assets
 *
 * @example Response:
 * ```json
 * [
 *   {
 *     "id": "AAPL",
 *     "type": "stock",
 *     "symbol": "AAPL",
 *     "name": "Apple Inc",
 *     "price": 178.72,
 *     "change24h": 2.15,
 *     "changePercent24h": 1.22,
 *     "exchange": "NASDAQ",
 *     ...
 *   }
 * ]
 * ```
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const stocks = await getTopStocks();
    res.json(stocks);
  })
);

/**
 * GET /api/stocks/search
 *
 * Search stocks by symbol or company name.
 * Returns up to 10 matching results.
 *
 * @query {string} q - Search query (required)
 *
 * @response {AssetSearchResult[]} 200 - Search results
 * @response {Object} 400 - Missing query parameter
 *
 * @example Request: GET /api/stocks/search?q=apple
 * @example Response:
 * ```json
 * [
 *   {
 *     "id": "AAPL",
 *     "type": "stock",
 *     "symbol": "AAPL",
 *     "name": "Apple Inc",
 *     "exchange": "NASDAQ"
 *   }
 * ]
 * ```
 */
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const query = req.query.q as string;

    if (!query || query.length < 1) {
      return res.status(400).json({
        error: 'Missing query parameter',
        message: 'Provide a search query using ?q=',
      });
    }

    const results = await searchStocks(query);
    res.json(results);
  })
);

/**
 * GET /api/stocks/batch
 *
 * Get multiple stocks by symbol list.
 * Useful for watchlist/portfolio views.
 *
 * @query {string} symbols - Comma-separated stock symbols (required)
 *
 * @response {StockAsset[]} 200 - List of stock assets
 * @response {Object} 400 - Missing symbols parameter
 *
 * @example Request: GET /api/stocks/batch?symbols=AAPL,MSFT,GOOGL
 */
router.get(
  '/batch',
  asyncHandler(async (req, res) => {
    const symbolsParam = req.query.symbols as string;

    if (!symbolsParam) {
      return res.status(400).json({
        error: 'Missing symbols parameter',
        message: 'Provide symbols using ?symbols=AAPL,MSFT,GOOGL',
      });
    }

    const symbols = symbolsParam.split(',').map((s) => s.trim().toUpperCase());

    if (symbols.length === 0) {
      return res.status(400).json({
        error: 'Invalid symbols',
        message: 'Provide at least one valid symbol',
      });
    }

    if (symbols.length > 20) {
      return res.status(400).json({
        error: 'Too many symbols',
        message: 'Maximum 20 symbols per request',
      });
    }

    const stocks = await getStockAssets(symbols);
    res.json(stocks);
  })
);

/**
 * GET /api/stocks/status
 *
 * Service health status for monitoring.
 * Includes API configuration status and circuit breaker state.
 *
 * @response {Object} 200 - Service status
 *
 * @example Response:
 * ```json
 * {
 *   "service": "stocks",
 *   "configured": true,
 *   "anyConfigured": true,
 *   "circuitState": "closed"
 * }
 * ```
 */
router.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const status = getProviderStatus();
    res.json({
      service: 'stocks',
      ...status,
    });
  })
);

// ============================================================================
// FMP Market Movers Routes
// ============================================================================

/**
 * GET /api/stocks/movers/gainers
 *
 * Get top gaining stocks from entire market.
 * Real-time data from FMP (Financial Modeling Prep).
 *
 * @response {FMPMover[]} 200 - List of top gainers
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/movers/gainers',
  asyncHandler(async (_req, res) => {
    const data = await getTopGainers();
    if (!data) {
      return res.status(503).json({
        error: 'Market movers unavailable',
        message: 'FMP API key not configured or service unavailable',
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

/**
 * GET /api/stocks/movers/losers
 *
 * Get top losing stocks from entire market.
 * Real-time data from FMP (Financial Modeling Prep).
 *
 * @response {FMPMover[]} 200 - List of top losers
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/movers/losers',
  asyncHandler(async (_req, res) => {
    const data = await getTopLosers();
    if (!data) {
      return res.status(503).json({
        error: 'Market movers unavailable',
        message: 'FMP API key not configured or service unavailable',
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

/**
 * GET /api/stocks/movers/actives
 *
 * Get most actively traded stocks by volume.
 * Real-time data from FMP (Financial Modeling Prep).
 *
 * @response {FMPMover[]} 200 - List of most active stocks
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/movers/actives',
  asyncHandler(async (_req, res) => {
    const data = await getMostActive();
    if (!data) {
      return res.status(503).json({
        error: 'Market movers unavailable',
        message: 'FMP API key not configured or service unavailable',
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

// ============================================================================
// Phase 4D: Sector Performance Routes
// ============================================================================

/**
 * GET /api/stocks/sectors
 *
 * Get sector performance for heatmap visualization.
 * Real-time data from FMP (Financial Modeling Prep).
 *
 * @response {FMPSectorPerformance[]} 200 - List of sector performances
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/sectors',
  asyncHandler(async (_req, res) => {
    const data = await getSectorPerformance();
    if (!data) {
      return res.status(503).json({
        error: 'Sector performance unavailable',
        message: 'FMP API key not configured or service unavailable',
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

// ============================================================================
// Phase 4D: Calendar Routes
// ============================================================================

/**
 * GET /api/stocks/calendar/earnings
 *
 * Get upcoming earnings calendar.
 * Shows companies reporting earnings in the next 30 days.
 *
 * @query {string} from - Start date (YYYY-MM-DD, optional)
 * @query {string} to - End date (YYYY-MM-DD, optional)
 *
 * @response {FMPEarningsCalendarItem[]} 200 - List of earnings events
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/calendar/earnings',
  asyncHandler(async (req, res) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const data = await getEarningsCalendar(from, to);
    if (!data) {
      return res.status(503).json({
        error: 'Earnings calendar unavailable',
        message: 'FMP API key not configured or service unavailable',
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

/**
 * GET /api/stocks/calendar/dividends
 *
 * Get upcoming dividend calendar.
 *
 * @query {string} from - Start date (YYYY-MM-DD, optional)
 * @query {string} to - End date (YYYY-MM-DD, optional)
 *
 * @response {FMPDividendCalendarItem[]} 200 - List of dividend events
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/calendar/dividends',
  asyncHandler(async (req, res) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const data = await getDividendCalendar(from, to);
    if (!data) {
      return res.status(503).json({
        error: 'Dividend calendar unavailable',
        message: 'FMP API key not configured or service unavailable',
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

/**
 * GET /api/stocks/calendar/ipos
 *
 * Get upcoming IPO calendar.
 *
 * @query {string} from - Start date (YYYY-MM-DD, optional)
 * @query {string} to - End date (YYYY-MM-DD, optional)
 *
 * @response {FMPIPOCalendarItem[]} 200 - List of IPO events
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/calendar/ipos',
  asyncHandler(async (req, res) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const data = await getIPOCalendar(from, to);
    if (!data) {
      return res.status(503).json({
        error: 'IPO calendar unavailable',
        message: 'FMP API key not configured or service unavailable',
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

/**
 * GET /api/stocks/calendar/splits
 *
 * Get upcoming stock splits calendar.
 *
 * @query {string} from - Start date (YYYY-MM-DD, optional)
 * @query {string} to - End date (YYYY-MM-DD, optional)
 *
 * @response {FMPStockSplit[]} 200 - List of stock split events
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/calendar/splits',
  asyncHandler(async (req, res) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const data = await getStockSplitsCalendar(from, to);
    if (!data) {
      return res.status(503).json({
        error: 'Stock splits calendar unavailable',
        message: 'FMP API key not configured or service unavailable',
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

// ============================================================================
// Phase 4D: General News Route
// ============================================================================

/**
 * GET /api/stocks/news
 *
 * Get general market news.
 *
 * @query {number} limit - Number of articles (default: 20, max: 50)
 *
 * @response {FMPNewsArticle[]} 200 - List of news articles
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/news',
  asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const data = await getGeneralNews(limit);
    if (!data) {
      return res.status(503).json({
        error: 'General news unavailable',
        message: 'FMP API key not configured or service unavailable',
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

// ============================================================================
// Stock Detail Routes (must be after /movers/*, /sectors, /calendar/*, /news)
// ============================================================================

/**
 * GET /api/stocks/:symbol/chart
 *
 * Get historical chart data for a stock.
 * Uses TradingView-compatible data format.
 *
 * @param {string} symbol - Stock ticker symbol (e.g., AAPL)
 * @query {string} timeframe - Time range: 1D, 7D, 30D, 1Y (default: 30D)
 *
 * @response {ChartDataPoint[]} 200 - Array of chart data points
 * @response {Object} 404 - No chart data available
 *
 * @example Request: GET /api/stocks/AAPL/chart?timeframe=30D
 * @example Response:
 * ```json
 * [
 *   { "timestamp": 1702300800000, "price": 195.89, "open": 194.20, "high": 196.50, "low": 193.80, "volume": 48234567 },
 *   ...
 * ]
 * ```
 */
router.get(
  '/:symbol/chart',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const timeframe = (req.query.timeframe as ChartTimeframe) || '30D';

    // Validate timeframe
    const validTimeframes: ChartTimeframe[] = ['1D', '7D', '30D', '1Y'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        error: 'Invalid timeframe',
        message: `Timeframe must be one of: ${validTimeframes.join(', ')}`,
      });
    }

    const chartData = await getStockChart(symbol, timeframe);

    if (!chartData || chartData.length === 0) {
      return res.status(404).json({
        error: 'Chart data not available',
        message: `No historical data for ${symbol.toUpperCase()}. API key may not be configured.`,
        symbol: symbol.toUpperCase(),
        timeframe,
      });
    }

    res.json(chartData);
  })
);

/**
 * GET /api/stocks/:symbol/news
 *
 * Get latest news for a stock.
 * Data from FMP (Financial Modeling Prep).
 *
 * @param {string} symbol - Stock ticker symbol (e.g., AAPL)
 * @query {number} limit - Number of articles (default: 10, max: 50)
 *
 * @response {FMPNewsArticle[]} 200 - List of news articles
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/:symbol/news',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const news = await getStockNews(symbol, limit);

    if (!news) {
      return res.status(503).json({
        error: 'News unavailable',
        message: 'FMP API key not configured or service unavailable',
        symbol: symbol.toUpperCase(),
        configured: isFMPConfigured(),
      });
    }

    res.json(news);
  })
);

/**
 * GET /api/stocks/:symbol/profile
 *
 * Get detailed company profile.
 * Data from FMP (Financial Modeling Prep).
 *
 * @param {string} symbol - Stock ticker symbol (e.g., AAPL)
 *
 * @response {FMPCompanyProfile} 200 - Company profile
 * @response {Object} 404 - Company not found
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/:symbol/profile',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;

    if (!isFMPConfigured()) {
      return res.status(503).json({
        error: 'Profile unavailable',
        message: 'FMP API key not configured',
        symbol: symbol.toUpperCase(),
        configured: false,
      });
    }

    const profile = await getCompanyProfile(symbol);

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: `No profile data found for ${symbol.toUpperCase()}`,
        symbol: symbol.toUpperCase(),
      });
    }

    res.json(profile);
  })
);

// ============================================================================
// Phase 4D: Per-Symbol Analyst Intelligence Routes
// ============================================================================

/**
 * GET /api/stocks/:symbol/estimates
 *
 * Get analyst revenue/EPS estimates for a stock.
 * Institutional-grade forward-looking projections.
 *
 * @param {string} symbol - Stock ticker symbol
 * @query {number} limit - Number of periods (default: 4)
 *
 * @response {FMPAnalystEstimate[]} 200 - List of analyst estimates
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/:symbol/estimates',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit as string) || 4;

    const data = await getAnalystEstimates(symbol, limit);
    if (!data) {
      return res.status(503).json({
        error: 'Analyst estimates unavailable',
        message: 'FMP API key not configured or service unavailable',
        symbol: symbol.toUpperCase(),
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

/**
 * GET /api/stocks/:symbol/price-target
 *
 * Get consensus price target for a stock.
 * Shows high, low, median, and consensus targets.
 *
 * @param {string} symbol - Stock ticker symbol
 *
 * @response {FMPPriceTargetConsensus} 200 - Price target consensus
 * @response {Object} 404 - No price target data
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/:symbol/price-target',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;

    const data = await getPriceTargetConsensus(symbol);
    if (!data) {
      return res.status(404).json({
        error: 'Price target unavailable',
        message: `No price target data for ${symbol.toUpperCase()}`,
        symbol: symbol.toUpperCase(),
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

/**
 * GET /api/stocks/:symbol/price-targets
 *
 * Get recent analyst price targets with details.
 * Shows individual analyst ratings and their firms.
 *
 * @param {string} symbol - Stock ticker symbol
 * @query {number} limit - Number of targets (default: 10)
 *
 * @response {FMPPriceTarget[]} 200 - List of price targets
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/:symbol/price-targets',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const data = await getPriceTargets(symbol, limit);
    if (!data) {
      return res.status(503).json({
        error: 'Price targets unavailable',
        message: 'FMP API key not configured or service unavailable',
        symbol: symbol.toUpperCase(),
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

/**
 * GET /api/stocks/:symbol/grades
 *
 * Get upgrade/downgrade history for a stock.
 *
 * @param {string} symbol - Stock ticker symbol
 * @query {number} limit - Number of grades (default: 20)
 *
 * @response {FMPStockGrade[]} 200 - List of stock grades
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/:symbol/grades',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const data = await getStockGrades(symbol, limit);
    if (!data) {
      return res.status(503).json({
        error: 'Stock grades unavailable',
        message: 'FMP API key not configured or service unavailable',
        symbol: symbol.toUpperCase(),
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

/**
 * GET /api/stocks/:symbol/consensus
 *
 * Get buy/hold/sell consensus for a stock.
 * Distribution of analyst recommendations.
 *
 * @param {string} symbol - Stock ticker symbol
 *
 * @response {FMPGradeConsensus} 200 - Grade consensus
 * @response {Object} 404 - No consensus data
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/:symbol/consensus',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;

    const data = await getGradeConsensus(symbol);
    if (!data) {
      return res.status(404).json({
        error: 'Consensus unavailable',
        message: `No consensus data for ${symbol.toUpperCase()}`,
        symbol: symbol.toUpperCase(),
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

// ============================================================================
// Phase 4D: Per-Symbol Earnings Route
// ============================================================================

/**
 * GET /api/stocks/:symbol/earnings
 *
 * Get historical earnings for a stock.
 * Shows EPS estimates vs actuals.
 *
 * @param {string} symbol - Stock ticker symbol
 * @query {number} limit - Number of periods (default: 8)
 *
 * @response {FMPEarningsCalendarItem[]} 200 - List of earnings
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/:symbol/earnings',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit as string) || 8;

    const data = await getStockEarnings(symbol, limit);
    if (!data) {
      return res.status(503).json({
        error: 'Earnings history unavailable',
        message: 'FMP API key not configured or service unavailable',
        symbol: symbol.toUpperCase(),
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

// ============================================================================
// Phase 4D: Per-Symbol Financial Statements Routes
// ============================================================================

/**
 * GET /api/stocks/:symbol/income
 *
 * Get income statement for a stock.
 *
 * @param {string} symbol - Stock ticker symbol
 * @query {string} period - 'annual' or 'quarter' (default: annual)
 * @query {number} limit - Number of periods (default: 4)
 *
 * @response {FMPIncomeStatement[]} 200 - Income statements
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/:symbol/income',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const period = (req.query.period as 'annual' | 'quarter') || 'annual';
    const limit = parseInt(req.query.limit as string) || 4;

    const data = await getIncomeStatement(symbol, period, limit);
    if (!data) {
      return res.status(503).json({
        error: 'Income statement unavailable',
        message: 'FMP API key not configured or service unavailable',
        symbol: symbol.toUpperCase(),
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

/**
 * GET /api/stocks/:symbol/balance-sheet
 *
 * Get balance sheet for a stock.
 *
 * @param {string} symbol - Stock ticker symbol
 * @query {string} period - 'annual' or 'quarter' (default: annual)
 * @query {number} limit - Number of periods (default: 4)
 *
 * @response {FMPBalanceSheet[]} 200 - Balance sheets
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/:symbol/balance-sheet',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const period = (req.query.period as 'annual' | 'quarter') || 'annual';
    const limit = parseInt(req.query.limit as string) || 4;

    const data = await getBalanceSheet(symbol, period, limit);
    if (!data) {
      return res.status(503).json({
        error: 'Balance sheet unavailable',
        message: 'FMP API key not configured or service unavailable',
        symbol: symbol.toUpperCase(),
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

/**
 * GET /api/stocks/:symbol/cash-flow
 *
 * Get cash flow statement for a stock.
 *
 * @param {string} symbol - Stock ticker symbol
 * @query {string} period - 'annual' or 'quarter' (default: annual)
 * @query {number} limit - Number of periods (default: 4)
 *
 * @response {FMPCashFlow[]} 200 - Cash flow statements
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/:symbol/cash-flow',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const period = (req.query.period as 'annual' | 'quarter') || 'annual';
    const limit = parseInt(req.query.limit as string) || 4;

    const data = await getCashFlow(symbol, period, limit);
    if (!data) {
      return res.status(503).json({
        error: 'Cash flow statement unavailable',
        message: 'FMP API key not configured or service unavailable',
        symbol: symbol.toUpperCase(),
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

/**
 * GET /api/stocks/:symbol/metrics
 *
 * Get key financial metrics for a stock.
 * Includes P/E, EV/EBITDA, ROE, ROA, and more.
 *
 * @param {string} symbol - Stock ticker symbol
 * @query {string} period - 'annual' or 'quarter' (default: annual)
 * @query {number} limit - Number of periods (default: 4)
 *
 * @response {FMPKeyMetrics[]} 200 - Key metrics
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/:symbol/metrics',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const period = (req.query.period as 'annual' | 'quarter') || 'annual';
    const limit = parseInt(req.query.limit as string) || 4;

    const data = await getKeyMetrics(symbol, period, limit);
    if (!data) {
      return res.status(503).json({
        error: 'Key metrics unavailable',
        message: 'FMP API key not configured or service unavailable',
        symbol: symbol.toUpperCase(),
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

// ============================================================================
// Phase 4D: Institutional Tracking Route
// ============================================================================

/**
 * GET /api/stocks/:symbol/institutions
 *
 * Get institutional holders for a stock.
 * Shows who owns the stock (hedge funds, mutual funds, etc.)
 *
 * @param {string} symbol - Stock ticker symbol
 *
 * @response {FMPInstitutionalHolder[]} 200 - List of institutional holders
 * @response {Object} 503 - FMP not configured or unavailable
 */
router.get(
  '/:symbol/institutions',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;

    const data = await getInstitutionalHolders(symbol);
    if (!data) {
      return res.status(503).json({
        error: 'Institutional holders unavailable',
        message: 'FMP API key not configured or service unavailable',
        symbol: symbol.toUpperCase(),
        configured: isFMPConfigured(),
      });
    }
    res.json(data);
  })
);

/**
 * GET /api/stocks/:symbol
 *
 * Get detailed stock data for a single symbol.
 *
 * @param {string} symbol - Stock ticker symbol (e.g., AAPL)
 *
 * @response {StockAsset} 200 - Stock asset details
 * @response {Object} 404 - Stock not found
 *
 * @example Request: GET /api/stocks/AAPL
 */
router.get(
  '/:symbol',
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const stock = await getStockAsset(symbol);

    if (!stock) {
      return res.status(404).json({
        error: 'Stock not found',
        message: `No data found for symbol: ${symbol.toUpperCase()}`,
        symbol: symbol.toUpperCase(),
      });
    }

    res.json(stock);
  })
);

export default router;
