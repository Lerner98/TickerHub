import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { NetworkStatsGrid } from '@/components/NetworkStats';
import { PriceChart } from '@/components/PriceChart';
import { RecentBlocks } from '@/components/RecentBlocks';
import { MarketTable } from '@/components/MarketTable';
import { TopCryptoList } from '@/components/PriceCard';
import { FullPageLoading } from '@/components/LoadingState';
import type { PriceData } from '@shared/schema';

export default function DashboardPage() {
  const { data: prices, isLoading } = useQuery<PriceData[]>({
    queryKey: ['/api/prices'],
    refetchInterval: 30000,
  });

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
              Real-time cryptocurrency market data and blockchain analytics
            </p>
          </div>

          {isLoading ? (
            <FullPageLoading />
          ) : (
            <>
              {prices && (
                <section>
                  <h2 className="text-lg font-semibold mb-4">Top Cryptocurrencies</h2>
                  <TopCryptoList coins={prices} />
                </section>
              )}

              <section>
                <h2 className="text-lg font-semibold mb-4">Network Statistics</h2>
                <NetworkStatsGrid />
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section>
                  <RecentBlocks chain="ethereum" limit={8} />
                </section>
                <section>
                  <PriceChart coinId="bitcoin" coinName="Bitcoin" />
                </section>
              </div>

              <section>
                <MarketTable limit={10} />
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
