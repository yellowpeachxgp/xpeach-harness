---
description: "Records a persistence type transition and its compatibility acknowledgement."
kind: persistence-change
---

# 2026-11-17-action-cards-attribution

English | [中文](2026-11-17-action-cards-attribution.zh.md)

## Summary

Acknowledges the attribution-only action-cards source kind in user/developer messages and nested inbox/title inputs. The Session writer remains V4.

## Table of Contents

- [Declaration](#declaration)
- [Compatibility](#compatibility)
- [Verification](#verification)
- [Dev Note](#dev-note)

<a id="declaration"></a>
## Declaration

```yaml persistence-change
schemaVersion: 1
id: 2026-11-17-action-cards-attribution
baseline: false
changes:
  - root: "event:agent/inbox/spliced"
    previous: "2026-10-25-skill-catalog-incomplete"
    after: "9e8043098fb89db6d7c92a92c70146c5c8d24fa88f733c687fa29e5e7a58ab30"
    decision: same-version
  - root: "event:developer/message"
    previous: "2026-10-25-skill-catalog-incomplete"
    after: "95acdbd066cf445d37092e5fdfe2e8717ef6ca1aed50f70e2e6037a6989a1f2f"
    decision: same-version
  - root: "event:session/title-llm-request"
    previous: "2026-10-25-skill-catalog-incomplete"
    after: "eaa9125aec0fb28478096c46e73e21bf512ab0d84d826bfb41e7308707734cb5"
    decision: same-version
  - root: "event:user/message"
    previous: "2026-10-25-skill-catalog-incomplete"
    after: "39adb7fce8475af6402acd925ea79697b3341c22422ac32833d71217d84e987f"
    decision: same-version
```

<a id="compatibility"></a>
## Compatibility

The four predecessor schemas already bind the same supported source-preservation policies. This successor only adds the explicitly qualified action-cards kind and its ContextFormed alternatives; existing kinds, the Session header, event names and envelopes remain unchanged. New readers continue to read logs without card notices.

Readers without the producer accept a nonempty producer-owned kind and retain the source JSON and recorded message content. The frozen V4 source reader preserves unknown attribution and rejects malformed sources; its row-admission guard refuses retired plugin wrappers before recoverable-tail handling. The action-cards producer emits ordinary user-role status text; only its own projection uses through to acknowledge already delivered decisions. That field grants no authority and requires no action execution or message interpreter. Card proposals and decisions remain separate experimental plugin records, not new Session event discriminators. An absent notice keeps existing behavior.

The source declarations and their transitive reachability add this kind to agent/inbox/spliced, developer/message, session/title-llm-request and user/message. The current producer emits only user messages; the other roots change through the shared message source type. Existing ContextFormed framing rules continue to apply. Retained historical generations and accepted finalization records are not rewritten, and no format downgrade or fallback is introduced.

<a id="verification"></a>
## Verification

Executed env -i PATH="$PATH" node node_modules/vitest/vitest.mjs run packages/session/session-projection/tests/summary.spec.ts packages/session/session-persistence-jsonl/tests/native-source-admission.spec.ts packages/experimental/action-cards/tests/status.spec.ts packages/experimental/action-cards/tests/projection.spec.ts: 4 files, 49 tests passed. Executed env -i PATH="$PATH" node node_modules/vitest/vitest.mjs run packages/session/session-format-v3-to-v4/tests/message-sources.spec.ts: 1 file, 10 tests passed. The JSONL cases cover raw/Zstandard read and write opens, opaque metadata retention without a producer, and refusal with unchanged source bytes; the frozen source cases cover unknown attribution and rejection before recoverable-tail handling. These are local synthetic checks, not live-account or historical-application acceptance.

<a id="dev-note"></a>
## Dev Note

None.
