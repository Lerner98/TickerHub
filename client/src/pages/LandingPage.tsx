import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { PriceTicker } from '@/components/PriceTicker';
import { GlassCard } from '@/components/GlassCard';
import { cn, formatNumber } from '@/lib/utils';
import { useStats } from '@/features/crypto';
import { 
  ArrowRight, 
  Blocks, 
  Search, 
  Activity, 
  Shield, 
  Zap,
  ChevronRight,
  Globe,
  LineChart
} from 'lucide-react';

const features = [
  {
    icon: Blocks,
    title: 'Multi-Chain Explorer',
    description: 'Explore blocks, transactions, and addresses across Bitcoin, Ethereum, and more blockchain networks.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Activity,
    title: 'Real-Time Analytics',
    description: 'Track live prices, market movements, and network statistics with instant updates.',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    icon: Search,
    title: 'Universal Search',
    description: 'Search any address, transaction hash, or block number across all supported networks instantly.',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Built with industry-leading security practices and powered by trusted data sources.',
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
  },
];

interface Stats {
  totalBlocks: number;
  totalTransactions: number;
  networksSupported: number;
  uptime: string;
}

export default function LandingPage() {
  const { data: stats } = useStats();

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Real-time blockchain insights</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in-up">
              <span className="text-glow-primary">TickerHub</span>
              <br />
              <span className="text-muted-foreground">Market Intelligence Platform</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Track, analyze, and explore blockchain data across multiple networks. 
              Get real-time insights into prices, transactions, and network health.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 px-8" data-testid="button-explore-dashboard">
                  Explore Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/explorer/ethereum">
                <Button size="lg" variant="outline" className="gap-2" data-testid="button-block-explorer">
                  <Globe className="w-4 h-4" />
                  Block Explorer
                </Button>
              </Link>
            </div>
          </div>

          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/20 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
        </div>
      </section>

      <PriceTicker />

      <section className="py-20 bg-gradient-to-b from-transparent via-card/30 to-transparent">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                label: 'Blocks Indexed', 
                value: stats?.totalBlocks || 19500000, 
                icon: Blocks,
                suffix: '+' 
              },
              { 
                label: 'Transactions Tracked', 
                value: stats?.totalTransactions || 2100000000, 
                icon: Activity,
                suffix: '+' 
              },
              { 
                label: 'Networks Supported', 
                value: stats?.networksSupported || 2, 
                icon: Globe,
                suffix: '' 
              },
              { 
                label: 'Uptime', 
                value: stats?.uptime || '99.9', 
                icon: Shield,
                suffix: '%' 
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <GlassCard 
                  key={stat.label} 
                  className="p-6 text-center"
                  hover={false}
                >
                  <Icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <p className="text-3xl sm:text-4xl font-bold mb-1">
                    {typeof stat.value === 'number' ? formatNumber(stat.value, 0) : stat.value}
                    {stat.suffix}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Powerful Features for Crypto Enthusiasts
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to explore, analyze, and understand blockchain data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <GlassCard 
                  key={feature.title}
                  className="p-6 group"
                  glow="primary"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      feature.bgColor
                    )}>
                      <Icon className={cn("w-6 h-6", feature.color)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <LineChart className="w-4 h-4 text-accent" />
            <span className="text-sm text-accent font-medium">Start exploring now</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Dive Into Blockchain Data?
          </h2>

          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get instant access to real-time blockchain analytics, market data, and comprehensive network insights.
          </p>

          <Link href="/dashboard">
            <Button size="lg" className="gap-2 px-10" data-testid="button-get-started">
              Get Started
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-8 border-t border-border/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Blocks className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">TickerHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by CoinGecko, Etherscan, and Blockchain.com APIs
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
