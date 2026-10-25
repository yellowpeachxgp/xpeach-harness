# XPeachCodes 桌面端完整规划

> 基于 OpenCode Desktop 改造成面向普通用户的 XPeachCodes 桌面应用。  
> 不修改生产环境 New API，所有用户身份、密钥、分组、模型、用量管理都在客户端完成。  
> 终端 CLI 不作为用户入口，用户只使用桌面 GUI。

---

## 1. 项目定位

### 1.1 我们做的是什么

XPeachCodes 不是给开发者用的 CLI 工具，而是一个**开箱即用的 AI 桌面客户端**：

- 用户安装后打开桌面应用；
- 登录 XPeach / New API 账号；
- 自动获取或创建自己的 New API 令牌；
- 在桌面端管理个人信息、API 密钥、分组、模型、用量；
- 直接在桌面端使用 AI 模型；
- 不需要命令行。

### 1.2 核心约束

- **不能修改生产环境 New API**；
- 全部依赖 New API 现有 HTTP 接口；
- 不做独立 Web 仪表盘；
- 用户身份/账户中心内置于 XPeachCodes 桌面客户端。

### 1.3 一句话架构

```text
XPeachCodes 桌面端（Electron + SolidJS + OpenCode 内核）
    │
    ├── 用户身份模块
    ├── New API 客户端 API
    ├── 密钥管理
    ├── 模型管理与调用
    └── 本地安全存储
```

---

## 2. 技术基础

现有 OpenCode 仓库已经包含桌面端：

| 包 | 作用 |
|---|---|
| `packages/desktop` | Electron 桌面壳、主进程、窗口、IPC、自动更新 |
| `packages/app` | SolidJS Web 应用，桌面端实际渲染的 UI |
| `packages/opencode` | OpenCode 本地服务端、CLI 逻辑、账户服务 |
| `packages/core` | 核心模型/Provider/会话能力 |
| `packages/tui` | 终端 UI（本项目用户不需要，但内部可保留） |

我们将基于这些代码做品牌化和功能扩展，不重写整个项目。

---

## 3. 整体用户流程

### 3.1 首次使用

```text
安装 XPeachCodes
    ↓
打开桌面应用
    ↓
进入 XPeach 登录页
    ↓
获取/输入自己的 New API Access Token
    ↓
验证身份
    ↓
进入主界面
```

### 3.2 日常使用

```text
打开 XPeachCodes
    ↓
自动加载账户信息
    ↓
自动配置 XPeach Provider 和可用模型
    ↓
用户直接开始对话/使用模型
    ↓
用户可以在“账户中心”查看和管理自己的所有信息
```

---

## 4. 桌面端功能模块

### 4.1 身份登录模块

#### 功能

- 首次启动登录引导；
- 支持粘贴 New API 用户 Access Token；
- 校验 Token 是否有效；
- 保存登录状态；
- 支持退出登录；
- 支持 Token 失效后重新登录；
- 显示当前登录用户。

#### 为什么不能完全自动登录

New API 原生没有 OpenCode 设备码登录接口，且密码登录启用了 Turnstile。  
在“不修改服务端”的前提下，首次需要一个“获取 Access Token”的网页动作。

桌面端可以：

- 一键打开 New API 的 Token 页面；
- 显示图文引导；
- 用户复制后粘贴到应用输入框；
- 应用后续全部自动。

#### 后续可选增强

如果以后允许部署一个**独立的轻量认证桥**（不修改 New API）：

```text
用户点击登录
    ↓
桌面端打开浏览器授权页
    ↓
用户在新页面登录 New API
    ↓
认证桥自动获取用户管理令牌
    ↓
回传给 XPeachCodes
```

这样可以把“粘贴 Token”也自动化。

---

### 4.2 个人信息 / 账户概览

展示：

- 用户名 / 显示名
- 邮箱
- 用户分组
- 当前额度
- 已用额度
- 请求次数
- 邀请码 / 邀请人数（可选）
- 账号状态

#### 数据来源

```text
GET https://xpeach.codes/api/user/self
```

---

### 4.3 API 密钥管理

这是核心功能之一，让用户不需要去网页管理密钥。

