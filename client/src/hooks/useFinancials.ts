/**
 * Financials Data Hooks
 *
 * React Query hooks for FMP financial statement endpoints:
 * - Income statement
 * - Balance sheet
 * - Cash flow statement
 * - Key metrics
 */

import { useQuery } from '@tanstack/react-query';

// Income Statement Types
export interface IncomeStatement {
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
  researchAndDevelopmentExpenses: number;
  generalAndAdministrativeExpenses: number;
  sellingAndMarketingExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  otherExpenses: number;
  operatingExpenses: number;
  costAndExpenses: number;
  interestIncome: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  ebitda: number;
  ebitdaratio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  totalOtherIncomeExpensesNet: number;
  incomeBeforeTax: number;
  incomeBeforeTaxRatio: number;
  incomeTaxExpense: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
}

// Balance Sheet Types
export interface BalanceSheet {
  date: string;
  symbol: string;
  reportedCurrency: string;
  calendarYear: string;
  period: string;
  cashAndCashEquivalents: number;
  shortTermInvestments: number;
  cashAndShortTermInvestments: number;
  netReceivables: number;
  inventory: number;
  otherCurrentAssets: number;
  totalCurrentAssets: number;
  propertyPlantEquipmentNet: number;
  goodwill: number;
  intangibleAssets: number;
  goodwillAndIntangibleAssets: number;
  longTermInvestments: number;
  taxAssets: number;
  otherNonCurrentAssets: number;
  totalNonCurrentAssets: number;
  otherAssets: number;
  totalAssets: number;
  accountPayables: number;
  shortTermDebt: number;
  taxPayables: number;
  deferredRevenue: number;
  otherCurrentLiabilities: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  deferredRevenueNonCurrent: number;
  deferredTaxLiabilitiesNonCurrent: number;
  otherNonCurrentLiabilities: number;
  totalNonCurrentLiabilities: number;
  otherLiabilities: number;
  capitalLeaseObligations: number;
  totalLiabilities: number;
  preferredStock: number;
  commonStock: number;
  retainedEarnings: number;
  accumulatedOtherComprehensiveIncomeLoss: number;
  othertotalStockholdersEquity: number;
  totalStockholdersEquity: number;
  totalEquity: number;
  totalLiabilitiesAndStockholdersEquity: number;
  minorityInterest: number;
  totalLiabilitiesAndTotalEquity: number;
  totalInvestments: number;
  totalDebt: number;
  netDebt: number;
}

// Cash Flow Types
export interface CashFlow {
  date: string;
  symbol: string;
  reportedCurrency: string;
  calendarYear: string;
  period: string;
  netIncome: number;
  depreciationAndAmortization: number;
  deferredIncomeTax: number;
  stockBasedCompensation: number;
  changeInWorkingCapital: number;
  accountsReceivables: number;
  inventory: number;
  accountsPayables: number;
  otherWorkingCapital: number;
  otherNonCashItems: number;
  netCashProvidedByOperatingActivities: number;
  investmentsInPropertyPlantAndEquipment: number;
  acquisitionsNet: number;
  purchasesOfInvestments: number;
  salesMaturitiesOfInvestments: number;
  otherInvestingActivites: number;
  netCashUsedForInvestingActivites: number;
  debtRepayment: number;
  commonStockIssued: number;
  commonStockRepurchased: number;
  dividendsPaid: number;
  otherFinancingActivites: number;
  netCashUsedProvidedByFinancingActivities: number;
  effectOfForexChangesOnCash: number;
  netChangeInCash: number;
  cashAtEndOfPeriod: number;
  cashAtBeginningOfPeriod: number;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
}

