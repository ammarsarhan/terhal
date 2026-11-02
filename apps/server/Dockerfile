# The server image: the API server, the worker and migrations, picked by the command each container runs (see
# deploy/compose.yml). One image for staging and main: everything environment-specific comes in at runtime.
# Built from the repo root so pnpm can see the lockfile: docker build -f apps/server/Dockerfile .

FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app

# Every workspace manifest, so the lockfile matches what pnpm sees.
FROM base AS manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY tooling tooling

FROM manifests AS build
RUN pnpm install --frozen-lockfile --filter @terhal/server... --filter terhal
COPY turbo.json ./
COPY packages packages
COPY apps/server apps/server
RUN pnpm turbo run build --filter=@terhal/server

# Production dependencies only. Prisma's CLI is one of them, for migrations.
FROM manifests AS deps
RUN pnpm install --frozen-lockfile --prod --filter @terhal/server

FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/apps/server/node_modules apps/server/node_modules
COPY --from=build /app/apps/server/dist apps/server/dist
COPY apps/server/package.json apps/server/prisma.config.ts apps/server/
COPY apps/server/prisma/schema apps/server/prisma/schema
COPY apps/server/prisma/migrations apps/server/prisma/migrations
WORKDIR /app/apps/server
USER node
EXPOSE 8080
CMD ["node", "--enable-source-maps", "dist/server.js"]
