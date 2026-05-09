"use client";

import { useEffect, useCallback } from "react";
import { useQuiz } from "@/hooks/useQuiz";
import WelcomeScreen from "@/components/WelcomeScreen";
import TestScreen from "@/components/TestScreen";
import ResultScreen from "@/components/ResultScreen";
import CalculatingScreen from "@/components/CalculatingScreen";

export default function Home() {
  const {
    screen, currentQ, progress, totalQ, qList, result,
    startTest, handleAnswer, restart, dimScores, userGrades,
  } = useQuiz();

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
        {screen === "welcome" && <WelcomeScreen onStart={startTest} />}
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
        {screen === "calculating" && <CalculatingScreen userScores={dimScores} userGrades={userGrades ?? undefined} />}
        {screen === "result" && result && (
          <ResultScreen result={result} onRestart={restart} />
        )}
      </main>
    </div>
  );
}
