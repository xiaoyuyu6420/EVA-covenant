"use client";

import { useEffect, useCallback, useRef } from "react";
import { useQuiz } from "@/hooks/useQuiz";
import WelcomeScreen from "@/components/WelcomeScreen";
import TestScreen from "@/components/TestScreen";
import ResultScreen from "@/components/ResultScreen";
import { trackEvent } from "@/lib/analytics";

export default function Home() {
  const {
    screen, currentQ, progress, totalQ, qList, result, dimScores, userGrades,
    startTest, handleAnswer, restart,
  } = useQuiz();
  const trackedResultCode = useRef<string | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (screen !== "test") return;
    const q = qList[currentQ];
    if (!q) return;
    const numKey = parseInt(e.key);
    if (numKey >= 1 && numKey <= q.options.length) {
      handleAnswer(numKey - 1);
    }
  }, [screen, currentQ, qList, handleAnswer]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    trackEvent("page_view");
  }, []);

  useEffect(() => {
    if (screen !== "result" || !result) return;
    const resultKey = `${result.top.code}-${result.top.similarity}`;
    if (trackedResultCode.current === resultKey) return;

    trackedResultCode.current = resultKey;
    trackEvent("quiz_complete", {
      code: result.top.code,
      unit: result.top.evaUnit,
      similarity: result.top.similarity,
      isSpecial: result.top.isSpecial,
      isBoundary: result.top.isBoundary,
    });
  }, [result, screen]);

  const handleStartTest = useCallback(() => {
    trackEvent("quiz_start");
    startTest();
  }, [startTest]);

  return (
    <div
      className="w-full max-w-[600px] h-dvh max-h-[900px] bg-[var(--card)] relative
                 border-x border-[#333] flex flex-col overflow-hidden mx-auto
                 [overscroll-behavior:none]"
      style={{ boxShadow: "0 0 30px rgba(0,0,0,0.8)" }}
    >
      <div className="caution-tape" />
      <div className="absolute bottom-0 left-0 right-0 caution-tape" />

      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden pt-3 pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {screen === "welcome" && <WelcomeScreen onStart={handleStartTest} />}
        {screen === "loading" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[var(--nerv-orange)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {screen === "test" && qList[currentQ] && (
          <TestScreen
            currentQ={currentQ}
            totalQ={totalQ}
            progress={progress}
            question={qList[currentQ]}
            onAnswer={handleAnswer}
            onRestart={restart}
          />
        )}
        {screen === "result" && result && (
          <ResultScreen
            result={result}
            onRestart={restart}
            dimScores={dimScores}
            userGrades={userGrades}
          />
        )}
        {screen === "calculating" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 border-2 border-[var(--eva-purple)] border-t-transparent rounded-full animate-spin mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">ANALYSIS COMPLETE</h2>
            <p className="text-gray-400 text-sm mb-8">Test finished. Refresh to start a new session.</p>
            <button
              onClick={restart}
              className="eva-btn border border-[var(--eva-purple)] text-[var(--eva-purple)] px-8 py-3 text-sm tracking-widest hover:bg-[var(--eva-purple)] hover:text-white transition-all"
            >
              RESTART
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
