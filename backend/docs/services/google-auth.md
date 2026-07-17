# `GoogleAuthAPI`

Source: [src/gateway/GoogleAuthAPI.ts](../../../src/gateway/GoogleAuthAPI.ts)

## Role

Google ID Token verifier using the `google-auth-library` SDK.  
Extends `BaseProvider` (not `BaseGateway`) — it uses the SDK's `OAuth2Client`
internally rather than raw `fetch`, so `BaseGateway`'s HTTP helpers do not apply.

- `name`: `'google-auth'`
- Audiences: one or both of `GOOGLE_CLIENT_ID` (web) and
  `GOOGLE_ANDROID_CLIENT_ID` (Android) — at least one must be set (constructor
  throws `Error` if the audience array is empty).
- Multi-audience: a single token from either client ID is accepted. Both are
  passed as an array to `oauth2Client.verifyIdToken({ audience: [...] })`, so
  web and Android tokens are verified by the same instance.

## Input

`execute(input: ProviderRequest)` where `input.route` is:

| Route | Handler | Description |
|---|---|---|
| `auth.verify` | `verifyToken` | Verifies a Google `id_token`; returns `GoogleUserInfo` |

Unknown routes throw `AppError('OP_NOT_SUPPORTED', 400)`.

`payload` for `auth.verify`: `{ idToken: string }`.

## Output

`GoogleUserInfo`:

| Field | Source (Google payload) |
|---|---|
| `sub` | `payload.sub` |
| `email` | `payload.email` |
| `name` | `payload.name` |
| `picture` | `payload.picture` |

> The route layer renames `picture` → `avatar_url` before the DB upsert and
> ICD v0.0 response. `picture` never appears in any HTTP response.

## Security

- The raw `id_token` is **never logged** — only `sub` is emitted after
  successful verification.
- Token failures throw `AppError('UNAUTHORIZED', 401)` (wrapping the
  `google-auth-library` error, not forwarding its message to the client).

## Call relationships

```mermaid
flowchart LR
    Route["LingOnAuth (route handler)"] -->|"execute({route: 'auth.verify', payload: {idToken}})"| G["GoogleAuthAPI"]
    G -->|"oauth2Client.verifyIdToken({idToken, audience:[...]})"| GLib["google-auth-library"]
    GLib -->|"verifies JWT signature + audience + expiry"| G
    G -->|"GoogleUserInfo {sub, email, name, picture}"| Route
    Route -->|"findOrUpdateByProvider('google', sub, ...)"| DB[("users")]
```

## Dependencies

- `BaseProvider` — abstract base (`readonly name`, `execute` interface)
- `OAuth2Client` from `google-auth-library` — token verification SDK
- `AppError` — thrown on verification failure and unsupported routes
- No DB access — `userRepository` is called by the route handler, not this gateway

## Instantiation

One instance is created per registration of the `LingOnAuth` route plugin
(in `src/route/LingOnAuth.ts`'s plugin entry point):

```typescript
const audiences = [app.config.GOOGLE_CLIENT_ID, app.config.GOOGLE_ANDROID_CLIENT_ID]
  .filter(id => id.length > 0);
const oauth2Client = new OAuth2Client();
const googleAuth = new GoogleAuthAPI(oauth2Client, audiences, app.log);
```
