import { useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/GlassCard';
import { ChainIcon } from '@/components/CryptoIcon';
import { BlockListSkeleton } from '@/components/LoadingState';
import { CopyButton } from '@/components/CopyButton';
import { NetworkStatsDisplay } from '@/components/NetworkStats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, formatBlockNumber, formatTimeAgo, truncateHash, detectSearchType } from '@/lib/utils';
import type { Block, ChainType } from '@shared/schema';
import { 
  Search, 
  Blocks, 
  ArrowLeft, 
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function ExplorerPage() {
  const params = useParams<{ chain: string }>();
  const [location, setLocation] = useLocation();
  const chain = (params.chain as ChainType) || 'ethereum';
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 25;

  const { data: blocks, isLoading, error } = useQuery<Block[]>({
    queryKey: ['/api/blocks', chain, String(limit), String(page)],
    refetchInterval: 15000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const { type } = detectSearchType(searchQuery);
    
    switch (type) {
      case 'block':
        setLocation(`/block/${searchQuery}?chain=${chain}`);
        break;
      case 'transaction':
        setLocation(`/tx/${searchQuery}`);
        break;
      case 'address':
        setLocation(`/address/${searchQuery}`);
        break;
      default:
        setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const switchChain = (newChain: ChainType) => {
    setLocation(`/explorer/${newChain}`);
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-6">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                  <Blocks className="w-7 h-7 text-primary" />
                  Block Explorer
                </h1>
                <p className="text-muted-foreground capitalize">{chain} Network</p>
              </div>
            </div>

            <div className="flex gap-2">
              {(['ethereum', 'bitcoin'] as ChainType[]).map((c) => (
                <Button
                  key={c}
                  variant={chain === c ? "default" : "outline"}
                  onClick={() => switchChain(c)}
                  className={cn(
                    "gap-2",
                    chain === c && "bg-primary/90"
                  )}
                  data-testid={`button-chain-${c}`}
                >
                  <ChainIcon chain={c} size="sm" />
                  <span className="capitalize hidden sm:inline">{c}</span>
                </Button>
              ))}
            </div>
          </div>

          <GlassCard className="p-4">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by block number, transaction hash, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card/60"
                  data-testid="input-explorer-search"
                />
              </div>
              <Button type="submit" data-testid="button-search">
                Search
              </Button>
            </form>
          </GlassCard>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Latest Blocks</h2>
                  <Badge variant="outline" className="gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                    </span>
                    Live
                  </Badge>
                </div>

                {isLoading ? (
                  <BlockListSkeleton rows={10} />
                ) : blocks && blocks.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border/50">
                            <th className="pb-3 pr-4">Block</th>
                            <th className="pb-3 pr-4">Hash</th>
                            <th className="pb-3 pr-4">Txns</th>
                            <th className="pb-3 pr-4 hidden md:table-cell">Miner/Validator</th>
                            <th className="pb-3 pr-4 hidden lg:table-cell">Reward</th>
                            <th className="pb-3 text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blocks.map((block, index) => (
                            <tr 
                              key={block.hash}
                              className="border-b border-border/30 transition-colors hover:bg-primary/5"
                            >
                              <td className="py-3 pr-4">
                                <Link href={`/block/${block.number}?chain=${chain}`}>
                                  <span className="font-mono text-sm font-medium text-primary cursor-pointer hover:underline">
                                    #{formatBlockNumber(block.number)}
                                  </span>
                                </Link>
                              </td>
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm text-muted-foreground">
                                    {truncateHash(block.hash, 12, 8)}
                                  </span>
                                  <CopyButton text={block.hash} />
                                </div>
                              </td>
                              <td className="py-3 pr-4">
                                <Badge variant="secondary" className="text-xs">
                                  {block.transactionCount}
                                </Badge>
                              </td>
                              <td className="py-3 pr-4 hidden md:table-cell">
                                {block.miner && (
                                  <Link href={`/address/${block.miner}`}>
                                    <span className="font-mono text-xs text-muted-foreground cursor-pointer hover:text-primary">
                                      {truncateHash(block.miner, 8, 6)}
                                    </span>
                                  </Link>
                                )}
                              </td>
                              <td className="py-3 pr-4 hidden lg:table-cell">
                                <span className="text-sm">
                                  {block.reward} {chain === 'ethereum' ? 'ETH' : 'BTC'}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <span className="text-sm text-muted-foreground">
                                  {formatTimeAgo(block.timestamp)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                      <p className="text-sm text-muted-foreground">
                        Showing {limit} blocks per page
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          data-testid="button-prev-page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm px-3">Page {page}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => p + 1)}
                          data-testid="button-next-page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Blocks className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No blocks found</p>
                  </div>
                )}
              </GlassCard>
            </div>

            <div className="space-y-6">
              <NetworkStatsDisplay chain={chain} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
