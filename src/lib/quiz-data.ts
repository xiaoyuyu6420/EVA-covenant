import type { QuizQuestion, GateQuestion, TriggerQuestion, PersonalityType, SpecialType } from "./types";

// ===== 45道常规题（15维度 × 3题） =====
export const questions: QuizQuestion[] = [
  // ── A1: 同步率 ──
  { dim: "A1", text: "第一次坐进插入栓，LCL灌入后通讯声变得很远。你最先注意到什么？",
    options: [
      { label: "呼吸和心跳是否还能受自己控制", score: 1 },
      { label: "LCL的温度、压力和机体反馈是否在同一节奏", score: 2 },
      { label: "外部噪声退后，只剩核心里传来的情绪波动", score: 3 },
    ]},
  { dim: "A1", text: "同步测试中，MAGI要求你描述EVA的反馈。你会怎么说？",
    options: [
      { label: "只报告仪表读数，主观感觉不可靠", score: 1 },
      { label: "能分辨几处不属于自己的身体感", score: 2 },
      { label: "像多了一套神经，连疼痛位置都很清楚", score: 3 },
    ]},
  { dim: "A1", text: "战斗中机体动作比你的指令快了半拍。你会怎么处理？",
    options: [
      { label: "立刻压回手动控制，先确认不是异常", score: 1 },
      { label: "保留部分同步，观察它想把你带向哪里", score: 2 },
      { label: "顺着那股牵引行动，让机体先于意识完成反应", score: 3 },
    ]},

  // ── A2: 精神韧性 ──
  { dim: "A2", text: "精神污染警报响起，画面里开始出现不属于战场的记忆。你会？",
    options: [
      { label: "要求切断同步，先把自己拉回现实", score: 1 },
      { label: "标记异常，但继续听指挥台的指令", score: 2 },
      { label: "把注意力压回目标、呼吸和手部动作", score: 3 },
    ]},
  { dim: "A2", text: "一次同步失败后，测试记录被全队看到。接下来一天你最可能？",
    options: [
      { label: "回避训练舱，避免再被别人看到失误", score: 1 },
      { label: "按计划复盘，但状态会被影响一阵", score: 2 },
      { label: "主动预约补测，把失败拆成可修正的问题", score: 3 },
    ]},
  { dim: "A2", text: "长时间待机，备用电源很低，指挥中心还没给新命令。你怎么稳住自己？",
    options: [
      { label: "反复想最坏结果，注意力很快被拖走", score: 1 },
      { label: "靠流程清单维持行动，不让自己停下来", score: 2 },
      { label: "把不确定当成背景噪声，继续保存体力", score: 3 },
    ]},

  // ── A3: AT力场 ──
  { dim: "A3", text: "作战后有人未经允许翻看你的同步日志。你的反应？",
    options: [
      { label: "明确要求归还，并记录这次越权", score: 3 },
      { label: "表面平静，但以后会重新设置权限", score: 2 },
      { label: "算了，反正NERV本来就看得到", score: 1 },
    ]},
  { dim: "A3", text: "同伴想和你共用一个休息舱，理由是他今晚不想独处。你会？",
    options: [
      { label: "同意，并尽量陪他把状态稳定下来", score: 1 },
      { label: "同意一段时间，但说明自己也需要私人空间", score: 2 },
      { label: "帮他联系别人或值班人员，但守住自己的空间", score: 3 },
    ]},
  { dim: "A3", text: "EVA反馈里混入另一个人的情绪，你发现自己被带着走。你会？",
    options: [
      { label: "接纳它，也许这能帮助你理解对方", score: 1 },
      { label: "把它当作信息，但维持清楚的距离", score: 2 },
      { label: "立刻建立心理隔离，防止它继续侵入", score: 3 },
    ]},

  // ── B1: 攻击性 ──
  { dim: "B1", text: "使徒突破第一防线，作战方案还在修订。你的第一动作？",
    options: [
      { label: "继续等待命令，先保留战力", score: 1 },
      { label: "请求先行牵制，给指挥台争取时间", score: 2 },
      { label: "主动压上抢回距离，不能让它继续推进", score: 3 },
    ]},
  { dim: "B1", text: "训练中对手连续挑衅你的能力。你会？",
    options: [
      { label: "用完成度回应，不把训练变成争吵", score: 2 },
      { label: "不接挑衅，按原定科目完成", score: 1 },
      { label: "提高强度，让对方知道界限在哪里", score: 3 },
    ]},
  { dim: "B1", text: "你看到一条命令明显牺牲了前线小队的安全。你会？",
    options: [
      { label: "先保存证据，等作战后正式申诉", score: 1 },
      { label: "当场质询，要求指挥台修正方案", score: 2 },
      { label: "直接改变行动路线，先把人拉回来", score: 3 },
    ]},

  // ── B2: 战术性 ──
  { dim: "B2", text: "MAGI给出三套方案：稳定、冒险、未验证。你更可能？",
    options: [
      { label: "优先稳定方案，并补一套撤退预案", score: 3 },
      { label: "选有数据支撑的方案，但保留临场调整", score: 2 },
      { label: "用未验证方案打破僵局，先制造机会", score: 1 },
    ]},
  { dim: "B2", text: "你只有90秒阅读使徒分析报告。你会先看？",
    options: [
      { label: "攻击模式、周期和失败代价", score: 3 },
      { label: "现场队友已经观察到的异常", score: 2 },
      { label: "哪里能打、哪里能靠近，先找突破口", score: 1 },
    ]},
  { dim: "B2", text: "作战会议里大家意见分裂。你通常怎么判断方案好坏？",
    options: [
      { label: "看目标、资源、时间和撤退条件是否闭环", score: 3 },
      { label: "看谁最了解现场，再结合自己的判断", score: 2 },
      { label: "看哪个能最快开始行动，拖延本身就是风险", score: 1 },
    ]},

  // ── B3: 决断力 ──
  { dim: "B3", text: "备用电源只剩40秒，前方同时出现救援点和攻击窗口。你会？",
    options: [
      { label: "延迟决定，争取更多信息", score: 1 },
      { label: "按优先级快速选一边，接受结果", score: 2 },
      { label: "立即行动，事后由你承担判断后果", score: 3 },
    ]},
  { dim: "B3", text: "你判断失误导致队友多承受了一轮攻击。复盘时你会？",
    options: [
      { label: "陷在后悔里，很难开口说明", score: 1 },
      { label: "承认错误，并补上下一次的检查流程", score: 2 },
      { label: "直接给出新的决策规则，下一次更快修正", score: 3 },
    ]},
  { dim: "B3", text: "指挥台失联，屏幕上只剩倒计时。你会？",
    options: [
      { label: "在几秒内制定临时指令", score: 3 },
      { label: "先确认最关键风险，再开始行动", score: 2 },
      { label: "等待通讯恢复，哪怕时间已经很紧", score: 1 },
    ]},

  // ── C1: 共情力 ──
  { dim: "C1", text: "插入栓通讯里，同伴说“没事”，但声音明显发紧。你会？",
    options: [
      { label: "只接收任务信息，不在战斗中追问", score: 1 },
      { label: "简短确认状态，必要时调整配合", score: 2 },
      { label: "听出恐惧来源，并主动替他分担压力点", score: 3 },
    ]},
  { dim: "C1", text: "战后医疗区里，一个你不熟的驾驶员沉默很久。你会？",
    options: [
      { label: "递水或留下空间，不急着要求他说话", score: 2 },
      { label: "坐在旁边等他开口，让他知道有人在", score: 3 },
      { label: "不打扰，医疗区会有专业人员处理", score: 1 },
    ]},
  { dim: "C1", text: "你面对被使徒侵蚀过的机体记录。你更容易注意到？",
    options: [
      { label: "事故流程和责任节点", score: 1 },
      { label: "驾驶员当时可能经历了什么", score: 2 },
      { label: "那种无助会被你带到自己身上", score: 3 },
    ]},

  // ── C2: 孤独倾向 ──
  { dim: "C2", text: "战斗结束后基地恢复照明，大家在休息区说话。你最想去哪？",
    options: [
      { label: "回插入栓或安静处，先整理自己", score: 3 },
      { label: "短暂露面，确认情况后再离开", score: 2 },
      { label: "留在人群里，确认大家都还在", score: 1 },
    ]},
  { dim: "C2", text: "深夜的第三新东京市只剩自动广播。你一个人走过地下通道时？",
    options: [
      { label: "有点空，但不至于难受", score: 2 },
      { label: "这种隔绝感反而让你清醒", score: 3 },
      { label: "会想找人通话，不想继续一个人走", score: 1 },
    ]},
  { dim: "C2", text: "你觉得自己和其他适格者之间的距离像什么？",
    options: [
      { label: "能靠训练和相处慢慢拉近", score: 1 },
      { label: "有时很近，有时又突然变远", score: 2 },
      { label: "隔着一层看不见的AT力场", score: 3 },
    ]},

  // ── C3: 表达方式 ──
  { dim: "C3", text: "你刚从高同步率测试里出来，手还在抖。别人问你情况。你会？",
    options: [
      { label: "说没事，然后转移话题", score: 1 },
      { label: "说需要一点时间，先不细讲", score: 2 },
      { label: "直接说刚才很糟，需要暂停", score: 3 },
    ]},
  { dim: "C3", text: "你对指挥方案很不满，但会议室里坐满了上级。你会？",
    options: [
      { label: "会后私下表达，避免当场冲突", score: 1 },
      { label: "用尽量克制的方式提出风险", score: 2 },
      { label: "当场明确反对，让问题被所有人听见", score: 3 },
    ]},
  { dim: "C3", text: "同伴做了一件让你感动的事。你通常？",
    options: [
      { label: "记在心里，以后用行动回报", score: 1 },
      { label: "用一句简单的话说出来", score: 2 },
      { label: "当面认真表达感谢和依赖", score: 3 },
    ]},

  // ── D1: 责任感 ──
  { dim: "D1", text: "撤离警报响起，你负责的民用避难门卡住了。你会？",
    options: [
      { label: "留下处理，直到最后一批人通过", score: 3 },
      { label: "联系支援，同时尽量排除故障", score: 2 },
      { label: "先按命令撤离，再把问题上报", score: 1 },
    ]},
  { dim: "D1", text: "一次任务失败，责任分散在指挥、设备和驾驶员之间。你会？",
    options: [
      { label: "只说明自己负责的部分", score: 1 },
      { label: "承担份内责任，并推动复盘", score: 2 },
      { label: "先把解决问题扛起来，再追责任", score: 3 },
    ]},
  { dim: "D1", text: "有人要求你在状态不佳时仍然出击，因为没有替补。你会？",
    options: [
      { label: "拒绝出击，避免把风险扩大", score: 1 },
      { label: "报告风险后，接受有限任务", score: 2 },
      { label: "只要还能动就上机", score: 3 },
    ]},

  // ── D2: 自我意识 ──
  { dim: "D2", text: "司令部把你称为“适格样本”而不是名字。你在意吗？",
    options: [
      { label: "不太在意，完成任务更重要", score: 1 },
      { label: "会记住，但暂时不争辩", score: 2 },
      { label: "明确要求被当作一个人对待", score: 3 },
    ]},
  { dim: "D2", text: "你的机体维修优先级和另一名驾驶员的治疗安排冲突。你会？",
    options: [
      { label: "优先让出资源，治疗更要紧", score: 1 },
      { label: "协商资源分配，尽量两边都不耽误", score: 2 },
      { label: "坚持自己的作战条件不能被忽略", score: 3 },
    ]},
  { dim: "D2", text: "同步测试要求你压低个人意愿，完全服从机体反馈。你会？",
    options: [
      { label: "照做，减少自我干扰", score: 1 },
      { label: "在可控范围内配合", score: 2 },
      { label: "拒绝让测试定义“我是谁”", score: 3 },
    ]},

  // ── D3: 存在追问 ──
  { dim: "D3", text: "你被问到：如果不再需要驾驶EVA，你还留下些什么？",
    options: [
      { label: "没想过，先过完今天", score: 1 },
      { label: "可能会迷茫，但还有别的关系和目标", score: 2 },
      { label: "这个问题会一直追着你", score: 3 },
    ]},
  { dim: "D3", text: "LCL里出现童年画面，测试人员要求你描述它的意义。你会？",
    options: [
      { label: "只说看到的内容，不谈意义", score: 1 },
      { label: "试着解释它和现在的关系", score: 2 },
      { label: "追问为什么这些画面会在此刻出现", score: 3 },
    ]},
  { dim: "D3", text: "你看到月面上的未知机体影像，第一反应更接近？",
    options: [
      { label: "这意味着计划还有隐藏层", score: 2 },
      { label: "先确认它是否构成威胁", score: 1 },
      { label: "它让你想到人类到底在制造什么", score: 3 },
    ]},

  // ── E1: 独立性 ──
  { dim: "E1", text: "你的通讯中断，只剩机体本地系统可用。你会？",
    options: [
      { label: "独立执行最近目标", score: 3 },
      { label: "按最后命令行动，并尝试恢复通讯", score: 2 },
      { label: "尽快撤到可联络区域", score: 1 },
    ]},
  { dim: "E1", text: "维修班建议你把一次关键调整交给别人完成。你会？",
    options: [
      { label: "交给专业人员，他们更熟悉设备", score: 1 },
      { label: "参与确认关键参数", score: 2 },
      { label: "自己盯到最后一个步骤", score: 3 },
    ]},
  { dim: "E1", text: "你在陌生支部迷路，权限卡还失效。你会？",
    options: [
      { label: "自己查标识和备用通道", score: 3 },
      { label: "找最近的工作人员确认方向", score: 2 },
      { label: "等熟悉的人来接", score: 1 },
    ]},

  // ── E2: 信任度 ──
  { dim: "E2", text: "NERV给出一份删减过的任务简报。你会？",
    options: [
      { label: "相信必要保密，按简报执行", score: 3 },
      { label: "执行，但把疑点记录下来", score: 2 },
      { label: "默认有隐瞒，另找信息核对", score: 1 },
    ]},
  { dim: "E2", text: "新来的操作员说他可以接管你的同步调整。你会？",
    options: [
      { label: "让他按流程来", score: 3 },
      { label: "让他做，但全程确认关键参数", score: 2 },
      { label: "拒绝把核心参数交出去", score: 1 },
    ]},
  { dim: "E2", text: "同伴说“相信我，等会儿按我的节奏来”。你会？",
    options: [
      { label: "要求他说清楚计划", score: 1 },
      { label: "愿意配合，但保留自己的判断", score: 2 },
      { label: "直接把一部分节奏交给他", score: 3 },
    ]},

  // ── E3: 领导力 ──
  { dim: "E3", text: "三机协同训练里，频道一片混乱。你会？",
    options: [
      { label: "先完成自己的动作，避免继续失误", score: 1 },
      { label: "提醒大家按原计划回到队形", score: 2 },
      { label: "接管频道，分配位置和时机", score: 3 },
    ]},
  { dim: "E3", text: "你发现队友一直在逃避关键训练。你会？",
    options: [
      { label: "私下问原因，并一起补训练", score: 2 },
      { label: "明确设定期限和要求", score: 3 },
      { label: "不介入，驾驶是个人问题", score: 1 },
    ]},
  { dim: "E3", text: "作战结束后没人知道下一步该做什么。你更自然的角色是？",
    options: [
      { label: "整理伤员、设备和汇报顺序", score: 3 },
      { label: "接手自己能处理的一块", score: 2 },
      { label: "等指挥恢复，再按命令行动", score: 1 },
    ]},
];

