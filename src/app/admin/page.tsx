"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DIMENSIONS, ALGO_PARAMS } from "@/lib/types";

type Tab = "stats" | "records" | "questions" | "types";
type ContentLang = "zh-CN" | "en" | "ja" | "ko" | "zh-TW";

const LANG_TABS: { code: ContentLang; label: string }[] = [
  { code: "zh-CN", label: "中文" },
  { code: "en", label: "EN" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh-TW", label: "繁體" },
];

function LangBar({ lang, setLang }: { lang: ContentLang; setLang: (l: ContentLang) => void }) {
  return (
    <div className="flex gap-1 mb-4">
      {LANG_TABS.map((lt) => (
        <button
          key={lt.code}
          onClick={() => setLang(lt.code)}
          className={`px-3 py-1 text-xs eva-text tracking-wider cursor-pointer transition-colors ${
            lang === lt.code
              ? "text-[#4ade80] border-b-2 border-[#4ade80]"
              : "text-[#64748b] hover:text-[#94a3b8]"
          }`}
        >
          {lt.label}
        </button>
      ))}
    </div>
  );
}

type Translations = Record<string, Record<string, string>>;

function parseTranslations(raw: string | null | undefined): Translations {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function getTransField(translations: Translations, lang: string, field: string): string {
  return translations?.[lang]?.[field] ?? "";
}

function setTransField(translations: Translations, lang: string, field: string, value: string): Translations {
  const updated = { ...translations };
  if (!updated[lang]) updated[lang] = {};
  if (value.trim()) {
    updated[lang][field] = value;
  } else {
    delete updated[lang][field];
    if (Object.keys(updated[lang]).length === 0) delete updated[lang];
  }
  return updated;
}

// ===== 类型定义 =====
interface Stats {
  total: number;
  todayCount: number;
  distribution: { code: string; count: number }[];
  dailyCounts: Record<string, number>;
  avgSimilarity: number;
}

interface Analytics {
  utmStats: { source: string | null; count: number }[];
  deviceCounts: { mobile: number; desktop: number; other: number };
  recentRecords: {
    id: number; code: string; similarity: number;
    isSpecial: boolean; isBoundary: boolean;
    utmSource: string | null; createdAt: string;
  }[];
}

interface QuestionRow {
  id: number; dimCode: string; text: string;
  order: number; isGate: boolean; isTrigger: boolean;
  translations: string | null;
  options: OptionRow[];
}

interface OptionRow {
  id: number; label: string; score: number; value: string | null; trigger: string | null; order: number;
  translations: string | null;
}

interface TypeRow {
  code: string; name: string; group: string; vector: string;
  slogan: string; desc: string; evaUnit: string | null; emoji: string;
  translations: string | null;
}

// ===== 主页面 =====
export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("stats");

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.08)_0%,_transparent_60%)]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <p className="nerv-label mb-1">NERV — 管理终端</p>
            <h1 className="text-2xl font-bold eva-text text-[#7c3aed]">ADMIN CONSOLE</h1>
          </div>
          <button
            onClick={async () => {
              document.cookie = "admin_token=; path=/; max-age=0";
              window.location.href = "/admin/login";
            }}
            className="text-xs text-[#666] border border-[#333] px-3 py-1.5 hover:text-[#ef4444] hover:border-[#ef4444] transition-colors cursor-pointer"
            style={{ fontFamily: "var(--font-tech)" }}
          >
            登出
          </button>
        </div>

        {/* Tab 导航 */}
        <div className="flex gap-1 mb-6 border-b border-[#2a2a3e]">
          {([
            ["stats", "统计面板"],
            ["records", "测试记录"],
            ["questions", "题目管理"],
            ["types", "人格管理"],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm eva-text tracking-wider transition-colors cursor-pointer ${
                tab === key
                  ? "text-[#4ade80] border-b-2 border-[#4ade80]"
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        {tab === "stats" && <StatsPanel />}
        {tab === "records" && <RecordsPanel />}
        {tab === "questions" && <QuestionsPanel />}
        {tab === "types" && <TypesPanel />}
      </div>
    </div>
  );
}

// ===== 统计面板 =====
function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) return <Loading />;

  const maxCount = Math.max(...stats.distribution.map((d) => d.count), 1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="总参与人数" value={stats.total.toString()} />
        <StatCard label="今日新增" value={stats.todayCount.toString()} />
        <StatCard label="平均同步率" value={`${stats.avgSimilarity}%`} />
        <StatCard label="人格类型数" value={stats.distribution.length.toString()} />
      </div>

      <div className="eva-border rounded-lg p-5 bg-[#0a0a12]/90 mb-6">
        <h3 className="nerv-label mb-4">PERSONALITY DISTRIBUTION — 人格分布</h3>
        <div className="space-y-2">
          {stats.distribution.map((d) => (
            <div key={d.code} className="flex items-center gap-3">
              <span className="w-20 text-xs eva-text text-[#94a3b8]">{d.code}</span>
              <div className="flex-1 h-5 bg-[#1e1b2e] rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7c3aed] to-[#4ade80] rounded"
                  style={{ width: `${(d.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-12 text-right text-xs eva-text text-[#4ade80]">{d.count}</span>
            </div>
          ))}
        </div>
        {stats.distribution.length === 0 && (
          <p className="text-[#64748b] text-sm text-center py-4">暂无数据</p>
        )}
      </div>

      <div className="eva-border rounded-lg p-5 bg-[#0a0a12]/90">
        <h3 className="nerv-label mb-4">DAILY TREND — 每日参与</h3>
        <div className="flex items-end gap-2 h-32">
          {Object.entries(stats.dailyCounts).sort().map(([day, count]) => (
            <div key={day} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-[#7c3aed] rounded-t"
                style={{ height: `${Math.max((count / Math.max(...Object.values(stats.dailyCounts), 1)) * 100, 4)}%` }}
              />
              <span className="text-[9px] eva-text text-[#64748b] mt-1">{day.slice(5)}</span>
              <span className="text-[9px] eva-text text-[#4ade80]">{count}</span>
            </div>
          ))}
        </div>
        {Object.keys(stats.dailyCounts).length === 0 && (
          <p className="text-[#64748b] text-sm text-center py-4">暂无数据</p>
        )}
      </div>
    </motion.div>
  );
}

// ===== 记录面板 =====
function RecordsPanel() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <Loading />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="eva-border rounded-lg p-5 bg-[#0a0a12]/90">
        <h3 className="nerv-label mb-4">DEVICE DISTRIBUTION — 设备分布</h3>
        <div className="flex gap-6">
          {Object.entries(data.deviceCounts).map(([device, count]) => (
            <div key={device} className="text-center">
              <p className="text-2xl font-bold text-[#7c3aed]">{count}</p>
              <p className="nerv-label mt-1">{device}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="eva-border rounded-lg p-5 bg-[#0a0a12]/90">
        <h3 className="nerv-label mb-4">RECENT RECORDS — 最近测试记录</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3e]">
                <th className="text-left py-2 px-3 nerv-label">ID</th>
                <th className="text-left py-2 px-3 nerv-label">人格</th>
                <th className="text-left py-2 px-3 nerv-label">同步率</th>
                <th className="text-left py-2 px-3 nerv-label">标记</th>
                <th className="text-left py-2 px-3 nerv-label">来源</th>
                <th className="text-left py-2 px-3 nerv-label">时间</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRecords.map((r) => (
                <tr key={r.id} className="border-b border-[#1e1b2e] hover:bg-[#1e1b2e]/50">
                  <td className="py-2 px-3 eva-text text-[#64748b]">{r.id}</td>
                  <td className="py-2 px-3 text-[#e2e8f0]">{r.code}</td>
                  <td className="py-2 px-3 eva-text text-[#4ade80]">{r.similarity}%</td>
                  <td className="py-2 px-3">
                    {r.isSpecial && <span className="text-xs text-[#a855f7]">特殊 </span>}
                    {r.isBoundary && <span className="text-xs text-[#f97316]">边界</span>}
                    {!r.isSpecial && !r.isBoundary && <span className="text-xs text-[#64748b]">—</span>}
                  </td>
                  <td className="py-2 px-3 eva-text text-[#64748b]">{r.utmSource ?? "直接"}</td>
                  <td className="py-2 px-3 eva-text text-[#64748b] text-xs">
                    {new Date(r.createdAt).toLocaleString("zh-CN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.recentRecords.length === 0 && (
            <p className="text-[#64748b] text-sm text-center py-8">暂无测试记录</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ===== 评分说明 =====
const GRADE_INFO = [
  { grade: "L", range: "3-4", label: "低", color: "#64748b" },
  { grade: "M", range: "5-6", label: "中", color: "#7c3aed" },
  { grade: "H", range: "7-8", label: "高", color: "#4ade80" },
  { grade: "X", range: "9",   label: "极高", color: "#f97316" },
];

function getDimInfo(dimCode: string) {
  return DIMENSIONS.find((d) => d.code === dimCode);
}

function getDimQuestions(questions: QuestionRow[], dimCode: string) {
  return questions.filter((q) => q.dimCode === dimCode && !q.isGate && !q.isTrigger);
}

function getDimTotalScore(questions: QuestionRow[], dimCode: string) {
  return getDimQuestions(questions, dimCode)
    .flatMap((q) => q.options)
    .filter((o) => o.score > 0)
    .reduce((max, o) => Math.max(max, o.score), 0);
}

// ===== 题目面板（可编辑） =====
function QuestionsPanel() {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<QuestionRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [contentLang, setContentLang] = useState<ContentLang>("zh-CN");
  const isZh = contentLang === "zh-CN";

  const load = () => {
    fetch("/api/admin/questions").then((r) => r.json()).then(setQuestions);
  };

  useEffect(load, []);

  const startEdit = (q: QuestionRow) => {
    setEditId(q.id);
    setEditData(JSON.parse(JSON.stringify(q)));
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData(null);
  };

  const saveEdit = async () => {
    if (!editData) return;
    setSaving(true);
    try {
      await fetch("/api/admin/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editData.id,
          text: editData.text,
          dimCode: editData.dimCode,
          translations: editData.translations ? JSON.parse(editData.translations) : null,
          options: editData.options.map((o) => ({
            ...o,
            translations: o.translations ? JSON.parse(o.translations) : null,
          })),
        }),
      });
      setEditId(null);
      setEditData(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const updateOption = (optId: number, field: string, value: string | number) => {
    if (!editData) return;
    setEditData({
      ...editData,
      options: editData.options.map((o) =>
        o.id === optId ? { ...o, [field]: value } : o
      ),
    });
  };

  // Update a translation field for a question
  const updateQTrans = (field: string, value: string) => {
    if (!editData) return;
    const t = parseTranslations(editData.translations);
    const updated = setTransField(t, contentLang, field, value);
    setEditData({ ...editData, translations: JSON.stringify(updated) });
  };

  // Update a translation field for an option
  const updateOptTrans = (optId: number, field: string, value: string) => {
    if (!editData) return;
    setEditData({
      ...editData,
      options: editData.options.map((o) => {
        if (o.id !== optId) return o;
        const t = parseTranslations(o.translations);
        const updated = setTransField(t, contentLang, field, value);
        return { ...o, translations: JSON.stringify(updated) };
      }),
    });
  };

  // Get display text for a question
  const qText = (q: QuestionRow) => {
    if (isZh) return q.text;
    return getTransField(parseTranslations(q.translations), contentLang, "text") || q.text;
  };

  // Get display label for an option
  const optLabel = (o: OptionRow) => {
    if (isZh) return o.label;
    return getTransField(parseTranslations(o.translations), contentLang, "label") || o.label;
  };

  // Group questions by dimension
  const dimGroups = DIMENSIONS.map((dim) => ({
    dim,
    qs: questions.filter((q) => q.dimCode === dim.code && !q.isGate && !q.isTrigger),
  }));
  const gateQuestions = questions.filter((q) => q.isGate);
  const triggerQuestions = questions.filter((q) => q.isTrigger);

  // Render a question card (shared between regular and special)
  const renderQCard = (q: QuestionRow) => {
    const isEditing = editId === q.id;

    // Get current edit values based on language
    const editText = isEditing && editData
      ? (isZh ? editData.text : getTransField(parseTranslations(editData.translations), contentLang, "text"))
      : "";
    const placeholder = isZh ? "" : q.text;

    return (
      <div key={q.id} className={`p-3 rounded border ${
        isEditing ? "bg-[#1e1b2e] border-[#7c3aed]" : "bg-[#1e1b2e]/60 border-[#2a2a3e]"
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="nerv-label">#{q.order}</span>
          {!isZh && !isEditing && !getTransField(parseTranslations(q.translations), contentLang, "text") && (
            <span className="text-[9px] px-1.5 py-0.5 bg-[#f97316]/10 text-[#f97316] rounded eva-text">未翻译</span>
          )}
          <div className="ml-auto flex gap-2">
            {!isEditing ? (
              <button onClick={() => startEdit(q)} className="text-xs text-[#7c3aed] hover:text-[#a855f7] cursor-pointer eva-text">编辑</button>
            ) : (
              <>
                <button onClick={saveEdit} disabled={saving} className="text-xs text-[#4ade80] hover:text-[#22c55e] cursor-pointer eva-text">{saving ? "..." : "保存"}</button>
                <button onClick={cancelEdit} className="text-xs text-[#64748b] hover:text-[#94a3b8] cursor-pointer eva-text">取消</button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <input
            className="w-full bg-[#0a0a12] text-sm text-[#e2e8f0] p-2 rounded border border-[#2a2a3e] outline-none focus:border-[#7c3aed] mb-2"
            value={editText}
            placeholder={placeholder}
            onChange={(e) => {
              if (isZh) {
                editData && setEditData({ ...editData, text: e.target.value });
              } else {
                updateQTrans("text", e.target.value);
              }
            }}
          />
        ) : (
          <p className="text-sm text-[#e2e8f0] mb-2">{qText(q)}</p>
        )}

        <div className="space-y-1.5">
          {(isEditing && editData ? editData.options : q.options).map((opt) => {
            const currentLabel = isEditing
              ? (isZh ? opt.label : getTransField(parseTranslations(opt.translations), contentLang, "label"))
              : optLabel(opt);
            const optPlaceholder = isZh ? "" : opt.label;

            return (
              <div key={opt.id} className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <span className="text-[10px] eva-text text-[#64748b] w-5">{String.fromCharCode(65 + opt.order)}.</span>
                    <input
                      className="flex-1 bg-[#0a0a12] text-xs text-[#ccc] p-1.5 rounded border border-[#2a2a3e] outline-none focus:border-[#7c3aed]"
                      value={currentLabel}
                      placeholder={optPlaceholder}
                      onChange={(e) => {
                        if (isZh) {
                          updateOption(opt.id, "label", e.target.value);
                        } else {
                          updateOptTrans(opt.id, "label", e.target.value);
                        }
                      }}
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] eva-text text-[#64748b]">分值</span>
                      <input
                        type="number" min={0} max={10}
                        className="w-12 bg-[#0a0a12] text-xs text-[#4ade80] p-1 rounded border border-[#2a2a3e] text-center outline-none focus:border-[#7c3aed]"
                        value={opt.score}
                        onChange={(e) => updateOption(opt.id, "score", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </>
                ) : (
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    opt.score === 3 ? "bg-[#4ade80]/10 text-[#4ade80]"
                    : opt.score === 2 ? "bg-[#7c3aed]/10 text-[#7c3aed]"
                    : opt.score === 1 ? "bg-[#64748b]/10 text-[#64748b]"
                    : "bg-[#f97316]/10 text-[#f97316]"
                  }`}>
                    {opt.score}分 {String.fromCharCode(65 + opt.order)}. {currentLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Language tabs */}
      <div className="eva-border rounded-lg p-4 bg-[#0a0a12]/90">
        <h3 className="nerv-label mb-2">CONTENT LANGUAGE — 编辑语言</h3>
        <LangBar lang={contentLang} setLang={setContentLang} />
        {!isZh && <p className="text-[10px] text-[#64748b]">切换到对应语言后点击「编辑」填写翻译，留空则显示中文原文</p>}
      </div>

      {/* Scoring guide */}
      <div className="eva-border rounded-lg p-5 bg-[#0a0a12]/90">
        <h3 className="nerv-label mb-3">SCORING GUIDE — 评分机制说明</h3>
        <div className="text-xs text-[#94a3b8] space-y-2 leading-relaxed">
          <p>每道题的<strong className="text-[#e2e8f0]">分值(1/2/3)</strong> 决定用户在该维度的得分。每个维度有 3 道题，维度总分范围 <strong className="text-[#e2e8f0]">3~9</strong>。</p>
          <p>维度总分转换为 <strong className="text-[#e2e8f0]">L/M/H/X</strong> 四档，构成用户的人格向量，再与24种人格模板进行加权匹配。</p>
          <div className="flex gap-4 mt-2">
            {GRADE_INFO.map((g) => (
              <span key={g.grade} className="flex items-center gap-1">
                <span className="w-5 h-5 rounded text-center text-[10px] font-bold leading-5" style={{ backgroundColor: g.color + "33", color: g.color }}>
                  {g.grade}
                </span>
                <span className="text-[#64748b]">{g.label} ({g.range}分)</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Dimension-grouped questions */}
      {dimGroups.map(({ dim, qs }) => {
        const scoreSets = qs.map((q) => q.options.filter((o) => o.score > 0).map((o) => o.score));
        const minPossible = scoreSets.reduce((sum, scores) => sum + Math.min(...scores), 0);
        const maxPossible = scoreSets.reduce((sum, scores) => sum + Math.max(...scores), 0);

        return (
          <div key={dim.code} className="eva-border rounded-lg bg-[#0a0a12]/90 overflow-hidden">
            <div className="px-5 py-3 border-b border-[#2a2a3e] flex items-center gap-3 bg-[#1e1b2e]/40">
              <span className="px-2 py-0.5 rounded text-xs eva-text bg-[#7c3aed]/20 text-[#7c3aed] font-bold">{dim.code}</span>
              <span className="text-sm text-[#e2e8f0] font-bold">{dim.name}</span>
              <span className="ml-auto text-[10px] eva-text text-[#4ade80]">
                {qs.length}题 · {minPossible}~{maxPossible}
              </span>
            </div>
            <div className="p-4 space-y-3">
              {qs.map((q) => renderQCard(q))}
            </div>
          </div>
        );
      })}

      {/* Gate / Trigger questions */}
      {(gateQuestions.length > 0 || triggerQuestions.length > 0) && (
        <div className="eva-border rounded-lg bg-[#0a0a12]/90 overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2a2a3e] flex items-center gap-3 bg-[#1e1b2e]/40">
            <span className="px-2 py-0.5 rounded text-xs eva-text bg-[#ef4444]/20 text-[#ef4444] font-bold">特殊题目</span>
            <span className="text-xs text-[#64748b]">门控题 + 触发题</span>
          </div>
          <div className="p-4 space-y-3">
            {[...gateQuestions, ...triggerQuestions].map((q) => renderQCard(q))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ===== 人格管理面板（可编辑） =====
function TypesPanel() {
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [specials, setSpecials] = useState<TypeRow[]>([]);
  const [editCode, setEditCode] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [editTrans, setEditTrans] = useState<string>("{}");
  const [saving, setSaving] = useState(false);
  const [contentLang, setContentLang] = useState<ContentLang>("zh-CN");
  const isZh = contentLang === "zh-CN";

  const load = () => {
    fetch("/api/quiz?raw=1").then((r) => r.json()).then((d) => {
      setTypes(d.personalityTypes);
      setSpecials(d.specialTypes);
    });
  };

  useEffect(load, []);

  const groupNames: Record<string, string> = {
    unit01: "初号机系", unit02: "贰号机系", unit00: "零号机系",
    unit03: "参号机系", mark06: "Mark.06系", unit04: "四号机系",
    unit05: "五号机系", unit08: "八号机系", unit09: "九号机系",
    unit13: "十三号机系", unit82: "8+2号机系", general: "综合系",
  };

  const startEdit = (t: TypeRow) => {
    setEditCode(t.code);
    if (isZh) {
      setEditData({ name: t.name, slogan: t.slogan, desc: t.desc, vector: t.vector, evaUnit: t.evaUnit ?? "", emoji: t.emoji });
    } else {
      const tr = parseTranslations(t.translations);
      setEditData({
        name: getTransField(tr, contentLang, "name"),
        slogan: getTransField(tr, contentLang, "slogan"),
        desc: getTransField(tr, contentLang, "desc"),
        evaUnit: getTransField(tr, contentLang, "evaUnit"),
        vector: "", emoji: "",
      });
    }
    setEditTrans(t.translations ?? "{}");
  };

  const cancelEdit = () => {
    setEditCode(null);
    setEditData({});
  };

  const saveEdit = async (code: string) => {
    setSaving(true);
    try {
      if (isZh) {
        await fetch(`/api/admin/types/${code}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        });
      } else {
        // Update only the translation for the current language
        const currentTrans = parseTranslations(editTrans);
        const updated = { ...currentTrans };
        updated[contentLang] = {};
        if (editData.name?.trim()) updated[contentLang].name = editData.name;
        if (editData.slogan?.trim()) updated[contentLang].slogan = editData.slogan;
        if (editData.desc?.trim()) updated[contentLang].desc = editData.desc;
        if (editData.evaUnit?.trim()) updated[contentLang].evaUnit = editData.evaUnit;
        if (Object.keys(updated[contentLang]).length === 0) delete updated[contentLang];

        await fetch(`/api/admin/types/${code}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translations: updated }),
        });
      }
      setEditCode(null);
      setEditData({});
      load();
    } finally {
      setSaving(false);
    }
  };

  const getDisplayField = (t: TypeRow, field: string): string => {
    if (isZh) return t[field as keyof TypeRow] as string ?? "";
    const tr = parseTranslations(t.translations);
    return getTransField(tr, contentLang, field) || (t[field as keyof TypeRow] as string ?? "");
  };

  const hasTranslation = (t: TypeRow): boolean => {
    if (isZh) return true;
    const tr = parseTranslations(t.translations);
    return !!getTransField(tr, contentLang, "name");
  };

  const renderType = (t: TypeRow, isSpecial = false) => {
    const isEditing = editCode === t.code;
    const borderColor = isEditing ? "border-[#7c3aed]" : isSpecial ? "border-[#a855f7]/30" : "border-[#2a2a3e]";

    return (
      <div key={t.code} className={`p-3 rounded bg-[#1e1b2e]/60 border ${borderColor}`}>
        <div className="flex items-center gap-2 mb-1">
          {!isZh && !isEditing && !hasTranslation(t) && (
            <span className="text-[9px] px-1.5 py-0.5 bg-[#f97316]/10 text-[#f97316] rounded eva-text">未翻译</span>
          )}
          {isEditing ? (
            <input
              className="flex-1 bg-[#0a0a12] text-sm font-bold text-[#e2e8f0] p-1 rounded border border-[#2a2a3e] outline-none focus:border-[#7c3aed]"
              value={editData.name ?? ""}
              placeholder={isZh ? "" : t.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
          ) : (
            <span className="font-bold text-[#e2e8f0]">{getDisplayField(t, "name")}</span>
          )}
          <span className="nerv-label">{t.code}</span>
          {!isSpecial && (
            <span className="px-1.5 py-0.5 rounded text-[10px] eva-text bg-[#7c3aed]/20 text-[#7c3aed]">
              {groupNames[t.group] ?? t.group}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            {!isEditing ? (
              <button onClick={() => startEdit(t)} className="text-xs text-[#7c3aed] hover:text-[#a855f7] cursor-pointer eva-text">编辑</button>
            ) : (
              <>
                <button onClick={() => saveEdit(t.code)} disabled={saving} className="text-xs text-[#4ade80] hover:text-[#22c55e] cursor-pointer eva-text">{saving ? "..." : "保存"}</button>
                <button onClick={cancelEdit} className="text-xs text-[#64748b] hover:text-[#94a3b8] cursor-pointer eva-text">取消</button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <>
            <input
              className="w-full bg-[#0a0a12] text-xs text-[#4ade80] eva-text p-1 rounded border border-[#2a2a3e] outline-none focus:border-[#7c3aed] mb-1"
              value={editData.slogan ?? ""}
              placeholder={isZh ? "slogan" : t.slogan}
              onChange={(e) => setEditData({ ...editData, slogan: e.target.value })}
            />
            {!isSpecial && isZh && (
              <input
                className="w-full bg-[#0a0a12] text-xs text-[#64748b] eva-text p-1 rounded border border-[#2a2a3e] outline-none focus:border-[#7c3aed] mb-1"
                value={editData.vector ?? ""}
                placeholder="vector"
                onChange={(e) => setEditData({ ...editData, vector: e.target.value })}
              />
            )}
            <textarea
              className="w-full bg-[#0a0a12] text-xs text-[#94a3b8] p-1.5 rounded border border-[#2a2a3e] outline-none focus:border-[#7c3aed] mb-1 resize-y"
              rows={2}
              value={editData.desc ?? ""}
              placeholder={isZh ? "描述" : t.desc}
              onChange={(e) => setEditData({ ...editData, desc: e.target.value })}
            />
            {!isSpecial && (
              <input
                className="w-full bg-[#0a0a12] text-xs text-[#64748b] p-1 rounded border border-[#2a2a3e] outline-none focus:border-[#7c3aed]"
                value={editData.evaUnit ?? ""}
                placeholder={isZh ? "evaUnit" : (t.evaUnit ?? "")}
                onChange={(e) => setEditData({ ...editData, evaUnit: e.target.value })}
              />
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-[#4ade80] eva-text mb-1">&ldquo;{getDisplayField(t, "slogan")}&rdquo;</p>
            {!isSpecial && isZh && <p className="text-xs eva-text text-[#64748b] mb-1">{t.vector}</p>}
            {t.evaUnit && <p className="text-xs text-[#64748b]">{getDisplayField(t, "evaUnit")}</p>}
            <p className="text-xs text-[#94a3b8] mt-1 line-clamp-2">{getDisplayField(t, "desc")}</p>
          </>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Language tabs */}
      <div className="eva-border rounded-lg p-4 bg-[#0a0a12]/90">
        <h3 className="nerv-label mb-2">CONTENT LANGUAGE — 编辑语言</h3>
        <LangBar lang={contentLang} setLang={setContentLang} />
        {!isZh && <p className="text-[10px] text-[#64748b]">切换到对应语言后点击「编辑」填写翻译，留空则显示中文原文</p>}
      </div>

      <div className="eva-border rounded-lg p-5 bg-[#0a0a12]/90">
        <h3 className="nerv-label mb-4">PERSONALITY TYPES — 常规人格 ({types.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {types.map((t) => renderType(t))}
        </div>
      </div>

      <div className="eva-border rounded-lg p-5 bg-[#0a0a12]/90">
        <h3 className="nerv-label mb-4">SPECIAL TYPES — 特殊人格 ({specials.length})</h3>
        <div className="space-y-3">
          {specials.map((s) => renderType(s, true))}
        </div>
      </div>
    </motion.div>
  );
}

// ===== 通用组件 =====
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="eva-border rounded-lg p-4 bg-[#0a0a12]/90 text-center">
      <p className="text-2xl font-bold text-[#4ade80] eva-text">{value}</p>
      <p className="nerv-label mt-1">{label}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      <span className="ml-3 eva-text text-[#64748b]">LOADING...</span>
    </div>
  );
}
