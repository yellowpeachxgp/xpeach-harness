### 主要变更

- **全链路性能与深水区体验优化**：
  - **中转网关预扣费与 403 错误精准识别**：将默认单次请求 `maxTokens` 上限收敛至 `32768`，避免因默认携带 `65536` / `128000` 导致余额较低时触发 New API 网关 HTTP 403「预扣费额度失败」；精准识别中文额度不足与分组无可用渠道报错（不再误判为「API 密钥无效」），并自动弹出余额充值引导。
  - **LLM 流守卫与模型能力画像校准**：修复未登录/令牌停用时 `guardLlmStream` 的 `StreamChunk` 结构，统一 4 处模型元数据表，并为 `deepseek-v3/r1`、`qwen3-coder` 等纯文本模型正确启用图片转路径降级。
  - **启动提速、后台轮询收敛与零冗余写盘**：对 `runSyncModelCatalog` 增加深度相等比对（目录无变更时不再重写 `settings.yml` 或重建适配器），消除每 20s 重复写盘 6 份 `xpeach.sso.json` 与启动双倍凭据同步，为 `raw.githubusercontent.com` 模型元数据与令牌信息增加内存 TTL 与非阻塞刷新，并在窗口隐藏时自动暂停前端轮询。
  - **CJK 字体包按需加载（首屏节省 1.15MB–2.6MB）**：将内置苹方与微软雅黑 `.woff2` 字体包独立为按需字体族别名，仅在用户主动选中对应字体包时加载，默认情况直接命中系统原生字体（0 KB 额外下载）。
  - **macOS `.pkg` 完整安装包与自动更新 `latest*.yml` 修复**：修复 macOS `.pkg` 构建对 `xpeach-harness.app` 的识别以打入完整 Electron 应用，为 GitHub Release 的 `latest*.yml` 与 `<channel>*.yml` 自动补齐平台文件名前缀并保留 `sha512` 校验，同时将 CI 三端打包耗时缩短约 8–10 分钟。
  - **暗色模式、通用设置去重与品牌文案清零**：合并「设置 → 通用」中重复的更新检查组件，修复暗色模式下调色盘预览与概览卡片对比度，校准模型集市 `高推理`/`多模态` 标签，并全面清理残留旧品牌文案。
- **内置离线字体包与字体选择器**：内置 16 个离线 `.woff2` 字体文件（含**苹方 PingFang SC**、**微软雅黑 Microsoft YaHei**、**Inter**、**Plus Jakarta Sans**、**Montserrat**、**Lora**、**JetBrains Mono**、**Fira Code**），并在「设置 → 通用 → 界面与代码字体包」提供 8 组界面字体预设卡片、4 组代码等宽字体胶囊、中英双语实时排版预览与自定义字体栈输入。
- **三端系统弹窗通知**：适配 macOS / Windows / Linux 桌面端与本地守护进程原生系统通知，覆盖任务完成、工具授权确认、等待选择与输入、方案待确认及异常中断场景，支持点击通知唤醒窗口直达对应会话，并提供应用内悬浮通知卡、柔和提示音与通用设置开关。
- **SSO 登录与跨通道更新**：统一使用 `sso.xpeach.codes` 授权登录并自动绑定令牌；设置中支持 `least`（正式版）、`beta`（测试版）、`alpha`（内测版）更新通道切换与向下兼容接收更新。

### 安装说明

- **macOS (Apple Silicon)**：下载 `macos-xpeach-harness-*-arm64-unsigned.dmg` 或 `.pkg`。
- **Windows (x64)**：下载 `windows-xpeach-harness-*-x64-unsigned.exe`。
- **Linux (x86_64)**：下载 `linux-xpeach-harness-*-x86_64-unsigned.AppImage`。
