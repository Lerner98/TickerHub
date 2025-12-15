/**
 * Watchlist Page
 *
 * Displays user's watched assets with real-time prices.
 * Uses batch APIs to efficiently fetch multiple assets.
 */

import { Link } from 'wouter';
import { Star, Search, TrendingUp } from 'lucide-react';
import { Header } from '@/components/layout';
import { PriceCard } from '@/components/PriceCard';
import { StockCard } from '@/components/StockCard';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useCryptoBatch } from '@/features/crypto';
import { useStocksBatch } from '@/features/stocks';
import { AuthDialog } from '@/components/auth';
import { useState, useMemo } from 'react';

export default function WatchlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: watchlistData, isLoading: watchlistLoading } = useWatchlist(isAuthenticated);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  // Separate crypto and stock IDs from watchlist
  const { cryptoIds, stockSymbols } = useMemo(() => {
    if (!watchlistData?.items) return { cryptoIds: [], stockSymbols: [] };

    const cryptoIds: string[] = [];
    const stockSymbols: string[] = [];

    watchlistData.items.forEach((item) => {
      if (item.assetType === 'crypto') {
        cryptoIds.push(item.assetId);
      } else if (item.assetType === 'stock') {
        stockSymbols.push(item.assetId);
      }
    });

    return { cryptoIds, stockSymbols };
  }, [watchlistData]);

  // Batch fetch prices
  const { data: cryptoData, isLoading: cryptoLoading } = useCryptoBatch(cryptoIds);
  const { data: stockData, isLoading: stocksLoading } = useStocksBatch(stockSymbols);

  const isLoading = authLoading || watchlistLoading;
  const isPricesLoading = cryptoLoading || stocksLoading;
  const isEmpty = !watchlistData?.items?.length;

  // Show auth prompt if not logged in
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-6">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Star className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Sign in to view your watchlist</h1>
              <p className="text-muted-foreground mb-6 max-w-md">
                Create an account to track your favorite cryptocurrencies and stocks in one place.
              </p>
              <Button onClick={() => setAuthDialogOpen(true)}>
                Sign in to continue
              </Button>
            </div>
          </div>
        </main>
        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          defaultMode="login"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-6">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              Watchlist
            </h1>
            <p className="text-muted-foreground">
              Track your favorite assets in real-time
            </p>
          </div>

          {isLoading ? (
            <WatchlistSkeleton />
          ) : isEmpty ? (
            <EmptyState />
          ) : (
            <div className="space-y-8">
              {/* Crypto Section */}
              {cryptoIds.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Cryptocurrencies ({cryptoIds.length})
                  </h2>
                  {isPricesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {cryptoIds.map((id) => (
                        <Skeleton key={id} className="h-48 rounded-lg" />
                      ))}
                    </div>
                  ) : cryptoData && cryptoData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {cryptoData.map((coin) => (
                        <PriceCard key={coin.id} coin={coin} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Unable to load crypto prices</p>
                  )}
                </section>
              )}

              {/* Stocks Section */}
              {stockSymbols.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Stocks ({stockSymbols.length})
                  </h2>
                  {isPricesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {stockSymbols.map((symbol) => (
                        <Skeleton key={symbol} className="h-48 rounded-lg" />
                      ))}
                    </div>
                  ) : stockData && stockData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {stockData.map((stock) => (
                        <StockCard key={stock.id} stock={stock} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Unable to load stock prices</p>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <GlassCard className="p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Star className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
        <p className="text-muted-foreground mb-6">
          Start tracking assets by clicking the star icon on any cryptocurrency or stock card.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <Search className="w-4 h-4" />
              Browse Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Explore Markets
            </Button>
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}

function WatchlistSkeleton() {
  return (
    <div className="space-y-8">
      <section>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </section>
    </div>
  );
}
