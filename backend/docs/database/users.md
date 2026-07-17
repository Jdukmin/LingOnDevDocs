# `users`

Repository: [src/db/userRepository.ts](../../../src/db/userRepository.ts).

Migration: [migrations/001_rename_provider_sub_to_provider_id.sql](../../../migrations/001_rename_provider_sub_to_provider_id.sql)

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | referenced as `req.ctx.userId` in auth middleware |
| `provider` | varchar(32) | OAuth provider name — currently always `"google"` |
| `provider_id` | varchar(255) | provider-issued user identifier (`sub` from Google payload) |
| `email` | varchar(255) | |
| `nickname` | varchar(100) | mapped from Google payload `name` field |
| `profile_image` | text, nullable | mapped from Google payload `picture` field |
| `created_at` | timestamptz | set at INSERT |
| `updated_at` | timestamptz | set to `NOW()` on `upsertByProvider` / `update()` |

## Constraints

- `PRIMARY KEY (id)`
- `UNIQUE (provider, provider_id)` — required for `upsertByProvider`'s atomic
  `INSERT ... ON CONFLICT DO UPDATE`. Added by migration 001.

## Queries

- `findById(id)` — `SELECT * WHERE id = $1`
- `findByProvider(provider, providerId)` — `SELECT * WHERE provider = $1 AND provider_id = $2`
- `create(input)` — `INSERT ... RETURNING *` (throws on unique violation)
- `update(id, input)` — dynamic partial `SET`; only keys present in `input` are
  written. `'profile_image' in input` distinguishes explicit `null` (clear field)
  from an absent key (leave unchanged).
- `upsertByProvider(provider, providerId, data)` — atomic `INSERT ... ON CONFLICT
  DO UPDATE SET nickname, profile_image, updated_at`. Used during OAuth login
  to keep profile data current without risk of duplicate rows under concurrent
  requests. `email` and `provider_id` are never overwritten on conflict.
- `deleteUser(id)` — `DELETE WHERE id = $1`

## Google → DB field mapping

| Google payload | DB column |
|---|---|
| `sub` | `provider_id` |
| `email` | `email` |
| `name` | `nickname` |
| `picture` | `profile_image` |

## Consumers

- [LingOnAuth.ts](../../../src/route/LingOnAuth.ts) — `POST /v1/auth/google`, `GET /v1/auth/google/callback` → `upsertByProvider`
- [LingOnUsers.ts](../../../src/route/LingOnUsers.ts) — `GET`/`PATCH /v1/users/me`
