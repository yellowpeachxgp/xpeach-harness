---
kind: upgrade-guide
description: "An explicit empty PI models list disables the route instead of inheriting installed models."
---

# Explicit empty model catalogs

English | [中文](guide.zh.md)

## Change

In `llm-pi-ai` provider configuration, omitting `models` inherits the installed catalog. Explicit `models: []` now disables that route's catalog and model lookup returns `UNKNOWN_MODEL`; it no longer restores installed models. Other route configuration remains validated. Nonempty `modelOverrides` cannot accompany an explicit models list, including an empty one.

XPeach synchronization uses explicit empty lists to retire account models without exposing older profile definitions. Invalid catalog responses preserve the previous configuration instead of being interpreted as an empty list.

## Migration

1. Inspect custom `llm-pi-ai.providers` entries in `cordis.patch.yml` and saved settings. If an empty `models` list was intended to use the installed catalog, remove the `models` key.
2. Keep `models: []` when disabling a route. Remove any `modelOverrides` from that entry.
3. Restart and inspect the model picker. Omitted catalogs should expose installed models; explicitly empty catalogs should expose none. Select another available model before sending further requests to a disabled route.
