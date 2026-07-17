# `GoogleOAuth` (`LingOnOAuth/GoogleOAuth.ts`)

Source: [src/plugins/LingOnOAuth/GoogleOAuth.ts](../../../src/plugins/LingOnOAuth/GoogleOAuth.ts)

Conditionally registers `@fastify/oauth2` for the Authorization Code redirect
flow. Decorates `app.googleOAuth2` (typed as `OAuth2Namespace?` in
[FastifyDefinition.ts](../../../src/config/FastifyDefinition.ts)) when active.

## Activation condition

The plugin registers `@fastify/oauth2` only when **all three** of the following
env vars are non-empty:

| Env var | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth2 client ID (must also be a valid web client in Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | OAuth2 client secret |
| `GOOGLE_CALLBACK_URL` | Backend callback URL, e.g. `https://api.example.com/v1/auth/google/callback` |

If any is absent, the plugin logs a warning and returns early. In that case
`app.googleOAuth2` is `undefined` and the redirect routes (`GET /v1/auth/google`,
`GET /v1/auth/google/callback`) return `501 NOT_IMPLEMENTED`.

The ID Token flow (`POST /v1/auth/google`) is **unaffected** — it does not use
this plugin.

## Decoration

When active, `app.googleOAuth2` (an `OAuth2Namespace`) exposes:

| Method | Called by |
|---|---|
| `generateAuthorizationUri(req, reply)` | `GET /v1/auth/google` — builds consent URL, sets state cookie |
| `getAccessTokenFromAuthorizationCodeFlow(req, reply)` | `GET /v1/auth/google/callback` — validates state, exchanges code for tokens |

## Load order requirement

`@fastify/cookie` **must** be registered before this plugin — `@fastify/oauth2`
uses cookies for CSRF state management. `app.ts` registers `cookie` before the
`plugins/` autoload block (step 3 in the plugin registration order, before
step 4 where this plugin loads).

## Google endpoints used

```typescript
const GOOGLE_CONFIGURATION = {
  authorizeHost: 'https://accounts.google.com',
  authorizePath: '/o/oauth2/v2/auth',
  tokenHost: 'https://www.googleapis.com',
  tokenPath: '/oauth2/v4/token'
};
```

These are hardcoded (not imported from `@fastify/oauth2`) because the package
does not export `GOOGLE_CONFIGURATION` as a TypeScript named export.
