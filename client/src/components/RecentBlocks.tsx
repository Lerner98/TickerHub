import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { GlassCard } from './GlassCard';
import { ChainIcon } from './CryptoIcon';
import { BlockListSkeleton } from './LoadingState';
import { cn, formatBlockNumber, formatTimeAgo, truncateHash } from '@/lib/utils';
import type { Block } from '@shared/schema';
import { ArrowRight, Blocks, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RecentBlocksProps {
  chain?: 'ethereum' | 'bitcoin';
  limit?: number;
}

export function RecentBlocks({ chain = 'ethereum', limit = 10 }: RecentBlocksProps) {
  const { data: blocks, isLoading, error } = useQuery<Block[]>({
    queryKey: ['/api/blocks', chain, limit, 1],
    refetchInterval: 15000,
  });

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Blocks className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold">Recent Blocks</h3>
            <p className="text-xs text-muted-foreground capitalize">{chain} Network</p>
          </div>
        </div>
        <Link href={`/explorer/${chain}`}>
          <Button variant="ghost" size="sm" className="gap-2" data-testid="link-view-all-blocks">
            View All <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <BlockListSkeleton rows={5} />
      ) : error ? (
        <div className="py-8 text-center text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-destructive">Failed to load blocks</p>
          <p className="text-xs mt-1">Please check your connection and try again</p>
        </div>
      ) : blocks && blocks.length > 0 ? (
        <div className="space-y-2">
          {blocks.slice(0, limit).map((block, index) => (
            <Link key={block.hash} href={`/block/${block.number}?chain=${chain}`}>
              <div 
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg transition-all duration-200",
                  "bg-card/40 hover:bg-card/60 cursor-pointer group",
                  "border border-transparent hover:border-primary/20"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`block-row-${block.number}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChainIcon chain={chain} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-primary">
                        #{formatBlockNumber(block.number)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {block.transactionCount} txs
                      </Badge>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground truncate">
                      {truncateHash(block.hash, 10, 8)}
                    </p>
                  </div>
                </div>

                <div className="ml-auto flex items-center gap-4 text-right">
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">
                      {block.miner && truncateHash(block.miner, 6, 4)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {block.reward} {chain === 'ethereum' ? 'ETH' : 'BTC'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {formatTimeAgo(block.timestamp)}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No blocks available</p>
        </div>
      )}
    </GlassCard>
  );
}
