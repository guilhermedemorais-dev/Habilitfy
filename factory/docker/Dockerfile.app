# Build and runtime for the HabilitFy app (API + client)
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json vite.config.ts vitest.config.ts vitest.setup.ts postcss.config.js drizzle.config.ts ./
COPY script ./script
COPY server ./server
COPY client ./client
COPY shared ./shared
COPY attached_assets ./attached_assets
COPY e2e ./e2e
COPY tmp_tsx ./tmp_tsx
COPY playwright.config.ts ./playwright.config.ts
COPY vite-plugin-meta-images.ts ./vite-plugin-meta-images.ts
RUN npm ci
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# static assets are served from ./public by the express server
RUN cp -r dist/public ./public
EXPOSE 5000
CMD ["npm", "start"]
