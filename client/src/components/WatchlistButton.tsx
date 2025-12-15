/**
 * WatchlistButton Component
 *
 * A button that toggles an asset's presence in the user's watchlist.
 * Shows star icon - filled when in watchlist, outline when not.
 * Requires authentication to function.
 */

import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAssetWatchlist, type AssetType } from '@/hooks/useWatchlist';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface WatchlistButtonProps {
  assetId: string;
  assetType: AssetType;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'default';
  className?: string;
  showLabel?: boolean;
}

export function WatchlistButton({
  assetId,
  assetType,
  size = 'icon',
  variant = 'ghost',
  className,
  showLabel = false,
}: WatchlistButtonProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { inWatchlist, isLoading, isToggling, toggle } = useAssetWatchlist(
    assetId,
    assetType
  );

  // Don't render anything while auth is loading
  if (authLoading) {
    return null;
  }

  // If not authenticated, show disabled button with tooltip
  if (!isAuthenticated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn('cursor-not-allowed opacity-50', className)}
            disabled
          >
            <Star className="h-4 w-4" />
            {showLabel && <span>Watch</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Sign in to add to watchlist</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const isWorking = isLoading || isToggling;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle();
          }}
          disabled={isWorking}
          className={cn(
            inWatchlist && 'text-yellow-500 hover:text-yellow-600',
            className
          )}
        >
          <Star
            className={cn(
              'h-4 w-4 transition-all',
              inWatchlist && 'fill-current',
              isWorking && 'animate-pulse'
            )}
          />
          {showLabel && (
            <span>{inWatchlist ? 'Watching' : 'Watch'}</span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default WatchlistButton;
