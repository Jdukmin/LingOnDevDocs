# `/v1/users/*` — user profile

Source: [src/route/LingOnUsers.ts](../../../src/route/LingOnUsers.ts) ·
Repository: [src/db/userRepository.ts](../../../src/db/userRepository.ts)
(see [database/users.md](../database/users.md))

## Routes

| Method | Path | Auth |
|---|---|---|
| GET | `/v1/users/me` | Required (`req.ctx.userId`) |
| PATCH | `/v1/users/me` | Required |

## `GET /v1/users/me`

**Service**: `userRepo.findById(userId)`. Throws `AppError('USER_NOT_FOUND', 404)`
if no row exists.

**Reply**: `{ success: true, data: User, error: null }` where `User` = `{ id,
provider, provider_id, email, nickname, profile_image, city, created_at, updated_at }`.

> **Note**: `provider_id` is included in this response (it comes from `SELECT *`).
> For an endpoint that omits `provider_id`, use `GET /v1/auth/me` instead.

## `PATCH /v1/users/me`

**Body** (all fields optional; only present keys are updated)

| Field | Type | Validation |
|---|---|---|
| `nickname` | string | if present, non-empty after trim |
| `profile_image` | string \| null | if present, `null` explicitly clears the field |
| `city` | string \| null | if present, non-empty after trim or `null` to clear |

**Validation**: `AppError('BAD_REQUEST', 400)` if `nickname` is present but blank,
or if `city` is present and not `null` but is an empty string after trim.

**Service**: `userRepo.update(userId, body)` — builds a dynamic `SET` clause
from only the keys present in `body`. `'profile_image' in input` and
`'city' in input` distinguish "clear the field" (`null`) from "leave unchanged"
(absent key). Throws `AppError('USER_NOT_FOUND', 404)` if the user doesn't exist.

**Reply**: `{ success: true, data: User, error: null }`

### Example — set city

```jsonc
PATCH /v1/users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{ "city": "Seoul" }
```

### Example — clear city

```jsonc
PATCH /v1/users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{ "city": null }
```
