/**
 * Watchlist Hooks
 *
 * Provides hooks for managing the user's watchlist:
 * - useWatchlist: Get the full watchlist
 * - useWatchlistCheck: Check if a specific asset is in watchlist
 * - useWatchlistMutations: Add/remove assets from watchlist
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// =============================================================================
// Types
// =============================================================================

export type AssetType = 'crypto' | 'stock';

export interface WatchlistItem {
  id: number;
  assetId: string;
  assetType: AssetType;
  addedAt: string;
}

export interface WatchlistResponse {
  items: WatchlistItem[];
  count: number;
}

export interface WatchlistCheckResponse {
  inWatchlist: boolean;
  assetId: string;
}

// =============================================================================
// Query Keys
// =============================================================================

export const watchlistKeys = {
  all: ['watchlist'] as const,
  list: () => [...watchlistKeys.all, 'list'] as const,
  check: (assetId: string) => [...watchlistKeys.all, 'check', assetId] as const,
};

// =============================================================================
// useWatchlist - Get full watchlist
// =============================================================================

/**
 * Hook to fetch the user's watchlist
 *
 * @example
 * ```tsx
 * function WatchlistPage() {
 *   const { data, isLoading, error } = useWatchlist();
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <ul>
 *       {data.items.map(item => (
 *         <li key={item.id}>{item.assetId}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useWatchlist(enabled = true) {
  return useQuery<WatchlistResponse>({
    queryKey: watchlistKeys.list(),
    queryFn: async () => {
      const res = await fetch('/api/watchlist', {
        credentials: 'include',
      });

      if (res.status === 401) {
        // User not authenticated - return empty watchlist
        return { items: [], count: 0 };
      }

      if (!res.ok) {
        throw new Error('Failed to fetch watchlist');
      }

      return res.json();
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// =============================================================================
// useWatchlistCheck - Check if asset is in watchlist
// =============================================================================

/**
 * Hook to check if a specific asset is in the user's watchlist
 *
 * @example
 * ```tsx
 * function AssetCard({ assetId }: { assetId: string }) {
 *   const { data, isLoading } = useWatchlistCheck(assetId);
 *
 *   return (
 *     <button disabled={isLoading}>
 *       {data?.inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useWatchlistCheck(assetId: string, enabled = true) {
  return useQuery<WatchlistCheckResponse>({
    queryKey: watchlistKeys.check(assetId),
    queryFn: async () => {
      const res = await fetch(`/api/watchlist/check/${assetId}`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        // User not authenticated
        return { inWatchlist: false, assetId };
      }

      if (!res.ok) {
        throw new Error('Failed to check watchlist');
      }

      return res.json();
    },
    enabled: enabled && !!assetId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// =============================================================================
// useWatchlistMutations - Add/remove from watchlist
// =============================================================================

/**
 * Hook providing mutations to add/remove assets from watchlist
 *
 * @example
 * ```tsx
 * function WatchlistButton({ assetId, assetType }: Props) {
 *   const { addToWatchlist, removeFromWatchlist, isAdding, isRemoving } = useWatchlistMutations();
 *   const { data } = useWatchlistCheck(assetId);
 *
 *   const handleClick = () => {
 *     if (data?.inWatchlist) {
 *       removeFromWatchlist.mutate(assetId);
 *     } else {
 *       addToWatchlist.mutate({ assetId, assetType });
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleClick} disabled={isAdding || isRemoving}>
 *       {data?.inWatchlist ? 'Remove' : 'Add'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useWatchlistMutations() {
  const queryClient = useQueryClient();

  const addToWatchlist = useMutation({
    mutationFn: async ({
      assetId,
      assetType,
    }: {
      assetId: string;
      assetType: AssetType;
    }) => {
      const res = await apiRequest('POST', '/api/watchlist', {
        assetId,
        assetType,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate watchlist queries
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
      // Update the check cache for this asset
      queryClient.setQueryData(watchlistKeys.check(variables.assetId), {
        inWatchlist: true,
        assetId: variables.assetId,
      });
    },
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async (assetId: string) => {
      const res = await apiRequest('DELETE', `/api/watchlist/${assetId}`);
      return res.json();
    },
    onSuccess: (_, assetId) => {
      // Invalidate watchlist queries
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
      // Update the check cache for this asset
      queryClient.setQueryData(watchlistKeys.check(assetId), {
        inWatchlist: false,
        assetId,
      });
    },
  });

  return {
    addToWatchlist,
    removeFromWatchlist,
    isAdding: addToWatchlist.isPending,
    isRemoving: removeFromWatchlist.isPending,
  };
}

// =============================================================================
// Convenience Hook - Combined watchlist state for an asset
// =============================================================================

/**
 * Combined hook for managing watchlist state for a single asset
 *
 * @example
 * ```tsx
 * function WatchlistToggle({ assetId, assetType }: Props) {
 *   const {
 *     inWatchlist,
 *     isLoading,
 *     toggle,
 *     isToggling
 *   } = useAssetWatchlist(assetId, assetType);
 *
 *   return (
 *     <button onClick={toggle} disabled={isLoading || isToggling}>
 *       {inWatchlist ? 'Remove' : 'Add'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useAssetWatchlist(assetId: string, assetType: AssetType) {
  const { data, isLoading: isChecking } = useWatchlistCheck(assetId);
  const { addToWatchlist, removeFromWatchlist, isAdding, isRemoving } =
    useWatchlistMutations();

  const inWatchlist = data?.inWatchlist ?? false;
  const isToggling = isAdding || isRemoving;

  const toggle = () => {
    if (inWatchlist) {
      removeFromWatchlist.mutate(assetId);
    } else {
      addToWatchlist.mutate({ assetId, assetType });
    }
  };

  const add = () => {
    if (!inWatchlist) {
      addToWatchlist.mutate({ assetId, assetType });
    }
  };

  const remove = () => {
    if (inWatchlist) {
      removeFromWatchlist.mutate(assetId);
    }
  };

  return {
    inWatchlist,
    isLoading: isChecking,
    isToggling,
    toggle,
    add,
    remove,
  };
}
