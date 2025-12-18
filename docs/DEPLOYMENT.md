# TickerHub Deployment Guide

## Coolify + GitHub Actions CI/CD

Production deployment using Coolify's native git integration with GitHub Actions for quality gates.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TICKERHUB STACK                          │
│                   (VPS - 4 vCPU, 16GB)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    COOLIFY                           │   │
│  │         (Self-hosted PaaS - manages everything)      │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│           ┌───────────────┴───────────────┐                │
│           ▼                               ▼                │
│  ┌─────────────────────┐    ┌─────────────────────┐       │
│  │  TickerHub App      │    │   Neon PostgreSQL   │       │
│  │  (Express + React)  │    │   (Managed DB)      │       │
│  │  Port 5000          │    │   External Service  │       │
│  │  In-memory cache    │    └─────────────────────┘       │
│  └─────────────────────┘                                   │
│             │                                              │
│             ▼                                              │
│  ┌─────────────────────────────────────────────┐          │
│  │              External APIs                   │          │
│  │  - CoinGecko (crypto prices)                │          │
│  │  - Twelve Data (stock quotes + historical)  │          │
│  │  - Finnhub (stock quotes fallback)          │          │
│  │  - Blockchair (blockchain explorer)         │          │
│  └─────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Current Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Frontend | React 18 + Vite + TailwindCSS | shadcn/ui components |
| Backend | Express + TypeScript | Node.js 20 |
| Database | Neon PostgreSQL | Managed, serverless |
| ORM | Drizzle | Type-safe queries |
| Auth | Better Auth | Google OAuth, sessions |
| Cache | In-memory | Per-instance cache |
| CI | GitHub Actions | Type check + build |
| CD | Coolify | Dockerfile-based deploy |

---

## 1. VPS Requirements

### Recommended Providers

| Provider | Plan | Specs | Cost | Notes |
|----------|------|-------|------|-------|
| Hetzner | CX22 | 2 vCPU, 4GB, 40GB | €4/mo | EU hosting, great value |
| Hostinger | KVM 4 | 4 vCPU, 16GB, 200GB | $12/mo | Best value for expansion |
| DigitalOcean | Basic | 2 vCPU, 4GB, 80GB | $24/mo | Easy UI |

### Minimum Requirements
- **CPU**: 2 vCPU
- **RAM**: 4GB (8GB+ recommended)
- **Storage**: 40GB SSD
- **OS**: Ubuntu 22.04 LTS

---

## 2. Coolify Setup

### Install Coolify (One Command)

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Access Coolify at `http://your-server-ip:3080`

### Create New Application

1. **Add New Resource** → **Application**
2. **Source**: GitHub (connect repo: `Lerner98/TickerHub`)
3. **Build Pack**: Dockerfile
4. **Branch**: `main`
5. **Base Directory**: `TickerHub` (inner folder where Dockerfile lives)

### Environment Variables

Set these in Coolify's Environment Variables section:

```bash
# Required
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@your-neon-host/tickerhub
APP_URL=https://ticker.devprojects.cloud

# Authentication (Google OAuth)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret

# Optional API Keys (enhances functionality)
FINNHUB_API_KEY=your-finnhub-key
TWELVE_DATA_API_KEY=your-twelve-data-key
```

### Domain Configuration

1. Domain: `ticker.devprojects.cloud`
2. Enable HTTPS (Let's Encrypt)
3. Port: 5000

---

## 3. Dockerfile

The Dockerfile is located at `TickerHub/Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "dist/index.cjs"]
```

---

## 4. GitHub Actions CI

CI workflow at `.github/workflows/ci.yml` provides quality gates without duplicating Coolify's deployment:

```yaml
name: CI

on:
  push:
    branches: [main, pre-prod]
  pull_request:
    branches: [main]

jobs:
  quality-gate:
    name: Type Check & Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run check
      - run: npm run build

  health-check:
    name: Health Check
    needs: quality-gate
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Wait for Coolify deployment
        run: sleep 90
      - name: Verify deployment health
        run: |
          # Retries health check up to 20 times
          curl -sf "${{ secrets.APP_URL }}/api/health" | grep '"status":"ok"'
```

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `APP_URL` | Production URL (e.g., `https://ticker.devprojects.cloud`) |

**Note**: Coolify handles deployment via its native git integration. No webhook secrets needed.

---

## 5. Health Check Endpoint

`GET /api/health` returns:

```json
{
  "status": "ok",
  "timestamp": "2025-12-18T00:00:00.000Z"
}
```

---

## 6. OAuth Configuration

### Google OAuth Setup

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Set authorized redirect URI:
   ```
   https://ticker.devprojects.cloud/api/auth/callback/google
   ```
4. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Coolify env vars

---

## 7. Rollback Strategy

### Via Coolify UI
1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **Rollback**

### Via Git
```bash
git revert HEAD
git push origin main
# Coolify auto-deploys the reverted version
```

---

## 8. SSL/HTTPS

### Via Coolify (Automatic)
1. Add your domain in Coolify
2. Enable "Generate SSL Certificate"
3. Coolify uses Let's Encrypt automatically

### Via Cloudflare (Recommended)
1. Add domain to Cloudflare
2. Set SSL mode to "Full (Strict)"
3. Enable "Always Use HTTPS"

---

## 9. Deploy Checklist

```
PRE-DEPLOYMENT
[ ] VPS provisioned with Ubuntu 22.04
[ ] Coolify installed and accessible
[ ] GitHub repo connected to Coolify
[ ] Base directory set to "TickerHub"
[ ] Environment variables configured
[ ] Neon database accessible
[ ] Google OAuth credentials ready

FIRST DEPLOYMENT
[ ] Push to main branch
[ ] GitHub Actions CI passes
[ ] Coolify builds Dockerfile
[ ] Health check passes at /api/health
[ ] Frontend accessible
[ ] Google OAuth flow works

POST-DEPLOYMENT
[ ] SSL certificate active
[ ] Verify crypto prices load
[ ] Verify stock quotes work
[ ] Test watchlist functionality
```

---

## 10. Monitoring

### Built-in Logging

```
[2025-12-18T00:00:00.000Z] [INFO] [api] GET /api/prices 200 in 150ms
```

### Coolify Metrics
- CPU/Memory usage
- Container logs
- Deployment history

---

## 11. API Rate Limits

| API | Limit | Tier |
|-----|-------|------|
| CoinGecko | 10-30 calls/min | Free |
| Twelve Data | 800 calls/day, 8/min | Free |
| Finnhub | 60 calls/min | Free |
| Blockchair | Generous free tier | Free |

---

## 12. Cost Breakdown

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| VPS (Hostinger KVM4) | $12 | 4 vCPU, 16GB RAM |
| Neon PostgreSQL | $0 | Free tier |
| Domain | $0-12/yr | Optional |
| Cloudflare | $0 | Free tier |
| GitHub Actions | $0 | Free for public repos |
| **Total** | **~$12-15/mo** | |

---

*Last Updated: December 2025*
*Stack: Express + TypeScript + React + Vite + Neon PostgreSQL + Better Auth*
