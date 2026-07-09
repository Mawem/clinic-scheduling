# Multi-stage build for the Next.js app in a pnpm/turborepo workspace.
# Build:  docker build -t clinic-scheduling .
# Run:    docker run -p 3000:3000 clinic-scheduling

FROM node:22-alpine AS base
RUN corepack enable pnpm

# ---- Install dependencies (cached while lockfile is unchanged) ----
FROM base AS deps
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/domain/package.json packages/domain/
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM base AS build
WORKDIR /repo
COPY --from=deps /repo ./
COPY . .
RUN pnpm --filter web build

# ---- Runtime (standalone output keeps the image small) ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
USER app
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
