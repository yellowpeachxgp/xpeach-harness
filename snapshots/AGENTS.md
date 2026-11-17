# AGENTS.md — Recorded-session snapshots

本目录仅保存以已提交 Session JSONL 为回放输入的测试；持久化输出由该输入或显式声明的独立 writer oracle 校验。Keep non-session ARIA, geometry, generator, CLI, and unit expected output with its owning app, script, or package; use `test:expected`, `test:web`, or `test` for its owning tier.

Every process under test starts through the `dsh` CLI with a shipped profile and optional scenario patches. Test clients may drive a public protocol or browser interface; do not add another application entrypoint, hidden CLI mode, or executable scenario driver.

Each scenario owns or explicitly references one primary Session role plus contiguous child roles. Canonical parent filenames are `session[.vN].jsonl`; children are `session.<ordinal>[.vN].jsonl`; v0 omits `.v0`, positive versions use lowercase `.vN`, and every filename agrees with its header. A directory may retain several generations of one role, but replay, record, and refresh select the numerically highest. Record and refresh write version-named outputs without renaming or deleting a committed generation; reviewed source-tree curation is separate. The owner alone records or refreshes the selected role. For an ordinary one-shot case, derive the user task and replay script from that selected JSONL; do not duplicate them in an `input.json`. Shared references are read-only, acyclic, point to the owner's selected parent generation, and are used only when another interface intentionally renders the same recorded behavior.

An owner that must keep a historical generation or retired-tool recording declares its exact `sessionFormat.version` and closed migration `coverage` names in `snapshot.yml`; record and refresh never rewrite that Session fixture. `retired-tools` pins removed capabilities independently of migration coverage, including at the current format version. 未声明 `sessionFormat` 或 `sessionOutput` 的所有者在 record 和 refresh 时写入当前 writer 输出；replay 为每个父子角色独立选择保留的 V3 基线或当前代际。An explicit `sessionFormat.version` binds every selected role in that scenario. The [corpus policy](../scripts/session-snapshot-corpus-policy.ts) requires V3 inputs for direct upgrade coverage and explicit V0–V2 migration coverage; a writer bump alone does not refresh fixtures.

拥有自身输入的 headless 场景可显式声明 `sessionOutput: separate`，保留选中的回放输入，并以 `writer.expected.jsonl` 及 `writer.<ordinal>.expected.jsonl` 比较当前输出。该配置不与 `sessionFormat` 混用，也不声明迁移或退役工具覆盖；其他 profile 与借用输入的场景不可使用。record 跳过该场景，refresh 仅更新独立输出与拥有的伴随文件；replay 缺少任一角色的 oracle 即失败。具体规则见 [session-snapshot README](../packages/test-support/session-snapshot/README.md)。

Committed sessions are normalization fixed points. Replace volatile identities with typed relationship-preserving tokens, replace request system prompts and tool schemas with tokens, and keep exactly one readable sidecar owner per header class. Never redact arbitrary user or tool text merely because it resembles an identifier.

An adapter-local symlink may expose a cross-profile prompt or schema sidecar only when `snapshot.yml` names that source; the corpus gate resolves the link and checks the declared target. The required snapshot lane runs these aliases on macOS and Linux.

Workspace seeds stay scenario-local. A scenario that mutates the workspace sets `workspace.final: true` and commits the complete result under `workspace.expected/`; use only the ignored `.empty` marker for an empty result. Record and refresh do not rewrite this independent oracle. Model prose and tool-result text do not prove the external effect.

`pnpm run test:snapshot` replays without writes. Recording and refresh use the explicit snapshot scripts, and every resulting JSONL, prompt, schema, protocol, UI, and workspace diff is reviewed before commit.
