---
kind: upgrade-guide
description: "自定义 Schedule 组合现在需要应用拥有的 sessionActivation 服务，替代 Web 会话控制器。"
---

# 提供应用拥有的会话激活服务

[English](guide.md) | 中文

## 变更

`@xpeach/xph-schedule` 现在注入 `@xpeach/xph-agent` 声明的 `sessionActivation`，替代 `sessionController`。随附 Web 和 SDK profile 已提供该服务。SDK 在路由初始化后发布，使其配置的 Schedule 工具和恢复能力生效。SDK 关闭会取消进行中的会话恢复，使该请求失败，同时等待清理结束。

## 迁移

1. 使用随附 Web 和 SDK profile；移除以不存在的 `sdkSessionActivation` 服务限制 Schedule 的自定义 patch。
2. 自定义应用若组合 Schedule，须提供 `ctx.sessionActivation`，实现 `withAgent(sessionId, operation)`，并用 `SessionActivationOwner` 跟踪借用操作。复用自有 Agent 或恢复指定持久身份；历史缺失或不可读时拒绝，不创建替代会话。Agent 的所有权仍由应用持有；回调返回前须完成投递和持久化，不得保留 Agent。
3. 释放 Agent 资源前调用 `await activation.close()`，再撤回服务并排空依赖方。用同一个顺序所有权 effect 接管资源 fiber 的真实 disposer，使父级卸载也遵循这一顺序。参见 [Agent API](../../../../packages/core/agent/README.zh.md#use-this-package)。
4. 验证到期提醒会恢复原会话，关闭会排空进行中的投递。SDK 客户端须处理并发 `session/resume` 请求的取消失败。
