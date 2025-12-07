import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { GlassCard } from './GlassCard';
import { CryptoIcon } from './CryptoIcon';
import { TableRowSkeleton } from './LoadingState';
import { cn, formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';
import type { PriceData } from '@shared/schema';
import { TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface MarketTableProps {
  limit?: number;
}

export function MarketTable({ limit = 10 }: MarketTableProps) {
  const { data: coins, isLoading } = useQuery<PriceData[]>({
    queryKey: ['/api/prices'],
    refetchInterval: 30000,
  });

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Market Overview</h3>
          <p className="text-sm text-muted-foreground">Top cryptocurrencies by market cap</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-12 text-xs uppercase tracking-wide">#</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Name</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wide">Price</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wide">24h %</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wide hidden md:table-cell">Volume</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wide hidden lg:table-cell">Market Cap</TableHead>
              <TableHead className="w-28 text-xs uppercase tracking-wide hidden xl:table-cell">Last 7 Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: limit }).map((_, i) => (
                <TableRowSkeleton key={i} columns={7} />
              ))
            ) : coins ? (
              coins.slice(0, limit).map((coin, index) => {
                const isPositive = coin.priceChangePercentage24h >= 0;
                const sparklineData = coin.sparkline?.map((price, i) => ({
                  value: price,
                  index: i,
                })) || [];

                return (
                  <TableRow 
                    key={coin.id}
                    className={cn(
                      "border-border/30 cursor-pointer transition-colors",
                      "hover:bg-primary/5 group"
                    )}
                    data-testid={`market-row-${coin.id}`}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <CryptoIcon 
                          symbol={coin.symbol} 
                          image={coin.image} 
                          size="sm" 
                        />
                        <div>
                          <p className="font-medium">{coin.name}</p>
                          <p className="text-xs text-muted-foreground uppercase">
                            {coin.symbol}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(coin.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 font-medium",
                        isPositive ? "text-accent" : "text-destructive"
                      )}>
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {formatPercentage(coin.priceChangePercentage24h)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono hidden md:table-cell">
                      {formatNumber(coin.volume24h)}
                    </TableCell>
                    <TableCell className="text-right font-mono hidden lg:table-cell">
                      {formatNumber(coin.marketCap)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {sparklineData.length > 0 && (
                        <div className="h-10 w-24">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparklineData}>
                              <defs>
                                <linearGradient 
                                  id={`sparkline-${coin.id}`} 
                                  x1="0" y1="0" x2="0" y2="1"
                                >
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
                                strokeWidth={1.5}
                                fill={`url(#sparkline-${coin.id})`}
                                dot={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : null}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  );
}
