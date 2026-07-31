# syntax=docker/dockerfile:1
# Build from the monorepo root:
#   docker build -f apps/api/Dockerfile -t contextid-api .

FROM node:22-alpine AS base

# ─── Prune the monorepo down to what apps/api actually needs ───────────────
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune api --docker

# ─── Install deps and build ─────────────────────────────────────────────────
FROM base AS installer
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN npm install -g pnpm

# Install deps first, from the pruned lockfile/package.json set only.
# --ignore-scripts because @repo/database's postinstall runs `prisma generate`,
# which needs prisma/schema.prisma — not present yet at this point.
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile --ignore-scripts

# Now bring in the pruned source (incl. prisma/schema.prisma), generate the
# Prisma client, then build (turbo builds @repo/database first, api depends on it).
COPY --from=builder /app/out/full/ .
RUN pnpm --filter=@repo/database generate
RUN pnpm turbo run build --filter=api...

# ─── Runtime image ──────────────────────────────────────────────────────────
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify

COPY --from=installer --chown=fastify:nodejs /app .

USER fastify

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
