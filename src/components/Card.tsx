import { ReactNode } from "react";
import clsx from "clsx";

export default function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-zinc-200 bg-surface p-4 shadow-sm dark:border-zinc-800 dark:bg-surface-dark",
        className
      )}
    >
      {children}
    </div>
  );
}
