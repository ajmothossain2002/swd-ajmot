# Ajmot Hossain Portfolio CMS

A portfolio and web development site built with Next.js App Router, TypeScript, React, and Tailwind CSS 4. The public site and protected admin CMS are served by the same Next.js application. PostgreSQL stores admin authentication and CMS content; Cloudinary stores CMS images.

## Requirements

- Node.js 20.19+, 22.12+, or 24+
- npm 10+
- For the local PostgreSQL launcher: Python 3.9+ and Docker Desktop with Compose v2

## Local setup

1. Install dependencies and create a private local environment file:

   ```bash
   npm ci
   ```

   On Windows Command Prompt, create `.env` from the safe example if needed:

   ```cmd
   if not exist .env copy .env.example .env
   ```

2. Edit `.env` for local development. Set `POSTGRES_DB`, `POSTGRES_USER`, and a local-only `POSTGRES_PASSWORD`. Set both `DATABASE_URL` and `DIRECT_URL` to that same local database, using `localhost:5432`. Do not put production credentials in this file.

3. Start local PostgreSQL and Next.js with the repository launcher:

   ```bash
   python dev.py
   ```

   The launcher validates that the database URLs point to local PostgreSQL, starts the Compose database, checks its health and migration status, then runs `next dev`. If migrations are pending, it stops and tells you to review and apply them with `npm run db:migrate:dev`. Press Ctrl+C to stop Next.js. PostgreSQL and its named data volume remain available; run `python dev.py --stop-db` to stop PostgreSQL without deleting its data. Avoid `docker compose down -v` unless you intend to erase the local database.

   You can also start the app without the launcher using `npm run dev`, after providing a reachable PostgreSQL database in your environment.

4. Create the local admin account once, after migrations have been applied. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` privately in `.env`, then run:

   ```bash
   npm run admin:provision
   ```

   Use a password between 15 and 128 characters. The command creates the single administrator and hashes the password with Argon2id. It will not add a second administrator or change an existing password. Remove the bootstrap values from `.env` when you are done. Sign in at [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

### Local database commands

```bash
docker compose up -d postgres
npm run db:validate
npm run db:migrate:status
npm run db:migrate:dev -- --name describe_change
npm run db:generate
docker compose down
```

Use `db:migrate:dev` when developing a schema change locally; it creates a migration. `db:migrate:deploy` applies already-created migrations and is used in deployment. The `postgres_data` volume keeps database files when the service is stopped.

## Render deployment

The production app runs as a Render Node.js web service connected to Render PostgreSQL. Keep the web service and database in the same region. Configure the service from its Render dashboard; there is no `render.yaml` in this repository.

Use these Render service commands:

| Setting | Command |
| --- | --- |
| Build | `npm ci && npm run render:migrate && npm run render:provision-admin && npm run build` |
| Pre-Deploy | Leave blank for this setup |
| Start | `npm run start` |

`render:migrate` applies pending Prisma migrations during the Render web-service build. It requires `DATABASE_URL` and `DIRECT_URL`, skips Render pull-request previews, and fails outside a Render web service. `render:provision-admin` also runs during the build but does nothing unless both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set. Neither task runs when the app starts or handles a request.

### Render environment variables

Set environment values in the Render **web service** settings. Keep secrets there and do not commit them.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Render PostgreSQL Internal Database URL for application queries |
| `DIRECT_URL` | The same Render Internal Database URL for Prisma migrations |
| `BETTER_AUTH_URL` | Exact public origin, for example `https://swd-ajmot.onrender.com` |
| `BETTER_AUTH_SECRET` | Private cryptographically random secret of at least 32 bytes |
| `SITE_URL` | Public canonical origin, usually the same HTTPS origin as `BETTER_AUTH_URL` |
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint used for distributed production rate limits |
| `UPSTASH_REDIS_REST_TOKEN` | Private Upstash token |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name used by the browser upload flow |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Cloudinary API key; public configuration, not the API secret |
| `CLOUDINARY_API_SECRET` | Private server-side Cloudinary signing and verification secret |
| `CLOUDINARY_UPLOAD_PRESET` | Cloudinary signed upload preset |
| `RESEND_API_KEY` | Optional Resend API key for contact email |
| `CONTACT_EMAIL_TO` | Optional contact email recipient |
| `CONTACT_EMAIL_FROM` | Optional verified Resend sender |

