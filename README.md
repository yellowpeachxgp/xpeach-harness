# XPeach Harness

English | [中文](README.zh.md)

**XPeach Harness** (`xph`) is the desktop and web client for [🍑Code](https://xpeach.codes) —
an OpenAI-compatible relay that puts every frontier model behind one endpoint and one bill.

Bind once with your site Access Token, and the workbench runs on your relay credit:
Claude, GPT and DeepSeek routes appear in one picker, every call is metered against your
token, and the balance stays visible in the window chrome.

## What you get

- **One endpoint, every model.** `swe-2-max`, `gpt-6-astra`, `claude-opus-5`, `deepseek-v4-flash`
  and the rest of the relay catalog, pulled live from `/v1/models` — no hand-maintained list.
- **Bind once.** Paste the site Access Token from **个人设置 → 系统访问令牌**. The app mints and
  stores its own `sk-` relay token, so chat, tools and background jobs all bill to one place.
- **Balance in sight.** A 🍑 pill in the corner shows remaining quota, today's spend and the
  last seven days; click it for the full breakdown.
- **Logs that match the bill.** Every call is listed with model, tokens in/out, latency and time.
- **Network awareness.** Three relay routes are probed continuously; the fastest one wins and
  the switch happens without you noticing.
- **Everything is a plugin.** The agent core, the tools, the UI slots and the provider adapters
  are composable plugin layers, so a workspace can carry exactly the surface you need.

## Run

### Desktop app

Download the installer for your platform from
[Releases](https://github.com/yellowpeachxgp/xpeach-harness/releases):

| Platform | Asset |
|---|---|
| macOS (Apple silicon) | `xpeach-harness-<version>-arm64.dmg` |
| Windows (x64) | `xpeach-harness-setup-<version>.exe` |
| Linux (x64) | `xpeach-harness-<version>-x64.AppImage` |

The app updates itself: a new release is downloaded in the background and applied when you quit.

### Command line

```sh
pnpm xph web
```

`xph` keeps its data in `~/.xph`, entirely separate from any other harness installation on the
machine — sessions, credentials, settings and logs included.

## First run

1. Launch the app. The workbench opens on the welcome screen.
2. Paste your site Access Token. **It is stored on this machine only** — never uploaded.
3. Pick the model group you want the relay token to serve (SWE, GPT, Claude, DeepSeek…).
4. Start a session. The picker lists every model your token can call.

You can move existing conversations in once, one-way and read-only, from a local DeepSeek
Harness data directory — **Settings → XPeach → 从 DeepSeek 导入对话**.

## Data and privacy

| What | Where |
|---|---|
| Sessions, attachments, settings | `~/.xph` |
| Site Access Token | `~/.xph/profiles/xpeach/xpeach.admin` (0600) |
| Relay `sk-` token | `~/.xph/profiles/xpeach/xpeach.key` (0600) |
| Relay route state | `~/.xph/profiles/xpeach/xpeach.route.json` |

Nothing leaves the machine except the calls you make to the relay.

## Building from source

```sh
git clone https://github.com/yellowpeachxgp/xpeach-harness.git
cd xpeach-harness
pnpm install
pnpm run build
pnpm xph web
```

Desktop packaging and the release pipeline are described in
[`packaging/README.md`](apps/desktop/packaging/README.md).

## Community

- Site and console: [xpeach.codes](https://xpeach.codes)
- Issues and feature requests: [GitHub Issues](https://github.com/yellowpeachxgp/xpeach-harness/issues)

## License

[MIT](LICENSE). Third-party dependencies and their licenses are disclosed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

XPeach Harness is a derivative work of
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), which is
MIT-licensed. This repository is based on upstream commit
`687f282e8625c6b8d11ff58211a90524be2e4317` (version `0.2.1-rc.2`); the upstream
copyright notice is preserved in [LICENSE](LICENSE). What this project changed
is listed in [NOTICE.md](NOTICE.md).
