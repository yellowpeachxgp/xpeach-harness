# XPeachCodes 项目交接文档（给 Codex / 后续继承者）

> 本文档用于让后续 AI/开发者完整继承当前任务。
> 当前阶段：已完成大规模品牌重构与桌面打包，但 **macOS 桌面应用启动存在运行时错误，尚未定位根因**。

---

## 1. 项目位置与当前状态

### 仓库路径

```text
/Volumes/SN 770/Developer/XPeachCodes/opencode
```

### 当前分支/工作区

- 工作区有大量未提交改动，约 2500+ 文件变更。
- 尚未 commit。
- 改动包括：包名重命名、目录重命名、品牌替换、新增 XPeach 模块与 UI、IPC/Preload、图标资源、构建脚本调整。

### 重要背景

- 上游原项目：OpenCode（sst/opencode 系）。
- 目标：改造成 **XPeachCodes** 桌面客户端，面向 XPeach/New API 用户。
- 约束：**不修改生产 New API**。
- 用户不希望依赖 CLI，产品形态是桌面端。

---

## 2. 已完成的工作

### 2.1 全量内部重命名

- `@opencode-ai/*` → `@xpeachcodes/*`
- `OPENCODE_*` → `XPEACH_*`
- `opencode.json` / `opencode.jsonc` → `xpeachcodes.json` / `xpeachcodes.jsonc`
- 目录：
  - `packages/opencode` → `packages/xpeachcodes`
  - `.opencode` → `.xpeachcodes`
  - `bin/opencode` → `bin/xpeachcodes`
- 代码标识符：
  - `OpenCode` → `XPeachCodes`
  - `Opencode` → `XPeachCodes`
  - `openCode` → `xpeachCodes`
  - `opencode` → `xpeachcodes`
- 移除了旧品牌第三方依赖：
  - `opencode-gitlab-auth`
  - `opencode-poe-auth`
  - `@gitlab/opencode-gitlab-auth`

### 2.2 核心 XPeach 模块

新增独立可测试模块：

```text
packages/xpeach/
├── src/client.ts       New API 客户端
├── src/storage.ts      AES-256-GCM 加密存储
├── src/session.ts      会话管理
├── src/types.ts        类型
├── src/index.ts
└── test/               单元测试
```

- 测试：18/18 通过
- 类型检查：通过
- 可独立构建

### 2.3 IPC / Preload / 安全存储

```text
packages/desktop/src/main/xpeach/
├── xpeach-ipc.ts
└── xpeach-secure-store.ts

packages/desktop/src/preload/
├── index.ts
└── types.ts
```

- `ElectronSecureStore` 使用 Electron `safeStorage` 加密。
- `window.xpeach` 已通过 contextBridge 暴露。
- 主进程已注册 XPeach IPC。

### 2.4 UI 页面

```text
packages/app/src/xpeach/
├── branding.ts
├── types.ts
├── assets/xpeachcodes-logo.svg
├── components/ui.tsx
└── pages/
    ├── login.tsx
    └── account.tsx
```

已接入路由：

```text
/xpeach/login
/xpeach/account
```

### 2.5 品牌视觉与元数据

- 已生成并替换：
  - `packages/desktop/icons/prod|dev|beta`
  - `packages/app/public/favicon*`
  - `packages/app/public/apple-touch-icon*`
  - `packages/app/public/web-app-manifest*`
- 已更新：
  - `site.webmanifest`
  - Electron builder 配置
  - 应用名/App ID/协议
  - Linux desktop 入口
  - metainfo 脚本
  - i18n 品牌字符串

### 2.6 构建/打包结果

- `bun install`：成功
- `packages/xpeach` 单元测试：18/18 通过
- `packages/xpeach` typecheck：通过
- `packages/xpeachcodes` 类型检查：通过
- `packages/app` 类型检查：通过
- `packages/desktop` 类型检查：通过
- `packages/desktop` `bun run build`：成功（在本地以 `XPEACH_SKIP_CLI_DOWNLOAD=1` 跳过 CLI 下载时）
- macOS 打包成功：
  ```text
  packages/desktop/dist/xpeachcodes-mac-arm64.dmg
  packages/desktop/dist/xpeachcodes-mac-arm64.zip
  packages/desktop/dist/mac-arm64/XPeachCodes.app
  ```

---

## 3. 当前问题：macOS 桌面应用启动时报错

### 已确认现象

1. 使用 `open dist/mac-arm64/XPeachCodes.app` 启动后：
   - 主进程存在；
   - GPU/Network Helper 存在；
   - **没有看到 sidecar 子进程**；
   - **没有看到本地 HTTP 服务监听端口**。
2. 直接运行二进制：
   ```bash
   dist/mac-arm64/XPeachCodes.app/Contents/MacOS/XPeachCodes
   ```
   - 主进程存活；
   - stdout/stderr 没有输出明显错误。
