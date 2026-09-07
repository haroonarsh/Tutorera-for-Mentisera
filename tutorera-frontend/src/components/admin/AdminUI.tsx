import type { ReactNode } from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

export function AdminMetricCard({ label, value, detail, icon, valueClassName = "text-slate-950 dark:text-white", loading = false }: {
  label: string;
  value: ReactNode;
  detail: string;
  icon: ReactNode;
  valueClassName?: string;
  loading?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-label={label}>
      <div className="mb-2 flex items-center justify-between gap-3 text-slate-600 dark:text-slate-300">
        <h2 className="text-xs font-bold uppercase tracking-wider">{label}</h2>
        <span aria-hidden="true">{icon}</span>
      </div>
      {loading ? <div className="h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" aria-label="Loading" /> : <p className={`text-2xl font-extrabold ${valueClassName}`}>{value}</p>}
      <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">{detail}</p>
    </section>
  );
}

export function AdminErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{message}</span>
      {onRetry && <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 font-semibold"><RefreshCw className="h-4 w-4" aria-hidden="true" />Retry</button>}
    </div>
  );
}

export function AdminEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <Inbox className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
      <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">{title}</h2>
      <p className="mx-auto mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
