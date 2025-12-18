# TickerHub Deployment Guide

## Coolify + GitHub Actions CI/CD

> Based on Solo Developer Infrastructure Guide (Tier 1 VPS Stack) and Unified AI Engineering Knowledge System CI/CD patterns.

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
│           ┌───────────────┼───────────────┐                │
│           ▼               ▼               ▼                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Frontend   │  │   Backend   │  │   Redis     │        │
│  │  (React)    │  │  (Express)  │  │  (Cache)    │        │
│  │  Port 80    │  │  Port 5000  │  │  Port 6379  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                           │                                 │
│                           ▼                                 │
│              ┌─────────────────────┐                       │
│              │   External APIs     │                       │
│              │  - CoinGecko        │                       │
│              │  - Etherscan        │                       │
│              │  - Blockchain.info  │                       │
│              │  - Finnhub (future) │                       │
│              └─────────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

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
- **RAM**: 4GB (8GB+ recommended for stock expansion)
- **Storage**: 40GB SSD
- **OS**: Ubuntu 22.04 LTS

---

## 2. Coolify Setup

### Install Coolify (One Command)

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Access Coolify at `http://your-server-ip:3080`

> **Note**: Ports 8000 and 9000 are already in use by other applications on the VPS. Coolify is configured to use port 3080 instead. You can customize this during installation or in Coolify settings.

### Create New Application

1. **Add New Resource** → **Application**
2. **Source**: GitHub (connect your repo)
3. **Build Pack**: Nixpacks (auto-detects Node.js)
4. **Branch**: `main`

### Environment Variables

Set these in Coolify's Environment Variables section:

```bash
# Required
NODE_ENV=production
PORT=5000

# API Keys
ETHERSCAN_API_KEY=your_etherscan_key

# Future: Stock Market Expansion
# FINNHUB_API_KEY=your_finnhub_key

# Optional: Database (when needed)
# DATABASE_URL=postgresql://user:pass@localhost:5432/tickerhub
```

### Build & Start Commands

```bash
# Build Command
npm run build

# Start Command
npm run start
```

### Health Check

- **Path**: `/api/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds

---

## 3. Dockerfile (Production)

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start
CMD ["node", "dist/index.cjs"]
```

---

## 4. GitHub Actions CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript check
        run: npm run check

      - name: Build
        run: npm run build

      # Future: Add tests
      # - name: Run tests
      #   run: npm test

  deploy:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify Deployment
        run: |
          curl -X POST "${{ secrets.COOLIFY_WEBHOOK_URL }}" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"

      - name: Wait for deployment
        run: sleep 30

      - name: Health check
        run: |
          for i in {1..30}; do
            if curl -s "${{ secrets.APP_URL }}/api/health" | grep -q "ok"; then
              echo "Deployment successful!"
              exit 0
            fi
            echo "Waiting for health check... ($i/30)"
            sleep 2
          done
          echo "Health check failed!"
          exit 1

      - name: Notify on failure
        if: failure()
        run: |
          echo "Deployment failed - manual intervention required"
          # Future: Add Telegram/Discord notification
          # curl -X POST "${{ secrets.TELEGRAM_WEBHOOK }}" \
          #   -d "text=TickerHub deployment FAILED: ${{ github.sha }}"
```

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `COOLIFY_WEBHOOK_URL` | Coolify deployment webhook |
| `COOLIFY_TOKEN` | Coolify API token |
| `APP_URL` | Production URL (e.g., https://tickerhub.com) |

---

## 5. Environment Files

### `.env.example`

```bash
# Server
NODE_ENV=development
PORT=5000

# API Keys (Required)
ETHERSCAN_API_KEY=

# API Keys (Future - Stock Market Expansion)
FINNHUB_API_KEY=

# Database (Future - when adding persistence)
DATABASE_URL=
```

### Production `.env`

Never commit this! Set in Coolify or server environment.

---

## 6. Health Check Endpoint

Already implemented at `server/api/stats/routes.ts`:

```typescript
// GET /api/health
{
  status: "ok",
  timestamp: "2025-12-08T00:00:00.000Z",
  uptime: 3600,
  responseTime: 150,
  services: {
    coingecko: { status: "ok", responseTime: 200 },
    etherscan: { status: "ok", responseTime: 150 }
  }
}
```

---

## 7. Rollback Strategy

### Via Coolify UI
1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **Rollback**

### Via Git
```bash
# Revert to previous commit
git revert HEAD
git push origin main
# CI/CD will auto-deploy the reverted version
```

### Manual Docker Rollback
```bash
# SSH into server
ssh user@your-server

# List previous images
docker images tickerhub --format "{{.Tag}} {{.CreatedAt}}"

# Rollback to specific version
docker-compose down
docker tag tickerhub:previous tickerhub:latest
docker-compose up -d
```

---

## 8. Monitoring

### Built-in Logging

```typescript
// server/lib/logger.ts provides structured logging
[2025-12-08T00:00:00.000Z] [INFO] [api] GET /api/prices 200 in 150ms
```

### Coolify Metrics
- CPU/Memory usage
- Request counts
- Error rates

### Future: Grafana Stack
```yaml
# docker-compose.monitoring.yml (optional)
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
```

---

## 9. SSL/HTTPS

### Via Coolify (Automatic)
1. Add your domain in Coolify
2. Enable "Generate SSL Certificate"
3. Coolify uses Let's Encrypt automatically

### Via Cloudflare (Recommended)
1. Add domain to Cloudflare
2. Set SSL mode to "Full (Strict)"
3. Enable "Always Use HTTPS"

---

## 10. Quick Deploy Checklist

```
PRE-DEPLOYMENT
[ ] VPS provisioned with Ubuntu 22.04
[ ] Coolify installed and accessible
[ ] GitHub repo connected to Coolify
[ ] Environment variables configured
[ ] Domain configured (optional)

CI/CD SETUP
[ ] .github/workflows/deploy.yml created
[ ] GitHub secrets configured
[ ] Webhook URL from Coolify added

FIRST DEPLOYMENT
[ ] Push to main branch
[ ] CI passes (lint + build)
[ ] Coolify deploys automatically
[ ] Health check passes at /api/health
[ ] Frontend accessible

POST-DEPLOYMENT
[ ] SSL certificate active
[ ] Monitoring dashboard accessible
[ ] Rollback tested
```

---

## 11. Cost Breakdown

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| VPS (Hostinger KVM4) | $12 | 4 vCPU, 16GB RAM |
| Domain | $0-12/yr | Optional |
| Cloudflare | $0 | Free tier |
| GitHub Actions | $0 | Free for public repos |
| **Total** | **~$12-15/mo** | |

---

## 12. Future Expansion Notes

### Stock Market (Finnhub API)
- Add `FINNHUB_API_KEY` to environment
- Service already prepared at `server/api/stocks/`
- Frontend hooks ready at `client/src/features/stocks/`

### Database (PostgreSQL)
- Add PostgreSQL service in Coolify
- Update `DATABASE_URL` environment variable
- Drizzle ORM already configured

### Redis Cache
- Add Redis service in Coolify
- Replace in-memory cache with Redis client
- Improves multi-instance scaling

---

*Last Updated: December 2025*
*Stack: Express + TypeScript + React + Vite*
