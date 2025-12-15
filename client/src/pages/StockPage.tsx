import { useParams, Link } from 'wouter';
import { Header } from '@/components/layout';
import { GlassCard } from '@/components/GlassCard';
import { StockChart } from '@/components/StockChart';
import { FullPageLoading } from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { useStock } from '@/features/stocks';
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Activity,
} from 'lucide-react';

export default function StockPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol?.toUpperCase() || '';

  const { data: stock, isLoading } = useStock(symbol);

  const isPositive = stock ? stock.changePercent24h >= 0 : true;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-6">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                {stock?.name || symbol}
              </h1>
              <p className="text-muted-foreground mt-1">{symbol}</p>
            </div>
          </div>

          {isLoading ? (
            <FullPageLoading />
          ) : stock ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GlassCard className="p-6 lg:col-span-2" glow={isPositive ? 'accent' : 'none'}>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-4xl font-bold tracking-tight">
                        {formatCurrency(stock.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={isPositive ? 'default' : 'destructive'}
                          className={cn(
                            'gap-1',
                            isPositive && 'bg-accent/20 text-accent border-accent/30'
                          )}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {formatPercentage(stock.changePercent24h)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {isPositive ? '+' : ''}
                          {formatCurrency(stock.change24h)} today
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Exchange</p>
                      <p className="font-semibold">{stock.exchange}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">Open</span>
                      </div>
                      <p className="font-semibold">
                        {stock.open ? formatCurrency(stock.open) : '-'}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">Prev Close</span>
                      </div>
                      <p className="font-semibold">
                        {stock.previousClose ? formatCurrency(stock.previousClose) : '-'}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">High</span>
                      </div>
                      <p className="font-semibold">{formatCurrency(stock.high24h)}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">Low</span>
                      </div>
                      <p className="font-semibold">{formatCurrency(stock.low24h)}</p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Market Info
                  </h2>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">Symbol</span>
                      <span className="font-mono font-semibold">{stock.symbol}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">Exchange</span>
                      <span className="font-semibold">{stock.exchange}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">Day Range</span>
                      <span className="text-sm">
                        {formatCurrency(stock.low24h)} - {formatCurrency(stock.high24h)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Type</span>
                      <Badge variant="outline">Stock</Badge>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* TradingView-style Chart */}
              <StockChart symbol={symbol} />
            </>
          ) : (
            <GlassCard className="p-8 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Stock Not Found</h2>
              <p className="text-muted-foreground mb-4">
                No data found for symbol: {symbol}
              </p>
              <Link href="/dashboard">
                <Button data-testid="button-back-to-dashboard">Back to Dashboard</Button>
              </Link>
            </GlassCard>
          )}
        </div>
      </main>
    </div>
  );
}
