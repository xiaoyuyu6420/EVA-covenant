import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LANGS = ["en", "ja", "ko", "zh-TW"] as const;

// ===== GET: Download template =====
export async function GET() {
  // Dynamic import xlsx (server-only)
  const XLSX = await import("xlsx");

  // --- Questions sheet ---
  const qHeaders = [
    "dimCode", "order", "type", "value", "trigger",
    "text", "text_en", "text_ja", "text_ko", "text_zh-TW",
    "A", "A_en", "A_ja", "A_ko", "A_zh-TW", "A_score",
    "B", "B_en", "B_ja", "B_ko", "B_zh-TW", "B_score",
    "C", "C_en", "C_ja", "C_ko", "C_zh-TW", "C_score",
    "D", "D_en", "D_ja", "D_ko", "D_zh-TW", "D_score",
    "E", "E_en", "E_ja", "E_ko", "E_zh-TW", "E_score",
  ];

  // Sample rows for reference
  const qSample = [
    {
      dimCode: "A1", order: 0, type: "regular", value: "", trigger: "",
      text: "插入栓内LCL灌满的瞬间，你感受到的是？",
      text_en: "", text_ja: "", text_ko: "", "text_zh-TW": "",
      A: "压迫与窒息，本能地想要挣脱", A_en: "", A_ja: "", A_ko: "", A_zh_TW: "", A_score: 1,
      B: "一种奇异的安宁，仿佛回到母体", B_en: "", B_ja: "", B_ko: "", B_zh_TW: "", B_score: 2,
      C: "LCL就是你，你就是LCL——边界消失了", C_en: "", C_ja: "", C_ko: "", C_zh_TW: "", C_score: 3,
      D: "", D_en: "", D_ja: "", D_ko: "", D_zh_TW: "", D_score: 0,
      E: "", E_en: "", E_ja: "", E_ko: "", E_zh_TW: "", E_score: 0,
    },
    {
      dimCode: "GATE", order: 30, type: "gate", value: "", trigger: "",
      text: "（门控题题目文本）",
      text_en: "", text_ja: "", text_ko: "", "text_zh-TW": "",
      A: "选项1", A_en: "", A_ja: "", A_ko: "", A_zh_TW: "", A_score: 0,
      B: "选项2", B_en: "", B_ja: "", B_ko: "", B_zh_TW: "", B_score: 0,
      C: "", C_en: "", C_ja: "", C_ko: "", C_zh_TW: "", C_score: 0,
      D: "", D_en: "", D_ja: "", D_ko: "", D_zh_TW: "", D_score: 0,
      E: "", E_en: "", E_ja: "", E_ko: "", E_zh_TW: "", E_score: 0,
    },
  ];

  // --- Personality Types sheet ---
  const pHeaders = [
    "code", "group", "vector", "emoji",
    "name", "name_en", "name_ja", "name_ko", "name_zh-TW",
    "slogan", "slogan_en", "slogan_ja", "slogan_ko", "slogan_zh-TW",
    "desc", "desc_en", "desc_ja", "desc_ko", "desc_zh-TW",
    "evaUnit", "evaUnit_en", "evaUnit_ja", "evaUnit_ko", "evaUnit_zh-TW",
  ];

  const pSample = [
    {
      code: "SYNC01", group: "unit01", vector: "HML-MML-HHL-MHM-HLL", emoji: "💜",
      name: "同调型", name_en: "", name_ja: "", name_ko: "", name_zh_TW: "",
      slogan: "在沉默中听见心跳", slogan_en: "", slogan_ja: "", slogan_ko: "", slogan_zh_TW: "",
      desc: "（人格描述文本）", desc_en: "", desc_ja: "", desc_ko: "", desc_zh_TW: "",
      evaUnit: "EVA 初号机", evaUnit_en: "", evaUnit_ja: "", evaUnit_ko: "", evaUnit_zh_TW: "",
    },
  ];

  // --- Special Types sheet ---
  const sHeaders = [
    "code", "triggerType", "triggerCond", "emoji",
    "name", "name_en", "name_ja", "name_ko", "name_zh-TW",
    "slogan", "slogan_en", "slogan_ja", "slogan_ko", "slogan_zh-TW",
    "desc", "desc_en", "desc_ja", "desc_ko", "desc_zh-TW",
  ];

  const sSample = [
    {
      code: "CMPL", triggerType: "gate+trigger", triggerCond: "gate=complement,trigger=CMPL,scores[C1]>=5,scores[A3]<=4", emoji: "🧬",
      name: "人类补完", name_en: "", name_ja: "", name_ko: "", name_zh_TW: "",
      slogan: "", slogan_en: "", slogan_ja: "", slogan_ko: "", slogan_zh_TW: "",
      desc: "（特殊人格描述）", desc_en: "", desc_ja: "", desc_ko: "", desc_zh_TW: "",
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet([Object.fromEntries(qHeaders.map((h) => [h, ""]))], { header: qHeaders });
  // Add sample rows below header
  XLSX.utils.sheet_add_json(ws1, qSample, { header: qHeaders, origin: "A2", skipHeader: true });
  XLSX.utils.book_append_sheet(wb, ws1, "Questions");

  const ws2 = XLSX.utils.json_to_sheet([Object.fromEntries(pHeaders.map((h) => [h, ""]))], { header: pHeaders });
  XLSX.utils.sheet_add_json(ws2, pSample, { header: pHeaders, origin: "A2", skipHeader: true });
  XLSX.utils.book_append_sheet(wb, ws2, "PersonalityTypes");

  const ws3 = XLSX.utils.json_to_sheet([Object.fromEntries(sHeaders.map((h) => [h, ""]))], { header: sHeaders });
  XLSX.utils.sheet_add_json(ws3, sSample, { header: sHeaders, origin: "A2", skipHeader: true });
  XLSX.utils.book_append_sheet(wb, ws3, "SpecialTypes");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=eva-covenant-template.xlsx",
    },
  });
}

