import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LANGS = ["en", "ja", "ko", "zh-TW"] as const;

function parseTranslations(raw: string | null | undefined): Record<string, Record<string, string>> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export async function GET() {
  const [questions, personalityTypes, specialTypes] = await Promise.all([
    prisma.question.findMany({
      orderBy: { order: "asc" },
      include: { options: { orderBy: { order: "asc" } } },
    }),
    prisma.personalityType.findMany({ orderBy: { code: "asc" } }),
    prisma.specialType.findMany({ orderBy: { code: "asc" } }),
  ]);

  const lines: string[] = [];

  lines.push("# EVA-Covenant 题库数据");
  lines.push(``);
  lines.push(`> 导出时间: ${new Date().toLocaleString("zh-CN")}`);
  lines.push(``);

  // ===== Questions =====
  lines.push(`---`);
  lines.push(``);
  lines.push(`## 题目列表 (${questions.length})`);
  lines.push(``);

  for (const q of questions) {
    const qTrans = parseTranslations(q.translations);
    const typeLabel = q.isGate ? "门控题" : q.isTrigger ? "触发题" : "常规题";

    lines.push(`### ${q.dimCode} — ${typeLabel}`);
    lines.push(``);
    lines.push(`**order:** ${q.order}`);
    lines.push(``);
    lines.push(`**题目:** ${q.text}`);
    lines.push(``);

    for (const lang of LANGS) {
      const t = qTrans[lang]?.text;
      if (t) {
        lines.push(`- **${lang}:** ${t}`);
      }
    }
    if (LANGS.some(l => qTrans[l]?.text)) lines.push(``);

    lines.push(`**选项:**`);
    lines.push(``);
    for (const opt of q.options) {
      const optTrans = parseTranslations(opt.translations);
      let optLine = `- **${opt.label}** (分值: ${opt.score})`;
      if (opt.value) optLine += ` | value: \`${opt.value}\``;
      if (opt.trigger) optLine += ` | trigger: \`${opt.trigger}\``;
      lines.push(optLine);

      for (const lang of LANGS) {
        const t = optTrans[lang]?.label;
        if (t) {
          lines.push(`  - ${lang}: ${t}`);
        }
      }
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  // ===== Personality Types =====
  lines.push(`## 人格类型 (${personalityTypes.length})`);
  lines.push(``);

  for (const p of personalityTypes) {
    const trans = parseTranslations(p.translations);

    lines.push(`### ${p.emoji} ${p.name} (\`${p.code}\`)`);
    lines.push(``);
    lines.push(`- **Group:** ${p.group}`);
    lines.push(`- **Vector:** \`${p.vector}\``);
    if (p.evaUnit) lines.push(`- **EVA机体:** ${p.evaUnit}`);
    lines.push(``);
    lines.push(`> ${p.slogan}`);
    lines.push(``);
    lines.push(p.desc);
    lines.push(``);

    for (const lang of LANGS) {
      const name = trans[lang]?.name;
      const slogan = trans[lang]?.slogan;
      const desc = trans[lang]?.desc;
      const evaUnit = trans[lang]?.evaUnit;
      if (name || slogan || desc || evaUnit) {
        lines.push(`**${lang}:**`);
        lines.push(``);
        if (name) lines.push(`- 名称: ${name}`);
        if (slogan) lines.push(`- 标语: ${slogan}`);
        if (desc) lines.push(`- 描述: ${desc}`);
        if (evaUnit) lines.push(`- EVA机体: ${evaUnit}`);
        lines.push(``);
      }
    }
    lines.push(`---`);
    lines.push(``);
  }

  // ===== Special Types =====
  lines.push(`## 特殊人格 (${specialTypes.length})`);
  lines.push(``);

  for (const s of specialTypes) {
    const trans = parseTranslations(s.translations);

    lines.push(`### ${s.emoji} ${s.name} (\`${s.code}\`)`);
    lines.push(``);
    lines.push(`- **触发类型:** ${s.triggerType}`);
    lines.push(`- **触发条件:** \`${s.triggerCond}\``);
    lines.push(``);
    lines.push(`> ${s.slogan}`);
    lines.push(``);
    lines.push(s.desc);
    lines.push(``);

    for (const lang of LANGS) {
      const name = trans[lang]?.name;
      const slogan = trans[lang]?.slogan;
      const desc = trans[lang]?.desc;
      if (name || slogan || desc) {
        lines.push(`**${lang}:**`);
        lines.push(``);
        if (name) lines.push(`- 名称: ${name}`);
        if (slogan) lines.push(`- 标语: ${slogan}`);
        if (desc) lines.push(`- 描述: ${desc}`);
        lines.push(``);
      }
    }
    lines.push(`---`);
    lines.push(``);
  }

  const content = lines.join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": "attachment; filename=eva-covenant-quiz.md",
    },
  });
}

