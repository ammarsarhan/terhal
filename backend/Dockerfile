# The backend image: the API server, the worker and migrations, picked by the command each container runs (see
# deploy/compose.yml). One image for staging and main: everything environment-specific comes in at runtime.
# Built from the repo root so pnpm can see the lockfile: docker build -f backend/Dockerfile .

FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app

# Every workspace manifest, so the lockfile matches what pnpm sees.
FROM base AS manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY web/package.json web/

FROM manifests AS build
RUN pnpm install --frozen-lockfile --filter @terhal/backend... --filter terhal
COPY tsconfig.base.json turbo.json ./
COPY backend backend
RUN pnpm turbo run build --filter=@terhal/backend

# Production dependencies only. Prisma's CLI is one of them, for migrations.
FROM manifests AS deps
RUN pnpm install --frozen-lockfile --prod --filter @terhal/backend

FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/backend/node_modules backend/node_modules
COPY --from=build /app/backend/dist backend/dist
COPY backend/package.json backend/prisma.config.ts backend/
COPY backend/prisma/schema backend/prisma/schema
COPY backend/prisma/migrations backend/prisma/migrations
WORKDIR /app/backend
USER node
EXPOSE 8080
CMD ["node", "dist/src/server.js"]
