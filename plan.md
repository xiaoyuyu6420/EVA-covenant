# EVA 驾驶员适配测试 - 实现计划

基于「人格测试系统通用生产模版（优化版）」，设计并实现一个新世纪福音战士主题的人格测试系统。

---

## 一、测试定义

```
项目名称:   EVA-Covenant
主题 IP:    新世纪福音战士 (Neon Genesis Evangelion)
IP联动:     是
目标用户:   16-35岁 EVA 粉丝 / 二次元爱好者 / 机甲爱好者
用户分层:   核心用户: EVA深度粉丝 / 次要用户: 泛ACG爱好者
测试模式:   单人
生命周期:   长期运营
隐私等级:   完全匿名
多语言支持: 否

测试名称:   驾驶员适格测试
测试标语:   "NERV紧急征召——你的适格率是多少？"
```

---

## 二、维度体系设计

### 5个模型 × 3维度 = 15维度

**模型 A - 适格性 (Pilot Compatibility)**
| 维度 | 代码 | 含义 |
|------|------|------|
| 同步率 | A1 | 与EVA建立精神链接的能力，反映开放性与感受力 |
| 精神韧性 | A2 | 面对精神冲击/使徒精神污染的承受力 |
| AT力场 | A3 | 自我边界强度，防御/隔绝外界的能力 |

**模型 B - 战斗风格 (Combat Style)**
| 维度 | 代码 | 含义 |
|------|------|------|
| 攻击性 | B1 | 主动出击vs防守反击的倾向 |
| 战术性 | B2 | 依赖计划vs直觉反应 |
| 决断力 | B3 | 紧急时刻的果断程度 |

**模型 C - 情感模式 (Emotional Pattern)**
| 维度 | 代码 | 含义 |
|------|------|------|
| 共情力 | C1 | 对他人情感的感知与回应能力 |
| 孤独倾向 | C2 | 倾向独处vs寻求连接 |
| 表达方式 | C3 | 内敛压抑vs外放直接 |

**模型 D - 价值取向 (Value System)**
| 维度 | 代码 | 含义 |
|------|------|------|
| 责任感 | D1 | 对使命/任务的承担意愿 |
| 自我意识 | D2 | 自我需求vs他人需求优先级 |
| 存在追问 | D3 | 对生命意义的探索深度 |

**模型 E - 互动模式 (Interaction)**
| 维度 | 代码 | 含义 |
|------|------|------|
| 独立性 | E1 | 依赖他人vs独自行动 |
| 信任度 | E2 | 对他人/组织的信任程度 |
| 领导力 | E3 | 主导局面vs服从指令 |

### 权重配置

```
权重数组: [1.5, 1.2, 1.0, 1.5, 1.0, 1.2, 1.0, 1.0, 1.2, 1.0, 1.5, 1.0, 1.0, 1.2, 1.0]
对应维度:  A1   A2   A3   B1   B2   B3   C1   C2   C3   D1   D2   D3   E1   E2   E3
```
A1(同步率)、B1(攻击性)、D2(自我意识) 权重拉高，这三个维度对区分EVA机体适配最关键。

---

## 三、人格类型设计

### 24个常规人格 + 2个特殊人格

按6个分组（5个机体组 + 1个兜底组），每组4个人格。

向量格式：`AAA-BBB-CCC-DDD-EEE`，每个字母为 L/M/H/X

### Group 1 - 初号机系 (Unit-01: 碇真嗣线)
高同步率、中高精神韧性、高共情、高孤独、高存在追问

| 代码 | 名称 | 向量 | 标语 |
|------|------|------|------|
| SHIN | 真嗣型 | HML-MML-HHL-MHM-HLL | "不想逃避，但不能不逃" |
| RESO | 觉醒型 | XMM-HLL-MHL-HMH-MLL | "当守护的意志超越恐惧" |
| BERS | 暴走型 | XHL-HML-MML-HML-MML | "自我消失的那一刻，力量觉醒" |
| EVOU | 进化型 | XHM-MHL-MLH-MHH-HML | "超越人类的可能性" |

### Group 2 - 贰号机系 (Unit-02: 明日香线)
高攻击性、高决断力、高情感表达、低共情、低信任

| 代码 | 名称 | 向量 | 标语 |
|------|------|------|------|
| ASKA | 明日香型 | MMM-HHH-LHH-LLM-LLL | "我是最优秀的驾驶员" |
| PRID | 骄傲型 | MML-HHM-LLM-LLM-MLL | "用骄傲武装脆弱的内心" |
| FURY | 怒火型 | MHL-XHM-LHL-MLL-MML | "燃烧殆尽的战斗意志" |
| REBU | 反击型 | LMM-HHL-MLH-MML-HML | "跌倒后更猛烈地站起来" |

