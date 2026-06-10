"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { matchPersonality, scoresToGrades, type MatchInput } from "@/lib/match-engine";
import { loadProgress, saveProgress, clearProgress, saveResult } from "@/lib/storage";
import { getAttribution } from "@/lib/analytics";
import type { FullResult, Grade } from "@/lib/types";
import { DIMENSIONS, type DimCode } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";

const DIM_COUNT = 15;
const GATE_INSERT_POS = 19;
const DIM_INDEX_BY_CODE = Object.fromEntries(
  DIMENSIONS.map((dim, index) => [dim.code, index])
) as Record<DimCode, number>;

export type Screen = "welcome" | "test" | "calculating" | "result" | "loading";

export interface QuestionItem {
  type: "regular" | "gate" | "trigger";
  regularIndex?: number;
  dimIndex?: number;
  text: string;
  options: Array<{ label: string; score?: number; value?: string; trigger?: string }>;
}

interface ApiQuestion {
  dimCode: DimCode;
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

type TriggerKind = "none" | "cmpl" | "unit13" | "rei";

const TRIGGER_CODE_BY_KIND: Record<Exclude<TriggerKind, "none">, string> = {
  cmpl: "CMPL",
  unit13: "U13G",
  rei: "REI0",
};

function findTriggerQuestion(apiData: ApiData, triggerKind: Exclude<TriggerKind, "none">) {
  const triggerCode = TRIGGER_CODE_BY_KIND[triggerKind];
  return apiData.triggerQuestions.find((q) =>
    q.options.some((o) => o.trigger === triggerCode)
  );
}

function buildQuestionList(
  apiData: ApiData,
  triggerKind: TriggerKind,
): QuestionItem[] {
  const list: QuestionItem[] = [];
  const regularQs = apiData.questions;

  for (let i = 0; i < regularQs.length; i++) {
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
    const dimIdx = DIM_INDEX_BY_CODE[q.dimCode];
    if (dimIdx === undefined) continue;

    list.push({
      type: "regular",
      regularIndex: i,
      dimIndex: dimIdx,
      text: q.text,
      options: q.options.map((o) => ({ label: o.label, score: o.score })),
    });
  }

  if (triggerKind !== "none") {
    const tq = findTriggerQuestion(apiData, triggerKind);
    if (!tq) return list;
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

// ===== Reducer 状态管理 =====

interface QuizState {
  screen: Screen;
  currentQ: number;
  dimScores: number[];
  gateValue: string | undefined;
  triggerValue: string | undefined;
  result: FullResult | null;
  preGrades: Grade[] | null;
  apiData: ApiData | null;
  qList: QuestionItem[];
  error: string | null;
}

type QuizAction =
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "INIT_SUCCESS"; payload: { apiData: ApiData; qList: QuestionItem[]; screen: Screen; restoredState?: Partial<QuizState> } }
  | { type: "START_TEST"; payload: { apiData: ApiData; qList: QuestionItem[] } }
  | { type: "ANSWER"; payload: { currentQ: number; dimScores: number[]; gateValue: string | undefined; triggerValue: string | undefined; qList: QuestionItem[] } }
  | { type: "START_CALCULATING"; payload: { preGrades: Grade[] } }
  | { type: "FINISH_CALCULATING"; payload: { result: FullResult } }
  | { type: "RESTART"; payload: { apiData: ApiData; qList: QuestionItem[] } };

const initialState: QuizState = {
  screen: "loading",
  currentQ: 0,
  dimScores: new Array(DIM_COUNT).fill(0),
  gateValue: undefined,
  triggerValue: undefined,
  result: null,
  preGrades: null,
  apiData: null,
  qList: [],
  error: null,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "SET_ERROR":
      return { ...state, error: action.payload, screen: state.screen === "loading" ? "welcome" : state.screen };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "INIT_SUCCESS":
      return {
        ...state,
        error: null,
        apiData: action.payload.apiData,
        qList: action.payload.qList,
        screen: action.payload.screen,
        ...(action.payload.restoredState ?? {}),
      };

    case "START_TEST":
      return {
        ...state,
        screen: "test",
        currentQ: 0,
        dimScores: new Array(DIM_COUNT).fill(0),
        gateValue: undefined,
        triggerValue: undefined,
        result: null,
        preGrades: null,
        qList: action.payload.qList,
        apiData: action.payload.apiData,
        error: null,
      };

    case "ANSWER":
      return {
        ...state,
        currentQ: action.payload.currentQ,
        dimScores: action.payload.dimScores,
        gateValue: action.payload.gateValue,
        triggerValue: action.payload.triggerValue,
        qList: action.payload.qList,
      };

    case "START_CALCULATING":
      return {
        ...state,
        screen: "calculating",
        preGrades: action.payload.preGrades,
      };

    case "FINISH_CALCULATING":
      return {
        ...state,
        screen: "result",
        result: action.payload.result,
      };

    case "RESTART":
      return {
        ...state,
        screen: "welcome",
        currentQ: 0,
        dimScores: new Array(DIM_COUNT).fill(0),
        gateValue: undefined,
        triggerValue: undefined,
        result: null,
        preGrades: null,
        qList: action.payload.qList,
        apiData: action.payload.apiData,
        error: null,
      };

    default:
      return state;
  }
}

export function useQuiz() {
  const { lang } = useI18n();
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const initialized = useRef(false);
  const answerLog = useRef<Array<{ dim: string; text: string; label: string; score: number }>>([]);
  const langRef = useRef(lang);
  const calculatingRef = useRef(false);

  // Fetch quiz data from API — re-fetch on language change if still on welcome
  useEffect(() => {
    const langChanged = langRef.current !== lang;
    langRef.current = lang;

    if (initialized.current && !langChanged) return;
    if (initialized.current && state.screen !== "welcome" && state.screen !== "loading") return;
    initialized.current = true;

    fetch(`/api/quiz?lang=${lang}`)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`API request failed: ${r.status} ${r.statusText}`);
        }
        return r.json();
      })
      .then((data: ApiData) => {
        // Check for saved progress
        const saved = loadProgress();
        if (saved && saved.currentQuestion > 0 && !saved.completedAt) {
          const triggerKind: TriggerKind =
            saved.gateAnswer === "complement" && !saved.triggerAnswer ? "cmpl" :
            saved.gateAnswer === "transcend" && !saved.triggerAnswer ? "unit13" :
            saved.gateAnswer === "rei" && !saved.triggerAnswer ? "rei" : "none";

          if (saved.answerLog) answerLog.current = saved.answerLog;

          dispatch({
            type: "INIT_SUCCESS",
            payload: {
              apiData: data,
              qList: buildQuestionList(data, triggerKind),
              screen: "test",
              restoredState: {
                currentQ: saved.currentQuestion,
                dimScores: saved.answers,
                gateValue: saved.gateAnswer,
                triggerValue: saved.triggerAnswer,
              },
            },
          });
        } else {
          dispatch({
            type: "INIT_SUCCESS",
            payload: {
              apiData: data,
              qList: buildQuestionList(data, "none"),
              screen: "welcome",
            },
          });
        }
      })
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : "Failed to load quiz data";
        dispatch({ type: "SET_ERROR", payload: errorMsg });
      });
  }, [lang, state.screen]);

  const totalQ = state.qList.length;
  const progress = totalQ > 0 ? state.currentQ / totalQ : 0;

  const startTest = useCallback(() => {
    if (!state.apiData) return;
    answerLog.current = [];
    dispatch({
      type: "START_TEST",
      payload: {
        apiData: state.apiData,
        qList: buildQuestionList(state.apiData, "none"),
      },
    });
  }, [state.apiData]);

  const handleAnswer = useCallback((optionIdx: number) => {
    if (!state.apiData) return;
    const q = state.qList[state.currentQ];
    if (!q) return;

    const opt = q.options[optionIdx];
    const newScores = [...state.dimScores];
    let newGate = state.gateValue;
    let newTrigger = state.triggerValue;
    let newList = state.qList;

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
        newList = buildQuestionList(state.apiData, "cmpl");
      } else if (opt.value === "transcend") {
        newList = buildQuestionList(state.apiData, "unit13");
      } else if (opt.value === "rei") {
        newList = buildQuestionList(state.apiData, "rei");
      }
    } else if (q.type === "trigger") {
      newTrigger = opt.trigger;
    }

    const nextQ = state.currentQ + 1;

    if (nextQ >= newList.length) {
      dispatch({ type: "START_CALCULATING", payload: { preGrades: scoresToGrades(newScores) } });

      // 防止重复计算
      if (calculatingRef.current) return;
      calculatingRef.current = true;

      const finalScores = newScores;
      const logCopy = [...answerLog.current];
      const matchInput: MatchInput = {
        personalityTypes: state.apiData.personalityTypes,
        specialTypes: state.apiData.specialTypes,
      };

      setTimeout(() => {
        const r = matchPersonality(finalScores, newGate, newTrigger, matchInput);
        dispatch({ type: "FINISH_CALCULATING", payload: { result: r } });
        saveResult(r);
        clearProgress();
        calculatingRef.current = false;

        const attribution = getAttribution();

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
            attribution,
          }),
        }).catch((err) => {
          // 静默处理结果保存失败，不影响用户体验
          console.warn("Failed to save result to server:", err);
        });
      }, 2500);
    } else {
      dispatch({
        type: "ANSWER",
        payload: {
          currentQ: nextQ,
          dimScores: newScores,
          gateValue: newGate,
          triggerValue: newTrigger,
          qList: newList,
        },
      });
      saveProgress({
        currentQuestion: nextQ,
        answers: newScores,
        gateAnswer: newGate,
        triggerAnswer: newTrigger,
        answerLog: answerLog.current,
      });
    }
  }, [state.apiData, state.qList, state.currentQ, state.dimScores, state.gateValue, state.triggerValue]);

  const restart = useCallback(() => {
    if (!state.apiData) return;
    clearProgress();
    answerLog.current = [];
    dispatch({
      type: "RESTART",
      payload: {
        apiData: state.apiData,
        qList: buildQuestionList(state.apiData, "none"),
      },
    });
  }, [state.apiData]);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const userGrades = state.result?.userVector ?? state.preGrades ?? null;

  return {
    screen: state.screen,
    currentQ: state.currentQ,
    progress,
    totalQ,
    qList: state.qList,
    result: state.result,
    startTest,
    handleAnswer,
    restart,
    dimScores: state.dimScores,
    userGrades,
    error: state.error,
    clearError,
  };
}