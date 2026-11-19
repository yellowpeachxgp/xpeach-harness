---
kind: upgrade-guide
description: "Custom Schedule compositions now require the application-owned sessionActivation service instead of the Web Session controller."
---

# Supply application-owned Session activation

English | [中文](guide.zh.md)

## Change

`@xpeach/xph-schedule` now injects `sessionActivation`, declared by `@xpeach/xph-agent`, instead of `sessionController`. The shipped Web and SDK profiles provide it. SDK publishes it after route initialization, enabling its configured Schedule tools and recovery. SDK shutdown cancels pending Session restoration and rejects its request while draining cleanup.

## Migration

1. Keep the shipped Web and SDK profiles; remove custom patches that gate Schedule on the nonexistent `sdkSessionActivation` service.
2. For a custom application composing Schedule, provide `ctx.sessionActivation` with `withAgent(sessionId, operation)`. Use `SessionActivationOwner` to track borrowed operations. Reuse an owned Agent or resume that persisted identity; reject missing or unreadable history without creating a replacement. Retain Agent ownership; the callback must finish delivery and persistence before returning, without retaining the Agent.
3. Call `await activation.close()` before releasing Agent resources, then withdraw the service and drain dependents. Adopt original resource-fiber disposers in one ordered ownership effect so parent unload follows the same sequence. See the [Agent API](../../../../packages/core/agent/README.md#use-this-package).
4. Verify a due reminder resumes its original Session and that shutdown drains pending delivery. Update SDK clients to handle cancellation of a concurrent `session/resume` request.
