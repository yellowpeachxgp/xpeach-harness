# Session-cookie 联验 runbook(写操作面实测)

> 目的:session cookie 是 Turnstile 外唯一写通道——贴一次 cookie,即可联验全部用户级写面。
> 预计 5 分钟。

## 前置
- DSH 服务跑着(xpeach profile, http://127.0.0.1:3080)
- 测试账号:dsh_e2e_test / (建时密码见管理员记录;或用你自己的站点账号)

## 步骤

### 1. 取 cookie
1. 浏览器打开 https://fast.xpeach.codes/login ,登录(过 Turnstile)
2. F12 → Application → Cookies → https://fast.xpeach.codes
3. 找 `session` 行,复制 Value(长 JWT 形)

### 2. 绑定
设置 → XPeach → **站点会话(写操作)** 卡 → 粘贴 → 绑定会话
- 成功:● 已绑定 @用户名(green dot + username 即绑谁)
- 失败:错误回执直浮(401=过期/无效),文件不写不残

### 3. 逐面联验(全在 控制台 → 用户 段)

| 面 | 动作 | 期望 |
|---|---|---|
| 个人资料 | 展开看 username/email/group/额度 | 实数出现 |
| 编辑资料 | 改显示名→保存 | 提示"已保存",重拉显新值 |
| 我的令牌 | 新建令牌(名+额度)→表出现;启停切;删除(confirm) | 各动作均即时重拉;👁 reveal 出完整 sk- |
| 兑换码 | 粘贴管理端生成的码→充值 | 提示"充值成功",余额涨 |
| 在线充值 | 选 Stripe CNY→金额 50→预览金额 | 应付金额浮出(站端真实换算) |
| | →去支付 | 新窗弹 Stripe checkout 页(524×780) |
| 邀请推广 | aff_code+注册链接复制 | 复制到 https://fast.xpeach.codes/register?aff=xxx |

### 4. 验痕
- 站点后台/web 同号登录看:资料改了?令牌多了?余额动了?——三侧同源即可判真写

## 备注
- cookie 有效期跟随站点 session(通常 7-30 天),过期即 401,重贴即可
- session 文件存 ~/.dsh/profiles/xpeach/xpeach.session (0600);XPEACH_SESSION env 可临时盖
