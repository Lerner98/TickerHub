import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { SearchType, ChainType } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number, decimals: number = 2): string {
  if (num >= 1e12) {
    return (num / 1e12).toFixed(decimals) + 'T';
  }
  if (num >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K';
  }
  return num.toFixed(decimals);
}

export function formatCurrency(num: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: num < 1 ? 6 : 2,
  }).format(num);
}

export function formatPercentage(num: number): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function truncateHash(hash: string, start: number = 6, end: number = 4): string {
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export function truncateAddress(address: string, start: number = 8, end: number = 6): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatBlockNumber(num: number): string {
  return num.toLocaleString();
}

export function formatGwei(wei: number): string {
  return (wei / 1e9).toFixed(2) + ' Gwei';
}

export function formatEth(wei: string | number): string {
  const weiNum = typeof wei === 'string' ? parseFloat(wei) : wei;
  return (weiNum / 1e18).toFixed(6) + ' ETH';
}

export function formatBtc(satoshis: string | number): string {
  const satNum = typeof satoshis === 'string' ? parseFloat(satoshis) : satoshis;
  return (satNum / 1e8).toFixed(8) + ' BTC';
}

export function detectSearchType(query: string): { type: SearchType; chain?: ChainType } {
  const cleanQuery = query.trim().toLowerCase();
  
  if (/^0x[a-f0-9]{64}$/i.test(cleanQuery)) {
    return { type: 'transaction', chain: 'ethereum' };
  }
  
  if (/^0x[a-f0-9]{40}$/i.test(cleanQuery)) {
    return { type: 'address', chain: 'ethereum' };
  }
  
  if (/^[a-f0-9]{64}$/i.test(cleanQuery)) {
    return { type: 'transaction', chain: 'bitcoin' };
  }
  
  if (/^(1|3|bc1)[a-zA-Z0-9]{25,42}$/i.test(cleanQuery)) {
    return { type: 'address', chain: 'bitcoin' };
  }
  
  if (/^\d+$/.test(cleanQuery)) {
    return { type: 'block' };
  }
  
  return { type: 'unknown' };
}

export function getChainColor(chain: ChainType): string {
  switch (chain) {
    case 'bitcoin':
      return '#F7931A';
    case 'ethereum':
      return '#627EEA';
    default:
      return '#00F5FF';
  }
}

export function getChainIcon(chain: ChainType): string {
  switch (chain) {
    case 'bitcoin':
      return '₿';
    case 'ethereum':
      return 'Ξ';
    default:
      return '◆';
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