// ===== 门控题（约2/3处，第20题附近插入） =====
export const gateQuestion: GateQuestion = {
  text: "第20次测试后，LCL里出现三种稳定波形：一条像所有人的心跳逐渐合拍，一条来自月面未知机体，一条像零号机核心里很轻的呼吸。你会把注意力留在哪里？",
  options: [
    { label: "留在合拍的波形里，观察边界被放低后的感觉", value: "complement" },
    { label: "追踪月面机体的信号，确认它是否在回应你", value: "transcend" },
    { label: "回应零号机核心里的呼吸，判断那是不是一个人", value: "rei" },
    { label: "收束注意力，把记录拉回当前测试项目", value: "normal" },
    { label: "要求中止记录，避免波形污染继续扩大", value: "normal" },
  ],
};

// ===== 触发题：人类补完 =====
export const triggerQuestion: TriggerQuestion = {
  text: "MAGI提示：如果继续这条波形，你的个人边界会被永久调低，孤独感也会被一起削弱。你批准继续实验吗？",
  options: [
    { label: "批准。在边界完全消失前，我想看清那种连接", trigger: "CMPL" },
    { label: "停止。哪怕会误解彼此，我也要保留自己的边界", trigger: undefined },
  ],
};

// ===== 触发题：十三号机 =====
export const unit13TriggerQuestion: TriggerQuestion = {
  text: "月面信号稳定后，系统显示十三号机需要双插入栓协同才能继续验证。你会接受另一组意识与你共享控制权吗？",
  options: [
    { label: "接受。只要目标清楚，我可以把控制权分出去", trigger: "U13G" },
    { label: "不接受。双人同步不能绕过个人边界", trigger: undefined },
  ],
};

