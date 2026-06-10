import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const LANGS = ["en", "ja", "ko", "zh-TW"] as const;

function parseTranslations(raw: string | null | undefined): Record<string, Record<string, string>> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

// ===== GET: Download current quiz data as Excel =====
export async function GET(req: NextRequest) {
  // 验证管理员身份
  const authError = requireAdmin(req);
  if (authError) return authError;

  const XLSX = await import("xlsx");

  // Fetch all data from database
  const [questions, personalityTypes, specialTypes] = await Promise.all([
    prisma.question.findMany({
      orderBy: { order: "asc" },
      include: { options: { orderBy: { order: "asc" } } },
    }),
    prisma.personalityType.findMany({ orderBy: { code: "asc" } }),
    prisma.specialType.findMany({ orderBy: { code: "asc" } }),
  ]);

  // --- Questions sheet ---
  const qHeaders = [
    "dimCode", "order", "type",
    "text", "text_en", "text_ja", "text_ko", "text_zh-TW",
    "A", "A_en", "A_ja", "A_ko", "A_zh-TW", "A_score", "A_value", "A_trigger",
    "B", "B_en", "B_ja", "B_ko", "B_zh-TW", "B_score", "B_value", "B_trigger",
    "C", "C_en", "C_ja", "C_ko", "C_zh-TW", "C_score", "C_value", "C_trigger",
    "D", "D_en", "D_ja", "D_ko", "D_zh-TW", "D_score", "D_value", "D_trigger",
    "E", "E_en", "E_ja", "E_ko", "E_zh-TW", "E_score", "E_value", "E_trigger",
  ];

  const qRows: Record<string, string | number>[] = [];
  for (const q of questions) {
    const qTrans = parseTranslations(q.translations);
    let row: Record<string, string | number> = {
      dimCode: q.dimCode,
      order: q.order,
      type: q.isGate ? "gate" : q.isTrigger ? "trigger" : "regular",
      text: q.text,
    };
    for (const lang of LANGS) {
      row[`text_${lang}`] = qTrans[lang]?.text ?? "";
    }

    const optionLetters = ["A", "B", "C", "D", "E"];
    for (let i = 0; i < optionLetters.length; i++) {
      const letter = optionLetters[i];
      const opt = q.options[i];
      if (opt) {
        const optTrans = parseTranslations(opt.translations);
        row[letter] = opt.label;
        for (const lang of LANGS) {
          row[`${letter}_${lang}`] = optTrans[lang]?.label ?? "";
        }
        row[`${letter}_score`] = opt.score;
        row[`${letter}_value`] = opt.value ?? "";
        row[`${letter}_trigger`] = opt.trigger ?? "";
      } else {
        row[letter] = "";
        for (const lang of LANGS) row[`${letter}_${lang}`] = "";
        row[`${letter}_score`] = 0;
        row[`${letter}_value`] = "";
        row[`${letter}_trigger`] = "";
      }
    }
    qRows.push(row);
  }

  // --- Personality Types sheet ---
  const pHeaders = [
    "code", "group", "vector", "emoji",
    "name", "name_en", "name_ja", "name_ko", "name_zh-TW",
    "slogan", "slogan_en", "slogan_ja", "slogan_ko", "slogan_zh-TW",
    "desc", "desc_en", "desc_ja", "desc_ko", "desc_zh-TW",
    "evaUnit", "evaUnit_en", "evaUnit_ja", "evaUnit_ko", "evaUnit_zh-TW",
  ];

  const pRows: Record<string, string | number>[] = [];
  for (const p of personalityTypes) {
    const trans = parseTranslations(p.translations);
    const row: Record<string, string | number> = {
      code: p.code,
      group: p.group,
      vector: p.vector,
      emoji: p.emoji,
      name: p.name,
      slogan: p.slogan,
      desc: p.desc,
      evaUnit: p.evaUnit ?? "",
    };
    for (const lang of LANGS) {
      row[`name_${lang}`] = trans[lang]?.name ?? "";
      row[`slogan_${lang}`] = trans[lang]?.slogan ?? "";
      row[`desc_${lang}`] = trans[lang]?.desc ?? "";
      row[`evaUnit_${lang}`] = trans[lang]?.evaUnit ?? "";
    }
    pRows.push(row);
  }

  // --- Special Types sheet ---
  const sHeaders = [
    "code", "triggerType", "triggerCond", "emoji",
    "name", "name_en", "name_ja", "name_ko", "name_zh-TW",
    "slogan", "slogan_en", "slogan_ja", "slogan_ko", "slogan_zh-TW",
    "desc", "desc_en", "desc_ja", "desc_ko", "desc_zh-TW",
  ];

  const sRows: Record<string, string | number>[] = [];
  for (const s of specialTypes) {
    const trans = parseTranslations(s.translations);
    const row: Record<string, string | number> = {
      code: s.code,
      triggerType: s.triggerType,
      triggerCond: s.triggerCond,
      emoji: s.emoji,
      name: s.name,
      slogan: s.slogan,
      desc: s.desc,
    };
    for (const lang of LANGS) {
      row[`name_${lang}`] = trans[lang]?.name ?? "";
      row[`slogan_${lang}`] = trans[lang]?.slogan ?? "";
      row[`desc_${lang}`] = trans[lang]?.desc ?? "";
    }
    sRows.push(row);
  }

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(qRows, { header: qHeaders });
  XLSX.utils.book_append_sheet(wb, ws1, "Questions");

  const ws2 = XLSX.utils.json_to_sheet(pRows, { header: pHeaders });
  XLSX.utils.book_append_sheet(wb, ws2, "PersonalityTypes");

  const ws3 = XLSX.utils.json_to_sheet(sRows, { header: sHeaders });
  XLSX.utils.book_append_sheet(wb, ws3, "SpecialTypes");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=eva-covenant-quiz.xlsx",
    },
  });
}