#### 功能

- 查看自己的所有 New API 令牌；
- 显示令牌名称、分组、额度、状态、是否无限额度；
- 查看完整 `sk-` Key；
- 一键复制；
- 创建新令牌；
- 重命名令牌；
- 修改令牌分组 / 额度 / 模型限制；
- 删除令牌；
- 将某个令牌设为 XPeachCodes 当前使用的模型令牌。

#### 数据来源

```text
GET    /api/token
POST   /api/token
PUT    /api/token
DELETE /api/token/:id
POST   /api/token/:id/key
```

#### 安全要求

- 创建/删除/修改前二次确认；
- 完整 Key 默认隐藏，点击显示/复制；
- 不在日志中打印 Key；
- 不使用管理员 Token 作为普通用户身份。

---

### 4.4 分组与模型模块

展示：

- 当前用户可用的分组；
- 每个分组的倍率/说明；
- 每个分组可用模型；
- 当前账户可用的全部模型；
- 模型搜索/筛选；
- 可设置默认模型。

#### 数据来源

```text
GET /api/user/groups
GET /api/user/models
GET /api/models
```

---

### 4.5 用量与日志模块

展示：

- 当前剩余额度、已用额度；
- 最近调用日志；
- 按模型/密钥/时间筛选；
- 请求次数、Token 用量、花费积分；
- 用量趋势（可选）。

#### 数据来源

```text
GET /api/log/self
GET /api/log/self/stat
GET /api/user/self
```

---

### 4.6 模型调用模块

登录后，桌面端自动配置模型 Provider：

```json
{
  "provider": {
    "xpeach": {
      "npm": "@ai-sdk/openai-compatible",
      "api": "https://xpeach.codes/v1",
      "options": {
        "apiKey": "sk-用户选择或自动创建的令牌"
      }
    }
  }
}
```

用户可以在模型选择器里选择：

- 默认模型；
- 小模型；
- 会话模型。

模型列表直接来自用户账户可用的 New API 模型。

---

## 5. 技术实现规划

### 5.1 推荐模块划分

#### 主进程（Electron Main）

新增模块：

```text
packages/desktop/src/main/xpeach/
├── xpeach-store.ts          // 加密存储
├── xpeach-api.ts            // 调用 New API 管理接口
├── xpeach-auth.ts           // 登录/Token 校验/退出
└── xpeach-ipc.ts            // 暴露给渲染进程的 IPC
```

主进程负责：

- 持有加密后的用户凭据；
- 直接请求 `https://xpeach.codes/api/*`；
- 避免渲染进程直接接触敏感 Token；
- 将结果通过 IPC 返回 UI。

#### 渲染进程（SolidJS App）

新增：

```text
packages/app/src/xpeach/
├── context/
│   └── xpeach.tsx           // 全局状态
├── pages/
│   ├── Login.tsx
│   ├── AccountHome.tsx
│   ├── Keys.tsx
│   ├── Models.tsx
│   └── Usage.tsx
├── components/
│   ├── KeyList.tsx
│   ├── KeyCreateDialog.tsx
│   ├── KeyDetailDialog.tsx
│   ├── ModelList.tsx
│   └── UsageChart.tsx
└── hooks/
    └── use-xpeach.ts
```

#### Preload

在 `packages/desktop/src/preload/` 暴露：

```ts
window.xpeach = {
  login: (token) => Promise<...>,
  logout: () => Promise<void>,
  getProfile: () => Promise<...>,
  listKeys: () => Promise<...>,
  createKey: (input) => Promise<...>,
  getKey: (id) => Promise<...>,
  updateKey: (input) => Promise<...>,
  deleteKey: (id) => Promise<...>,
  getGroups: () => Promise<...>,
  getModels: () => Promise<...>,
  getUsage: () => Promise<...>,
}
```

---

### 5.2 本地凭据存储

使用 Electron：

```ts
import { safeStorage } from "electron"
```

- 用 `safeStorage` 加密用户 Access Token；
- 密文写入 `electron-store` 或独立文件；
- 普通 New API `sk-` 模型令牌可以：
  - 同时加密存储在 XPeach 模块；
  - 或者交给 OpenCode 本地 Auth 存储供模型运行时使用。

