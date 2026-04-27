FROM node:22-alpine AS base
WORKDIR /app

# --- Install all dependencies ---
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/
COPY packages/ui/package.json packages/ui/
RUN npm ci

# --- Build UI ---
FROM deps AS build-ui
COPY packages/shared packages/shared
COPY packages/ui packages/ui
COPY tsconfig.base.json .
RUN npm run build -w @web-ca/ui

# --- Production image ---
FROM base AS production
RUN apk add --no-cache tini

# Install all deps (tsx is needed at runtime to execute TypeScript)
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/
COPY packages/ui/package.json packages/ui/
RUN npm ci

# Copy source
COPY tsconfig.base.json .
COPY packages/shared packages/shared
COPY packages/api packages/api

# Copy pre-built UI
COPY --from=build-ui /app/packages/ui/dist packages/ui/dist

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=/data/webca.db
ENV SECURE_COOKIES=false

VOLUME /data
EXPOSE 3000

# Auto-run migration + seed on first start, then launch server
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "node --import tsx packages/api/src/db/seed.ts && node --import tsx packages/api/src/index.ts"]
