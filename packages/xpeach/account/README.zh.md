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

- `xpeach.relay.json` 是仅所有者可读写（`0600`）的中转密钥／令牌权威快照。其 `version: 1` 格式一起提交单调递增的修订号和完整凭据对；未知版本或无效数据会被拒绝。权威快照存在后，已有 `xpeach.key` 与 `xpeach.token` 成为兼容投影，即使撤销后权威快照中的密钥为空也一样。旧环境值、槽位、引用和镜像文件均不能恢复该空状态；显式绑定或选择槽位必须提交新修订。
- 在系统临时目录之外共享凭据的 profile 使用同一个 `~/.xph/xpeach.relay.json` 和 writer 锁，即使 Harness home 不同也一样。临时共享 profile 使用 `<temporary home>/xpeach.relay.json`。位于 `profiles/<name>/` 布局之外的自定义 `keyFile` 不执行同级镜像，使用其所在目录。`relayStateFile` 只允许在这最后一种隔离情形下用同目录绝对路径覆盖；镜像 profile 指定其他权威文件会被拒绝。初始迁移只接纳同目录、已绑定密钥的令牌记录；旧版本不得并发写入同一组文件。
- 写入在跨进程锁内重新读取并比较已捕获的修订号。它先发布带 `projectionPending: true` 的完整凭据对，再写兼容投影，最后在同一修订下清除此标记。部分投影写入是可见的 `credential-write-incomplete` 失败，读取方拒绝使用。启动在服务激活前等待从权威快照修复投影；修复绝不把旧投影提升为权威快照。SSO、管理令牌、Cookie 与槽位列表仍分别存储。
- 令牌身份解析先在有界页数内扫描精确匹配的密钥，再揭示有界数量的候选密钥。名称与创建时间只用于排列候选。揭示结果不可用或不匹配时拒绝分组写入。管理访问令牌与控制台备用登录的 mint 共用完整身份扫描，只有精确密钥匹配或 reveal 确认后才复用既有令牌，保持其分组不变。活动密钥归属未知时禁止创建；空页与站点声明的总数矛盾时视为分页未完成。无活动密钥时，两条路径都创建带唯一名称的新令牌，完整扫描确认它不在创建前的列表且唯一匹配，再验证密钥后绑定。只有管理访问令牌路径为本次新建的令牌设置默认组；控制台路径保留站点返回的分组。名称前缀不能作为既有令牌的认领证据。创建后的绑定失败会明确提示远端可能已有新令牌，需要检查站点列表。未绑定的历史分组绝不扩展目录。身份未知或预算耗尽时保留已发布目录，并报告不完整结果。已确认的空中转目录，或家族过滤后为空的结果，会为账号提供方显式发布空模型列表，避免 unset 恢复 profile 中的继承模型，同时保留自定义提供方与现有 Session 选择。非 JSON、缺少模型数组或字段无效的响应会失败并保留原目录。
- 目录同步在每个声明的端点下挂载模型：`xpeach`、`xpeach-openai-responses` 与 `xpeach-anthropic`。它从身份解析前到发布期间持续检查凭据修订，等待 `credentials.set(keyVar)`，验证解析后的引用，并在同一中转锁内发布设置。请求守卫拒绝不匹配的引用。产品组合还必须让模型提供方依赖 `xpeachAccount`，使账号激活失败时提供方不能缺少守卫而继续可用。
- 添加密钥槽位使用独立请求验证候选，不切换活动密钥、环境或凭据引用，也不屏蔽活动账号的鉴权失败处理。HTTP 200 本身不足以验证密钥：用量必须是有效 JSON，含字符串名称、有限的额度和过期时间数值，以及布尔类型的额度／模型限制开关。坏响应、验证失败或取消都不改变权威状态、投影、环境、凭据引用和槽位；验证成功后仍以开始时的修订做 CAS 提交，并拒绝覆盖并发变化。若提交后凭据引用发布失败，已提交的是验证过的密钥，操作报错且请求守卫拒绝不一致的引用；重启或成功同步完成引用发布前不应继续调用模型。
- 被动刷新与普通 `syncModels` 绝不改变现有 Session 选择，也不激活冷 Session。新 Session 的默认值可以跟随目录。只有显式 `setGroups` 能协调三个账号自有提供方的选择；`deepseek-account` 与自定义提供方被排除。现有选择中的模型缺失时，按普通 `UNKNOWN_MODEL` 处理失败。
- 同步失败公开 `code`：`identity-unknown`、`identity-budget-exhausted`、`credential-changed` 或 `credential-write-incomplete`，并给出可采取操作的消息。`siteCatalog` 通过 `xpeach/identity-incomplete` 报告未解析的身份。解绑提交空的权威快照、删除旧凭据、清理运行时变量并撤销凭据引用；绝不通过删除权威文件来模拟较早安装的状态。

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
| `tokenPageLimit` | `10` | 身份解析与用户令牌行查询的最大页数；正整数 |
| `tokenPageSize` | `100` | 请求管理端使用的分页大小；正整数；用户端点自行决定分页大小 |
| `tokenRevealLimit` | `16` | 每次身份解析最多揭示的候选令牌数；正整数 |
| `relayStateFile` | 派生的共享路径 | 仅用于不执行镜像的自定义密钥文件的权威路径覆盖 |
| `credentialLockWaitMs` | `5000` | 获取 writer 锁的最长等待毫秒数；正整数 |
| `watchModels` | `['swe-2-max']` | 由 `modelMatch` 交叉核对的模型标识符 |

`macosInstallerAction` 从应用启动入口解析 CLI 规范资源，在安装副作用前校验现有 profile 补丁；空补丁播种、合法自定义补丁保留、错误补丁停止安装。详见[桌面安装器](../../../apps/desktop/README.zh.md)。

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- 管理端接口（`/api/user/self`、`/api/token/`、`/api/pricing`）需要绑定站点访问令牌（`xpeach.admin`）；仅绑定 `sk-*` 中转密钥时，管理端查询返回未认证状态，而中转用量与日志仍可用。目录发布还要求已确认的本地令牌身份，或可用于身份发现的管理通道。

<a id="dev-note"></a>
### 开发备注

凭据文件（`xpeach.key`、`xpeach.admin`、`xpeach.session`）在当前 profile 目录下以 `0600` 权限写入，从不进入 Session 日志或模型请求。