// ===== 触发题：绫波路线 =====
export const reiTriggerQuestion: TriggerQuestion = {
  text: "零号机核心的微弱反馈开始回应你的呼吸。技术部建议继续共振测试，但你的部分情绪记录会被写入核心。你会继续吗？",
  options: [
    { label: "继续。如果它确实在回应，我想确认那是谁", trigger: "REI0" },
    { label: "停止。记录可以保存，情绪不该被写入核心", trigger: undefined },
  ],
};

// ===== 22个常规人格（11分组 × 2类型）=====
// 每个向量严格为 3X + 4H + 4M + 4L，配合相对排名分档算法
export const personalityTypes: PersonalityType[] = [
  // ── 初号机系 — 暴走/母体 ──
  { code: "SYNC01", name: "同调型", group: "unit01",
    vector: "XMX-LLH-HMM-HLX-MHL",
    slogan: "不想逃避的时候，就是最强的",
    desc: "你的灵魂波形与初号机的共振呈现罕见的XMX特征——能与EVA建立深层精神链接，却被低自我意识持续拖拽。初号机是战斗测试型，紫色装甲下是近乎生命体的存在，胸口有类似使徒核的球体。它只在驾驶员的精神矛盾达到极限时才会回应——不是因为技术精湛，而是因为「渴望被需要却不确定自己是否该存在」的矛盾本身触发了共鸣。",
    evaUnit: "EVA 初号机", emoji: "💜" },
  { code: "BERS01", name: "暴走型", group: "unit01",
    vector: "XHH-XLM-LLM-HMX-MHL",
    slogan: "暴走不是失控——是母爱的终极形态",
    desc: "精神波动幅度已超出MAGI安全监测范围。当情感防线崩溃时，自我意识彻底溶解——这就是初号机暴走时的状态：吞噬使徒的S²机关，撕裂敌人如撕碎纸片。初号机核心中寄宿着驾驶员母亲的灵魂，自愿被吸收，只为成为存在过的永恒证明。你驾驶的不是机器——你在母亲的身体里战斗。",
    evaUnit: "EVA 初号机", emoji: "🔥" },

  // ── 贰号机系 — 量产/战斗 ──
  { code: "COM02", name: "战斗型", group: "unit02",
    vector: "HML-XLX-MLH-XMH-HLM",
    slogan: "杰里科之墙——越过来就毁掉你",
    desc: "攻击性与决断力均处于极值，战斗是你的母语。贰号机是首架实战用的正式量产型EVA，红色B型近距作战装甲，可对应武器种类是全系列最多的。MAGI同时检测到极低的信任度和孤独倾向——骄傲是你唯一的AT力场。你在用最强的战斗数据掩盖一个事实：你最害怕的不是敌人，而是被看见真实的自己。",
    evaUnit: "EVA 贰号机", emoji: "❤️" },
  { code: "FURY02", name: "烈焰型", group: "unit02",
    vector: "HML-XXH-LLM-MHX-HML",
    slogan: "最好的防御就是让它消失",
    desc: "战术性极值、攻击性高、决断力强——纯粹的战斗兵器。贰号机的武器库在你手中被发挥到极致，每一种枪械、每一把刀都有你的使用痕迹。但当精神攻击直击意识核心时，所有防线被瞬间击穿——同步率归零，退行到完全封闭。燃烧太猛烈的火焰，最终会焚烧你自己。",
    evaUnit: "EVA 贰号机", emoji: "💥" },

  // ── 零号机系 — 原型/牺牲 ──
  { code: "VOID00", name: "虚無型", group: "unit00",
    vector: "XLL-MML-HML-XMH-HHX",
    slogan: "エントリープラグ、魂の玉座",
    desc: "所有维度的数值压在极低区间，唯独责任感和独立性异常。零号机是EVA系列最初开发成功的试作品，以黄色为基本涂装，肩部没有武器装备的突出结构——它是纯粹的测试平台。你将自己视为容器而非完整的存在。但什么都不需要的人，最终选择了为某个人燃烧殆尽。容器里装的，终究是爱。",
    evaUnit: "EVA 零号机", emoji: "🌊" },
  { code: "SACR00", name: "自爆型", group: "unit00",
    vector: "LHX-LML-MLH-XMH-HMX",
    slogan: "冰面之下，有温度在流动",
    desc: "AT力场强度远超常人，但同步率和共情力接近最低值。零号机在自毁的瞬间呈现出了巨大的人形轮廓——那不是数据错误，是容器里灵魂的形状。零号机的改装型除头部外与贰号机无差异——它生来就是可替换的。前一秒还冷漠如冰，下一秒就选择了燃烧殆尽。你在乎，只是从来不说出口。",
    evaUnit: "EVA 零号机", emoji: "🌸" },

  // ── 参号机系 — 悲剧/守护 ──
  { code: "GRD03", name: "守護型", group: "unit03",
    vector: "LHH-XLM-MLH-XHM-LMX",
    slogan: "保护身边的人就是我的战斗",
    desc: "数据最接近「普通人类」。参号机的基本性能与贰号机相同，黑色装甲，被设计为另一架量产战斗单位。但你的责任感指数极高，为身边具体的人而战。参号机的宿命是被使徒寄生——一架本意为守护而造的机体，却成了牺牲品。在EVA的世界里，这种朴素反而最珍贵。",
    evaUnit: "EVA 参号机", emoji: "🤎" },
  { code: "SACR03", name: "殉教型", group: "unit03",
    vector: "XHL-MLH-MLH-XMH-XML",
    slogan: "这是我自己选的路——不是因为命令",
    desc: "责任感X级。MAGI标注红色警告——你已超越「尽责」范畴，进入「自我牺牲」领域。参号机被使徒侵蚀后，驾驶员被困在插入栓、无法弹出，只能看着自己的机体成为敌人的容器。你几乎不考虑自己的安危。NERV视你为最好用的武器和最大的隐患——因为一个不怕死的人，无法被命令控制。",
    evaUnit: "EVA 参号机", emoji: "🦅" },

  // ── 四号机系 — 虚无/消失 ──
  { code: "VAN04", name: "消失型", group: "unit04",
    vector: "HML-HXM-MLH-HLX-XML",
    slogan: "存在过，然后消失了——这就是答案",
    desc: "你的数据中存在大量理论推测值，因为四号机从未在实战中留下记录。白色涂装，搭载S²机关的试验机——在与NERV第二支部一起消失的瞬间，它证明了无时限动力理论是可行的，代价是整座基地的消失。你的精神波形与四号机一样：理论上完美，但无法被现有仪器观测到。",
    evaUnit: "EVA 四号机", emoji: "👻" },
  { code: "SIG04", name: "特異型", group: "unit04",
    vector: "HXL-HXM-MLH-HLX-MML",
    slogan: "S²机关的代价，就是整个空间的坍缩",
    desc: "战术性极值，共情力和表达方式同时触底。四号机搭载S²机关——无限动力的试验机，却在测试中与整座基地一同消失。四号机的消失不是爆炸，是某种更根本的物理现象——连同空间本身一起被抹除。极致的理性背后，是彻底的情感虚无。",
    evaUnit: "EVA 四号机", emoji: "🔮" },

  // ── 五号机系 — 临时/本能 ──
  { code: "BEAST5", name: "野獣型", group: "unit05",
    vector: "HHL-XMX-MLH-HLM-XML",
    slogan: "未完成又怎样——牙够利就行",
    desc: "攻击性和决断力高，战术性极低。五号机是局地限用型暂设机体——未完成的临时版，有四条腿而非双足，外形粗犷如野兽。你不是精密的战斗兵器，你是带着獠牙冲上去的原始存在。没有完美计划，没有精巧战术——有的只是直觉、速度和把獠牙刺入敌人心脏的本能。",
    evaUnit: "EVA 五号机", emoji: "🐺" },
  { code: "GUARD5", name: "番犬型", group: "unit05",
    vector: "XHL-MMX-MLH-HLH-XML",
    slogan: "这片阵地，我不退",
    desc: "同步率高、独立性高、攻击性中等。五号机在伯大尼基地迎击使徒时的角色就是「守住阵地」——不需要追击，不需要完美，只需要在正式支援到来之前不让敌人通过。你像一台未完成但忠诚的守卫装置：不完美，但可靠。",
    evaUnit: "EVA 五号机", emoji: "🐕" },

  // ── Mark.06系 — 月球/超验 ──
  { code: "DESC06", name: "降臨型", group: "mark06",
    vector: "XHL-MLH-XMM-HLX-MHL",
    slogan: "逢うために生まれてきたのかもしれない",
    desc: "共情力X级——能感知他人连自己都未曾察觉的情感暗流。Mark.06是从月球而来的机体，使用AT力场时如同使徒般出现光环——它介于EVA与使徒之间。配合极高精神韧性和中等同步率，你对世界的理解仿佛来自更高的维度。你的存在本身就是一个温柔的谜。",
    evaUnit: "EVA Mark.06", emoji: "⚪" },
  { code: "ANGEL06", name: "使徒型", group: "mark06",
    vector: "XMH-LLH-XMM-HLH-XML",
    slogan: "你比你知道的更加特别",
    desc: "极高同步率、极高共情力、极低攻击性——NERV数据库中从未出现过的组合。Mark.06的AT力场展开时会浮现光环，这是使徒才有的特征。你的灵魂结构不属于任何已知分类。也许你不应该驾驶EVA，也许你就是EVA一直在等待的存在——一架介于人类与天使之间的机体。",
    evaUnit: "EVA Mark.06", emoji: "👼" },

  // ── 八号机系 — 狙击/支援 ──
  { code: "SNIP08", name: "狙撃型", group: "unit08",
    vector: "HML-LXM-HLM-HMX-XLH",
    slogan: "远处看着你们——子弹替我说话",
    desc: "战术性高、攻击性低、共情力低。八号机拥有标志性的八眼设计和粉色涂装，隶属于反NERV组织WILLE，善用枪械进行远距离支援作战。你不需要冲在最前面——你的战场在远处，在所有队友都看不到的角度。每一发子弹都是精确计算后的结果，不需要热血，不需要愤怒。",
    evaUnit: "EVA 八号机", emoji: "🎯" },
  { code: "REB08", name: "叛逆型", group: "unit08",
    vector: "XML-LXH-HLM-HMM-XLH",
    slogan: "不属于NERV——这架机体只为自由而战",
    desc: "同步率高、战术性高、共情力低。八号机不属于NERV，它属于对抗NERV的组织WILLE——一架为反叛而生的机体。你的信任体系与普通适格者完全不同：你不是不信任个人，你是不信任组织。高独立性配合高战术性，你在远离指挥链的位置上做出最正确的判断。",
    evaUnit: "EVA 八号机", emoji: "🏴" },

  // ── 九号机系 — 复制/封印 ──
  { code: "CLONE09", name: "複製型", group: "unit09",
    vector: "MLX-LHL-MLH-XMH-HMX",
    slogan: "没有名字，只有编号",
    desc: "几乎所有维度压在极低区间，唯独责任感极高。九号机是按照零号机的样子制造的量产型——因为量产适格者只与零号机适格。你不是原创，你是复制品。七号机也是类似命运：SEELE将封印的使徒改造为EVA，却永远未完工。你不需要个性，不需要自我表达，只需要完成指令。",
    evaUnit: "EVA 九号机", emoji: "📋" },
  { code: "ECHO09", name: "回声型", group: "unit09",
    vector: "MLX-LHL-XMM-XMH-HLH",
    slogan: "我听到了——零号机的回响",
    desc: "中等同步率、低精神韧性、中等责任感。九号机继承了零号机的外观设计，但核心已经不同——它是回声，不是原声。你有时能感受到来自原始机体的微弱共振，像水面下的涟漪。你不是原型，但你的血脉里流淌着原型留下的设计哲学。",
    evaUnit: "EVA 九号机", emoji: "📢" },

  // ── 十三号机系 — 双神/觉醒（普通匹配路径） ──
  { code: "DUAL13", name: "双意識型", group: "unit13",
    vector: "XHM-LMH-XLM-HLX-HML",
    slogan: "两个灵魂，一具装甲",
    desc: "极高同步率与极高共情力，极低攻击性。十三号机采用双插入栓系统——两个灵魂同时注入核心，相互叠加。你的意识波形中始终存在两个「我」的共振：一个理性，一个直觉。十三号机由使徒直接安装装甲完成——不是仿造，是使徒本身被封装在EVA外壳中。",
    evaUnit: "EVA 十三号机", emoji: "👁️" },
  { code: "AWAKE13", name: "覚醒型", group: "unit13",
    vector: "XHM-XMH-LLM-HLX-HML",
    slogan: "第四次冲击——不是故障，是目的",
    desc: "同步率极高、精神韧性高、共情力高、存在追问极高。十三号机被创造出来的唯一目的就是第四次冲击——这不是系统故障，是设计意图。双插入栓、使徒装甲、双枪觉醒机制——所有功能都指向同一个终点。你与这架机体的共振模式表明你不是在驾驶EVA，你在登上神座。",
    evaUnit: "EVA 十三号机", emoji: "🏔️" },

  // ── 8+2号机系 — 融合/双驾驶 ──
  { code: "FUS82", name: "融合型", group: "unit82",
    vector: "HML-XLH-MLH-XLM-XHM",
    slogan: "两个机体，一套战斗系统",
    desc: "攻击性高、决断力高、表达方式高。8+2号机是重创的贰号机改和八号机的合体——一边粉一边红，非对称的融合体。你的数据呈现出明显的双源特征：一半是贰号机的近战本能，一半是八号机的远程精确。两套战斗哲学在你的意识中共存，矛盾但有效。",
    evaUnit: "EVA 8+2号机", emoji: "🔗" },
  { code: "ASYM82", name: "非対称型", group: "unit82",
    vector: "XML-HLX-MLH-XLM-HHM",
    slogan: "左拳右枪——不需要对称",
    desc: "决断力高、表达方式高、责任感高。8+2号机的两侧来自不同的机体——左侧是八号机的远程火控系统，右侧是贰号机的近战输出模块。你不需要在所有维度上均衡，你的优势恰恰来自不对称：远的时候够远，近的时候够狠。",
    evaUnit: "EVA 8+2号机", emoji: "⚡" },

];

