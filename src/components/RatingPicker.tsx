"use client";

import clsx from "clsx";

export default function RatingPicker({
  value,
  onChange,
  allowDecimals = false,
}: {
  value: number | null;
  onChange: (val: number) => void;
  allowDecimals?: boolean;
}) {
  // Valori interi 1-10, oppure con .5
  const steps = allowDecimals
    ? Array.from({ length: 19 }, (_, i) => Math.round((1 + i * 0.5) * 10) / 10)
    : Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className={clsx("flex flex-wrap gap-1.5", allowDecimals ? "gap-1" : "gap-2")}>
      {steps.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={clsx(
            "flex items-center justify-center rounded-xl text-xs font-semibold transition-all duration-150",
            allowDecimals ? "h-8 min-w-[2.4rem] px-1" : "h-9 w-full flex-1",
            value === n
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105"
              : "bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10"
          )}
        >
          {n % 1 === 0 ? n : n.toFixed(1)}
        </button>
      ))}
    </div>
  );
}