// ===== POST: Upload and import =====
export async function POST(req: NextRequest) {
  // 验证管理员身份
  const authError = requireAdmin(req);
  if (authError) return authError;

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

    let questionCount = 0;
    let optionCount = 0;

    for (const row of qRows) {
      if (!row.dimCode || !row.text) {
        skippedRows.push(`Question row missing dimCode or text`);
        continue;
      }

      const qType = String(row.type || "regular");
      const isGate = qType === "gate";
      const isTrigger = qType === "trigger";

      const qTranslations: Record<string, Record<string, string>> = {};
      for (const lang of LANGS) {
        const val = String(row[`text_${lang}`] ?? "").trim();
        if (val) {
          if (!qTranslations[lang]) qTranslations[lang] = {};
          qTranslations[lang].text = val;
        }
      }

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

        const optValue = String(row[`${letter}_value`] ?? "").trim() || null;
        const optTrigger = String(row[`${letter}_trigger`] ?? "").trim() || null;

        options.push({
          label,
          score,
          value: isGate ? optValue : null,
          trigger: isTrigger ? optTrigger : null,
          order: oi,
          translations: Object.keys(optTranslations).length > 0 ? JSON.stringify(optTranslations) : null,
        });
      }

      questionCreates.push({
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
    let personalityCount = 0;
    if (pSheet) {
      const pRows = XLSX.utils.sheet_to_json<Record<string, string | number>>(pSheet);
      for (const row of pRows) {
        if (!row.code || !row.name || !row.vector) {
          skippedRows.push(`PersonalityType row missing code/name/vector`);
          continue;
        }
        const t = buildTranslations(row, ["name", "slogan", "desc", "evaUnit"]);
        personalityCreates.push({
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
    let specialCount = 0;
    if (sSheet) {
      const sRows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sSheet);
      for (const row of sRows) {
        if (!row.code || !row.name) {
          skippedRows.push(`SpecialType row missing code/name`);
          continue;
        }
        const t = buildTranslations(row, ["name", "slogan", "desc"]);
        specialCreates.push({
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

    // Execute all operations in a transaction
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
      imported: { questions: questionCount, options: optionCount, personalityTypes: personalityCount, specialTypes: specialCount },
      skipped: skippedRows.length > 0 ? skippedRows : undefined,
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
