"use client";
export default function NumberInput({ label, value, onChange, unit, step = 1, min = 0, max }: {
  label: string; value: number | ""; onChange: (val: number | "") => void;
  unit?: string; step?: number; min?: number; max?: number;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{label}</label>
      <div className="relative min-w-0">
        <input type="number" inputMode="decimal" value={value} step={step} min={min} max={max}
          onChange={(e) => { const v = e.target.value; onChange(v === "" ? "" : parseFloat(v)); }}
          className="w-full min-w-0 rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-sm text-white outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20" />
        {unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">{unit}</span>}
      </div>
    </div>
  );
}
