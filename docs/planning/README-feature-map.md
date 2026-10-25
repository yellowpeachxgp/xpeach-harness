# XPeach 全站搬运功能地图(完)

> `pnpm dsh --profile xpeach` 起服,主窗 XPeach 控制台 + 会话头智能体团队。全部于原生 token/dark/locale 皮。

## 凭据三层(~/.dsh/profiles/xpeach/,0600)

| 层 | 文件/ENV | 作用域 | 用途 |
|---|---|---|---|
| PAT | xpeach.key + xpeach.keys(多槽) | sk-* 只读 /v1+* | 调用/日志/用量/市场 |
| Session | xpeach.session / XPEACH_SESSION | 站点 cookie | 写面(令牌 CRUD/资料/充值/邀请) |
| Admin | xpeach.admin / XPEACH_ADMIN_KEY | admin token(raw Authorization) | 全站管理 |

## 控制台分段(主窗)

### 概览
- 5 统计:令牌名/已授/已用🍑/今日🍑/剩余
- 模型分布 **SVG donut**(top6+占比%)
- 近次调用 sparkline · 近 7 日消费**按模型分桶堆叠柱**(top4+other,图例+tooltip)
- 模型准入芯 ✓/✗(挂载模型↔站点在库比对)
- 站点外链:官网/控制台/定价/顶部充值/切换用户(退登

### 模型市场
- 搜索 + 实测探速(⚡)+速度排 + ★pin 置顶(localStorage xpeach.pins)
- 行点展开:组价表(用户可用组 × 加权 in/out)/端点芯/健康
- 行内:试用(流式回显)/加入并选中(注册 llm 路由)
- 「·当前」badge:该模型最近日志走的计费组

### 调用日志
- 模型过滤芯 · **点行展开详情**(计费组/渠道/请求ID/流式/cache tokens/组倍率/首响/**计价表达式解码** —— tiered_expr 明文)
- **导出 CSV** · 分页更多

### 用户(session 绑后可用)
- 个人资料 + 编辑抽屉(显示名/用户名/邮箱/新密码/邀请码)
- 我的令牌:建(名/组/额度/不限)+启停+删+👁完整 key
- 兑换码充值 · 在线充值(Stripe USD·CNY/NOWPayments+预览+弹窗)
- 邀请推广(aff_code+注册链复制+累计返利)

### 站点(admin token 绑后可用)——8 子段
| 子段 | 读 | 写 |
|---|---|---|
| 用户 | 列表/uid/配额/aff | 编辑(名/邮箱/配额/组/状态)+启停 |
| 令牌 | 列表 | 建(caller 作用域)+删 |
| 定价 | 比率表 | **乐观锁编辑**(v hash,8 ratio 字段+重置) |
| 全站日志 | 分页 | CSV 导出 |
| 渠道 | 名/状态/组/prio/权重/时延 | **测速**/启停/**编辑抽屉**(8 字段)/删 |
| 兑换码 | 列表 | **生成**(quota×count→keys 点复制) |
| 分组 | GroupRatio/GroupGroupRatio/UserUsableGroups/AutoGroups/TopupGroupRatio/… | 7 键 option 保存 |
| 公告 | Notice i18n JSON | 保存 |

## 会话页(team 模式)
头部 `智能体团队` 钮 → 成员/任务板面板;agent 工具换 team_* 组(spawn_teammate/team_task_*)

## 设置页(凭据槽)
令牌绑定(sk-)·**令牌槽**(多枚 PAT 存/切/删)·站点会话(cookie)→@用户名显·管理 token

## 坑位归档
- PAT 只读是站端硬墙 → 写面需 session/admin
- /api/token/ 系 = caller 作用域(admin 建牌建自己名下)
- expr_b64 解码出站端真计费式(p/c/cr/cc 权重+长度分档)
- group 计价为按次回执字段,路由按模型走
- Turnstile 封程序登录(终判 200 包确认)
