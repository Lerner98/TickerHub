/**
 * Smart Search Bar Component
 *
 * AI-enhanced search bar that combines:
 * - Natural language parsing via Gemini
 * - Instant local fuzzy search via Fuse.js
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Search, Sparkles, Loader2, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useAssetSearch, type SearchResult } from '@/hooks/useAssetSearch';
import { useAISearch, type SearchFilters } from '@/hooks/useAISearch';
import { Input } from '@/components/ui/input';
import { cn, detectSearchType } from '@/lib/utils';

interface SmartSearchBarProps {
  placeholder?: string;
  className?: string;
  onNavigate?: () => void;
}

export function SmartSearchBar({
  placeholder = 'Search stocks, crypto, or ask "tech stocks going up"...',
  className,
  onNavigate,
}: SmartSearchBarProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Local fuzzy search (instant)
  const { results: localResults, hasResults: hasLocalResults } = useAssetSearch(query, 5);

  // AI search parsing (only on submit to conserve quota)
  const {
    parseQuery,
    filters: aiFilters,
    isLoading: isAILoading,
    isAIAvailable,
    reset: resetAIFilters,
  } = useAISearch();

  // Clear AI filters when query changes (user is typing new search)
  useEffect(() => {
    if (aiFilters && query.trim() === '') {
      resetAIFilters();
    }
  }, [query, aiFilters, resetAIFilters]);

  // Show dropdown when focused and has content
  useEffect(() => {
    setShowDropdown(isFocused && (hasLocalResults || !!aiFilters || query.length > 0));
  }, [isFocused, hasLocalResults, aiFilters, query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      const path = result.type === 'stock' ? `/stocks/${result.symbol}` : `/crypto/${result.id}`;
      setLocation(path);
      setQuery('');
      setShowDropdown(false);
      onNavigate?.();
    },
    [setLocation, onNavigate]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // First check for blockchain searches (tx hash, address, block number)
    const { type } = detectSearchType(query);

    if (type === 'block') {
      setLocation(`/block/${query}?chain=ethereum`);
      setQuery('');
      setShowDropdown(false);
      onNavigate?.();
      return;
    }

    if (type === 'transaction') {
      setLocation(`/tx/${query}`);
      setQuery('');
      setShowDropdown(false);
      onNavigate?.();
      return;
    }

    if (type === 'address') {
      setLocation(`/address/${query}`);
      setQuery('');
      setShowDropdown(false);
      onNavigate?.();
      return;
    }

    // Trigger AI parsing for natural language queries on submit
    const looksLikeNaturalLanguage = query.includes(' ') && !query.match(/^[A-Z]{1,5}$/);
    if (looksLikeNaturalLanguage && isAIAvailable && query.length >= 10) {
      parseQuery(query);
      // Navigate to search page with query - AI filters will enhance results
      setLocation(`/search?q=${encodeURIComponent(query)}`);
      setQuery('');
      setShowDropdown(false);
      onNavigate?.();
      return;
    }

    // If we have local results, navigate to first one
    if (hasLocalResults) {
      handleResultClick(localResults[0]);
      return;
    }

    // Otherwise navigate to search page
    setLocation(`/search?q=${encodeURIComponent(query)}`);
    setQuery('');
    setShowDropdown(false);
    onNavigate?.();
  };

  return (
    <div className={cn('relative', className)}>
      <form onSubmit={handleSubmit} role="search" aria-label="Search stocks and crypto">
        <div
          className={cn(
            'relative transition-all duration-300',
            isFocused && 'scale-[1.01]'
          )}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          {isAIAvailable && (
            <Sparkles className="absolute left-8 top-1/2 -translate-y-1/2 w-3 h-3 text-primary/60" />
          )}
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className={cn(
              'pl-12 pr-4 bg-card/60 border-border/50 placeholder:text-muted-foreground/60',
              'focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
              'transition-all duration-300'
            )}
            data-testid="smart-search-input"
          />
          {isAILoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute top-full left-0 right-0 mt-2 z-50',
            'bg-popover border rounded-lg shadow-lg overflow-hidden',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          {/* AI Filters Section */}
          {aiFilters && <AIFiltersSection filters={aiFilters} />}

          {/* Local Results */}
          {hasLocalResults && (
            <div className="p-2">
              <div className="text-xs text-muted-foreground px-2 py-1">
                {aiFilters ? 'Matching Assets' : 'Quick Results'}
              </div>
              {localResults.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  onClick={() => handleResultClick(result)}
                />
              ))}
            </div>
          )}

          {/* No Results */}
          {!hasLocalResults && !aiFilters && query.trim() && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}

          {/* AI Hint */}
          {isAIAvailable && !aiFilters && query.length < 10 && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              Press Enter to search with AI: "tech stocks going up" or "crypto under $100"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AIFiltersSection({ filters }: { filters: SearchFilters }) {
  return (
    <div className="p-3 border-b bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-primary">AI Understood</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {filters.type !== 'both' && (
          <FilterBadge label={filters.type === 'stock' ? 'Stocks' : 'Crypto'} />
        )}
        {filters.sector && <FilterBadge label={filters.sector} />}
        {filters.changeDirection !== 'any' && (
          <FilterBadge
            label={filters.changeDirection === 'up' ? 'Going Up' : 'Going Down'}
            icon={filters.changeDirection === 'up' ? TrendingUp : TrendingDown}
          />
        )}
        {filters.symbols.length > 0 && (
          <FilterBadge label={filters.symbols.join(', ')} />
        )}
        {filters.action === 'compare' && <FilterBadge label="Compare" />}
      </div>
    </div>
  );
}

function FilterBadge({
  label,
  icon: Icon,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}

function SearchResultItem({
  result,
  onClick,
}: {
  result: SearchResult;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-2 py-2 rounded-md',
        'hover:bg-accent/50 transition-colors text-left',
        'group'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold',
          result.type === 'stock' ? 'bg-blue-500/20 text-blue-500' : 'bg-amber-500/20 text-amber-500'
        )}
      >
        {result.symbol.slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{result.symbol}</span>
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              result.type === 'stock' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
            )}
          >
            {result.type}
          </span>
        </div>
        <div className="text-xs text-muted-foreground truncate">{result.name}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