禁止：

- 明文写入日志；
- 明文写入配置文件；
- 把 Token 暴露给第三方。

---

### 5.3 本地 OpenCode 配置自动化

登录并选定 Key 后，桌面端通过现有 OpenCode 本地服务 API 更新配置：

- 写入或更新 `xpeach` Provider；
- 写入可用的模型列表；
- 设置默认模型；
- 如果 Key 被删除，自动检测并提示重新选择。

可以使用现有：

```text
serverSync.updateConfig(...)
```

或者 OpenCode 本地 Auth API：

```text
auth.set("xpeach", { type: "api", key: "sk-..." })
```

---

### 5.4 品牌化

需要改造：

- 应用名称：`XPeachCodes`
- 应用 ID：自定义，如 `codes.xpeach.desktop`
- 图标：XPeach 品牌图标
- 启动页 / 欢迎页
- 主界面 Logo、标题
- 设置页文案
- Provider 显示名称：`XPeach`
- 关于页 / 版本信息
- 自动更新地址：如果自建更新服务，则指向自己的发布地址

---

## 6. New API 接口清单

以下是桌面端会直接调用的 New API 接口，全部为现有接口，不需要修改服务端。

### 6.1 身份

| 接口 | 用途 |
|---|---|
| `GET /api/user/self` | 获取当前用户信息 |
| `GET /api/user/token` | 生成/获取用户 Access Token |
| `GET /api/status` | 获取站点基础状态 |

### 6.2 密钥

| 接口 | 用途 |
|---|---|
| `GET /api/token` | 获取当前用户令牌列表 |
| `POST /api/token` | 创建新令牌 |
| `GET /api/token/:id` | 获取令牌详情 |
| `PUT /api/token` | 更新令牌 |
| `DELETE /api/token/:id` | 删除令牌 |
| `POST /api/token/:id/key` | 获取完整 Key |

### 6.3 模型与分组

| 接口 | 用途 |
|---|---|
| `GET /api/user/groups` | 获取用户可用分组 |
| `GET /api/user/models` | 获取用户可用模型 |
| `GET /api/models` | 获取站点模型目录 |

### 6.4 用量与日志

| 接口 | 用途 |
|---|---|
| `GET /api/log/self` | 获取当前用户调用日志 |
| `GET /api/log/self/stat` | 获取当前用户用量统计 |
| `GET /api/data/self` | 获取当前用户日期用量（可选） |

---

## 7. 分阶段实施计划

### Phase 0：基础准备

- [ ] Fork OpenCode 仓库，建立 XPeachCodes 分支。
- [ ] 安装依赖，跑通 `packages/desktop` 开发环境。
- [ ] 跑通桌面端构建和打包。
- [ ] 确认 New API 各接口字段和权限。
- [ ] 准备测试账号和测试 Token。

### Phase 1：身份模块 MVP

- [ ] 在桌面端加入登录页。
- [ ] 支持粘贴 Access Token 登录。
- [ ] 调用 `/api/user/self` 验证并展示用户信息。
- [ ] 使用 `safeStorage` 加密保存 Token。
- [ ] 支持退出登录。
- [ ] 完成品牌化初步改名。

### Phase 2：密钥管理

- [ ] 实现密钥列表页。
- [ ] 实现创建密钥。
- [ ] 实现查看/复制完整 Key。
- [ ] 实现删除密钥。
- [ ] 实现选择“当前使用密钥”。
- [ ] 自动配置 XPeach Provider。
- [ ] 验证模型可以正常调用。

### Phase 3：账户中心完整版

- [ ] 用户信息卡片。
- [ ] 分组与模型页面。
- [ ] 用量与日志页面。
- [ ] 密钥编辑（重命名、改分组、改额度/模型限制）。
- [ ] 各种异常状态处理。
- [ ] 模型列表自动同步。

### Phase 4：体验打磨

- [ ] 首次启动引导。
- [ ] 登录后自动进入主界面。
- [ ] 密钥过期/失效自动提示。
- [ ] 模型选择优化。
- [ ] 多语言支持（中英文）。
- [ ] 隐藏/移除其它 Provider 入口，只保留 XPeach。