// Key Metrics Types
export interface KeyMetrics {
  date: string;
  symbol: string;
  calendarYear: string;
  period: string;
  revenuePerShare: number;
  netIncomePerShare: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  cashPerShare: number;
  bookValuePerShare: number;
  tangibleBookValuePerShare: number;
  shareholdersEquityPerShare: number;
  interestDebtPerShare: number;
  marketCap: number;
  enterpriseValue: number;
  peRatio: number;
  priceToSalesRatio: number;
  pocfratio: number;
  pfcfRatio: number;
  pbRatio: number;
  ptbRatio: number;
  evToSales: number;
  enterpriseValueOverEBITDA: number;
  evToOperatingCashFlow: number;
  evToFreeCashFlow: number;
  earningsYield: number;
  freeCashFlowYield: number;
  debtToEquity: number;
  debtToAssets: number;
  netDebtToEBITDA: number;
  currentRatio: number;
  interestCoverage: number;
  incomeQuality: number;
  dividendYield: number;
  payoutRatio: number;
  salesGeneralAndAdministrativeToRevenue: number;
  researchAndDdevelopementToRevenue: number;
  intangiblesToTotalAssets: number;
  capexToOperatingCashFlow: number;
  capexToRevenue: number;
  capexToDepreciation: number;
  stockBasedCompensationToRevenue: number;
  grahamNumber: number;
  roic: number;
  returnOnTangibleAssets: number;
  grahamNetNet: number;
  workingCapital: number;
  tangibleAssetValue: number;
  netCurrentAssetValue: number;
  investedCapital: number;
  averageReceivables: number;
  averagePayables: number;
  averageInventory: number;
  daysSalesOutstanding: number;
  daysPayablesOutstanding: number;
  daysOfInventoryOnHand: number;
  receivablesTurnover: number;
  payablesTurnover: number;
  inventoryTurnover: number;
  roe: number;
  capexPerShare: number;
}

export type FinancialPeriod = 'annual' | 'quarter';

async function fetchIncomeStatement(
  symbol: string,
  period: FinancialPeriod,
  limit: number
): Promise<IncomeStatement[]> {
  const res = await fetch(`/api/stocks/${symbol}/income?period=${period}&limit=${limit}`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchBalanceSheet(
  symbol: string,
  period: FinancialPeriod,
  limit: number
): Promise<BalanceSheet[]> {
  const res = await fetch(`/api/stocks/${symbol}/balance-sheet?period=${period}&limit=${limit}`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchCashFlow(
  symbol: string,
  period: FinancialPeriod,
  limit: number
): Promise<CashFlow[]> {
  const res = await fetch(`/api/stocks/${symbol}/cash-flow?period=${period}&limit=${limit}`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchKeyMetrics(
  symbol: string,
  period: FinancialPeriod,
  limit: number
): Promise<KeyMetrics[]> {
  const res = await fetch(`/api/stocks/${symbol}/metrics?period=${period}&limit=${limit}`);
  if (!res.ok) return [];
  return res.json();
}

/**
 * Hook for income statement data
 */
export function useIncomeStatement(symbol: string, period: FinancialPeriod = 'annual', limit = 4) {
  return useQuery({
    queryKey: ['income-statement', symbol, period, limit],
    queryFn: () => fetchIncomeStatement(symbol, period, limit),
    enabled: !!symbol,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for balance sheet data
 */
export function useBalanceSheet(symbol: string, period: FinancialPeriod = 'annual', limit = 4) {
  return useQuery({
    queryKey: ['balance-sheet', symbol, period, limit],
    queryFn: () => fetchBalanceSheet(symbol, period, limit),
    enabled: !!symbol,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for cash flow data
 */
export function useCashFlow(symbol: string, period: FinancialPeriod = 'annual', limit = 4) {
  return useQuery({
    queryKey: ['cash-flow', symbol, period, limit],
    queryFn: () => fetchCashFlow(symbol, period, limit),
    enabled: !!symbol,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for key metrics data
 */
export function useKeyMetrics(symbol: string, period: FinancialPeriod = 'annual', limit = 4) {
  return useQuery({
    queryKey: ['key-metrics', symbol, period, limit],
    queryFn: () => fetchKeyMetrics(symbol, period, limit),
    enabled: !!symbol,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Combined hook for all financial data
 */
export function useFinancials(symbol: string, period: FinancialPeriod = 'annual', limit = 4) {
  const income = useIncomeStatement(symbol, period, limit);
  const balance = useBalanceSheet(symbol, period, limit);
  const cashFlow = useCashFlow(symbol, period, limit);
  const metrics = useKeyMetrics(symbol, period, limit);

  return {
    income: income.data ?? [],
    balanceSheet: balance.data ?? [],
    cashFlow: cashFlow.data ?? [],
    metrics: metrics.data ?? [],
    isLoading: income.isLoading || balance.isLoading || cashFlow.isLoading || metrics.isLoading,
    isError: income.isError && balance.isError && cashFlow.isError && metrics.isError,
  };
}
