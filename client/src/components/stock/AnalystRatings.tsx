/**
 * Analyst Ratings Component
 *
 * Displays:
 * - Buy/Hold/Sell consensus gauge
 * - Price target vs current price
 * - Recent analyst grades (upgrades/downgrades)
 */

import { TrendingUp, TrendingDown, Minus, Target, Calendar, Building2, Loader2 } from 'lucide-react';
import { useGradeConsensus, useGrades, usePriceTarget, type GradeConsensus, type StockGrade } from '@/hooks/useAnalystData';
import { EarningsHistory } from './EarningsHistory';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';

interface AnalystRatingsProps {
  symbol: string;
  currentPrice?: number;
  className?: string;
}

export function AnalystRatings({ symbol, currentPrice, className }: AnalystRatingsProps) {
  const { data: consensus, isLoading: consensusLoading } = useGradeConsensus(symbol);
  const { data: priceTarget, isLoading: priceTargetLoading } = usePriceTarget(symbol);
  const { data: grades, isLoading: gradesLoading } = useGrades(symbol);

  const isLoading = consensusLoading || priceTargetLoading;

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Top Row: Consensus + Price Target */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Consensus Gauge */}
        {consensus && <ConsensusGauge consensus={consensus} />}

        {/* Price Target Card */}
        {priceTarget && currentPrice && (
          <PriceTargetCard priceTarget={priceTarget} currentPrice={currentPrice} />
        )}
      </div>

      {/* Bottom Row: Earnings History + Recent Grades */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Earnings History */}
        <EarningsHistory symbol={symbol} />

        {/* Recent Grades */}
        {grades && grades.length > 0 && (
          <RecentGrades grades={grades.slice(0, 5)} />
        )}
      </div>

      {/* No Data State */}
      {!consensus && !priceTarget && !gradesLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No analyst data available for {symbol}</p>
        </div>
      )}
    </div>
  );
}

