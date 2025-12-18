/**
 * Analyst Data Hooks
 *
 * React Query hooks for FMP analyst endpoints:
 * - Price target consensus
 * - Grade consensus (buy/hold/sell)
 * - Individual analyst grades
 * - Analyst estimates
 */

import { useQuery } from '@tanstack/react-query';

// Types matching server/api/stocks/fmpService.ts
export interface PriceTargetConsensus {
  symbol: string;
  targetHigh: number;
  targetLow: number;
  targetConsensus: number;
  targetMedian: number;
}

export interface GradeConsensus {
  symbol: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: string;
}

export interface StockGrade {
  symbol: string;
  date: string;
  gradingCompany: string;
  previousGrade: string;
  newGrade: string;
}

export interface AnalystEstimate {
  symbol: string;
  date: string;
  estimatedRevenueLow: number;
  estimatedRevenueHigh: number;
  estimatedRevenueAvg: number;
  estimatedEpsLow: number;
  estimatedEpsHigh: number;
  estimatedEpsAvg: number;
  numberAnalystEstimatedRevenue: number;
  numberAnalystEstimatedEps: number;
}

export interface EarningsHistoryItem {
  date: string;
  symbol: string;
  eps: number | null;
  epsEstimated: number | null;
  revenue: number | null;
  revenueEstimated: number | null;
}

async function fetchPriceTarget(symbol: string): Promise<PriceTargetConsensus | null> {
  const res = await fetch(`/api/stocks/${symbol}/price-target`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchGradeConsensus(symbol: string): Promise<GradeConsensus | null> {
  const res = await fetch(`/api/stocks/${symbol}/consensus`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchGrades(symbol: string): Promise<StockGrade[]> {
  const res = await fetch(`/api/stocks/${symbol}/grades`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchEstimates(symbol: string): Promise<AnalystEstimate[]> {
  const res = await fetch(`/api/stocks/${symbol}/estimates`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchEarningsHistory(symbol: string): Promise<EarningsHistoryItem[]> {
  const res = await fetch(`/api/stocks/${symbol}/earnings`);
  if (!res.ok) return [];
  return res.json();
}

/**
 * Hook for price target consensus data
 */
export function usePriceTarget(symbol: string) {
  return useQuery({
    queryKey: ['price-target', symbol],
    queryFn: () => fetchPriceTarget(symbol),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for grade consensus (buy/hold/sell distribution)
 */
export function useGradeConsensus(symbol: string) {
  return useQuery({
    queryKey: ['grade-consensus', symbol],
    queryFn: () => fetchGradeConsensus(symbol),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for individual analyst grades
 */
export function useGrades(symbol: string) {
  return useQuery({
    queryKey: ['grades', symbol],
    queryFn: () => fetchGrades(symbol),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for analyst estimates
 */
export function useEstimates(symbol: string) {
  return useQuery({
    queryKey: ['estimates', symbol],
    queryFn: () => fetchEstimates(symbol),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for earnings history (EPS beat/miss)
 */
export function useEarningsHistory(symbol: string) {
  return useQuery({
    queryKey: ['earnings-history', symbol],
    queryFn: () => fetchEarningsHistory(symbol),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Combined hook for all analyst data
 */
export function useAnalystData(symbol: string) {
  const priceTarget = usePriceTarget(symbol);
  const gradeConsensus = useGradeConsensus(symbol);
  const grades = useGrades(symbol);
  const estimates = useEstimates(symbol);
  const earnings = useEarningsHistory(symbol);

  return {
    priceTarget: priceTarget.data,
    gradeConsensus: gradeConsensus.data,
    grades: grades.data ?? [],
    estimates: estimates.data ?? [],
    earnings: earnings.data ?? [],
    isLoading: priceTarget.isLoading || gradeConsensus.isLoading,
    isError: priceTarget.isError && gradeConsensus.isError,
  };
}
