# XPeach Harness 产品级隔离架构与审计

> 目标：XPeach 作为独立产品运行——独立 home、独立 CLI、独立凭据链、独立包命名；与 DeepSeek Harness 零互写，历史数据仅经用户显式「导入」单向复制。

## 一、数据面隔离

| 数据 | DeepSeek | XPeach | 机制 |
|---|---|---|---|
| Home 根 | `~/.dsh` | `~/.xph` | `pnpm xph` 注入 `XPH_HOME=~/.xph`；`resolveDshHome` 按 `XPH_HOME > DSH_HOME > ~/.dsh` 顺序解析（`home-paths/src/index.ts`） |
| 会话日志 | `~/.dsh/sessions` | `~/.xph/sessions` | 默认根隔离 |
| JSON 存储 | `~/.dsh/storages` | `~/.xph/storages` | 同上 |
| 消息附件 | `~/.dsh/attachments/v1` | `~/.xph/attachments/v1` | `attachment-local` 的 `dshHome` 默认解析到 XPH 根 |
| 凭据 YAML | `~/.dsh/.credentials.yaml` | `~/.xph/.credentials.yaml` | `credentials-local` 走 `resolveDshHome`；`account` 插件声明 `credentials` 依赖以写入中转凭据 |
| 浏览器会话授权 | `~/.dsh` `records/browser-session` | `~/.xph` 同名记录 | 各 home 独立 token（登录 URL 不通用） |
| 设置与工作区册 | `~/.dsh/settings.yaml` | `~/.xph/settings.yaml` | 保存时自动写入当前 home |
| 匿名 ID | `~/.dsh/.anonymous-user-id` | `~/.xph/.anonymous-user-id` | 首启自动生成 |
| 插件管理器 | `~/.dsh/profiles/xpeach/.plugin-manager` | `~/.xph/profiles/xpeach/.plugin-manager` | profile 目录随 home 解析 |
| 日志与缓存 | `~/.dsh/logs`、`~/.dsh/cache` | `~/.xph/logs`、`~/.xph/cache` | 同上 |

## 二、产品面与入口

- **CLI**：`pnpm xph` → `apps/cli/src/xph.ts`
  - 注入 `XPH_HOME` 并默认使用 `--profile xpeach`（显式 `--profile` 参数原样透传）。
  - 首启将 `~/.dsh/profiles/xpeach` 迁移至 `~/.xph/profiles/xpeach`，并补齐默认 `cordis.patch.yml`。
- **PAT 命名**：新铸站点令牌命名为 `xph-YYYY-MM-DD-xxxx`；复用逻辑兼容 `xph-` 与历史 `dsh-` 前缀令牌。
- **包作用域**：全仓包统一迁移至 `@xpeach/xph-*`（含 `@xpeach/xph-account`、`@xpeach/xph-client-ui` 等）。
- **导入桥**：`xpeach/importDeepseek` 源固定为 `~/.dsh`（只读），目标为当前 home 根（`~/.xph/…`），按会话目录级幂等导入。
- **控制台输出**：Web 启动提示统一为 `xph web:`（`packages/bundle/web-app`）。
- **默认凭据路径**：`keyFile` / `sessionKeyFile` / `adminKeyFile` 默认落于 `$XPH_HOME/profiles/xpeach/…`。

## 三、站点接入与功能架构

### 3.1 凭据模型

绑定入口接收**站点「系统访问令牌」（Access Token，管理令牌，raw `Authorization`）**，而非 `sk-` API Key：

- `bindKey`：调用 `GET /api/user/self`（raw `Authorization`）校验后写入 `xpeach.admin`；随后通过同一通道执行列表查询、创建（`POST /api/token/`）与明文读取（`POST /api/token/<id>/key`），查找或铸造 `xph-*` 令牌并补齐 `sk-` 前缀写入 `xpeach.key` 供模型调用计费。
- `sk-` 前缀输入直接拒绝并提示输入系统访问令牌。
- 站点 `reveal` 接口返回的 48 字符密钥不含 `sk-` 前缀，落盘前统一补齐。
- 解绑操作同时清理 `xpeach.admin` 与 `xpeach.key`。
- 令牌获取入口指向 `/console/personal`（个人设置 → 系统访问令牌）。

### 3.2 站点端点与线路探测

站点三条线路（`xpeach.codes` / `fast.xpeach.codes` / `ultrafast.xpeach.codes`）均通过 `/v1` 提供 OpenAI 兼容接口：

- 主机侧每 30 秒并行探测三条线路，每条采样 3 次取中位延迟并统计丢包率；已配置密钥时探测 `/v1/models`，否则探测 `/api/status`。
- 综合评分公式为 `延迟 × (1 + 丢包率 × 4) + 丢包率 × 400`，`fast` 线路赋予 `0.8` 权重并作为默认优先线路。
- 新线路评分优于当前线路 15% 以上时触发切换（防抖），同步更新管理 API `baseURL` 与 `llm-pi-ai` provider `baseURL`。
- 线路选择持久化至 `xpeach.route.json`；用户手动指定线路后关闭自动切换。
- 控制台「网络」标签页展示三条线路的延迟、丢包率、状态柱状图及手动测试与自动切换开关。

### 3.3 站点模型广场

