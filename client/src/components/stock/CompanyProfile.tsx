/**
 * Company Profile Component
 *
 * Displays detailed company information from FMP.
 */

import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Globe,
  Users,
  MapPin,
  Calendar,
  Briefcase,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { formatNumber } from '@/lib/utils';

export interface CompanyProfileData {
  symbol: string;
  companyName: string;
  currency: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  sector: string;
  country: string;
  description: string;
  ceo: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  image: string;
  ipoDate: string;
  mktCap: number;
  price: number;
  beta: number;
  volAvg: number;
  lastDiv: number;
  range: string;
  isEtf: boolean;
  isActivelyTrading: boolean;
}

interface CompanyProfileProps {
  symbol: string;
}

async function fetchCompanyProfile(symbol: string): Promise<CompanyProfileData> {
  const response = await fetch(`/api/stocks/${symbol}/profile`);

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('FMP_NOT_CONFIGURED');
    }
    if (response.status === 404) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

export function CompanyProfile({ symbol }: CompanyProfileProps) {
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['companyProfile', symbol],
    queryFn: () => fetchCompanyProfile(symbol),
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  });

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading profile...</span>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    const errorMessage = (error as Error).message;
    const isFMPNotConfigured = errorMessage === 'FMP_NOT_CONFIGURED';
    const isNotFound = errorMessage === 'PROFILE_NOT_FOUND';

    return (
      <GlassCard className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Company Overview
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          {isFMPNotConfigured ? (
            <>
              <p className="font-medium">Profile not available</p>
              <p className="text-sm mt-1">
                Configure FMP_API_KEY to enable company profiles
              </p>
            </>
          ) : isNotFound ? (
            <>
              <p className="font-medium">Profile not found</p>
              <p className="text-sm mt-1">
                No company data available for {symbol}
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">Failed to load profile</p>
              <p className="text-sm mt-1">Please try again later</p>
            </>
          )}
        </div>
      </GlassCard>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-start gap-4 mb-6">
        {profile.image && (
          <img
            src={profile.image}
            alt={profile.companyName}
            className="w-16 h-16 rounded-lg object-contain bg-white p-2"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{profile.companyName}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span className="font-mono">{profile.symbol}</span>
            <span>-</span>
            <span>{profile.exchangeShortName}</span>
          </div>
        </div>
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Globe className="w-4 h-4" />
            Website
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Description */}
      {profile.description && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
            {profile.description}
          </p>
        </div>
      )}

      {/* Key Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Sector</span>
          </div>
          <p className="font-medium text-sm truncate">{profile.sector || 'N/A'}</p>
        </div>

        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Building2 className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Industry</span>
          </div>
          <p className="font-medium text-sm truncate">{profile.industry || 'N/A'}</p>
        </div>

        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Employees</span>
          </div>
          <p className="font-medium text-sm">
            {profile.fullTimeEmployees
              ? formatNumber(parseInt(profile.fullTimeEmployees))
              : 'N/A'}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">IPO Date</span>
          </div>
          <p className="font-medium text-sm">{profile.ipoDate || 'N/A'}</p>
        </div>
      </div>

      {/* CEO and Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
        {profile.ceo && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CEO</p>
              <p className="font-medium text-sm">{profile.ceo}</p>
            </div>
          </div>
        )}

        {(profile.city || profile.country) && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Headquarters</p>
              <p className="font-medium text-sm">
                {[profile.city, profile.state, profile.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Additional Metrics */}
      {(profile.beta || profile.lastDiv > 0 || profile.range) && (
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
          {profile.beta && (
            <div>
              <p className="text-xs text-muted-foreground">Beta</p>
              <p className="font-medium">{profile.beta.toFixed(2)}</p>
            </div>
          )}

          {profile.lastDiv > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Last Dividend</p>
              <p className="font-medium">${profile.lastDiv.toFixed(2)}</p>
            </div>
          )}

          {profile.range && (
            <div>
              <p className="text-xs text-muted-foreground">52-Week Range</p>
              <p className="font-medium text-sm">{profile.range}</p>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

export default CompanyProfile;
