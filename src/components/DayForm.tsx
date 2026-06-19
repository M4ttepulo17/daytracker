"use client";

import { useState, useEffect } from "react";
import RatingPicker from "@/components/RatingPicker";
import Toast, { ToastType } from "@/components/Toast";
import { countWords, sportSupportsKm, STUDY_SUBJECTS } from "@/lib/validation";
import { DayRecord, Sport, Settings, HabitStreaks } from "@/types";
import {
  Moon, BookOpen, Instagram, HandHeart, Dumbbell,
  Music, GraduationCap, DollarSign, Star, Flame,
} from "lucide-react";
import clsx from "clsx";

interface DayFormState {
  description: string;
  sleepHours: number | "";
  sleepMinutes: number | "";
  pagesRead: number | "";
  instagramMinutes: number | "";
  prayer: boolean;
  sportId: string | null;
  workoutRating: number | null;
  workoutKm: number | "";
  workoutDuration: number | "";
  musicPlayed: boolean;
  studiedToday: boolean;
  studyMinutes: number | "";
  studySubject: string | null;
  economicProject: boolean;
  economicNotes: string;
  dayRating: number | null;
}

const EMPTY: DayFormState = {
  description: "",
  sleepHours: "",
  sleepMinutes: 0,
  pagesRead: "",
  instagramMinutes: "",
  prayer: false,
  sportId: null,
  workoutRating: null,
  workoutKm: "",
  workoutDuration: "",
  musicPlayed: false,
  studiedToday: false,
  studyMinutes: "",
  studySubject: null,
  economicProject: false,
  economicNotes: "",
  dayRating: null,
};

function toForm(day: DayRecord): DayFormState {
  return {
    description: day.description,
    sleepHours: day.sleepHours,
    sleepMinutes: day.sleepMinutes,
    pagesRead: day.pagesRead,
    instagramMinutes: day.instagramMinutes,
    prayer: day.prayer,
    sportId: day.sportId,
    workoutRating: day.workoutRating,
    workoutKm: day.workoutKm ?? "",
    workoutDuration: day.workoutDuration ?? "",
    musicPlayed: day.musicPlayed,
    studiedToday: day.studyMinutes > 0,
    studyMinutes: day.studyMinutes > 0 ? day.studyMinutes : "",
    studySubject: day.studySubject ?? null,
    economicProject: day.economicProject,
    economicNotes: day.economicNotes ?? "",
    dayRating: day.dayRating,
  };
}

function StreakBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <div className="flex items-center gap-1 rounded-full bg-orange-500/15 border border-orange-500/20 px-2 py-0.5">
      <Flame className="h-3 w-3 text-orange-400" />
      <span className="text-[11px] font-bold text-orange-400">{count}</span>
    </div>
  );
}

function Section({ title, icon, streak, children }: {
  title: string; icon: React.ReactNode; streak?: number; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <span className="text-indigo-400">{icon}</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">{title}</span>
        </div>
        <StreakBadge count={streak ?? 0} />
      </div>
      {children}
    </div>
  );
}

function PillToggle({ checked, onChange, labelYes = "Sì", labelNo = "No" }: {
  checked: boolean; onChange: (v: boolean) => void; labelYes?: string; labelNo?: string;
}) {
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => onChange(true)}
        className={clsx("flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
          checked ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white/5 text-zinc-500 border border-white/8 hover:bg-white/8")}>
        {labelYes}
      </button>
      <button type="button" onClick={() => onChange(false)}
        className={clsx("flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
          !checked ? "bg-white/10 text-white"
                   : "bg-white/5 text-zinc-500 border border-white/8 hover:bg-white/8")}>
        {labelNo}
      </button>
    </div>
  );
}

function NumField({ label, value, onChange, unit, step = 1, min = 0, max }: {
  label: string; value: number | ""; onChange: (v: number | "") => void;
  unit?: string; step?: number; min?: number; max?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-zinc-500 font-medium">{label}</label>
      <div className="relative">
        <input
          type="number" inputMode="decimal" value={value} step={step} min={min} max={max}
          placeholder="0"
          onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
          className="w-full rounded-xl bg-white/6 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition"
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">{unit}</span>}
      </div>
    </div>
  );
}