### Phase 5：打包与发布

- [ ] macOS 签名/公证。
- [ ] Windows 签名。
- [ ] Linux AppImage/deb/rpm。
- [ ] 自更新机制。
- [ ] 安装包/下载页。
- [ ] 发布渠道：网站、GitHub Release 等。

### Phase 6（可选）：完全自动登录

- [ ] 部署独立轻量认证桥（不改 New API）。
- [ ] 实现设备码/浏览器授权。
- [ ] 桌面端自动获取管理 Token。
- [ ] 替换“粘贴 Token”为“一键授权”。

---

## 8. 安全设计

### 8.1 Token 安全

- 用户 Access Token 只允许：
  - 加密存储；
  - 通过 Electron IPC 在主进程使用；
  - 不发送到渲染进程。
- 渲染进程只接收脱敏数据。
- 不在 UI 中默认显示完整 Token。

### 8.2 权限控制

- 普通用户只能管理自己的信息；
- 不保存管理员 Token；
- 如果检测到用户是管理员，不能将管理员权限暴露给普通功能。

### 8.3 操作安全

- 删除/修改密钥需要二次确认；
- 创建密钥后显示完整 Key 一次，之后隐藏；
- 日志脱敏，不记录 Token / Key；
- 支持一键退出并清除本地凭据。

### 8.4 审计

- 在本地记录敏感操作日志，供排查；
- 不记录敏感字段。

---

## 9. 测试计划

### 9.1 单元测试

- XPeach API Client 的请求/响应解析；
- Token 加密存储；
- 密钥创建/更新/删除逻辑；
- 错误码处理；
- IPC 接口。

### 9.2 集成测试

- 登录 → 获取用户信息；
- 登录 → 创建密钥 → 配置模型 → 调用模型；
- 删除密钥 → 提示重新选择；
- Token 失效 → 引导重新登录。

### 9.3 多平台测试

- macOS（Apple Silicon / Intel）
- Windows（x64）
- Linux（x64 / ARM）

### 9.4 安全测试

- 不泄露 Token；
- 本地文件加密；
- 敏感操作确认；
- 权限最小化。

---

## 10. 风险与应对

| 风险 | 应对 |
|---|---|
| New API 接口变更 | 将 API Client 集中封装，接口变更只改一个模块 |
| 首次 Token 获取需要网页 | 提供清晰引导；后续可加认证桥 |
| 用户误用管理员 Token | 检测角色/权限，明确警告，功能上限制为普通用户操作 |
| Token 本地泄露 | safeStorage 加密，最小权限，不写入日志 |
| OpenCode 上游更新 | 尽量少改核心，维护 patch，定期 merge |
| 桌面端打包签名复杂 | 预留签名/公证流程，先出内测版 |
| 服务器不改导致无法设备码登录 | 接受“首次粘贴 Token”，后续可选认证桥 |

---

## 11. 待确认问题

1. **桌面端名称和品牌**
   - 正式名称：XPeachCodes？
   - 图标、主色调、启动页素材。
2. **发布渠道**
   - 是否自建更新服务器？
   - 是否上架 GitHub Release / 官网下载？
3. **Access Token 获取入口**
   - 是否允许用户从网页复制？
   - 是否需要在应用内打开特定 New API 页面？
4. **是否接受后续加轻量认证桥**
   - 若接受，可做全自动浏览器授权登录。
5. **模型 Key 策略**
   - 自动为每个用户创建一个专用 Key？
   - 还是让用户选择已有 Key？
6. **截图/隐私/合规**
   - 是否需要用户协议、隐私说明？

---

## 12. 总结

XPeachCodes 桌面端将是：

- 一个普通用户能直接使用的 AI 客户端；
- 内置 XPeach 用户身份模块；
- 所有账户/密钥/模型/用量管理都在 GUI 内完成；
- 不修改生产 New API；
- 不需要用户碰命令行；
- 可以后续演进为全自动浏览器授权登录。

这是一个可行的、低服务端依赖的完整产品方案。
