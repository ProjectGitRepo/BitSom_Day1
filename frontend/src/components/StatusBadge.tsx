import { CheckCircle2, GraduationCap, UserPlus } from "lucide-react";

const config = {
  ready: { label: "Ready now", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", Icon: CheckCircle2 },
  reskillable: { label: "Reskillable", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", Icon: GraduationCap },
  gap: { label: "Hire externally", bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200", Icon: UserPlus }
} as const;

export default function StatusBadge({ tier }: { tier: "ready" | "reskillable" | "gap" }) {
  const { label, bg, text, ring, Icon } = config[tier];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${bg} ${text} ${ring}`}>
      <Icon size={13} strokeWidth={2.25} />
      {label}
    </span>
  );
}
