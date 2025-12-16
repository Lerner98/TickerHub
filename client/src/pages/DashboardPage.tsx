import { Header } from '@/components/layout';
import { PriceChart } from '@/components/PriceChart';
import { MarketHours } from '@/components/MarketHours';
import { TopAssetsWithFilter } from '@/components/TopAssetsWithFilter';
import { TopStocksWithFilter } from '@/components/StockCard';
import { FullPageLoading } from '@/components/LoadingState';
import { usePrices } from '@/features/crypto';
import { useStocks } from '@/features/stocks';

export default function DashboardPage() {
  const { data: prices, isLoading: pricesLoading } = usePrices();
  const { data: stocks, isLoading: stocksLoading } = useStocks();

  const isLoading = pricesLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-6">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Real-time market overview at a glance
            </p>
          </div>

          {isLoading ? (
            <FullPageLoading />
          ) : (
            <>
              {/* Market Hours - Live status indicator */}
              <MarketHours />

              {/* Top Cryptocurrencies - With metric filter dropdown */}
              {prices && (
                <section>
                  <TopAssetsWithFilter coins={prices} limit={8} />
                </section>
              )}

              {/* Top Stocks - With filter dropdown */}
              {stocks && stocks.length > 0 && (
                <section>
                  <TopStocksWithFilter stocks={stocks} limit={6} />
                </section>
              )}

              {/* Featured Chart - Bitcoin price trend */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Bitcoin Price</h2>
                <PriceChart coinId="bitcoin" coinName="Bitcoin" />
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
