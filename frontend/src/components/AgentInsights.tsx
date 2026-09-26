import { useEffect, useState } from "react";
import { AlertTriangle, Sparkles, Gauge, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { InsightsResponse } from "../types";
import Avatar from "./Avatar";
import { status } from "../lib/colors";

const riskColor = { high: status.critical, medium: status.warning, low: status.good } as const;
const pressureColor = { critical: status.critical, watch: status.warning, healthy: status.good } as const;

export default function AgentInsights() {
  const [data, setData] = useState<InsightsResponse | null>(null);

  useEffect(() => {
    api.getInsights().then(setData);
  }, []);

  if (!data) return null;

  const criticalBench = data.benchPressure.filter((b) => b.pressure === "critical").slice(0, 3);

  return (
    <div className="px-8 pt-6">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-bold text-stone-900">What your agents found today</h2>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">Auto-generated</span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${status.critical}1a`, color: status.critical }}>
              <AlertTriangle size={14} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500">Flight risk watchlist</h3>
          </div>
          <div className="space-y-3">
            {data.flightRisks.slice(0, 3).map((r) => (
              <Link key={r.employeeId} to={`/talent?focus=${r.employeeId}`} className="block rounded-lg border border-stone-100 p-2.5 hover:border-stone-200 hover:bg-stone-50">
                <div className="flex items-center gap-2">
                  <Avatar name={r.name} color={r.avatarColor} size={26} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-stone-800">{r.name}</p>
                    <p className="truncate text-[11px] text-stone-400">{r.title}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase text-white"
                    style={{ backgroundColor: riskColor[r.riskLevel] }}
                  >
                    {r.riskLevel}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-stone-500">{r.reasons[0]}</p>
              </Link>
            ))}
            {data.flightRisks.length === 0 && <p className="text-xs text-stone-400">No elevated flight-risk signals right now.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Sparkles size={14} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500">Hidden gems</h3>
          </div>
          <div className="space-y-3">
            {data.hiddenGems.slice(0, 3).map((g) => (
              <Link key={g.employeeId} to={`/talent?focus=${g.employeeId}`} className="block rounded-lg border border-stone-100 p-2.5 hover:border-stone-200 hover:bg-stone-50">
                <div className="flex items-center gap-2">
                  <Avatar name={g.name} color={g.avatarColor} size={26} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-stone-800">{g.name}</p>
                    <p className="truncate text-[11px] text-stone-400">{g.title} · {g.department}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">{g.bestRoleScore}</span>
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-stone-500">Fits <strong className="text-stone-600">{g.bestRoleTitle}</strong> better than their current track.</p>
              </Link>
            ))}
            {data.hiddenGems.length === 0 && <p className="text-xs text-stone-400">No cross-department gems surfaced right now.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${status.warning}1a`, color: status.warning }}>
              <Gauge size={14} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500">Bench pressure</h3>
          </div>
          <div className="space-y-3">
            {criticalBench.map((b) => (
              <Link key={b.roleId} to={`/workforce-planner?roleId=${b.roleId}`} className="block rounded-lg border border-stone-100 p-2.5 hover:border-stone-200 hover:bg-stone-50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-stone-800">{b.roleTitle}</p>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase text-white" style={{ backgroundColor: pressureColor[b.pressure] }}>
                    {b.pressure}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-stone-500">
                  {b.readyCount} of {b.totalEmployees} ready · {b.reskillableCount} reskillable
                </p>
                <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-brand-600">
                  Plan headcount <ArrowRight size={10} />
                </p>
              </Link>
            ))}
            {criticalBench.length === 0 && <p className="text-xs text-stone-400">No roles under critical bench pressure right now.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
