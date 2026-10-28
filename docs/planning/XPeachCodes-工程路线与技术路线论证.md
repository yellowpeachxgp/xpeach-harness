# XPeachCodes 工程路线与技术路线论证

> 本文用于进一步论证 XPeachCodes 桌面端的技术选型、改造策略、去 OpenCode 化方案。  
> 目标：内部使用、用户便利优先、不修改生产 New API、不暴露 OpenCode 官方品牌与功能。

---

## 1. 总体判断

我们不应该从零重写一个 AI 客户端。

OpenCode 已经提供：

- 成熟的项目管理
- Agent 循环
- 工具调用
- 文件操作
- 会话管理
- 多 Provider 模型调用
- 桌面端
- 本地服务端

这些能力如果重写，成本极高且质量难以保证。

因此正确的路线是：

> **把 OpenCode 当作底层“AI 引擎”，在其之上构建 XPeachCodes 产品层。**
> 产品层负责品牌、用户身份、账户中心、XPeach Provider、桌面体验。
> 引擎层只做能力支撑，不直接暴露给用户。

---

## 2. 工程路线论证

### 2.1 为什么基于 OpenCode Desktop 而不是重构

| 方案 | 工作量 | 风险 | 结论 |
|---|---|---|---|
| 从零开发 | 极大 | 极高 | 不推荐 |
| 基于 OpenCode CLI 包一层 GUI | 中 | 中 | 可以考虑，但不如桌面端完整 |
| 基于 OpenCode Desktop 改造 | 小-中 | 低-中 | **推荐** |

OpenCode Desktop 已经解决了：

- Electron 主进程
- 本地服务端启动
- 窗口管理
- 自动更新
- 文件系统能力
- 终端/PTY
- 项目/会话 UI
- 构建打包

我们只需要：

- 替换品牌
- 增加 XPeach 身份模块
- 固定 XPeach Provider
- 隐藏 OpenCode 相关入口
- 删除不需要的官方关联

### 2.2 分层架构

建议划分为四层：

```text
┌──────────────────────────────────────────────┐
│ 产品层 XPeachCodes                            │
│  - 品牌/UI/名称/图标/文案                     │
│  - 用户登录/账户中心/密钥管理                 │
│  - 固定 XPeach Provider                       │
│  - 用户使用流程                               │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ 应用层 OpenCode App / Desktop Shell           │
│  - Electron 主进程                            │
│  - SolidJS UI 框架                            │
│  - 本地 OpenCode 服务通信                     │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ 引擎层 OpenCode Core / Runtime                │
│  - Agent / Session / Tool / Provider          │
│  - 模型调用                                   │
│  - 文件/终端/项目能力                         │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ 数据层 New API（xpeach.codes）                │
│  - 用户/令牌/分组/模型/用量                   │
│  - OpenAI 兼容模型转发                        │
└──────────────────────────────────────────────┘
```

产品层与引擎层隔离得越干净，后期合并 OpenCode 上游更新就越容易。

### 2.3 改动隔离策略

核心原则：

- **不深度修改 `packages/core` 的 Agent/Model/Session 核心逻辑**；
- 尽量在 `packages/app`、`packages/desktop` 和少量扩展点完成；
- 把所有 XPeach 相关代码集中到独立模块：

```text
packages/app/src/xpeach/
packages/desktop/src/main/xpeach/
```

这样即使 OpenCode 上游更新，我们只需要处理：

- 品牌常量
- UI 挂载点
- provider 注入
- 本地服务配置接口

而不是重写整个引擎。

### 2.4 是否删除 OpenCode 官方 Console / TUI / CLI

建议分阶段：

#### 第一阶段：不在用户界面暴露

- 隐藏 CLI、TUI 入口；
- 桌面端不展示终端命令；
- 不提供官方 Console 登录；
- 不展示 OpenCode 官方 Provider；
- 不展示 OpenCode 官方链接。

#### 第二阶段：从构建中裁剪

如果内部使用稳定，可以考虑从构建产物中移除未使用的包：

```text
packages/console       # 官方控制台，不需要
packages/tui           # 终端 UI，不需要
packages/cli           # 若是独立 CLI，不需要
packages/web           # 可能不需要
packages/stats         # 可能不需要
packages/slack         # 可能不需要
packages/enterprise    # 可能不需要
packages/storybook     # 开发用，不需要
```

裁剪的好处：

- 减少二进制体积；
- 减少 OpenCode 品牌残留；
- 减少攻击面；
- 减少升级冲突。

风险：

- 需要验证依赖关系，避免误删运行时依赖；
- 可能导致上游合并更复杂。

---

## 3. 技术路线论证

### 3.1 桌面端架构

沿用 OpenCode Desktop 的架构：

```text
Electron Main
    ↓
本地 OpenCode Sidecar（内部服务）
    ↓
SolidJS Renderer
    ↓
用户界面
```

我们新增的 XPeach 能力：