### Group 3 - 零号机系 (Unit-00: 绫波丽线)
高AT力场、低情感表达、高自我意识、高独立性

| 代码 | 名称 | 向量 | 标语 |
|------|------|------|------|
| REII | 绫波型 | LLH-LLL-LLM-MHH-HHL | "我存在的理由是什么" |
| VOID | 虚无型 | LLL-MLL-LML-MHX-HHL | "什么都不需要，什么都不想要" |
| DOLL | 人偶型 | MLL-LLL-LMM-MLL-HHM | "按照指令行动就好" |
| SMIY | 微笑型 | MMH-MLM-MLM-MHH-HLM | "在冰冷外表下找到的温度" |

### Group 4 - 参号机系 (Unit-03: 铃原东治线)
高攻击性、高责任感、高领导力、高信任

| 代码 | 名称 | 向量 | 标语 |
|------|------|------|------|
| TOJI | 东治型 | MLH-HHM-MMM-HHH-MHH | "保护身边的人就是我的战斗" |
| GARD | 守护型 | MMH-MMH-HMM-HHM-HMH | "不退后一步" |
| LEAD | 领袖型 | MHH-HML-HML-HMH-XHM | "由我来决定方向" |
| SACR | 献身型 | LHM-MHL-MHL-XHH-MLH | "就算牺牲自己也在所不惜" |

### Group 5 - Mark.06系 (渚薰线)
高共情、高信任、高存在追问、高独立性

| 代码 | 名称 | 向量 | 标语 |
|------|------|------|------|
| KAOR | 渚薰型 | HHL-MLM-XHM-LMM-HMH | "第一次见到你这样的灵魂" |
| FATE | 宿命型 | MML-LLH-HHH-LMH-HHM | "一切早已注定" |
| ANGL | 天使型 | XHL-LLL-HHL-MHX-MML | "超越人类理解的存在" |
| FREE | 自由型 | HMM-MHH-HML-LMM-HHM | "这是我自己选择的自由" |

### Group 6 - 综合系（兜底组）
各维度中等，无明显突出

| 代码 | 名称 | 向量 | 标语 |
|------|------|------|------|
| BALA | 平衡型 | MMM-MMM-MMM-MMM-MMM | "没有弱点，也没有极致" |
| ADPT | 适应型 | MHM-MHM-MHM-MHM-MHM | "在任何环境下都能存活" |
| FLUX | 流变型 | MMH-HMM-MML-MLM-HML | "永远在变化中寻找答案" |
| WATC | 观察型 | MMH-MLL-MMM-MML-HML | "在安全距离外审视一切" |

### 特殊人格

| 代码 | 名称 | 触发方式 | 条件 |
|------|------|----------|------|
| CMPL | 人类补完 | gate+trigger | 门控题选"想要所有人合而为一" + 触发题选"是的" |
| ADAM | 第一使徒 | fallback | 最佳匹配相似度 < 55% |

---

## 四、题目设计

### 15维度 × 3题/维度 = 45道常规题 + 1门控题 + 1触发题 = 47题

每题3选项，分值1/2/3。第3题为反向校验题。

### 门控题（插入在第30题附近）

```
"深夜独自一人，你突然感觉周围的一切都在注视着你。你的第一反应是？"
  A. "想要这种被包围的感觉持续下去" → path: "complement"  (触发人类补完)
  B. "寻找安全的地方躲起来"         → path: "normal"
  C. "直面这种感觉，试探它的来源"   → path: "normal"
  D. "无所谓，习惯了"               → path: "normal"
```

### 触发题（当门控选A后出现）

```
"如果有一种方法能让所有人的灵魂融合在一起，消除一切孤独和误解——你愿意吗？"
  A. "是的，那才是真正的完整"       → trigger: "CMPL"
  B. "不，我接受现在的不完美"       → (不触发)
```

---

## 五、算法配置

```
分档规则 (3题, 总分3~9):
  3~4 → L (0)
  5~6 → M (1)
  7~8 → H (2)
  9   → X (3)

距离算法: 加权曼哈顿距离
  D = Σᵢ wᵢ × |uᵢ - tᵢ|
  similarity = (1 - D / maxDist) × 100%

判定参数:
  Δ = 8%     // Top1/Top2差距阈值
  T = 55%    // 兜底相似度下限

判定优先级:
  ① 特殊触发 → CMPL (人类补完)
  ② 向量匹配 → Top 3
  ③ 边界检查 → Δ < 8% 且 T < 55% → ADAM (第一使徒)
  ④ 附加输出 → Top3 + 群体定位
```

---

