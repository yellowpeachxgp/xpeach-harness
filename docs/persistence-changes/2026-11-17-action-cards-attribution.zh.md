---
description: "记录持久化类型更改及其兼容性确认。"
kind: persistence-change
---

# 2026-11-17-action-cards-attribution

[English](2026-11-17-action-cards-attribution.md) | 中文

## 概述

确认 user/developer 消息及嵌套 inbox/title 输入新增仅作归属标记的 action-cards source kind。Session 写者仍为 V4。

## 目录

- [声明](#declaration)
- [兼容性](#compatibility)
- [验证](#verification)
- [开发备注](#dev-note)

<a id="declaration"></a>
## 声明

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
## 兼容性

四个前驱 schema 已绑定相同且受支持的 source 保留策略。本后继仅增加明确声明为归属标记的 action-cards kind 及其 ContextFormed 分支；既有 kind、Session header、事件名与包络不变。新读者仍可读取不含卡片通知的日志。

未安装 producer 的读者接受非空的 producer-owned kind，并保留 source JSON 和已记录消息内容。冻结 V4 source 读者保留未知归属并拒绝畸形 source；其逐行接纳检查在 recoverable tail 处理前拒绝退役 plugin 包装。action-cards producer 写入普通 user-role 状态文本，只有其自身投影使用 through 确认已送达的决策。该字段不授予权限，也不要求执行动作或安装消息解释器。卡片提案与决策仍是独立的实验 plugin record，不是新的 Session 事件辨别符。缺少通知时保留既有行为。

source 声明及其传递引用使 agent/inbox/spliced、developer/message、session/title-llm-request 和 user/message 四个根增加该 kind。当前 producer 仅写 user 消息，其余根经共享消息 source 类型变化；既有 ContextFormed 呈现规则继续生效。不重写保留的历史世代或已接受的定版记录，也不引入格式降级或回退。

<a id="verification"></a>
## 验证

实际执行 env -i PATH="$PATH" node node_modules/vitest/vitest.mjs run packages/session/session-projection/tests/summary.spec.ts packages/session/session-persistence-jsonl/tests/native-source-admission.spec.ts packages/experimental/action-cards/tests/status.spec.ts packages/experimental/action-cards/tests/projection.spec.ts：4 个文件、49 项通过。实际执行 env -i PATH="$PATH" node node_modules/vitest/vitest.mjs run packages/session/session-format-v3-to-v4/tests/message-sources.spec.ts：1 个文件、10 项通过。JSONL 用例覆盖 raw/Zstandard 的读写打开、无 producer 时保留不透明元数据，以及拒绝后源字节不变；冻结 source 用例覆盖未知归属及 recoverable tail 处理前的拒绝。以上为本地合成检查，不是在线账号或历史应用验收。

<a id="dev-note"></a>
## 开发备注

无。
