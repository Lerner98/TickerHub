/**
 * Sentiment Gauge Component
 *
 * Visual meter showing AI-generated sentiment analysis.
 * Score ranges from 1 (Bearish) to 10 (Bullish).
 */

import { cn } from '@/lib/utils';

interface SentimentGaugeProps {
  score: number; // 1-10
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sentimentColors: Record<string, { bg: string; text: string; glow: string }> = {
  Bearish: { bg: 'bg-red-500', text: 'text-red-500', glow: 'shadow-red-500/30' },
  'Somewhat Bearish': { bg: 'bg-orange-500', text: 'text-orange-500', glow: 'shadow-orange-500/30' },
  Neutral: { bg: 'bg-yellow-500', text: 'text-yellow-500', glow: 'shadow-yellow-500/30' },
  'Somewhat Bullish': { bg: 'bg-lime-500', text: 'text-lime-500', glow: 'shadow-lime-500/30' },
  Bullish: { bg: 'bg-green-500', text: 'text-green-500', glow: 'shadow-green-500/30' },
};

const sizes = {
  sm: { width: 'w-24', height: 'h-2', text: 'text-xs' },
  md: { width: 'w-32', height: 'h-3', text: 'text-sm' },
  lg: { width: 'w-48', height: 'h-4', text: 'text-base' },
};

export function SentimentGauge({
  score,
  label,
  size = 'md',
  showLabel = true,
  className,
}: SentimentGaugeProps) {
  const colors = sentimentColors[label] || sentimentColors.Neutral;
  const sizeClasses = sizes[size];
  const percentage = ((score - 1) / 9) * 100; // Convert 1-10 to 0-100%

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between gap-2">
          <span className={cn('font-medium', sizeClasses.text, colors.text)}>{label}</span>
          <span className={cn('text-muted-foreground', sizeClasses.text)}>{score}/10</span>
        </div>
      )}
      <div
        className={cn(
          'relative rounded-full bg-muted overflow-hidden',
          sizeClasses.width,
          sizeClasses.height
        )}
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
            colors.bg,
            `shadow-lg ${colors.glow}`
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Compact sentiment badge for inline display
 */
export function SentimentBadge({
  label,
  score,
  className,
}: {
  label: string;
  score: number;
  className?: string;
}) {
  const colors = sentimentColors[label] || sentimentColors.Neutral;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        'bg-opacity-20 border border-current/20',
        colors.text,
        className
      )}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full', colors.bg)}
        aria-hidden="true"
      />
      {label} ({score})
    </span>
  );
}
