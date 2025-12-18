/**
 * Stock Chart Component
 *
 * Professional-grade stock chart using TradingView Lightweight Charts.
 * Supports multiple timeframes and real-time data updates.
 */

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle, AreaSeries, type IChartApi, type AreaData, type Time } from 'lightweight-charts';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';
import { Loader2 } from 'lucide-react';

type Timeframe = '1D' | '7D' | '30D' | '1Y';

interface ChartDataPoint {
  timestamp: number;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

interface StockChartProps {
  symbol: string;
  className?: string;
}

const timeframeOptions: { value: Timeframe; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '7D', label: '7D' },
  { value: '30D', label: '30D' },
  { value: '1Y', label: '1Y' },
];

async function fetchChartData(symbol: string, timeframe: Timeframe): Promise<ChartDataPoint[]> {
  const response = await fetch(`/api/stocks/${symbol}/chart?timeframe=${timeframe}`);
  if (!response.ok) {
    throw new Error('Failed to fetch chart data');
  }
  return response.json();
}

export function StockChart({ symbol, className }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('30D');

  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ['stockChart', symbol, timeframe],
    queryFn: () => fetchChartData(symbol, timeframe),
    staleTime: 60_000, // 1 minute
    retry: 1,
  });

  // Calculate price change for color
  const priceChange = chartData && chartData.length > 1
    ? chartData[chartData.length - 1].price - chartData[0].price
    : 0;
  const isPositive = priceChange >= 0;

  // Initialize and update chart when data or timeframe changes
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Remove existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.6)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: 'rgba(0, 0, 0, 0.8)',
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: 'rgba(0, 0, 0, 0.8)',
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: timeframe === '1D' || timeframe === '7D',
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: timeframe === '1D' ? 8 : timeframe === '7D' ? 10 : 12,
        minBarSpacing: 4,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
    });

    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Add data if available
    if (chartData && chartData.length > 0) {
      const lineColor = isPositive ? '#10b981' : '#ef4444';
      const topColor = isPositive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
      const bottomColor = isPositive ? 'rgba(16, 185, 129, 0.0)' : 'rgba(239, 68, 68, 0.0)';

      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor,
        topColor,
        bottomColor,
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: lineColor,
        crosshairMarkerBackgroundColor: '#fff',
      });

      // Transform data for lightweight-charts
      // Sort by timestamp and ensure unique values
      const sortedData = [...chartData].sort((a, b) => a.timestamp - b.timestamp);
      const areaData: AreaData<Time>[] = sortedData.map((point) => ({
        time: (Math.floor(point.timestamp / 1000)) as Time,
        value: point.price,
      }));

      areaSeries.setData(areaData);
      seriesRef.current = areaSeries;

      // Fit content after data is set
      chart.timeScale().fitContent();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [chartData, timeframe, isPositive]);

  return (
    <GlassCard className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Price Chart</h3>

        {/* Timeframe Tabs */}
        <div className="flex gap-1 bg-muted/30 rounded-lg p-1" role="tablist" aria-label="Chart timeframe">
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeframe(option.value)}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                timeframe === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              role="tab"
              aria-selected={timeframe === option.value}
              aria-label={`${option.label} timeframe`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Chart data unavailable</p>
              <p className="text-xs mt-1">API key may not be configured</p>
            </div>
          </div>
        )}

        <div
          ref={chartContainerRef}
          className="w-full h-[300px]"
        />
      </div>

      {/* Stats Row */}
      {chartData && chartData.length > 0 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50 text-sm">
          <div>
            <span className="text-muted-foreground">Period High: </span>
            <span className="font-medium">
              ${Math.max(...chartData.map(d => d.price)).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Period Low: </span>
            <span className="font-medium">
              ${Math.min(...chartData.map(d => d.price)).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Change: </span>
            <span className={cn('font-medium', isPositive ? 'text-accent' : 'text-destructive')}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({((priceChange / chartData[0].price) * 100).toFixed(2)}%)
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export default StockChart;
