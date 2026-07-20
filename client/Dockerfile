# Build context is the repo root (needed to resolve the @birdnet/types workspace package).
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/types/package.json packages/types/package.json
COPY client/package.json client/package.json
RUN npm ci --workspace=packages/types --workspace=client --include-workspace-root

COPY packages/types packages/types
COPY client client

ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build --workspace=packages/types
RUN npm run build --workspace=client

FROM nginx:alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