function ConsensusGauge({ consensus }: { consensus: GradeConsensus }) {
  const total = consensus.strongBuy + consensus.buy + consensus.hold + consensus.sell + consensus.strongSell;

  if (total === 0) return null;

  const buyPercent = ((consensus.strongBuy + consensus.buy) / total) * 100;
  const holdPercent = (consensus.hold / total) * 100;
  const sellPercent = ((consensus.sell + consensus.strongSell) / total) * 100;

  // Determine consensus color and label
  const getConsensusColor = (consensus: string) => {
    switch (consensus.toLowerCase()) {
      case 'strong buy':
      case 'buy':
        return 'text-green-500';
      case 'hold':
        return 'text-yellow-500';
      case 'sell':
      case 'strong sell':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Analyst Consensus
        </h3>
        <span className={cn('text-sm font-medium', getConsensusColor(consensus.consensus))}>
          {consensus.consensus}
        </span>
      </div>

      {/* Gauge Bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-muted mb-3">
        <div
          className="bg-green-500 transition-all"
          style={{ width: `${buyPercent}%` }}
        />
        <div
          className="bg-yellow-500 transition-all"
          style={{ width: `${holdPercent}%` }}
        />
        <div
          className="bg-red-500 transition-all"
          style={{ width: `${sellPercent}%` }}
        />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Buy</span>
          <span className="font-medium ml-auto">{consensus.strongBuy + consensus.buy}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">Hold</span>
          <span className="font-medium ml-auto">{consensus.hold}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Sell</span>
          <span className="font-medium ml-auto">{consensus.sell + consensus.strongSell}</span>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="mt-4 pt-3 border-t grid grid-cols-5 gap-1 text-center text-xs">
        <div>
          <div className="font-semibold text-green-600">{consensus.strongBuy}</div>
          <div className="text-muted-foreground">Strong Buy</div>
        </div>
        <div>
          <div className="font-semibold text-green-500">{consensus.buy}</div>
          <div className="text-muted-foreground">Buy</div>
        </div>
        <div>
          <div className="font-semibold text-yellow-500">{consensus.hold}</div>
          <div className="text-muted-foreground">Hold</div>
        </div>
        <div>
          <div className="font-semibold text-red-500">{consensus.sell}</div>
          <div className="text-muted-foreground">Sell</div>
        </div>
        <div>
          <div className="font-semibold text-red-600">{consensus.strongSell}</div>
          <div className="text-muted-foreground">Strong Sell</div>
        </div>
      </div>
    </div>
  );
}

interface PriceTargetCardProps {
  priceTarget: {
    targetHigh: number;
    targetLow: number;
    targetConsensus: number;
    targetMedian: number;
  };
  currentPrice: number;
}

function PriceTargetCard({ priceTarget, currentPrice }: PriceTargetCardProps) {
  const upside = ((priceTarget.targetConsensus - currentPrice) / currentPrice) * 100;
  const isPositive = upside > 0;

  // Calculate position of current price on the range
  const range = priceTarget.targetHigh - priceTarget.targetLow;
  const position = range > 0
    ? Math.min(100, Math.max(0, ((currentPrice - priceTarget.targetLow) / range) * 100))
    : 50;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        Price Target
      </h3>

      {/* Current vs Target */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-muted-foreground">Current</div>
          <div className="text-lg font-bold">{formatCurrency(currentPrice)}</div>
        </div>
        <div className={cn(
          'flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
          isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        )}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {formatPercentage(Math.abs(upside))} {isPositive ? 'upside' : 'downside'}
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Target</div>
          <div className="text-lg font-bold text-primary">{formatCurrency(priceTarget.targetConsensus)}</div>
        </div>
      </div>

      {/* Price Range Bar */}
      <div className="relative mb-2">
        <div className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-background border-2 border-primary rounded-full shadow-md"
          style={{ left: `calc(${position}% - 6px)` }}
        />
      </div>

      {/* Range Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Low: {formatCurrency(priceTarget.targetLow)}</span>
        <span>High: {formatCurrency(priceTarget.targetHigh)}</span>
      </div>

      {/* Median */}
      <div className="mt-3 pt-3 border-t text-center">
        <span className="text-xs text-muted-foreground">Median Target: </span>
        <span className="text-sm font-medium">{formatCurrency(priceTarget.targetMedian)}</span>
      </div>
    </div>
  );
}

function RecentGrades({ grades }: { grades: StockGrade[] }) {
  const getGradeColor = (grade: string) => {
    const lowerGrade = grade.toLowerCase();
    if (lowerGrade.includes('buy') || lowerGrade.includes('outperform') || lowerGrade.includes('overweight')) {
      return 'text-green-500 bg-green-500/10';
    }
    if (lowerGrade.includes('sell') || lowerGrade.includes('underperform') || lowerGrade.includes('underweight')) {
      return 'text-red-500 bg-red-500/10';
    }
    return 'text-yellow-500 bg-yellow-500/10';
  };

  const isUpgrade = (prev: string, next: string) => {
    const grades = ['sell', 'underperform', 'hold', 'neutral', 'buy', 'outperform', 'strong buy'];
    const prevIdx = grades.findIndex(g => prev.toLowerCase().includes(g));
    const nextIdx = grades.findIndex(g => next.toLowerCase().includes(g));
    return nextIdx > prevIdx;
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-primary" />
        Recent Analyst Actions
      </h3>

      <div className="space-y-3">
        {grades.map((grade, i) => {
          const upgraded = isUpgrade(grade.previousGrade, grade.newGrade);
          const date = new Date(grade.date);

          return (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                upgraded ? 'bg-green-500/10' : 'bg-red-500/10'
              )}>
                {upgraded ? (
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium truncate">{grade.gradingCompany}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={cn('px-1.5 py-0.5 rounded', getGradeColor(grade.previousGrade))}>
                    {grade.previousGrade}
                  </span>
                  <Minus className="w-2.5 h-2.5 text-muted-foreground" />
                  <span className={cn('px-1.5 py-0.5 rounded', getGradeColor(grade.newGrade))}>
                    {grade.newGrade}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
