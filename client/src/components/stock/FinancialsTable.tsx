/**
 * Financials Table Component
 *
 * Displays financial statements with sub-tabs:
 * - Income Statement
 * - Balance Sheet
 * - Cash Flow
 * - Key Metrics
 */

import { useState } from 'react';
import { FileText, Scale, Banknote, BarChart3, Loader2, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useIncomeStatement,
  useBalanceSheet,
  useCashFlow,
  useKeyMetrics,
  type IncomeStatement,
  type BalanceSheet,
  type CashFlow,
  type KeyMetrics,
  type FinancialPeriod,
} from '@/hooks/useFinancials';
import { cn, formatNumber } from '@/lib/utils';

// Metric explanations for help tooltips
const METRIC_EXPLANATIONS: Record<string, string> = {
  // Income Statement
  revenue: 'Total money earned from selling products/services',
  costOfRevenue: 'Direct costs to produce goods/services sold',
  grossProfit: 'Revenue minus cost of revenue - shows core profitability',
  researchAndDevelopmentExpenses: 'Money spent on developing new products',
  sellingGeneralAndAdministrativeExpenses: 'Operating costs like salaries, marketing, rent',
  operatingExpenses: 'All costs to run the business excluding cost of revenue',
  operatingIncome: 'Profit from core business operations',
  ebitda: 'Earnings before interest, taxes, depreciation & amortization',
  interestExpense: 'Cost of borrowed money (loans, bonds)',
  incomeBeforeTax: 'Profit before paying taxes',
  netIncome: 'Final profit after all expenses - the "bottom line"',
  epsdiluted: 'Net income divided by total shares (including potential shares)',

  // Balance Sheet
  cashAndCashEquivalents: 'Cash and short-term liquid investments',
  shortTermInvestments: 'Investments that can be converted to cash within a year',
  netReceivables: 'Money owed by customers for goods/services',
  inventory: 'Value of products waiting to be sold',
  totalCurrentAssets: 'Assets that can be converted to cash within a year',
  propertyPlantEquipmentNet: 'Value of buildings, land, machinery after depreciation',
  goodwill: 'Premium paid for acquisitions above fair value',
  totalAssets: 'Everything the company owns',
  accountPayables: 'Money owed to suppliers',
  shortTermDebt: 'Debt due within one year',
  totalCurrentLiabilities: 'Debts due within one year',
  longTermDebt: 'Debt due after one year',
  totalLiabilities: 'Everything the company owes',
  totalStockholdersEquity: 'Assets minus liabilities - shareholders\' ownership value',
  totalDebt: 'All borrowed money (short + long term)',
  netDebt: 'Total debt minus cash - actual debt burden',

  // Cash Flow
  depreciationAndAmortization: 'Non-cash expense for asset wear over time',
  stockBasedCompensation: 'Value of stock given to employees as pay',
  changeInWorkingCapital: 'Change in short-term assets/liabilities',
  netCashProvidedByOperatingActivities: 'Cash generated from core business',
  capitalExpenditure: 'Money spent on property, equipment, etc.',
  acquisitionsNet: 'Money spent buying other companies',
  netCashUsedForInvestingActivites: 'Cash used for investments',
  debtRepayment: 'Money used to pay down debt',
  commonStockRepurchased: 'Money spent buying back company shares',
  dividendsPaid: 'Cash paid to shareholders',
  netCashUsedProvidedByFinancingActivities: 'Cash from financing (debt, stock)',
  freeCashFlow: 'Operating cash minus capital expenditures - available cash',

  // Key Metrics
  peRatio: 'Stock price divided by earnings per share',
  pbRatio: 'Stock price divided by book value per share',
  priceToSalesRatio: 'Stock price divided by revenue per share',
  enterpriseValueOverEBITDA: 'Company value relative to operating earnings',
  roe: 'Return on Equity - profit generated from shareholder investment',
  roic: 'Return on Invested Capital - efficiency of capital allocation',
  currentRatio: 'Current assets / current liabilities - short-term health',
  debtToEquity: 'Total debt / equity - leverage measure',
  dividendYield: 'Annual dividends / stock price',
  payoutRatio: 'Dividends paid / net income',
  freeCashFlowPerShare: 'Free cash flow divided by shares outstanding',
  bookValuePerShare: 'Equity divided by shares outstanding',
};