3. 尝试 `--remote-debugging-port=9222`：
   - 端口未监听；
   - 原因：主进程代码中仅 `!app.isPackaged` 时才启用远程调试，打包版不会开启。
4. 尝试查看 Electron 日志：
   - `~/Library/Application Support/@xpeachcodes/desktop` 下只有 `Local State`，未发现日志文件。
   - `~/Library/Logs` 下未发现 XPeachCodes 日志。
5. 打包产物中缺少：
   ```text
   resources/xpeachcodes-cli
   ```
   因为构建时使用了 `XPEACH_SKIP_CLI_DOWNLOAD=1`，且重命名后的 `@xpeachcodes/cli-*` npm 包尚未发布。

### 疑似原因

- **最可能**：桌面 App 侧车/本地服务未能启动。
  - v2 路径 `startBackgroundCli` 依赖 `resources/xpeachcodes-cli`，但该文件不存在。
  - v1 路径依赖 `out/main/sidecar.js`，应随包存在，但需要进一步确认是否正常启动。
- 可能也受未签名/未 Gatekeeper 公证影响，但通常不会导致完全无日志。
- 需要看到实际 UI 报错文本才能确认。

---

## 4. 下一步排查方向

### 4.1 获取真实错误信息

1. **用视觉工具读取截图** `/tmp/xpeach-screen.png`。
2. **在开发模式下启动**：
   ```bash
   cd packages/desktop && bun run dev
   ```
3. **在打包版中开启远程调试**：
   - 修改 `packages/desktop/src/main/index.ts`，移除 `!app.isPackaged` 条件判断，重新 build/package。
4. **增加日志输出**，检查 `packages/desktop/src/main/logging.ts`。

### 4.2 补齐 CLI sidecar

当前构建跳过 CLI 下载，因为 `@xpeachcodes/cli-*` 未发布。

方案：

1. 发布重命名后的 `@xpeachcodes/cli-*` npm 包。
2. 本地构建 CLI 并放入 `packages/desktop/resources/xpeachcodes-cli`，然后重新打包。
3. 确认 v1 sidecar.js 是否已足够（检查 `dist/mac-arm64/XPeachCodes.app/Contents/Resources/out/main/sidecar.js` 是否存在）。

### 4.3 检查 v1 sidecar.js

- 源码：`packages/desktop/src/main/server.ts` fork `out/main/sidecar.js`。
- 确认打包后该文件存在且能被 utility process 加载。

---

## 5. 关键文件路径

| 用途 | 路径 |
|---|---|
| 桌面主进程 | `packages/desktop/src/main/index.ts` |
| 本地服务启动 | `packages/desktop/src/main/server.ts` |
| v2 CLI 后台 | `packages/desktop/src/main/background-cli.ts` |
| XPeach IPC | `packages/desktop/src/main/xpeach/xpeach-ipc.ts` |
| 安全存储 | `packages/desktop/src/main/xpeach/xpeach-secure-store.ts` |
| Preload 类型 | `packages/desktop/src/preload/types.ts` |
| Preload 实现 | `packages/desktop/src/preload/index.ts` |
| 核心包 | `packages/xpeachcodes/` |
| XPeach 模块 | `packages/xpeach/` |
| UI | `packages/app/src/xpeach/` |
| 构建脚本 | `packages/desktop/scripts/utils.ts` |
| 打包配置 | `packages/desktop/electron-builder.config.ts` |
| 打包产物 | `packages/desktop/dist/` |

---

## 6. 已验证命令

```bash
bun install
cd packages/xpeach && bun test --timeout 30000
cd packages/xpeach && bunx tsgo --noEmit
cd packages/xpeachcodes && bunx tsgo --noEmit
cd packages/app && bunx tsgo --noEmit
cd packages/desktop && bunx tsgo -b
cd packages/desktop && XPEACH_SKIP_CLI_DOWNLOAD=1 bun run build
cd packages/desktop && npx electron-builder --mac --config electron-builder.config.ts
```

---

## 7. 注意事项

- 当前环境 Bun 版本 `1.3.11`，项目要求 `1.3.14`。
- 曾临时降 `packageManager` 为 `1.3.11` 以验证桌面构建，已恢复 `1.3.14`。
- 当前打包产物：未签名、未公证、缺少 CLI sidecar，仅用于内部验证。

---

## 8. 交接结论

**已完成：**

- 品牌全量替换
- 内部重命名
- XPeach New API 客户端
- IPC / 安全存储
- UI 页面与路由
- 品牌图标与元数据
- 类型检查、单元测试、桌面构建、macOS 打包

**未完成/待解决：**

- 桌面应用启动运行时报错，根因未最终定位
- CLI sidecar 未打入产物
- 未在真实 GUI 中完成端到端人工验收
- 未签名/未公证/未发布

请后续继承者优先执行“获取真实错误信息”和“补齐 CLI sidecar”，然后重新打包并做完整功能验收。
