# TickerHub Production Dockerfile
# Multi-stage build for optimal image size

# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# =============================================================================
# Stage 2: Production Runner
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 tickerhub

# Copy built assets from builder
COPY --from=builder --chown=tickerhub:nodejs /app/dist ./dist
COPY --from=builder --chown=tickerhub:nodejs /app/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Switch to non-root user
USER tickerhub

# Environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application (ESM)
CMD ["node", "dist/index.mjs"]
