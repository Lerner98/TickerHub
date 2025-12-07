import { useParams, useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/GlassCard';
import { ChainIcon } from '@/components/CryptoIcon';
import { CopyButton } from '@/components/CopyButton';
import { FullPageLoading, Skeleton } from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatTimestamp, formatBlockNumber, truncateHash, formatTimeAgo } from '@/lib/utils';
import type { Block, Transaction, ChainType } from '@shared/schema';
import { 
  ArrowLeft, 
  ArrowRight,
  Blocks, 
  Clock,
  Hash,
  Layers,
  User,
  FileText,
  HardDrive,
  Fuel,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function BlockPage() {
  const params = useParams<{ number: string }>();
  const [location] = useLocation();
  const blockNumber = params.number || '';
  
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const chain: ChainType = (searchParams.get('chain') as ChainType) || 'ethereum';

  const { data: block, isLoading: isLoadingBlock } = useQuery<Block>({
    queryKey: ['/api/block', chain, blockNumber],
    enabled: !!blockNumber,
  });

  const { data: transactions, isLoading: isLoadingTx } = useQuery<Transaction[]>({
    queryKey: ['/api/block', chain, blockNumber, 'transactions'],
    enabled: !!blockNumber,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-6">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/explorer/${chain}`}>
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                  <Blocks className="w-7 h-7 text-primary" />
                  Block #{formatBlockNumber(parseInt(blockNumber))}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <ChainIcon chain={chain} size="sm" />
                  <span className="text-sm text-muted-foreground capitalize">{chain}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/block/${parseInt(blockNumber) - 1}?chain=${chain}`}>
                <Button variant="outline" size="sm" className="gap-1" data-testid="button-prev-block">
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
              </Link>
              <Link href={`/block/${parseInt(blockNumber) + 1}?chain=${chain}`}>
                <Button variant="outline" size="sm" className="gap-1" data-testid="button-next-block">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {isLoadingBlock ? (
            <FullPageLoading />
          ) : block ? (
            <>
              <GlassCard className="p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Block Overview
                </h2>

                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Hash className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">Block Hash</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm break-all">{block.hash}</p>
                        <CopyButton text={block.hash} />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Hash className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">Parent Hash</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/block/${block.number - 1}?chain=${chain}`}>
                          <span className="font-mono text-sm text-primary cursor-pointer hover:underline break-all">
                            {truncateHash(block.parentHash, 20, 16)}
                          </span>
                        </Link>
                        <CopyButton text={block.parentHash} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">Timestamp</span>
                      </div>
                      <p className="font-semibold">{formatTimeAgo(block.timestamp)}</p>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(block.timestamp)}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">Transactions</span>
                      </div>
                      <p className="font-semibold text-xl">{block.transactionCount}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <HardDrive className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">Size</span>
                      </div>
                      <p className="font-semibold">{(block.size / 1024).toFixed(2)} KB</p>
                    </div>

                    {block.gasUsed !== undefined && (
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Fuel className="w-4 h-4" />
                          <span className="text-xs uppercase tracking-wide">Gas Used</span>
                        </div>
                        <p className="font-semibold">{block.gasUsed.toLocaleString()}</p>
                        {block.gasLimit && (
                          <p className="text-xs text-muted-foreground">
                            {((block.gasUsed / block.gasLimit) * 100).toFixed(1)}% of limit
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <User className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">
                          {chain === 'ethereum' ? 'Miner' : 'Miner'}
                        </span>
                      </div>
                      {block.miner && (
                        <Link href={`/address/${block.miner}`}>
                          <span className="font-mono text-sm text-primary cursor-pointer hover:underline">
                            {block.miner}
                          </span>
                        </Link>
                      )}
                    </div>

                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <Layers className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">Block Reward</span>
                      </div>
                      <p className="font-semibold text-xl">
                        {block.reward} {chain === 'ethereum' ? 'ETH' : 'BTC'}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Transactions ({block.transactionCount})
                  </h2>
                </div>

                {isLoadingTx ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border/50">
                          <th className="pb-3 pr-4">Tx Hash</th>
                          <th className="pb-3 pr-4">From</th>
                          <th className="pb-3 pr-4">To</th>
                          <th className="pb-3 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 25).map((tx) => (
                          <tr 
                            key={tx.hash}
                            className="border-b border-border/30 hover:bg-primary/5"
                          >
                            <td className="py-3 pr-4">
                              <Link href={`/tx/${tx.hash}`}>
                                <span className="font-mono text-sm text-primary cursor-pointer hover:underline">
                                  {truncateHash(tx.hash, 10, 8)}
                                </span>
                              </Link>
                            </td>
                            <td className="py-3 pr-4">
                              <Link href={`/address/${tx.from}`}>
                                <span className="font-mono text-xs text-muted-foreground cursor-pointer hover:text-primary">
                                  {truncateHash(tx.from, 8, 6)}
                                </span>
                              </Link>
                            </td>
                            <td className="py-3 pr-4">
                              <Link href={`/address/${tx.to}`}>
                                <span className="font-mono text-xs text-muted-foreground cursor-pointer hover:text-primary">
                                  {truncateHash(tx.to, 8, 6)}
                                </span>
                              </Link>
                            </td>
                            <td className="py-3 text-right font-mono text-sm">
                              {chain === 'ethereum' 
                                ? (parseFloat(tx.value) / 1e18).toFixed(4) + ' ETH'
                                : (parseFloat(tx.value) / 1e8).toFixed(8) + ' BTC'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {transactions.length > 25 && (
                      <p className="text-sm text-muted-foreground mt-4 text-center">
                        Showing first 25 of {transactions.length} transactions
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No transactions in this block</p>
                  </div>
                )}
              </GlassCard>
            </>
          ) : (
            <GlassCard className="p-8 text-center">
              <Blocks className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Block Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The block you're looking for doesn't exist or hasn't been mined yet.
              </p>
              <Link href={`/explorer/${chain}`}>
                <Button data-testid="button-back-to-explorer">
                  Back to Explorer
                </Button>
              </Link>
            </GlassCard>
          )}
        </div>
      </main>
    </div>
  );
}
