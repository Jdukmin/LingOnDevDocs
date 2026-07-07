# Deployment

## Build & run

```bash
npm install
npm run build   # tsc -p tsconfig.json → dist/
npm run start   # node dist/app.js
```

`npm run dev` (`tsx watch src/app.ts`) is for local development only — it
runs TypeScript directly with hot reload and should not be used in production.

## Server provisioning: `server_init.sh`

One-time setup script for a fresh host, run manually (see
[../../../server_init.sh](../../../server_init.sh)):

1. `apt update && apt install curl git build-essential`
2. Installs Node.js LTS via NodeSource (chosen over `nvm` for production
   stability, per the in-script comment)
3. Installs `pm2` globally as the production process manager

## Deploy: `server_deploy.sh`

Run on each deploy (see [../../../server_deploy.sh](../../../server_deploy.sh)):

```bash
npm install --production=false   # devDependencies included — needed for tsc
npm run build
```

Note: neither script starts or restarts the process (e.g. via `pm2`) — that
step is not yet automated in this repository.

## Environment variables

See [.env.example](../../../.env.example) for the full template. Required
variables (server refuses to start if missing, per the `@fastify/env` schema
in [app.ts](../../../src/app.ts)):

| Key | Required | Default |
|---|---|---|
| `PORT` | yes | `4444` |
| `HOST` | yes | `127.0.0.1` |

Other variables consumed at runtime (not part of the `@fastify/env` schema,
read via `process.env` / `dotenv` in individual modules):

| Key | Used by | Notes |
|---|---|---|
| `OPENWEATHER_API_KEY` | `LingOnWeather.ts` plugin entry | required for weather/geocoding to function |
| `OPENWEATHER_BASE_URL` | same | default `https://api.openweathermap.org` |
| `OPENAI_API_KEY` | `Repositories.ts` | seeds the in-memory provider-key map at startup |
| `LOG_LEVEL` | `Logger.ts` | default `info` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | `pool.ts` | `DB_PORT` defaults to `5432` |
| `MASTER_ENCRYPTION_KEY` | `encrypt.ts` | **required** 64-hex-char (32-byte) key for `user_api_keys` AES-256-GCM encryption — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

## Logs on disk

`data/log/<process-start-time>.log` — one file per process run (see
[Logger.ts](../../../src/core/utils/Logger.ts)), in addition to the DB-backed
`request_logs`/`raw_logs` tables (see [../database/](../database/)).
