# Ajmot Hossain — Portfolio and Web Development

Portfolio and web development business site built with Next.js App Router, TypeScript, React, and Tailwind CSS 4.

## Prerequisites

- Node.js 20.19+, 22.12+, or 24+
- npm 10 or newer
- Python 3.9+ and Docker Desktop with Compose v2 for the one-command local CMS launcher

## Install and run

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### One-command local CMS startup (Windows)

The repository-root Python launcher starts only the PostgreSQL service defined in
`docker-compose.yml`, waits for its health check, confirms local migrations are current,
then starts Next.js with its logs in the same terminal:

```cmd
if not exist .env copy .env.example .env
python dev.py --check
python dev.py
```

Before starting, set the local `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`DATABASE_URL`, and `DIRECT_URL` values in `.env`. Both database URLs must point to
`localhost:5432` and the Compose database name; the launcher rejects remote hosts such as
Neon and never edits `.env`. It will not install packages automatically; run `npm ci`
yourself if it reports that dependencies are missing. If migrations are pending, the
launcher stops and explains how to review and apply them with `npm run db:migrate:dev`.

Press **Ctrl+C** to stop Next.js; PostgreSQL stays running and its named volume is kept.
To stop PostgreSQL explicitly without deleting its data, run `python dev.py --stop-db`.
Never use `docker compose down -v` unless you intentionally want to delete local database
data. Production remains separate: Vercel uses the configured deployment build, while
this launcher always forces the local URLs from `.env` into its child processes.

## Project commands

```bash
npm run dev         # Start the development server
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript without emitting files
npm test            # Run Node's built-in test runner
python -m unittest discover -s tests -p "test_dev_launcher.py"  # Test the local launcher
npm run build       # Create a production build
npm run start       # Serve the production build
```

## PostgreSQL and Prisma

The schema is in `prisma/schema.prisma`; migrations are kept in `prisma/migrations/`.
Prisma Client is generated into `src/generated/prisma/` during dependency installation.
Generated files are not committed.

For local PostgreSQL, set `POSTGRES_DB`, `POSTGRES_USER`, and a local-only
`POSTGRES_PASSWORD`, then set both `DATABASE_URL` and `DIRECT_URL` to the same local
database using the `postgresql://USER:PASSWORD@localhost:5432/DB?schema=public` format.
Do not use production credentials in this file. To manage the database manually:

```bash
docker compose up -d postgres
docker compose ps
npm run db:migrate:status
npm run db:validate
npm run db:migrate:dev -- --name init
docker compose down
```

The named `postgres_data` volume retains local database files when the service stops.
Do not use `docker compose down -v` unless you intentionally want to delete that local data.
For Neon, set `DATABASE_URL` to the pooled connection string for application traffic and
`DIRECT_URL` to the direct connection string for Prisma CLI migrations. Never commit either
URL. Use `npm run db:migrate:deploy` only in an explicitly approved deployment workflow;
this repository phase does not apply migrations to production.

The database schema has no seeded admin account. Vercel Production builds run migrations and atomically import the initial approved projects and draft case studies once. Render Production pre-deploy applies migrations only; add Render content through the protected admin CMS. Preview deployments skip database migrations. See `docs/DEPLOYMENT.md` and `docs/CONTENT_MAPPING.md` before the first production deployment.

## Admin authentication

The private sign-in page is `/admin/login`; registration is disabled. Configure
`BETTER_AUTH_SECRET` with a cryptographically random secret of at least 32 bytes and
`BETTER_AUTH_URL` with the exact application origin. Set `ADMIN_EMAIL` and
`ADMIN_PASSWORD` only in the local environment for the initial provisioning command.
The password must be 15–128 characters. Run `npm run admin:provision` once after the
auth migration is applied. Re-running it for the same administrator does not change
the existing password; another administrator account is rejected by both the command
and a database uniqueness constraint.

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for production sign-in
throttling. Production authentication fails closed if these are missing or unavailable.
Local development uses a per-process in-memory limiter. Passwords are hashed with
Argon2id. No email recovery provider or in-app password change form is configured. To
rotate the password as the database operator, set `ADMIN_EMAIL` and a new
`ADMIN_PASSWORD` privately and explicitly run `npm run admin:password`. It updates the
existing credential and revokes active sessions; it never runs during provisioning or
deployment. If locked out, the same operator-run procedure is the recovery path.

