FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++

COPY package*.json ./
RUN npm ci --legacy-peer-deps

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs habilitfy \
    && apk add --no-cache wget

COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/attached_assets ./attached_assets
COPY --from=builder /app/server.cjs ./server.cjs
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/drizzle.config.ts ./

RUN mkdir -p uploads/kyc \
    && chown -R habilitfy:nodejs /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5000

USER habilitfy

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:5000/api/health || exit 1

CMD ["node", "server.cjs"]
