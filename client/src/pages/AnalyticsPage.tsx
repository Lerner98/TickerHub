import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/GlassCard';
import { ChainIcon } from '@/components/CryptoIcon';
import { PriceChart } from '@/components/PriceChart';
import { NetworkStatsGrid } from '@/components/NetworkStats';
import { FullPageLoading, Skeleton } from '@/components/LoadingState';
import { cn, formatNumber, formatPercentage, formatCurrency } from '@/lib/utils';
import type { PriceData } from '@shared/schema';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3,
  Gauge,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AnalyticsPage() {
  const { data: prices, isLoading } = useQuery<PriceData[]>({
    queryKey: ['/api/prices'],
    refetchInterval: 30000,
  });

  const gainers = prices?.filter(p => p.priceChangePercentage24h > 0)
    .sort((a, b) => b.priceChangePercentage24h - a.priceChangePercentage24h)
    .slice(0, 5) || [];

  const losers = prices?.filter(p => p.priceChangePercentage24h < 0)
    .sort((a, b) => a.priceChangePercentage24h - b.priceChangePercentage24h)
    .slice(0, 5) || [];

  const totalMarketCap = prices?.reduce((sum, p) => sum + p.marketCap, 0) || 0;
  const totalVolume = prices?.reduce((sum, p) => sum + p.volume24h, 0) || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-6">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-primary" />
              Analytics
            </h1>
            <p className="text-muted-foreground">
              Market insights and network health metrics
            </p>
          </div>

          {isLoading ? (
            <FullPageLoading />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassCard className="p-5" glow="primary">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Total Market Cap</span>
                  </div>
                  <p className="text-2xl font-bold">${formatNumber(totalMarketCap)}</p>
                </GlassCard>

                <GlassCard className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <BarChart3 className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-sm text-muted-foreground">24h Volume</span>
                  </div>
                  <p className="text-2xl font-bold">${formatNumber(totalVolume)}</p>
                </GlassCard>

                <GlassCard className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <TrendingUp className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-sm text-muted-foreground">BTC Dominance</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {prices && prices[0] 
                      ? ((prices[0].marketCap / totalMarketCap) * 100).toFixed(1) 
                      : '0'}%
                  </p>
                </GlassCard>

                <GlassCard className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-chart-4/10">
                      <Gauge className="w-5 h-5 text-chart-4" />
                    </div>
                    <span className="text-sm text-muted-foreground">Active Cryptos</span>
                  </div>
                  <p className="text-2xl font-bold">{prices?.length || 0}+</p>
                </GlassCard>
              </div>

              <NetworkStatsGrid />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PriceChart coinId="bitcoin" coinName="Bitcoin" />
                <PriceChart coinId="ethereum" coinName="Ethereum" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <ArrowUpRight className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-semibold">Top Gainers (24h)</h3>
                  </div>

                  <div className="space-y-3">
                    {gainers.length > 0 ? gainers.map((coin, i) => (
                      <div 
                        key={coin.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-card/40"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground w-6">
                            {i + 1}
                          </span>
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            <img src={coin.image} alt={coin.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-medium">{coin.name}</p>
                            <p className="text-xs text-muted-foreground uppercase">{coin.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono">{formatCurrency(coin.price)}</p>
                          <Badge className="bg-accent/20 text-accent border-accent/30">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {formatPercentage(coin.priceChangePercentage24h)}
                          </Badge>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center text-muted-foreground py-4">No data available</p>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <ArrowDownRight className="w-5 h-5 text-destructive" />
                    </div>
                    <h3 className="font-semibold">Top Losers (24h)</h3>
                  </div>

                  <div className="space-y-3">
                    {losers.length > 0 ? losers.map((coin, i) => (
                      <div 
                        key={coin.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-card/40"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground w-6">
                            {i + 1}
                          </span>
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            <img src={coin.image} alt={coin.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-medium">{coin.name}</p>
                            <p className="text-xs text-muted-foreground uppercase">{coin.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono">{formatCurrency(coin.price)}</p>
                          <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {formatPercentage(coin.priceChangePercentage24h)}
                          </Badge>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center text-muted-foreground py-4">No data available</p>
                    )}
                  </div>
                </GlassCard>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
