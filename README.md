# Ghostfolio Playwright + TypeScript Test Suite

Comprehensive end-to-end, API and database test suite for [Ghostfolio](https://ghostfol.io),
the open-source wealth management software.

## Tech stack

- **Playwright** (`@playwright/test`) + **TypeScript** with the
  **Page Object Model** — UI tests for every public marketing page.
- **node-postgres** (`pg`) for direct PostgreSQL queries against a
  local Ghostfolio instance.
- **Prisma** for schema introspection and `db push` of the Ghostfolio
  Prisma schema in `utils/db/prisma/schema.prisma`.
- **Node.js 20+** runtime.
- Targets `https://ghostfol.io` by default (override via env vars).

## Project layout

```
fintech_ghostfolio_playwright-typescript/
├── pages/                # Page Object Model (one file per page)
│   ├── BasePage.ts       # navigation + footer + header + retry/backoff
│   ├── LandingPage.ts    # /en + /en/start (Get Started / Live Demo CTA)
│   ├── PublicDemoPage.ts # /en/demo (Live Demo destination)
│   ├── HomePage.ts       # /en/home (post-login)
│   ├── LoginPage.ts      # /en/login (security token)
│   ├── RegisterPage.ts   # /en/register
│   ├── PortfolioPage.ts  # /en/portfolio
│   ├── AccountsPage.ts   # /en/accounts
│   ├── AboutPage.ts      # /en/about
│   ├── FeaturesPage.ts   # /en/features
│   ├── PricingPage.ts    # /en/pricing
│   ├── FAQPage.ts        # /en/faq
│   ├── ResourcesPage.ts  # /en/resources
│   ├── MarketsPage.ts    # /en/markets
│   └── ZenPage.ts        # /en/zen
├── utils/
│   ├── helpers.ts        # console-error tracking, retries, unique IDs
│   ├── testData.ts       # enums, fixtures, factory functions
│   ├── apiClient.ts      # typed wrapper around the Ghostfolio REST API
│   └── db/dbClient.ts    # PostgreSQL helpers for schema-introspection tests
├── fixtures/
│   └── testFixtures.ts   # page-object + ApiClient fixtures
├── tests/
│   ├── ui/               # Browser tests (POM)
│   ├── api/              # REST API tests
│   └── database/         # PostgreSQL tests
├── global-setup.ts       # Health probe of the Ghostfolio API
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

## Getting started

```bash
npm install
npx playwright install chromium
npm test                        # run everything
npm run test:ui-only            # only UI tests
npm run test:api-only           # only API tests
npm run test:db-only            # only DB tests
npm run test:report             # open the HTML report
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `GHOSTFOLIO_API_BASE_URL` | `https://ghostfol.io` | API base URL |
| `GHOSTFOLIO_WEB_BASE_URL` | `https://ghostfol.io` | Web base URL |
| `GHOSTFOLIO_DB_URL` | `postgresql://postgres:postgres@localhost:5432/ghostfolio` | DB connection |

## What is tested

### UI (POM, browser)

The landing-page flow is the headline path: open `/en/start`, click
**Live Demo**, land on `/en/demo`. Every public marketing page has its
own spec covering: navigation, header/footer presence, form
interactions, responsive behaviour, and accessibility basics.

### API (REST, no UI)

Covers every documented endpoint under `/api/v1/*` — public health/info,
symbol lookup, exchange rate, asset, public portfolio; authenticated
user/account/activity/portfolio; admin where reachable; negative
tests for auth, validation, and 404 paths.

### Database (PostgreSQL, no UI)

Cross-checks that API calls actually persist to the database: user
creation, activity insertion, account balance updates, symbol profile
upsert, settings, tags. Also includes a schema-introspection suite so
the Prisma schema is part of the regression net.

## Prerequisites

- Node.js 20+
- A reachable Ghostfolio instance (the public demo at `ghostfol.io`
  is the default — you do not need to self-host for UI/API tests).
- **For database tests**: a PostgreSQL instance reachable on
  `localhost:5432` with the Ghostfolio Prisma schema pushed.
  The schema is checked into [`utils/db/prisma/schema.prisma`](utils/db/prisma/schema.prisma).

### Setting up the database for `npm run test:db-only`

You need any PostgreSQL 16+ instance. If you already have one
running on port 5432 (or another port), create a `ghostfolio` database
and push the schema:

```bash
# 1. Create the database (example uses the postgres image; adjust
#    credentials to match your local setup)
docker exec <your-postgres-container> psql -U <user> -c "CREATE DATABASE ghostfolio;"

# 2. Push the Ghostfolio Prisma schema
export GHOSTFOLIO_DB_URL="postgresql://<user>:<pass>@localhost:5432/ghostfolio"
npx prisma db push --schema utils/db/prisma/schema.prisma --accept-data-loss

# 3. (optional) seed a demo user + accounts + symbols so the test
#    suite has data to query
PGPASSWORD='<pass>' psql -h localhost -U <user> -d ghostfolio <<'SQL'
INSERT INTO "User" (id, "accessToken", role, "createdAt", "updatedAt")
VALUES ('demo-user-id-001', 'demo-token-abc123', 'USER', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
SQL

# 4. Run the DB suite
npm run test:db-only
```

If no database is reachable, every DB test self-skips cleanly and the
suite exits 0 — the UI and API tests run independently of the DB
configuration.