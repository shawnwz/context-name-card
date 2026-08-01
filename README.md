# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo build
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo build
pnpm dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo build --filter=docs
```

Without global `turbo`:

```sh
npx turbo build --filter=docs
pnpm exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo dev
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo dev
pnpm exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo dev --filter=web
```

Without global `turbo`:

```sh
npx turbo dev --filter=web
pnpm exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo login
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo login
pnpm exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo link
```

Without global `turbo`:

```sh
npx turbo link
pnpm exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.dev/docs/reference/configuration)
- [CLI Usage](https://turborepo.dev/docs/reference/command-line-reference)


## Database push
pnpm --filter database db:push

## The database migration workflow

1. Edit schema.prisma (add/change models)
2. Run migrate:dev → generates a new SQL migration file  `pnpm --filter database migrate:dev`
3. The migration files in prisma/migrations/ are the history; the schema is the current state


## To reset database
- migrate:reset drops and recreates the DB clean (dev only)
```
pnpm --filter database migrate:reset
```

## Run the db seed manually

```
  pnpm --filter @repo/database exec dotenv -e ../../.env -- prisma db seed
```

## AWS Deployment

`apps/web` and `apps/api` deploy as two separate containers on **Amazon ECS
Express Mode** (AWS closed App Runner to new customers, so this is the
replacement) — each gets its own Fargate service + ALB + auto scaling +
a default HTTPS URL, no custom domain required.

That URL is **not** derived from the service name — it's a hash AWS assigns
at creation time (e.g. `https://co-f2332c4b2797480d98115e41e1153792.ecs.us-west-2.on.aws`),
only knowable after the service exists. Get the real, current URLs with:

```sh
cd infra && terraform output actual_urls
```

Postgres stays on the existing Aiven instance (not migrated to RDS). The S3
bucket for identity head-images is unchanged and unmanaged by Terraform.

All infra is defined in `infra/` (Terraform) and deploys are automated via
`.github/workflows/deploy-prod.yml` (GitHub Actions).

### 1. One-time infra setup (Terraform)

```sh
cd infra
cp terraform.tfvars.example terraform.tfvars   # fill in real DATABASE_URL / AUTH_* values
terraform init
terraform apply
```

- Uses the `wzhe-aws-amazon-com` AWS CLI profile and expects account
  `391422395203` — both pinned explicitly in `versions.tf` (`profile` +
  `allowed_account_ids`), so it refuses to run against the wrong
  account/credentials regardless of any `AWS_PROFILE` set in your shell.
- Creates: 2 ECR repos, the GitHub OIDC provider + deploy role, the ECS
  task execution / Express infrastructure / api task IAM roles, a default
  VPC + subnets (this account didn't have one), and the two
  `aws_ecs_express_gateway_service` resources themselves.
- State is local (`infra/terraform.tfstate`, gitignored) — fine for a
  single-developer project. See the comment in `versions.tf` for how to
  switch to an S3 backend later if that changes.
- The services are created pointing at a public placeholder image
  (`nginx`) since Express Mode requires *some* image to exist at creation
  time. That placeholder can't pass health checks (wrong port) — expected,
  and fixed by the first real deploy below. `wait_for_steady_state = false`
  is set specifically so `terraform apply` doesn't hang waiting for it.

### 2. Wire up GitHub Actions

```sh
cd infra
terraform output -json github_actions_variables
```

Paste each key/value from that output into **GitHub repo → Settings →
Secrets and variables → Actions → Variables** tab. Then add one **Secret**
(same tab, Secrets sub-tab): `DATABASE_URL` — only the `migrate` job in the
workflow needs it; the running services get their env vars from Terraform,
not from GitHub.

Once the services exist (after step 1), run `terraform output actual_urls`
and:

1. Set `var.web_url`/`var.api_url` in `terraform.tfvars` (or the defaults in
   `variables.tf`) to those real values, then `terraform apply` again — the
   services need their own real URLs as `AUTH_URL`/`API_URL` env vars, which
   can't be known on the *first* apply (a resource can't reference its own
   computed output within its own config).
2. Add `<web_url>/api/auth/callback/google` and `<web_url>/api/auth/callback/github`
   (the **web** service's URL — it's the one serving the OAuth flow, not api)
   to the respective OAuth apps' authorized redirect URIs.

### 3. Normal deploys

Merge to the `prod` branch, then tag its HEAD and push the tag:

```sh
git tag v0.1.0
git push origin v0.1.0
```

`.github/workflows/deploy-prod.yml` triggers on any `v*.*.*` tag push and
runs: build + push both images to ECR → `prisma migrate deploy` against
Aiven → deploy api, then web, via AWS's official
`aws-actions/amazon-ecs-deploy-express-service` action (OIDC auth throughout,
no long-lived AWS keys anywhere).

### 4. First-time / manual deploy (bypassing CI)

Useful right after `terraform apply` (to replace the placeholder image
before setting up CI), or any time you want to deploy without pushing a tag.

```sh
# Authenticate docker to ECR
aws ecr get-login-password --region us-west-2 --profile wzhe-aws-amazon-com \
  | docker login --username AWS --password-stdin 391422395203.dkr.ecr.us-west-2.amazonaws.com

# Build for linux/amd64 explicitly if you're on Apple Silicon — Fargate is amd64
docker build --platform linux/amd64 -f apps/web/Dockerfile \
  -t 391422395203.dkr.ecr.us-west-2.amazonaws.com/contextid-web:manual-1 .
docker build --platform linux/amd64 -f apps/api/Dockerfile \
  -t 391422395203.dkr.ecr.us-west-2.amazonaws.com/contextid-api:manual-1 .

docker push 391422395203.dkr.ecr.us-west-2.amazonaws.com/contextid-web:manual-1
docker push 391422395203.dkr.ecr.us-west-2.amazonaws.com/contextid-api:manual-1
```

The AWS CLI needs to be reasonably recent — `ecs update-express-gateway-service`
is a late-2025 addition; if `aws ecs update-express-gateway-service help`
doesn't show it, upgrade (`pip install --upgrade awscli` in a venv works
if you don't want to touch your system install).

```sh
export AWS_PROFILE=wzhe-aws-amazon-com

# api first — web talks to it, not the other way around
aws ecs update-express-gateway-service \
  --service-arn arn:aws:ecs:us-west-2:391422395203:service/default/contextid-api \
  --execution-role-arn arn:aws:iam::391422395203:role/contextid-ecs-task-execution \
  --task-role-arn arn:aws:iam::391422395203:role/contextid-api-task \
  --primary-container '{"image":"391422395203.dkr.ecr.us-west-2.amazonaws.com/contextid-api:manual-1","containerPort":4000}' \
  --health-check-path "/health" \
  --region us-west-2

aws ecs update-express-gateway-service \
  --service-arn arn:aws:ecs:us-west-2:391422395203:service/default/contextid-web \
  --execution-role-arn arn:aws:iam::391422395203:role/contextid-ecs-task-execution \
  --primary-container '{"image":"391422395203.dkr.ecr.us-west-2.amazonaws.com/contextid-web:manual-1","containerPort":3000}' \
  --health-check-path "/" \
  --region us-west-2
```

Fields you omit from `--primary-container`/other flags are left as-is
(confirmed empirically — env vars, roles, and scaling config set by
Terraform all survive an update that only touches the image/port).

Check rollout status (Express Mode services are regular ECS services under
the hood, so the standard ECS APIs work even on older AWS CLI versions
that predate the Express Mode commands):

```sh
aws ecs describe-services --cluster default --services contextid-web contextid-api \
  --region us-west-2 \
  --query 'services[].{name:serviceName,running:runningCount,deployments:deployments[].{status:status,rolloutState:rolloutState,failedTasks:failedTasks}}'
```

`rolloutState` reaches `COMPLETED` once the new task passes ALB health
checks and the old one has drained. A brand-new service's first real
deploy can take a couple of minutes.

### Destroying everything

```sh
cd infra
terraform destroy
```

Known gotcha: the two ECR repos will fail to delete if they still have
images in them (`force_delete` isn't set) — empty them first:

```sh
aws ecr batch-delete-image --repository-name contextid-web \
  --image-ids "$(aws ecr list-images --repository-name contextid-web --query 'imageIds' --output json)"
aws ecr batch-delete-image --repository-name contextid-api \
  --image-ids "$(aws ecr list-images --repository-name contextid-api --query 'imageIds' --output json)"
```

`terraform destroy` does **not** touch the S3 bucket or Aiven Postgres —
both were created outside Terraform and stay untouched.
