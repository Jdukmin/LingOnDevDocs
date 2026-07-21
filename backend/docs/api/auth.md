# `/v1/auth/*` — authentication & session management

Sources:
- OAuth login + Calendar consent: [src/route/LingOnAuth.ts](../../../src/route/LingOnAuth.ts)
- Session (me / refresh / logout): [src/route/LingOnSession.ts](../../../src/route/LingOnSession.ts)

Gateway: [src/gateway/GoogleAuthAPI.ts](../../../src/gateway/GoogleAuthAPI.ts)  
Repositories: [src/db/userRepository.ts](../../../src/db/userRepository.ts) · [src/db/refreshTokenRepository.ts](../../../src/db/refreshTokenRepository.ts) · [src/db/googleTokenRepository.ts](../../../src/db/googleTokenRepository.ts)  
JWT utils: [src/core/utils/Jwt.ts](../../../src/core/utils/Jwt.ts)

For the Calendar data endpoint itself (`GET /v1/calendar/events`), see [api/calendar.md](calendar.md).

---

## Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/v1/auth/google` | None | ID Token login (Flutter native Android/iOS) |
| GET | `/v1/auth/google` | None | Redirect initiation (web / Flutter Web) |
| GET | `/v1/auth/google/callback` | None | Redirect callback |
| GET | `/v1/auth/me` | Required | Current user profile |
| POST | `/v1/auth/refresh` | None | Rotate refresh token → new token pair |
| POST | `/v1/auth/logout` | None | Revoke refresh token |
| GET | `/v1/auth/google/calendar` | Required (Bearer or `?access_token=`) | Calendar consent initiation — independent of login |
| GET | `/v1/auth/google/calendar/callback` | None (LingOn user carried via cookie) | Calendar consent callback |

---

## Flow 1 — ID Token (`POST /v1/auth/google`)

Flutter native obtains a Google `id_token` via the Google Sign-In SDK, sends
it to the backend for verification. The backend never uses user-supplied
profile fields — all data comes from the verified Google payload.

### Request

```jsonc
POST /v1/auth/google
Content-Type: application/json

{ "id_token": "eyJh..." }
```

### Success response — `200`

```json
{
  "success": true,
  "data": {
    "access_token": "<jwt>",
    "refresh_token": "<jwt>",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": "Display Name",
      "profile_image": "https://lh3.googleusercontent.com/..."
    }
  },
  "error": null
}
```

`provider_id` is **never** included in the response.

### Error responses

| Status | `error.code` | Condition |
|---|---|---|
| 400 | `BAD_REQUEST` | `id_token` absent, empty, or not a string |
| 401 | `UNAUTHORIZED` | Token fails Google signature / audience / expiry check |
| 500 | `INTERNAL` | Refresh token could not be stored in DB |

### Internal flow

```
POST /v1/auth/google
  → GoogleAuthAPI.execute({route: 'auth.verify', payload: {idToken}})
      → oauth2Client.verifyIdToken({idToken, audience: [CLIENT_ID, ANDROID_CLIENT_ID]})
      → returns GoogleUserInfo {sub, email, name, picture}
  → userRepo.upsertByProvider('google', sub, {email, nickname, profile_image})
      → INSERT ... ON CONFLICT (provider, provider_id) DO UPDATE
  → issueAccessToken(userId, provider, email, tokenVersion=1)   // 1-hour JWT
  → issueRefreshToken(userId, provider, email, tokenVersion=1)  // 30-day JWT
  → refreshTokenRepo.create(userId, SHA-256(refresh_token), 1, expiresAt)
  → ICD v0.0 envelope (no provider_id)
```

---

## Flow 2a — Redirect initiation (`GET /v1/auth/google`)

Redirects the browser to the Google consent screen. Requires redirect flow
env vars. Returns `501` if `LingOnOAuth/GoogleOAuth` plugin is not registered.

The platform (`web` / `android`) is read from the `X-Platform` request header
and stored in a short-lived `x_auth_platform` cookie (httpOnly, 10 min TTL)
so it survives the Google redirect round-trip.

### Request

```
GET /v1/auth/google
X-Platform: web | android   (optional — defaults to "web")
```

### Response

`302 Found` — redirects to Google consent URL.

---

## Flow 2b — Authorization Code callback (`GET /v1/auth/google/callback`)

Google redirects here after user grants consent. Platform is recovered from the
`x_auth_platform` cookie (see Flow 2a). Tokens are delivered via URL fragment
(`#`) — never in query string — to prevent them from appearing in server logs,
proxy logs, or browser history.