// ===== POST: Import from Markdown =====
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const content = await file.text();
    const lines = content.split("\n");

    const skippedRows: string[] = [];
    const questionCreates: Array<{
      data: {
        dimCode: string;
        text: string;
        order: number;
        isGate: boolean;
        isTrigger: boolean;
        translations: string | null;
        options: { create: Array<{ label: string; score: number; value: string | null; trigger: string | null; order: number; translations: string | null }> };
      };
    }> = [];
    const personalityCreates: Array<{
      data: {
        code: string;
        name: string;
        group: string;
        vector: string;
        slogan: string;
        desc: string;
        evaUnit: string | null;
        emoji: string;
        translations: string | null;
      };
    }> = [];
    const specialCreates: Array<{
      data: {
        code: string;
        name: string;
        triggerType: string;
        triggerCond: string;
        slogan: string;
        desc: string;
        emoji: string;
        translations: string | null;
      };
    }> = [];

    let section: "questions" | "personalities" | "specials" | null = null;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      if (line.startsWith("## 题目列表")) {
        section = "questions";
      } else if (line.startsWith("## 人格类型")) {
        section = "personalities";
      } else if (line.startsWith("## 特殊人格")) {
        section = "specials";
      } else if (line.startsWith("### ") && section) {
        const headerMatch = line.match(/^### (.+?) — (.+)$/);
        if (!headerMatch) {
          i++;
          continue;
        }

        const [, nameOrDimCode, typeLabel] = headerMatch;

        if (section === "questions") {
          const result = parseQuestionBlock(lines, i, nameOrDimCode, typeLabel);
          if (result) {
            questionCreates.push(result.data);
            i = result.endIndex;
            continue;
          } else {
            skippedRows.push(`Question ${nameOrDimCode} parse failed`);
          }
        } else if (section === "personalities") {
          const result = parsePersonalityBlock(lines, i, nameOrDimCode, typeLabel);
          if (result) {
            personalityCreates.push(result.data);
            i = result.endIndex;
            continue;
          } else {
            skippedRows.push(`Personality ${nameOrDimCode} parse failed`);
          }
        } else if (section === "specials") {
          const result = parseSpecialBlock(lines, i, nameOrDimCode, typeLabel);
          if (result) {
            specialCreates.push(result.data);
            i = result.endIndex;
            continue;
          } else {
            skippedRows.push(`Special ${nameOrDimCode} parse failed`);
          }
        }
      }

      i++;
    }

    await prisma.$transaction([
      prisma.option.deleteMany(),
      prisma.question.deleteMany(),
      prisma.personalityType.deleteMany(),
      prisma.specialType.deleteMany(),
      ...questionCreates.map((q) => prisma.question.create(q)),
      ...personalityCreates.map((p) => prisma.personalityType.create(p)),
      ...specialCreates.map((s) => prisma.specialType.create(s)),
    ]);

    return NextResponse.json({
      ok: true,
      imported: {
        questions: questionCreates.length,
        options: questionCreates.reduce((sum, q) => sum + q.data.options.create.length, 0),
        personalityTypes: personalityCreates.length,
        specialTypes: specialCreates.length,
      },
      skipped: skippedRows.length > 0 ? skippedRows : undefined,
    });
  } catch (e) {
    console.error("Import MD error:", e);
    return NextResponse.json({ error: "Import failed: " + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}

function parseQuestionBlock(lines: string[], startIdx: number, dimCode: string, typeLabel: string) {
  const isGate = typeLabel === "门控题";
  const isTrigger = typeLabel === "触发题";
  let order = 0;
  let text = "";
  const translations: Record<string, Record<string, string>> = {};
  const options: Array<{ label: string; score: number; value: string | null; trigger: string | null; order: number; translations: string | null }> = [];

  let i = startIdx + 1;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.startsWith("---") || line.startsWith("### ")) break;

    if (line.startsWith("**order:**")) {
      const m = line.match(/\*\*order:\*\*\s*(\d+)/);
      if (m) order = parseInt(m[1], 10);
    } else if (line.startsWith("**题目:**")) {
      const m = line.match(/\*\*题目:\*\*\s*(.+)$/);
      if (m) text = m[1].trim();
    } else if (line.match(/^- \*\*(en|ja|ko|zh-TW)\:\*\*/)) {
      const m = line.match(/^- \*\*(en|ja|ko|zh-TW)\:\*\*\s*(.+)$/);
      if (m) {
        const lang = m[1];
        if (!translations[lang]) translations[lang] = {};
        translations[lang].text = m[2].trim();
      }
    } else if (line.startsWith("**选项:**")) {
      i++;
      let optOrder = 0;
      while (i < lines.length) {
        const optLine = lines[i].trim();
        if (optLine.startsWith("---") || optLine.startsWith("### ") || optLine.startsWith("**")) break;

        if (optLine.match(/^- \*\*[^*]+\*\* \(分值:/)) {
          const m = optLine.match(/^- \*\*([^*]+)\*\* \(分值:\s*(\d+)\)(?:\s*\|\s*value:\s*`([^`]+)`)?(?:\s*\|\s*trigger:\s*`([^`]+)`)?/);
          if (m) {
            const label = m[1].trim();
            const score = parseInt(m[2], 10);
            const value = m[3] || null;
            const trigger = m[4] || null;
            const optTrans: Record<string, Record<string, string>> = {};

            i++;
            while (i < lines.length) {
              const subLine = lines[i].trim();
              if (subLine.match(/^  - (en|ja|ko|zh-TW):/)) {
                const sm = subLine.match(/^  - (en|ja|ko|zh-TW):\s*(.+)$/);
                if (sm) {
                  const lang = sm[1];
                  if (!optTrans[lang]) optTrans[lang] = {};
                  optTrans[lang].label = sm[2].trim();
                }
                i++;
              } else {
                break;
              }
            }

            options.push({
              label,
              score,
              value: isGate ? value : null,
              trigger: isTrigger ? trigger : null,
              order: optOrder++,
              translations: Object.keys(optTrans).length > 0 ? JSON.stringify(optTrans) : null,
            });
            continue;
          }
        }
        i++;
      }
      continue;
    }

    i++;
  }

  if (!text) return null;

  return {
    data: {
      dimCode,
      text,
      order,
      isGate,
      isTrigger,
      translations: Object.keys(translations).length > 0 ? JSON.stringify(translations) : null,
      options: { create: options },
    },
    endIndex: i,
  };
}

function parsePersonalityBlock(lines: string[], startIdx: number, emojiName: string, code: string) {
  const codeMatch = code.match(/^`([^`]+)`$/);
  const actualCode = codeMatch ? codeMatch[1] : code;
  const emojiMatch = emojiName.match(/^([^\s]+)\s+(.+)$/);
  const emoji = emojiMatch ? emojiMatch[1] : "";
  const name = emojiMatch ? emojiMatch[2] : emojiName;

  let group = "";
  let vector = "";
  let evaUnit: string | null = null;
  let slogan = "";
  let desc = "";
  const translations: Record<string, Record<string, string>> = {};

  let i = startIdx + 1;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.startsWith("---") || line.startsWith("### ")) break;

    if (line.startsWith("- **Group:**")) {
      const m = line.match(/- \*\*Group:\*\*\s*(.+)$/);
      if (m) group = m[1].trim();
    } else if (line.startsWith("- **Vector:**")) {
      const m = line.match(/- \*\*Vector:\*\*\s*`([^`]+)`/);
      if (m) vector = m[1];
    } else if (line.startsWith("- **EVA机体:**")) {
      const m = line.match(/- \*\*EVA机体:\*\*\s*(.+)$/);
      if (m) evaUnit = m[1].trim();
    } else if (line.startsWith(">")) {
      const m = line.match(/^>\s*(.+)$/);
      if (m) slogan = m[1].trim();
    } else if (line.match(/^\*\*(en|ja|ko|zh-TW)\:\*\*$/)) {
      const langMatch = line.match(/^\*\*(en|ja|ko|zh-TW)\:\*\*$/);
      if (langMatch) {
        const lang = langMatch[1];
        i++;
        while (i < lines.length) {
          const subLine = lines[i].trim();
          if (subLine.startsWith("---") || subLine.startsWith("### ") || subLine.match(/^\*\*(en|ja|ko|zh-TW)\:\*\*$/)) {
            i--;
            break;
          }
          if (subLine.startsWith("- 名称:")) {
            const m = subLine.match(/- 名称:\s*(.+)$/);
            if (m) {
              if (!translations[lang]) translations[lang] = {};
              translations[lang].name = m[1].trim();
            }
          } else if (subLine.startsWith("- 标语:")) {
            const m = subLine.match(/- 标语:\s*(.+)$/);
            if (m) {
              if (!translations[lang]) translations[lang] = {};
              translations[lang].slogan = m[1].trim();
            }
          } else if (subLine.startsWith("- 描述:")) {
            const m = subLine.match(/- 描述:\s*(.+)$/);
            if (m) {
              if (!translations[lang]) translations[lang] = {};
              translations[lang].desc = m[1].trim();
            }
          } else if (subLine.startsWith("- EVA机体:")) {
            const m = subLine.match(/- EVA机体:\s*(.+)$/);
            if (m) {
              if (!translations[lang]) translations[lang] = {};
              translations[lang].evaUnit = m[1].trim();
            }
          }
          i++;
        }
      }
    } else if (line && !line.startsWith("-") && !line.startsWith(">") && !line.startsWith("*") && !line.startsWith("**")) {
      if (desc) desc += " " + line;
      else desc = line;
    }

    i++;
  }

  if (!vector) return null;

  return {
    data: {
      code: actualCode,
      name,
      group,
      vector,
      slogan,
      desc,
      evaUnit,
      emoji,
      translations: Object.keys(translations).length > 0 ? JSON.stringify(translations) : null,
    },
    endIndex: i,
  };
}

