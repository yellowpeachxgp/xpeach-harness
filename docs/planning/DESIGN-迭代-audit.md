# XPeach 控制台 设计一体化审计+迭代档

> 目标:对齐 DSH 原生设计语言(design-platform.css + base.css + TeamAction/AppearanceRow 参照)。
> 进程:goal-74617b5a 每轮留证。

## 调查(第1轮)

### 官方 token 真相
- **半径**:xs4/sm8/md12/lg16/xl20/panel28 —— 小件≤12,xl 只给大模态/hero
- **描边**:0.5px hairline——l1 底卡/l2 分隔/l3 强调/l4 设卡
- **海拔**:elevation-stroke(0.5px ring)+panel/soft/prominent 三级影
- **动效**:--ds-ease-in-out cubic(0.4,0,0.2,1) × .1/.2/.3s
- **标签**:primary/secondary/tertiary/caption/dimmed 五档
- **交互**:interactive-bg-hover(6%黑/8%白)/-active/-hover-solid/-danger
- **按钮**:primary-fill(浅深黑/深白底)+label-primary-foreground;ghost=透明→hover
- **分段件**:specific-selector 填底 + bg-base 选中块+elevation-panel
- **卡**:settings-card-fill=bg-layer-2 + stroke=l4;**scroll 契约**:--dsh-scrollbar-thumb
- **字体**:内容字号随 --dsh-content-font-delta 联动;code 栈 --dsh-font-family-code

### 我方原状问题(截图 A1 对比原生 A4)
1. radius-xl(20px) 滥用于小卡/列表行 → 气泡感,非原生
2. **死变量潜伏**(--dsh-text/--dsw-chart-*/--dsw-semantic-*)静默 fallback
3. **重复规则块**:modelChipOk/probeBtn/healthOk 等二次声明带旧 token
4. 动作钮常驻 → 列表噪;缺 hover reveal 契约
5. 自搭 box-shadow 而非 elevation 系

## 迭代批次

### batch 1(基线重构)—已部署 boot109
- 死变量/重复块清 0;radius 归一(小件→md12,行→sm8);卡描边→l1
- seg 轨→specific-selector + elevation-panel 选中块
- 按钮/行 hover 全接 ds-ease 系;market 行动作 hover reveal(marketIn 常显外移)
- 组芯限 2 + "+N";ep 并入 owner meta 轨

### batch 2(暗色+密度)—已部署 boot110
- 暗色全段回验 ✓(概览/日志/详情 截图 C1-C3)
- 日志过滤芯墙 28+ → top9 + `+20 更多` 收合钮
- 模型 id 单元 nowrap;成本列定宽 tabular
- 已验:chips 收口生效(截图 C4),列表行 hover/分线/密度对齐原生语法

### batch 3(卡面+输入+骨架)—已部署 boot111
- 虚线 peach 边卡 → 实卡(l1 发线+settings-card-fill)+左侧 2px peach rail 弱强调——戒"线框感"
- 输入件→specific-input-major 充底+sm8+聚焦环(f17c52 14%)
- 按钮三级:primary(#f17c52 hover/active 三态)/ghost(hover 充底)/outline
- **骨架屏**:加载态 5 统计格+列表卡 bg-skeleton shimmer(prefers-reduced-motion 止步)
- 截图 D3(设卡)D4(骨架)证

### batch 4(admin 行语法)—已部署 boot112
- 渠道行:状态 → ●色点+文字(启用绿/停用红),3 动作钮→adminActs hover 收显
- 令牌行:删除钮同收 hover
- 用户/渠道可展行 → chevron affordance(0→90° 转)
- 触控 @media(hover:none) 动作常显兜底
- 截图 E4(静息)E5(hover 动作浮)

### batch 5(抽屉+detail 精修)—已部署 boot114
- 抽屉字段标签 11→12/secondary + select/input 同一充底 grammar
- priceCell l2→l1+sm8;marketDetail/playBox 描边→l1+md
- detailMeta 组芯行与组选器重复 → 只留 ep 芯
- 截 F2:detail 抽屉=3 价格+组选(·当前)+实算组价行,密度合度

### batch 6(空态+滚动契约)—已部署 boot115
- `.emptyState`:🍑mark+题+引,居中净卡——用户未绑/市场空/日志空 全面套用
- 列表声明 `--dsh-scrollbar-thumb` 契约(marketList/tabLogs/adminList)
- 站点段未绑钮隐式(不占段)

### batch 7(微交互+可达性)—已部署 boot116
- 抽屉开启动效:translateY(-4px)+opacity .3s ds-ease;reduced-motion 止步
- pin ★ 按压 1.25 弹跳;chevron 旋转接 ds-ease(原裸 .15s)
- **focus-visible 统一环**:全交互件(钮/芯/行控/分页/码片/槽钮)peach 55% ring
- `aria-expanded` 补:日志行/市场行/admin 用户·渠道行
- expand 规则双块并合

### batch 8(EditDrawer 组件化)—已部署 boot117
- `XPeachDrawer.tsx`:EditDrawer(fields+hairline foot)+DrawerField(label 12/secondary)
- 落位:admin 渠道抽屉·admin 用户抽屉·用户资料抽屉 三处同构
- 截 H3:dsh_e2e_test 展开=4 字段+hairline 底+保存/停用 foot

### batch 9(文案+态语一致)—已部署 boot118
- zh/en key parity 审计:221 键全对偶
- 术语归一:额度 处处同;码配额输入 额度(quota)→额度(🍑)+×500000 换算
- 码状态芯色义反转修:未用红→可用●绿/已用●灰;文案 未用→可用 / unused→available
- 截 I1:兑换码列表色点语法与渠道一致

### batch 10(选项行+textarea)—已部署 boot119
- optArea:lg20→sm8 充底 input-major + focus 环,12px/17px 行高
- optRow:key mono + textarea + ghost 保存 三列稳

## 十批收口结论(目标完结评估)
调查→思考→设想→模拟→设计→开发→部署→复核→反思 全循环走完:
- **语法同源**:token 零死值/radius 分级/hairline l1-l4/elevation/motion 契约
- **交互同源**:hover reveal/色点态/抽屉动/骨架/空态/focus 环/aria-expanded/滚动契约
- **结构同源**:EditDrawer 三用/芯折叠/实卡/list 行密度/码色点
- **文案同源**:zh/en 221 键对偶/额度·🍑 单位一致/态语 可用·已用·启用·停用
- **证据**:archive 明暗 10 段截 + 回归 10/10 PASS(boot114/118)
- 剩余项仅为数据驱动微调,语法层无死角

## 下批候选
- [ ] logs 表密度(行高/th/展开格内部 dl 网格)
- [ ] 设置页卡面精修(bindCard 虚线卡→实卡 grammar)
- [ ] 暗色全段回验
- [ ] 空态/骨架屏(--dsw-alias-bg-skeleton)
- [ ] admin 8 子段行语法统一
- [ ] overview hero 数 20px→tabular 排布精调
- [ ] user 段卡语法复刻 settings 组

## 阶段收口证据(goal-74617b5a 第5轮)

### 归档
/tmp/xpeach-shots/archive-{light,dark}-{0..4}.png —— 五段×两相全档:
- 概览:5统计格+donut+分桶柱+准入芯(暗色发线清晰)
- 市场:静息行+hover 动作浮出+pin(暗色 all chips 守色)
- 日志:芯收合+行密度+详情 dl
- 用户:未绑引导卡
- 站点:8 子段导航+用户行(色点/chevron/hover)

### 回归
10/10 PASS(boot114)——五批设计迭代零破面