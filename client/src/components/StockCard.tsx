import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn, formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';
import { GlassCard } from './GlassCard';
import { WatchlistButton } from './WatchlistButton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, Building2, Loader2 } from 'lucide-react';
import type { StockAsset } from '@shared/schema';

// FMP Mover type from API
interface FMPMover {
  symbol: string;
  name: string;
  change: number;
  price: number;
  changesPercentage: number;
}

// Convert FMP mover to StockAsset for display
function fmpMoverToStockAsset(mover: FMPMover): StockAsset {
  return {
    id: mover.symbol,
    symbol: mover.symbol,
    name: mover.name,
    price: mover.price,
    changePercent24h: mover.changesPercentage,
    volume24h: 0,
    high24h: mover.price,
    low24h: mover.price,
    exchange: 'US',
  };
}

interface StockCardProps {
  stock: StockAsset;
  rank?: number;
}

export function StockCard({ stock, rank }: StockCardProps) {
  const isPositive = stock.changePercent24h >= 0;

  return (
    <GlassCard className="p-5 group" glow={isPositive ? 'accent' : 'none'}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            {rank && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted text-xs font-bold flex items-center justify-center">
                {rank}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{stock.name}</h3>
            <p className="text-sm text-muted-foreground uppercase">{stock.symbol}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WatchlistButton assetId={stock.symbol} assetType="stock" />
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
            {formatPercentage(stock.changePercent24h)}
          </Badge>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold tracking-tight">
          {formatCurrency(stock.price)}
        </p>
        <p className="text-sm text-muted-foreground">
          {stock.exchange}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Open: </span>
          <span className="text-foreground">{stock.open ? formatCurrency(stock.open) : '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Prev: </span>
          <span className="text-foreground">{stock.previousClose ? formatCurrency(stock.previousClose) : '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">High: </span>
          <span className="text-foreground">{formatCurrency(stock.high24h)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Low: </span>
          <span className="text-foreground">{formatCurrency(stock.low24h)}</span>
        </div>
      </div>
    </GlassCard>
  );
}

export function TopStocksList({ stocks }: { stocks: StockAsset[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {stocks.slice(0, 8).map((stock, i) => (
        <StockCard key={stock.id} stock={stock} rank={i + 1} />
      ))}
    </div>
  );
}

type StockSortMetric = 'price' | 'volume' | 'gainers' | 'losers';

interface TopStocksWithFilterProps {
  stocks: StockAsset[];
  limit?: number;
  title?: string;
}

const STOCK_SORT_OPTIONS: { value: StockSortMetric; label: string }[] = [
  { value: 'price', label: 'Price' },
  { value: 'volume', label: 'Most Active' },
  { value: 'gainers', label: 'Top Gainers' },
  { value: 'losers', label: 'Top Losers' },
];

// Map sort metric to FMP endpoint
const FMP_ENDPOINT_MAP: Record<string, string> = {
  gainers: '/api/stocks/movers/gainers',
  losers: '/api/stocks/movers/losers',
  volume: '/api/stocks/movers/actives',
};

async function fetchFMPMovers(endpoint: string): Promise<FMPMover[] | null> {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) return null;
    const data = await response.json();
    // Check if FMP returned actual data or error
    if (data.error || !Array.isArray(data)) return null;
    return data;
  } catch {
    return null;
  }
}

export function TopStocksWithFilter({
  stocks,
  limit = 6,
  title = 'Top Stocks'
}: TopStocksWithFilterProps) {
  const [sortBy, setSortBy] = useState<StockSortMetric>('gainers');

  // Fetch FMP movers for gainers/losers/volume
  const fmpEndpoint = FMP_ENDPOINT_MAP[sortBy];
  const { data: fmpMovers, isLoading: fmpLoading } = useQuery({
    queryKey: ['fmp-movers', sortBy],
    queryFn: () => fetchFMPMovers(fmpEndpoint),
    enabled: !!fmpEndpoint, // Only fetch for gainers/losers/volume
    staleTime: 5 * 60 * 1000, // 5 minutes (matches server cache)
    retry: false,
  });

  // Use FMP data if available, otherwise fall back to local sorting
  const displayStocks = useMemo(() => {
    // If we have FMP data for this metric, use it
    if (fmpEndpoint && fmpMovers && fmpMovers.length > 0) {
      return fmpMovers.slice(0, limit).map(fmpMoverToStockAsset);
    }

    // Fallback to local sorting
    const sorted = [...stocks];

    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'volume':
        sorted.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'gainers':
        sorted.sort((a, b) => b.changePercent24h - a.changePercent24h);
        break;
      case 'losers':
        sorted.sort((a, b) => a.changePercent24h - b.changePercent24h);
        break;
    }

    return sorted.slice(0, limit);
  }, [stocks, sortBy, limit, fmpMovers, fmpEndpoint]);

  // Show loading only when actively fetching FMP data
  const isLoading = fmpEndpoint && fmpLoading;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as StockSortMetric)}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {STOCK_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayStocks.map((stock, i) => (
            <StockCard key={stock.id} stock={stock} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
