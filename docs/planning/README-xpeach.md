# 🍑Code — XPeach Relay Harness

A fully whitelabeled DeepSeek Harness profile for the XPeach relay
(`fast.xpeach.codes`). Zero DeepSeek branding reaches the user; the relay API
key lives in profile-local storage, independent of the shared
`~/.dsh/.credentials.yaml` the stock harness uses.

## Layout

| Piece | Location |
|---|---|
| Profile | `~/.dsh/profiles/xpeach/` |
| Relay key | `~/.dsh/profiles/xpeach/xpeach.key` (0600) — the ONLY credential |
| Key seed marker | `xpeach.key.seeded` — prevents re-migration from shared yaml after unbind |
| Plugin config | `cordis.patch.yml` — providers, disabled DeepSeek plugins, insert entries |
| Host plugin | `packages/xpeach/account/` — remotes (usage/logs/models/chat/bind) |
| Client plugin | `packages/xpeach/client-ui/` — pill, settings section, console tab |

## Boot

```bash
./start-xpeach.sh          # headless (prints the token URL)
./start-xpeach.sh --open   # open browser
```

or directly: `pnpm dsh --profile xpeach --no-open` from the harness checkout.

## Credential flow

1. `xpeach.key` file → 2. `XPEACH_RELAY_KEY` env → 3. one-time seed from
   shared yaml (only if never seeded). Bind/unbind via **Settings → XPeach**
   writes the file + exports `XPEACH_RELAY_KEY` (all LLM provider routes read
   that var through `apiKeyEnv`). Deleting keys from the shared
   `~/.dsh/.credentials.yaml` does NOT affect this profile.

## Console (right-pane tab)

- **Overview**: quota cells, per-model token mix, call sparkline, 7-day spend,
  model-availability chips, site deep links, copy-API-base.
- **Model Market**: relay `/v1/models` catalog (group-scoped to the bound
  token), search, per-row inline **streaming** playground, **Add & Select**
  (settings.mutate → cordis.patch.yml → live route → session selectModel).
- **Call Logs**: model filter chips, per-call cost, relative time, client-side
  pagination over the fetched tail.

## Whitelabel

DeepSeek plugin entries are disabled in the patch; every visible string, the
favicon, manifest, document title (`🍑Code — XPeach`), hero copy, and model
picker group name (`🍑Code`) carry the XPeach brand.

## Rebuild after source edits

```bash
cd packages/xpeach/client-ui && pnpm run bundle   # client surfaces
# host packages run via tsx — restart dsh to pick them up
```

## Probes

`apps/web/tests/xpeach-*.mjs` — visual, tab, console, chat-content,
stream, join, picker, unbind/rebind, add-model E2E scripts
(Playwright, run: `node tests/<name>.mjs <url>`).
