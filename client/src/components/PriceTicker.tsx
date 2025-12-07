import { useQuery } from '@tanstack/react-query';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { CryptoIcon } from './CryptoIcon';
import type { PriceData } from '@shared/schema';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function PriceTicker() {
  const { data: prices, isLoading } = useQuery<PriceData[]>({
    queryKey: ['/api/prices'],
    refetchInterval: 30000,
  });

  if (isLoading || !prices) {
    return (
      <div className="w-full overflow-hidden bg-card/40 border-y border-border/30">
        <div className="flex items-center gap-8 py-2 px-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-muted/50" />
              <div className="w-16 h-4 rounded bg-muted/50" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tickerContent = [...prices, ...prices].slice(0, 20);

  return (
    <div className="w-full overflow-hidden bg-card/40 border-y border-border/30">
      <div className="flex items-center animate-ticker-scroll">
        {tickerContent.map((coin, i) => (
          <div 
            key={`${coin.id}-${i}`}
            className="flex items-center gap-3 px-6 py-2 border-r border-border/20"
          >
            <CryptoIcon 
              symbol={coin.symbol} 
              image={coin.image} 
              size="sm" 
            />
            <span className="font-medium text-sm whitespace-nowrap">
              {coin.symbol.toUpperCase()}
            </span>
            <span className="font-mono text-sm whitespace-nowrap">
              {formatCurrency(coin.price)}
            </span>
            <span className={cn(
              "flex items-center gap-1 text-xs font-medium whitespace-nowrap",
              coin.priceChangePercentage24h >= 0 ? "text-accent" : "text-destructive"
            )}>
              {coin.priceChangePercentage24h >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {formatPercentage(coin.priceChangePercentage24h)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
