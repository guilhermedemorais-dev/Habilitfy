# =====================
# Stage 1: Dependencies
# =====================
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --legacy-peer-deps

# =====================
# Stage 2: Builder
# =====================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules

# Copy source code
COPY . .

# Build client and server
ENV NODE_ENV=production
RUN npm run build

# =====================
# Stage 3: Production
# =====================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 habilitfy

# Install only production dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev && npm cache clean --force

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Copy shared and migrations
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/drizzle.config.ts ./

# Create uploads directory
RUN mkdir -p uploads/kyc && chown -R habilitfy:nodejs uploads

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5000

# Switch to non-root user
USER habilitfy

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
