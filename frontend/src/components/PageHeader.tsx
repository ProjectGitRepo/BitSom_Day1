import type { ReactNode } from "react";

export default function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-stone-200 bg-white px-8 py-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold text-stone-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