// ===== POST: Upload and import =====
export async function POST(req: NextRequest) {
  try {
    const XLSX = await import("xlsx");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });

    // --- Parse Questions ---
    const qSheet = wb.Sheets["Questions"];
    if (!qSheet) return NextResponse.json({ error: "Missing 'Questions' sheet" }, { status: 400 });
    const qRows = XLSX.utils.sheet_to_json<Record<string, string | number>>(qSheet);

    // Clear old questions + options
    await prisma.option.deleteMany();
    await prisma.question.deleteMany();

    let questionCount = 0;
    let optionCount = 0;

    for (const row of qRows) {
      if (!row.dimCode || !row.text) continue;

      const qType = String(row.type || "regular");
      const isGate = qType === "gate";
      const isTrigger = qType === "trigger";

      // Build translations for question text
      const qTranslations: Record<string, Record<string, string>> = {};
      for (const lang of LANGS) {
        const val = String(row[`text_${lang}`] ?? "").trim();
        if (val) {
          if (!qTranslations[lang]) qTranslations[lang] = {};
          qTranslations[lang].text = val;
        }
      }

      // Build options
      const optionLetters = ["A", "B", "C", "D", "E"];
      const options: Array<{ label: string; score: number; value: string | null; trigger: string | null; order: number; translations: string | null }> = [];

      for (let oi = 0; oi < optionLetters.length; oi++) {
        const letter = optionLetters[oi];
        const label = String(row[letter] ?? "").trim();
        if (!label) continue;

        const score = Number(row[`${letter}_score`]) || 0;
        const optTranslations: Record<string, Record<string, string>> = {};
        for (const lang of LANGS) {
          const val = String(row[`${letter}_${lang}`] ?? "").trim();
          if (val) {
            if (!optTranslations[lang]) optTranslations[lang] = {};
            optTranslations[lang].label = val;
          }
        }

        options.push({
          label,
          score,
          value: isGate ? String(row.value ?? row[letter] ?? "").trim() || null : null,
          trigger: isTrigger ? String(row.trigger ?? row[letter] ?? "").trim() || null : null,
          order: oi,
          translations: Object.keys(optTranslations).length > 0 ? JSON.stringify(optTranslations) : null,
        });
      }

      await prisma.question.create({
        data: {
          dimCode: String(row.dimCode),
          text: String(row.text),
          order: Number(row.order) || 0,
          isGate,
          isTrigger,
          translations: Object.keys(qTranslations).length > 0 ? JSON.stringify(qTranslations) : null,
          options: {
            create: options.map((o) => ({
              label: o.label,
              score: o.score,
              value: o.value,
              trigger: o.trigger,
              order: o.order,
              translations: o.translations,
            })),
          },
        },
      });
      questionCount++;
      optionCount += options.length;
    }

    // --- Parse Personality Types ---
    const pSheet = wb.Sheets["PersonalityTypes"];
    let personalityCount = 0;
    if (pSheet) {
      const pRows = XLSX.utils.sheet_to_json<Record<string, string | number>>(pSheet);
      await prisma.personalityType.deleteMany();

      for (const row of pRows) {
        if (!row.code || !row.name || !row.vector) continue;
        const t = buildTranslations(row, ["name", "slogan", "desc", "evaUnit"]);
        await prisma.personalityType.create({
          data: {
            code: String(row.code),
            name: String(row.name),
            group: String(row.group || ""),
            vector: String(row.vector),
            slogan: String(row.slogan || ""),
            desc: String(row.desc || ""),
            evaUnit: row.evaUnit ? String(row.evaUnit) : null,
            emoji: String(row.emoji || ""),
            translations: Object.keys(t).length > 0 ? JSON.stringify(t) : null,
          },
        });
        personalityCount++;
      }
    }

    // --- Parse Special Types ---
    const sSheet = wb.Sheets["SpecialTypes"];
    let specialCount = 0;
    if (sSheet) {
      const sRows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sSheet);
      await prisma.specialType.deleteMany();

      for (const row of sRows) {
        if (!row.code || !row.name) continue;
        const t = buildTranslations(row, ["name", "slogan", "desc"]);
        await prisma.specialType.create({
          data: {
            code: String(row.code),
            name: String(row.name),
            triggerType: String(row.triggerType || ""),
            triggerCond: String(row.triggerCond || ""),
            slogan: String(row.slogan || ""),
            desc: String(row.desc || ""),
            emoji: String(row.emoji || ""),
            translations: Object.keys(t).length > 0 ? JSON.stringify(t) : null,
          },
        });
        specialCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      imported: { questions: questionCount, options: optionCount, personalityTypes: personalityCount, specialTypes: specialCount },
    });
  } catch (e) {
    console.error("Import error:", e);
    return NextResponse.json({ error: "Import failed: " + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}

function buildTranslations(row: Record<string, string | number>, fields: string[]): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const lang of LANGS) {
    for (const field of fields) {
      const val = String(row[`${field}_${lang}`] ?? "").trim();
      if (val) {
        if (!result[lang]) result[lang] = {};
        result[lang][field] = val;
      }
    }
  }
  return result;
}
