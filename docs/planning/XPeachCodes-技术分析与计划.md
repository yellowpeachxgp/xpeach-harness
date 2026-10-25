# XPeachCodes：基于 OpenCode 定制“一站式 AI 调用客户端”技术分析

## 1. 结论先行

OpenCode 本身已经内置了一套**控制台/账户（Console Account）体系**，不是只能让用户手动填 API Key。

- 通过 `opencode console login <url>` 可以登录一个远程控制台。
- 登录后，客户端会自动从该服务器拉取：
  - 用户信息
  - 组织/工作区信息
  - 远程配置（模型列表、Provider 地址、API Key 注入方式）
- 因此对你来说最省力、最稳妥的路线是：

> 把你的 **xpeach.codes 中转站** 实现成 OpenCode 兼容的“控制台服务端”，
> 并让定制版 OpenCode 默认只连接 xpeach.codes。

当前仓库已经拉取到：

```text
/Volumes/SN 770/Developer/XPeachCodes/opencode
```

上游为 `sst/opencode`（版本约为 `1.18.25`，`dev` 分支）。

---

## 2. 仓库关键目录

| 目录 | 作用 |
|---|---|
| `packages/opencode/src/cli/cmd/account.ts` | “控制台账户”CLI：login / logout / switch / orgs / open |
| `packages/opencode/src/account/` | 账户服务：设备码登录、token 刷新、用户/组织/远程配置拉取、SQLite 存储 |
| `packages/opencode/src/config/config.ts` | 加载远程配置，并注入 `OPENCODE_CONSOLE_TOKEN` |
| `packages/opencode/src/server/routes/instance/httpapi/...` | TUI 使用的控制台状态、组织切换接口 |
| `packages/opencode/src/cli/cmd/providers.ts` | 传统 Provider 登录：`opencode auth login` |
| `packages/core/src/plugin/provider/opencode.ts` | 新版 OpenCode Console Provider/Integration（插件化路线） |
| `packages/console/` | OpenCode 官方 Console 前端、Zen 模型网关、计费/Key 管理参考实现 |
| `packages/tui/src/component/dialog-provider.tsx` | TUI 中“连接 Provider”对话框 |

---

## 3. 现有 OpenCode 控制台账户链路

### 3.1 登录

用户执行：

```bash
opencode console login [url]
```

客户端会：

1. `POST {url}/auth/device/code`
   - 请求体：`{ "client_id": "opencode-cli" }`
   - 响应体：
     ```json
     {
       "device_code": "device-code",
       "user_code": "ABCD-1234",
       "verification_uri_complete": "https://xpeach.codes/device?user_code=ABCD-1234",
       "expires_in": 600,
       "interval": 5
     }
     ```
2. 打开浏览器/展示验证码。
3. 轮询 `POST {url}/auth/device/token`：
   - 请求体：`grant_type=urn:ietf:params:oauth:grant-type:device_code`
   - 成功：
     ```json
     {
       "access_token": "...",
       "refresh_token": "...",
       "token_type": "Bearer",
       "expires_in": 3600
     }
     ```
   - 等待中：`{"error":"authorization_pending"}`
   - 需要降速：`{"error":"slow_down"}`
   - 拒绝：`{"error":"access_denied"}`
   - 过期：`{"error":"expired_token"}`
4. 拉取用户和组织：
   - `GET {url}/api/user` → `{ "id": "...", "email": "..." }`
   - `GET {url}/api/orgs` → `[ { "id": "...", "name": "..." } ]`
5. 把账户写入本地 SQLite，默认激活第一个组织。

### 3.2 自动配置注入

每次启动实例时，`Config` 会：

1. 读取当前激活的 Console 账户和组织。
2. 请求：
   ```http
   GET {url}/api/config
   Authorization: Bearer <access_token>
   x-org-id: <org-id>
   ```
3. 期望响应：
   ```json
   {
     "config": {
       "model": "xpeach/gpt-4o",
       "provider": { ... }
     }
   }
   ```
4. 把返回的 `config` 合入全局配置。
5. 同时写入环境变量：
   ```text
   OPENCODE_CONSOLE_TOKEN=<access_token>
   ```
6. 所以远程 config 里可以使用：
   ```json
   {
     "provider": {
       "xpeach": {
         "options": {
           "apiKey": "{env:OPENCODE_CONSOLE_TOKEN}"
         }
       }
     }
   }
   ```
   客户端会自动把 `{env:OPENCODE_CONSOLE_TOKEN}` 替换为当前用户的 access token。

### 3.3 模型调用

实际请求模型时，客户端使用远程配置中给出的：

- `api` / `baseURL`：你的中转站地址
- `options.apiKey`：可以是：
  - 直接用账户 access token；
  - 或者由服务端在 `/api/config` 中下发一个专用的中转站 API Key。

