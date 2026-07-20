# Build context is the repo root (needed to resolve the @birdnet/types workspace package).
FROM node:22-alpine

# Install build dependencies required by better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json turbo.json ./
COPY packages/types/package.json packages/types/package.json
COPY server/express-api/package.json server/express-api/package.json
RUN npm ci --workspace=packages/types --workspace=server/express-api --include-workspace-root

COPY packages/types packages/types
COPY server/express-api server/express-api

RUN npm run build --workspace=packages/types
RUN npm run build --workspace=server/express-api

WORKDIR /app/server/express-api
RUN mkdir -p data

EXPOSE 8080

CMD ["node", "dist/index.js"]
