# syntax=docker/dockerfile:1
# Build from the monorepo root:
#   docker build -f apps/web/Dockerfile -t contextid-web .

FROM node:22-alpine AS base

# ─── Prune the monorepo down to what apps/web actually needs ───────────────
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune web --docker

# ─── Install deps and build ─────────────────────────────────────────────────
FROM base AS installer
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install deps first, from the pruned lockfile/package.json set only.
# --ignore-scripts because @repo/database's postinstall runs `prisma generate`,
# which needs prisma/schema.prisma — not present yet at this point.
COPY --from=builder /app/out/json/ .

# corepack reads packageManager from package.json and installs that exact
# pnpm version — a bare `npm install -g pnpm` drifts to whatever's newest,
# which broke once already (pnpm 11's lockfile format isn't compatible with
# what pnpm 9, pinned here, generated).
RUN corepack enable && corepack install
RUN pnpm install --frozen-lockfile --ignore-scripts

# Now bring in the pruned source (incl. prisma/schema.prisma) and generate
# the Prisma client, then build.
COPY --from=builder /app/out/full/ .
RUN pnpm --filter=@repo/database generate
RUN pnpm turbo run build --filter=web...

# ─── Minimal runtime image ──────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone output: a self-contained server + pruned node_modules.
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
