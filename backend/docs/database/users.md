# `users` (inferred — no migration file)

Repository: [src/db/userRepository.ts](../../../src/db/userRepository.ts).
Column set inferred from the `User` type and the queries in that file.

## Columns

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | text/uuid PK | referenced as `req.ctx.userId` elsewhere |
| `provider` | text | OAuth provider name (e.g. `google`) — for future OAuth login |
| `provider_id` | text | provider-issued user ID |
| `email` | text | |
| `name` | text | |
| `avatar_url` | text, nullable | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | set to `NOW()` on `update()` |

`(provider, provider_id)` is queried as a compound lookup in `findByProvider`
— likely a unique constraint, though no migration exists to confirm it.

## Queries

- `findById(id)` — `SELECT * FROM users WHERE id = $1`
- `findByProvider(provider, providerId)` — used during OAuth callback to
  check for an existing user (**OAuth callback route does not exist yet** —
  see [FeatureList.md](../FeatureList.md))
- `create(input)` — `INSERT ... RETURNING *`
- `update(id, input)` — dynamic partial `SET`, only for keys present in
  `input`; `'avatar_url' in input` distinguishes explicit `null` (clear) from
  absent (leave unchanged)
- `deleteUser(id)` — `DELETE ... WHERE id = $1`

## Consumers

[LingOnUsers.ts](../../../src/route/LingOnUsers.ts) — `GET`/`PATCH /v1/users/me`.
