import { useEffect, useState, type DragEvent, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts";
import {
  CheckCircle2,
  GraduationCap,
  UserPlus,
  DollarSign,
  Clock,
  SlidersHorizontal,
  TrendingUp,
  Scale,
  GitCompareArrows,
  Plus,
  X
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import type { PoolCompositionCheck, RoiAssumptions, RoleSummary, WorkforceCandidate, WorkforcePlanResponse } from "../types";
import PageHeader from "../components/PageHeader";
import Avatar from "../components/Avatar";
import ScoreBar from "../components/ScoreBar";
import InfoHint from "../components/InfoHint";
import { SkillFitContent } from "../components/ScoreExplain";
import StatusBadge from "../components/StatusBadge";
import { status, ink, sequentialBlue } from "../lib/colors";

const MAX_COMPARE = 3;

const currency = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export default function WorkforcePlanner() {
  const [searchParams] = useSearchParams();
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [roleId, setRoleId] = useState("");
  const [headcount, setHeadcount] = useState(20);
  const [plan, setPlan] = useState<WorkforcePlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [assumptions, setAssumptions] = useState<RoiAssumptions | null>(null);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    api.listRoles().then((r) => {
      setRoles(r.roles);
      const fromUrl = searchParams.get("roleId");
      if (fromUrl && r.roles.some((x) => x.id === fromUrl)) {
        setRoleId(fromUrl);
      } else if (r.roles.length) {
        setRoleId(r.roles.find((x) => x.id === "role-ai-eng")?.id ?? r.roles[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runPlan = async (rId: string, hc: number, overrideAssumptions?: RoiAssumptions) => {
    if (!rId || hc < 1) return;
    setLoading(true);
    try {
      const res = await api.workforcePlan(rId, hc, overrideAssumptions ?? assumptions ?? undefined);
      setPlan(res);
      setAssumptions(res.roi.assumptions);
      if (plan?.role.id !== rId) setCompareIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleId) runPlan(roleId, headcount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  const allCandidates: WorkforceCandidate[] = plan ? [...plan.readyPool, ...plan.reskillPool] : [];
  const addCompare = (id: string) => setCompareIds((prev) => (prev.includes(id) || prev.length >= MAX_COMPARE ? prev : [...prev, id]));
  const removeCompare = (id: string) => setCompareIds((prev) => prev.filter((x) => x !== id));

  const chartData = plan
    ? [
        { name: "Ready now", value: plan.allocation.readyUsed, fill: status.good },
        { name: "Reskillable", value: plan.allocation.reskillUsed, fill: status.warning },
        { name: "Hire externally", value: plan.allocation.hireExternally, fill: status.critical }
      ]
    : [];

  return (
    <div>
      <PageHeader
        eyebrow="Agent 3 · Hybrid Workforce Planner"
        title="Build to a headcount, the hybrid way"
        description="Ask for a number on any role. See who already qualifies, who can realistically be reskilled, and only what's left to hire externally."
      />

      <div className="flex flex-wrap items-end gap-3 border-b border-stone-200 bg-white px-8 py-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">Role</label>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 outline-none focus:border-brand-400"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">Headcount needed</label>
          <input
            type="number"
            min={1}
            value={headcount}
            onChange={(e) => setHeadcount(Number(e.target.value))}
            className="w-28 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          />
        </div>
        <button
          onClick={() => runPlan(roleId, headcount)}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Build plan
        </button>
        <p className="ml-2 text-xs text-stone-400">e.g. "I need {headcount} {roles.find((r) => r.id === roleId)?.title ?? "..."}"</p>
      </div>

      <div className="px-8 py-6">
        {loading && <p className="text-sm text-stone-400">Building hybrid plan…</p>}
        {!loading && plan && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatTile icon={CheckCircle2} color={status.good} label="Ready now" value={plan.allocation.readyUsed} hint={`${plan.readyPool.length} total qualify`} />
              <StatTile icon={GraduationCap} color={status.warning} label="Reskill internally" value={plan.allocation.reskillUsed} hint={`${plan.reskillPool.length} viable candidates`} />
              <StatTile icon={UserPlus} color={status.critical} label="Hire externally" value={plan.allocation.hireExternally} hint={`${plan.gapPoolSize} employees not a fit`} />
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-card">
              <h2 className="mb-4 text-sm font-semibold text-stone-800">
                How {plan.headcountNeeded} {plan.role.title} openings get filled
              </h2>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid horizontal={false} stroke={ink.grid} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: ink.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: ink.secondary, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${ink.grid}`, fontSize: 12 }} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                    <LabelList dataKey="value" position="right" style={{ fontSize: 12, fontWeight: 700, fill: ink.primary }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <RoiPanel
              plan={plan}
              assumptions={assumptions}
              showAssumptions={showAssumptions}
              onToggleAssumptions={() => setShowAssumptions((v) => !v)}
              onChangeAssumptions={(next) => {
                setAssumptions(next);
                runPlan(roleId, headcount, next);
              }}
            />

            <PoolCompositionPanel check={plan.poolComposition} />

            <ComparePanel
              candidates={compareIds.map((id) => allCandidates.find((c) => c.employeeId === id)).filter((c): c is WorkforceCandidate => Boolean(c))}
              onDrop={addCompare}
              onRemove={removeCompare}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <PoolList
                title="Ready now"
                tone="good"
                candidates={plan.readyPool}
                roleId={plan.role.id}
                compareIds={compareIds}
                onAddCompare={addCompare}
              />
              <PoolList
                title="Reskilling candidates"
                tone="warning"
                candidates={plan.reskillPool}
                roleId={plan.role.id}
                showGapLink
                compareIds={compareIds}
                onAddCompare={addCompare}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, color, label, value, hint }: { icon: typeof CheckCircle2; color: string; label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}1a`, color }}>
          <Icon size={16} />
        </div>
        <p className="text-sm font-medium text-stone-500">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-stone-900">{value}</p>
      <p className="mt-1 text-xs text-stone-400">{hint}</p>
    </div>
  );
}

function RoiPanel({
  plan,
  assumptions,
  showAssumptions,
  onToggleAssumptions,
  onChangeAssumptions
}: {
  plan: WorkforcePlanResponse;
  assumptions: RoiAssumptions | null;
  showAssumptions: boolean;
  onToggleAssumptions: () => void;
  onChangeAssumptions: (next: RoiAssumptions) => void;
}) {
  const { roi } = plan;
  const costData = [
    { name: "All external hire", value: roi.baselineCost, fill: sequentialBlue },
    { name: "Hybrid plan", value: roi.hybridCost, fill: status.good }
  ];
  const timeIsWorse = roi.weeksSaved < 0;

  if (!assumptions) return null;

  const field = (key: keyof RoiAssumptions, label: string, prefix?: string) => (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-stone-500">{label}</span>
      <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5">
        {prefix && <span className="text-stone-400">{prefix}</span>}
        <input
          type="number"
          value={assumptions[key]}
          onChange={(e) => onChangeAssumptions({ ...assumptions, [key]: Number(e.target.value) })}
          className="w-full bg-transparent text-stone-700 outline-none"
        />
      </div>
    </label>
  );

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-stone-800">Cost &amp; time impact of going hybrid</h2>
          <p className="mt-0.5 text-xs text-stone-400">Versus filling every seat externally, using industry-benchmarked cost assumptions.</p>
        </div>
        <button
          onClick={onToggleAssumptions}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
        >
          <SlidersHorizontal size={13} /> Assumptions
        </button>
      </div>

      {showAssumptions && (
        <div className="mb-5 grid grid-cols-2 gap-3 rounded-lg bg-stone-50 p-4 md:grid-cols-4">
          {field("costPerExternalHire", "Cost per external hire", "$")}
          {field("costPerLearningHour", "Cost per learning hour", "$")}
          {field("costPerInternalMove", "Cost per internal move", "$")}
          {field("avgExternalTimeToFillWeeks", "Avg. external time-to-fill (weeks)")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto_auto]">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={costData} layout="vertical" margin={{ left: 8, right: 48 }}>
            <CartesianGrid horizontal={false} stroke={ink.grid} />
            <XAxis type="number" tick={{ fontSize: 11, fill: ink.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: ink.secondary, fontWeight: 500 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => currency(v)} contentStyle={{ borderRadius: 8, border: `1px solid ${ink.grid}`, fontSize: 12 }} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {costData.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
              <LabelList dataKey="value" position="right" formatter={(v: number) => currency(v)} style={{ fontSize: 12, fontWeight: 700, fill: ink.primary }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="flex flex-col justify-center gap-1 border-t border-stone-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <DollarSign size={16} />
            <span className="text-xl font-bold tabular-nums">{currency(roi.dollarsSaved)}</span>
          </div>
          <p className="text-xs text-stone-400">saved ({roi.pctSaved}% vs. all-external)</p>
        </div>

        <div className="flex flex-col justify-center gap-1 border-t border-stone-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className={`flex items-center gap-1.5 ${timeIsWorse ? "text-amber-600" : "text-emerald-600"}`}>
            {timeIsWorse ? <TrendingUp size={16} /> : <Clock size={16} />}
            <span className="text-xl font-bold tabular-nums">{Math.abs(roi.weeksSaved)}<span className="text-sm font-medium"> wks</span></span>
          </div>
          <p className="text-xs text-stone-400">{timeIsWorse ? "slower — reskilling takes longer here" : "faster to fully staffed"}</p>
        </div>
      </div>
    </div>
  );
}

function PoolCompositionPanel({ check }: { check: PoolCompositionCheck }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-card">
      <div className="mb-1 flex items-center gap-2">
        <Scale size={16} className={check.hasSkew ? "text-amber-600" : "text-emerald-600"} />
        <h2 className="text-sm font-semibold text-stone-800">Pool composition check</h2>
        {check.hasSkew ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">Skew detected</span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">Balanced</span>
        )}
      </div>
      <p className="mb-4 text-xs text-stone-400">
        Does any department make up a share of this ready-plus-reskill pool well beyond its share of the org? A
        rule-based bias check, not a black-box score — every number here traces back to headcount, not a model output.
      </p>
      <div className="space-y-2.5">
        {check.departments.map((d) => (
          <div key={d.department} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-xs font-medium text-stone-600">{d.department}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-stone-300"
                style={{ width: `${Math.min(100, d.orgSharePct)}%` }}
                title={`${d.orgSharePct}% of the org`}
              />
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${d.flagged ? "bg-amber-500" : "bg-brand-500"}`}
                style={{ width: `${Math.min(100, d.poolSharePct)}%`, opacity: 0.85 }}
                title={`${d.poolSharePct}% of the pool`}
              />
            </div>
            <span className="w-32 shrink-0 text-right text-[11px] text-stone-400">
              {d.orgSharePct}% org → {d.poolSharePct}% pool
            </span>
            {d.flagged && <span className="shrink-0 text-[11px] font-semibold text-amber-600">2×+</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparePanel({
  candidates,
  onDrop,
  onRemove
}: {
  candidates: WorkforceCandidate[];
  onDrop: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const slots = [0, 1, 2];

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const id = e.dataTransfer.getData("text/plain");
    if (id) onDrop(id);
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-card">
      <div className="mb-1 flex items-center gap-2">
        <GitCompareArrows size={16} className="text-brand-600" />
        <h2 className="text-sm font-semibold text-stone-800">Compare candidates</h2>
        <span className="ml-auto text-xs text-stone-400">{candidates.length}/{MAX_COMPARE}</span>
      </div>
      <p className="mb-4 text-xs text-stone-400">
        Drag up to {MAX_COMPARE} candidates from either pool below into a slot — or use each candidate's{" "}
        <Plus size={11} className="inline -mt-0.5" /> button — to compare them field by field on one screen.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`grid grid-cols-1 gap-3 rounded-lg border-2 border-dashed p-3 sm:grid-cols-3 ${
          dragOver ? "border-brand-400 bg-brand-50/40" : "border-stone-200"
        }`}
      >
        {slots.map((i) => {
          const c = candidates[i];
          if (!c) {
            return (
              <div key={i} className="flex h-16 items-center justify-center rounded-lg border border-stone-100 bg-stone-50/60 text-xs text-stone-400">
                Drop a candidate here
              </div>
            );
          }
          return (
            <div key={c.employeeId} className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50/40 px-3 py-2.5">
              <Avatar name={c.name} color={c.avatarColor} size={28} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-stone-800">{c.name}</p>
                <p className="truncate text-[11px] text-stone-400">{c.title}</p>
              </div>
              <button onClick={() => onRemove(c.employeeId)} className="shrink-0 rounded-md p-1 text-stone-400 hover:bg-white hover:text-rose-600">
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {candidates.length > 0 && <ComparisonTable candidates={candidates} />}
    </div>
  );
}

function ComparisonTable({ candidates }: { candidates: WorkforceCandidate[] }) {
  const rows: { label: string; render: (c: WorkforceCandidate) => ReactNode }[] = [
    { label: "Tier", render: (c) => <StatusBadge tier={c.tier} /> },
    { label: "Overall score", render: (c) => <ScoreBar score={c.score} /> },
    {
      label: "Skill fit",
      render: (c) => (
        <span className="inline-flex items-center gap-1">
          <strong className="text-stone-700">{c.skillScore}</strong>
          <InfoHint>
            <SkillFitContent matchedSkills={c.matchedSkills} missingSkills={c.missingSkills} adjacentSkills={c.adjacentSkills} />
          </InfoHint>
        </span>
      )
    },
    { label: "Evidence fit", render: (c) => <strong className="text-stone-700">{c.evidenceScore}</strong> },
    { label: "Mobility", render: (c) => <span className="capitalize text-stone-600">{c.mobility}</span> },
    { label: "Open to reskilling", render: (c) => (c.interestedInReskilling ? "Yes" : "No") },
    {
      label: "Missing skills",
      render: (c) =>
        c.missingSkills.length === 0 ? (
          <span className="text-emerald-600">None</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {c.missingSkills.slice(0, 4).map((s) => (
              <span key={s.name} className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium text-stone-500">{s.name}</span>
            ))}
          </div>
        )
    },
    {
      label: "Time to close gap",
      render: (c) => (c.estimatedWeeksToClose !== undefined ? `~${c.estimatedWeeksToClose} wks` : "—")
    }
  ];

  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="w-36 border-b border-stone-200 pb-2 text-left font-semibold text-stone-400"> </th>
            {candidates.map((c) => (
              <th key={c.employeeId} className="border-b border-stone-200 px-3 pb-2 text-left">
                <div className="flex items-center gap-2">
                  <Avatar name={c.name} color={c.avatarColor} size={24} />
                  <span className="font-semibold text-stone-800">{c.name.split(" ")[0]}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-stone-100 last:border-0">
              <td className="py-2.5 pr-3 font-medium text-stone-500">{row.label}</td>
              {candidates.map((c) => (
                <td key={c.employeeId} className="px-3 py-2.5 align-top">
                  {row.render(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PoolList({
  title,
  tone,
  candidates,
  roleId,
  showGapLink,
  compareIds,
  onAddCompare
}: {
  title: string;
  tone: "good" | "warning";
  candidates: WorkforcePlanResponse["readyPool"];
  roleId: string;
  showGapLink?: boolean;
  compareIds: string[];
  onAddCompare: (id: string) => void;
}) {
  const dot = tone === "good" ? status.good : status.warning;
  const isFull = compareIds.length >= MAX_COMPARE;
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dot }} />
        <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
        <span className="ml-auto text-xs text-stone-400">{candidates.length}</span>
      </div>
      <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
        {candidates.length === 0 && <p className="py-6 text-center text-xs text-stone-400">No candidates in this pool.</p>}
        {candidates.map((c) => {
          const selected = compareIds.includes(c.employeeId);
          return (
            <div
              key={c.employeeId}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", c.employeeId)}
              className={`cursor-grab rounded-lg border px-3 py-2.5 active:cursor-grabbing ${
                selected ? "border-brand-300 bg-brand-50/50" : "border-stone-100"
              }`}
              title="Drag into Compare candidates, or use the + button"
            >
              <div className="flex items-center gap-2.5">
                <Avatar name={c.name} color={c.avatarColor} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-stone-800">{c.name}</p>
                  <p className="truncate text-[11px] text-stone-400">{c.title} · {c.department}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddCompare(c.employeeId);
                  }}
                  disabled={selected || isFull}
                  title={selected ? "Already comparing" : isFull ? "Comparison full (3/3)" : "Add to compare"}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                    selected
                      ? "border-brand-300 bg-brand-100 text-brand-700"
                      : "border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-40"
                  }`}
                >
                  <Plus size={13} />
                </button>
                {showGapLink && (
                  <Link
                    to={`/talent/${c.employeeId}/skill-gap?roleId=${roleId}`}
                    className="shrink-0 whitespace-nowrap rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    View gap
                  </Link>
                )}
              </div>
              <div className="mt-2">
                <ScoreBar score={c.score} />
              </div>
              {c.estimatedWeeksToClose !== undefined && (
                <p className="mt-1 text-[10px] font-medium text-amber-700">~{c.estimatedWeeksToClose} weeks to close the gap</p>
              )}
              {c.missingSkills.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {c.missingSkills.slice(0, 3).map((s) => (
                    <span key={s.name} className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium text-stone-500">{s.name}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
