---
description: "XPeach（New API）账号 Remote：PAT 登录、令牌用量与日志、分组目录、价格同步表与管理端接口。"
kind: "package-reference"
---

# @xpeach/xph-account

[English](README.md) | 中文

## 概述

Host 插件，通过生成的 `xpeach` Remote 命名空间向 Harness 客户端暴露 XPeach 站点的 New API 接口。它负责绑定中转密钥与站点访问令牌、持久化价格快照，并按分组计算各模型的计费费率。

## 目录

- [凭据拓扑](#credential-topology)
- [密钥文件、凭据记录与解绑语义](#key-file-credentials-record-and-unbind-semantics)
- [价格同步表](#price-sync-table)
- [计费公式](#billing-math)
- [配置项](#configuration)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="credential-topology"></a>
## 凭据拓扑

| 端点 | `sk-*` 中转密钥（`Bearer`） | 管理令牌（原始 `Authorization:`） | 绑定用途 |
| --- | --- | --- | --- |
| `/v1/models`, `/v1/chat/completions` | ✅ | — | 模型列表、对话、演练场 |
| `/api/usage/token/` | ✅ | — | 令牌名称 / 总额度 / 已用额度 / 无限额标记 / model_limits |
| `/api/log/token` | ✅ | — | 当前令牌的调用日志（模型、输入/输出 token、额度、`group`、`other.group_ratio`） |
| `/api/user/groups` | ✅ | — | 分组目录 `{desc, models[], ratio}`——驱动二级分组选择器 |
| `/api/user/self`, `/api/token/`, `/api/log/?p=` | ❌ 401 | ✅ | 用户与管理端界面 |
| `/api/pricing` | ❌ | ✅ | 价格同步表数据源 |

<a id="key-file-credentials-record-and-unbind-semantics"></a>
## 密钥文件、凭据记录与解绑语义

- `xpeach.key`（`0600`）是 profile 本地的密钥副本；绑定时还会发布到运行时凭据记录中提供方的 `apiKeyEnv`（`XPEACH_RELAY_KEY`）下，供 `llm-pi-ai` 解析。
- 解绑通过 `unbindKey` remote 执行，会删除 `xpeach.key`、`xpeach.admin`、`xpeach.session`、`xpeach.keys` 与 `xpeach.token`，清理运行时环境变量，并撤销运行时凭据记录。

<a id="price-sync-table"></a>
## 价格同步表

`pricingSync(force)` 将 `/api/pricing`（管理令牌）与 `/api/user/groups`（中转密钥）合并为一份快照（`{at, entries, groupRatio, groups}`），以 10 分钟 TTL 持久化到密钥文件旁的 `xpeach-pricing.json`；当站点不可达时，陈旧快照继续为 `billingRate`、模型市场价格单元格、费用胶囊与分组选择器提供数据。

<a id="billing-math"></a>
## 计费公式

- `billingRate(model, group?)`：`in = model_ratio × group_ratio × 2`，`out = in × completion_ratio`（折算美元 `$/M`）。`quota_type=1` 的行按次固定计费。
- 分组倍率优先级：`groupRatio` 映射 → 分组目录 `ratio` → 最近日志 `other.group_ratio` → `1`。

<a id="configuration"></a>
## 配置项

| 字段 | 默认值 | 含义 |
| --- | --- | --- |
| `baseURL` | `https://fast.xpeach.codes` | New API 站点根地址 |
| `apiKeyEnv` | `XPEACH_API_KEY` | 初始迁移期间一次性解析的旧凭据引用 |
| `protocolPreference` | `compatible` | 协议偏好（`compatible`、`native` 或 `auto`，仅内存态） |
| `enabledFamilies` | `[]` | 同步目录中保留的模型家族（`groups`）（`[]` 保留全部，仅内存态） |
| `keyFile` | `~/.xph/profiles/xpeach/xpeach.key` | Profile 本地的中转密钥存储文件（`0600`） |
| `keyVar` | `XPEACH_RELAY_KEY` | 发布给 `llm-pi-ai` 的凭据引用与环境变量 |
| `adminKeyFile` | `~/.xph/profiles/xpeach/xpeach.admin` | Profile 本地的站点访问令牌存储文件（`0600`） |
| `adminKeyVar` | `XPEACH_ADMIN_KEY` | 站点访问令牌的环境变量 |
| `sessionKeyFile` | `~/.xph/profiles/xpeach/xpeach.session` | Profile 本地的会话 Cookie 存储文件（`0600`） |
| `sessionKeyVar` | `XPEACH_SESSION` | 站点会话 Cookie 的环境变量 |
| `timeoutMs` | `15000` | 单次请求超时时间（毫秒） |
| `watchModels` | `['swe-2-max']` | 由 `modelMatch` 交叉核对的模型标识符 |

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- 管理端接口（`/api/user/self`、`/api/token/`、`/api/pricing`）需要绑定站点访问令牌（`xpeach.admin`）；仅绑定 `sk-*` 中转密钥时，管理端查询返回未认证状态，而中转用量、日志与分组发现继续正常工作。

<a id="dev-note"></a>
### 开发备注

凭据文件（`xpeach.key`、`xpeach.admin`、`xpeach.session`）在当前 profile 目录下以 `0600` 权限写入，从不进入 Session 日志或模型请求。
