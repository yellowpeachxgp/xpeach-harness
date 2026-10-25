# XPeach Harness

[English](README.md) | 中文

**XPeach Harness**（`xph`）是 [🍑Code](https://xpeach.codes) 中转站的桌面端与 Web 客户端——一个 OpenAI 兼容的中转站，用一个端点接住所有前沿模型，用一份账单算清每一次调用。

用站点的「系统访问令牌」绑定一次，工作台就活在你的中转额度里：Claude、GPT、DeepSeek 在同一个模型选择器里出现，每次调用都记进你的令牌用量，剩余额度一直显示在窗口角落。

## 你能得到什么

- **一个端点，全部模型。** `swe-2-max`、`gpt-6-astra`、`claude-opus-5`、`deepseek-v4-flash` 以及中转站目录里的其余模型，全部从 `/v1/models` 实时拉取——不需要手工维护清单。
- **只绑一次。** 粘贴站点「个人设置 → 系统访问令牌」里的 Access Token，应用会自己铸一把 `sk-` 中转令牌并保存好，对话、工具调用、后台任务都记在同一处。
- **额度看得见。** 角落的 🍑 胶囊显示剩余额度、今日消费和最近七天；点开是完整明细。
- **日志对得上账单。** 每次调用都记下模型、输入输出 token、耗时和时间。
- **线路会自己挑。** 三条中转线路持续探测，最快的胜出并自动切换，你不需要知道过程。
- **一切皆插件。** 智能体内核、工具、界面插槽、模型适配都是可组合的插件层，一个工作区可以只带你需要的那部分。

<a id="run"></a>
## 运行

### 桌面端

到 [Releases](https://github.com/yellowpeachxgp/xpeach-harness/releases) 下载对应平台的安装包：

| 平台 | 文件 |
|---|---|
| macOS（Apple 芯片） | `xpeach-harness-<version>-mac-arm64.dmg` |
| Windows（x64） | `xpeach-harness-<version>-win-x64.exe` |
| Linux（x64） | `xpeach-harness-<version>-linux-x64.AppImage` |

应用会自动更新：新版本在后台下载好，你退出时自动装上。

### 命令行

```sh
pnpm xph web
```

`xph` 把数据放在 `~/.xph`，与机器上其他任何 harness 安装完全分开——会话、凭据、设置、日志都是。

## 第一次使用

1. 打开应用，工作台停在欢迎页。
2. 粘贴站点 Access Token。**令牌只保存在本机**，不会上传。
3. 选择这把中转令牌要服务的模型分组（SWE、GPT、Claude、DeepSeek…）。
4. 新建会话。选择器里会列出你的令牌能调用的全部模型。

如果你之前用过别的 harness，可以把旧对话**一次性、单向、只读**地导入——**设置 → XPeach → 从 DeepSeek 导入对话**。

## 数据与隐私

| 内容 | 位置 |
|---|---|
| 会话、附件、设置 | `~/.xph` |
| 站点 Access Token | `~/.xph/profiles/xpeach/xpeach.admin`（0600） |
| 中转 `sk-` 令牌 | `~/.xph/profiles/xpeach/xpeach.key`（0600） |
| 线路状态 | `~/.xph/profiles/xpeach/xpeach.route.json` |

除了你发往中转站的请求，没有任何数据离开这台机器。

<a id="run-from-source"></a>
## 从源码构建

```sh
git clone https://github.com/yellowpeachxgp/xpeach-harness.git
cd xpeach-harness
pnpm install
pnpm run build
pnpm xph web
```

桌面端打包与发布流程见 [`packaging/README.zh.md`](apps/desktop/packaging/README.zh.md)。

## 社区

- 站点与控制台：[xpeach.codes](https://xpeach.codes)
- 问题与需求：[GitHub Issues](https://github.com/yellowpeachxgp/xpeach-harness/issues)

## 许可

[MIT](LICENSE)。第三方依赖及其许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

XPeach Harness 派生自 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（MIT 许可）。本仓库基于上游提交 `687f282e8625c6b8d11ff58211a90524be2e4317`（版本 `0.2.1-rc.2`），上游版权声明保留在 [LICENSE](LICENSE) 中。本项目做了哪些改动，见 [NOTICE.md](NOTICE.md)。