interface FinancialsTableProps {
  symbol: string;
  className?: string;
}

export function FinancialsTable({ symbol, className }: FinancialsTableProps) {
  const [activeTab, setActiveTab] = useState('income');
  const [period, setPeriod] = useState<FinancialPeriod>('annual');

  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      {/* Header with period toggle */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-medium">Financial Statements</span>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              period === 'annual' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setPeriod('annual')}
          >
            Annual
          </button>
          <button
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              period === 'quarter' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setPeriod('quarter')}
          >
            Quarterly
          </button>
        </div>
      </div>

      {/* Sub-tabs for different statements */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b px-4">
          <TabsList className="h-10 bg-transparent p-0 gap-4">
            <TabsTrigger
              value="income"
              className="px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Income
            </TabsTrigger>
            <TabsTrigger
              value="balance"
              className="px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <Scale className="w-3.5 h-3.5 mr-1.5" />
              Balance
            </TabsTrigger>
            <TabsTrigger
              value="cashflow"
              className="px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <Banknote className="w-3.5 h-3.5 mr-1.5" />
              Cash Flow
            </TabsTrigger>
            <TabsTrigger
              value="metrics"
              className="px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Metrics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="income" className="m-0">
          <IncomeStatementTable symbol={symbol} period={period} />
        </TabsContent>
        <TabsContent value="balance" className="m-0">
          <BalanceSheetTable symbol={symbol} period={period} />
        </TabsContent>
        <TabsContent value="cashflow" className="m-0">
          <CashFlowTable symbol={symbol} period={period} />
        </TabsContent>
        <TabsContent value="metrics" className="m-0">
          <KeyMetricsTable symbol={symbol} period={period} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Loading component
function TableLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// Empty state
function TableEmpty({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// Helper to format financial values
// Shows N/A for invalid data, handles extreme/unrealistic values
function formatFinancialValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  if (isNaN(value) || !isFinite(value)) return 'N/A';
  // Check for extreme values that indicate API errors/missing data
  // For individual line items, 500B is a reasonable max (Apple's total assets ~350B)
  // Anything beyond that is likely a data error
  if (Math.abs(value) > 500_000_000_000) return 'N/A';
  // Check for values that are exactly 0 (could be missing data)
  if (value === 0) return '-';
  return formatNumber(value);
}

// Helper to format column header based on period
function formatColumnHeader(date: string, period: FinancialPeriod, calendarYear?: string, periodName?: string): string {
  if (period === 'annual') {
    // For annual, show "FY 2024" or just the year
    return calendarYear ? `FY ${calendarYear}` : date.split('-')[0];
  } else {
    // For quarterly, show "Q1 2024" format
    return periodName && calendarYear ? `${periodName} ${calendarYear}` : date;
  }
}

// Metric label with help tooltip
function MetricLabel({ label, metricKey }: { label: string; metricKey: string }) {
  const explanation = METRIC_EXPLANATIONS[metricKey];

  if (!explanation) {
    return <span>{label}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {label}
            <HelpCircle className="w-3 h-3 text-muted-foreground opacity-50" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[250px]">
          <p className="text-xs">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Helper to get growth indicator
function GrowthIndicator({ current, previous }: { current?: number; previous?: number }) {
  if (!current || !previous || previous === 0) return null;
  const growth = ((current - previous) / Math.abs(previous)) * 100;
  const isPositive = growth > 0;

  return (
    <span className={cn('text-xs ml-1', isPositive ? 'text-green-500' : 'text-red-500')}>
      {isPositive ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
    </span>
  );
}

// Income Statement Table
function IncomeStatementTable({ symbol, period }: { symbol: string; period: FinancialPeriod }) {
  const { data, isLoading } = useIncomeStatement(symbol, period, 4);

  if (isLoading) return <TableLoading />;
  if (!data || data.length === 0) return <TableEmpty message="No income statement data available" />;

  const rows = [
    { label: 'Revenue', key: 'revenue' },
    { label: 'Cost of Revenue', key: 'costOfRevenue' },
    { label: 'Gross Profit', key: 'grossProfit', highlight: true },
    { label: 'R&D Expenses', key: 'researchAndDevelopmentExpenses' },
    { label: 'SG&A Expenses', key: 'sellingGeneralAndAdministrativeExpenses' },
    { label: 'Operating Expenses', key: 'operatingExpenses' },
    { label: 'Operating Income', key: 'operatingIncome', highlight: true },
    { label: 'EBITDA', key: 'ebitda' },
    { label: 'Interest Expense', key: 'interestExpense' },
    { label: 'Income Before Tax', key: 'incomeBeforeTax' },
    { label: 'Net Income', key: 'netIncome', highlight: true },
    { label: 'EPS (Diluted)', key: 'epsdiluted' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/20">
            <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-muted/20">
              Metric
            </th>
            {data.map((d: IncomeStatement) => (
              <th key={d.date} className="text-right p-3 font-medium text-muted-foreground whitespace-nowrap">
                {formatColumnHeader(d.date, period, d.calendarYear, d.period)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={cn(
                'border-b last:border-b-0 hover:bg-muted/10 transition-colors',
                row.highlight && 'bg-muted/5 font-medium'
              )}
            >
              <td className="p-3 sticky left-0 bg-card">
                <MetricLabel label={row.label} metricKey={row.key} />
              </td>
              {data.map((d: IncomeStatement, i: number) => (
                <td key={d.date} className="text-right p-3 font-mono whitespace-nowrap">
                  {formatFinancialValue((d as any)[row.key])}
                  <GrowthIndicator
                    current={(d as any)[row.key]}
                    previous={data[i + 1] ? (data[i + 1] as any)[row.key] : undefined}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Balance Sheet Table
function BalanceSheetTable({ symbol, period }: { symbol: string; period: FinancialPeriod }) {
  const { data, isLoading } = useBalanceSheet(symbol, period, 4);

  if (isLoading) return <TableLoading />;
  if (!data || data.length === 0) return <TableEmpty message="No balance sheet data available" />;

  const rows = [
    { label: 'Cash & Equivalents', key: 'cashAndCashEquivalents' },
    { label: 'Short-term Investments', key: 'shortTermInvestments' },
    { label: 'Net Receivables', key: 'netReceivables' },
    { label: 'Inventory', key: 'inventory' },
    { label: 'Total Current Assets', key: 'totalCurrentAssets', highlight: true },
    { label: 'PP&E (Net)', key: 'propertyPlantEquipmentNet' },
    { label: 'Goodwill', key: 'goodwill' },
    { label: 'Total Assets', key: 'totalAssets', highlight: true },
    { label: 'Accounts Payable', key: 'accountPayables' },
    { label: 'Short-term Debt', key: 'shortTermDebt' },
    { label: 'Total Current Liabilities', key: 'totalCurrentLiabilities', highlight: true },
    { label: 'Long-term Debt', key: 'longTermDebt' },
    { label: 'Total Liabilities', key: 'totalLiabilities', highlight: true },
    { label: 'Total Equity', key: 'totalStockholdersEquity', highlight: true },
    { label: 'Total Debt', key: 'totalDebt' },
    { label: 'Net Debt', key: 'netDebt' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/20">
            <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-muted/20">
              Metric
            </th>
            {data.map((d: BalanceSheet) => (
              <th key={d.date} className="text-right p-3 font-medium text-muted-foreground whitespace-nowrap">
                {formatColumnHeader(d.date, period, d.calendarYear, d.period)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={cn(
                'border-b last:border-b-0 hover:bg-muted/10 transition-colors',
                row.highlight && 'bg-muted/5 font-medium'
              )}
            >
              <td className="p-3 sticky left-0 bg-card">
                <MetricLabel label={row.label} metricKey={row.key} />
              </td>
              {data.map((d: BalanceSheet, i: number) => (
                <td key={d.date} className="text-right p-3 font-mono whitespace-nowrap">
                  {formatFinancialValue((d as any)[row.key])}
                  <GrowthIndicator
                    current={(d as any)[row.key]}
                    previous={data[i + 1] ? (data[i + 1] as any)[row.key] : undefined}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Cash Flow Table
function CashFlowTable({ symbol, period }: { symbol: string; period: FinancialPeriod }) {
  const { data, isLoading } = useCashFlow(symbol, period, 4);

  if (isLoading) return <TableLoading />;
  if (!data || data.length === 0) return <TableEmpty message="No cash flow data available" />;

  const rows = [
    { label: 'Net Income', key: 'netIncome' },
    { label: 'Depreciation & Amortization', key: 'depreciationAndAmortization' },
    { label: 'Stock-based Compensation', key: 'stockBasedCompensation' },
    { label: 'Change in Working Capital', key: 'changeInWorkingCapital' },
    { label: 'Operating Cash Flow', key: 'netCashProvidedByOperatingActivities', highlight: true },
    { label: 'Capital Expenditures', key: 'capitalExpenditure' },
    { label: 'Acquisitions', key: 'acquisitionsNet' },
    { label: 'Investing Cash Flow', key: 'netCashUsedForInvestingActivites', highlight: true },
    { label: 'Debt Repayment', key: 'debtRepayment' },
    { label: 'Stock Repurchased', key: 'commonStockRepurchased' },
    { label: 'Dividends Paid', key: 'dividendsPaid' },
    { label: 'Financing Cash Flow', key: 'netCashUsedProvidedByFinancingActivities', highlight: true },
    { label: 'Free Cash Flow', key: 'freeCashFlow', highlight: true },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/20">
            <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-muted/20">
              Metric
            </th>
            {data.map((d: CashFlow) => (
              <th key={d.date} className="text-right p-3 font-medium text-muted-foreground whitespace-nowrap">
                {formatColumnHeader(d.date, period, d.calendarYear, d.period)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={cn(
                'border-b last:border-b-0 hover:bg-muted/10 transition-colors',
                row.highlight && 'bg-muted/5 font-medium'
              )}
            >
              <td className="p-3 sticky left-0 bg-card">
                <MetricLabel label={row.label} metricKey={row.key} />
              </td>
              {data.map((d: CashFlow, i: number) => (
                <td key={d.date} className="text-right p-3 font-mono whitespace-nowrap">
                  {formatFinancialValue((d as any)[row.key])}
                  <GrowthIndicator
                    current={(d as any)[row.key]}
                    previous={data[i + 1] ? (data[i + 1] as any)[row.key] : undefined}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Key Metrics Table
function KeyMetricsTable({ symbol, period }: { symbol: string; period: FinancialPeriod }) {
  const { data, isLoading } = useKeyMetrics(symbol, period, 4);

  if (isLoading) return <TableLoading />;
  if (!data || data.length === 0) return <TableEmpty message="No key metrics data available" />;

  const formatRatio = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    // Check for extreme/invalid values
    if (Math.abs(value) > 10000) return 'N/A';
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    return value.toFixed(2);
  };

  const formatPercent = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    // Check for extreme/invalid values
    if (Math.abs(value) > 100) return 'N/A'; // >10,000% is likely error
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const rows = [
    { label: 'P/E Ratio', key: 'peRatio', format: formatRatio },
    { label: 'P/B Ratio', key: 'pbRatio', format: formatRatio },
    { label: 'P/S Ratio', key: 'priceToSalesRatio', format: formatRatio },
    { label: 'EV/EBITDA', key: 'enterpriseValueOverEBITDA', format: formatRatio },
    { label: 'Return on Equity', key: 'roe', format: formatPercent },
    { label: 'ROIC', key: 'roic', format: formatPercent },
    { label: 'Current Ratio', key: 'currentRatio', format: formatRatio },
    { label: 'Debt to Equity', key: 'debtToEquity', format: formatRatio },
    { label: 'Dividend Yield', key: 'dividendYield', format: formatPercent },
    { label: 'Payout Ratio', key: 'payoutRatio', format: formatPercent },
    { label: 'Free Cash Flow/Share', key: 'freeCashFlowPerShare', format: formatRatio },
    { label: 'Book Value/Share', key: 'bookValuePerShare', format: formatRatio },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/20">
            <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-muted/20">
              Metric
            </th>
            {data.map((d: KeyMetrics) => (
              <th key={d.date} className="text-right p-3 font-medium text-muted-foreground whitespace-nowrap">
                {formatColumnHeader(d.date, period, d.calendarYear, d.period)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className="border-b last:border-b-0 hover:bg-muted/10 transition-colors"
            >
              <td className="p-3 sticky left-0 bg-card">
                <MetricLabel label={row.label} metricKey={row.key} />
              </td>
              {data.map((d: KeyMetrics) => (
                <td key={d.date} className="text-right p-3 font-mono whitespace-nowrap">
                  {row.format((d as any)[row.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