- 绑定令牌时按分组自动选择可用模型组：优先用户专属组，其次 `SWE`，否则选择模型数最多的非管理组；当令牌 `groups` 为空或落入空模型组时自动改写至可用组。
- 绑定后将 `/v1/models` 同步写入 `llm-pi-ai.providers.xpeach.models`（支持热更新），默认 `contextWindow: 262144`、`maxTokens: 32768`、输入模态 `text`。
- 控制台「模型市场」提供分组多选与同步操作，支持更新令牌 `groups`（`PUT /api/token/`）后重新拉取模型目录。
- 模型市场支持「全部模型」与「按分组」双视图，展示模型分组、倍率与定价明细。

### 3.4 Access Token 登录态与用户主页

- 用户态读写接口（`/api/user/self`、`/api/token/` CRUD 与 reveal、`/api/log/self`、`/api/log/self/stat`、`/api/user/aff`、`/api/user/groups`、`PUT /api/user/self`）统一优先使用 Access Token（raw `Authorization`），浏览器会话 Cookie 仅用于充值等站点强制要求会话的页面。
- 概览页展示用户信息、分组、邀请码、累计调用与消耗、剩余额度、Token 活动热力图、常用模型、最近调用及最近会话列表。
- 侧栏底部分离设置入口与站点余额胶囊；悬浮卡展示账户身份、剩余额度、今日与近 7 天 Token 用量柱状图及充值入口。

### 3.5 首启引导与多源导入

- `onboardingScan` 自动探测本机 DeepSeek Harness、Claude Code、Codex、zcode、ChatGPT Desktop 的会话库，以及 MCP 服务器（Claude / Cursor / Codex TOML / zcode）、Skills 与默认提示词（`AGENTS.md` / `CLAUDE.md`）。
- 首启分步向导（1040×720）覆盖欢迎、令牌绑定、对话来源选择、配置项选择、导入进度与汇总，完成后写入 `<home>/.xpeach-onboarded`。
- 异构对话解码后统一写回原生 v4 会话日志（独立头帧 + 事件帧两段 zstd 拼接，`surface` 事件携带根层 `surfaceOp: 'append'`，标题事件关联首条用户消息序号，严格递增 `turn` 序号并补齐 `assistant/message` 结算字段）。
- 资产导入将 Skills 复制至 `<home>/skills`，提示词合并至 `<home>/AGENTS.md`，MCP 配置以 `@xpeach/xph-mcp-client` 条目追加至 profile patch。
- 导入去重通过 `<home>/.xpeach-imported.json` 记录源文件 `mtime` 或会话 ID，重复执行自动跳过。

### 3.6 界面视觉规范

- 卡片与表单控件统一圆角、边框与焦点环样式；移除废弃的 `XPeachBindGate` 组件。
- 侧栏余额悬浮卡与页面卡片全部采用主题表面变量（`bg-layer-1` 等），仅品牌桃色与状态语义色保留固定色值，兼顾亮色与暗色主题。

## 四、品牌与客户端存储隔离

- **浏览器存储**：客户端 `localStorage` 键统一使用 `xph.*` 命名空间，并由 `apps/web/src/storage-migrate.ts` 执行旧键一次性迁移。
- **插件清单字段**：支持 `xph.client` 清单声明，同时向下兼容 `dsh.client`。
- **环境变量**：支持 `XPH_*` 与 `XPEACH_*` 环境变量前缀（标题、版本、提交哈希、搜索与抓取 provider 等），由 `XPH_PRODUCT` 驱动 CLI 帮助文案。
- **品牌文案**：账户设置与界面品牌文案统一为 XPeach（DeepSeek 仅作为上游模型与供应商事实名称保留）。

## 五、保留的内部协议与兼容标识

以下内部协议字段与底层函数名保留 `dsh` 前缀，以维持持久化数据兼容性与加载器契约：

| 标识 | 性质 | 保留原因 |
|---|---|---|
| `dsh.client` `package.json` 字段 | 客户端模块协议字段 | 加载器与构建脚本同时识别 `xph.client` 与 `dsh.client`，保留以兼容内置客户端插件声明 |
| `DSH_CLIENT_TITLE` / `DSH_CLIENT_VERSION` 等环境变量 | 进程内运行时注入项 | 仅在进程内传递构建元信息，不落盘，已同时支持 `XPH_*` 前缀 |
| `dsh-resource://` URL scheme | 会话资源持久化协议 | 已写入历史会话消息，保持不变以避免既有资源引用失效 |
| `__DSH_BOOT__` `window` 全局变量 | 前后端启动注入契约 | 宿主与前端插件共享的引导挂载点 |
| `resolveDshHome` / `dshHomePath`（`@xpeach/xph-home-paths`） | 路径解析函数名 | 内部实现已按 `XPH_HOME > DSH_HOME > ~/.dsh` 优先级解析，保留函数签名以维持跨包调用稳定 |

## 六、验证记录

- 启动与凭据写入：应用激活无报错，`~/.xph/.credentials.yaml` 正常写入 `XPEACH_RELAY_KEY`。
- 目录隔离：`~/.xph/` 下按需创建 `sessions`、`storages`、`attachments`，运行全程未向 `~/.dsh` 写入任何文件。
- 界面与 CLI：窗口标题、品牌徽章、余额胶囊及 `xph --help` 均按独立产品配置输出。
