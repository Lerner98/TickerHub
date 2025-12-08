/**
 * Global UI Patterns - The "Vibe Enforcer"
 * Following Gold Standard: Never repeat raw Tailwind classes in components
 */

export const GLOBAL_STYLES = {
  layout: {
    container: 'max-w-[1600px] mx-auto px-4 md:px-6',
    section: 'py-6',
    flexCenter: 'flex items-center justify-center',
    flexBetween: 'flex items-center justify-between',
    flexCol: 'flex flex-col',
    grid: 'grid gap-6',
    gridCols2: 'grid grid-cols-1 xl:grid-cols-2 gap-6',
    gridCols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    gridCols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
  },

  components: {
    page: 'min-h-screen flex flex-col',
    main: 'flex-1 py-6',
    glassCard: 'rounded-xl border bg-card/60 backdrop-blur-sm text-card-foreground shadow-sm',
    glassCardHover: 'rounded-xl border bg-card/60 backdrop-blur-sm text-card-foreground shadow-sm hover:shadow-md hover:bg-card/80 transition-all duration-200',
  },

  typography: {
    pageTitle: 'text-2xl sm:text-3xl font-bold tracking-tight',
    sectionTitle: 'text-lg font-semibold mb-4',
    subtitle: 'text-muted-foreground',
    label: 'text-sm font-medium',
    value: 'font-mono',
    muted: 'text-sm text-muted-foreground',
  },

  effects: {
    glass: 'bg-background/80 backdrop-blur-md border-b border-border/50',
    glow: 'shadow-[0_0_20px_hsl(var(--primary)/0.3)]',
    glowStrong: 'shadow-[0_0_40px_hsl(var(--primary)/0.5)]',
    textGlow: 'text-glow-primary',
  },

  states: {
    loading: 'animate-pulse opacity-50 pointer-events-none',
    disabled: 'opacity-50 cursor-not-allowed',
    error: 'border-destructive text-destructive',
    success: 'text-green-500',
    negative: 'text-red-500',
  },

  interactive: {
    clickable: 'cursor-pointer hover:bg-accent/10 transition-colors',
    focusRing: 'focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
  },
} as const;

/**
 * Price change color utilities
 */
export function getPriceChangeColor(change: number): string {
  if (change > 0) return GLOBAL_STYLES.states.success;
  if (change < 0) return GLOBAL_STYLES.states.negative;
  return GLOBAL_STYLES.typography.muted;
}

/**
 * Format price change with sign
 */
export function formatPriceChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}
