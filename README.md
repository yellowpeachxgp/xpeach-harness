# XPeach Harness

English | [中文](README.zh.md)

**XPeach Harness**（命令名 `xph`）是面向 [🍑Code（XPeach）](https://xpeach.codes) 生态打造的全插件化 AI 编程智能体工作台（Agentic Coding Workbench），同时提供 **原生桌面客户端（macOS / Windows / Linux）**、**Web 工作台**、**无头命令行（Headless CLI / PTC）** 与 **SDK 自动化接口**。

项目基于 **Cordis 微内核全插件架构** 构建，深度整合 **XPeach SSO 统一身份认证中心（`https://sso.xpeach.codes`）** 与 **🍑Code 高速模型网关（`https://fast.xpeach.codes`）**。只需一次 SSO 网页授权或令牌绑定，即可在同一个工作台内调用 Claude、GPT、DeepSeek、Gemini 等全系列前沿模型，自动完成多线路优选、实时额度计量、工具链编排、子智能体协同与本地跨平台资产迁移。

## 核心特性

### 1. XPeach SSO 一键授权与持久登录态

- **OAuth 2.0 设备流（Device Flow）一键登录**：在工作台点击「使用 XPeach SSO 一键登录」，系统默认浏览器会自动打开统一认证页并预填 8 位设备验证码；确认授权后，客户端自动完成 🍑Code 账号即时开通（JIT Provisioning）、系统访问令牌下发与专属 `sk-` 中转密钥绑定。
- **多种凭证通道兼容**：除 SSO 设备流外，同时支持直接粘贴站点「个人设置 → 系统访问令牌（Access Token）」、管理多把 `sk-` 密钥槽位（Key Slots）或使用浏览器会话登录。
- **一次配置，跨端持久生效**：只要未主动退出登录且账号状态正常，本地认证凭证、已选线路、模型分组与引导完成状态会在应用重启、版本升级以及 CLI / Desktop / Web 不同启动形态之间自动同步与延续，无需重复注册或配置。
- **实时封禁感知与毫秒级动态吊销**：每次发起模型推理前及运行期间，客户端均会与 SSO 及模型网关核验会话有效性；一旦账号在服务端被封禁（`403`）或令牌被吊销（`401`），客户端立即阻断推理流、取消正在执行的智能体任务并彻底擦除本地凭证。

### 2. 全模型矩阵与智能多线路加速

- **实时模型目录与能力自发现**：直接从站点 `/v1/models` 实时拉取当前令牌可调用的全部模型，结合远程模型元数据注册表自动配置上下文窗口（Context Window）、最大输出 Token、图文多模态输入（Text / Image）与高阶推理强度（Reasoning Effort），原生支持 `openai-completions` 与 `anthropic-messages` 双协议分流。
- **三线路持续探活与无感切换**：内置 **主站（`https://xpeach.codes`）**、**高速（`https://fast.xpeach.codes`）**、**特快（`https://cf.xpeach.codes`）** 三条中转线路，后台持续探测延迟与丢包率并绘制历史趋势，自动切换至最快可用节点，也可手动固定指定线路。
- **分组按需切换与模型演练场**：支持在工作台内一键切换令牌所属模型分组（如 `SWE`、`GPT`、`Claude`、`DeepSeek`），并提供多模型并行对比演练场（Playground），直观评测不同模型的响应速度与输出质量。

### 3. 全栈智能体工程能力（Agentic Coding）

- **完备的本地开发工具链**：内置受控文件读写与精准补丁编辑（`fs`）、命令执行与持久化终端（`shell` / `terminal`）、语言服务器代码诊断与符号导航（`lsp`）、实时网页搜索与正文抓取（`web`）、浏览器自动化交互（`browser-use`）以及桌面界面操作（`computer-use`）。
- **子智能体协同与长周期任务**：支持派发独立上下文的子智能体（`subagent`）并行探索代码库或修复问题，配合会话目标（`goal`）、结构化计划（`plan`）、待办清单（`todo`）、定时跟进（`schedule`）、后台作业（`jobs`）与上下文智能压缩（`compaction`），胜任复杂大型工程的持续迭代。
- **程序化工具调用（PTC）与系统级沙箱（Sandbox）**：支持通过代码编排批量工具调用（PTC Runtime），并结合操作系统原生沙箱机制（macOS `sandbox-exec`、Linux 命名空间隔离、Windows 受限令牌）对子进程实行严格的权限与路径约束。

### 4. 零门槛生态迁移与可视化扩展中心

- **一键导入主流 AI 编程工具资产**：首次启动向导与设置中心支持自动扫描本机已安装的 **Claude Code**、**Codex**、**Gemini CLI**、**Antigravity**、**ChatGPT** 与 **DeepSeek Harness**，以只读、单向方式一键导入历史对话记录、Skills 技能包、全局提示词规则（Rules）与 MCP 服务器配置。
- **内置扩展与站点控制台**：工作台集成可视化的 **Skills 技能开关与编辑器**、**Rules 全局规则管理**、**MCP 服务器增删改查**、**每日签到与兑换码充值中心**，并为站点管理员提供完整的 **渠道、令牌、用户、分组倍率与模型定价管理后台**。
- **账单级实时用量透视**：窗口角落的 🍑 状态胶囊实时展示账户剩余额度、今日消耗与近 7 日消费趋势；展开即可查阅逐笔调用的模型、输入/输出 Token 数、延迟耗时与计费明细。

<a id="run"></a>
## 安装与运行

### 桌面客户端（Desktop App）

前往 [GitHub Releases](https://github.com/yellowpeachxgp/xpeach-harness/releases) 下载对应操作系统的安装包：

| 操作系统 | 安装包格式 |
|---|---|
| macOS（Apple Silicon） | `xpeach-harness-<version>-mac-arm64.dmg` |
| Windows（x64） | `xpeach-harness-<version>-win-x64.exe` |
| Linux（x64） | `xpeach-harness-<version>-linux-x64.AppImage` |

<a id="mandatory-update-policy"></a>

桌面端内置自动更新与强制更新策略校验：普通版本更新在后台静默下载并于退出时应用；当服务端发布安全级强制更新时，客户端会在启动阶段完成版本签名与策略核验并引导升级。

### 命令行与 Web 工作台

```sh
# 启动本地 Web 工作台（默认自动打开浏览器）
pnpm xph web

# 启动原生桌面客户端
pnpm run start:desktop

# 以无头模式（Headless）直接执行单次开发任务
pnpm dsh --profile headless "分析当前仓库结构并运行单元测试"

# 以程序化工具调用（PTC）模式执行复杂编排任务
pnpm run demo:ptc -- "统计各模块导出接口并生成检查报告"
```

## 快速上手指南

1. **启动工作台**：首次打开桌面端或 Web 端时，系统会自动进入欢迎与登录引导界面。
2. **完成账号授权（任选其一）**：
   - **SSO 一键登录（推荐）**：点击「使用 XPeach SSO 一键登录」，在弹出的浏览器页面中登录 XPeach 通行证并确认 8 位设备码，工作台将自动完成凭证下发与模型同步。
   - **访问令牌绑定**：前往 [xpeach.codes](https://xpeach.codes) 的「个人设置 → 系统访问令牌」复制 Access Token，粘贴至输入框即可自动铸造并绑定专属 `sk-` 密钥。
3. **导入本机资产（可选）**：勾选引导页自动检测到的本地历史会话（Claude / Codex / Gemini / Antigravity / DeepSeek 等）及 Skills、Rules、MCP 扩展，一键迁入当前工作台。
4. **开始编程对话**：进入主工作区后，在底部模型选择器中挑选所需模型（如 `swe-2-max`、`claude-opus-5`、`gpt-6-astra` 等），即可开始对话与代码协作。

<a id="public-deployments"></a>
## 数据存储、安全与隐私

`xph` 将所有运行数据独立存放在 `~/.xph` 目录下，与机器上的其他工具完全隔离。除您主动发往模型网关与 SSO 认证中心的请求外，没有任何本地代码或会话数据会离开本机。

| 存储内容 | 路径与权限说明 |
|---|---|
| 会话记录、工作区状态、全局设置 | `~/.xph`（含 `sessions/`、`settings.yaml` 等） |
| SSO 会话凭证与用户信息 | `~/.xph/profiles/xpeach/xpeach.sso.json`（权限 `0600`） |
| 站点系统访问令牌（Access Token） | `~/.xph/profiles/xpeach/xpeach.admin`（权限 `0600`） |
| 中转调用密钥（`sk-` API Key） | `~/.xph/profiles/xpeach/xpeach.key`（权限 `0600`） |
| 多密钥槽位与令牌分组元数据 | `~/.xph/profiles/xpeach/xpeach.keys`、`xpeach.token`（权限 `0600`） |
| 线路优选与测速状态 | `~/.xph/profiles/xpeach/xpeach.route.json`（权限 `0600`） |

**安全保障机制**：
- **最小权限原子落盘**：所有凭证文件均通过进程级临时文件配合 `0o600`（仅当前操作系统用户可读写）权限原子替换写入。
- **严格同源与重定向防护**：SSO 基础地址与设备流验证链接均经过严格的 HTTPS / Loopback 白名单与同源校验，杜绝跨源钓鱼、控制字符注入与重定向令牌泄露。
- **可控的注销范围**：主动退出登录时支持仅注销当前设备，或一键吊销名下所有已授权设备并重置 🍑Code 令牌；退出后写入 `.xpeach-signed-out` 哨兵标记，确保旧凭证绝不自动复活。

## 仓库架构概览

```text
apps/
  desktop/          Electron 原生桌面端宿主、自动更新与安装器打包
  web/              Web 工作台前端构建与服务端入口
  cli/              xph / dsh 命令行入口与 Profile 启动器
packages/
  xpeach/
    account/        XPeach SSO 设备流、🍑Code 凭证桥接、三线路测速、模型同步与资产导入服务
    client-ui/      XPeach 登录向导、额度胶囊、模型分组管理、扩展中心与管理后台界面
  core/             Cordis 智能体循环（agent-loop）、会话模型与工具调度内核
  llm/              多协议模型提供方适配（OpenAI / Anthropic / DeepSeek）
  client/           响应式工作台 GUI 组件库、对话流渲染与国际化字典
  sandbox/          跨平台进程沙箱隔离（macOS / Linux / Windows）
  subagent/         子智能体派发、生命周期管理与工作区隔离
  ptc-runtime/      程序化工具调用（PTC）沙箱执行运行时
vendor/             固定版本的 Cordis 微内核框架源码
native/             原生系统扩展模块（@deepseek-ai/node-addon-system）
```

<a id="run-from-source"></a>
## 从源码构建与开发

环境要求：**Node.js `^22.19 || >=24`**，包管理器使用 **pnpm**（仓库通过 `packageManager` 字段固定版本）。

```sh
# 1. 克隆仓库并安装依赖
git clone https://github.com/yellowpeachxgp/xpeach-harness.git
cd xpeach-harness
pnpm install

# 2. 全量构建（含原生模块、Host/Client 产物、Web 资源与类型门禁校验）
pnpm run build

# 3. 启动开发调试模式
pnpm run dev:web       # 启动 Web 工作台开发模式（支持前端热重载）
pnpm run dev:desktop   # 构建并启动 Electron 桌面客户端开发模式

# 4. 运行测试与静态质量门禁
pnpm run test          # 运行单元测试套件
pnpm run lint          # 运行 oxlint 与合约类型检查
pnpm run typecheck     # 全仓 TypeScript 严格类型检查
```

桌面客户端的跨平台打包、签名与发布流水线详见 [`apps/desktop/packaging/README.md`](apps/desktop/packaging/README.md)。

## 社区与支持

- **官方网站与控制台**：[https://xpeach.codes](https://xpeach.codes)
- **统一身份认证中心（SSO）**：[https://sso.xpeach.codes](https://sso.xpeach.codes)
- **问题反馈与功能建议**：[GitHub Issues](https://github.com/yellowpeachxgp/xpeach-harness/issues)

## 开源许可

本项目采用 [MIT 许可证](LICENSE) 开源。第三方依赖及其许可证声明详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

XPeach Harness 派生自 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（MIT 许可）。本仓库基于上游提交 `687f282e8625c6b8d11ff58211a90524be2e4317`（版本 `0.2.1-rc.2`）构建，上游原始版权声明完整保留于 [LICENSE](LICENSE) 中，本项目所做的架构演进与功能改造记录详见 [NOTICE.md](NOTICE.md)。
