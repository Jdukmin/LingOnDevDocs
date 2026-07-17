# `/v1/auth/*` — Google OAuth2 authentication

Source: [src/route/LingOnAuth.ts](../../../src/route/LingOnAuth.ts)  
Gateway: [src/gateway/GoogleAuthAPI.ts](../../../src/gateway/GoogleAuthAPI.ts)  
Repository: [src/db/userRepository.ts](../../../src/db/userRepository.ts)  
JWT utils: [src/core/utils/Jwt.ts](../../../src/core/utils/Jwt.ts)

Two independent flows share this route group. Both produce the same JWT pair
(`access_token`, `refresh_token`) differing only in _how_ the Google credential
arrives at the backend.

---

## Routes

| Method | Path | Auth | Flow |
|---|---|---|---|
| POST | `/v1/auth/google` | None | ID Token (Flutter native Android/iOS) |
| GET | `/v1/auth/google` | None | Redirect initiation (web / Flutter Web) |
| GET | `/v1/auth/google/callback` | None | Redirect callback (web / Flutter Web) |

All routes are public — no `Authorization` header is required or read.

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

| Field | Type | Required |
|---|---|---|
| `id_token` | string | yes |

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

### Error responses

| Status | `error.code` | Condition |
|---|---|---|
| 400 | `BAD_REQUEST` | `id_token` absent, empty, or not a string |
| 401 | `UNAUTHORIZED` | Token fails Google signature / audience / expiry check |
| 500 | `INTERNAL` | `GOOGLE_CLIENT_ID` and `GOOGLE_ANDROID_CLIENT_ID` both unset |

### Internal flow

```
POST /v1/auth/google
  → GoogleAuthAPI.execute({route: 'auth.verify', payload: {idToken}})
      → oauth2Client.verifyIdToken({idToken, audience: [CLIENT_ID, ANDROID_CLIENT_ID]})
      → returns GoogleUserInfo {sub, email, name, picture}
  → userRepo.upsertByProvider('google', sub, {email, nickname: name, profile_image: picture})
      → INSERT ... ON CONFLICT (provider, provider_id) DO UPDATE SET nickname, profile_image, updated_at
  → issueAccessToken(user.id, user.provider, user.email)   // 1-hour JWT
  → issueRefreshToken(user.id, user.provider, user.email)  // 30-day JWT
  → ICD v0.0 envelope
```

---

## Flow 2a — Redirect initiation (`GET /v1/auth/google`)

Redirects the browser to the Google consent screen. Requires the redirect flow
env vars. Returns `501` if `LingOnOAuth/GoogleOAuth` plugin is not registered.

### Request

```
GET /v1/auth/google
```

No body, no params. State cookie set by `@fastify/oauth2` for CSRF protection.

### Response

`302 Found` — redirects to Google consent URL.

### Error responses

| Status | `error.code` | Condition |
|---|---|---|
| 501 | `NOT_IMPLEMENTED` | Redirect flow env vars not configured |

---

## Flow 2b — Authorization Code callback (`GET /v1/auth/google/callback`)

Google redirects here after user grants consent. `@fastify/oauth2` validates
the state cookie, exchanges the code for tokens, and the backend verifies the
`id_token` in the response.

### Request

```
GET /v1/auth/google/callback?code=<auth-code>&state=<csrf-token>
```

### Response

`302 Found` — redirects to:

```
<FRONTEND_CALLBACK_URL>?token=<access_jwt>&refresh_token=<refresh_jwt>
```

### Error responses

| Status | `error.code` | Condition |
|---|---|---|
| 400 | `BAD_REQUEST` | State mismatch, expired code, or code exchange failure |
| 401 | `UNAUTHORIZED` | User denied consent (`?error=` from Google) |
| 500 | `INTERNAL` | `FRONTEND_CALLBACK_URL` not configured, or `id_token` absent from token response |
| 501 | `NOT_IMPLEMENTED` | Redirect flow env vars not configured |

---

## JWT payload

Both access and refresh tokens include:

```jsonc
{
  "sub": "<user.id>",
  "provider": "google",
  "email": "user@example.com",
  "type": "access" | "refresh",
  "exp": <unix timestamp>
}
```

Signed with HMAC-SHA256 using `JWT_SECRET`. `verifyAccessToken` returns
`{ userId, provider, email }` from the payload.

| Token | TTL | Use |
|---|---|---|
| `access_token` | 1 hour | `Authorization: Bearer <token>` on subsequent requests |
| `refresh_token` | 30 days | stored client-side; no server-side refresh endpoint yet |

---

## Google → DB field mapping

| Google payload | DB column (`users`) | Response field |
|---|---|---|
| `sub` | `provider_id` | — (not exposed) |
| `email` | `email` | `email` |
| `name` | `nickname` | `nickname` |
| `picture` | `profile_image` | `profile_image` |

---

## Security invariants

- Raw `id_token` and authorization codes are **never logged** — only `sub` after verification.
- All user profile data comes exclusively from the verified Google payload.
- `JWT_SECRET` is separate from `MASTER_ENCRYPTION_KEY` (AES-256-GCM for BYOK keys).
- `upsertByProvider` is atomic (`INSERT ... ON CONFLICT`) — no race condition under concurrent logins.
