---
kind: upgrade-guide
description: "XPeach model selections require an exact provider route, and group writes require a verified token identity."
---

# XPeach model routes and token verification

English | [中文](guide.zh.md)

## Change

Background model synchronization preserves existing Session model selections. An unavailable model stays unavailable until you select a valid route; synchronization no longer moves that Session to another model or account. An explicit group change only reconciles XPeach selections.

A selected provider must contain the selected model. The generic adapter no longer borrows a same-named model from another XPeach provider. Missing models return the existing `UNKNOWN_MODEL` failure.

Group updates require a successful key verification immediately before the write. An unavailable verification result no longer authorizes a write using cached token metadata. An incomplete identity lookup does not publish a broader model catalog as a successful synchronization.

Access-token and console-fallback binding require complete pagination. They reuse only a token confirmed against the active key; unknown ownership blocks creation. Without an active key, they create a uniquely named token, requiring a unique new id and reveal before binding. Only new access-token-created rows receive default groups; existing groups remain unchanged. Key slots validate usage JSON and field types before commit. Reference-publication failure can leave the verified key committed and block requests until references agree.

Relay keys and token identities use the same revision in `xpeach.relay.json`. Shared profiles use `~/.xph/xpeach.relay.json`; an isolated key directory can use its own state file. After that file exists, `xpeach.key` and `xpeach.token` are compatibility projections and cannot replace the authoritative state. An incomplete projection blocks dependent operations until startup repairs it.

## Migration

Existing nonempty profile patches are preserved. In their `llm-pi-ai` entry, add `xpeachAccount` to `inject`, preserving other dependencies. This prevents model-provider activation when account initialization or credential repair fails; the new product template already declares it.

1. Stop older versions before starting the upgraded processes against the same shared credentials. Retain `xpeach.relay.json` with your account data; use account binding operations to change credentials instead of replacing its compatibility files. If startup cannot repair an incomplete projection, correct its path or write-permission failure and restart.
2. If an existing Session reports an unavailable model after synchronization, select an available provider/model pair in the model picker or update the explicit provider/model values used by your SDK client. Keep the provider associated with the intended account and protocol.
3. If a group update cannot verify its token, check the active credential and management access, then retry. Confirm that the displayed bound token is the intended token before changing its groups.
4. Synchronize models and confirm that existing Sessions retain their selections. After an explicit selection, confirm that the next request uses the selected provider and model.
5. When binding without an active key, expect a new site token and review older tokens separately. If creation or binding reports an uncertain outcome, inspect the site token list before retrying. After a credential-reference failure, restart or complete a successful model synchronization; do not assume the committed key was rolled back.
