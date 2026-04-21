import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Lang = "zh-CN" | "zh-TW" | "en" | "ja" | "ko";
type Translations = Record<string, Record<string, string>> | null;

function parseTranslations(raw: string | null): Translations {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function applyField(translations: Translations, lang: string, field: string, original: string): string {
  if (!translations || lang === "zh-CN") return original;
  return translations[lang]?.[field]?.trim() || original;
}

export async function GET(req: NextRequest) {
  const lang = (req.nextUrl.searchParams.get("lang") || "zh-CN") as Lang;
  const raw = req.nextUrl.searchParams.get("raw") === "1";

  // Fetch all questions with options
  const dbQuestions = await prisma.question.findMany({
    include: { options: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });

  const dbPersonalities = await prisma.personalityType.findMany();
  const dbSpecials = await prisma.specialType.findMany();

  // Separate questions by type
  const regularQuestions = dbQuestions.filter((q) => !q.isGate && !q.isTrigger);
  const gateQuestions = dbQuestions.filter((q) => q.isGate);
  const triggerQuestions = dbQuestions.filter((q) => q.isTrigger);

  // Apply translations to questions
  const translateQuestion = (q: typeof dbQuestions[0]) => ({
    dimCode: q.dimCode,
    text: applyField(parseTranslations(q.translations), lang, "text", q.text),
    order: q.order,
    isGate: q.isGate,
    isTrigger: q.isTrigger,
    options: q.options.map((o) => ({
      label: applyField(parseTranslations(o.translations), lang, "label", o.label),
      score: o.score,
      value: o.value,
      trigger: o.trigger,
      order: o.order,
    })),
  });

  // Apply translations to personality types
  const translatePersonality = (p: typeof dbPersonalities[0]) => {
    const t = parseTranslations(p.translations);
    return {
      code: p.code,
      name: applyField(t, lang, "name", p.name),
      group: p.group,
      vector: p.vector,
      slogan: applyField(t, lang, "slogan", p.slogan),
      desc: applyField(t, lang, "desc", p.desc),
      evaUnit: p.evaUnit ? applyField(t, lang, "evaUnit", p.evaUnit) : p.evaUnit,
      emoji: p.emoji,
    };
  };

  const translateSpecial = (s: typeof dbSpecials[0]) => {
    const t = parseTranslations(s.translations);
    return {
      code: s.code,
      name: applyField(t, lang, "name", s.name),
      triggerType: s.triggerType,
      triggerCond: s.triggerCond,
      slogan: applyField(t, lang, "slogan", s.slogan),
      desc: applyField(t, lang, "desc", s.desc),
      emoji: s.emoji,
    };
  };

  // Raw mode: return DB data with translations field (for admin editing)
  if (raw) {
    return NextResponse.json({
      personalityTypes: dbPersonalities,
      specialTypes: dbSpecials,
    });
  }

  return NextResponse.json({
    questions: regularQuestions.map(translateQuestion),
    gateQuestion: gateQuestions[0] ? translateQuestion(gateQuestions[0]) : null,
    triggerQuestions: triggerQuestions.map(translateQuestion),
    personalityTypes: dbPersonalities.map(translatePersonality),
    specialTypes: dbSpecials.map(translateSpecial),
    totalQuestions: regularQuestions.length + (gateQuestions.length ? 1 : 0) + 1,
  });
}
