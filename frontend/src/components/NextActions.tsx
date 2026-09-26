import { useEffect, useState } from "react";
import { ListChecks, Heart, ArrowLeftRight, UserPlus, Info } from "lucide-react";
import { api } from "../lib/api";
import type { NextAction } from "../types";

const categoryConfig = {
  retention: { icon: Heart, bg: "bg-rose-50", text: "text-rose-600" },
  mobility: { icon: ArrowLeftRight, bg: "bg-violet-50", text: "text-violet-600" },
  hiring: { icon: UserPlus, bg: "bg-brand-50", text: "text-brand-600" },
  general: { icon: Info, bg: "bg-stone-100", text: "text-stone-500" }
} as const;

export default function NextActions() {
  const [actions, setActions] = useState<NextAction[] | null>(null);

  useEffect(() => {
    api.getNextActions().then((r) => setActions(r.actions));
  }, []);

  if (!actions) return null;

  return (
    <div className="px-8 pt-6">
      <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-5 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <ListChecks size={16} className="text-brand-600" />
          <h2 className="text-sm font-bold text-stone-900">Today's recommended actions</h2>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-400 ring-1 ring-stone-200">
            Rule-based synthesis
          </span>
        </div>
        <div className="space-y-2.5">
          {actions.map((a) => {
            const { icon: Icon, bg, text } = categoryConfig[a.category];
            return (
              <div key={a.priority} className="flex items-start gap-3 rounded-lg bg-white px-3.5 py-2.5">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${bg} ${text}`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-800">{a.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{a.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
