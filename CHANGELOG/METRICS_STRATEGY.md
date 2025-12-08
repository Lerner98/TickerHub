# TickerHub Metrics & Logging Strategy

**Document Type:** Internal Reference
**Last Updated:** 2025-12-08
**Purpose:** Define what we track, why, and how to analyze it

---

## Philosophy

This is **internal tooling** for:
1. Debugging production issues
2. Understanding usage patterns
3. Capacity planning for API rate limits
4. Performance optimization decisions

NOT for: User-facing dashboards, real-time monitoring UI

---

## Current Logging (v0.1.0)

### What We Log

| Log Type | Location | Format | Example |
|----------|----------|--------|---------|
| Requests | Console | `{time} [api] {method} {path} {status} in {ms}ms` | `2:30:45 PM [api] GET /api/prices 200 in 145ms` |
| Errors | Console | `{time} [error] ERROR: {message}` | `2:30:45 PM [error] ERROR: CoinGecko timeout` |
| Debug | Console (dev) | `{time} [{source}] DEBUG: {message}` | `2:30:45 PM [cache] DEBUG: Hit for prices` |
| Startup | Console | `{time} [express] {message}` | `2:30:45 PM [express] Server running on port 5000` |

### Logger Implementation
```typescript
// server/lib/logger.ts
log(message, source, level)      // General logging
logRequest(method, path, status, duration)  // API requests
logError(error, context)         // Error with stack trace
```

---

## Metrics We Should Track

### Tier 1: Essential (Implement First)

| Metric | Why | How to Use |
|--------|-----|------------|
| **Request count by endpoint** | Identify hot paths | Optimize caching for high-traffic routes |
| **Response times (p50, p95, p99)** | Performance baseline | Alert if degradation |
| **Error rate by endpoint** | Reliability | Prioritize fixes |
| **Cache hit/miss ratio** | Cache effectiveness | Tune TTLs |
| **External API latency** | Dependency health | Failover decisions |

### Tier 2: Important (Implement Later)

| Metric | Why | How to Use |
|--------|-----|------------|
| **Rate limit hits** | Abuse detection | Adjust limits or block IPs |
| **Unique IPs per hour** | Usage growth | Capacity planning |
| **External API quota usage** | Budget tracking | Provider rotation |
| **Memory usage** | Resource planning | Scale decisions |
| **Cache size over time** | Memory pressure | Eviction tuning |

### Tier 3: Nice to Have

| Metric | Why |
|--------|-----|
| Response size distribution | Bandwidth optimization |
| Client user agents | Device/browser insights |
| Geographic distribution | CDN decisions |
| Query parameter patterns | Feature usage |

---

## Implementation Plan

### Phase 1: Enhanced Logger (No Dependencies)

Extend current logger to track aggregates in-memory:

```typescript
// server/lib/metrics.ts
interface MetricsStore {
  requests: {
    [endpoint: string]: {
      count: number;
      totalDuration: number;
      errors: number;
      statusCodes: Record<number, number>;
    };
  };
  cache: {
    hits: number;
    misses: number;
  };
  externalApis: {
    [api: string]: {
      calls: number;
      totalLatency: number;
      errors: number;
    };
  };
  startTime: number;
}
```

Expose via internal endpoint:
```
GET /api/internal/metrics  # Protected, not public
```

### Phase 2: Structured Logging (Optional)

If we need searchable logs later:
- Output JSON format logs
- Ship to free tier: Logtail, Axiom, or Grafana Cloud
- Query with SQL-like syntax

### Phase 3: Time Series (If Needed)

Only if we need historical trends:
- InfluxDB or TimescaleDB
- Grafana for visualization
- This is likely overkill for solo dev

---

## Analysis Patterns

### Daily Health Check (Manual)

```bash
# Check error rate
grep "ERROR" server.log | wc -l

# Check slow requests (>1s)
grep "in [0-9]\{4,\}ms" server.log

# Check rate limit hits
grep "rate limit" server.log
```

### Weekly Review Questions

1. Which endpoints are slowest?
2. What's the cache hit rate?
3. Are we approaching API rate limits?
4. Any recurring errors?
5. Memory usage stable?

### Incident Investigation

1. Check `/api/health` response
2. Review recent error logs
3. Check external API status
4. Review cache stats
5. Check rate limit status

---

## API Rate Limit Tracking

### Current Limits

