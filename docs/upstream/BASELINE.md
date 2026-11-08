# 上游基线（Upstream Baseline）

本文件记录 XPeach Harness 与上游 DeepSeek Harness 的对应关系。**这是唯一的上游事实来源**；
产品代码、包名、品牌全部是 XPeach 的，与上游只通过本目录的映射表关联。

## 当前基线

| 项 | 值 |
|---|---|
| 上游仓库 | `https://github.com/deepseek-ai/deepseek-harness` |
| 基线提交 | `dsh-v0.2.1-rc.2`（上游发布标签） |
| 基线说明 | `Merge pull request #6408 from deepseek-harness/worktree/release-dsh-0.2.1-rc.2` |
| 记录时间 | 2026-10-22 |
| 品牌化起点 | 本次全量品牌迁移之前 |

## 工作方式

```
上游 (deepseek-ai/deepseek-harness)
   │  git fetch origin
   ▼
基线 dsh-v0.2.1-rc.2 ──────► 本仓库 main（XPeach 品牌化之后）
   │                      │
   │  upstream:diff       │
   └──────────────────────┴─► 变更清单 → 人工挑选要吸收的模块
```

## 常用命令

```sh
# 拉取上游最新
git fetch origin

# 看上游自基线以来改了什么（文件级）
pnpm run upstream:diff

# 看某个包的上游变更
pnpm run upstream:diff -- packages/llm/llm

# 把上游某个包的部分提交摘过来（跳过品牌化提交）
git cherry-pick -n <upstream-sha>
```

## 品牌化提交区间

本仓库中**由品牌迁移产生的提交**带有 `[brand]` 前缀。它们只改名称、标识、文案，
不改行为。用 `git log --grep='^\[brand\]'` 可以列出全部品牌化提交，
`upstream:diff` 会自动跳过这些提交涉及的纯改名差异。

## 吸收上游更新的原则

1. **只吸收行为变更。** 新功能、修 bug、改协议——这些要跟。纯文案、纯命名不跟。
2. **一个模块一个 PR。** 不要整树合并，那会把上游品牌带回来。
3. **改完跑品牌检查。** `pnpm run brand:check` 会扫出任何漏网的 DeepSeek 标识。
4. **记回基线。** 吸收完把基线提交更新到本次吸收的上游点，并写清吸收了哪些。
