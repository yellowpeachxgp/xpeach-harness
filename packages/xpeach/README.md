---
description: "Package map for the XPeach product overlay: the account backend that supplies SSO sign-in, billing, and model operations, plus the client face that mounts the peach brand, quota surfaces, and the XPeach console."
kind: "package-group"
---

# xpeach/ — XPeach product overlay

English | [中文](README.zh.md)

## Summary

The `xpeach/` group carries the XPeach product face layered over the shared harness: sign-in and account operations for the XPeach platform, the brand presentation, and the console panel. Choose a package here only for behavior that is XPeach-branded or XPeach-account-backed; shared mechanisms belong to the owning subsystem group. Each child README owns its configuration and behavior; the related documentation below explains the seams these packages attach to.

## Table of Contents

- [Packages](#packages)
- [Related documentation](#related-documentation)
- [Dev Note](#dev-note)

-----

<a id="packages"></a>
## Packages

| Package | Role | ctx key |
|---|---|---|
| [`account/`](account/README.md) | XPeach account backend: SSO binding, key lifecycle, billing, model catalog, and playground chat remotes | — |
| [`client-ui/`](client-ui/README.md) | XPeach browser face: brand marks, quota surfaces, settings sections, and the console main panel | — |

-----

<a id="related-documentation"></a>
## Related documentation

- [Credentials subsystem](../../docs/subsystems/credentials.md) — the credential seam the account backend supplies, including the forwarded `xpeach/playground-chunk` event it emits during streamed playground calls.
- [Web client architecture](../../docs/subsystems/web-client.md) — the slot and service surfaces the client face mounts into.
- [Slots reference](../../docs/subsystems/slots.md) — the extension seats the brand and quota entries register into.

## Dev Note

The group name is `xpeach` in manifests and `@xpeach/xph-*` in published package names. Keep XPeach-specific behavior here so shared packages stay brand-free.