function parseSpecialBlock(lines: string[], startIdx: number, emojiName: string, code: string) {
  const codeMatch = code.match(/^`([^`]+)`$/);
  const actualCode = codeMatch ? codeMatch[1] : code;
  const emojiMatch = emojiName.match(/^([^\s]+)\s+(.+)$/);
  const emoji = emojiMatch ? emojiMatch[1] : "";
  const name = emojiMatch ? emojiMatch[2] : emojiName;

  let triggerType = "";
  let triggerCond = "";
  let slogan = "";
  let desc = "";
  const translations: Record<string, Record<string, string>> = {};

  let i = startIdx + 1;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.startsWith("---") || line.startsWith("### ")) break;

    if (line.startsWith("- **触发类型:**")) {
      const m = line.match(/- \*\*触发类型:\*\*\s*(.+)$/);
      if (m) triggerType = m[1].trim();
    } else if (line.startsWith("- **触发条件:**")) {
      const m = line.match(/- \*\*触发条件:\*\*\s*`([^`]+)`/);
      if (m) triggerCond = m[1];
    } else if (line.startsWith(">")) {
      const m = line.match(/^>\s*(.+)$/);
      if (m) slogan = m[1].trim();
    } else if (line.match(/^\*\*(en|ja|ko|zh-TW)\:\*\*$/)) {
      const langMatch = line.match(/^\*\*(en|ja|ko|zh-TW)\:\*\*$/);
      if (langMatch) {
        const lang = langMatch[1];
        i++;
        while (i < lines.length) {
          const subLine = lines[i].trim();
          if (subLine.startsWith("---") || subLine.startsWith("### ") || subLine.match(/^\*\*(en|ja|ko|zh-TW)\:\*\*$/)) {
            i--;
            break;
          }
          if (subLine.startsWith("- 名称:")) {
            const m = subLine.match(/- 名称:\s*(.+)$/);
            if (m) {
              if (!translations[lang]) translations[lang] = {};
              translations[lang].name = m[1].trim();
            }
          } else if (subLine.startsWith("- 标语:")) {
            const m = subLine.match(/- 标语:\s*(.+)$/);
            if (m) {
              if (!translations[lang]) translations[lang] = {};
              translations[lang].slogan = m[1].trim();
            }
          } else if (subLine.startsWith("- 描述:")) {
            const m = subLine.match(/- 描述:\s*(.+)$/);
            if (m) {
              if (!translations[lang]) translations[lang] = {};
              translations[lang].desc = m[1].trim();
            }
          }
          i++;
        }
      }
    } else if (line && !line.startsWith("-") && !line.startsWith(">") && !line.startsWith("*") && !line.startsWith("**")) {
      if (desc) desc += " " + line;
      else desc = line;
    }

    i++;
  }

  return {
    data: {
      code: actualCode,
      name,
      triggerType,
      triggerCond,
      slogan,
      desc,
      emoji,
      translations: Object.keys(translations).length > 0 ? JSON.stringify(translations) : null,
    },
    endIndex: i,
  };
}
