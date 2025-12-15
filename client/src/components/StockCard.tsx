import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { GlassCard } from './GlassCard';
import { WatchlistButton } from './WatchlistButton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Building2 } from 'lucide-react';
import type { StockAsset } from '@shared/schema';

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
