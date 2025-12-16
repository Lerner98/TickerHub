/**
 * News List Component
 *
 * Fetches and displays a list of news articles for a stock.
 */

import { useQuery } from '@tanstack/react-query';
import { Newspaper, Loader2, AlertCircle } from 'lucide-react';
import { NewsCard, type NewsArticle } from './NewsCard';
import { GlassCard } from '../GlassCard';

interface NewsListProps {
  symbol: string;
  limit?: number;
}

async function fetchStockNews(symbol: string, limit: number): Promise<NewsArticle[]> {
  const response = await fetch(`/api/stocks/${symbol}/news?limit=${limit}`);

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('FMP_NOT_CONFIGURED');
    }
    throw new Error('Failed to fetch news');
  }

  return response.json();
}

export function NewsList({ symbol, limit = 10 }: NewsListProps) {
  const {
    data: news,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['stockNews', symbol, limit],
    queryFn: () => fetchStockNews(symbol, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading news...</span>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    const isFMPNotConfigured = (error as Error).message === 'FMP_NOT_CONFIGURED';

    return (
      <GlassCard className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          Latest News
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          {isFMPNotConfigured ? (
            <>
              <p className="font-medium">News not available</p>
              <p className="text-sm mt-1">
                Configure FMP_API_KEY to enable stock news
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">Failed to load news</p>
              <p className="text-sm mt-1">Please try again later</p>
            </>
          )}
        </div>
      </GlassCard>
    );
  }

  if (!news || news.length === 0) {
    return (
      <GlassCard className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          Latest News
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No recent news for {symbol}</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2 px-1">
        <Newspaper className="w-5 h-5 text-primary" />
        Latest News
        <span className="text-sm text-muted-foreground font-normal">
          ({news.length} articles)
        </span>
      </h3>
      {news.map((article, index) => (
        <NewsCard key={`${article.url}-${index}`} article={article} />
      ))}
    </div>
  );
}

export default NewsList;
