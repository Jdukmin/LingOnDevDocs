# `ConfigHandler` (`LingOnConfig/ConfigHandler.ts`)

Source: [src/plugins/LingOnConfig/ConfigHandler.ts](../../../src/plugins/LingOnConfig/ConfigHandler.ts)

**Status: scaffold only.** The plugin registers (so autoload doesn't fail)
but its `app.decorate('config', ...)` call is commented out. Today, provider
configuration (API keys, base URLs) is sourced entirely from `.env` via
`@fastify/env` (`app.config.*`, populated before this plugin ever runs).

Intent (per the in-source TODO): expose a `fastify.config` decoration keyed
by provider name, sourced from a database or secrets manager, once a provider
key admin API exists. See [FeatureList.md](../FeatureList.md) → "In progress".