---

## 4. 服务端需要实现的接口

这是整个项目最关键、也必须自己实现的部分。因为本仓库并没有包含 OpenCode 官方 Console 的服务端实现，只有客户端调用契约。

### 4.1 设备码登录

| 接口 | 说明 |
|---|---|
| `POST /auth/device/code` | 创建设备码，返回验证 URL |
| `POST /auth/device/token` | 轮询设备码授权结果；也用于 refresh_token 刷新 |

需要实现：

- 生成 `device_code`、`user_code`
- 保存 device session，支持过期
- 用户在你的站点登录后确认设备码
- 签发 access_token / refresh_token
- 支持 refresh_token 轮换/撤销

### 4.2 用户与组织

| 接口 | 说明 |
|---|---|
| `GET /api/user` | 返回当前用户 `{id, email}` |
| `GET /api/orgs` | 返回当前用户可用的组织/工作区 `[{id, name}]` |

### 4.3 远程配置

| 接口 | 说明 |
|---|---|
| `GET /api/config` | 返回 `{ config: OpenCode 配置 }`，需要读取 `x-org-id` |

一个可用的 `/api/config` 示例：

```json
{
  "config": {
    "model": "xpeach/gpt-4o",
    "small_model": "xpeach/gpt-4o-mini",
    "provider": {
      "xpeach": {
        "name": "XPeach",
        "npm": "@ai-sdk/openai-compatible",
        "api": "https://xpeach.codes/v1",
        "options": {
          "apiKey": "sk-你的真实中转站Key",
          "baseURL": "https://xpeach.codes/v1"
        },
        "models": {
          "gpt-4o": {
            "name": "GPT-4o",
            "limit": {
              "context": 128000,
              "output": 16384
            },
            "cost": {
              "input": 0,
              "output": 0
            }
          },
          "claude-sonnet-4": {
            "name": "Claude Sonnet 4",
            "limit": {
              "context": 200000,
              "output": 64000
            },
            "cost": {
              "input": 0,
              "output": 0
            }
          }
        }
      }
    }
  }
}
```

说明：

- 如果不想把真实 API Key 明文下发给客户端，也可以让中转站接受 `Authorization: Bearer <access_token>` 作为调用凭证，然后使用：
  ```json
  "apiKey": "{env:OPENCODE_CONSOLE_TOKEN}"
  ```
- 推荐做法：**中转站继续使用自己的 API Key 体系**，服务端在 `/api/config` 中按用户动态注入其专属 Key。这样：
  - 兼容你现有的中转站鉴权；
  - Key 可以单独吊销/轮换；
  - 账户 access token 只用于 OpenCode 账户管理，不用于模型调用。

---

## 5. 客户端定制方案

### 方案 A：最小改动，直接复用现有 Console Account 体系（推荐）

只需要把 OpenCode 默认指向你的站点，并做好服务端。

关键改动：

1. 修改默认登录地址：
   - `packages/opencode/src/cli/cmd/account.ts`
     ```ts
     export const defaultConsoleUrl = "https://xpeach.codes"
     ```
   - 如果站点接口挂在 `/console` 下，则：
     ```ts
     export const defaultConsoleUrl = "https://xpeach.codes/console"
     ```
   - `packages/core/src/plugin/provider/opencode.ts` 的 `defaultServer` 也同步修改。

2. 品牌/文案：
   - 把 `OpenCode Console`、`opencode.ai` 等文案改成 `XPeach` 相关。

3. 固定使用你的服务：
   - CLI 层：简化成 `opencode login`，不再允许用户输入任意 URL；或保留 URL 但默认值固定。
   - Provider 列表：隐藏/禁用其它 Provider，只保留 XPeach 远程 Provider。
   - TUI：进入未登录状态时直接引导登录 xpeach.codes。

4. 构建定制二进制：
   - 使用 `packages/opencode/script/build.ts` 构建当前平台或全平台二进制。
   - 通过你的站点/发布渠道分发。

### 方案 B：深度定制 Plugin/Integration（长期演进）

新增一个独立的 `xpeach` Provider Plugin，例如：

```text
packages/core/src/plugin/provider/xpeach.ts
```

实现：

- OAuth Device flow
- 从 `https://xpeach.codes/api/config` 拉取 Provider/Model Catalog
- 自动注入用户 Key
- 在 TUI 中显示为“XPeach 登录”

优点：

- 完全掌控登录、模型发现、配置注入、错误提示。
- 可以做成独立的 `@xpeach/opencode-plugin`，减少 fork 深度。

缺点：

- 开发量更大。
- 需要跟上 OpenCode 插件 API 变化。

---

## 6. 实施计划

### Phase 0：基础准备

