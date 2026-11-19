---
description: "Records a persistence type transition and its compatibility acknowledgement."
kind: persistence-change
---

# 2026-10-25-skill-catalog-incomplete

English | [中文](2026-10-25-skill-catalog-incomplete.zh.md)

## Summary

Adds optional incomplete: true metadata to skill-catalog message sources when discovery returns only the currently readable skills.

## Table of Contents

- [Declaration](#declaration)
- [Compatibility](#compatibility)
- [Verification](#verification)
- [Dev Note](#dev-note)

<a id="declaration"></a>
## Declaration

```yaml persistence-change
schemaVersion: 1
id: 2026-10-25-skill-catalog-incomplete
baseline: false
changes:
  - root: "event:agent/inbox/spliced"
    previous: "2026-10-13-user-rpc-principal"
    after: "979f7d276084f3abe3915128ec215dc5829fa85a85a24bf423b0e16826a47afc"
    decision: same-version
  - root: "event:developer/message"
    previous: "2026-10-13-user-rpc-principal"
    after: "d05a734882ebdc4daaffa45a224c23af0422f645c6a92d6dc101d5313a735008"
    decision: same-version
  - root: "event:session/title-llm-request"
    previous: "2026-10-13-user-rpc-principal"
    after: "b9f2f4216ead867cb8de573f085603904c550395b74985a3533db50ac6f03474"
    decision: same-version
  - root: "event:user/message"
    previous: "2026-10-13-user-rpc-principal"
    after: "b832daa3c34754e1ec06ea6750410b739f486e5d9a885d068d32d0bbef411cf5"
    decision: same-version
```

<a id="compatibility"></a>
## Compatibility

Existing catalogs omit the flag and remain complete. New readers compare both entries and completeness. Older readers accept the unchanged source discriminator and entry fields, preserve the already-rendered discovery warning in message content, and ignore the optional flag. No event discriminator, required field, or Session format version changes.

<a id="verification"></a>
## Verification

Focused skill-filesystem and tool-skill tests: 71 passed with 100% coverage for both changed source files. Keyless headless skill-root-isolation and skill-load snapshots: 2 passed; the isolation fixture logs the partial catalog and loads a readable skill despite a failing root.

<a id="dev-note"></a>
## Dev Note

None.
