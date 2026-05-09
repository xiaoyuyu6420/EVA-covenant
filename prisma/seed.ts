import { PrismaClient } from "@prisma/client";
import { questions, gateQuestion, triggerQuestion, unit13TriggerQuestion, reiTriggerQuestion, personalityTypes, specialTypes } from "../src/lib/quiz-data";

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding database...");

  // 清空旧数据
  await prisma.answer.deleteMany();
  await prisma.testRecord.deleteMany();
  await prisma.eventLog.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.personalityType.deleteMany();
  await prisma.specialType.deleteMany();

  // 插入常规题目
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const question = await prisma.question.create({
      data: {
        dimCode: q.dim,
        text: q.text,
        order: i,
        options: {
          create: q.options.map((opt, j) => ({
            label: opt.label,
            score: opt.score,
            order: j,
          })),
        },
      },
    });
  }

  // 插入门控题
  await prisma.question.create({
    data: {
      dimCode: "GATE",
      text: gateQuestion.text,
      order: 30, // 在第30题位置
      isGate: true,
      options: {
        create: gateQuestion.options.map((opt, j) => ({
          label: opt.label,
          score: 0,
          value: opt.value,
          order: j,
        })),
      },
    },
  });

  // 插入触发题
  await prisma.question.create({
    data: {
      dimCode: "TRIGGER",
      text: triggerQuestion.text,
      order: 999,
      isTrigger: true,
      options: {
        create: triggerQuestion.options.map((opt, j) => ({
          label: opt.label,
          score: 0,
          trigger: opt.trigger,
          order: j,
        })),
      },
    },
  });

  // 插入触发题：十三号机
  await prisma.question.create({
    data: {
      dimCode: "TRIGGER_U13",
      text: unit13TriggerQuestion.text,
      order: 998,
      isTrigger: true,
      options: {
        create: unit13TriggerQuestion.options.map((opt, j) => ({
          label: opt.label,
          score: 0,
          trigger: opt.trigger,
          order: j,
        })),
      },
    },
  });

  // 插入触发题：绫波路线
  await prisma.question.create({
    data: {
      dimCode: "TRIGGER_REI",
      text: reiTriggerQuestion.text,
      order: 997,
      isTrigger: true,
      options: {
        create: reiTriggerQuestion.options.map((opt, j) => ({
          label: opt.label,
          score: 0,
          trigger: opt.trigger,
          order: j,
        })),
      },
    },
  });

  // 插入人格类型
  for (const pt of personalityTypes) {
    await prisma.personalityType.create({
      data: {
        code: pt.code,
        name: pt.name,
        group: pt.group,
        vector: pt.vector,
        slogan: pt.slogan,
        desc: pt.desc,
        evaUnit: pt.evaUnit,
        emoji: pt.emoji,
      },
    });
  }

  // 插入特殊人格
  for (const st of specialTypes) {
    await prisma.specialType.create({
      data: {
        code: st.code,
        name: st.name,
        triggerType: st.triggerType,
        triggerCond: st.triggerCond,
        slogan: st.slogan,
        desc: st.desc,
        emoji: st.emoji,
      },
    });
  }

  console.log("Seed completed!");
  console.log(`  Questions: ${questions.length + 4}`);
  console.log(`  Personality Types: ${personalityTypes.length}`);
  console.log(`  Special Types: ${specialTypes.length}`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
