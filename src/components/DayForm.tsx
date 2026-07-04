"use client";

import { useState, useEffect } from "react";
import RatingPicker from "@/components/RatingPicker";
import Toast, { ToastType } from "@/components/Toast";
import { countWords, sportSupportsKm, STUDY_SUBJECTS } from "@/lib/validation";
import { DayRecord, Sport, Settings, HabitStreaks } from "@/types";
import {
  Moon, BookOpen, Instagram, HandHeart, Dumbbell,
  Music, GraduationCap, DollarSign, Star, Flame, Plus, X,
} from "lucide-react";
import clsx from "clsx";

interface WorkoutEntry {
  localId: string;
  sportId: string;
  rating: number | null;
  km: number | "";
  duration: number | "";
}

interface DayFormState {
  description: string;
  sleepHours: number | "";
  sleepMinutes: number | "";
  pagesRead: number | "";
  instagramMinutes: number | "";
  prayer: boolean;
  workouts: WorkoutEntry[];
  musicPlayed: boolean;
  studiedToday: boolean;
  studyMinutes: number | "";
  studySubjects: string[];
  economicProject: boolean;
  economicNotes: string;
  dayRating: number | null;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const EMPTY: DayFormState = {
  description: "",
  sleepHours: "",
  sleepMinutes: 0,
  pagesRead: "",
  instagramMinutes: "",
  prayer: false,
  workouts: [],
  musicPlayed: false,
  studiedToday: false,
  studyMinutes: "",
  studySubjects: [],
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
    workouts: day.workouts.map((w) => ({
      localId: uid(),
      sportId: w.sportId,
      rating: w.rating,
      km: w.km ?? "",
      duration: w.duration ?? "",
    })),
    musicPlayed: day.musicPlayed,
    studiedToday: day.studyMinutes > 0,
    studyMinutes: day.studyMinutes > 0 ? day.studyMinutes : "",
    studySubjects: day.studySessions.map((s) => s.subject).filter((s): s is string => !!s),
    economicProject: day.economicProject,
    economicNotes: day.economicNotes ?? "",
    dayRating: day.dayRating,
  };
}

function StreakBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <div className="flex flex-shrink-0 items-center gap-1 rounded-full bg-orange-500/15 border border-orange-500/20 px-2 py-0.5">
      <Flame className="h-3 w-3 text-orange-400" />
      <span className="text-[11px] font-bold text-orange-400">{count}</span>
    </div>
  );
}