### Request

```
GET /v1/auth/google/callback?code=<auth-code>&state=<csrf-token>
```

### Response

`302 Found` — redirects to platform-specific client URL:

```
<WEB_CALLBACK_URL>#token=<access_jwt>&refresh_token=<refresh_jwt>      (web)
<ANDROID_CALLBACK_URL>#token=<access_jwt>&refresh_token=<refresh_jwt>  (android)
```

### Platform detection order (callback step)

1. `x_auth_platform` cookie — set at initiation step, survives redirect
2. `X-Platform` header — for direct callback calls (tests)
3. `User-Agent` — `/android/i` pattern → `"android"`
4. Default: `"web"`

### Error responses

| Status | `error.code` | Condition |
|---|---|---|
| 400 | `BAD_REQUEST` | State mismatch, expired code, or code exchange failure |
| 401 | `UNAUTHORIZED` | User denied consent (`?error=` from Google) |
| 500 | `INTERNAL` | `WEB_CALLBACK_URL` not configured, or `id_token` absent from token response, or refresh token DB insert failed |
| 501 | `NOT_IMPLEMENTED` | Redirect flow env vars not configured |

---

## Flow 3 — Calendar consent (`GET /v1/auth/google/calendar`, callback)

Independent of the login flow (1/2): separate `@fastify/oauth2` namespace
(`app.googleCalendarOAuth2`), separate scope (`calendar.readonly` only —
never `openid`/`email`/`profile`, never merged into the login scope), and
separate consent screen. Connecting or disconnecting Calendar never touches
`app.googleOAuth2`, the login scope, or any LingOn JWT/session.

Registered with `access_type=offline&prompt=consent` so Google always returns
a `refresh_token` on every consent — by default Google only issues one on a
user's very first authorization, which would otherwise silently break
re-connection.

### Initiation — `GET /v1/auth/google/calendar`

Requires an already-authenticated LingOn user. Since this is a top-level
browser navigation (not a `fetch`), it cannot carry an `Authorization` header
the way JSON API calls do, so the endpoint accepts the LingOn access token
either way:

```
GET /v1/auth/google/calendar
Authorization: Bearer <access_token>        (preferred — same as any other route)
```
```
GET /v1/auth/google/calendar?access_token=<access_token>   (fallback for <a href> / window.location navigation)
```

The resolved user ID is stored in a short-lived `x_calendar_user_id` cookie
(httpOnly, 10 min TTL — mirrors `x_auth_platform`) so the callback step knows
which `users` row to update. Returns `501` if `GOOGLE_CALENDAR_CALLBACK_URL`
(or `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`) is not configured.

### Callback — `GET /v1/auth/google/calendar/callback`

```
GET /v1/auth/google/calendar/callback?code=<auth-code>&state=<csrf-token>
```

```
GoogleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req, reply)
  → { access_token, refresh_token, expires_at }
  → googleTokenRepo.saveTokens(userId, access_token, refresh_token, expires_at)
      → AES-256-GCM encrypt both tokens (src/db/encrypt.ts) before UPDATE users
  → 302 redirect (no secrets in the URL — just a status flag)
```

### Response

`302 Found` — redirects to platform-specific client URL:

```
<WEB_CALLBACK_URL>#calendar=connected      (web)
<ANDROID_CALLBACK_URL>#calendar=connected  (android)
```

### Error responses

| Status | `error.code` | Condition |
|---|---|---|
| 400 | `BAD_REQUEST` | `x_calendar_user_id` cookie missing/expired, or state mismatch / expired code |
| 401 | `UNAUTHORIZED` | Missing/invalid access token at initiation, or user denied consent (`?error=`) |
| 500 | `INTERNAL` | Callback URL not configured, or `access_token` absent from Google's token response |
| 501 | `NOT_IMPLEMENTED` | Calendar OAuth env vars not configured |

---

## `GET /v1/auth/me`

Returns the authenticated user's profile. `provider_id` is never returned.

### Request

```
GET /v1/auth/me
Authorization: Bearer <access_token>
```

### Success response — `200`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "provider": "google",
    "email": "user@example.com",
    "nickname": "Display Name",
    "profile_image": "https://lh3.googleusercontent.com/...",
    "city": null,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  "error": null
}
```

### Error responses

| Status | `error.code` | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing or invalid `Authorization: Bearer` token |
| 404 | `USER_NOT_FOUND` | Authenticated user no longer exists in DB |

---

## `POST /v1/auth/refresh`

Exchanges a refresh token for a new access + refresh token pair.
Implements **rotation**: the supplied refresh token is revoked and a new one
is issued (`tokenVersion + 1`). The new token is stored in DB before the old
is revoked so there is no window where neither is valid.

### Request

```jsonc
POST /v1/auth/refresh
Content-Type: application/json

