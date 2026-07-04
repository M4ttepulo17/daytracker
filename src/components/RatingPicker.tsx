"use client";
import clsx from "clsx";

export default function RatingPicker({ value, onChange, allowDecimals = false }: {
  value: number | null; onChange: (val: number) => void; allowDecimals?: boolean;
}) {
  const steps = allowDecimals
    ? Array.from({ length: 19 }, (_, i) => Math.round((1 + i * 0.5) * 10) / 10)
    : Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-5 gap-1.5 w-full">
      {steps.map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={clsx(
            "flex items-center justify-center rounded-xl text-xs font-semibold transition-all duration-150 h-8 min-w-0",
            value === n
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105"
              : "bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10"
          )}>
          {n % 1 === 0 ? n : n.toFixed(1)}
        </button>
      ))}
    </div>
  );
}
