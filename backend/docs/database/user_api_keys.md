# `user_api_keys` (inferred — no migration file)

Repository: [src/db/apiKeyRepository.ts](../../../src/db/apiKeyRepository.ts).
Stores user-supplied ("BYOK") API keys for LLM providers, encrypted at rest.

## Columns

| Column | Type (inferred) | Notes |
|---|---|---|
| `user_id` | text | part of composite key/unique constraint with `provider` |
| `provider` | text | one of `openai`, `anthropic`, `gemini`, `openrouter` (enforced at the route layer, not the DB) |
| `encrypted_key` | text | AES-256-GCM ciphertext, base64 — see [src/db/encrypt.ts](../../../src/db/encrypt.ts) |
| `updated_at` | timestamp | set to `NOW()` on insert/update |

`ON CONFLICT (user_id, provider) DO UPDATE` in `saveApiKey` implies a unique
constraint on `(user_id, provider)`.

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
