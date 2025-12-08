# TickerHub - Coolify Deployment Guide

## Your VPS Setup (Already Configured)

| Property | Value |
|----------|-------|
| **VPS IP** | 72.62.60.212 |
| **Coolify URL** | https://coolify.devprojects.cloud |
| **SSH User** | guy |
| **Domain** | devprojects.cloud |
| **OS** | Ubuntu 24.04 LTS |
| **RAM** | 16GB |
| **Storage** | 200GB NVMe |

### Existing DNS Records
- `coolify.devprojects.cloud` → 72.62.60.212 ✅
- `devprojects.cloud` (@) → 72.62.60.212 ✅

---

## Pre-Deployment Checklist

### 1. Add DNS Record for TickerHub

Go to **Hostinger hPanel** → **DNS Manager** → **devprojects.cloud** → **Edit DNS**

Add new A record:
| Type | Name | Points to | TTL |
|------|------|-----------|-----|
| A | ticker | 72.62.60.212 | 14400 |

This creates: `ticker.devprojects.cloud`

### 2. Ensure GitHub Repo is Ready

Your TickerHub repo should have:
```
TickerHub/
├── client/                 # React frontend
├── server/                 # Express backend  
├── shared/                 # Shared types
├── Dockerfile              # For production build
├── docker-compose.yml      # For Coolify
├── package.json
└── .env.example           # Template (no secrets!)
```

**If no Dockerfile exists, create one:**

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "dist/index.js"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  tickerhub:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - COINGECKO_API_URL=${COINGECKO_API_URL:-https://api.coingecko.com/api/v3}
      - FINNHUB_API_KEY=${FINNHUB_API_KEY}
      - DATABASE_URL=${DATABASE_URL:-sqlite:///./data/tickerhub.db}
    volumes:
      - tickerhub_data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  tickerhub_data:
```

---

## Coolify Deployment Steps

### Step 1: Login to Coolify

Go to: https://coolify.devprojects.cloud

### Step 2: Create New Resource

1. Click **Projects** in left sidebar
2. Click on **My First Project** (or create new)
3. Click **+ Add New Resource**
4. Select **Public Repository**

### Step 3: Connect Repository

- **Repository URL:** `https://github.com/Lerner98/TickerHub.git`
- **Branch:** `main`
- **Build Pack:** Docker Compose (auto-detected from docker-compose.yml)

If Coolify asks for deploy key:
1. Copy the generated SSH key
2. Go to GitHub repo → Settings → Deploy keys
3. Add key with title "Coolify Deploy Key"

### Step 4: Configure Environment Variables

Go to **Environment** tab and add:

```bash
# Required
NODE_ENV=production
PORT=5000

# CoinGecko (free, no key needed)
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Finnhub (if stock features enabled)
FINNHUB_API_KEY=your_finnhub_api_key_here

# Database (optional - defaults to SQLite)
DATABASE_URL=sqlite:///./data/tickerhub.db
```

**Get Finnhub API Key:**
1. Go to https://finnhub.io/
2. Sign up (free)
3. Copy API key from dashboard

### Step 5: Configure Domain & Network

In **Domain** section:
- **Domain:** `ticker.devprojects.cloud`
- **Port:** `5000`
- **HTTPS:** Enable ✅
- **Force HTTPS:** Enable ✅

### Step 6: Configure Storage (Persistence)

In **Storages** or **Volumes** section:
- **Source:** `tickerhub_data`
- **Destination:** `/app/data`
- **Type:** Volume

This ensures your SQLite database persists across deployments.

### Step 7: Health Check

- **Path:** `/api/health`
- **Port:** `5000`
- **Interval:** `30s`

### Step 8: Resource Limits (Optional)

- **Memory:** `512MB` (TickerHub is lightweight)
- **CPU:** Leave empty

### Step 9: Deploy!

Click **Deploy** and watch the logs.

**Expected build time:** 3-5 minutes

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://ticker.devprojects.cloud/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-08T...",
  "services": {
    "coingecko": "connected",
    "finnhub": "connected"
  }
}
```

### 2. Test API Endpoints

```bash
# Get Bitcoin price
curl https://ticker.devprojects.cloud/api/crypto/bitcoin

# Get stock price (if Finnhub configured)
curl https://ticker.devprojects.cloud/api/stocks/AAPL

# Get market overview
curl https://ticker.devprojects.cloud/api/market/overview
```

### 3. Access Web UI

Open in browser: https://ticker.devprojects.cloud

You should see the TickerHub dashboard with:
- Live crypto prices
- Stock prices (if Finnhub enabled)
- Your cyber matrix theme

---

## Troubleshooting

### Build Fails

**Check logs in Coolify** → Click on deployment → View logs

Common issues:
- Missing `Dockerfile` or `docker-compose.yml`
- Wrong Node.js version (ensure node:20)
- Missing dependencies in `package.json`

### App Crashes After Deploy

```bash
# SSH into VPS
ssh guy@72.62.60.212

# Check Docker logs
docker logs $(docker ps -qf "name=tickerhub")
```

### Domain Not Working

1. Verify DNS:
   ```bash
   nslookup ticker.devprojects.cloud
   ```
   Should return `72.62.60.212`

2. Wait 5-10 minutes for DNS propagation

3. Check Coolify proxy is running:
   ```bash
   docker ps | grep traefik
   ```

### API Rate Limits

**CoinGecko:** 10-30 calls/minute (free tier)
- Solution: Implement caching in your app

**Finnhub:** 60 calls/minute (free tier)
- Solution: Cache responses for 1 minute

---

## Your Deployed Apps Summary

After deployment, you'll have:

| App | URL | Status |
|-----|-----|--------|
| Coolify | https://coolify.devprojects.cloud | ✅ Running |
| TickerHub | https://ticker.devprojects.cloud | ⏳ Deploy |
| Scheduler Bot | https://scheduler.devprojects.cloud | Previously configured |

---

## Quick Commands Reference

### SSH to VPS
```bash
ssh guy@72.62.60.212
```

### Check Running Containers
```bash
docker ps
```

### View App Logs
```bash
docker logs -f $(docker ps -qf "name=tickerhub")
```

### Restart App
```bash
# Via Coolify UI: Click Restart
# Or via SSH:
cd /data/coolify/services/...
docker compose restart
```

---

## Next Steps After Deployment

1. **Test all features** - Crypto prices, stock prices (if enabled)
2. **Set up monitoring** - Add to your Grafana if you have one
3. **Configure alerts** - Use Coolify's notification settings
4. **Add to portfolio** - Update your devprojects.cloud landing page

---

*Last updated: December 8, 2025*
