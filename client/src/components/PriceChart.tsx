import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassCard } from './GlassCard';
import { ChartSkeleton } from './LoadingState';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatTimestamp } from '@/lib/utils';
import type { ChartDataPoint, TimeRange } from '@shared/schema';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid 
} from 'recharts';

interface PriceChartProps {
  coinId: string;
  coinName: string;
  className?: string;
}

const timeRanges: TimeRange[] = ['1D', '7D', '30D', '90D', '1Y'];

export function PriceChart({ coinId, coinName, className }: PriceChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7D');

  const { data: chartData, isLoading, error } = useQuery<ChartDataPoint[]>({
    queryKey: ['/api/chart', coinId, selectedRange],
    refetchInterval: 60000,
  });

  const isPositive = chartData && chartData.length >= 2 
    ? chartData[chartData.length - 1].price >= chartData[0].price 
    : true;

  return (
    <GlassCard className={cn("p-5", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold">{coinName} Price Chart</h3>
          <p className="text-sm text-muted-foreground">
            {selectedRange === '1D' ? 'Last 24 hours' : 
             selectedRange === '7D' ? 'Last 7 days' :
             selectedRange === '30D' ? 'Last 30 days' :
             selectedRange === '90D' ? 'Last 90 days' : 'Last year'}
          </p>
        </div>
        <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
          {timeRanges.map((range) => (
            <Button
              key={range}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRange(range)}
              className={cn(
                "px-3 py-1 text-xs",
                selectedRange === range && "bg-primary/20 text-primary"
              )}
              data-testid={`button-range-${range}`}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : chartData && chartData.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`chartGradient-${coinId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="0%" 
                    stopColor={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"} 
                    stopOpacity={0.3} 
                  />
                  <stop 
                    offset="100%" 
                    stopColor={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"} 
                    stopOpacity={0} 
                  />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
                vertical={false}
              />
              <XAxis 
                dataKey="timestamp"
                tickFormatter={(value) => {
                  const date = new Date(value * 1000);
                  if (selectedRange === '1D') {
                    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  }
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={80}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartDataPoint;
                    return (
                      <div className="bg-popover/95 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          {formatTimestamp(data.timestamp)}
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {formatCurrency(data.price)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"}
                strokeWidth={2}
                fill={`url(#chartGradient-${coinId})`}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  fill: isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : error ? (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
          <p className="text-destructive">Failed to load chart data</p>
          <p className="text-xs mt-1">Please try again later</p>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No chart data available
        </div>
      )}
    </GlassCard>
  );
}
