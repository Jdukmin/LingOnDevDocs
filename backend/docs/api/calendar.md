# `/v1/calendar/*` — Google Calendar data

Source: [src/route/LingOnCalendar.ts](../../../src/route/LingOnCalendar.ts)

Gateway: [src/gateway/GoogleCalendarAPI.ts](../../../src/gateway/GoogleCalendarAPI.ts)  
Token service: [src/gateway/GoogleTokenService.ts](../../../src/gateway/GoogleTokenService.ts)  
Repository: [src/db/googleTokenRepository.ts](../../../src/db/googleTokenRepository.ts)

For connecting a user's Google Calendar (the OAuth consent flow that
populates the tokens this endpoint reads), see
[api/auth.md — Flow 3](auth.md#flow-3--calendar-consent-get-v1authgooglecalendar-callback).

---

## Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/calendar/events` | Required | Upcoming events (today onward) from the user's primary calendar |

---

## `GET /v1/calendar/events`

### Request

```
GET /v1/calendar/events
Authorization: Bearer <access_token>
```

### Success response — `200`

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "abc123",
        "summary": "Team sync",
        "description": null,
        "location": null,
        "start": "2026-07-20T09:00:00+09:00",
        "end": "2026-07-20T09:30:00+09:00",
        "allDay": false,
        "htmlLink": "https://www.google.com/calendar/event?eid=..."
      }
    ]
  },
  "error": null
}
```

`start`/`end` are `dateTime` (timed events) or `date` (all-day events, in
which case `allDay: true`) as returned by the Google Calendar API — no
timezone conversion is applied.

### Error responses

| Status | `error.code` | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing or invalid `Authorization: Bearer` LingOn access token |
| 403 | `CALENDAR_NOT_CONNECTED` | User has not completed `GET /v1/auth/google/calendar` |
| 502 | `CALENDAR_TOKEN_REFRESH_FAILED` | Stored Google refresh token was rejected (e.g. user revoked access in their Google Account) |
| 502 | `PROVIDER_HTTP_ERROR` | Google Calendar API call failed |

### Internal flow

```
GET /v1/calendar/events
  → DefaultPolicy.before() → req.ctx.userId (LingOn JWT)
  → GoogleCalendarAPI.execute({route: 'calendar.events.list', payload: {userId}})
      → GoogleTokenService.getValidAccessToken(userId)
          → googleTokenRepo.getTokens(userId)             // decrypts access/refresh token
          → if access token expired (or within 60s of expiry):
              oauth2Client.refreshAccessToken()             // google-auth-library
              → googleTokenRepo.saveTokens(userId, newAccessToken, newRefreshToken?, newExpiry)
      → googleapis calendar.events.list({calendarId: 'primary', timeMin: now, singleEvents: true, orderBy: 'startTime'})
  → normalize to {id, summary, description, location, start, end, allDay, htmlLink}[]
  → ICD v0.0 envelope
```

---

## Security invariants

- Google access/refresh tokens are never included in this endpoint's request,
  response, or logs — only the normalized event list is returned.
- `GoogleTokenService` resolves a token immediately before the Calendar API
  call and does not retain it beyond that call.
- A refreshed access token (and, if re-issued, refresh token) is persisted
  encrypted before being used — a failed persist surfaces as a 5xx rather than
  silently using an unsaved token.
