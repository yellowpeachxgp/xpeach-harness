# 代码库风险与关注项

## 1. 优先级风险

| 严重度 | 问题 | 证据 | 影响 |
|---|---|---|---|
| 高 | 工作树有 1625 M、920 D、57 untracked，共 2602 条状态项 | git status、git diff --stat | 无法归因到稳定提交，回滚/审查困难 |
| 高 | HEAD 仍是 OpenCode，XPeach 迁移主要未提交 | HEAD tree 与工作树 | 远端无法从 HEAD 重建当前产品候选 |
| 高 | v2 CLI sidecar 缺少 xpeachcodes-cli；v1 sidecar.js 只在 asar 内静态存在 | desktop dist、prebuild、background-cli | Desktop 可能没有可用本地服务 |
| 高 | 账户登录与模型 credential 没有闭环证据 | App account UI、XPeach Provider plugin | 登录成功不代表模型可用 |
| 高 | /openapi.json 真实 500，而 /doc 正常 | 本地 curl、两套路由配置 | SDK/代码生成可能选错入口 |
| 中 | 根 lint 非绿 | 1 error、约 4895 warnings | CI/发布风险，信号被噪声淹没 |
| 中 | 核心测试有 6 fail、22 skip、1 todo | packages/xpeachcodes test | 配置、CORS、SDK、生命周期仍有回归 |
| 中 | Dockerfile、stats Dockerfile、锁文件仍有旧名称 | 静态 rg | 发布镜像/独立包高概率漂移 |
| 中 | Bun 版本不匹配 | package.json 与 bun --version | build/version 脚本直接失败 |

## 2. 已确认的功能缺口

- XPeach Client 没有完整覆盖规划中的 status、models 全目录、data/self 和 token detail；updateToken 没有暴露到 Session、IPC、Preload、UI。
- 账户页目前能显示 profile、Token、分组、模型和 usage，能创建仅含名称的 Token、复制 Key、删除 Token，但没有完整的编辑、日志页、筛选、趋势和当前使用 Key 配置。
- 规划中的 window.xpeach 与实际 Preload 暴露的 window.api.xpeach 不一致；仅有类型声明不能创建运行时对象。
- 登录页被 Desktop 的 sidecar 初始化和 AppInterface/ConnectionGate 包围，sidecar 失败时不能作为独立恢复入口。
- 其它 Provider、Custom Provider 和 XPeachCodes Go 仍在 UI 列表，尚未达到“只保留 XPeach”的规划要求。
- Electron safeStorage 不可用时使用 Base64 fallback；这不是加密。

## 3. 发布/规格漂移

- packages/xpeachcodes/Dockerfile 仍指向旧的 dist/opencode.../bin/opencode 路径。
- packages/stats/server/Dockerfile 仍使用 @opencode-ai/stats-server，而当前包名是 @xpeachcodes/stats-server。
- packages/tui 仍直接依赖 @xpeachcodes/core，与 TUI 拆包规格声称的边界冲突。
- xpeachcodes package.json 保留 #db 映射，但对应 src/storage/db.bun.ts 和 db.node.ts 不存在。
- App vendor client 为 1.17.13，而主要 workspace 版本为 1.18.25，兼容性未验证。
- Web docs、快照、独立锁文件和部分工作流仍有 OpenCode 名称；不能宣称品牌残留为零。

## 4. 脆弱区域

packages/app/src 受 UI 规模、V1/V2 共存和大规模品牌改动影响；packages/xpeachcodes/src/server 同时组装 legacy/V2/OpenAPI/Effect Layer；packages/core/src/session 涉及 durable event、runner、tool loop；packages/desktop/src/main 涉及 Electron/sidecar/OS 差异；包名和目录迁移涉及大量 delete/add。安全策略应是先拆迁移提交，再用最小真实 HTTP/GUI 复现逐项修复。

## 5. [ASK USER] 未决问题

1. 工程基线以当前未提交工作树为候选，还是先建立可提交、可回滚的迁移基线？
2. 模型调用权威凭据是 Access Token、用户选择的 New API sk-Key，还是 Console/Provider 自动下发 credential？
3. CLI/TUI/多 Provider 是内部保留但隐藏，还是从发行包裁剪？
4. 对外 OpenAPI 入口是 /doc、/openapi.json，还是要求二者兼容？
5. Console、stats、enterprise 是否属于产品发布范围？
6. 是否授权下一步使用专门测试账号执行真实登录、Key 管理和模型请求验收？本轮未使用真实凭据。

## 6. 证据

- docs/codebase/.codebase-scan.txt
- git status、git diff --stat、git diff --check
- packages/desktop/dist/、packages/desktop/out/、Desktop prebuild/download 脚本
- packages/xpeachcodes/test/ 专项失败和全测输出
- App/IPC/Provider/Docker/Nix/锁文件静态核对
