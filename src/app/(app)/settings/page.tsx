"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import NumberInput from "@/components/NumberInput";
import Toast, { ToastType } from "@/components/Toast";
import { useTheme } from "@/components/ThemeProvider";
import { Sport, Settings } from "@/types";
import { Plus, Trash2, Pencil, Check, X, Download, Upload, Sun, Moon, Laptop } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [newSport, setNewSport] = useState("");
  const [editingSport, setEditingSport] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  async function loadAll() {
    const [settingsRes, sportsRes] = await Promise.all([
      fetch("/api/settings"),
      fetch("/api/sports"),
    ]);
    setSettings((await settingsRes.json()).settings);
    setSports((await sportsRes.json()).sports ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function showToast(message: string, type: ToastType) {
    setToast({ message, type });
  }

  async function updateSettings(patch: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (!res.ok) showToast("Errore durante il salvataggio", "error");
  }

  async function addSport() {
    if (!newSport.trim()) return;
    const res = await fetch("/api/sports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSport.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error ?? "Errore", "error");
      return;
    }
    setSports((s) => [...s, data.sport]);
    setNewSport("");
  }

  async function saveEditSport() {
    if (!editingSport) return;
    const res = await fetch(`/api/sports/${editingSport.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingSport.name }),
    });
    if (res.ok) {
      setSports((s) =>
        s.map((sp) => (sp.id === editingSport.id ? { ...sp, name: editingSport.name } : sp))
      );
      setEditingSport(null);
    } else {
      showToast("Errore durante la modifica", "error");
    }
  }

  async function deleteSport(id: string) {
    const res = await fetch(`/api/sports/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSports((s) => s.filter((sp) => sp.id !== id));
    } else {
      showToast("Errore durante l'eliminazione", "error");
    }
  }

  function handleExport(format: "json" | "csv") {
    window.location.href = `/api/export?format=${format}`;
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Errore durante l'importazione", "error");
        return;
      }
      showToast(`Importate ${data.imported} giornate`, "success");
      await loadAll();
    } catch {
      showToast("File non valido", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Header title="Impostazioni" />
      <div className="space-y-4 px-4 pt-2">
        {/* Tema */}
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Tema
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "light" as const, label: "Chiaro", icon: Sun },
              { value: "dark" as const, label: "Scuro", icon: Moon },
              { value: "system" as const, label: "Sistema", icon: Laptop },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition ${
                  theme === value
                    ? "border-accent bg-accent/5 text-accent dark:border-accent-dark dark:bg-accent-dark/10 dark:text-accent-dark"
                    : "border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </Card>

        {/* Obiettivi */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Obiettivi
          </h2>
          <NumberInput
            label="Ore di sonno target"
            value={settings.sleepTargetHours}
            onChange={(v) => v !== "" && updateSettings({ sleepTargetHours: Number(v) })}
            unit="h"
            step={0.5}
          />
          <NumberInput
            label="Pagine lette target"
            value={settings.pagesTarget}
            onChange={(v) => v !== "" && updateSettings({ pagesTarget: Number(v) })}
            unit="pag"
          />
          <NumberInput
            label="Minuti di studio target"
            value={settings.studyTargetMinutes}
            onChange={(v) => v !== "" && updateSettings({ studyTargetMinutes: Number(v) })}
            unit="min"
          />
          <NumberInput
            label="Minuti Instagram massimi"
            value={settings.instagramMaxMinutes}
            onChange={(v) => v !== "" && updateSettings({ instagramMaxMinutes: Number(v) })}
            unit="min"
          />
          <NumberInput
            label="Numero minimo parole descrizione"
            value={settings.minWords}
            onChange={(v) => v !== "" && updateSettings({ minWords: Number(v) })}
            unit="parole"
          />
          {saving && <p className="text-xs text-zinc-400">Salvataggio...</p>}
        </Card>

        {/* Sport personalizzati */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Sport
          </h2>
          <div className="space-y-2">
            {sports.map((sport) => (
              <div
                key={sport.id}
                className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50"
              >
                {editingSport?.id === sport.id ? (
                  <>
                    <input
                      value={editingSport.name}
                      onChange={(e) =>
                        setEditingSport({ id: sport.id, name: e.target.value })
                      }
                      className="flex-1 rounded-lg border border-zinc-200 bg-transparent px-2 py-1 text-sm outline-none focus:border-accent dark:border-zinc-700"
                      autoFocus
                    />
                    <div className="ml-2 flex gap-1">
                      <button onClick={saveEditSport} className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingSport(null)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-sm">{sport.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingSport({ id: sport.id, name: sport.name })}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteSport(sport.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newSport}
              onChange={(e) => setNewSport(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSport()}
              placeholder="Nuovo sport..."
              className="flex-1 rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-zinc-700"
            />
            <button
              onClick={addSport}
              className="flex items-center justify-center rounded-xl bg-accent px-3 text-white dark:bg-accent-dark dark:text-zinc-900"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </Card>

        {/* Backup */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Backup e ripristino
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleExport("json")}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <Download className="h-4 w-4" /> JSON
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Upload className="h-4 w-4" /> Importa backup JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            className="hidden"
          />
          <p className="text-xs text-zinc-400">
            L'importazione aggiorna le giornate esistenti e aggiunge quelle mancanti, senza eliminare dati.
          </p>
        </Card>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
