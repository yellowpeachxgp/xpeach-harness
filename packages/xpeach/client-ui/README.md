---
description: "XPeach account settings section, quota pill, and brand surfaces for the Web client."
kind: "package-reference"
---

# @xpeach/xph-client-ui

English | [中文](README.zh.md)

## Summary

Browser plugin mounting the generated `xpeach` Remote contribution and registering the XPeach settings section, quota pill, quota notice, and brand surfaces in the Web client.

## Table of Contents

- [Use this package](#use-this-package)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

<a id="use-this-package"></a>
## Use this package

Mount `@xpeach/xph-client-ui` in the Web composition alongside `@xpeach/xph-account` to render the signed-in profile, token management, model market, call logs, and corner quota pill.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Token creation, deletion, and admin profile views require a bound site access token in `@xpeach/xph-account`; relay-key-only sessions render usage and call logs in read-only mode.

<a id="dev-note"></a>
### Dev Note

All client UI copy is routed through English and Chinese locale dictionaries and reads Host state exclusively through the `xpeach` Remote namespace.
