# `user_api_keys`

> **DevDocs Update Required (2026-09-14, TASK-007)** — this title previously
> read "(inferred — no migration file)". That is no longer true:
> `lingon/migrations/000_baseline_schema.sql` defines this table explicitly
> (final shape after migration `005`), so the columns below are verified
> against it rather than purely inferred from `src/db/*.ts`. That baseline
> migration is **currently uncommitted** in the lingon working tree.
>
> **Unresolved conflict, recorded not resolved**: `lingon/CLAUDE.md:325-333`
> (in the **backend** repository) documents a different shape for this table:
>
> | Column | `lingon/CLAUDE.md:325-333` | This SSOT + `000_baseline_schema.sql` |
> |---|---|---|
> | `id` | `bigserial PK` | **absent** — no `id` column |
> | `user_id` | `FK → users.id` | `text NOT NULL`, **no foreign key** |
> | `provider` | `varchar` | `text NOT NULL` |
> | primary key | `id` | **`(user_id, provider)`** composite |
> | `updated_at` | `timestamptz DEFAULT NOW()` | `timestamp NOT NULL DEFAULT NOW()` |
>
> The composite key is what `apiKeyRepository.ts` actually requires: it never
> selects or orders by an `id`, and `saveApiKey`'s
> `ON CONFLICT (user_id, provider)` needs exactly that unique key.
> `000_baseline_schema.sql` follows this SSOT, not `lingon/CLAUDE.md`.
> Per `Route.md` §1 (`docs/ SSOT > … > implementation`) the SSOT wins;
> `lingon/CLAUDE.md` is the stale side and must be corrected in a
> backend-repository pass — **this docs-only repository cannot edit it**
> (`docs/CLAUDE.md`: "Never modify source code from this repository").

Repository: [src/db/apiKeyRepository.ts](../../../src/db/apiKeyRepository.ts).
Stores user-supplied ("BYOK") API keys for LLM providers, encrypted at rest.

## Columns

| Column | Type | Notes |
|---|---|---|
| `user_id` | text NOT NULL | part of the composite primary key with `provider` |
| `provider` | text NOT NULL | one of `openai`, `anthropic`, `gemini`, `openrouter` (enforced at the route layer, not the DB) |
| `encrypted_key` | text NOT NULL | AES-256-GCM ciphertext, base64 — see [src/db/encrypt.ts](../../../src/db/encrypt.ts). No separate `iv` column: the IV is packed into this value |
| `updated_at` | timestamp NOT NULL DEFAULT NOW() | set to `NOW()` on insert/update. Note this is `timestamp` (no time zone) while `users`/`refresh_tokens`/`request_logs`/`raw_logs` use `timestamptz` — a known docs-internal inconsistency, see [README.md](README.md) |

## Constraints

- `PRIMARY KEY (user_id, provider)` — this also satisfies the unique constraint
  that `ON CONFLICT (user_id, provider) DO UPDATE` in `saveApiKey` requires.
- No foreign key to `users.id`. `user_id` is `text`, deliberately kept
  compatible with either a `uuid` or a `bigserial` `users.id` — the same
  rationale `migrations/002` gives for `refresh_tokens.user_id`.

## Encryption

`encrypt()`/`decrypt()` in `src/db/encrypt.ts` use AES-256-GCM with a 64-hex-char
`MASTER_ENCRYPTION_KEY` (32 bytes). Output packs `IV (12B) | auth tag (16B) |
ciphertext` into one base64 string per row — a fresh random IV every call, so
identical plaintext keys never produce identical ciphertext.

This is a distinct mechanism from `src/core/utils/Crypto.ts` (`cryptoUtil`),
which is Base64-only "structural scaffolding" used solely for the in-memory
provider-key map in `Repositories.ts` — **do not confuse the two** when
extending either path.

## Queries

- `saveApiKey(userId, provider, plainKey)` — encrypts, then upserts.
- `deleteApiKey(userId, provider)` — returns whether a row was deleted.
- `hasApiKey(userId, provider)` — existence check only, never decrypts.
- `useApiKey(userId, provider)` — decrypts and returns plaintext. **Internal
  use only**: the return value must never appear in an HTTP response or any
  log. Throws `AppError('API_KEY_NOT_FOUND', 404)` if unset.

## Consumers

[LingOnApiKey.ts](../../../src/route/LingOnApiKey.ts) — `GET /v1/apikey/status`,
`PUT`/`DELETE /v1/apikey/:provider`.
