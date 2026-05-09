"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/context";
import { DIMENSIONS } from "@/lib/types";
import type { Grade } from "@/lib/types";

const GRADE_LABEL: Record<Grade, string> = { L: "LOW", M: "MED", H: "HIGH", X: "EXT" };

interface Props {
  userScores?: number[];
  userGrades?: Grade[];
}

export default function CalculatingScreen({ userScores, userGrades }: Props) {
  const [visibleLogs, setVisibleLogs] = useState<number>(0);
  const t = useT();

  const logs: string[] = [];
  if (userScores && userGrades) {
    const modelNames = ["A", "B", "C", "D", "E"];
    const dimPerModel = 3;
    for (let m = 0; m < 5; m++) {
      const modelLetter = modelNames[m];
      const startIdx = m * dimPerModel;
      const dims = [];
      for (let d = 0; d < dimPerModel; d++) {
        const idx = startIdx + d;
        const dim = DIMENSIONS[idx];
        const score = userScores[idx];
        const grade = userGrades[idx];
        dims.push(`${dim.code} ${dim.name.slice(0, 4)}=${score}/9→${GRADE_LABEL[grade]}`);
      }
      logs.push(`模型${modelLetter}: ${dims.join(" | ")}`);
    }
    logs.push(t("calc.log4"));
    logs.push(t("calc.log5"));
    logs.push(t("calc.log6"));
  } else {
    logs.push(t("calc.log1"));
    logs.push(t("calc.log2"));
    logs.push(t("calc.log3"));
    logs.push(t("calc.log4"));
    logs.push(t("calc.log5"));
    logs.push(t("calc.log6"));
  }

  useEffect(() => {
    setVisibleLogs(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let delay = 0;
    logs.forEach((_, i) => {
      delay += 300 + Math.random() * 200;
      timers.push(setTimeout(() => setVisibleLogs(i + 1), delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [logs.length]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-5">
      {/* Title */}
      <p
        className="text-xl tracking-[5px] mb-8"
        style={{ fontFamily: "var(--font-tech)", color: "var(--nerv-orange)", animation: "blink 0.5s infinite" }}
      >
        CALCULATING
      </p>

      {/* Log lines */}
      <div className="w-full max-w-[500px]" style={{ fontFamily: "var(--font-tech)" }}>
        {logs.map((log, i) => (
          <motion.div
            key={i}
            className="mb-2 text-[0.8rem]"
            style={{ color: i < 5 ? "var(--eva-green)" : "var(--nerv-orange)" }}
            initial={{ opacity: 0, x: -10 }}
            animate={i < visibleLogs ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3 }}
          >
            &gt; {log}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
