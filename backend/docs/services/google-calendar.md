# `GoogleCalendarAPI` + `GoogleTokenService`

Sources:
- [src/gateway/GoogleCalendarAPI.ts](../../../src/gateway/GoogleCalendarAPI.ts)
- [src/gateway/GoogleTokenService.ts](../../../src/gateway/GoogleTokenService.ts)

## Role

`GoogleCalendarAPI` — read-only Google Calendar client using the `googleapis`
SDK. Extends `BaseProvider` (not `BaseGateway`) — same reasoning as
`GoogleAuthAPI`: it delegates to an SDK, not raw `fetch`.

- `name`: `'google-calendar'`
- Depends on `GoogleTokenService` to resolve a valid access token per call —
  never reads `googleTokenRepository` directly.

`GoogleTokenService` — resolves a valid Google Calendar access token for a
user, refreshing it via the stored refresh token when expired (or within 60s
of expiring). Not a `BaseProvider`; a plain helper class injected into
`GoogleCalendarAPI`.

Both are completely independent of `GoogleAuthAPI` (login id_token
verification) — neither is invoked during login, and `GoogleAuthAPI` is never
invoked here.

## Input

`GoogleCalendarAPI.execute(input: ProviderRequest)` where `input.route` is:

| Route | Handler | Description |
|---|---|---|
| `calendar.events.list` | `listUpcomingEvents` | Lists events from `primary` calendar, today onward |

Unknown routes throw `AppError('OP_NOT_SUPPORTED', 400)`.

`payload` for `calendar.events.list`: `{ userId: string }`.

## Output

`CalendarEvent[]`:

| Field | Source (Google Calendar API `event`) |
|---|---|
| `id` | `event.id` |
| `summary` | `event.summary` |
| `description` | `event.description` |
| `location` | `event.location` |
| `start` | `event.start.dateTime ?? event.start.date` |
| `end` | `event.end.dateTime ?? event.end.date` |
| `allDay` | `true` when `event.start.date` is set and `event.start.dateTime` is not |
| `htmlLink` | `event.htmlLink` |

## `GoogleTokenService.getValidAccessToken(userId)`

```
googleTokenRepo.getTokens(userId)          // decrypts stored access/refresh token
  → null                                    → throw AppError('CALENDAR_NOT_CONNECTED', 403)
  → access token expires > 60s from now     → return stored access token as-is
  → otherwise:
      oauth2Client.setCredentials({ refresh_token })
      oauth2Client.refreshAccessToken()      // google-auth-library
        → failure                            → throw AppError('CALENDAR_TOKEN_REFRESH_FAILED', 502)
        → success                            → googleTokenRepo.saveTokens(userId, newAccessToken, newRefreshToken?, newExpiry)
                                              → return newAccessToken
```

Google does not always re-issue a `refresh_token` on refresh; `saveTokens` is
called with `refreshToken: undefined` in that case, which leaves the existing
stored refresh token untouched (see
[db/googleTokenRepository.ts](../../../src/db/googleTokenRepository.ts)).

## Security

- Access/refresh tokens are decrypted only in-process, immediately before use,
  and are never logged (`this.logger.debug`/`.info` calls log `userId` and
  counts only — never token values).
- A refreshed token is persisted (encrypted) **before** being returned to the
  caller — if the DB write fails, the request fails rather than using an
  unpersisted token that the next call would try to refresh again from a
  stale refresh token.

## Error logging

Both classes call Google/Gaxios SDK methods (`oauth2Client.refreshAccessToken()`
in `GoogleTokenService`; `calendar.events.list()` in `GoogleCalendarAPI`) that
throw a `GaxiosError` on failure. **Never log a caught error from these calls
whole** (e.g. `this.logger.error({ err })` on the raw error) — always project
it first.

**The vulnerability that was fixed**: both call sites used to log the caught
error object whole. Gaxios attaches the outbound request `config` (URL, body,
headers) to a `GaxiosError` as an **own enumerable** property, and
pino-std-serializers' default `err` serializer copies every own enumerable
key it finds. The result: logs received `err.config.data` containing the
Google OAuth `client_secret` and `refresh_token`, and
`err.config.headers.authorization` containing a live Bearer access token —
written into `data/log/*.log` and `raw_logs`.

Pino's `redact.paths` config
(`'*.headers.authorization'`, `Logger.ts:276`) did **not** catch this: pino's
`*` wildcard matches exactly **one** path segment, so it redacts
`X.headers.authorization` but not `err.config.headers.authorization`, which
is one level deeper. `redact.paths` is a backstop for shallow, known shapes
(e.g. `req.headers.authorization`) — it is not a backstop for nested error
payloads like a Gaxios error's attached request config.

**The fix**: both call sites now log
[`projectErrorForLog(err)`](../../../src/core/utils/Logger.ts) instead of the
raw error, imported from `../core/utils/Logger.js`
(`GoogleTokenService.ts:5`, `GoogleCalendarAPI.ts:5`):

- `GoogleTokenService.ts:68` —
  ``this.logger.error({ err: projectErrorForLog(err), userId }, '[CALENDAR] google token refresh failed')``
- `GoogleCalendarAPI.ts:82` —
  ``this.logger.error({ err: projectErrorForLog(err), userId }, '[CALENDAR] google-calendar: events.list failed')``

`projectErrorForLog` is an allowlist, not a denylist — it returns only
`{ name, message?, code?, status? }` (a non-`Error` input returns just
`{ name: 'UnknownError' }`), which is enough to diagnose a 401 vs. a 403 vs.
a network failure without ever forwarding the error's attached request/response
data.

**Standing rule for anyone adding code to these classes**: never log a
caught Google SDK / Gaxios error object whole. Always project it through
`projectErrorForLog` first. See also the SSOT logging policy:
[logging_policy.md](../../../docs/policies/logging_policy.md).

## Call relationships

```mermaid
flowchart LR
    Route["LingOnCalendar (route handler)"] -->|"execute({route:'calendar.events.list', payload:{userId}})"| Cal["GoogleCalendarAPI"]
    Cal -->|"getValidAccessToken(userId)"| Tok["GoogleTokenService"]
    Tok -->|"getTokens/saveTokens"| Repo[("db/googleTokenRepository")]
    Tok -->|"refreshAccessToken()"| GLib["google-auth-library"]
    Cal -->|"calendar.events.list({calendarId:'primary', timeMin:now, ...})"| GAPI["googleapis (Calendar v3)"]
    GAPI -->|"events[]"| Cal
    Cal -->|"CalendarEvent[]"| Route
```

## Dependencies

- `BaseProvider` — abstract base (`readonly name`, `execute` interface)
- `googleapis` (`google.calendar('v3')`) — Calendar API client
- `google-auth-library` (`OAuth2Client`) — used by `GoogleTokenService` for token refresh, and to attach the resolved access token via `setCredentials` before each Calendar call
- `AppError` — thrown on unsupported routes, missing connection, and refresh/API failures
- `googleTokenRepository` — read/write access to encrypted tokens (via `GoogleTokenService` only; `GoogleCalendarAPI` never imports it directly)

## Instantiation

One instance of each is created per registration of the `LingOnCalendar`
route plugin (`src/route/LingOnCalendar.ts`'s plugin entry point):

```typescript
const tokenService = new GoogleTokenService(
  app.config.GOOGLE_CLIENT_ID,
  app.config.GOOGLE_CLIENT_SECRET,
  app.log
);
const gateway = new GoogleCalendarAPI(tokenService, app.log);
```