| Provider | Limit | Our Buffer | Alert At |
|----------|-------|------------|----------|
| CoinGecko | 10-30/min | 50% | 15/min |
| Etherscan | 5/sec | 50% | 3/sec |
| Finnhub | 60/min | 50% | 30/min |
| Gemini | 15 RPM | 80% | 12/min |
| Groq | 30 RPM | 80% | 24/min |

### Tracking Strategy

```typescript
// Track per-provider usage
externalApiCalls: {
  coingecko: { count: 0, windowStart: Date.now() },
  etherscan: { count: 0, windowStart: Date.now() },
  // ...
}
```

Log warning when approaching limits:
```
WARN: CoinGecko at 80% rate limit (24/30 calls this minute)
```

---

## Cache Metrics

### What to Track

```typescript
interface CacheStats {
  size: number;           // Current entries
  hits: number;           // Successful retrievals
  misses: number;         // Cache misses
  hitRate: number;        // hits / (hits + misses)
  evictions: number;      // Expired entries removed
  memoryEstimate: number; // Rough bytes used
}
```

### Current Implementation

The cache already exposes basic stats:
```typescript
cache.stats() // { size: number, keys: string[] }
```

Need to add: hit/miss counters, hit rate calculation

---

## Error Classification

### Categories

| Code | Category | Action |
|------|----------|--------|
| 4xx | Client Error | Log, no alert |
| 408 | Timeout | Log, check external API |
| 429 | Rate Limited | Log, review limits |
| 500 | Server Error | Alert, investigate |
| 502/503 | Upstream Error | Log, failover |

### Error Log Format

```typescript
{
  timestamp: ISO8601,
  level: 'error',
  code: number,
  message: string,
  endpoint: string,
  stack?: string,  // dev only
  context?: object
}
```

---

## Internal Metrics Endpoint

### Specification

```
GET /api/internal/metrics
Authorization: Bearer {METRICS_SECRET}
```

Response:
```json
{
  "uptime": 3600,
  "memory": {
    "heapUsed": 52428800,
    "heapTotal": 67108864,
    "rss": 89128960
  },
  "requests": {
    "total": 15420,
    "byEndpoint": {
      "/api/prices": { "count": 8420, "avgMs": 145, "errors": 12 },
      "/api/health": { "count": 2100, "avgMs": 89, "errors": 0 }
    }
  },
  "cache": {
    "size": 24,
    "hits": 12500,
    "misses": 2920,
    "hitRate": 0.81
  },
  "externalApis": {
    "coingecko": { "calls": 420, "avgMs": 312, "errors": 3 },
    "etherscan": { "calls": 89, "avgMs": 456, "errors": 1 }
  },
  "rateLimit": {
    "blocked": 15,
    "topIps": ["192.168.1.1"]
  }
}
```

### Security

- Not publicly accessible
- Requires secret token
- Only exposed in production if explicitly enabled
- IP whitelist option

---

## Decision Log

### 2025-12-08: No External Monitoring Service
**Decision:** Keep metrics in-memory, expose via internal endpoint
**Rationale:**
- Solo dev, no budget for monitoring SaaS
- Can upgrade to Grafana Cloud free tier later
- Simplicity over features

### 2025-12-08: Console Logging Sufficient
**Decision:** Stick with structured console logs
**Rationale:**
- Coolify captures stdout
- Can grep/search logs manually
- No need for ELK/Splunk complexity

---

## Future Considerations

### When to Add External Monitoring

Add Grafana Cloud (free tier) when:
1. Multiple users complaining about performance
2. Need to debug issues not reproducible locally
3. Want historical trend analysis
4. Approaching production traffic

### When to Add APM

Add Sentry/New Relic when:
1. Complex error traces needed
2. Multiple services to correlate
3. User session replay needed
4. Budget allows (~$30/month)

---

## Quick Reference

### Log Grep Patterns

```bash
# All errors
grep "\[error\]" logs.txt

# Slow requests (>500ms)
grep -E "in [5-9][0-9]{2}ms|in [0-9]{4,}ms" logs.txt

# Specific endpoint
grep "/api/prices" logs.txt

# Rate limit events
grep -i "rate.limit" logs.txt

# External API errors
grep -E "coingecko|etherscan|finnhub" logs.txt | grep -i error
```

### Health Check Command

```bash
curl -s http://localhost:5000/api/health | jq .
```
