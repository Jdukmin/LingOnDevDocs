# `GoogleOAuth` (`LingOnOAuth/GoogleOAuth.ts`)

Source: [src/plugins/LingOnOAuth/GoogleOAuth.ts](../../../src/plugins/LingOnOAuth/GoogleOAuth.ts)

Conditionally registers **two independent** `@fastify/oauth2` namespaces for
Authorization Code flows — login and Google Calendar consent — via a shared
`registerGoogleOAuth2Client()` helper so both stay in sync on credentials and
endpoint config. They never share scope, consent state, or a namespace:

| Namespace | Scope | Purpose |
|---|---|---|
| `app.googleOAuth2` | `openid email profile` | Login (Flow 2 in [api/auth.md](../api/auth.md)) |
| `app.googleCalendarOAuth2` | `calendar.readonly` | Calendar consent (Flow 3 in [api/auth.md](../api/auth.md)) |

Both are typed as `OAuth2Namespace?` in
[FastifyDefinition.ts](../../../src/config/FastifyDefinition.ts).

## Activation conditions

### Login (`app.googleOAuth2`)

Registers only when **all three** of the following env vars are non-empty:

| Env var | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth2 client ID (must also be a valid web client in Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | OAuth2 client secret |
| `GOOGLE_CALLBACK_URL` | Backend callback URL, e.g. `https://api.example.com/v1/auth/google/callback` |

If any is absent, the plugin logs a warning and skips this namespace only. In
that case `app.googleOAuth2` is `undefined` and the redirect routes
(`GET /v1/auth/google`, `GET /v1/auth/google/callback`) return `501 NOT_IMPLEMENTED`.

The ID Token flow (`POST /v1/auth/google`) is **unaffected** — it does not use
this plugin.

### Calendar (`app.googleCalendarOAuth2`)

Registers only when `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
`GOOGLE_CALENDAR_CALLBACK_URL` are all non-empty — independently of the login
condition above (a deployment can have login enabled and Calendar disabled,
or vice versa). Registered with `callbackUriParams: { access_type: 'offline',
prompt: 'consent' }` so Google always returns a `refresh_token`.

If absent, `app.googleCalendarOAuth2` is `undefined` and
`GET /v1/auth/google/calendar` (+ its callback) return `501 NOT_IMPLEMENTED`.

## Decoration

Each active namespace (`app.googleOAuth2` / `app.googleCalendarOAuth2`, both
`OAuth2Namespace`) exposes:

| Method | Called by |
|---|---|
| `generateAuthorizationUri(req, reply)` | `GET /v1/auth/google` or `GET /v1/auth/google/calendar` — builds consent URL, sets state cookie |
| `getAccessTokenFromAuthorizationCodeFlow(req, reply)` | The matching `.../callback` route — validates state, exchanges code for tokens |

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
