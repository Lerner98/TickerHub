# Coolify Deployment Template
## Universal Reference for devprojects.cloud

---

## 🖥️ VPS Quick Reference

| Property | Value |
|----------|-------|
| **VPS IP** | `72.62.60.212` |
| **SSH** | `ssh guy@72.62.60.212` |
| **Coolify** | `https://coolify.devprojects.cloud` |
| **Domain** | `devprojects.cloud` |
| **OS** | Ubuntu 24.04 LTS |
| **RAM** | 16GB |
| **Storage** | 200GB NVMe |

---

## 🚢 Port Allocation Registry

**Track your ports here to avoid conflicts!**

| Port | App | Status |
|------|-----|--------|
| 8000 | Coolify UI | 🔴 RESERVED |
| 5678 | n8n | 🔴 IN USE |
| ~~8000~~ | ~~Scheduler Bot~~ | 🔴 CONFLICT |
| 3000 | [YOUR APP] | ⚪ Available |
| 3001 | [YOUR APP] | ⚪ Available |
| 4000 | [YOUR APP] | ⚪ Available |
| 5000 | [YOUR APP] | ⚪ Available |
| 5001 | [YOUR APP] | ⚪ Available |
| 6000 | [YOUR APP] | ⚪ Available |
| 7000 | [YOUR APP] | ⚪ Available |
| 9000 | [YOUR APP] | ⚪ Available |
| 9001 | [YOUR APP] | ⚪ Available |

**Rule: Update this table every time you deploy a new app!**

---

## 📁 Dockerfile Templates

### Python/FastAPI
```dockerfile
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /app/data

# ⚠️ CHANGE PORT - Pick from available ports above
EXPOSE ${PORT:-3000}

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "${PORT:-3000}", "--workers", "1"]
```

### Node.js/Express
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# ⚠️ CHANGE PORT - Pick from available ports above
EXPOSE ${PORT:-3000}

CMD ["node", "server.js"]
```

### React/Vite (Static Build with Nginx)
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# ⚠️ CHANGE PORT - Pick from available ports above
EXPOSE ${PORT:-3000}

CMD ["nginx", "-g", "daemon off;"]
```

### Full-Stack (Frontend + Backend)
```dockerfile
# Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Build backend
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend /app/frontend/dist ./static

RUN mkdir -p /app/data

# ⚠️ CHANGE PORT
EXPOSE ${PORT:-3000}

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${PORT:-3000}"]
```

---

## 📄 docker-compose.yml Template

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: ${APP_NAME:-myapp}
    restart: unless-stopped
    ports:
      # ⚠️ CHANGE PORT - Format: "HOST_PORT:CONTAINER_PORT"
      - "${PORT:-3000}:${PORT:-3000}"
    env_file: .env
    volumes:
      - ./data:/app/data
    
    # Resource limits
    mem_limit: 512m
    mem_reservation: 256m
    cpus: 0.5
    
    # Health check
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:${PORT:-3000}/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    
    # Logging
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  app_data:
    driver: local
```

---

## 🔐 .env.template

```bash
# ============================================
# APP CONFIGURATION
# ============================================
APP_NAME=myapp
HOST=0.0.0.0

# ⚠️ CHANGE PORT - Must match Coolify config!
PORT=3000

# ============================================
# DATABASE (Choose one)
# ============================================
# SQLite (simple, file-based)
DATABASE_URL=sqlite:///./data/app.db

# PostgreSQL (if using external DB)
# DATABASE_URL=postgresql://user:pass@host:5432/dbname

# MongoDB
# MONGODB_URI=mongodb://localhost:27017/dbname

# ============================================
# API KEYS (Add as needed)
# ============================================
# GEMINI_API_KEY=
# OPENAI_API_KEY=
# FINNHUB_API_KEY=
# COINGECKO_API_KEY=

# ============================================
# NOTIFICATIONS (Optional)
# ============================================
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_CHAT_ID=

