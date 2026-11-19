---
kind: upgrade-guide
description: "AgentLoop prompt experts must move delayed tool-schema and SDK-text transformations into finalizeTools."
---

# Delayed binding of prompt tool content

English | [中文](guide.zh.md)

## Change

AgentLoop uses `SystemPrompt.prepare()`. The original `system-prompt/assemble` waterfall still runs once before `agent/pre-step`, but deferred tool schemas and SDK sections bind only after `agent/request` and `prepareCall()` resolve the actual model and `ToolsService.resolve()` admits its tools. Experts reading, filtering, or ordering those contributions must migrate. Direct `assemble()` remains eager. Ordinary extra contributions survive; configured complete sections retain final authority.

Retries within a step reuse its admission and bound tool content. Changing provider, model, or resolved reasoningEffort during a retry ends the step with `TOOL_MODEL_SELECTION_CHANGED`; select a different model on a later step. Removed or replaced registrations cannot re-enter the current admission.

## Migration

1. In plugins registering `system-prompt/assemble`, move delayed tool-schema and SDK-text reads or transformations into the returned `finalizeTools(assembly)` callback. Compose an earlier callback before applying your own changes. Its result governs final contributions; the registry still restores configured `complete` sections afterward.
2. Keep ordinary variables, runtime context, and contributions independent of tool admission in the original waterfall. Register delayed tool providers with `tools(provider, { deferUntilTools: true })` and delayed guidance sections with `deferUntilTools: true`; do not combine this flag with `complete: true`. Optional provider `knownNames` metadata allows early validation of configured tool order without evaluating conditions.
3. Custom loops capture model selection from the actual prepared config, resolve one admission, and call the preparation result's `bindTools({ toolSet })`. Pass that same set to raw batches and release it on every step exit. Rejected and empty first-input decisions allocate none. Do not re-resolve conditions or change model selection within a retry.
4. Verify through the real loop that denied tools appear in neither schemas, SDK text, nor nested dispatch; expert filtering and ordering still apply; cancellation and failures close admission. Existing Sessions require no migration.