```text
Renderer (UI)
    ↓ IPC
Electron Main
    ↓ HTTPS
New API (xpeach.codes)
```

选择这个结构的原因：

1. 渲染进程不需要直接持有 Token；
2. 主进程可以做加密存储；
3. 主进程可以绕过浏览器 CORS；
4. Token 不暴露给第三方页面；
5. 安全边界清晰。

### 3.2 身份与认证

#### 第一阶段：用户粘贴 Access Token

由于不能改 New API，且 Turnstile 阻断自动密码登录，第一阶段采用：

```text
用户从 New API 网页复制 Access Token
    ↓
粘贴到 XPeachCodes
    ↓
主进程验证 GET /api/user/self
    ↓
加密存储
    ↓
进入主界面
```

这在产品上是可以接受的：

- 只需一次；
- 后续全部自动；
- 不需要修改服务端。

#### 第二阶段：可选轻量认证桥

如果以后允许新增一个独立服务（不改 New API），可以实现完整 OAuth/设备码：

```text
桌面端 -> 认证桥发起设备码
用户浏览器 -> 登录 New API -> 授权
认证桥 -> 获取管理 Token -> 返回桌面端
```

这一阶段可以完全隐藏“粘贴 Token”的步骤。

### 3.3 模型调用技术路线

用户登录后，桌面端通过 New API 现有接口得到模型列表和 `sk-` 令牌。

自动配置：

```json
{
  "provider": {
    "xpeach": {
      "npm": "@ai-sdk/openai-compatible",
      "api": "https://xpeach.codes/v1",
      "options": {
        "apiKey": "sk-..."
      }
    }
  }
}
```

实现方式：

- 优先通过 OpenCode 现有 `auth` / Provider 机制写入；
- 不在公开配置文件中明文存储管理 Token；
- 只存储“模型调用用的 `sk-` Key”用于本地运行时；
- 用户可在密钥管理页面切换使用的 Key。

### 3.4 数据与存储

| 数据 | 存储位置 | 加密 |
|---|---|---|
| New API 用户 Access Token | Electron 主进程专用存储 | `safeStorage` 加密 |
| 当前登录用户信息 | 内存 + 本地缓存 | 可选加密 |
| `sk-` 模型令牌 | XPeach 模块 + OpenCode Auth | 视安全策略 |
| 本地设置 | electron-store | 不包含敏感信息 |

不允许：

- Token 写入普通日志；
- Token 写入渲染进程 localStorage；
- Token 明文写入 JSON 配置文件。

### 3.5 错误与离线处理

需要处理：

- Token 失效；
- 用户被禁用；
- 网络错误；
- New API 接口变更；
- 模型 Key 被删除/额度耗尽；
- 本地存储损坏。

统一策略：

- 所有 XPeach API 调用通过封装好的 client；
- 错误分类：`AUTH_ERROR` / `NETWORK_ERROR` / `API_ERROR` / `UNKNOWN`;
- UI 给出可操作提示：
  - 重新登录；
  - 刷新；
  - 重新选择 Key；
  - 联系管理员。

---

## 4. 去 OpenCode 化优先级

### 4.1 必改：用户可见品牌

| 项目 | 原内容 | 改为 |
|---|---|---|
| 应用名 | OpenCode / OpenCode Dev / OpenCode Beta | XPeachCodes |
| 应用 ID | `ai.opencode.desktop` | `codes.xpeach.desktop` 或自定义 |
| 窗口标题 | OpenCode | XPeachCodes |
| Dock/任务栏 | OpenCode 图标 | XPeachCodes 图标 |
| 安装包 | opencode-desktop | XPeachCodes |
| 关于页 | OpenCode | XPeachCodes |
| 登录/欢迎页 | OpenCode | XPeachCodes |
| 设置页 | OpenCode | XPeachCodes |
| Provider 名 | OpenCode / OpenCode Console | XPeach |
| 默认控制台 | opencode.ai | xpeach.codes |
| 错误提示 | OpenCode | XPeachCodes |
| 更新源 | OpenCode 官方更新 | XPeachCodes 内部更新或关闭 |
| 帮助文档 | opencode.ai | 内部文档或移除 |

### 4.2 必改：官方功能剔除

- 移除 OpenCode Console 登录入口；
- 移除 OpenCode Go / OpenCode Zen 等官方付费入口；
- 移除官方自动更新或改为 XPeachCodes 自更新；
- 移除官方 Discord / GitHub / 文档外链；
- 禁用官方统计或分享功能；
- 隐藏/禁用其它 Provider，只保留 XPeach；
- 移除 CLI 作为用户入口；
- 移除 TUI 入口；
- 移除 `opencode upgrade`、`opencode login` 等面向用户的 CLI。

### 4.3 建议改：默认配置与资源

