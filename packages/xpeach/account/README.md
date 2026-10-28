---
description: "XPeach (New API) account Remote: PAT login, token usage/logs, group catalogue, price sync table, admin surfaces."
kind: "package-reference"
---

# @xpeach/xph-account

English | [中文](README.zh.md)

## Summary

Host plugin exposing the XPeach site's New API surface to Harness clients over the generated `xpeach` Remote namespace. It binds relay keys and site access tokens, persists pricing snapshots, and computes per-model billing rates across groups.

## Table of Contents

- [Credential topology](#credential-topology)
- [Key file, credentials record, and unbind semantics](#key-file-credentials-record-and-unbind-semantics)
- [Price sync table](#price-sync-table)
- [Billing math](#billing-math)
- [Configuration](#configuration)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

<a id="credential-topology"></a>
## Credential topology

| Endpoint | `sk-*` relay key (`Bearer`) | Admin token (raw `Authorization:`) | Binds to |
| --- | --- | --- | --- |
| `/v1/models`, `/v1/chat/completions` | ✅ | — | model list, chat, playground |
| `/api/usage/token/` | ✅ | — | token name / granted / used / unlimited / model_limits |
| `/api/log/token` | ✅ | — | this token's call log (model, in/out tokens, quota, `group`, `other.group_ratio`) |
| `/api/user/groups` | ✅ | — | group catalogue `{desc, models[], ratio}` — drives the two-level group picker |
| `/api/user/self`, `/api/token/`, `/api/log/?p=` | ❌ 401 | ✅ | user and admin management surfaces |
| `/api/pricing` | ❌ | ✅ | price sync table source |

<a id="key-file-credentials-record-and-unbind-semantics"></a>
## Key file, credentials record, and unbind semantics

- `xpeach.key` (`0600`) is the profile-local secret copy; on bind it is also published to the runtime credentials record under the provider's `apiKeyEnv` (`XPEACH_RELAY_KEY`) so `llm-pi-ai` resolves it.
- Unbind runs through the `unbindKey` remote, which deletes `xpeach.key`, `xpeach.admin`, `xpeach.session`, `xpeach.keys`, and `xpeach.token`, clears runtime environment variables, and revokes the runtime credential record.

<a id="price-sync-table"></a>
## Price sync table

`pricingSync(force)` merges `/api/pricing` (admin) with `/api/user/groups` (relay key) into one snapshot (`{at, entries, groupRatio, groups}`) with a 10-minute TTL persisted to `xpeach-pricing.json` beside the key file; when the site is unreachable, the stale snapshot continues serving `billingRate`, market price cells, the cost pill, and the group picker.

<a id="billing-math"></a>
## Billing math

- `billingRate(model, group?)`: `in = model_ratio × group_ratio × 2`, `out = in × completion_ratio` (USD-equivalent `$/M`). `quota_type=1` rows are fixed per-call prices.
- Group override precedence: `groupRatio` map → group catalogue `ratio` → last-log `other.group_ratio` → `1`.

<a id="configuration"></a>
## Configuration

| Field | Default | Meaning |
| --- | --- | --- |
| `baseURL` | `https://fast.xpeach.codes` | New API site root |
| `apiKeyEnv` | `XPEACH_API_KEY` | Legacy credential reference resolved once during initial migration |
| `protocolPreference` | `compatible` | Wire protocol preference (`compatible`, `native`, or `auto`, volatile) |
| `enabledFamilies` | `[]` | Model families (`groups`) retained in the synced catalog (`[]` keeps all, volatile) |
| `keyFile` | `~/.xph/profiles/xpeach/xpeach.key` | Profile-local relay key store (`0600`) |
| `keyVar` | `XPEACH_RELAY_KEY` | Credential reference and environment variable published for `llm-pi-ai` |
| `adminKeyFile` | `~/.xph/profiles/xpeach/xpeach.admin` | Profile-local site access token store (`0600`) |
| `adminKeyVar` | `XPEACH_ADMIN_KEY` | Environment variable for the site access token |
| `sessionKeyFile` | `~/.xph/profiles/xpeach/xpeach.session` | Profile-local session cookie store (`0600`) |
| `sessionKeyVar` | `XPEACH_SESSION` | Environment variable for the site session cookie |
| `timeoutMs` | `15000` | Per-request timeout in milliseconds |
| `watchModels` | `['swe-2-max']` | Model identifiers cross-checked by `modelMatch` |

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Admin management endpoints (`/api/user/self`, `/api/token/`, `/api/pricing`) require a bound site access token (`xpeach.admin`); when only a relay `sk-*` key is bound, admin queries return unauthenticated status while relay usage, logs, and group discovery continue operating.

<a id="dev-note"></a>
### Dev Note

Credential files (`xpeach.key`, `xpeach.admin`, `xpeach.session`) are written with mode `0600` under the active profile directory and never enter Session logs or model requests.
