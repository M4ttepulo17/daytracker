"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import DayForm from "@/components/DayForm";
import Toast, { ToastType } from "@/components/Toast";
import { DayRecord, Sport, Settings } from "@/types";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  ChevronLeft, Star, Moon, BookOpen,
  Trash2, AlertTriangle, Plus, Calendar,
} from "lucide-react";

export default function HistoryPage() {
  const [days, setDays] = useState<DayRecord[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newDate, setNewDate] = useState("");

  async function loadDays() {
    const res = await fetch("/api/days");
    const data = await res.json();
    setDays(data.days ?? []);
  }

  useEffect(() => {
    async function load() {
      const [sportsRes, settingsRes] = await Promise.all([
        fetch("/api/sports"),
        fetch("/api/settings"),
      ]);
      setSports((await sportsRes.json()).sports ?? []);
      setSettings((await settingsRes.json()).settings);
      await loadDays();
      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete(date: string) {
    try {
      const res = await fetch(`/api/days/${date}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        await loadDays();
        setConfirmDelete(null);
        setSelectedDate(null);
        setToast({ message: "Giornata eliminata", type: "success" });
      } else {
        setToast({ message: data.error ?? "Errore durante l'eliminazione", type: "error" });
        setConfirmDelete(null);
      }
    } catch {
      setToast({ message: "Errore di rete, riprova", type: "error" });
      setConfirmDelete(null);
    }
  }

  function handleAddOldDay() {
    if (!newDate) return;
    const today = format(new Date(), "yyyy-MM-dd");
    if (newDate >= today) {
      setToast({ message: "Seleziona una data passata", type: "error" });
      return;
    }
    setShowDatePicker(false);
    setSelectedDate(newDate);
    setNewDate("");
  }

  if (loading || !settings) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  // Vista modifica / aggiunta giorno
  if (selectedDate) {
    const selectedDay = days.find((d) => d.date === selectedDate) ?? null;
    const isNew = !selectedDay;
    return (
      <div className="animate-fade-in">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/6 bg-[#0a0a0f]/80 px-4 py-4 pt-[max(env(safe-area-inset-top),1rem)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDate(null)}
              className="rounded-xl p-1.5 transition hover:bg-white/8"
            >
              <ChevronLeft className="h-5 w-5 text-zinc-400" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white capitalize">
                {format(parseISO(selectedDate), "EEEE d MMMM yyyy", { locale: it })}
              </h1>
              {isNew && (
                <p className="text-xs text-indigo-400 mt-0.5">Nuova giornata</p>
              )}
            </div>
          </div>
          {!isNew && (
            <button
              onClick={() => setConfirmDelete(selectedDate)}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Elimina
            </button>
          )}
        </header>

        <DayForm
          date={selectedDate}
          initialDay={selectedDay}
          sports={sports}
          settings={settings}
          onSaved={async () => {
            await loadDays();
            setToast({ message: "Giornata salvata! ✓", type: "success" });
          }}
        />

        {/* Modale conferma eliminazione */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#13131a] p-6 animate-scale-in">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/20">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
              </div>
              <h3 className="text-center text-base font-bold text-white mb-1">
                Elimina giornata
              </h3>
              <p className="text-center text-sm text-zinc-400 mb-6">
                Sei sicuro? Questa azione non può essere annullata.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
                >
                  Annulla
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-400"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    );
  }

  // Lista raggruppata per mese
  const grouped = new Map<string, DayRecord[]>();
  for (const d of days) {
    const key = format(parseISO(d.date), "MMMM yyyy", { locale: it });
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(d);
  }

  return (
    <div className="animate-fade-in">
      <Header title="Cronologia" subtitle={`${days.length} giornate registrate`} />

      <div className="space-y-6 px-4 pt-3 pb-4">
        {/* Bottone aggiungi giorno passato */}
        <button
          onClick={() => setShowDatePicker(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-500/5 py-3.5 text-sm font-semibold text-indigo-400 transition hover:bg-indigo-500/10"
        >
          <Plus className="h-4 w-4" />
          Aggiungi giorno passato
        </button>

        {days.length === 0 && (
          <div className="rounded-2xl border border-white/8 bg-white/4 p-8 text-center">
            <p className="text-sm text-zinc-500">Nessuna giornata registrata ancora.</p>
            <p className="text-xs text-zinc-600 mt-1">Inizia dalla scheda Oggi!</p>
          </div>
        )}

        {Array.from(grouped.entries()).map(([month, monthDays]) => (
          <div key={month}>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-zinc-600 capitalize">
              {month}
            </h2>
            <div className="space-y-2">
              {monthDays.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDate(d.date)}
                  className="block w-full text-left rounded-2xl border border-white/8 bg-white/4 p-4 transition hover:border-indigo-500/30 hover:bg-white/6 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <span className="text-[9px] font-bold uppercase text-indigo-400">
                          {format(parseISO(d.date), "EEE", { locale: it })}
                        </span>
                        <span className="text-lg font-bold leading-tight text-indigo-300">
                          {format(parseISO(d.date), "d")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-zinc-300 leading-snug">
                          {d.description.slice(0, 55)}
                          {d.description.length > 55 ? "..." : ""}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-600">
                          <span className="flex items-center gap-1">
                            <Moon className="h-3 w-3" />
                            {d.sleepHours}h{d.sleepMinutes > 0 ? `${d.sleepMinutes}m` : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> {d.pagesRead} pag
                          </span>
                          {d.sport && (
                            <span className="text-indigo-500">{d.sport.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1 ml-2">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-white">{d.dayRating}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modale scegli data */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl border-t border-white/10 bg-[#13131a] p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/20">
                <Calendar className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-white">Aggiungi giorno passato</h3>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
              Seleziona la data
            </label>
            <input
              type="date"
              value={newDate}
              max={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDatePicker(false); setNewDate(""); }}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
              >
                Annulla
              </button>
              <button
                onClick={handleAddOldDay}
                disabled={!newDate}
                className="flex-1 rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 disabled:opacity-40"
              >
                Continua
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
