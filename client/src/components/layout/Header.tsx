import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, Menu, X, Activity, Layers, BarChart3, Building2, Bitcoin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, detectSearchType } from '@/lib/utils';
import { useAssetSearch, type SearchResult } from '@/hooks/useAssetSearch';
import { UserMenu } from '@/components/auth';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Activity },
  { href: '/explorer/ethereum', label: 'Explorer', icon: Layers },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Header() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { stockResults, cryptoResults, hasResults } = useAssetSearch(searchQuery);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const { type, chain } = detectSearchType(searchQuery);

    switch (type) {
      case 'block':
        setLocation(`/block/${searchQuery}?chain=ethereum`);
        setSearchQuery('');
        setShowDropdown(false);
        break;
      case 'transaction':
        setLocation(`/tx/${searchQuery}`);
        setSearchQuery('');
        setShowDropdown(false);
        break;
      case 'address':
        setLocation(`/address/${searchQuery}`);
        setSearchQuery('');
        setShowDropdown(false);
        break;
      default:
        // For stocks/crypto, user must select from dropdown - don't navigate on Enter
        // Just keep the dropdown open so they can select a result
        if (hasResults) {
          setShowDropdown(true);
        }
        return;
    }
  };

  const handleAssetSelect = (result: SearchResult) => {
    if (result.type === 'stock') {
      setLocation(`/stocks/${result.symbol}`);
    } else {
      setLocation(`/crypto/${result.id}`);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 backdrop-blur-md bg-background/80">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="absolute inset-0 rounded-lg bg-primary/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xl font-bold tracking-tight text-glow-primary hidden sm:block">
                TickerHub
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "gap-2",
                        isActive && "bg-primary/10 text-primary"
                      )}
                      data-testid={`nav-${link.label.toLowerCase()}`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:block">
            <div
              ref={searchRef}
              className={cn(
                "relative transition-all duration-300",
                isSearchFocused && "scale-[1.02]"
              )}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search stocks, addresses, tx hash..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(e.target.value.length > 0);
                }}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (searchQuery.length > 0) setShowDropdown(true);
                }}
                onBlur={() => setIsSearchFocused(false)}
                className={cn(
                  "pl-10 pr-4 bg-card/60 border-border/50 placeholder:text-muted-foreground/60",
                  "focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                  "transition-all duration-300"
                )}
                data-testid="input-search"
              />
              {isSearchFocused && (
                <div className="absolute inset-0 -z-10 rounded-md bg-primary/10 blur-md" />
              )}

              {/* Search Results Dropdown */}
              {showDropdown && hasResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
                  <div className="p-2">
                    {/* Stocks Section */}
                    {stockResults.length > 0 && (
                      <>
                        <div className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" />
                          Stocks
                        </div>
                        {stockResults.slice(0, 4).map((result) => (
                          <button
                            key={`stock-${result.id}`}
                            type="button"
                            onClick={() => handleAssetSelect(result)}
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-primary/10 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{result.name}</div>
                              <div className="text-xs text-muted-foreground">{result.symbol} {result.exchange && `• ${result.exchange}`}</div>
                            </div>
                          </button>
                        ))}
                      </>
                    )}

                    {/* Crypto Section */}
                    {cryptoResults.length > 0 && (
                      <>
                        <div className="text-xs font-medium text-muted-foreground px-2 py-1 mt-2 flex items-center gap-1.5">
                          <Bitcoin className="w-3 h-3" />
                          Crypto
                        </div>
                        {cryptoResults.slice(0, 4).map((result) => (
                          <button
                            key={`crypto-${result.id}`}
                            type="button"
                            onClick={() => handleAssetSelect(result)}
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-primary/10 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                              <Bitcoin className="w-4 h-4 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{result.name}</div>
                              <div className="text-xs text-muted-foreground">{result.symbol} • {result.category}</div>
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </form>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="text-xs font-medium text-accent">Live</span>
            </div>

            <UserMenu />

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search stocks, crypto..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(e.target.value.length > 0);
                  }}
                  onFocus={() => {
                    if (searchQuery.length > 0) setShowDropdown(true);
                  }}
                  className="pl-10 bg-card/60"
                  data-testid="input-search-mobile"
                />
                {/* Mobile Search Results Dropdown */}
                {showDropdown && hasResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg overflow-hidden z-50 max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {stockResults.length > 0 && (
                        <>
                          <div className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3" />
                            Stocks
                          </div>
                          {stockResults.slice(0, 4).map((result) => (
                            <button
                              key={`mobile-stock-${result.id}`}
                              type="button"
                              onClick={() => {
                                handleAssetSelect(result);
                                setIsMobileMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-primary/10 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{result.name}</div>
                                <div className="text-xs text-muted-foreground">{result.symbol}</div>
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                      {cryptoResults.length > 0 && (
                        <>
                          <div className="text-xs font-medium text-muted-foreground px-2 py-1 mt-2 flex items-center gap-1.5">
                            <Bitcoin className="w-3 h-3" />
                            Crypto
                          </div>
                          {cryptoResults.slice(0, 4).map((result) => (
                            <button
                              key={`mobile-crypto-${result.id}`}
                              type="button"
                              onClick={() => {
                                handleAssetSelect(result);
                                setIsMobileMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-primary/10 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <Bitcoin className="w-4 h-4 text-orange-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{result.name}</div>
                                <div className="text-xs text-muted-foreground">{result.symbol}</div>
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = location.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-2",
                        isActive && "bg-primary/10 text-primary"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-testid={`nav-mobile-${link.label.toLowerCase()}`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