- [ ] 在 fork 中确定维护基线。
- [ ] 本地跑通 `bun install` / `bun run --cwd packages/opencode dev --help`。
- [ ] 构建一次当前平台二进制，确认能跑。
- [ ] 确认 xpeach.codes 现有用户、Key、套餐、模型数据结构。

### Phase 1：服务端 OpenCode Console 兼容层

- [ ] 实现 `/auth/device/code`、`/auth/device/token`。
- [ ] 接入现有站点登录态来批准设备码。
- [ ] 实现 access/refresh token 的签发、过期、刷新、撤销。
- [ ] 实现 `/api/user`、`/api/orgs`。
- [ ] 实现 `/api/config`，根据用户和组织动态生成模型列表、Provider 地址、API Key。
- [ ] 用 curl 或临时脚本完整走通登录流程。

### Phase 2：客户端基础定制

- [ ] 修改默认登录地址为 `https://xpeach.codes`。
- [ ] 修改品牌/名称/欢迎文案。
- [ ] 修改 `opencode console login` 为更直接的一键登录入口。
- [ ] 构建并分发一个内测二进制。
- [ ] 验证：
  - 登录后自动拉取模型；
  - 请求真正打到 xpeach.codes；
  - 换组织/换套餐后配置能更新。

### Phase 3：一站式体验锁定

- [ ] 隐藏其它 Provider，只保留 XPeach。
- [ ] 启动时未登录直接进入 XPeach 登录引导。
- [ ] 处理 token 过期、重新登录、401 提示。
- [ ] 可能增加“查看当前 Key/套餐/用量”命令或界面。
- [ ] 移除/禁用上游自动升级，避免覆盖你的定制。

### Phase 4：发布与运维

- [ ] 建立自己的版本号与发布流程。
- [ ] 打各平台二进制包（macOS / Linux / Windows）。
- [ ] 提供安装脚本或 Homebrew tap / npm 包。
- [ ] 监控服务端登录、配置拉取、模型调用、错误率。
- [ ] 定期合并上游安全更新。

### Phase 5：高级能力（可选）

- [ ] 用户套餐/额度在客户端展示。
- [ ] 按组织/项目下发不同模型策略。
- [ ] 统计客户端用量并回传站点。
- [ ] 深度集成站点自身的 API Key 管理页。

---

## 7. 风险与注意点

1. **服务端设备码流程必须安全**
   - 设备码要短时有效。
   - 防止暴力枚举 `user_code`。
   - refresh token 最好轮换并支持撤销。

2. **不要把所有上游 Provider 的密钥下发给客户端**
   - 只下发用户有权使用的模型和对应 Key。
   - 中转站本身负责调用上游，客户端不应拿到上游厂商 Key。

3. **本地存储安全问题**
   - OpenCode 会把 Console token 存在本地 SQLite。
   - 需要确保文件权限，避免多用户机器泄露。

4. **架构存在新旧两套**
   - 当前代码里既有 `packages/opencode/src/account` 的老 Console 账户体系，也有 `packages/core/src/plugin/provider/opencode.ts` 的新插件/Integration 体系。
   - 定制时最好两处默认地址、品牌、入口都同步改，避免某些路径仍然连到官方。

5. **上游更新冲突**
   - 深度 fork 需要管理 upstream merge。
   - 尽量把改动集中在少量文件，例如：
     - 默认 URL 常量
     - 服务端接口兼容层
     - 品牌文案
     - Provider 过滤
   - 这样未来合并上游会更容易。

---

## 8. 已确认的接入路径

你已确认 OpenCode 应通过以下地址接入：

```text
https://xpeach.codes/console/auth/device/code
```

因此客户端默认服务器应设置为：

```text
https://xpeach.codes/console
```

我已经在源码中改好了两处默认值：

- `packages/opencode/src/cli/cmd/account.ts`
- `packages/core/src/plugin/provider/opencode.ts`

并同步更新了对应测试。

---

## 9. 建议的第一步

接入路径已经确认，下一步建议：

1. 在你的中转站后端实现：
   - `POST https://xpeach.codes/console/auth/device/code`
   - `POST https://xpeach.codes/console/auth/device/token`
   - `GET https://xpeach.codes/console/api/user`
   - `GET https://xpeach.codes/console/api/orgs`
   - `GET https://xpeach.codes/console/api/config`
2. 客户端默认地址我已经改为：
   ```text
   https://xpeach.codes/console
   ```
3. 服务端跑通后，构建一个内测二进制，验证：
   - 登录跳转到 xpeach.codes；
   - 自动拉取模型列表；
   - 请求打到你的中转站。

这样可以在不投入大量 UI/插件开发的情况下，先验证整个“一键登录 + 自动配置 + 中转调用”链路。