## 六、技术架构

### 项目结构
```
EVA-covenant/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 根布局
│   │   ├── page.tsx              # 入口页
│   │   ├── globals.css           # 全局样式
│   │   └── api/
│   │       ├── quiz/route.ts     # GET 题目+模板
│   │       ├── match/route.ts    # POST 匹配计算
│   │       └── results/route.ts  # POST 保存记录
│   ├── components/
│   │   ├── WelcomeScreen.tsx     # 欢迎页
│   │   ├── TestScreen.tsx        # 答题页
│   │   ├── ResultScreen.tsx      # 结果页
│   │   ├── ProgressBar.tsx       # 进度条
│   │   ├── RadarChart.tsx        # 雷达图
│   │   ├── DimensionBar.tsx      # 维度条
│   │   └── ShareCard.tsx         # 分享卡片
│   ├── lib/
│   │   ├── types.ts              # 类型定义
│   │   ├── quiz-data.ts          # 题目/人格/选项数据
│   │   ├── match-engine.ts       # 匹配算法
│   │   └── storage.ts            # localStorage工具
│   └── hooks/
│       └── useQuiz.ts            # 答题状态管理
├── prisma/
│   ├── schema.prisma             # 数据模型
│   └── seed.ts                   # 初始数据
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

### 技术栈
- Next.js 14 (App Router) + React + TypeScript
- Tailwind CSS + shadcn/ui + Framer Motion
- Prisma + SQLite
- Docker

### 数据库模型
- Question (题目) → Option (选项, 1:N)
- PersonalityType (人格模板)
- SpecialType (特殊人格)
- TestRecord (测试记录)
- Answer (答题明细)

### API
- GET /api/quiz → 题目+人格模板
- POST /api/match → 答题数据→匹配结果+Top3
- POST /api/results → 保存记录→群体定位

---

## 七、主题皮肤 - 经典EVA风格

### 配色
```css
--bg:      #0a0a12        /* 深邃黑蓝（NERV地下设施感） */
--accent:  #6b21a8        /* 初号机紫 */
--accent2: #4ade80        /* 初号机绿 */
--warm:    #ef4444        /* 警告红（使徒/报警） */
--text:    #e2e8f0        /* 冷白 */
--text-2:  #94a3b8        /* 灰白 */
--text-3:  #475569        /* 暗灰 */
--panel:   #1e1b2e        /* 面板背景 */
```

### 维度条配色
```
X档 → #a855f7 (亮紫)
H档 → #7c3aed (紫色)
M档 → #6d28d9 (暗紫)
L档 → #3b0764 (深紫)
```

### 视觉风格
```
背景效果:  粒子流（模拟LCL溶液粒子）+ 深色渐变
卡片风格:  玻璃态 + NERV风格橙色边框线条
动画强度:  强（界面切换有类似EVA启动序列的动画）
字体搭配:  Noto Sans SC (UI) + Orbitron (数字/代码) + Rajdhani (强调)
```

### 特色UI元素
- 启动界面模拟 NERV 终端启动序列
- 答题界面类似 MAGI 系统操作界面
- 进度条显示「同步率」百分比
- 结果页展示「适格证明书」风格的结果卡片
- 使徒/十字爆炸等经典视觉元素点缀

---

## 八、实施步骤

### Phase 1: 基础架构（数据层）
1. 初始化 Next.js 项目 + 依赖安装
2. 配置 Tailwind + shadcn/ui
3. 定义 TypeScript 类型
4. 编写全部题目数据 (quiz-data.ts)
5. 实现匹配算法 (match-engine.ts)

### Phase 2: 前端界面
6. 欢迎页 (WelcomeScreen) - NERV终端启动风格
7. 答题页 (TestScreen) - MAGI系统风格
8. 结果页 (ResultScreen) - 适格证明书风格
9. 组件：进度条、维度条、雷达图、分享卡片

### Phase 3: 后端 + 数据库
10. Prisma schema + seed
11. API 路由 (quiz/match/results)
12. localStorage 持久化

### Phase 4: 打磨
13. Framer Motion 动画
14. 移动端适配
15. 分享功能
16. Dockerfile + docker-compose

---

## 九、检查清单（待上线确认）

- [ ] 15维度 × 3题 = 45题，每题3选项覆盖低/中/高
- [ ] 24+2人格模板向量两两至少差3维度
- [ ] 每组至少3种人格
- [ ] 门控题触发路径可走通
- [ ] 权重无负值，maxDist计算正确
- [ ] 匹配在后端 /api/match
- [ ] 答题进度可恢复
- [ ] 移动端适配
- [ ] 分享功能可用
- [ ] Docker构建含数据库初始化