- 默认配置文件可以保留 `opencode.json` 以兼容内部，但在 UI 中不展示；
- 数据库路径、缓存目录可保留内部命名，但用户不可见；
- 桌面端本地服务端口/名称可改为 XPeach 风格；
- 日志文件、崩溃报告中的产品名改为 XPeachCodes；
- 杀进程/服务名从 `opencode server` 改为 `xpeachcodes server`。

### 4.4 可选改：内部标识

为了彻底去 OpenCode 化，可以在 fork 后对以下内容做批次替换：

- `@opencode-ai/*` 包名；
- `OpencodePlugin` 等类名；
- `opencode.json` 默认文件名；
- `OPENCODE_*` 环境变量；
- 数据库表名；
- IPC channel 名；
- 日志标签。

但注意：

- 内部标识改动成本高、风险大；
- 如果不影响用户可见，可放在后期；
- 优先保证产品层完全“无 OpenCode 痕迹”。

---

## 5. 去 OpenCode 化技术手段

### 5.1 建立品牌常量中心

建议新建：

```text
packages/app/src/xpeach/branding.ts
packages/desktop/src/main/xpeach/branding.ts
```

统一管理：

```ts
export const APP_NAME = "XPeachCodes"
export const APP_ID = "codes.xpeach.desktop"
export const PROVIDER_ID = "xpeach"
export const PROVIDER_NAME = "XPeach"
export const API_BASE = "https://xpeach.codes"
export const MODEL_API_BASE = "https://xpeach.codes/v1"
export const SUPPORT_URL = ""
```

所有 UI 使用这些常量，禁止硬编码 OpenCode。

### 5.2 全量扫描

在改造过程中使用脚本扫描：

```bash
rg -n "OpenCode|opencode|opencode.ai|ai.opencode" packages/app packages/desktop packages/opencode packages/core
```

逐项确认是否用户可见：

- 用户可见 → 必须替换；
- 内部包名 → 暂缓或后期替换；
- 测试/历史注释 → 可保留或清理；
- 构建产物 → 最终检查二进制中的可见字符串。

### 5.3 构建后检查

完成打包后，可以对产物做字符串检查：

```bash
strings XPeachCodes.app/Contents/Resources/app.asar | grep -i "opencode" | head
```

目标是用户可见的 OpenCode 标识为 0。

### 5.4 保留必要内部兼容

如果某些 OpenCode 底层协议/插件机制必须保留，例如：

- 本地服务协议；
- Provider SDK；
- 插件加载协议；

可以保留内部技术名称，但不应出现在用户界面、安装包、帮助文档、错误提示中。

---

## 6. 推荐改造顺序

### 第一批：产品外壳

- 应用名、图标、窗口标题
- 关于页、欢迎页
- 安装包名称
- 本地服务名称
- 更新源

### 第二批：用户身份与账户中心

- 登录
- 用户信息
- 密钥管理
- 分组/模型
- 用量

### 第三批：模型运行时收敛

- 固定 XPeach Provider
- 隐藏其它 Provider
- 自动配置默认模型

### 第四批：清理残留

- 移除/禁用 CLI、TUI、官方链接
- 移除官方自动更新
- i18n 品牌字符串全面替换
- 构建产物字符串检查

### 第五批：项目精简

- 裁剪官方 Console/TUI/CLI/Stats 等包
- 统一内部命名
- 建立自己的发布流水线

---

## 7. 技术风险与应对

| 风险 | 应对 |
|---|---|
| 全量替换导致功能损坏 | 分批替换，每批跑测试 |
| OpenCode 上游更新冲突 | 改动集中在产品层；维护 patch 清单 |
| 内部包名改名导致依赖断裂 | 后期再做，先做用户可见层 |
| 去除 Provider 后模型调用失败 | 确保 XPeach Provider 自动配置完整 |
| 自动更新错误指向官方 | 立即禁用官方更新，或改为内部更新 |
| Token 泄露 | safeStorage + 最小权限 + 不写日志 |
| 用户仍然看到 CLI/TUI 残留 | 从桌面端入口、菜单、文档、快捷方式全部清理 |

---

## 8. 结论

工程上：

- 复用 OpenCode Desktop，不重写；
- 把 OpenCode 作为内部引擎；
- 产品层独立为 XPeachCodes；
- 改动集中在产品层，保留升级能力。

技术上：

- Electron Main 负责安全存储和 New API 调用；
- SolidJS Renderer 负责用户界面；
- 本地 OpenCode 服务负责模型能力；
- 不修改生产 New API；
- 第一阶段用户粘贴一次 Access Token，后续全部自动；
- 后期可通过独立认证桥实现完全自动登录。

去 OpenCode 化：

- 优先清除所有用户可见品牌；
- 其次移除官方功能入口；
- 再次清理构建产物；
- 最后才考虑内部包名和项目精简。

这个路线可以保证：

- 用户只看到 XPeachCodes；
- 不暴露 OpenCode 官方品牌；
- 不修改生产服务端；
- 功能可控、可维护、可升级。