function Section({ title, icon, streak, children }: {
  title: string; icon: React.ReactNode; streak?: number; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4 space-y-3 min-w-0 w-full">
      <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-indigo-400 flex-shrink-0">{icon}</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/50 truncate">{title}</span>
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
    <div className="flex gap-2 w-full">
      <button type="button" onClick={() => onChange(true)}
        className={clsx("flex-1 min-w-0 rounded-xl py-2.5 text-sm font-semibold transition-all truncate px-2",
          checked ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white/5 text-zinc-500 border border-white/8 hover:bg-white/8")}>
        {labelYes}
      </button>
      <button type="button" onClick={() => onChange(false)}
        className={clsx("flex-1 min-w-0 rounded-xl py-2.5 text-sm font-semibold transition-all truncate px-2",
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
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-xs text-zinc-500 font-medium truncate">{label}</label>
      <div className="relative min-w-0">
        <input type="number" inputMode="decimal" value={value} step={step} min={min} max={max} placeholder="0"
          onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
          className="w-full min-w-0 rounded-xl bg-white/6 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition" />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 pointer-events-none">{unit}</span>}
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

  const wordCount = countWords(form.description);
  const minWords = settings.minWords;

  function addWorkout() {
    if (sports.length === 0) return;
    update("workouts", [...form.workouts, { localId: uid(), sportId: sports[0].id, rating: null, km: "", duration: "" }]);
  }
  function removeWorkout(localId: string) {
    update("workouts", form.workouts.filter((w) => w.localId !== localId));
  }
  function updateWorkout(localId: string, patch: Partial<WorkoutEntry>) {
    update("workouts", form.workouts.map((w) => (w.localId === localId ? { ...w, ...patch } : w)));
  }

  function toggleSubject(subject: string) {
    const has = form.studySubjects.includes(subject);
    update("studySubjects", has ? form.studySubjects.filter((s) => s !== subject) : [...form.studySubjects, subject]);
  }

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
          workouts: form.workouts.map((w) => ({
            sportId: w.sportId,
            rating: w.rating,
            km: w.km === "" ? null : Number(w.km),
            duration: w.duration === "" ? null : Number(w.duration),
          })),
          musicPlayed: form.musicPlayed,
          studyMinutes: form.studiedToday ? Number(form.studyMinutes) : 0,
          studySubjects: form.studiedToday ? form.studySubjects : [],
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
    <div className="space-y-3 px-4 pb-8 pt-3 w-full max-w-full min-w-0 overflow-x-hidden">

      {/* Descrizione */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-4 min-w-0 w-full">
        <label className="block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">✦ Com'è andata oggi?</label>
        <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={5}
          placeholder="Scrivi qualcosa sulla tua giornata..."
          className="w-full min-w-0 resize-none bg-transparent text-sm text-white/90 placeholder-zinc-600 outline-none leading-relaxed break-words" />
        <div className="mt-2 flex justify-between items-center border-t border-white/6 pt-2 gap-2">
          <span className={clsx("text-xs truncate", wordCount < minWords ? "text-red-400" : "text-zinc-600")}>
            {wordCount} / {minWords} parole minime
          </span>
          {wordCount >= minWords && wordCount > 0 && <span className="text-xs text-emerald-500 flex-shrink-0">✓</span>}
        </div>
        {descError && <p className="mt-1 text-xs text-red-400 animate-fade-in break-words">{descError}</p>}
      </div>

      {/* Sonno */}
      <Section title="Sonno" icon={<Moon className="h-4 w-4" />} streak={habitStreaks?.sleep}>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Ore" value={form.sleepHours} onChange={(v) => update("sleepHours", v)} unit="h" min={0} max={24} />
          <NumField label="Minuti" value={form.sleepMinutes} onChange={(v) => update("sleepMinutes", v)} unit="min" min={0} max={59} />
        </div>
      </Section>

      {/* Lettura */}
      <Section title="Lettura" icon={<BookOpen className="h-4 w-4" />} streak={habitStreaks?.reading}>
        <NumField label="Pagine lette" value={form.pagesRead} onChange={(v) => update("pagesRead", v)} unit="pag" />
      </Section>

      {/* Instagram */}
      <Section title="Instagram" icon={<Instagram className="h-4 w-4" />} streak={habitStreaks?.instagram}>
        <NumField label="Minuti usati" value={form.instagramMinutes} onChange={(v) => update("instagramMinutes", v)} unit="min" />
      </Section>

      {/* Preghiera */}
      <Section title="Preghiera" icon={<HandHeart className="h-4 w-4" />} streak={habitStreaks?.prayer}>
        <PillToggle checked={form.prayer} onChange={(v) => update("prayer", v)} labelYes="✓ Sì" labelNo="✗ No" />
      </Section>

      {/* Allenamento — multipli */}
      <Section title="Allenamento" icon={<Dumbbell className="h-4 w-4" />} streak={habitStreaks?.workout}>
        {form.workouts.length === 0 && (
          <p className="text-xs text-zinc-600">Nessun allenamento aggiunto oggi.</p>
        )}
        <div className="space-y-3">
          {form.workouts.map((w, idx) => {
            const sport = sports.find((s) => s.id === w.sportId);
            const showKm = sport ? sportSupportsKm(sport.name) : false;
            return (
              <div key={w.localId} className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-3 min-w-0">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 flex-shrink-0">
                    Allenamento {idx + 1}
                  </span>
                  <button type="button" onClick={() => removeWorkout(w.localId)}
                    className="flex-shrink-0 rounded-lg p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 min-w-0">
                  {sports.map((s) => (
                    <button key={s.id} type="button" onClick={() => updateWorkout(w.localId, { sportId: s.id })}
                      className={clsx("rounded-full px-3 py-1.5 text-xs font-semibold transition-all max-w-full truncate",
                        w.sportId === s.id
                          ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                          : "bg-white/6 text-zinc-400 border border-white/10 hover:bg-white/10")}>
                      {s.name}
                    </button>
                  ))}
                </div>
                {showKm && (
                  <div className="grid grid-cols-2 gap-2">
                    <NumField label="Distanza" value={w.km} onChange={(v) => updateWorkout(w.localId, { km: v })} unit="km" step={0.1} />
                    <NumField label="Durata" value={w.duration} onChange={(v) => updateWorkout(w.localId, { duration: v })} unit="min" />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-zinc-500 font-medium mb-2">Voto allenamento</label>
                  <RatingPicker value={w.rating} onChange={(v) => updateWorkout(w.localId, { rating: v })} allowDecimals />
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={addWorkout} disabled={sports.length === 0}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 py-2.5 text-xs font-semibold text-indigo-400 transition hover:bg-indigo-500/10 disabled:opacity-40">
          <Plus className="h-3.5 w-3.5" /> Aggiungi allenamento
        </button>
      </Section>

      {/* Musica */}
      <Section title="Musica" icon={<Music className="h-4 w-4" />} streak={habitStreaks?.music}>
        <PillToggle checked={form.musicPlayed} onChange={(v) => update("musicPlayed", v)} labelYes="✓ Ho suonato" labelNo="✗ No" />
      </Section>

      {/* Studio — multi materia, un totale minuti */}
      <Section title="Studio" icon={<GraduationCap className="h-4 w-4" />} streak={habitStreaks?.study}>
        <PillToggle
          checked={form.studiedToday}
          onChange={(v) => { update("studiedToday", v); if (!v) { update("studyMinutes", ""); update("studySubjects", []); } }}
          labelYes="✓ Ho studiato" labelNo="✗ No" />
        {form.studiedToday && (
          <div className="space-y-3 animate-fade-in">
            <NumField label="Minuti di studio totali" value={form.studyMinutes} onChange={(v) => update("studyMinutes", v)} unit="min" />
            <div className="min-w-0">
              <label className="block text-xs text-zinc-500 font-medium mb-2">Materie (puoi selezionarne più di una)</label>
              <div className="flex flex-wrap gap-1.5">
                {STUDY_SUBJECTS.map((subject) => (
                  <button key={subject} type="button" onClick={() => toggleSubject(subject)}
                    className={clsx("rounded-full px-3 py-1 text-xs font-semibold transition-all max-w-full truncate",
                      form.studySubjects.includes(subject)
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
          <textarea value={form.economicNotes} onChange={(e) => update("economicNotes", e.target.value)} rows={2} placeholder="Note (opzionale)..."
            className="w-full min-w-0 animate-fade-in resize-none rounded-xl bg-white/6 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/60 transition break-words" />
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
