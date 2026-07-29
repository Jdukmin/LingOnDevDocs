# `users`

Repository: [src/db/userRepository.ts](../../../src/db/userRepository.ts) (profile fields) · [src/db/googleTokenRepository.ts](../../../src/db/googleTokenRepository.ts) (Google Calendar tokens).

Migrations:
- [migrations/001_rename_provider_sub_to_provider_id.sql](../../../migrations/001_rename_provider_sub_to_provider_id.sql)
- [migrations/002_users_city_and_refresh_tokens.sql](../../../migrations/002_users_city_and_refresh_tokens.sql)
- [migrations/003_google_calendar_tokens.sql](../../../migrations/003_google_calendar_tokens.sql)

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | referenced as `req.ctx.userId` in auth middleware |
| `provider` | varchar(32) | OAuth provider name — currently always `"google"` |
| `provider_id` | varchar(255) | provider-issued user identifier (`sub` from Google payload) — **never returned in HTTP responses** |
| `email` | varchar(255) | |
| `nickname` | varchar(100) | mapped from Google payload `name` field |
| `profile_image` | text, nullable | mapped from Google payload `picture` field |
| `city` | varchar(100), nullable | user-set city via `PATCH /v1/users/me`; not populated by OAuth login |
| `google_access_token` | text, nullable | AES-256-GCM encrypted Google Calendar access token. Set by `GET /v1/auth/google/calendar/callback`, refreshed by `GoogleTokenService`. **Never returned in HTTP responses.** |
| `google_refresh_token` | text, nullable | AES-256-GCM encrypted Google Calendar refresh token. **Never returned in HTTP responses.** |
| `google_token_expire` | timestamptz, nullable | absolute expiry of `google_access_token`; `GoogleTokenService` refreshes ~60s ahead of this |
| `created_at` | timestamptz | set at INSERT |
| `updated_at` | timestamptz | set to `NOW()` on `upsertByProvider` / `update()` / Google token save |

`google_access_token`, `google_refresh_token`, and `google_token_expire` are
entirely independent of the OAuth login columns above (`provider`,
`provider_id`) — they are populated by the separate Calendar consent flow
(see [api/auth.md — Flow 3](../api/auth.md#flow-3--calendar-consent-get-v1authgooglecalendar-callback))
and never touched by login.

**Response safety**: `userRepository.findById`/`update` use `SELECT *` /
`RETURNING *` internally (unchanged, relied on by internal callers), so
`LingOnUsers.ts` (`GET`/`PATCH /v1/users/me`) explicitly whitelists response
fields via `toPublicUser()` rather than returning the raw row — this is what
actually keeps `provider_id` and the Google token columns out of client
responses, not the query shape.

## Constraints

- `PRIMARY KEY (id)`
- `UNIQUE (provider, provider_id)` — required for `upsertByProvider`'s atomic
  `INSERT ... ON CONFLICT DO UPDATE`. Added by migration 001.

## Queries

- `findById(id)` — `SELECT * WHERE id = $1`
- `findByProvider(provider, providerId)` — `SELECT * WHERE provider = $1 AND provider_id = $2`
- `create(input)` — `INSERT ... RETURNING *` (throws on unique violation)
- `update(id, input)` — dynamic partial `SET`; only keys present in `input` are
  written. `'profile_image' in input` and `'city' in input` distinguish explicit
  `null` (clear field) from an absent key (leave unchanged). Supports `nickname`,
  `profile_image`, and `city`.
- `upsertByProvider(provider, providerId, data)` — atomic `INSERT ... ON CONFLICT
  DO UPDATE SET nickname, profile_image, updated_at`. Used during OAuth login
  to keep profile data current without race conditions. `email`, `provider_id`,
  and `city` are never overwritten on conflict.
- `deleteUser(id)` — `DELETE WHERE id = $1`

## Google → DB field mapping

| Google payload | DB column |
|---|---|
| `sub` | `provider_id` |
| `email` | `email` |
| `name` | `nickname` |
| `picture` | `profile_image` |

`city` is never set by OAuth — it is set exclusively by the user via `PATCH /v1/users/me`.

## Consumers

- [LingOnAuth.ts](../../../src/route/LingOnAuth.ts) — `POST /v1/auth/google`, `GET /v1/auth/google/callback` → `upsertByProvider`; `GET /v1/auth/google/calendar/callback` → `googleTokenRepo.saveTokens`
- [LingOnSession.ts](../../../src/route/LingOnSession.ts) — `GET /v1/auth/me` → `findById` (returns without `provider_id`)
- [LingOnUsers.ts](../../../src/route/LingOnUsers.ts) — `GET`/`PATCH /v1/users/me` → `toPublicUser()` (excludes `provider_id` + Google token columns)
- [GoogleTokenService.ts](../../../src/gateway/GoogleTokenService.ts) — `GET /v1/calendar/events` (via `GoogleCalendarAPI`) → `googleTokenRepo.getTokens` / `saveTokens` on refresh
