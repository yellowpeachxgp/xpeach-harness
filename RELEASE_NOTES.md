### 主要变更

- **全链路稳定性与体验修复**：
  - **首启模型目录与默认模型自愈**：预置 `xpeach/swe-2-max` 初始模型目录，自动对账修复失效的默认模型与推理档位（`reasoningEffort`），并在模型列表或端点原地更新时实时通知前端与会话控制器。
  - **SSO 登录与令牌绑定闭环**：SSO 授权桥接自动应用下发的 `baseUrl`、在缺少可用令牌时自动签发 `xph-auto` 令牌，并同时广播 `XPEACH_API_KEY` 与 `XPEACH_RELAY_KEY` 凭据更新事件；支持无 `xdg-open` 环境下自动回退浏览器弹窗。
  - **引导弹窗防死锁与便捷跳过**：将 XPeach 引导弹窗挂载至独立 `document.body` Portal 并屏蔽旧版引导争用，新增右上角关闭与「稍后配置」跳过入口，设置页重开登录时采用独立精简模式。
  - **三端系统通知精准防打扰**：修复 Electron 桌面端点击通知跳转会话的参数解析，当前正在聚焦查看目标会话时自动静默系统弹窗与音效，避免历史会话与后台子代理误触通知。
  - **字体包全局覆盖与主题色板保持**：移除对话输入框（Composer）与排队栏硬编码字体前缀，补齐 Web 静态服务 `.woff2` MIME 类型，切换浅色/深色模式时自动保留当前选中的主题色板。
  - **跨通道自动更新与 `xph` CLI 增强**：修复 `least` / `beta` / `alpha` 跨通道升级时 `electron-updater` 通道标签校验，接入主进程「自动检查更新」偏好开关；完善 `xph` CLI 参数路由、Web 搜索默认中转网关与 `.xph/skills` 技能自动发现。
- **内置离线字体包与字体选择器**：内置 16 个离线 `.woff2` 字体文件（含**苹方 PingFang SC**、**微软雅黑 Microsoft YaHei**、**Inter**、**Plus Jakarta Sans**、**Montserrat**、**Lora**、**JetBrains Mono**、**Fira Code**），并在「设置 → 通用 → 界面与代码字体包」提供 8 组界面字体预设卡片、4 组代码等宽字体胶囊、中英双语实时排版预览与自定义字体栈输入。
- **三端系统弹窗通知**：适配 macOS / Windows / Linux 桌面端与本地守护进程原生系统通知，覆盖任务完成、工具授权确认、等待选择与输入、方案待确认及异常中断场景，支持点击通知唤醒窗口直达对应会话，并提供应用内悬浮通知卡、柔和提示音与通用设置开关。
- **SSO 登录**：统一使用 `sso.xpeach.codes` 授权登录，登录后自动绑定令牌并持久化保存本地配置。
- **更新通道**：设置中新增 `least`（正式版）、`beta`（测试版）、`alpha`（内测版）更新通道切换，支持向下兼容接收更新。

### 安装说明

- **macOS (Apple Silicon)**：下载 `macos-xpeach-harness-*-arm64-unsigned.dmg` 或 `.pkg`。
- **Windows (x64)**：下载 `windows-xpeach-harness-*-x64-unsigned.exe`。
- **Linux (x86_64)**：下载 `linux-xpeach-harness-*-x86_64-unsigned.AppImage`。
