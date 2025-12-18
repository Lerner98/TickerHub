import { useParams, Link } from 'wouter';
import { useState } from 'react';
import { Header } from '@/components/layout';
import { GlassCard } from '@/components/GlassCard';
import { StockChart } from '@/components/StockChart';
import { FullPageLoading } from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewsList, CompanyProfile, AnalystRatings, FinancialsTable } from '@/components/stock';
import { AIInsightsCard } from '@/components/ai';
import { cn, formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';
import { useStock } from '@/features/stocks';
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  DollarSign,
  PieChart,
  Layers,
  Newspaper,
  Info,
  LineChart,
  Target,
  FileText,
} from 'lucide-react';

export default function StockPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol?.toUpperCase() || '';
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stock, isLoading } = useStock(symbol);

  const isPositive = stock ? stock.changePercent24h >= 0 : true;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-6">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 space-y-6">
          {/* Header with back button and stock name */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                {stock?.name || symbol}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-muted-foreground">{symbol}</span>
                {stock?.exchange && (
                  <Badge variant="outline" className="text-xs">
                    {stock.exchange}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <FullPageLoading />
          ) : stock ? (
            <>
              {/* Price and key metrics card */}
              <GlassCard className="p-6" glow={isPositive ? 'accent' : 'none'}>
                {/* Price header */}
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
                </div>

                {/* First row: Open, Prev Close, High, Low */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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

                {/* Second row: Market Cap, Volume, Sector, P/E Ratio */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wide">Market Cap</span>
                    </div>
                    <p className="font-semibold">
                      {stock.marketCap ? formatNumber(stock.marketCap) : 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wide">Volume</span>
                    </div>
                    <p className="font-semibold">
                      {stock.volume24h > 0 ? formatNumber(stock.volume24h) : 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Layers className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wide">Sector</span>
                    </div>
                    <p className="font-semibold text-sm truncate">
                      {stock.sector || 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <PieChart className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wide">P/E Ratio</span>
                    </div>
                    <p className="font-semibold">
                      {stock.peRatio ? stock.peRatio.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* Tabs for Chart, News, About */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex w-full max-w-xl overflow-x-auto mb-4 gap-1">
                  <TabsTrigger value="overview" className="gap-1.5 flex-shrink-0 text-xs sm:text-sm">
                    <LineChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Chart</span>
                  </TabsTrigger>
                  <TabsTrigger value="news" className="gap-1.5 flex-shrink-0 text-xs sm:text-sm">
                    <Newspaper className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">News</span>
                  </TabsTrigger>
                  <TabsTrigger value="about" className="gap-1.5 flex-shrink-0 text-xs sm:text-sm">
                    <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">About</span>
                  </TabsTrigger>
                  <TabsTrigger value="analyst" className="gap-1.5 flex-shrink-0 text-xs sm:text-sm">
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Analyst</span>
                  </TabsTrigger>
                  <TabsTrigger value="financials" className="gap-1.5 flex-shrink-0 text-xs sm:text-sm">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Financials</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <StockChart symbol={symbol} />
                </TabsContent>

                <TabsContent value="news">
                  <NewsList symbol={symbol} limit={10} />
                </TabsContent>

                <TabsContent value="about">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-full">
                    <div className="w-full">
                      <CompanyProfile symbol={symbol} />
                    </div>
                    <div className="w-full">
                      <AIInsightsCard symbol={symbol} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analyst">
                  <AnalystRatings symbol={symbol} currentPrice={stock.price} />
                </TabsContent>

                <TabsContent value="financials">
                  <FinancialsTable symbol={symbol} />
                </TabsContent>
              </Tabs>
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
