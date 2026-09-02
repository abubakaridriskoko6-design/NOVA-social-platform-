# NOVA production deployment

NOVA deploys as two services: the Express API in `server/` and the Vite build served by Nginx. The frontend must be built with the public API URL; the API must have a reachable PostgreSQL database.

## Required configuration

Copy `server/.env.example` to `server/.env` and set:

- `NODE_ENV=production`
- `HOST=0.0.0.0` and `PORT=4000` (or the values supplied by the runtime)
- `DATABASE_URL` to the production PostgreSQL connection string
- `JWT_SECRET` to a unique random value of at least 32 characters, stored only in the deployment secret manager
- `JWT_EXPIRES_IN`, `COOKIE_NAME`, and `COOKIE_SAME_SITE`; use `COOKIE_SAME_SITE=none` only when the web and API are cross-site and HTTPS is enforced
- `CORS_ORIGIN` to one or more exact HTTPS web origins separated by commas; wildcards are rejected in production
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, and `AUTH_RATE_LIMIT_MAX`

Copy the root `.env.example` or set `VITE_API_BASE_URL` to the exact public API origin before the frontend build. Production builds fail when this value is missing and never fall back to localhost.

## PostgreSQL and Prisma

Create an empty PostgreSQL database and grant the application user only the permissions required by the application. From `server/`, run:

```sh
npm ci
npm run db:generate
npm run db:migrate:deploy
npm run db:migrate:status
```

`db:migrate:deploy` applies committed migrations without resetting data. The production container runs this command before starting the API. Do not use `db:push` or `migrate dev` against production.

## Build and start

Backend:

```sh
npm --prefix server ci
npm --prefix server run db:generate
npm --prefix server run db:migrate:deploy
npm --prefix server run build
npm --prefix server start
```

Frontend:

```sh
VITE_API_BASE_URL=https://api.example.com npm ci
VITE_API_BASE_URL=https://api.example.com npm run build
```

The included `docker-compose.production.yml` builds the API and Nginx web service. Set `VITE_API_BASE_URL` in the environment used by Compose and keep `server/.env` outside version control. The API health check is `GET /api/health`; the web container health check is `GET /health`.

## Domains and realtime

Point the web domain at the Nginx service and the API domain at the Express service. Set `CORS_ORIGIN` to the web origin exactly, including scheme and port where applicable. Keep HTTPS termination in front of both services. Messaging realtime currently uses authenticated Server-Sent Events at `/api/realtime`; the proxy must allow long-lived connections, forward cookies, disable response buffering for that route, and permit keep-alive connections.

## Payments

Payment records are provider-agnostic and remain `PENDING` until a real provider integration confirms payment. No provider credentials are included. Before enabling public checkout, configure the chosen provider's account, API key, webhook signing secret, and event endpoint in the deployment secret manager; implement signature verification, raw-body handling, replay protection, and writes to `PaymentWebhookEvent` using `(provider, providerEventId)` as the idempotency key. Never mark a payment paid from a browser request alone.

## Security checklist

- Use a unique production `JWT_SECRET`; never use example or development values.
- Use HTTPS, secure cookies, exact CORS origins, and a restricted database role.
- Run migrations before accepting traffic and confirm `/api/health` reports `database: ok`.
- Keep application logs free of passwords, tokens, payment secrets, and unnecessary personal data.
- Configure a reverse proxy timeout and buffering policy suitable for SSE.
- Rotate secrets through the deployment secret manager, not repository files.

## Verification

After deployment, verify `GET /api/health` returns HTTP 200 with `status: ok` and `database: ok`, load the web domain, register/login with community rules accepted, create a post, send a message, open the realtime stream, and confirm an admin-only endpoint rejects a normal user. Inspect logs for startup and database errors without exposing secret values.
