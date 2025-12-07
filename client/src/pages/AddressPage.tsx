import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/GlassCard';
import { ChainIcon } from '@/components/CryptoIcon';
import { CopyButton } from '@/components/CopyButton';
import { FullPageLoading, Skeleton, TableRowSkeleton } from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatTimestamp, formatEth, formatBtc, truncateHash, formatTimeAgo } from '@/lib/utils';
import type { Address, Transaction, ChainType } from '@shared/schema';
import { 
  ArrowLeft, 
  Wallet, 
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Copy,
  QrCode,
  Activity,
  TrendingUp,
  Coins
} from 'lucide-react';

export default function AddressPage() {
  const params = useParams<{ address: string }>();
  const address = params.address || '';
  const [activeTab, setActiveTab] = useState('transactions');

  const { data: addressData, isLoading: isLoadingAddress } = useQuery<Address>({
    queryKey: ['/api/address', address],
    enabled: !!address,
  });

  const { data: transactions, isLoading: isLoadingTx } = useQuery<Transaction[]>({
    queryKey: ['/api/address', address, 'transactions'],
    enabled: !!address,
  });

  const chain: ChainType = addressData?.chain || (address.startsWith('0x') ? 'ethereum' : 'bitcoin');

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
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                <Wallet className="w-7 h-7 text-primary" />
                Address
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-mono text-sm text-muted-foreground truncate">
                  {address}
                </p>
                <CopyButton text={address} />
              </div>
            </div>
            <ChainIcon chain={chain} size="lg" />
          </div>

          {isLoadingAddress ? (
            <FullPageLoading />
          ) : addressData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6" glow="primary">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Coins className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold">
                    {chain === 'ethereum' 
                      ? formatEth(addressData.balance)
                      : formatBtc(addressData.balance)
                    }
                  </p>
                </GlassCard>

                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Activity className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold">
                    {addressData.transactionCount.toLocaleString()}
                  </p>
                </GlassCard>

                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <TrendingUp className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Activity</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold">
                    {addressData.lastActivity 
                      ? formatTimeAgo(addressData.lastActivity)
                      : 'Unknown'
                    }
                  </p>
                  {addressData.firstSeen && (
                    <p className="text-sm text-muted-foreground mt-1">
                      First seen: {formatTimestamp(addressData.firstSeen)}
                    </p>
                  )}
                </GlassCard>
              </div>

              <GlassCard className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="transactions" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Transactions
                    </TabsTrigger>
                    {addressData.tokens && addressData.tokens.length > 0 && (
                      <TabsTrigger value="tokens" className="gap-2">
                        <Coins className="w-4 h-4" />
                        Tokens ({addressData.tokens.length})
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="transactions">
                    {isLoadingTx ? (
                      <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : transactions && transactions.length > 0 ? (
                      <div className="space-y-2">
                        {transactions.map((tx) => {
                          const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
                          return (
                            <Link key={tx.hash} href={`/tx/${tx.hash}`}>
                              <div className={cn(
                                "flex items-center gap-4 p-4 rounded-lg transition-all duration-200",
                                "bg-card/40 hover:bg-card/60 cursor-pointer",
                                "border border-transparent hover:border-primary/20"
                              )}>
                                <div className={cn(
                                  "p-2 rounded-full",
                                  isOutgoing ? "bg-destructive/10" : "bg-accent/10"
                                )}>
                                  {isOutgoing ? (
                                    <ArrowUpRight className="w-4 h-4 text-destructive" />
                                  ) : (
                                    <ArrowDownLeft className="w-4 h-4 text-accent" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-primary">
                                      {truncateHash(tx.hash, 12, 8)}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {tx.status}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {isOutgoing ? 'To: ' : 'From: '}
                                    {truncateHash(isOutgoing ? tx.to : tx.from, 8, 6)}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className={cn(
                                    "font-mono text-sm font-medium",
                                    isOutgoing ? "text-destructive" : "text-accent"
                                  )}>
                                    {isOutgoing ? '-' : '+'}
                                    {chain === 'ethereum' 
                                      ? formatEth(tx.value)
                                      : formatBtc(tx.value)
                                    }
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatTimeAgo(tx.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No transactions found</p>
                      </div>
                    )}
                  </TabsContent>

                  {addressData.tokens && (
                    <TabsContent value="tokens">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {addressData.tokens.map((token) => (
                          <div 
                            key={token.contractAddress}
                            className="p-4 rounded-lg bg-card/40 border border-border/50"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                {token.symbol.slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-medium">{token.name}</p>
                                <p className="text-xs text-muted-foreground">{token.symbol}</p>
                              </div>
                            </div>
                            <p className="font-mono text-lg font-semibold">
                              {(parseFloat(token.balance) / Math.pow(10, token.decimals)).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </GlassCard>
            </>
          ) : (
            <GlassCard className="p-8 text-center">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Address Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The address you're looking for doesn't exist or hasn't been indexed yet.
              </p>
              <Link href="/dashboard">
                <Button data-testid="button-back-to-dashboard">
                  Back to Dashboard
                </Button>
              </Link>
            </GlassCard>
          )}
        </div>
      </main>
    </div>
  );
}
