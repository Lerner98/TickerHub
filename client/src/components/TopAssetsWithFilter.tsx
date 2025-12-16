import { useState, useMemo } from 'react';
import { GlassCard } from './GlassCard';
import { CryptoIcon } from './CryptoIcon';
import { WatchlistButton } from './WatchlistButton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import type { PriceData } from '@shared/schema';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

type SortMetric = 'market_cap' | 'volume' | 'gainers' | 'losers' | 'price';

interface TopAssetsWithFilterProps {
  coins: PriceData[];
  limit?: number;
  title?: string;
}

const SORT_OPTIONS: { value: SortMetric; label: string }[] = [
  { value: 'market_cap', label: 'Market Cap' },
  { value: 'volume', label: '24h Volume' },
  { value: 'gainers', label: 'Top Gainers' },
  { value: 'losers', label: 'Top Losers' },
  { value: 'price', label: 'Price' },
];

export function TopAssetsWithFilter({
  coins,
  limit = 8,
  title = 'Top Cryptocurrencies'
}: TopAssetsWithFilterProps) {
  const [sortBy, setSortBy] = useState<SortMetric>('market_cap');

  const sortedCoins = useMemo(() => {
    const sorted = [...coins];

    switch (sortBy) {
      case 'market_cap':
        sorted.sort((a, b) => b.marketCap - a.marketCap);
        break;
      case 'volume':
        sorted.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'gainers':
        sorted.sort((a, b) => b.priceChangePercentage24h - a.priceChangePercentage24h);
        break;
      case 'losers':
        sorted.sort((a, b) => a.priceChangePercentage24h - b.priceChangePercentage24h);
        break;
      case 'price':
        sorted.sort((a, b) => b.price - a.price);
        break;
    }

    return sorted.slice(0, limit);
  }, [coins, sortBy, limit]);

  const getMetricLabel = () => {
    const option = SORT_OPTIONS.find(o => o.value === sortBy);
    return option?.label || 'Market Cap';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortMetric)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedCoins.map((coin, i) => (
          <AssetCard key={coin.id} coin={coin} rank={i + 1} metric={sortBy} />
        ))}
      </div>
    </div>
  );
}

interface AssetCardProps {
  coin: PriceData;
  rank: number;
  metric: SortMetric;
}

function AssetCard({ coin, rank, metric }: AssetCardProps) {
  const isPositive = coin.priceChangePercentage24h >= 0;

  const sparklineData = coin.sparkline?.map((price, i) => ({
    value: price,
    index: i,
  })) || [];

  // Show the relevant metric value based on current sort
  const getMetricDisplay = () => {
    switch (metric) {
      case 'volume':
        return (
          <p className="text-xs text-muted-foreground">
            Vol: {formatNumber(coin.volume24h)}
          </p>
        );
      case 'market_cap':
        return (
          <p className="text-xs text-muted-foreground">
            MCap: {formatNumber(coin.marketCap)}
          </p>
        );
      case 'gainers':
      case 'losers':
        return (
          <p className="text-xs text-muted-foreground">
            24h: {formatPercentage(coin.priceChangePercentage24h)}
          </p>
        );
      case 'price':
      default:
        return (
          <p className="text-xs text-muted-foreground">
            Vol: {formatNumber(coin.volume24h)}
          </p>
        );
    }
  };

  return (
    <GlassCard className="p-5 group" glow={isPositive ? 'accent' : 'none'}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <CryptoIcon
              symbol={coin.symbol}
              image={coin.image}
              size="lg"
            />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted text-xs font-bold flex items-center justify-center">
              {rank}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{coin.name}</h3>
            <p className="text-sm text-muted-foreground uppercase">{coin.symbol}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WatchlistButton assetId={coin.id} assetType="crypto" />
          <Badge
            variant={isPositive ? "default" : "destructive"}
            className={cn(
              "gap-1",
              isPositive && "bg-accent/20 text-accent border-accent/30"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {formatPercentage(coin.priceChangePercentage24h)}
          </Badge>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold tracking-tight">
          {formatCurrency(coin.price)}
        </p>
        {getMetricDisplay()}
      </div>

      {sparklineData.length > 0 && (
        <div className="h-16 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`gradient-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
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
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"}
                strokeWidth={2}
                fill={`url(#gradient-${coin.id})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}
