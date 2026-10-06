# Local Backend Runtime

This project expects PostgreSQL, Redis, and Meilisearch for local backend development.

## Install Homebrew And Docker On macOS

This Codex session could not install Homebrew automatically because macOS required an admin password for `/opt/homebrew`.

Run this once in your Mac Terminal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then install a Docker-compatible local runtime:

```bash
brew install docker docker-compose colima
colima start --cpu 2 --memory 4
docker version
```

## Start Services

From `/Users/jerinnadar/website2.0`:

```bash
pnpm infra:up
pnpm db:migrate
pnpm db:seed
```

## Development URLs

- API: `http://localhost:4000/api`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Meilisearch: `http://localhost:7700`

## Seeded Admin Login

- Email: `owner@freshcart.local`
- Password: `Freshcart@12345`
- 2FA code: `123456`

These are local development values only. Change them before production.
