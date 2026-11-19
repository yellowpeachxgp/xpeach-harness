---
description: "记录持久化类型更改及其兼容性确认。"
kind: persistence-change
---

# 2026-10-25-skill-catalog-incomplete

[English](2026-10-25-skill-catalog-incomplete.md) | 中文

## 概述

当技能发现仅返回当前可读技能时，为 skill-catalog 消息来源添加可选的 incomplete: true 元数据。

## 目录

- [声明](#declaration)
- [兼容性](#compatibility)
- [验证](#verification)
- [开发备注](#dev-note)

<a id="declaration"></a>
## 声明

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
## 兼容性

已有目录不含此标记，仍按完整目录读取。新读取方同时比较条目与完整性。旧读取方接受未变的来源判别值与条目字段，保留消息正文中已渲染的发现警告，并忽略可选标记。不改变事件判别值、必填字段或 Session 格式版本。

<a id="verification"></a>
## 验证

skill-filesystem 与 tool-skill 定向测试共 71 项通过，两个修改源文件覆盖率均为 100%。无密钥 headless skill-root-isolation 与 skill-load 快照共 2 项通过；隔离夹具记录部分目录，并在一个根失败时成功加载可读技能。

<a id="dev-note"></a>
## 开发备注

无。
