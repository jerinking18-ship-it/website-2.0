# Deployment Docs

Production deployment should follow the project runbook:

- [Demo deployment: Vercel + Render](./demo-vercel-render.md)
- [Production deployment runbook](./production-runbook.md)

Before launch, run:

```bash
pnpm ops:readiness
pnpm typecheck
pnpm build
```

For strict production validation:

```bash
STRICT_PRODUCTION_READINESS=true NODE_ENV=production pnpm ops:readiness:strict
```
