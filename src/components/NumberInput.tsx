"use client";

export default function NumberInput({
  label,
  value,
  onChange,
  unit,
  step = 1,
  min = 0,
  max,
  placeholder,
}: {
  label: string;
  value: number | "";
  onChange: (val: number | "") => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? "" : parseFloat(v));
          }}
          className="w-full rounded-xl border border-zinc-200 bg-transparent py-2.5 px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-zinc-700 dark:focus:border-accent-dark"
        />
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