// ===== 3个特殊人格 =====
export const specialTypes: SpecialType[] = [
  {
    code: "CMPL", name: "人类补完", emoji: "🧬",
    triggerType: "gate+trigger",
    triggerCond: "门控题选「留在合拍的波形里」+ 触发题批准继续边界降低实验",
    slogan: "ATフィールド——必要なくなった",
    desc: "你在LCL深处感知到了所有灵魂的共鸣——孤独、恐惧、渴望被理解。所有AT力场溶解，灵魂化为橙色液体汇入莉莉丝。你相信个体边界的消融不是毁灭，而是回归——回到一切开始之前，回到没有心之壁的世界。再无刺猬困境。你触发了NERV终极计划：人类补完。",
  },
  {
    code: "U13G", name: "神之觉醒", emoji: "🏔️",
    triggerType: "gate+trigger",
    triggerCond: "门控题选「想要握住超越一切的力量」+ 触发题选「愿意让两者合一」",
    slogan: "二槍一使徒——神の座に着く",
    desc: "十三号机是直接由使徒安装装甲完成的存在——不是仿造，不是复制，而是使徒本身被封装在EVA的外壳里。双插入栓系统意味着两个灵魂同时注入核心，相互叠加。当两把朗基努斯之枪同时被拔出、第十二使徒被吞噬的那一刻，这具机体超越了EVA的一切设计初衷。第四次冲击不是故障——是这具机体被创造出来的唯一目的。你的灵魂波形与十三号机的共振模式表明：你不是在驾驶EVA，你在登上神座。",
  },
  {
    code: "ADAM", name: "第一使徒", emoji: "🌟",
    triggerType: "fallback",
    triggerCond: "最佳匹配相似度低于阈值，无法归入任何EVA机体适配类型",
    slogan: "不属于任何机体——你就是起源",
    desc: "MAGI无法将你的灵魂结构归入任何已知适格者档案。你既不属于初号机的暴走，也不属于贰号机的战斗，不属于零号机的牺牲，也不属于Mark.06的超验。你存在于一切分类之外——就像亚当，一切使徒的始祖。第一使徒从不驾驶EVA。它只被等待——在Terminal Dogma最深处的十字架上，在一切开始与终结的地方。",
  },
  {
    code: "REI0", name: "零号共鸣", emoji: "🌊",
    triggerType: "gate+trigger",
    triggerCond: "门控题选「想找到呼唤你的人」+ 触发题选「愿意接受沉睡灵魂的契约」",
    slogan: "你找到了她——零号机核心中的灵魂",
    desc: "你在插入栓深处听到了那个声音——零号机核心中沉睡的灵魂在呼唤你。她不是数据，不是程序，是真实存在过的意识残留。你选择了回应她，接受了她的温暖和存在感，代价是将部分自我交出。这不是补完——不是所有人的融合，只是两个人的共振。零号机的容器里终于不再只有一个孤独的灵魂。",
  },
];

