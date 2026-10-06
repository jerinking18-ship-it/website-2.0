# Demo Deployment: Vercel + Render

Use this for a demo/staging deployment of the current FreshCart work. This is not the final production setup.

## What Will Be Deployed

- Customer website: Vercel project using `apps/web`
- Admin panel: Vercel project using `apps/admin`
- API backend: Render web service using `apps/api`
- Database: any hosted PostgreSQL connection string

## 1. Prepare Database

Create a hosted PostgreSQL database first. For a demo, Neon, Supabase, Railway, or Render Postgres can work.

Copy the database connection string. It will be used as:

```bash
DATABASE_URL="postgresql://..."
```

## 2. Deploy API To Render

The repo now has `render.yaml`.

In Render:

1. Create a new Blueprint or Web Service from the repository.
2. Use the root directory: `.`
3. Build command:

```bash
pnpm install --frozen-lockfile && pnpm --filter @freshcart/api prisma:generate && pnpm --filter @freshcart/api build
```

4. Start command:

```bash
pnpm --filter @freshcart/api start:prod
```

5. Health check path:

```text
/api/ready
```

6. Add env vars:

```bash
NODE_ENV=production
DATABASE_URL=your_postgres_url
API_PUBLIC_URL=https://your-render-api-url
NEXT_PUBLIC_API_URL=https://your-render-api-url/api
SEED_ADMIN_PASSWORD=choose_a_demo_admin_password
CUSTOMER_SESSION_SECRET=generate_a_secret
ADMIN_SESSION_SECRET=generate_a_secret
OTP_SECRET=generate_a_secret
```

Do not set `AUTH_DEV_OTP_CODE` or `ADMIN_DEV_2FA_CODE` for a proper hosted demo. If you want a fast private demo only, you can temporarily set them, but remove them before sharing publicly.

After the service deploys, run migrations from Render shell or locally with the deployed `DATABASE_URL`:

```bash
pnpm --filter @freshcart/api exec prisma migrate deploy
pnpm --filter @freshcart/api prisma:seed
```

Check:

```bash
curl https://your-render-api-url/api/ready
```

## 3. Deploy Customer Website To Vercel

Create a Vercel project:

- Root directory: `apps/web`
- Framework: Next.js
- Build command: leave default or use `pnpm build`
- Install command: `pnpm install --frozen-lockfile`

Set env vars:

```bash
NEXT_PUBLIC_API_URL=https://your-render-api-url/api
NEXT_PUBLIC_WEB_URL=https://your-customer-vercel-url
NEXT_PUBLIC_ADMIN_URL=https://your-admin-vercel-url
NEXT_PUBLIC_MAPBOX_TOKEN=
```

## 4. Deploy Admin Panel To Vercel

Create another Vercel project:

- Root directory: `apps/admin`
- Framework: Next.js
- Build command: leave default or use `pnpm build`
- Install command: `pnpm install --frozen-lockfile`

Set env vars:

```bash
NEXT_PUBLIC_API_URL=https://your-render-api-url/api
NEXT_PUBLIC_WEB_URL=https://your-customer-vercel-url
NEXT_PUBLIC_ADMIN_URL=https://your-admin-vercel-url
NEXT_PUBLIC_MAPBOX_TOKEN=
```

## 5. Demo Login

After `prisma:seed`, default owner email is:

```text
owner@freshcart.local
```

Password is the `SEED_ADMIN_PASSWORD` used during seeding.

## 6. Known Demo Limits

- Render free services may sleep when inactive.
- Uploaded images still use local API storage until real storage is added.
- SMS, WhatsApp, email, payment, and map provider keys are not required for a basic demo but are needed for production behavior.
- Search uses Meilisearch only if `MEILISEARCH_HOST` and `MEILISEARCH_API_KEY` are configured. Otherwise the API falls back to database search.
