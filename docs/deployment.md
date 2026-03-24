# TaskFlow — Deployment Guide

## 1. Prerequisites

- Node.js 20+
- Railway account with a PostgreSQL database provisioned
- Anthropic API key (for `/api/voice/parse`)
- Netlify account
- GitHub account (CI/CD runs via GitHub Actions)

---

## 2. Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env
# Edit .env — set DATABASE_URL and ANTHROPIC_API_KEY

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations against Railway DB
npx prisma migrate deploy

# 5. Start dev server
npm run dev
```

The dev server runs at `http://localhost:3000`.

---

## 3. Railway PostgreSQL — Getting the Connection String

1. Open your Railway project dashboard at [railway.app](https://railway.app)
2. Click the **PostgreSQL** service
3. Go to the **Connect** tab
4. Under **Public Network**, copy the connection string

Format:
```
postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
```

**Important:** Use the **Public** network URL, not the Internal one. Netlify functions run outside Railway's private network and cannot reach the internal hostname.

---

## 4. Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Railway PostgreSQL public connection string |
| `ANTHROPIC_API_KEY` | Yes | Used by `/api/voice/parse` for task extraction |
| `NEXT_PUBLIC_APP_URL` | Yes | Deployed Netlify URL — exposed to the browser |

---

## 5. First Deploy to Netlify (via UI)

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**
3. Connect the GitHub repository
4. Netlify auto-detects `netlify.toml` — the build command and publish directory are pre-configured
5. Go to **Site settings → Environment variables** and add:
   - `DATABASE_URL` — Railway public connection string
   - `ANTHROPIC_API_KEY` — Anthropic key
   - `NEXT_PUBLIC_APP_URL` — your Netlify URL (find it under **Site settings → Domain**)
6. Go to **Deploys** and trigger a deploy

---

## 6. Subsequent Deploys

Netlify auto-deploys on every push to `main`. No manual action needed.

If you need to trigger a deploy manually: **Netlify dashboard → Deploys → Trigger deploy → Deploy site**.

---

## 7. Database Migrations

Migrations must be run manually before deploying any schema changes. Run locally, pointing at the Railway database:

```bash
npx prisma migrate deploy
```

Do **not** add `prisma migrate deploy` to the Netlify build command. A failed migration would abort the build and leave the site broken. Always run migrations as a separate step before pushing the code change.

To create a new migration during development:

```bash
npx prisma migrate dev --name describe-the-change
```

---

## 8. GitHub Actions Secrets

The CI pipeline (`.github/workflows/ci.yml`) requires these secrets to be set in the GitHub repository:

**GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|---|---|
| `DATABASE_URL` | Railway PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `NEXT_PUBLIC_APP_URL` | Netlify site URL |

---

## 9. Running Tests

```bash
npm run test           # watch mode (development)
npm run test -- --run  # single run (CI)
```

---

## 10. How to Roll Back

### Application rollback
1. Go to **Netlify dashboard → Deploys**
2. Find the last known good deploy
3. Click **Publish deploy**

Netlify serves the previous build immediately — no rebuild required.

### Database rollback
Prisma does not support automatic down-migrations. If a migration caused data issues:

1. Identify the migration to revert in `prisma/migrations/`
2. Write a corrective SQL script manually
3. Run it against the Railway database using the Railway query console or a direct `psql` connection
4. If the schema change needs reversing, write a new migration that undoes the structural change:
   ```bash
   npx prisma migrate dev --name revert-describe-the-change
   npx prisma migrate deploy
   ```

Always take a manual snapshot of the Railway database before running destructive migrations (Railway dashboard → PostgreSQL service → **Backups**).

---

## 11. Common Issues

**Build fails: "Cannot find module '@prisma/client'"**
Prisma generate must run before the Next.js build. The `netlify.toml` build command handles this (`npx prisma generate && npm run build`). If you see this error, check that `netlify.toml` is committed and being picked up.

**Voice parsing fails**
Check that `ANTHROPIC_API_KEY` is set correctly in Netlify environment variables. Changes to environment variables require a new deploy to take effect.

**DB connection refused**
Ensure `DATABASE_URL` uses Railway's **Public** URL, not the Internal one. The internal hostname is only reachable from within Railway's network.

**Tasks not persisting between deploys**
Netlify functions are stateless — all data lives in Railway PostgreSQL. This is expected and correct behaviour. If tasks appear to disappear, check that `DATABASE_URL` is set correctly in both local `.env` and Netlify environment variables.

**CI build passes locally but fails in GitHub Actions**
Confirm all three secrets (`DATABASE_URL`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_APP_URL`) are set in GitHub repo secrets. The build step will fail silently on missing env vars if Next.js doesn't reference them at build time, but the test step may fail if Prisma cannot connect.
