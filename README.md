# Ajmot Hossain — Portfolio and Web Development

Portfolio and web development business site built with Next.js App Router, TypeScript, React, and Tailwind CSS 4.

## Prerequisites

- Node.js 20.9 or newer
- npm 10 or newer

## Install and run

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project commands

```bash
npm run dev         # Start the development server
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript without emitting files
npm test            # Run Node's built-in test runner
npm run build       # Create a production build
npm run start       # Serve the production build
```

## Project structure

- `src/app/` — App Router pages and the contact Route Handler
- `src/components/` — Site shell, page sections, contact form, and shared UI
- `src/content/` — Services, project records, and Markdown blog files
- `src/lib/` — Blog content loader and contact validation/delivery logic
- `tests/` — Node.js tests and unpublished blog fixtures

## Deployment preparation

The project is a Next.js app suitable for Vercel. No local Vercel project link is present and the intended remote project has not been verified; no deployment has been performed. Select the intended existing Vercel project and import this repository with the repository root as the project root. Keep the detected Next.js framework and build command (`npm run build`), and select Node.js 24 to match CI. Vercel detects npm from `package-lock.json`; its default install command is `npm install`. To require the same strict lockfile install as CI, set the project's install command to `npm ci`. Do not create a new project or change production settings until the intended Vercel project is confirmed.

Choose and verify an approved domain before setting `SITE_URL`; no domain is configured or assumed here. In the selected Vercel project's environment settings, configure the server-only variables below for Production (and Preview only when its behavior is understood). Add values through Vercel's secret settings, never to this repository or CI logs:

| Variable | Purpose | Required for |
|---|---|---|
| `SITE_URL` | Approved HTTPS origin, such as `https://<approved-domain>` | Production canonical URLs and sitemap |
| `RESEND_API_KEY` | Resend server-side API credential | Contact email delivery |
| `CONTACT_EMAIL_TO` | Recipient controlled by Ajmot | Contact email delivery |
| `CONTACT_EMAIL_FROM` | Sender address verified with Resend | Contact email delivery |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint | Production contact rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash server-side token | Production contact rate limiting |

Set `SITE_URL` to the final approved domain before the production build so canonical links and `/sitemap.xml` use the right origin. Connect an already owned domain in the selected Vercel project's Domains settings; add only the DNS records Vercel displays at the current DNS provider, then wait for verification and HTTPS provisioning. Do not purchase a domain or change DNS as part of this preparation. See [Vercel package manager detection](https://vercel.com/docs/package-managers), [environment settings](https://vercel.com/docs/environment-variables), and [custom domain setup](https://vercel.com/docs/domains/set-up-custom-domain).

For contact delivery, use a test recipient you control and a sender verified with Resend. Production contact submissions fail closed unless Upstash is configured. The application does not store leads in a database. Never use a `NEXT_PUBLIC_` prefix for any variable above.

After an approved deployment, smoke-test the home page and each core route, `/robots.txt`, `/sitemap.xml`, an unknown `/work/<slug>` and `/blog/<slug>` (both should return 404), and the privacy notice. Submit one non-sensitive contact test from `/contact` and confirm receipt at the controlled recipient; a success response alone is not proof of inbox delivery. Do not call contact delivery verified until that test arrives.

GitHub Actions CI is defined in `.github/workflows/ci.yml`. It runs on pushes, pull requests, and manual dispatch, uses `npm ci` with `package-lock.json`, and requires no application secrets. It does not deploy. After the first workflow run, configure a GitHub branch ruleset to require the CI job before merging if required checks are desired; no repository settings are changed here.