For a local database, apply the additive migration after checking the active
`DIRECT_URL`/`DATABASE_URL` points only to the intended local database:

```bash
npm run db:validate
npm run db:migrate:deploy
npm run db:generate
```

This migration adds authentication fields and session/account tables. It retains the
legacy password-hash column and all existing records. Do not apply it to a remote
database without an explicitly approved deployment process.

## Project structure

- `src/app/` — App Router pages, contact and auth Route Handlers, and protected admin routes
- `src/components/` — Site shell, page sections, contact form, admin sign-in controls, and shared UI
- `src/content/` — Verified static copy and legacy Markdown tooling; public project and blog records are served from the CMS
- `src/lib/` — Blog loader, contact validation/delivery, Prisma client, and server-only auth policies
- `prisma/` — PostgreSQL schema and committed migrations
- `src/lib/prisma.ts` — Server-only Prisma Client singleton
- `tests/` — Node.js tests and unpublished blog fixtures

## Deployment preparation

The project is a Next.js app that can run as a Node.js service on Vercel or Render. `vercel.json` sets the Vercel Build Command to `npm run build:vercel`. For Vercel Production builds, this runs `npm run db:migrate:deploy`, then the atomic one-time `npm run cms:import-static`, then `npm run build`. Preview builds skip production migrations and initialization and run only the normal build. The initializer's database marker makes later Production builds a no-op for content; it does not replay static files over admin edits. Render's web service setup is described below. The repository's local `dev.py` launcher is only for Docker-based local development. The existing Vercel setup remains documented below; no local Vercel deployment has been performed.

### Render web service

Do not run `dev.py` on Render. It is a local launcher for Docker Compose PostgreSQL and `next dev`. Run tests in GitHub Actions CI, and use Render's managed PostgreSQL for the deployed app.

Keep the existing Render web service on branch `dev` with **Auto-Deploy: On Commit**. Since the service plan does not expose Render's paid Pre-Deploy Command, put migrations in the Build Command:

| Setting | Value |
|---|---|
| Build Command | `npm ci && npm run render:migrate && npm run build` |
| Pre-Deploy Command | Leave blank |
| Start Command | `npm run start` |

`render:migrate` runs pending Prisma migrations before building the app. It skips Render pull request previews and refuses to run outside a Render web service. It does not import `src/content/projects.ts`; public project and blog queries return empty lists until you add CMS records. Admin provisioning remains an explicit one-time command after the first migration. If migrations cannot reach the internal database URL from Render's build environment, stop the deploy and use a Render plan with Pre-Deploy support or a controlled operator migration; do not weaken database network access to make the build pass.

For the web service's `DATABASE_URL` and `DIRECT_URL`, use the Render Postgres **Internal Database URL** from its Connect page; keep the service and database in the same region. For Render Postgres, the same direct URL serves both app and migration traffic. Do not use local `localhost` URLs, local `POSTGRES_*` settings, or the Neon `DATABASE_URL_UNPOOLED` URL for this Render database. Leave `PORT` to Render.

Set `BETTER_AUTH_URL` and `SITE_URL` to `https://swd-ajmot.onrender.com`, if that remains the service's public URL. The sign-in API returns 503 if `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is missing or unavailable; both values are required for production login and contact throttling. After the first pre-deploy succeeds, explicitly provision the one admin against this database with `npm run admin:provision`; do not add admin provisioning to deploy or startup commands. Keep all credentials in Render's environment settings, and rotate any secrets that were exposed in chat before relying on this deployment.

#### Render environment reference

Set these values in the Render **web service** environment. Do not copy real secrets into `.env.example` or commit them.

