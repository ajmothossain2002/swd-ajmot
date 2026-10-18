# Ajmot Hossain — Portfolio and Web Development

Portfolio and web development business site built with Next.js App Router, TypeScript, React, and Tailwind CSS 4.

## Prerequisites

- Node.js 20.9 or newer
- npm 10 or newer

## Install and run

```bash
npm install
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
- `docs/` — Product requirements, architecture, design system, and deployment setup

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for contact email configuration, production rate limiting, and Markdown authoring. The contact form does not send until its server credentials and recipient are configured.