export default function DayForm({ date, initialDay, sports, settings, onSaved, habitStreaks }: {
  date: string;
  initialDay: DayRecord | null;
  sports: Sport[];
  settings: Settings;
  onSaved?: (day: DayRecord) => void;
  habitStreaks?: HabitStreaks;
}) {
  const [form, setForm] = useState<DayFormState>(initialDay ? toForm(initialDay) : EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [descError, setDescError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialDay ? toForm(initialDay) : EMPTY);
    setDescError(null);
  }, [initialDay, date]);

  function update<K extends keyof DayFormState>(key: K, value: DayFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const selectedSport = sports.find((s) => s.id === form.sportId);
  const showKmFields = selectedSport ? sportSupportsKm(selectedSport.name) : false;
  const wordCount = countWords(form.description);
  const minWords = settings.minWords;

  async function handleSave() {
    setDescError(null);
    if (wordCount < minWords) {
      setDescError(`Servono almeno ${minWords} parole (attuali: ${wordCount}).`);
      return;
    }
    if (form.dayRating === null) {
      setToast({ message: "Inserisci il voto della giornata", type: "error" });
      return;
    }
    if (form.sleepHours === "" || form.pagesRead === "" || form.instagramMinutes === "") {
      setToast({ message: "Compila tutti i campi numerici", type: "error" });
      return;
    }
    if (form.studiedToday && form.studyMinutes === "") {
      setToast({ message: "Inserisci i minuti di studio", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description: form.description,
          sleepHours: Number(form.sleepHours),
          sleepMinutes: Number(form.sleepMinutes) || 0,
          pagesRead: Number(form.pagesRead),
          instagramMinutes: Number(form.instagramMinutes),
          prayer: form.prayer,
          sportId: form.sportId,
          workoutRating: form.workoutRating,
          workoutKm: form.workoutKm === "" ? null : Number(form.workoutKm),
          workoutDuration: form.workoutDuration === "" ? null : Number(form.workoutDuration),
          musicPlayed: form.musicPlayed,
          studyMinutes: form.studiedToday ? Number(form.studyMinutes) : 0,
          studySubject: form.studiedToday ? form.studySubject : null,
          economicProject: form.economicProject,
          economicNotes: form.economicNotes || null,
          dayRating: form.dayRating,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? "Errore durante il salvataggio", type: "error" });
        if (data.error?.includes("parole")) setDescError(data.error);
        return;
      }
      setToast({ message: "Giornata salvata! ✓", type: "success" });
      onSaved?.(data.day);
    } catch {
      setToast({ message: "Errore di rete, riprova", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 px-4 pb-8 pt-3">

      {/* Descrizione */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
        <label className="block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">
          ✦ Com'è andata oggi?
        </label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={5}
          placeholder="Scrivi qualcosa sulla tua giornata..."
          className="w-full resize-none bg-transparent text-sm text-white/90 placeholder-zinc-600 outline-none leading-relaxed"
        />
        <div className="mt-2 flex justify-between items-center border-t border-white/6 pt-2">
          <span className={clsx("text-xs", wordCount < minWords ? "text-red-400" : "text-zinc-600")}>
            {wordCount} / {minWords} parole minime
          </span>
          {wordCount >= minWords && wordCount > 0 && (
            <span className="text-xs text-emerald-500">✓</span>
          )}
        </div>
        {descError && <p className="mt-1 text-xs text-red-400 animate-fade-in">{descError}</p>}
      </div>

      {/* Sonno — streak: giorni consecutivi sopra il target */}
      <Section title="Sonno" icon={<Moon className="h-4 w-4" />} streak={habitStreaks?.sleep}>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Ore" value={form.sleepHours} onChange={(v) => update("sleepHours", v)} unit="h" min={0} max={24} />
          <NumField label="Minuti" value={form.sleepMinutes} onChange={(v) => update("sleepMinutes", v)} unit="min" min={0} max={59} />
        </div>
      </Section>

      {/* Lettura — streak: giorni consecutivi con almeno 1 pagina */}
      <Section title="Lettura" icon={<BookOpen className="h-4 w-4" />} streak={habitStreaks?.reading}>
        <NumField label="Pagine lette" value={form.pagesRead} onChange={(v) => update("pagesRead", v)} unit="pag" />
      </Section>

      {/* Instagram — streak: giorni consecutivi sotto il limite */}
      <Section title="Instagram" icon={<Instagram className="h-4 w-4" />} streak={habitStreaks?.instagram}>
        <NumField label="Minuti usati" value={form.instagramMinutes} onChange={(v) => update("instagramMinutes", v)} unit="min" />
      </Section>

      {/* Preghiera */}
      <Section title="Preghiera" icon={<HandHeart className="h-4 w-4" />} streak={habitStreaks?.prayer}>
        <PillToggle checked={form.prayer} onChange={(v) => update("prayer", v)} labelYes="✓ Sì" labelNo="✗ No" />
      </Section>

      {/* Allenamento */}
      <Section title="Allenamento" icon={<Dumbbell className="h-4 w-4" />} streak={habitStreaks?.workout}>
        <div className="flex flex-wrap gap-2">
          <button type="button"
            onClick={() => { update("sportId", null); update("workoutRating", null); update("workoutKm", ""); update("workoutDuration", ""); }}
            className={clsx("rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              form.sportId === null
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                : "bg-white/6 text-zinc-400 border border-white/10 hover:bg-white/10")}>
            Riposo
          </button>
          {sports.map((sport) => (
            <button key={sport.id} type="button" onClick={() => update("sportId", sport.id)}
              className={clsx("rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                form.sportId === sport.id
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                  : "bg-white/6 text-zinc-400 border border-white/10 hover:bg-white/10")}>
              {sport.name}
            </button>
          ))}
        </div>
        {form.sportId !== null && (
          <div className="space-y-3 animate-fade-in pt-1">
            {showKmFields && (
              <div className="grid grid-cols-2 gap-2">
                <NumField label="Distanza" value={form.workoutKm} onChange={(v) => update("workoutKm", v)} unit="km" step={0.1} />
                <NumField label="Durata" value={form.workoutDuration} onChange={(v) => update("workoutDuration", v)} unit="min" />
              </div>
            )}
            <div>
              <label className="block text-xs text-zinc-500 font-medium mb-2">Voto allenamento</label>
              <RatingPicker value={form.workoutRating} onChange={(v) => update("workoutRating", v)} allowDecimals />
            </div>
          </div>
        )}
      </Section>

      {/* Musica */}
      <Section title="Musica" icon={<Music className="h-4 w-4" />} streak={habitStreaks?.music}>
        <PillToggle checked={form.musicPlayed} onChange={(v) => update("musicPlayed", v)} labelYes="✓ Ho suonato" labelNo="✗ No" />
      </Section>

      {/* Studio */}
      <Section title="Studio" icon={<GraduationCap className="h-4 w-4" />} streak={habitStreaks?.study}>
        <PillToggle
          checked={form.studiedToday}
          onChange={(v) => { update("studiedToday", v); if (!v) { update("studyMinutes", ""); update("studySubject", null); } }}
          labelYes="✓ Ho studiato"
          labelNo="✗ No"
        />
        {form.studiedToday && (
          <div className="space-y-3 animate-fade-in">
            <NumField label="Minuti di studio" value={form.studyMinutes} onChange={(v) => update("studyMinutes", v)} unit="min" />
            <div>
              <label className="block text-xs text-zinc-500 font-medium mb-2">Materia</label>
              <div className="flex flex-wrap gap-1.5">
                {STUDY_SUBJECTS.map((subject) => (
                  <button key={subject} type="button"
                    onClick={() => update("studySubject", form.studySubject === subject ? null : subject)}
                    className={clsx("rounded-full px-3 py-1 text-xs font-semibold transition-all",
                      form.studySubject === subject
                        ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30"
                        : "bg-white/6 text-zinc-400 border border-white/10 hover:bg-white/10")}>
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Progetto Economico */}
      <Section title="Progetto Economico" icon={<DollarSign className="h-4 w-4" />} streak={habitStreaks?.economicProject}>
        <PillToggle checked={form.economicProject} onChange={(v) => update("economicProject", v)} labelYes="✓ Sì" labelNo="✗ No" />
        {form.economicProject && (
          <textarea value={form.economicNotes} onChange={(e) => update("economicNotes", e.target.value)}
            rows={2} placeholder="Note (opzionale)..."
            className="w-full animate-fade-in resize-none rounded-xl bg-white/6 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/60 transition"
          />
        )}
      </Section>

      {/* Voto Giornata */}
      <Section title="Voto Giornata" icon={<Star className="h-4 w-4" />}>
        <RatingPicker value={form.dayRating} onChange={(v) => update("dayRating", v)} allowDecimals />
      </Section>

      <button onClick={handleSave} disabled={saving}
        className="w-full rounded-2xl bg-indigo-500 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 transition hover:bg-indigo-400 active:scale-[0.98] disabled:opacity-50">
        {saving ? "Salvataggio..." : "Salva giornata"}
      </button>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
