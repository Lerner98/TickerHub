import { cn } from '@/lib/utils';

interface CryptoIconProps {
  symbol: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

const colorMap: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  USDT: '#26A17B',
  BNB: '#F0B90B',
  SOL: '#9945FF',
  XRP: '#23292F',
  USDC: '#2775CA',
  ADA: '#0033AD',
  AVAX: '#E84142',
  DOGE: '#C2A633',
  DOT: '#E6007A',
  MATIC: '#8247E5',
  LTC: '#345D9D',
  LINK: '#2A5ADA',
  UNI: '#FF007A',
};

export function CryptoIcon({ symbol, image, size = 'md', className }: CryptoIconProps) {
  const upperSymbol = symbol.toUpperCase();
  const bgColor = colorMap[upperSymbol] || '#00F5FF';

  if (image) {
    return (
      <div className={cn(
        "relative rounded-full overflow-hidden flex-shrink-0",
        sizeClasses[size],
        className
      )}>
        <img 
          src={image} 
          alt={symbol} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div 
          className="absolute inset-0 opacity-0"
          style={{ backgroundColor: bgColor }}
        />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white flex-shrink-0",
        sizeClasses[size],
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        size === 'lg' && 'text-base',
        size === 'xl' && 'text-lg',
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {upperSymbol.slice(0, 2)}
    </div>
  );
}

export function ChainIcon({ chain, size = 'md', className }: { chain: 'bitcoin' | 'ethereum'; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const config = {
    bitcoin: { symbol: 'BTC', color: '#F7931A' },
    ethereum: { symbol: 'ETH', color: '#627EEA' },
  };

  const { symbol, color } = config[chain];

  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white flex-shrink-0",
        sizeClasses[size],
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        size === 'lg' && 'text-base',
        size === 'xl' && 'text-lg',
        className
      )}
      style={{ backgroundColor: color }}
    >
      {chain === 'bitcoin' ? '₿' : 'Ξ'}
    </div>
  );
}