# ============================================
# INTEGRATIONS (Optional)
# ============================================
# N8N_ENABLED=false
# N8N_WEBHOOK_URL=https://n8n.devprojects.cloud
```

---

## ✅ Coolify Deployment Checklist

### Step 1: Prepare Repository
- [ ] `Dockerfile` exists and PORT is set
- [ ] `docker-compose.yml` exists (optional but recommended)
- [ ] `.env.template` exists (no secrets!)
- [ ] `.gitignore` includes `.env`, `data/`, `__pycache__/`
- [ ] Health endpoint exists (`/health`)
- [ ] Push to GitHub

### Step 2: DNS Setup (Hostinger hPanel)
- [ ] Go to: hPanel → DNS Manager → devprojects.cloud
- [ ] Add A record:

| Type | Name | Points to | TTL |
|------|------|-----------|-----|
| A | `[subdomain]` | `72.62.60.212` | 14400 |

- [ ] Wait 5-10 minutes for propagation
- [ ] Verify: `nslookup [subdomain].devprojects.cloud`

### Step 3: Coolify Configuration
- [ ] Login: https://coolify.devprojects.cloud
- [ ] Projects → New Resource → Public Repository
- [ ] Connect GitHub repo
- [ ] Configure:

| Setting | Value |
|---------|-------|
| **Name** | Your app name |
| **Repository** | `https://github.com/Lerner98/[repo].git` |
| **Branch** | `main` |
| **Build Pack** | Dockerfile |
| **Port** | ⚠️ YOUR CHOSEN PORT (not 8000!) |
| **Domain** | `[subdomain].devprojects.cloud` |
| **HTTPS** | ✅ Enable |
| **Force HTTPS** | ✅ Enable |

### Step 4: Environment Variables
- [ ] Go to Environment tab in Coolify
- [ ] Add all variables from your `.env`
- [ ] **Critical:** `PORT` must match your Dockerfile/docker-compose

### Step 5: Storage (If needed)
- [ ] Add persistent volume:

| Source | Destination |
|--------|-------------|
| `./data` | `/app/data` |

### Step 6: Health Check
- [ ] Path: `/health`
- [ ] Port: YOUR CHOSEN PORT
- [ ] Interval: 30s

### Step 7: Deploy & Test
- [ ] Click Deploy
- [ ] Watch logs for errors
- [ ] Test: `curl https://[subdomain].devprojects.cloud/health`
- [ ] **Update Port Registry above!**

---

## 🔧 Useful Commands

### SSH to VPS
```bash
ssh guy@72.62.60.212
```

### Check Running Containers
```bash
docker ps
```

### Check Port Usage
```bash
sudo netstat -tlnp | grep LISTEN
# or
sudo ss -tlnp
```

### View Container Logs
```bash
docker logs -f CONTAINER_NAME
```

### Restart Container
```bash
docker restart CONTAINER_NAME
```

### Check Disk Space
```bash
df -h
```

### Check Memory
```bash
free -h
```

### Kill Process on Port (Emergency)
```bash
sudo fuser -k PORT/tcp
```

---

## 🚨 Troubleshooting

### Port Already Allocated
```bash
# Find what's using the port
sudo lsof -i :PORT
sudo netstat -tlnp | grep PORT

# Kill it (if safe)
sudo fuser -k PORT/tcp
```

### Container Won't Start
```bash
# Check logs
docker logs CONTAINER_NAME

# Check if port conflict
docker ps -a
```

### SSL Not Working
1. Check DNS is propagated: `nslookup subdomain.devprojects.cloud`
2. Check Coolify proxy: `docker ps | grep traefik`
3. Wait 5-10 minutes for Let's Encrypt

### Health Check Failing
1. Verify `/health` endpoint exists in your app
2. Check port matches in Coolify config
3. Check container logs for startup errors

---

## 📋 Quick Deploy Checklist (Copy-Paste)

```
NEW APP DEPLOYMENT: _______________
Date: _______________

[ ] Port chosen: _______
[ ] DNS A record added: _______.devprojects.cloud
[ ] Dockerfile PORT updated
[ ] docker-compose.yml PORT updated  
[ ] .env PORT matches
[ ] Coolify port configured
[ ] Health check port configured
[ ] Deployed successfully
[ ] Port Registry updated above
```

---

*Last updated: December 2025*
