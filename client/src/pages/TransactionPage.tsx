import { useParams, Link } from 'wouter';
import { Header } from '@/components/layout';
import { GlassCard } from '@/components/GlassCard';
import { CopyButton } from '@/components/CopyButton';
import { FullPageLoading } from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatTimestamp, formatEth, formatBtc, truncateAddress } from '@/lib/utils';
import { useTransaction } from '@/features/explorer';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ExternalLink,
  FileText,
  Fuel,
  Hash,
  Layers,
  User
} from 'lucide-react';

export default function TransactionPage() {
  const params = useParams<{ hash: string }>();
  const hash = params.hash || '';

  const { data: tx, isLoading, error } = useTransaction(hash);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="w-5 h-5 text-accent" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-chart-4" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-accent/20 text-accent border-accent/30">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return null;
    }
  };

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
                <FileText className="w-7 h-7 text-primary" />
                Transaction Details
              </h1>
              <p className="text-muted-foreground font-mono text-sm">
                {truncateAddress(hash, 12, 10)}
              </p>
            </div>
          </div>

          {isLoading ? (
            <FullPageLoading />
          ) : error ? (
            <GlassCard className="p-8 text-center">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">Transaction Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The transaction you're looking for doesn't exist or hasn't been indexed yet.
              </p>
              <Link href="/dashboard">
                <Button data-testid="button-back-to-dashboard">
                  Back to Dashboard
                </Button>
              </Link>
            </GlassCard>
          ) : tx ? (
            <div className="space-y-6">
              <GlassCard className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(tx.status)}
                    <div>
                      <h2 className="text-lg font-semibold">Status</h2>
                      <p className="text-muted-foreground text-sm">
                        {tx.confirmations} confirmations
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(tx.status)}
                </div>

                <div className="grid gap-6">
                  <div className="flex items-start gap-4">
                    <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm break-all">{tx.hash}</p>
                        <CopyButton text={tx.hash} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Layers className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Block</p>
                      <Link href={`/block/${tx.blockNumber}?chain=${tx.chain}`}>
                        <span className="font-mono text-sm text-primary cursor-pointer hover:underline">
                          #{tx.blockNumber.toLocaleString()}
                        </span>
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Timestamp</p>
                      <p className="text-sm">{formatTimestamp(tx.timestamp)}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Transaction Flow
                </h3>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                  <div className="flex-1 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">From</p>
                    <div className="flex items-center gap-2">
                      <Link href={`/address/${tx.from}`}>
                        <span className="font-mono text-sm text-primary cursor-pointer hover:underline break-all">
                          {tx.from}
                        </span>
                      </Link>
                      <CopyButton text={tx.from} />
                    </div>
                  </div>

                  <ArrowRight className="w-6 h-6 text-primary mx-auto md:mx-0 flex-shrink-0 rotate-90 md:rotate-0" />

                  <div className="flex-1 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">To</p>
                    <div className="flex items-center gap-2">
                      <Link href={`/address/${tx.to}`}>
                        <span className="font-mono text-sm text-primary cursor-pointer hover:underline break-all">
                          {tx.to}
                        </span>
                      </Link>
                      <CopyButton text={tx.to} />
                    </div>
                  </div>
                </div>
              </GlassCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="p-6">
                  <h3 className="font-semibold mb-4">Value</h3>
                  <p className="text-2xl font-bold">
                    {tx.chain === 'ethereum' ? formatEth(tx.value) : formatBtc(tx.value)}
                  </p>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-chart-4" />
                    Transaction Fee
                  </h3>
                  <p className="text-2xl font-bold">
                    {tx.chain === 'ethereum' ? formatEth(tx.fee) : formatBtc(tx.fee)}
                  </p>
                  {tx.gasPrice && tx.gasUsed && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Gas: {tx.gasUsed.toLocaleString()} @ {tx.gasPrice} Gwei
                    </p>
                  )}
                </GlassCard>
              </div>

              {tx.input && tx.input !== '0x' && (
                <GlassCard className="p-6">
                  <h3 className="font-semibold mb-4">Input Data</h3>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50 overflow-x-auto">
                    <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-all">
                      {tx.input}
                    </pre>
                  </div>
                </GlassCard>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
