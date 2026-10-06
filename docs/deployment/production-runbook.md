# FreshCart Production Deployment Runbook

This runbook is the production checklist for the FreshCart grocery ecommerce platform. It covers the API, admin panel, customer web app, PostgreSQL database, and operational checks.

## Production Services

- API: NestJS service from `apps/api`, exposed behind `/api`.
- Customer web: Next.js app from `apps/web`.
- Admin panel: Next.js app from `apps/admin`.
- Database: PostgreSQL.
- Optional runtime services: Redis, Meilisearch, object storage, email, SMS, WhatsApp, Mapbox, Razorpay.

## Required Environment

Set these before launch:

- `NODE_ENV=production`
- `PORT`
- `API_PUBLIC_URL`
- `DATABASE_URL`
- `CUSTOMER_SESSION_SECRET`
- `ADMIN_SESSION_SECRET`
- `OTP_SECRET`
- `REDIS_URL`
- `MEILISEARCH_HOST`
- `MEILISEARCH_API_KEY`
- `MAPBOX_PUBLIC_TOKEN`
- `MAPBOX_SECRET_TOKEN`
- `EMAIL_PROVIDER_API_KEY`
- `SMS_PROVIDER_API_KEY`
- `WHATSAPP_PROVIDER_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- storage variables if using object storage: `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET`

Do not set these in production:

- `AUTH_DEV_OTP_CODE`
- `ADMIN_DEV_2FA_CODE`

Rotate all local/default values before production, including `SEED_ADMIN_PASSWORD`.

## Preflight

Run from the project root:

```bash
pnpm install --frozen-lockfile
pnpm ops:readiness
pnpm typecheck
pnpm --filter @freshcart/api typecheck
pnpm --filter @freshcart/admin typecheck
pnpm --filter @freshcart/web typecheck
```

For a strict production check:

```bash
STRICT_PRODUCTION_READINESS=true NODE_ENV=production pnpm ops:readiness:strict
```

## Database Migration

Use Prisma migrations, not manual schema edits.

```bash
pnpm --filter @freshcart/api exec prisma migrate deploy
pnpm --filter @freshcart/api exec prisma generate
```

Before migration:

- Confirm a fresh database backup exists.
- Confirm the app build was tested against the same migration set.
- Confirm no destructive migration is being applied without a rollback plan.

## Build

```bash
pnpm build
```

If deploying apps separately:

```bash
pnpm --filter @freshcart/api build
pnpm --filter @freshcart/web build
pnpm --filter @freshcart/admin build
```

## Runtime Health Checks

API:

```bash
curl -f https://YOUR_API_HOST/api/live
curl -f https://YOUR_API_HOST/api/ready
curl -f https://YOUR_API_HOST/api/health
```

Expected:

- `/api/live` returns `status: alive`.
- `/api/ready` returns `status: ready`.
- `/api/health` returns `status: ok` and `database: up`.

Every API response includes `X-Request-Id`. Keep this value when debugging production issues.

## Smoke Tests

Against a staging API:

```bash
API_BASE_URL=https://YOUR_API_HOST/api pnpm --filter @freshcart/api exec node scripts/admin-api-smoke.cjs
API_BASE_URL=https://YOUR_API_HOST/api pnpm --filter @freshcart/api exec node scripts/client-api-smoke.cjs
```

Only run smoke tests against production if test account isolation and cleanup are confirmed.

## Backup

PostgreSQL backup:

```bash
pg_dump "$DATABASE_URL" --format=custom --file="freshcart-$(date +%Y%m%d-%H%M%S).dump"
```

Plain SQL backup:

```bash
pg_dump "$DATABASE_URL" --file="freshcart-$(date +%Y%m%d-%H%M%S).sql"
```

Media backup:

- If using local upload storage, back up `MEDIA_PUBLIC_ROOT/uploads`.
- If using object storage, enable bucket versioning and lifecycle retention.

## Restore Drill

Restore into a new database, never directly over production:

```bash
createdb freshcart_restore
pg_restore --dbname="$RESTORE_DATABASE_URL" --clean --if-exists freshcart-backup.dump
pnpm --filter @freshcart/api exec prisma migrate deploy
```

Then verify:

```bash
curl -f https://RESTORE_API_HOST/api/ready
```

## Rollback

Preferred rollback:

1. Stop new deployments.
2. Re-deploy the previous API, web, and admin artifacts.
3. If the migration was backward compatible, keep the database as-is.
4. If the migration was destructive, restore from the pre-deploy backup into a new database and switch `DATABASE_URL`.
5. Run `/api/ready` and smoke checks before reopening traffic.

## Go-Live Checklist

- Production environment variables are set and secrets rotated.
- `AUTH_DEV_OTP_CODE` and `ADMIN_DEV_2FA_CODE` are removed.
- Database backup exists and restore command was tested.
- Prisma migrations have been applied with `migrate deploy`.
- API `/api/ready` is ready.
- Admin login and 2FA work.
- Customer OTP provider is real, not dev code.
- Payment gateway keys are real and tested in the correct mode.
- Email, SMS, WhatsApp notification providers are configured.
- Map and delivery tracking tokens are configured.
- Customer web and admin panel point to the production API.
- Upload/media URLs are stable through `API_PUBLIC_URL` or object storage.
- Request logs are being collected by the hosting platform.
- Incident owner and rollback owner are assigned.