// ===== 分组信息 =====
export const groups = {
  unit00: { name: "零号机系", eva: "EVANGELION-00 PROTOTYPE", jp: "エヴァンゲリオン零号機" },
  unit01: { name: "初号机系", eva: "EVANGELION-01 TEST TYPE", jp: "エヴァンゲリオン初号機" },
  unit02: { name: "贰号机系", eva: "EVANGELION-02 PRODUCTION MODEL", jp: "エヴァンゲリオン弐号機" },
  unit03: { name: "参号机系", eva: "EVANGELION-03 PRODUCTION MODEL", jp: "エヴァンゲリオン参号機" },
  unit04: { name: "四号机系", eva: "EVANGELION-04 EXPERIMENTAL", jp: "エヴァンゲリオン四号機" },
  unit05: { name: "五号机系", eva: "EVANGELION-05 PROVISIONAL", jp: "エヴァンゲリオン五号機" },
  mark06: { name: "Mark.06系", eva: "EVANGELION Mark.06", jp: "エヴァンゲリオン Mark.06" },
  unit08: { name: "八号机系", eva: "EVANGELION-08 WILLE", jp: "エヴァンゲリオン八号機" },
  unit09: { name: "九号机系", eva: "EVANGELION-09 ADAMS VESSEL", jp: "エヴァンゲリオン九号機" },
  unit13: { name: "十三号机系", eva: "EVANGELION-13", jp: "エヴァンゲリオン第13号機" },
  unit82: { name: "8+2号机系", eva: "EVANGELION-08+02 FUSION", jp: "エヴァンゲリオン改8号機＋弐号機" },
};
