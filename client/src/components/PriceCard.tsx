import { cn, formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';
import { GlassCard } from './GlassCard';
import { CryptoIcon } from './CryptoIcon';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { PriceData } from '@shared/schema';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface PriceCardProps {
  coin: PriceData;
  rank?: number;
}

export function PriceCard({ coin, rank }: PriceCardProps) {
  const isPositive = coin.priceChangePercentage24h >= 0;
  
  const sparklineData = coin.sparkline?.map((price, i) => ({
    value: price,
    index: i,
  })) || [];

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
            {rank && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted text-xs font-bold flex items-center justify-center">
                {rank}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{coin.name}</h3>
            <p className="text-sm text-muted-foreground uppercase">{coin.symbol}</p>
          </div>
        </div>
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

      <div className="mb-4">
        <p className="text-2xl font-bold tracking-tight">
          {formatCurrency(coin.price)}
        </p>
        <p className="text-sm text-muted-foreground">
          Vol: {formatNumber(coin.volume24h)}
        </p>
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

export function TopCryptoList({ coins }: { coins: PriceData[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {coins.slice(0, 8).map((coin, i) => (
        <PriceCard key={coin.id} coin={coin} rank={i + 1} />
      ))}
    </div>
  );
}
