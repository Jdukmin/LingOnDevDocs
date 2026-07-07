# `Repositories` (`LingOnDataManage/Repositories.ts`)

Source: [src/plugins/LingOnDataManage/Repositories.ts](../../../src/plugins/LingOnDataManage/Repositories.ts)

Decorates `app.repos` (typed in
[FastifyDefinition.ts](../../../src/config/FastifyDefinition.ts)) with
repository accessors that route handlers and gateways use instead of coupling
directly to a storage implementation.

## Current implementation

`repos.providerKeys.getActiveKey(provider)` — an **in-memory `Map`**, not a
database table. Seeded once at startup from `OPENAI_API_KEY` (env), encrypted
with `cryptoUtil.encrypt` ([Crypto.ts](../../../src/core/utils/Crypto.ts) —
Base64 "scaffolding," not real encryption; see the security note in
[database/user_api_keys.md](../database/user_api_keys.md) for how this
differs from the real AES-256-GCM path used for user-supplied keys).

This satisfies `BaseGateway`'s `GatewayKeyRepo` interface, but no concrete
gateway is currently constructed with `keyRepo`/`crypto` deps — `OpenWeatherAPI`
uses plain env injection instead (see
[services/openweather.md](../services/openweather.md)).

## Production note

Per the in-source comment: replace the `Map` with a database query, Redis
lookup, or KMS call. Extend this plugin (not a new one) when adding
additional repositories as the project grows.
