# ContextID

**A context-aware digital identity management platform.**

ContextID lets a user hold several identity "cards" under one account — Professional, Academic, Personal, Family, or any custom context — each with its own structured name, photo, and contact details. Cards are shared as revocable, expirable links rather than a single static profile, so the owner decides exactly what a recipient sees and can take that access back at any time.

This is the codebase for a University of London CM3070 final project. The accompanying report, which covers the motivation, literature review, architecture, and evaluation in depth, is in [`reports/final_report_draft.md`](reports/final_report_draft.md).

## Features

- **Multiple contexts per user** — separate identity cards for different audiences, each with its own name, title, photo, background, email, phone, location, and description.
- **Structured names** — given name, family name, additional given names, and secondary family names are stored separately, so non-Western naming orders aren't forced into a single "full name" field.
- **Time-bounded identities** — a card can have a `validFrom`/`validTo` window so an affiliation expires on its own.
- **Shareable, revocable links** — an identity is shared as a unique token pointing at a public, no-login-required page, rendered with a chosen name-card template. Links can be revoked or left to expire.
- **vCard export** — recipients can save a shared card straight to their contacts as a `.vcf` file, with a QR code for quick scanning.
- **Passwordless-friendly auth** — sign in with Google, GitHub, or a one-time email link (Resend), backed by database-persisted sessions (Auth.js v5).
- **Account deletion** — a user can permanently delete their account, every identity, every share link, and every uploaded photo, guarded by a typed-confirmation dialog. Satisfies the GDPR Article 17 right to erasure.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | [Next.js 16](https://nextjs.org/) (App Router), React 19, Tailwind CSS 4 |
| API | [Fastify 5](https://fastify.dev/), TypeScript |
| Database | PostgreSQL, accessed via [Prisma](https://www.prisma.io/) (`@repo/database`) |
| Auth | [Auth.js v5](https://authjs.dev/) — Google, GitHub, email magic links via Resend |
| Storage | Amazon S3 (identity photos) |
| Monorepo tooling | [Turborepo](https://turborepo.dev/) + [pnpm](https://pnpm.io/) workspaces |
| Testing | [Vitest](https://vitest.dev/) |
| Infrastructure | Terraform, AWS ECS/ECR/CDN, deployed via GitHub Actions with OIDC |

## Monorepo layout

```
apps/
  api/          Fastify REST API (identities, identity contexts, shares)
  web/          Next.js app — dashboard, wizard, and public share pages
packages/
  database/     Prisma schema, migrations, generated client (@repo/database)
  eslint-config/       Shared ESLint configs
  typescript-config/   Shared tsconfig bases
infra/          Terraform for the AWS deployment (ECS, ECR, CDN, IAM, VPC)
reports/        Project reports (preliminary, prototype, final draft)
```

### `apps/api`

A Fastify service exposing a REST API for identities, identity contexts, and shares. Session-protected routes are guarded by a `preHandler` that authenticates an Auth.js session token as a Bearer token; a small set of routes (public share pages) are open.

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/users/:id` | — |
| DELETE | `/users/:id` | 🔒 delete the account and all owned data (identities, contexts, shares, S3 photos) |
| GET | `/users/:id/identities` | 🔒 |
| POST | `/identities` | 🔒 |
| GET | `/identities/:id` | 🔒 |
| PATCH | `/identities/:id` | 🔒 |
| DELETE | `/identities/:id` | 🔒 |
| POST | `/identities/:id/head-image` | 🔒 upload profile photo to S3 |
| GET | `/users/:id/identity-contexts` | 🔒 |
| GET | `/identity-contexts/:id` | 🔒 |
| PATCH | `/identity-contexts/:id` | 🔒 |
| DELETE | `/identity-contexts/:id` | 🔒 |
| GET | `/users/:id/shares` | 🔒 |
| POST | `/identities/:id/shares` | 🔒 create a share link |
| GET | `/identities/:id/shares` | 🔒 |
| DELETE | `/shares/:token` | 🔒 revoke |
| GET | `/shares/:token` | public — resolve a share link |

🔒 = requires an authenticated session.

### `apps/web`

The Next.js frontend: the sign-in flow, the identity/context dashboard, the create/edit identity wizard, the shares dashboard, and the public `/share/[token]` page a recipient lands on (including its vCard/QR export). API calls from the browser go through `app/api/proxy/[...path]`, which forwards to the Fastify API with the user's session attached.

### `packages/database`

The single source of truth for the data model: `User`, `Account`, `Session` (Auth.js tables), `IdentityContext`, `Identity`, and `IdentityShare`. Both `apps/api` and `apps/web` depend on the generated Prisma client via `@repo/database`.

## Prerequisites

- Node.js >= 18 (CI/deploy uses Node 22)
- [pnpm](https://pnpm.io/) 9
- A PostgreSQL database (a local one via Docker Compose, or a managed instance)
- Docker, if you want to run the full stack in containers

## Getting started

1. **Install dependencies**

   ```sh
   pnpm install
   ```

2. **Configure environment variables**

   ```sh
   cp .env.example .env
   ```

   Fill in `.env` at the repo root — it's shared by every app via `dotenv -e ../../.env`. You'll need:

   - `DATABASE_URL` (or the `POSTGRESQL_*` parts it's composed from)
   - `AUTH_RESEND_KEY` — passwordless email login ([Resend](https://resend.com/))
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — [GitHub OAuth Apps](https://github.com/settings/developers)
   - `AUTH_SECRET` / `BETTER_AUTH_SECRET` — a random session secret
   - `API_URL` — where `apps/web`'s proxy sends requests (`http://localhost:4000` locally)
   - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_PUBLIC_BASE_URL` — for identity photo uploads

3. **Set up the database**

   ```sh
   pnpm --filter @repo/database migrate:dev
   ```

   This applies all Prisma migrations and generates the client. See [Database workflow](#database-workflow) below for day-to-day schema changes.

4. **Run the apps**

   ```sh
   pnpm dev
   ```

   This runs `turbo run dev`, starting the API on `http://localhost:4000` and the web app on `http://localhost:3000`.

## Common commands

Run from the repo root; `turbo` fans these out to every app/package with a matching script, respecting the dependency graph:

```sh
pnpm dev            # start api + web in watch mode
pnpm build          # build all apps and packages
pnpm lint           # lint everything
pnpm check-types    # typecheck everything
pnpm format         # prettier --write across the repo
```

Scope any of these to one workspace with `--filter`:

```sh
pnpm --filter web dev
pnpm --filter api build
turbo run lint --filter=@repo/database
```

### Testing

Unit tests use Vitest and live next to the code they cover (`*.test.ts`) in `apps/api` and `apps/web`.

```sh
pnpm turbo run test        # all apps
pnpm --filter api test     # a single app
pnpm --filter web test
```

### Database workflow

```sh
# 1. Edit packages/database/prisma/schema.prisma
# 2. Generate a migration from the diff
pnpm --filter @repo/database migrate:dev

# Push schema changes without creating a migration (prototyping only)
pnpm --filter database db:push

# Inspect data
pnpm --filter @repo/database studio

# Drop and recreate the dev database from scratch
pnpm --filter @repo/database migrate:reset

# Re-run the seed script manually
pnpm --filter @repo/database exec dotenv -e ../../.env -- prisma db seed
```

Migration files under `packages/database/prisma/migrations/` are the history; `schema.prisma` is the current state.

## Running with Docker Compose

`docker-compose.yml` builds `apps/api` and `apps/web` from their Dockerfiles and runs them alongside a local Postgres container. It reads secrets (OAuth credentials, `AUTH_RESEND_KEY`, AWS keys, …) from the root `.env`, and overrides `DATABASE_URL`/`API_URL` to point at the containers on the compose network instead of whatever's in your `.env`.

```sh
docker compose up --build
```

This brings up:

- `postgres` — Postgres 16, exposed on host port `5433`
- `migrate` — a one-shot job that runs `prisma migrate deploy`, then exits
- `api` — the Fastify API on `http://localhost:4000`
- `web` — the Next.js app on `http://localhost:3000`

## Deployment

Production deploys are triggered by pushing a `v*.*.*` tag (see [`.github/workflows/deploy-prod.yml`](.github/workflows/deploy-prod.yml)):

1. Docker images for `web` and `api` are built and pushed to Amazon ECR.
2. Prisma migrations are applied against the production database.
3. The API and web ECS services are updated in turn (API first, then web), using GitHub OIDC for AWS access — no long-lived AWS credentials are stored in the repo.

The AWS infrastructure (ECS, ECR, CDN, IAM, VPC) is defined in [`infra/`](infra/) with Terraform.

## License

No license file is currently included; all rights reserved by the author unless stated otherwise.