Do not set local Docker variables (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`) on the Render web service. Leave `PORT` to Render. The Render database URL must be reachable from the build environment; if migration cannot connect, fix the service/database networking or use a supported controlled migration step. Do not weaken database access controls to bypass a failed build.

### Initial admin and password rotation on Render

For the first admin only, temporarily set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the Render web service environment. Then deploy with the Build Command above. Migrations run first; the provisioning wrapper then creates the admin if the database contains no administrator. After successful provisioning, remove both variables from Render and redeploy so they are no longer part of future builds.

To intentionally rotate the existing admin password, temporarily set `ADMIN_EMAIL`, the new `ADMIN_PASSWORD`, and `ADMIN_BOOTSTRAP_ACTION=password`, then deploy. That operation changes the existing credential and revokes active sessions. Remove all three variables after it succeeds. The default `provision` action never resets an existing password; provisioning a second admin is rejected. For local operations, use `npm run admin:password` with the target email and new password in `.env`.

Review migrations and back up production data before deploying schema changes. Render build migration is a deploy-time operation; the running Next.js app does not migrate the database at startup. The Render migration step does not import content. Use the protected bulk workbook workflow described below to load starter content or manage content in batches.

## Admin authentication and authorization

The admin sign-in page is `/admin/login`. Better Auth handles email/password sign-in, and PostgreSQL stores the administrator, credential account, and sessions. Sign-up is disabled. Passwords are Argon2id hashes; the app never sends password hashes or session data to client code.

Protected admin pages check the session on the server with `requireAdmin()`. Admin API handlers independently check authorization with `requireAdminApi()`. Production requires a valid `BETTER_AUTH_SECRET`, an HTTPS `BETTER_AUTH_URL`, and Upstash credentials for distributed login throttling; authentication fails closed if required configuration or the limiter is unavailable. Local development uses an in-process limiter. There is no email password-recovery flow; an operator rotates a password with the CLI command above, which also revokes active sessions.

## CMS content and media

Projects, case studies, blog posts, tags, publication state, and media references live in PostgreSQL. Public server-rendered pages query published/public content. Admin mutations use protected Route Handlers and revalidate affected public paths. Initial Render setup does not populate content; use the bulk workbook workflow in `/admin` after signing in.

The admin media picker uploads images to Cloudinary using a server-generated signature. Configure a **signed** Cloudinary upload preset with an 8 MB maximum and only `jpg`, `jpeg`, `png`, `webp`, and `avif`. The API secret stays on the server. The app verifies the upload through Cloudinary before recording a `MediaAsset` in PostgreSQL. CMS records refer to persisted media asset IDs, and referenced media cannot be deleted. Removing a media row does not remove the remote Cloudinary object.

### Bulk Excel and JSON import and export

Each protected admin content section has its own bulk import/export panel: **Projects**, **Case studies**, and **Blog posts**. Projects are the overview cards used by the public portfolio; case studies hold the detailed work page; blog posts hold articles. The Admin **Overview** is only a dashboard of counts and recent edits, not a separate content table. Each panel reads and writes only its collection. A combined JSON content pack can be uploaded on any section page; that page processes only its matching collection, so import projects first, case studies second, then blog posts. Each workbook contains one content sheet for its selected section plus an Instructions sheet.

The panels support `.xlsx` workbooks and JSON content packs shaped like this:

```json
{
  "packageName": "Ajmot Hossain Portfolio CMS Bulk Content Pack",
  "packageVersion": "1.0",
  "collections": {
    "projects": [],
    "caseStudies": [],
    "blogPosts": []
  },
  "counts": { "projects": 0, "caseStudies": 0, "blogPosts": 0 }
}
```

JSON collection records use the content fields in the supplied `cms-bulk-import.json` format: project fields such as `status`, `coverImageId`, and `tags`; case-study fields such as `projectSlug`, `status`, `capabilities`, and `mediaAssetIds`; and blog fields such as `markdown`, `status`, and `tags`. `packageName`, `packageVersion`, `counts`, and `importNotes` are informational. Each collection must be an array, and each record is validated against the CMS schema.

- **Export workbook** and **Export JSON** download the current collection's records, including their IDs. Keep IDs to update those records.
- **Download template** provides an empty workbook for preparing records in that collection. Leave `id` blank to create a record; PostgreSQL/Prisma generates it. Keep an ID from an export to update the existing record. Leave `slug` blank to generate it from the title (or `projectSlug` for case studies).
- Upload an `.xlsx` workbook or `.json` content pack, choose **Validate workbook**, review any row errors, then choose **Import validated data**. The import runs as one transaction: if any row fails, none of the batch is saved. Rows omitted from a file are never deleted.

In Excel, enter tags, capabilities, technologies, evidence, and media IDs one per line. `challengesJson` and `publicLinksJson` accept JSON arrays. JSON packs use arrays for list fields. Case studies link to projects by `projectSlug`; the importer resolves that slug to the database project. Images must reference existing CMS media asset IDs; neither format uploads image files. The upload limit is 5 MB and 500 content records per collection. The feature uses the database connected to the running app, so migrations and database connectivity must be healthy first. New rows with duplicate slugs are rejected; export and keep IDs when updating existing records. Older workbook headers remain supported. Excel uses the same field names as the JSON/API payloads (`status`, `coverImageId`, `tags`, and so on); it does not import the Admin Overview dashboard because that dashboard is computed from the content tables.

## Contact form

The contact endpoint validates submissions server-side and sends plain-text email through Resend when all three `RESEND_API_KEY`, `CONTACT_EMAIL_TO`, and `CONTACT_EMAIL_FROM` values are configured. It does not store contact submissions in PostgreSQL. In production, Upstash is also required for distributed contact rate limiting; requests fail closed if it is unavailable. Without Resend configuration, contact delivery is unavailable.

## Project commands

```bash
npm run dev         # Start Next.js locally
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript without emitting files
npm test            # Run Node's built-in test runner
npm run build       # Build the app
npm run start       # Run the production build
npm run db:validate # Validate Prisma schema
npm run db:migrate:status
npm run db:migrate:dev -- --name describe_change
npm run db:migrate:deploy
npm run admin:provision
npm run admin:password
```

## Repository layout

- `src/app/` — Next.js pages, Route Handlers, and protected admin routes
- `src/components/` — Site UI, contact form, admin UI, and shared components
- `src/content/` — Static site copy and retained import source files
- `src/lib/` — Server-side auth, Prisma, CMS, contact, and content services
- `prisma/` — PostgreSQL schema and ordered migrations
- `scripts/` — Admin and hosting build helpers
- `tests/` — Node.js tests and test fixtures

Generated Prisma client code is created during `npm ci` and is not committed. Local secrets belong in ignored `.env`/`.env.local` files; production secrets belong in Render environment settings. Never commit environment files, credentials, or database URLs.
