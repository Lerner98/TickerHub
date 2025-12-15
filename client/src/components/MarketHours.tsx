/**
 * Market Hours Indicator
 *
 * Shows real-time status of global markets with countdown timers.
 * A unique fintech feature showing which markets are open/closed.
 */

import { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';
import { Clock, Globe, TrendingUp, Moon, Sun } from 'lucide-react';

interface MarketInfo {
  name: string;
  shortName: string;
  timezone: string;
  openHour: number;  // 24h format in local timezone
  closeHour: number;
  openMinute?: number;
  closeMinute?: number;
  weekendClosed: boolean;
  icon: 'us' | 'eu' | 'asia' | 'crypto';
}

const MARKETS: MarketInfo[] = [
  {
    name: 'US Stock Market',
    shortName: 'NYSE/NASDAQ',
    timezone: 'America/New_York',
    openHour: 9,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
    weekendClosed: true,
    icon: 'us',
  },
  {
    name: 'Crypto Markets',
    shortName: 'BTC/ETH',
    timezone: 'UTC',
    openHour: 0,
    closeHour: 24,
    weekendClosed: false,
    icon: 'crypto',
  },
  {
    name: 'London Stock Exchange',
    shortName: 'LSE',
    timezone: 'Europe/London',
    openHour: 8,
    openMinute: 0,
    closeHour: 16,
    closeMinute: 30,
    weekendClosed: true,
    icon: 'eu',
  },
  {
    name: 'Tokyo Stock Exchange',
    shortName: 'TSE',
    timezone: 'Asia/Tokyo',
    openHour: 9,
    openMinute: 0,
    closeHour: 15,
    closeMinute: 0,
    weekendClosed: true,
    icon: 'asia',
  },
];

interface MarketStatus {
  isOpen: boolean;
  isPreMarket: boolean;
  isAfterHours: boolean;
  nextEvent: string;
  timeUntilNext: string;
  localTime: string;
}

function getMarketStatus(market: MarketInfo, now: Date): MarketStatus {
  // Get current time in market's timezone
  const marketTime = new Date(now.toLocaleString('en-US', { timeZone: market.timezone }));
  const hours = marketTime.getHours();
  const minutes = marketTime.getMinutes();
  const day = marketTime.getDay(); // 0 = Sunday, 6 = Saturday

  const currentMinutes = hours * 60 + minutes;
  const openMinutes = market.openHour * 60 + (market.openMinute || 0);
  const closeMinutes = market.closeHour * 60 + (market.closeMinute || 0);

  const localTime = marketTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Crypto is always open
  if (!market.weekendClosed && market.closeHour === 24) {
    return {
      isOpen: true,
      isPreMarket: false,
      isAfterHours: false,
      nextEvent: 'Always Open',
      timeUntilNext: '24/7',
      localTime,
    };
  }

  // Check weekend
  const isWeekend = day === 0 || day === 6;
  if (market.weekendClosed && isWeekend) {
    // Calculate time until Monday open
    const daysUntilMonday = day === 0 ? 1 : 2;
    const hoursUntil = daysUntilMonday * 24 - hours + market.openHour;
    const minutesUntil = (market.openMinute || 0) - minutes;

    return {
      isOpen: false,
      isPreMarket: false,
      isAfterHours: false,
      nextEvent: 'Opens Monday',
      timeUntilNext: formatTimeUntil(hoursUntil, minutesUntil),
      localTime,
    };
  }

  // Pre-market (US specific: 4:00 AM - 9:30 AM)
  const isPreMarket = market.icon === 'us' && currentMinutes >= 4 * 60 && currentMinutes < openMinutes;

  // After-hours (US specific: 4:00 PM - 8:00 PM)
  const isAfterHours = market.icon === 'us' && currentMinutes >= closeMinutes && currentMinutes < 20 * 60;

  // Market is open
  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    const minutesUntilClose = closeMinutes - currentMinutes;
    return {
      isOpen: true,
      isPreMarket: false,
      isAfterHours: false,
      nextEvent: 'Closes',
      timeUntilNext: formatTimeUntil(Math.floor(minutesUntilClose / 60), minutesUntilClose % 60),
      localTime,
    };
  }

  // Market is closed - calculate time until open
  let minutesUntilOpen: number;
  if (currentMinutes < openMinutes) {
    minutesUntilOpen = openMinutes - currentMinutes;
  } else {
    // Opens tomorrow
    minutesUntilOpen = (24 * 60 - currentMinutes) + openMinutes;
  }

  return {
    isOpen: false,
    isPreMarket,
    isAfterHours,
    nextEvent: isPreMarket ? 'Pre-Market' : isAfterHours ? 'After-Hours' : 'Opens',
    timeUntilNext: isPreMarket || isAfterHours
      ? 'Extended Hours'
      : formatTimeUntil(Math.floor(minutesUntilOpen / 60), minutesUntilOpen % 60),
    localTime,
  };
}