{ "refresh_token": "<jwt>" }
```

### Success response — `200`

```json
{
  "success": true,
  "data": {
    "access_token": "<new_access_jwt>",
    "refresh_token": "<new_refresh_jwt>"
  },
  "error": null
}
```

### Error responses

| Status | `error.code` | Condition |
|---|---|---|
| 400 | `BAD_REQUEST` | `refresh_token` absent or not a string |
| 401 | `UNAUTHORIZED` | JWT invalid / expired / wrong type, token revoked in DB, or `tokenVersion` mismatch |
| 500 | `INTERNAL` | Failed to persist rotated token |

### Internal flow

```
POST /v1/auth/refresh
  → verifyRefreshToken(rawToken)           // signature + type check
  → hashRefreshToken(rawToken)             // SHA-256
  → refreshTokenRepo.findActiveByHash(hash)  // revoked_at IS NULL AND expires_at > NOW()
  → check stored.token_version === claims.tokenVersion
  → issueAccessToken(userId, provider, email, newVersion)   // newVersion = old + 1
  → issueRefreshToken(userId, provider, email, newVersion)
  → refreshTokenRepo.create(userId, SHA-256(newToken), newVersion, expiresAt)
  → refreshTokenRepo.revokeByHash(oldHash)
  → return new token pair
```

---

## `POST /v1/auth/logout`

Revokes a refresh token. Returns success even if the token is already expired —
the client should discard both tokens regardless.

### Request

```jsonc
POST /v1/auth/logout
Content-Type: application/json

{ "refresh_token": "<jwt>" }
```

### Success response — `200`

```json
{
  "success": true,
  "data": { "message": "Logged out" },
  "error": null
}
```

### Error responses

| Status | `error.code` | Condition |
|---|---|---|
| 400 | `BAD_REQUEST` | `refresh_token` absent or not a string |

Invalid/expired tokens return `200` (not `401`) — they cannot be used and
revoking them is idempotent.

---

## JWT payload

All tokens share this payload shape:

```jsonc
{
  "sub": "<user.id>",
  "provider": "google",
  "email": "user@example.com",
  "tokenVersion": 1,        // incremented on each refresh rotation
  "type": "access" | "refresh",
  "exp": <unix timestamp>
}
```

Signed with HMAC-SHA256 using `JWT_SECRET`.

| Token | TTL | Use |
|---|---|---|
| `access_token` | 1 hour | `Authorization: Bearer <token>` on subsequent requests |
| `refresh_token` | 30 days | Send to `POST /v1/auth/refresh`; stored client-side only |

`verifyAccessToken` returns `AccessTokenClaims { userId, provider, email, tokenVersion }`.

---

## Google → DB field mapping

| Google payload | DB column (`users`) | Exposed in responses |
|---|---|---|
| `sub` | `provider_id` | **never** |
| `email` | `email` | yes |
| `name` | `nickname` | yes |
| `picture` | `profile_image` | yes |

---

## Security invariants

- Raw `id_token` and authorization codes are **never logged** — only `sub` after verification.
- `provider_id` is **never** returned in any HTTP response.
- Refresh tokens are stored as SHA-256 hashes only — plain-text tokens are never persisted.
- `JWT_SECRET` is separate from `MASTER_ENCRYPTION_KEY` (AES-256-GCM for BYOK keys).
- `upsertByProvider` is atomic (`INSERT ... ON CONFLICT`) — no race condition under concurrent logins.
- Callback destination URLs come exclusively from server-side env vars (`WEB_CALLBACK_URL`, `ANDROID_CALLBACK_URL`) — no user-supplied redirect URLs are accepted.
- Tokens are delivered via URL fragment (`#`) not query string (`?`) to avoid server/proxy log exposure.
- The Calendar consent flow (Flow 3) never shares scope, consent state, or a
  Google OAuth2 namespace with login — `calendar.readonly` is requested on a
  fully separate client registration.
- Google Calendar access/refresh tokens are AES-256-GCM encrypted at rest
  (`src/db/encrypt.ts`, same scheme as `user_api_keys`) and are never returned
  in any HTTP response — `GET`/`PATCH /v1/users/me` explicitly whitelist
  response fields for this reason (see [database/users.md](../database/users.md)).
