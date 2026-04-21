"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/context";

const LOG_KEYS = [
  "calc.log1", "calc.log2", "calc.log3",
  "calc.log4", "calc.log5", "calc.log6",
];

export default function CalculatingScreen() {
  const [visibleLogs, setVisibleLogs] = useState<number>(0);
  const t = useT();

  useEffect(() => {
    setVisibleLogs(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let delay = 0;
    LOG_KEYS.forEach((_, i) => {
      delay += 350 + Math.random() * 250;
      timers.push(setTimeout(() => setVisibleLogs(i + 1), delay));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

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
      <div className="w-full max-w-[400px]" style={{ fontFamily: "var(--font-tech)" }}>
        {LOG_KEYS.map((key, i) => (
          <motion.div
            key={i}
            className="mb-2 text-[0.85rem]"
            style={{ color: "var(--eva-green)" }}
            initial={{ opacity: 0, x: -10 }}
            animate={i < visibleLogs ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3 }}
          >
            &gt; {t(key)}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
