/**
 * AI Insights Card Component
 *
 * Displays AI-generated stock summary with sentiment,
 * key points, catalysts, and risks.
 *
 * Uses lazy loading - only fetches when user clicks "Show AI Insights"
 * to conserve API quota.
 */

import { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useStockSummary, type StockSummary } from '@/hooks/useStockSummary';
import { SentimentGauge, SentimentBadge } from './SentimentGauge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIInsightsCardProps {
  symbol: string;
  className?: string;
  compact?: boolean;
}

export function AIInsightsCard({ symbol, className, compact = false }: AIInsightsCardProps) {
  // Lazy loading: don't auto-fetch, wait for user to click
  const [shouldFetch, setShouldFetch] = useState(false);
  const { summary, isLoading, isFetching, refetch } = useStockSummary(symbol, shouldFetch);

  // Initial state: show "Show AI Insights" button
  if (!shouldFetch) {
    return (
      <div className={cn('rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-6', className)}>
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">AI Stock Analysis</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Get AI-powered sentiment analysis, key insights, and risk assessment
            </p>
          </div>
          <Button
            onClick={() => setShouldFetch(true)}
            className="gap-2"
            variant="default"
          >
            <Sparkles className="w-4 h-4" />
            Show AI Insights
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('rounded-lg border bg-card p-4', className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Generating AI insights...</span>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={cn('rounded-lg border bg-card/50 p-4', className)}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">AI insights unavailable</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 px-2" aria-label="Retry loading AI insights">
              <RefreshCw className="w-3 h-3" aria-hidden="true" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            AI analysis could not be generated. This may be due to API quota limits or temporary service issues. Try again later.
          </p>
        </div>
      </div>
    );
  }

  if (compact) {
    return <CompactInsights summary={summary} className={className} />;
  }

  return <FullInsights summary={summary} isFetching={isFetching} refetch={refetch} className={className} />;
}

function CompactInsights({ summary, className }: { summary: StockSummary; className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI Analysis</span>
        </div>
        {summary.sentiment && (
          <SentimentBadge label={summary.sentiment.label} score={summary.sentiment.score} />
        )}
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">{summary.summary}</p>
    </div>
  );
}

function FullInsights({
  summary,
  isFetching,
  refetch,
  className,
}: {
  summary: StockSummary;
  isFetching: boolean;
  refetch: () => void;
  className?: string;
}) {
  const generatedAt = new Date(summary.generatedAt);
  const timeAgo = getTimeAgo(generatedAt);

  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium">AI Analysis</span>
          <span className="text-xs text-muted-foreground">• {timeAgo}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-7 px-2"
          aria-label="Refresh AI analysis"
        >
          <RefreshCw className={cn('w-3 h-3', isFetching && 'animate-spin')} aria-hidden="true" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Sentiment */}
        {summary.sentiment && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <SentimentGauge score={summary.sentiment.score} label={summary.sentiment.label} size="lg" />
            </div>
          </div>
        )}

        {/* Summary */}
        <p className="text-sm text-foreground/90 leading-relaxed">{summary.summary}</p>

        {/* Key Points */}
        {summary.keyPoints && (
          <div className="grid gap-3 sm:grid-cols-3">
            {summary.keyPoints.positive?.length > 0 && (
              <KeyPointsList
                title="Bullish"
                icon={TrendingUp}
                items={summary.keyPoints.positive}
                colorClass="text-green-500"
              />
            )}
            {summary.keyPoints.negative?.length > 0 && (
              <KeyPointsList
                title="Bearish"
                icon={TrendingDown}
                items={summary.keyPoints.negative}
                colorClass="text-red-500"
              />
            )}
            {summary.keyPoints.neutral?.length > 0 && (
              <KeyPointsList
                title="Neutral"
                icon={AlertCircle}
                items={summary.keyPoints.neutral}
                colorClass="text-yellow-500"
              />
            )}
          </div>
        )}

        {/* Catalysts & Risks */}
        {((summary.catalysts?.length ?? 0) > 0 || (summary.risks?.length ?? 0) > 0) && (
          <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t">
            {(summary.catalysts?.length ?? 0) > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Potential Catalysts
                </h4>
                <ul className="space-y-1">
                  {summary.catalysts?.map((catalyst, i) => (
                    <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">▲</span>
                      {catalyst}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(summary.risks?.length ?? 0) > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Key Risks
                </h4>
                <ul className="space-y-1">
                  {summary.risks?.map((risk, i) => (
                    <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                      <span className="text-red-500 mt-0.5">▼</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Data: {summary.dataSource || 'AI Analysis'}
        </div>
      </div>
    </div>
  );
}

function KeyPointsList({
  title,
  icon: Icon,
  items,
  colorClass,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: string[];
  colorClass: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className={cn('w-3.5 h-3.5', colorClass)} />
        <span className={cn('text-xs font-medium', colorClass)}>{title}</span>
      </div>
      <ul className="space-y-1">
        {items.slice(0, 3).map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground leading-snug">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  // Handle invalid dates
  if (isNaN(date.getTime())) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 0) return ''; // Future date = invalid
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}