function formatTimeUntil(hours: number, minutes: number): string {
  if (hours < 0) hours = 0;
  if (minutes < 0) minutes = 0;

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (hours < 24) {
    return `${hours}h ${minutes}m`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

function MarketIcon({ type }: { type: MarketInfo['icon'] }) {
  switch (type) {
    case 'us':
      return <span className="text-lg">🇺🇸</span>;
    case 'eu':
      return <span className="text-lg">🇬🇧</span>;
    case 'asia':
      return <span className="text-lg">🇯🇵</span>;
    case 'crypto':
      return <span className="text-lg">₿</span>;
    default:
      return <Globe className="w-4 h-4" />;
  }
}

function StatusBadge({ status }: { status: MarketStatus }) {
  if (status.isOpen) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-accent">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        OPEN
      </span>
    );
  }
  if (status.isPreMarket) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
        <Sun className="w-3 h-3" />
        PRE-MKT
      </span>
    );
  }
  if (status.isAfterHours) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-purple-400">
        <Moon className="w-3 h-3" />
        AFTER-HRS
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
      CLOSED
    </span>
  );
}

interface MarketHoursProps {
  className?: string;
  compact?: boolean;
}

export function MarketHours({ className, compact = false }: MarketHoursProps) {
  const [now, setNow] = useState(new Date());

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const marketStatuses = MARKETS.map((market) => ({
    market,
    status: getMarketStatus(market, now),
  }));

  if (compact) {
    // Compact horizontal view for header
    return (
      <div className={cn('flex items-center gap-4', className)}>
        {marketStatuses.map(({ market, status }) => (
          <div
            key={market.shortName}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
              status.isOpen
                ? 'bg-accent/10 border border-accent/30'
                : status.isPreMarket || status.isAfterHours
                ? 'bg-amber-500/10 border border-amber-500/30'
                : 'bg-muted/30 border border-border/50'
            )}
          >
            <MarketIcon type={market.icon} />
            <span className="font-medium">{market.shortName}</span>
            <StatusBadge status={status} />
          </div>
        ))}
      </div>
    );
  }

  // Full card view
  return (
    <GlassCard className={cn('p-5', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Market Hours</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} Local
        </span>
      </div>

      <div className="space-y-3">
        {marketStatuses.map(({ market, status }) => (
          <div
            key={market.shortName}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border transition-colors',
              status.isOpen
                ? 'bg-accent/5 border-accent/30'
                : status.isPreMarket || status.isAfterHours
                ? 'bg-amber-500/5 border-amber-500/30'
                : 'bg-muted/20 border-border/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center">
                <MarketIcon type={market.icon} />
              </div>
              <div>
                <p className="font-medium text-sm">{market.shortName}</p>
                <p className="text-xs text-muted-foreground">{status.localTime}</p>
              </div>
            </div>

            <div className="text-right">
              <StatusBadge status={status} />
              <p className="text-xs text-muted-foreground mt-0.5">
                {status.nextEvent}: {status.timeUntilNext}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-accent" /> Open
        </span>
        <span className="flex items-center gap-1">
          <Sun className="w-3 h-3 text-amber-400" /> Pre-Market
        </span>
        <span className="flex items-center gap-1">
          <Moon className="w-3 h-3 text-purple-400" /> After-Hours
        </span>
      </div>
    </GlassCard>
  );
}

export default MarketHours;
