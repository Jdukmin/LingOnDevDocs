# `/v1/users/*` — user profile

Source: [src/route/LingOnUsers.ts](../../../src/route/LingOnUsers.ts) ·
Repository: [src/db/userRepository.ts](../../../src/db/userRepository.ts)
(see [database/users.md](../database/users.md))

## Routes

| Method | Path | Auth |
|---|---|---|
| GET | `/v1/users/me` | Required (`req.ctx.userId`) |
| PATCH | `/v1/users/me` | Required |

> **Status note**: authentication is not implemented — both endpoints 401
> unconditionally until `req.ctx.userId` is populated. See
> [FeatureList.md](../FeatureList.md) and the OAuth entry there.

## `GET /v1/users/me`

**Service**: `userRepo.findById(userId)`. Throws `AppError('USER_NOT_FOUND', 404)`
if no row exists.

**Reply**: `{ success: true, data: User, error: null }` where `User` = `{ id,
provider, provider_id, email, name, avatar_url, created_at, updated_at }`.

## `PATCH /v1/users/me`

**Body** (all fields optional; only present keys are updated)

| Field | Type | Validation |
|---|---|---|
| `name` | string | if present, non-empty after trim |
| `avatar_url` | string \| null | if present, `null` explicitly clears the field |

**Validation**: `AppError('BAD_REQUEST', 400)` if `name` is present but blank.

**Service**: `userRepo.update(userId, body)` — builds a dynamic `SET` clause
from only the keys present in `body` (`'avatar_url' in input` distinguishes
"clear the field" from "leave unchanged"). Throws `AppError('USER_NOT_FOUND', 404)`
if the user doesn't exist.

**Reply**: `{ success: true, data: User, error: null }`
