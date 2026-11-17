---
kind: upgrade-guide
description: "循环的提示词专家回调在准备阶段不再包含延迟工具贡献，最终工具改写须迁入 finalizeTools。"
---

# 提示词工具内容延迟绑定

[English](guide.md) | 中文

## 变更

AgentLoop 使用 `SystemPrompt.prepare()`，原 `system-prompt/assemble` waterfall 仍只执行一次，且仍位于 `agent/pre-step` 前。延迟注册的工具 schema 和工具 SDK 文本在 `agent/request` 与 `prepareCall()` 确定真实模型、`ToolsService.resolve()` 解析准入后才绑定。原先直接读取、过滤或排序这部分内容的专家回调必须迁移；直接调用 `assemble()` 的立即组装语义不变。普通额外贡献保留，配置的完整提示词片段仍最终覆盖提示词。

同一步重试复用准入和工具内容；重试若更改 provider、model 或已解析的 reasoningEffort，循环以 `TOOL_MODEL_SELECTION_CHANGED` 结束，避免复用其他模型的准入结果。模型切换应在后续步骤进行。被移除或替换的注册不能重新进入当前准入。

## 迁移

1. 在注册 `system-prompt/assemble` 的插件中，将读取或改写工具 schema、工具 SDK 文本的代码移到返回对象的 `finalizeTools(assembly)`。组合已有 `finalizeTools` 后再执行自己的改写；其返回值为最终贡献，配置的 `complete` 片段仍由注册表恢复。
2. 普通变量、运行时上下文与不依赖工具准入的贡献继续保留在原 waterfall。需要等待真实准入的提供者使用 `tools(provider, { deferUntilTools: true })`；工具说明片段使用 `deferUntilTools: true`，不得与 `complete: true` 同用。可选 `knownNames` 元数据可在不执行条件的情况下提前验证配置的工具顺序。
3. 自定义循环在请求准备后，从实际 config 捕获模型选择并解析一个工具准入集合，再调用准备结果的 `bindTools({ toolSet })`，向原始工具批次透传同一集合，并在步骤退出时释放。被拒绝或空的首步不分配准入；同一步重试不得重新解析或换模型。
4. 通过真实循环测试验证被拒绝工具不进入 schema、SDK 文本或嵌套分发，专家过滤与排序仍生效，且取消与失败关闭准入。现有 Session 无需迁移。
