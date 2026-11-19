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

- `xpeach.relay.json` is the authoritative, owner-only (`0600`) relay key/token snapshot. Its `version: 1` format commits a monotonically increasing revision and the complete pair together; unknown versions or invalid data are rejected. Existing `xpeach.key` and `xpeach.token` become compatibility projections once the authority exists, including when its key is empty after revocation. Old environment values, slots, references, and mirror files cannot restore that empty state; explicit binding or slot selection must submit a new revision.
- Profiles that share credentials outside the system temporary directory use the same `~/.xph/xpeach.relay.json` and writer lock, even across different Harness homes. Temporary shared profiles use `<temporary home>/xpeach.relay.json`. A custom `keyFile` outside the `profiles/<name>/` layout has no sibling mirroring and uses its containing directory. `relayStateFile` may override this last isolated case with an absolute path in the same directory; a different authority for a mirrored profile is rejected. Initial migration adopts only a same-directory, key-bound token record; old versions must not write the same group concurrently.
- A write re-reads and compares the captured revision under the cross-process lock. It publishes the complete pair with `projectionPending: true`, writes compatibility projections, then clears that flag at the same revision. Partial projection is a visible `credential-write-incomplete` failure and readers refuse it. Startup awaits repair from the authority before service activation; repair never promotes a legacy projection back into the authority. SSO, admin tokens, cookies, and slot lists remain separate stores.
- Token identity resolution scans bounded pages for an exact key before revealing bounded candidate keys. Names and creation times only order candidates. Unavailable or mismatching reveal results reject group writes. Access-token and console-fallback mint share complete identity scans and exact-key or reveal verification before reusing an existing token, preserving its groups. An active key with unresolved ownership blocks creation; an empty page conflicting with the reported total is incomplete. Without an active key, both create a uniquely named token and require a complete scan to find exactly one matching row absent from the pre-create list, then verify its key before binding. Only the access-token path assigns default groups to its new token; the console path retains the groups returned by the site. A name prefix never establishes ownership of an existing token. A failed bind after creation reports that a remote token may already exist and requires checking the site list. Unbound historical groups never expand the catalog. Unknown identity or an exhausted budget preserves the published catalog and reports an incomplete result. A confirmed empty relay catalog, or an empty result after family filtering, publishes explicit empty model lists for account-owned providers so unsetting cannot restore inherited profile models; custom providers and existing Session selections remain intact. Non-JSON responses, missing model arrays, and invalid entry fields fail without changing the published catalog.
- Catalog sync mounts models under each advertised endpoint: `xpeach`, `xpeach-openai-responses`, and `xpeach-anthropic`. It checks the credential revision from before identity resolution through publication, waits for `credentials.set(keyVar)`, verifies the resolved reference, and publishes settings while holding the same relay lock. A request guard rejects a mismatching reference. Product compositions must additionally make the model provider depend on `xpeachAccount`, so failed account activation cannot leave that provider available without its guard.
- Adding a key slot validates the candidate through an independent request without switching the active key, environment, or credentials reference, and without suppressing authentication failures for the active account. HTTP 200 alone is insufficient: usage must be valid JSON with a string name, finite quota and expiry numbers, and boolean quota/model-limit flags. Malformed responses, validation failure, or cancellation leave the authority, projections, environment, credentials reference, and slots unchanged. Success still commits with the starting revision through CAS, rejecting concurrent changes. If credentials-reference publication fails after commit, the committed key has already been validated; the operation fails and the request guard refuses mismatching references until restart or a successful sync finishes publication.
- Passive refresh and ordinary `syncModels` never change an existing Session selection or activate cold Sessions. The default for new Sessions may follow the catalog. Only explicit `setGroups` can coordinate selections of the three account-owned providers; `deepseek-account` and custom providers are excluded. A missing model in an existing selection fails with normal `UNKNOWN_MODEL` handling.
- Sync failures expose `code`: `identity-unknown`, `identity-budget-exhausted`, `credential-changed`, or `credential-write-incomplete`, with an actionable message. `siteCatalog` reports unresolved identity through `xpeach/identity-incomplete`. Unbind commits an empty authority, removes legacy credentials, clears runtime variables, and revokes the credentials reference; it never deletes the authority to simulate an earlier installation.

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
| `tokenPageLimit` | `10` | Maximum pages for identity resolution and user token-row lookup; positive integer |
| `tokenPageSize` | `100` | Requested admin page size; positive integer; the user endpoint controls its own page size |
| `tokenRevealLimit` | `16` | Maximum token candidates revealed per identity resolution; positive integer |
| `relayStateFile` | derived shared path | Authority override for non-mirrored custom key files only |
| `credentialLockWaitMs` | `5000` | Maximum writer-lock acquisition wait in milliseconds; positive integer |
| `watchModels` | `['swe-2-max']` | Model identifiers cross-checked by `modelMatch` |

`macosInstallerAction` resolves the canonical CLI resource from the application entry and validates the existing profile patch before installation side effects. Empty patches are seeded, valid custom patches are preserved, and invalid patches stop installation; see the [Desktop installer](../../../apps/desktop/README.md).

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Admin management endpoints (`/api/user/self`, `/api/token/`, `/api/pricing`) require a bound site access token (`xpeach.admin`); when only a relay `sk-*` key is bound, admin queries return unauthenticated status while relay usage and logs remain available. Catalog publication additionally requires confirmed local token identity or a working management channel for identity discovery.

<a id="dev-note"></a>
### Dev Note

Credential files (`xpeach.key`, `xpeach.admin`, `xpeach.session`) are written with mode `0600` under the active profile directory and never enter Session logs or model requests.
