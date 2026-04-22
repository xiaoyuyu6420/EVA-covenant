"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { matchPersonality, type MatchInput } from "@/lib/match-engine";
import { loadProgress, saveProgress, clearProgress, saveResult } from "@/lib/storage";
import type { FullResult } from "@/lib/types";
import { DIMENSIONS } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";

const DIM_COUNT = 15;
const Q_PER_DIM = 2;
const TOTAL_REGULAR = DIM_COUNT * Q_PER_DIM; // 30
const GATE_INSERT_POS = 19;

export type Screen = "welcome" | "test" | "calculating" | "result" | "loading";

export interface QuestionItem {
  type: "regular" | "gate" | "trigger";
  regularIndex?: number;
  dimIndex?: number;
  text: string;
  options: Array<{ label: string; score?: number; value?: string; trigger?: string }>;
}

interface ApiQuestion {
  dimCode: string;
  text: string;
  order: number;
  isGate: boolean;
  isTrigger: boolean;
  options: Array<{ label: string; score: number; value: string | null; trigger: string | null; order: number }>;
}

interface ApiData {
  questions: ApiQuestion[];
  gateQuestion: ApiQuestion | null;
  triggerQuestions: ApiQuestion[];
  personalityTypes: Array<{
    code: string; name: string; group: string; vector: string;
    slogan: string; desc: string; evaUnit: string | null; emoji: string;
  }>;
  specialTypes: Array<{
    code: string; name: string; triggerType: string; triggerCond: string;
    slogan: string; desc: string; emoji: string;
  }>;
}

type TriggerKind = "none" | "cmpl" | "unit13";

function buildQuestionList(
  apiData: ApiData,
  triggerKind: TriggerKind,
): QuestionItem[] {
  const list: QuestionItem[] = [];
  const regularQs = apiData.questions;

  for (let i = 0; i < TOTAL_REGULAR; i++) {
    if (i === GATE_INSERT_POS && apiData.gateQuestion) {
      const gq = apiData.gateQuestion;
      list.push({
        type: "gate",
        text: gq.text,
        options: gq.options.map((o) => ({
          label: o.label,
          value: o.value ?? undefined,
        })),
      });
    }

    const q = regularQs[i];
    if (!q) continue;
    const dimIdx = Math.floor(i / Q_PER_DIM);

    list.push({
      type: "regular",
      regularIndex: i,
      dimIndex: dimIdx,
      text: q.text,
      options: q.options.map((o) => ({ label: o.label, score: o.score })),
    });
  }

  if (triggerKind === "cmpl" && apiData.triggerQuestions[0]) {
    const tq = apiData.triggerQuestions[0];
    list.push({
      type: "trigger",
      text: tq.text,
      options: tq.options.map((o) => ({
        label: o.label,
        trigger: o.trigger ?? undefined,
      })),
    });
  } else if (triggerKind === "unit13" && apiData.triggerQuestions[1]) {
    const tq = apiData.triggerQuestions[1];
    list.push({
      type: "trigger",
      text: tq.text,
      options: tq.options.map((o) => ({
        label: o.label,
        trigger: o.trigger ?? undefined,
      })),
    });
  }

  return list;
}