| Key | Render value |
|---|---|
| `DATABASE_URL` | Render Postgres Internal Database URL |
| `DIRECT_URL` | Same Render Postgres Internal Database URL |
| `BETTER_AUTH_URL` | `https://swd-ajmot.onrender.com` |
| `BETTER_AUTH_SECRET` | New private random secret of at least 32 bytes |
| `SITE_URL` | `https://swd-ajmot.onrender.com` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash secret token |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret; server-side only |
| `CLOUDINARY_UPLOAD_PRESET` | Signed preset configured for the app's 8 MB and format limits |
| `RESEND_API_KEY`, `CONTACT_EMAIL_TO`, `CONTACT_EMAIL_FROM` | Optional contact delivery values; leave blank until verified |

Do not set `POSTGRES_DB`, `POSTGRES_USER`, or `POSTGRES_PASSWORD` on the Render web service; those are for local Docker Compose. Do not set `DATABASE_URL_UNPOOLED` when using Render Postgres. Keep `ADMIN_EMAIL` and `ADMIN_PASSWORD` private and provide them only when explicitly running the admin provisioning command; remove them from the service after provisioning.

See [Render deploy commands](https://render.com/docs/deploys), [Render Postgres connections](https://render.com/docs/postgresql-creating-connecting), and [Render environment variables](https://render.com/docs/environment-variables).

For Vercel, configure Production `DATABASE_URL` for runtime queries and `DIRECT_URL` for Prisma migrations, both pointing to the same PostgreSQL database. Back up the selected production database and review all pending migrations before the first deployment. Do not set these production database values for Preview deployments; use an isolated Preview database if Preview content must be tested. The configured Vercel production build fails before deployment if the database variables, migrations, or initial import are unavailable. Neither hosting workflow runs initialization on HTTP requests or server startup.

The current production URL is `https://swd-ajmot.vercel.app`; canonical and sitemap URLs use it by default. Set `SITE_URL` only when an approved replacement domain has been configured. In the selected Vercel project's environment settings, configure the server-only variables below for Production (and Preview only when its behavior is understood). Add values through Vercel's secret settings, never to this repository or CI logs:

| Variable | Purpose | Required for |
|---|---|---|
| `SITE_URL` | Optional approved HTTPS origin; defaults to `https://swd-ajmot.vercel.app` | Canonical URLs, Open Graph URLs, and sitemap |
| `RESEND_API_KEY` | Resend server-side API credential | Contact email delivery |
| `CONTACT_EMAIL_TO` | Recipient controlled by Ajmot | Contact email delivery |
| `CONTACT_EMAIL_FROM` | Sender address verified with Resend | Contact email delivery |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint | Production contact rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash server-side token | Production contact rate limiting |

When an approved custom domain is configured, set `SITE_URL` to its HTTPS origin before the production build. Connect an already owned domain in the selected Vercel project's Domains settings; add only the DNS records Vercel displays at the current DNS provider, then wait for verification and HTTPS provisioning. Do not purchase a domain or change DNS as part of this preparation. See [Vercel package manager detection](https://vercel.com/docs/package-managers), [environment settings](https://vercel.com/docs/environment-variables), and [custom domain setup](https://vercel.com/docs/domains/set-up-custom-domain).

For contact delivery, use a test recipient you control and a sender verified with Resend. Production contact submissions fail closed unless Upstash is configured. The application does not store leads in a database. Never use a `NEXT_PUBLIC_` prefix for any variable above.

After an approved deployment, smoke-test the home page and each core route, `/robots.txt`, `/sitemap.xml`, an unknown `/work/<slug>` and `/blog/<slug>` (both should return 404), and the privacy notice. Submit one non-sensitive contact test from `/contact` and confirm receipt at the controlled recipient; a success response alone is not proof of inbox delivery. Do not call contact delivery verified until that test arrives.

GitHub Actions CI is defined in `.github/workflows/ci.yml`. It runs on pushes, pull requests, and manual dispatch, uses `npm ci` with `package-lock.json`, and requires no application secrets. It does not deploy. After the first workflow run, configure a GitHub branch ruleset to require the CI job before merging if required checks are desired; no repository settings are changed here.
