/**
 * News Card Component
 *
 * Displays a single news article with image, title, source, and date.
 */

import { ExternalLink, Calendar } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { cn } from '@/lib/utils';

export interface NewsArticle {
  symbol: string;
  publishedDate: string;
  title: string;
  image: string;
  site: string;
  text: string;
  url: string;
}

interface NewsCardProps {
  article: NewsArticle;
  className?: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export function NewsCard({ article, className }: NewsCardProps) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <GlassCard
        className={cn(
          'p-4 transition-all duration-200 hover:bg-muted/50 hover:border-primary/30',
          className
        )}
      >
        <div className="flex gap-4">
          {/* Thumbnail */}
          {article.image && (
            <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted/50">
              <img
                src={article.image}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h4>

            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {article.text}
            </p>

            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">{article.site}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatRelativeTime(article.publishedDate)}
              </span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </GlassCard>
    </a>
  );
}

export default NewsCard;
