# Deployment And DevOps Strategy Plan

## Goal

Define deployment, environment, infrastructure, CI/CD, monitoring, backup, and rollback strategy for the grocery ecommerce platform.

The platform includes:

- Customer website.
- Admin panel.
- NestJS API.
- PostgreSQL.
- Redis.
- Meilisearch.
- Mapbox live delivery tracking.
- Notification providers.
- File storage.

## Environment Strategy

Use separate environments:

- Local development.
- Staging.
- Production.

## Local Development

Local development should include:

- Customer website.
- Admin panel.
- API server.
- PostgreSQL.
- Redis.
- Meilisearch.
- Mock payment.
- Mock notification providers where possible.

Recommended local tooling:

- Docker Compose for PostgreSQL, Redis, and Meilisearch.
- PNPM workspaces.
- Turborepo.

## Staging Environment

Staging should be close to production.

Use staging for:

- Client review.
- Internal QA.
- Database migration testing.
- Payment test mode.
- Notification test mode.
- Mapbox integration testing.
- Delivery tracking testing.

Staging should use separate:

- Database.
- Redis.
- Meilisearch index.
- Storage bucket.
- API keys.

## Production Environment

Production should use:

- Managed PostgreSQL.
- Managed Redis.
- Managed or hosted Meilisearch.
- Production storage bucket.
- Production notification providers.
- Production Mapbox token.
- Secure environment variables.
- Monitoring and backups.

## App Deployment Units

Deploy as separate services:

```txt
apps/web      customer website
apps/admin    admin panel
apps/api      backend API
worker        queue/background worker
```

The worker can process:

- Notification jobs.
- Search indexing jobs.
- Inventory alerts.
- Order side effects.
- Delivery notification events.

## Hosting Options

Possible hosting approach:

- Customer website: Vercel, Cloudflare Pages, or similar.
- Admin panel: Vercel, Cloudflare Pages, or similar.
- API: Render, Railway, Fly.io, AWS, GCP, or DigitalOcean.
- PostgreSQL: Neon, Supabase, Railway, Render, AWS RDS, or DigitalOcean.
- Redis: Upstash, Redis Cloud, Railway, or managed Redis.
- Meilisearch: Meilisearch Cloud or self-hosted.
- Storage: Cloudflare R2 or AWS S3.

Final hosting choice can be made before implementation.

## CI/CD Strategy

CI should run on each pull request or deployment branch.

CI checks:

- Install dependencies.
- Type check.
- Lint.
- Unit tests.
- API integration tests.
- Build web app.
- Build admin app.
- Build API.
- Prisma schema validation.

CD should deploy:

- Staging from staging branch.
- Production from main branch or approved release tag.

## Database Migration Strategy

Use Prisma migrations.

Rules:

- Never edit applied production migrations.
- Run migrations in staging first.
- Back up production before risky migrations.
- Review destructive migrations manually.
- Keep seed data separate from production data.

Deployment migration flow:

1. Build application.
2. Run tests.
3. Run Prisma migration on staging.
4. Validate staging.
5. Back up production.
6. Run production migration.
7. Deploy production.

## Environment Variables

Required env groups:

### Database

- `DATABASE_URL`

### Redis

- `REDIS_URL`

### Meilisearch

- `MEILISEARCH_HOST`
- `MEILISEARCH_API_KEY`

### Auth

- `CUSTOMER_SESSION_SECRET`
- `ADMIN_SESSION_SECRET`
- `OTP_SECRET`

### Mapbox

- `MAPBOX_PUBLIC_TOKEN`
- `MAPBOX_SECRET_TOKEN`

### Notifications

- `EMAIL_PROVIDER_API_KEY`
- `SMS_PROVIDER_API_KEY`
- `WHATSAPP_PROVIDER_API_KEY`

### Storage

- `STORAGE_ENDPOINT`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`
- `STORAGE_BUCKET`

### Payments

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Razorpay can remain unused until online payments are added.

## Secrets Management

Rules:

- Do not commit `.env` files.
- Keep `.env.example` updated.
- Use hosting provider secret storage.
- Rotate exposed keys immediately.
- Use separate staging and production keys.

## Search Deployment

Meilisearch should have separate indexes for:

- Staging products.
- Production products.

Search index updates should run when:

- Product is created.
- Product is updated.
- Product stock status changes.
- Category changes.
- Product is deactivated.

## Redis Usage In Production

Redis supports:

- Queues.
- OTP expiry.
- Rate limiting.
- Cart/session cache.
- Support chat presence.
- Delivery location cache.
- WebSocket scaling.

Redis should be monitored for:

- Memory usage.
- Connection count.
- Queue depth.

## File Storage Deployment

Use Cloudflare R2 or AWS S3 for:

- Product images.
- Support attachments later.
- Delivery proof images later.

Storage rules:

- Keep public product images optimized.
- Restrict private support attachments.
- Use signed upload URLs.
- Validate file type and size.

## Mapbox Deployment

Mapbox token rules:

- Public token can be used on frontend with domain restrictions.
- Secret token stays server-side.
- Restrict token usage where possible.
- Use separate staging and production tokens.

Tracking should degrade gracefully if Mapbox fails.

## Notification Provider Deployment

Use separate test and production credentials.

Before production:

- Verify email sender domain.
- Verify WhatsApp templates.
- Verify SMS sender setup.
- Test retry and fallback behavior.

## Monitoring Strategy

Monitor:

- API uptime.
- API response time.
- API error rate.
- Web app build/deployment status.
- Database health.
- Redis health.
- Queue failures.
- Notification failures.
- Meilisearch health.
- Delivery tracking errors.
- Payment failures.

Suggested tools:

- Hosting provider monitoring.
- Sentry for frontend/backend errors.
- Uptime monitoring.
- Database provider metrics.
- Queue dashboard.

## Logging Strategy

Log:

- API errors.
- Auth failures.
- Payment events.
- Order creation.
- Inventory changes.
- Delivery status changes.
- Notification failures.
- WebSocket errors.

Do not log:

- OTP codes.
- Passwords.
- Full payment secrets.
- Sensitive tokens.

## Backup Strategy

Back up:

- PostgreSQL database.
- Uploaded media metadata.
- Critical configuration.

Recommended:

- Daily automated backups.
- Point-in-time recovery if provider supports it.
- Manual backup before major migrations.

## Rollback Strategy

Rollback plan should include:

- Revert application deployment.
- Restore previous environment config if changed.
- Database rollback plan for migrations.
- Disable broken feature flags if available.
- Pause notification jobs if needed.

Important:

- Database rollbacks must be planned carefully.
- Avoid destructive migrations without backup.

## Release Checklist

Before deploying production:

- All tests pass.
- Staging verified.
- Database migration reviewed.
- Environment variables configured.
- Notification providers tested.
- Mapbox token configured.
- Storage bucket configured.
- Admin owner account created.
- Product data imported or seeded.
- Legal pages ready.
- Support contact ready.
- Monitoring enabled.
- Backup enabled.

## Recommended First DevOps Implementation Order

1. Monorepo scripts.
2. Local Docker Compose for PostgreSQL, Redis, and Meilisearch.
3. Environment examples.
4. CI checks.
5. Staging deployment.
6. Prisma migrations.
7. Storage setup.
8. Mapbox setup.
9. Notification provider setup.
10. Production deployment.
11. Monitoring and backups.

