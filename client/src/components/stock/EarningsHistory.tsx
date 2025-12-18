/**
 * Earnings History Component
 *
 * Displays historical EPS and revenue data with beat/miss indicators.
 * Shows a table of recent quarters with actual vs estimated values.
 */

import { Calendar, TrendingUp, TrendingDown, Minus, DollarSign, BarChart3 } from 'lucide-react';
import { useEarningsHistory, type EarningsHistoryItem } from '@/hooks/useAnalystData';
import { cn, formatNumber, formatCurrency } from '@/lib/utils';

interface EarningsHistoryProps {
  symbol: string;
  className?: string;
}

export function EarningsHistory({ symbol, className }: EarningsHistoryProps) {
  const { data: earnings, isLoading } = useEarningsHistory(symbol);

  if (isLoading) {
    return (
      <div className={cn('rounded-lg border bg-card p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-muted rounded" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!earnings || earnings.length === 0) {
    return (
      <div className={cn('rounded-lg border bg-card/50 p-6', className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">No earnings history available</span>
        </div>
      </div>
    );
  }

  // Take last 8 quarters
  const recentEarnings = earnings.slice(0, 8);

  // Calculate beat/miss streak
  const streakInfo = calculateStreak(recentEarnings);

  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-medium">Earnings History</span>
        </div>
        {streakInfo && (
          <div className={cn(
            'text-xs px-2 py-1 rounded-full',
            streakInfo.type === 'beat' ? 'bg-green-500/10 text-green-500' :
            streakInfo.type === 'miss' ? 'bg-red-500/10 text-red-500' :
            'bg-muted text-muted-foreground'
          )}>
            {streakInfo.count} {streakInfo.type === 'beat' ? 'beat' : streakInfo.type === 'miss' ? 'miss' : 'quarter'} streak
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b bg-muted/10">
        <EarningsStat
          label="EPS Beat Rate"
          value={calculateBeatRate(recentEarnings, 'eps')}
          icon={DollarSign}
        />
        <EarningsStat
          label="Revenue Beat Rate"
          value={calculateBeatRate(recentEarnings, 'revenue')}
          icon={BarChart3}
        />
      </div>

      {/* Earnings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="text-left p-3 font-medium text-muted-foreground">Quarter</th>
              <th className="text-right p-3 font-medium text-muted-foreground">EPS</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Est.</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Surprise</th>
              <th className="text-right p-3 font-medium text-muted-foreground hidden sm:table-cell">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {recentEarnings.map((earning, i) => (
              <EarningsRow key={i} earning={earning} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EarningsRow({ earning }: { earning: EarningsHistoryItem }) {
  const eps = earning.eps;
  const epsEstimated = earning.epsEstimated;

  const hasBothEps = eps !== null && epsEstimated !== null;
  const epsSurprise = hasBothEps ? ((eps - epsEstimated) / Math.abs(epsEstimated)) * 100 : null;
  const epsBeat = hasBothEps ? eps >= epsEstimated : null;

  const quarterDate = new Date(earning.date);
  const quarter = `Q${Math.ceil((quarterDate.getMonth() + 1) / 3)} ${quarterDate.getFullYear()}`;

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
      <td className="p-3">
        <span className="font-medium">{quarter}</span>
      </td>
      <td className="text-right p-3 font-mono">
        {eps !== null ? `$${eps.toFixed(2)}` : '-'}
      </td>
      <td className="text-right p-3 font-mono text-muted-foreground">
        {epsEstimated !== null ? `$${epsEstimated.toFixed(2)}` : '-'}
      </td>
      <td className="p-3">
        <div className="flex items-center justify-center gap-1">
          {epsBeat !== null ? (
            <>
              {epsBeat ? (
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className={cn(
                'text-xs font-medium',
                epsBeat ? 'text-green-500' : 'text-red-500'
              )}>
                {epsSurprise !== null && (
                  <>
                    {epsSurprise >= 0 ? '+' : ''}{epsSurprise.toFixed(1)}%
                  </>
                )}
              </span>
            </>
          ) : (
            <Minus className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </td>
      <td className="text-right p-3 font-mono hidden sm:table-cell">
        {earning.revenue !== null ? formatNumber(earning.revenue) : '-'}
      </td>
    </tr>
  );
}

function EarningsStat({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: number | null;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const percentage = value !== null ? Math.round(value * 100) : null;

  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-muted/50">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn(
          'font-semibold',
          percentage !== null && percentage >= 50 ? 'text-green-500' :
          percentage !== null ? 'text-red-500' : 'text-muted-foreground'
        )}>
          {percentage !== null ? `${percentage}%` : 'N/A'}
        </p>
      </div>
    </div>
  );
}

function calculateBeatRate(earnings: EarningsHistoryItem[], type: 'eps' | 'revenue'): number | null {
  const validEarnings = earnings.filter(e => {
    if (type === 'eps') {
      return e.eps !== null && e.epsEstimated !== null;
    }
    return e.revenue !== null && e.revenueEstimated !== null;
  });

  if (validEarnings.length === 0) return null;

  const beats = validEarnings.filter(e => {
    if (type === 'eps') {
      return e.eps! >= e.epsEstimated!;
    }
    return e.revenue! >= e.revenueEstimated!;
  });

  return beats.length / validEarnings.length;
}

function calculateStreak(earnings: EarningsHistoryItem[]): { type: 'beat' | 'miss' | 'mixed'; count: number } | null {
  const validEarnings = earnings.filter(e => e.eps !== null && e.epsEstimated !== null);
  if (validEarnings.length === 0) return null;

  const firstBeat = validEarnings[0].eps! >= validEarnings[0].epsEstimated!;
  let count = 1;

  for (let i = 1; i < validEarnings.length; i++) {
    const beat = validEarnings[i].eps! >= validEarnings[i].epsEstimated!;
    if (beat === firstBeat) {
      count++;
    } else {
      break;
    }
  }

  return {
    type: firstBeat ? 'beat' : 'miss',
    count
  };
}
