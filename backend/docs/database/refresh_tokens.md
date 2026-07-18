# `refresh_tokens`

Repository: [src/db/refreshTokenRepository.ts](../../../src/db/refreshTokenRepository.ts).

Migration: [migrations/002_users_city_and_refresh_tokens.sql](../../../migrations/002_users_city_and_refresh_tokens.sql)

## Columns

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `user_id` | text | references `users.id` (stored as text for UUID/bigserial compatibility) |
| `token_hash` | text | SHA-256 hex digest of the refresh token JWT — plain token is **never** stored |
| `token_version` | integer | matches the `tokenVersion` field in the JWT payload; incremented on each rotation |
| `expires_at` | timestamptz | matches the JWT `exp` claim |
| `revoked_at` | timestamptz, nullable | set on logout or rotation; `NULL` means active |
| `created_at` | timestamptz | set at INSERT |

## Indexes

| Index | Type | Notes |
|---|---|---|
| `idx_refresh_tokens_token_hash` | UNIQUE | fast lookup by hash |
| `idx_refresh_tokens_user_id` | B-tree | used for `revokeAllForUser` |
| `idx_refresh_tokens_active` | partial B-tree | `WHERE revoked_at IS NULL` — fast active-token lookup |

## Security rules

- **SHA-256 only**: `hashRefreshToken(token)` is called before any INSERT or
  lookup. Plain-text tokens are never written to DB, logged, or returned in
  HTTP responses.
- **`findActiveByHash`** requires both `revoked_at IS NULL` AND `expires_at > NOW()`.
- **Rotation**: on `POST /v1/auth/refresh`, the new token is inserted **before**
  the old is revoked — no window where neither is valid.
- **Logout**: `revokeByHash` is idempotent; calling it on an already-revoked or
  expired token is safe (returns `false`, no error).

## Queries

- `hashRefreshToken(token)` — exported utility; `SHA-256(token).hex`
- `create(userId, tokenHash, tokenVersion, expiresAt)` — INSERT
- `findActiveByHash(hash)` — SELECT WHERE `token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`
- `revokeByHash(hash)` — UPDATE `revoked_at = NOW()` WHERE `token_hash = $1 AND revoked_at IS NULL`
- `revokeAllForUser(userId)` — UPDATE all active tokens for a user (future: "logout all devices")

## Cleanup

Expired rows are never automatically deleted. A periodic job should run:

```sql
DELETE FROM refresh_tokens WHERE expires_at < NOW();
```

(See TODO in [CLAUDE.md](../../../CLAUDE.md))

## Consumers

- [LingOnAuth.ts](../../../src/route/LingOnAuth.ts) — inserts on successful OAuth login (`tokenVersion = 1`)
- [LingOnSession.ts](../../../src/route/LingOnSession.ts) — `POST /v1/auth/refresh` (lookup + rotation), `POST /v1/auth/logout` (revoke)
