"use client";
import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import clsx from "clsx";

export type ToastType = "success" | "error";

export default function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={clsx(
      "fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-2xl animate-fade-in backdrop-blur-xl border max-w-[90vw]",
      type === "success" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : "bg-red-500/20 border-red-500/30 text-red-300"
    )}>
      {type === "success" ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <XCircle className="h-4 w-4 flex-shrink-0" />}
      <span className="truncate">{message}</span>
    </div>
  );
}
