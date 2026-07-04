"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import NumberInput from "@/components/NumberInput";
import Toast, { ToastType } from "@/components/Toast";
import { Sport, Settings } from "@/types";
import { Plus, Trash2, Pencil, Check, X, Download, Upload } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [newSport, setNewSport] = useState("");
  const [editingSport, setEditingSport] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadAll() {
    const [settingsRes, sportsRes] = await Promise.all([fetch("/api/settings"), fetch("/api/sports")]);
    setSettings((await settingsRes.json()).settings);
    setSports((await sportsRes.json()).sports ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function showToast(message: string, type: ToastType) { setToast({ message, type }); }

  async function updateSettings(patch: Partial<Settings>) {
    if (!settings) return;
    setSettings({ ...settings, ...patch });
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    setSaving(false);
    if (!res.ok) showToast("Errore durante il salvataggio", "error");
  }

  async function addSport() {
    if (!newSport.trim()) return;
    const res = await fetch("/api/sports", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newSport.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error ?? "Errore", "error"); return; }
    setSports((s) => [...s, data.sport]);
    setNewSport("");
  }

  async function saveEditSport() {
    if (!editingSport) return;
    const res = await fetch(`/api/sports/${editingSport.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingSport.name }),
    });
    if (res.ok) {
      setSports((s) => s.map((sp) => (sp.id === editingSport.id ? { ...sp, name: editingSport.name } : sp)));
      setEditingSport(null);
    } else showToast("Errore durante la modifica", "error");
  }

  async function deleteSport(id: string) {
    const res = await fetch(`/api/sports/${id}`, { method: "DELETE" });
    if (res.ok) setSports((s) => s.filter((sp) => sp.id !== id));
    else showToast("Errore durante l'eliminazione", "error");
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
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Errore durante l'importazione", "error"); return; }
      showToast(`Importate ${data.imported} giornate`, "success");
      await loadAll();
    } catch { showToast("File non valido", "error"); }
    finally { if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  if (loading || !settings) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full max-w-full overflow-x-hidden">
      <Header title="Impostazioni" />
      <div className="space-y-4 px-4 pt-2 min-w-0">
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4 space-y-3 min-w-0">
          <h2 className="text-sm font-semibold text-white">Obiettivi</h2>
          <NumberInput label="Ore di sonno target" value={settings.sleepTargetHours} onChange={(v) => v !== "" && updateSettings({ sleepTargetHours: Number(v) })} unit="h" step={0.5} />
          <NumberInput label="Pagine lette target" value={settings.pagesTarget} onChange={(v) => v !== "" && updateSettings({ pagesTarget: Number(v) })} unit="pag" />
          <NumberInput label="Minuti di studio target" value={settings.studyTargetMinutes} onChange={(v) => v !== "" && updateSettings({ studyTargetMinutes: Number(v) })} unit="min" />
          <NumberInput label="Minuti Instagram massimi" value={settings.instagramMaxMinutes} onChange={(v) => v !== "" && updateSettings({ instagramMaxMinutes: Number(v) })} unit="min" />
          <NumberInput label="Numero minimo parole descrizione" value={settings.minWords} onChange={(v) => v !== "" && updateSettings({ minWords: Number(v) })} unit="parole" />
          {saving && <p className="text-xs text-zinc-400">Salvataggio...</p>}
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/4 p-4 space-y-3 min-w-0">
          <h2 className="text-sm font-semibold text-white">Sport</h2>
          <div className="space-y-2">
            {sports.map((sport) => (
              <div key={sport.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/3 px-3 py-2 min-w-0">
                {editingSport?.id === sport.id ? (
                  <>
                    <input value={editingSport.name} onChange={(e) => setEditingSport({ id: sport.id, name: e.target.value })}
                      className="flex-1 min-w-0 rounded-lg border border-white/10 bg-transparent px-2 py-1 text-sm text-white outline-none focus:border-indigo-500/60" autoFocus />
                    <div className="flex flex-shrink-0 gap-1">
                      <button onClick={saveEditSport} className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/10"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingSport(null)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/10"><X className="h-4 w-4" /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-white truncate">{sport.name}</span>
                    <div className="flex flex-shrink-0 gap-1">
                      <button onClick={() => setEditingSport({ id: sport.id, name: sport.name })} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/10"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteSport(sport.id)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 min-w-0">
            <input value={newSport} onChange={(e) => setNewSport(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSport()}
              placeholder="Nuovo sport..." className="flex-1 min-w-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20" />
            <button onClick={addSport} className="flex-shrink-0 flex items-center justify-center rounded-xl bg-indigo-500 px-3 text-white"><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/4 p-4 space-y-3 min-w-0">
          <h2 className="text-sm font-semibold text-white">Backup e ripristino</h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleExport("json")} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"><Download className="h-4 w-4" /> JSON</button>
            <button onClick={() => handleExport("csv")} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"><Download className="h-4 w-4" /> CSV</button>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-white/5"><Upload className="h-4 w-4" /> Importa backup JSON</button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
          <p className="text-xs text-zinc-600 break-words">L'importazione aggiorna le giornate esistenti e aggiunge quelle mancanti, senza eliminare dati.</p>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
