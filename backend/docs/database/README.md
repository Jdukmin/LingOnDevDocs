# Database — implementation status

> No migration files or `.sql` schema definitions exist in this repository —
> every table below is inferred from the columns referenced in
> `src/db/*.ts`. This is an **implementation status** snapshot, not a
> schema authority. If `./docs` (LetMeKnow-Docs) defines a canonical schema
> that differs from what's below, **do not edit either side** — flag it per
> the Documentation Rule in [../../CLAUDE.md](../../CLAUDE.md) ("LetMeKnow-Docs
> Repository 수정 필요").

All access goes through the single `pool` singleton in
[src/db/pool.ts](../../../src/db/pool.ts) (`pg.Pool`, max 10 connections,
30s idle timeout, 5s connection timeout). No ORM is in use — every query is
hand-written SQL via `pool.query(...)`.

## Tables

| Table | Repository | Defined in CLAUDE.md | Doc |
|---|---|---|---|
| `request_logs` | none (written directly by `AppLogger.saveRequestLog`) | yes | [request_logs.md](request_logs.md) |
| `raw_logs` | none (written directly by `AppLogger.saveRawLog`) | yes | [raw_logs.md](raw_logs.md) |
| `users` | [userRepository.ts](../../../src/db/userRepository.ts) | yes | [users.md](users.md) |
| `refresh_tokens` | [refreshTokenRepository.ts](../../../src/db/refreshTokenRepository.ts) | yes | [refresh_tokens.md](refresh_tokens.md) |
| `user_api_keys` | [apiKeyRepository.ts](../../../src/db/apiKeyRepository.ts) | no — inferred from code | [user_api_keys.md](user_api_keys.md) |
| `ai_settings` | [settingsRepository.ts](../../../src/db/settingsRepository.ts) | no — inferred from code | [ai_settings.md](ai_settings.md) |
| `ui_settings` | [settingsRepository.ts](../../../src/db/settingsRepository.ts) | no — inferred from code | [ui_settings.md](ui_settings.md) |

## Not yet implemented

- `usage_logs` — planned for LLM token/cost tracking, referenced only in TODO
  comments (`Logger.ts`, `RequestLog.ts`). No repository, table, or route
  exists yet.