export function useQuiz() {
  const { lang } = useI18n();
  const [screen, setScreen] = useState<Screen>("loading");
  const [currentQ, setCurrentQ] = useState(0);
  const [dimScores, setDimScores] = useState<number[]>(new Array(DIM_COUNT).fill(0));
  const [gateValue, setGateValue] = useState<string | undefined>();
  const [triggerValue, setTriggerValue] = useState<string | undefined>();
  const [result, setResult] = useState<FullResult | null>(null);
  const initialized = useRef(false);
  const answerLog = useRef<Array<{ dim: string; text: string; label: string; score: number }>>([]);

  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [qList, setQList] = useState<QuestionItem[]>([]);

  const stateRef = useRef({ currentQ, qList, dimScores, gateValue, triggerValue });
  stateRef.current = { currentQ, qList, dimScores, gateValue, triggerValue };

  const screenRef = useRef<Screen>(screen);
  screenRef.current = screen;

  // Fetch quiz data from API — re-fetch on language change if still on welcome
  const langRef = useRef(lang);
  useEffect(() => {
    const langChanged = langRef.current !== lang;
    langRef.current = lang;

    if (initialized.current && !langChanged) return;
    if (initialized.current && screenRef.current !== "welcome" && screenRef.current !== "loading") return;
    initialized.current = true;

    fetch(`/api/quiz?lang=${lang}`)
      .then((r) => r.json())
      .then((data: ApiData) => {
        setApiData(data);

        // Check for saved progress
        const saved = loadProgress();
        if (saved && saved.currentQuestion > 0 && !saved.completedAt) {
          setCurrentQ(saved.currentQuestion);
          setDimScores(saved.answers);
          setGateValue(saved.gateAnswer);
          setTriggerValue(saved.triggerAnswer);
          if (saved.answerLog) answerLog.current = saved.answerLog;
          const triggerKind: TriggerKind =
            saved.gateAnswer === "complement" && !saved.triggerAnswer ? "cmpl" :
            saved.gateAnswer === "transcend" && !saved.triggerAnswer ? "unit13" : "none";
          setQList(buildQuestionList(data, triggerKind));
          setScreen("test");
        } else {
          setQList(buildQuestionList(data, "none"));
          setScreen("welcome");
        }
      })
      .catch(() => {
        setQList([]);
        setScreen("welcome");
      });
  }, [lang]);

  const totalQ = qList.length;
  const progress = totalQ > 0 ? currentQ / totalQ : 0;

  const startTest = useCallback(() => {
    if (!apiData) return;
    setScreen("test");
    setCurrentQ(0);
    setDimScores(new Array(DIM_COUNT).fill(0));
    setGateValue(undefined);
    setTriggerValue(undefined);
    setResult(null);
    setQList(buildQuestionList(apiData, "none"));
    answerLog.current = [];
  }, [apiData]);

  const handleAnswer = useCallback((optionIdx: number) => {
    if (!apiData) return;
    const { currentQ, qList, dimScores, gateValue, triggerValue } = stateRef.current;
    const q = qList[currentQ];
    if (!q) return;

    const opt = q.options[optionIdx];
    let newScores = [...dimScores];
    let newGate = gateValue;
    let newTrigger = triggerValue;
    let newList = qList;

    if (q.type === "regular" && q.dimIndex !== undefined) {
      newScores[q.dimIndex] += opt.score ?? 0;
      answerLog.current.push({
        dim: DIMENSIONS[q.dimIndex].code,
        text: q.text,
        label: opt.label,
        score: opt.score ?? 0,
      });
    } else if (q.type === "gate") {
      newGate = opt.value;
      if (opt.value === "complement") {
        newList = buildQuestionList(apiData, "cmpl");
      } else if (opt.value === "transcend") {
        newList = buildQuestionList(apiData, "unit13");
      }
    } else if (q.type === "trigger") {
      newTrigger = opt.trigger;
    }

    const nextQ = currentQ + 1;

    if (nextQ >= newList.length) {
      setScreen("calculating");
      const finalScores = newScores;
      const logCopy = [...answerLog.current];
      const matchInput: MatchInput = {
        personalityTypes: apiData.personalityTypes,
        specialTypes: apiData.specialTypes,
      };
      setTimeout(() => {
        const r = matchPersonality(finalScores, newGate, newTrigger, matchInput);
        setResult(r);
        setScreen("result");
        saveResult(r.top.code);
        clearProgress();

        fetch("/api/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: r.top.code,
            similarity: r.top.similarity,
            isSpecial: r.top.isSpecial,
            isBoundary: r.top.isBoundary,
            scores: finalScores,
            vector: r.userVector.join(""),
            gateAnswer: newGate,
            triggerAnswer: newTrigger,
            answers: logCopy,
          }),
        }).catch(() => {});
      }, 2500);
    } else {
      setCurrentQ(nextQ);
      setDimScores(newScores);
      setGateValue(newGate);
      setTriggerValue(newTrigger);
      setQList(newList);
      saveProgress({
        currentQuestion: nextQ,
        answers: newScores,
        gateAnswer: newGate,
        triggerAnswer: newTrigger,
        answerLog: answerLog.current,
      });
    }
  }, [apiData]);

  const restart = useCallback(() => {
    if (!apiData) return;
    clearProgress();
    setScreen("welcome");
    setCurrentQ(0);
    setDimScores(new Array(DIM_COUNT).fill(0));
    setGateValue(undefined);
    setTriggerValue(undefined);
    setResult(null);
    setQList(buildQuestionList(apiData, "none"));
    answerLog.current = [];
  }, [apiData]);

  return {
    screen, currentQ, progress, totalQ, qList, result,
    startTest, handleAnswer, restart, dimScores,
  };
}
