import { useQuery } from '@tanstack/react-query';
import { GlassCard } from './GlassCard';
import { ChainIcon } from './CryptoIcon';
import { StatCardSkeleton } from './LoadingState';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatNumber, formatBlockNumber } from '@/lib/utils';
import type { NetworkStats } from '@shared/schema';
import {
  Activity,
  Blocks,
  Clock,
  Fuel,
  TrendingUp,
  Zap,
  HelpCircle
} from 'lucide-react';

interface NetworkStatsDisplayProps {
  chain: 'bitcoin' | 'ethereum';
}

export function NetworkStatsDisplay({ chain }: NetworkStatsDisplayProps) {
  const { data: stats, isLoading, error } = useQuery<NetworkStats>({
    queryKey: ['/api/network', chain],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <GlassCard className="p-5">
        <StatCardSkeleton />
      </GlassCard>
    );
  }

  if (error || !stats) {
    return (
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <ChainIcon chain={chain} size="md" />
          <div>
            <h3 className="font-semibold capitalize">{chain}</h3>
            <p className="text-xs text-muted-foreground">Network Statistics</p>
          </div>
        </div>
        <div className="py-4 text-center text-muted-foreground">
          <p className="text-sm text-destructive">Unable to load network stats</p>
        </div>
      </GlassCard>
    );
  }

  const statsItems = chain === 'ethereum' ? [
    {
      icon: Blocks,
      label: 'Block Height',
      value: formatBlockNumber(stats.blockHeight),
      color: 'text-primary',
      tooltip: 'The total number of blocks mined on the Ethereum network since genesis',
    },
    {
      icon: Fuel,
      label: 'Gas (Gwei)',
      value: stats.gasPrice ? `${stats.gasPrice.low} / ${stats.gasPrice.average} / ${stats.gasPrice.high}` : 'N/A',
      subLabel: 'Low / Avg / High',
      color: 'text-chart-4',
      tooltip: 'Transaction fee unit on Ethereum. Higher gas = faster confirmation. 1 Gwei = 0.000000001 ETH',
    },
    {
      icon: Zap,
      label: 'TPS',
      value: stats.tps.toFixed(1),
      color: 'text-accent',
      tooltip: 'Transactions Per Second - the network throughput capacity',
    },
    {
      icon: Clock,
      label: 'Block Time',
      value: `${stats.averageBlockTime.toFixed(1)}s`,
      color: 'text-secondary',
      tooltip: 'Average time between blocks. Ethereum targets ~12 seconds per block',
    },
  ] : [
    {
      icon: Blocks,
      label: 'Block Height',
      value: formatBlockNumber(stats.blockHeight),
      color: 'text-primary',
      tooltip: 'The total number of blocks mined on the Bitcoin network since genesis',
    },
    {
      icon: TrendingUp,
      label: 'Hash Rate',
      value: stats.hashRate || 'N/A',
      color: 'text-chart-4',
      tooltip: 'Total computational power securing the Bitcoin network. Higher = more secure',
    },
    {
      icon: Clock,
      label: 'Block Time',
      value: `${stats.averageBlockTime.toFixed(0)}m`,
      color: 'text-secondary',
      tooltip: 'Average time between blocks. Bitcoin targets ~10 minutes per block',
    },
    {
      icon: Activity,
      label: 'TPS',
      value: stats.tps.toFixed(1),
      color: 'text-accent',
      tooltip: 'Transactions Per Second - Bitcoin processes ~7 TPS on average',
    },
  ];

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <ChainIcon chain={chain} size="md" />
        <div>
          <h3 className="font-semibold capitalize">{chain}</h3>
          <p className="text-xs text-muted-foreground">Network Statistics</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          <span className="text-xs text-accent">Live</span>
        </div>
      </div>

      <TooltipProvider delayDuration={100}>
        <div className="grid grid-cols-2 gap-4">
          {statsItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className={cn("w-4 h-4", item.color)} />
                  <span className="text-xs uppercase tracking-wide">{item.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 cursor-help opacity-50 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px]">
                      <p className="text-xs">{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-lg font-bold">{item.value}</p>
                {item.subLabel && (
                  <p className="text-xs text-muted-foreground">{item.subLabel}</p>
                )}
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    </GlassCard>
  );
}

export function NetworkStatsGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <NetworkStatsDisplay chain="ethereum" />
      <NetworkStatsDisplay chain="bitcoin" />
    </div>
  );
}
