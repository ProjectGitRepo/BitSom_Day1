import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users, Building2, Briefcase, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { DashboardSummary } from "../types";
import PageHeader from "../components/PageHeader";
import AgentInsights from "../components/AgentInsights";
import NextActions from "../components/NextActions";
import { status, sequentialBlue, ink } from "../lib/colors";

function KpiCard({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-stone-900">{value}</p>
      <p className="mt-1 text-xs text-stone-400">{hint}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.dashboardSummary().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="p-8 text-sm text-rose-600">Failed to load dashboard: {error}</div>;
  if (!data) return <div className="p-8 text-sm text-stone-400">Loading overview…</div>;

  return (
    <div>
      <PageHeader
        eyebrow="HR Overview"
        title="Internal talent, at a glance"
        description="A single view across employee profiles, resumes, certifications, project records, manager feedback, and LMS history."
      />

      <NextActions />

      <AgentInsights />

      <div className="grid grid-cols-1 gap-8 px-8 py-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard icon={Users} label="Employees indexed" value={data.totalEmployees} hint="Across all departments" />
            <KpiCard icon={Building2} label="Departments" value={data.totalDepartments} hint="Fragmented systems unified" />
            <KpiCard icon={Briefcase} label="Roles tracked" value={data.totalRoles} hint="Evidence-based role models" />
            <KpiCard icon={GraduationCap} label="Reskilling-ready" value={data.reskillReadyEmployees} hint="Open to internal mobility" />
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-card">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-800">Internal coverage by role</h2>
              <div className="flex items-center gap-4 text-xs text-stone-500">
                <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: status.good }} />Ready now</span>
                <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: status.warning }} />Reskillable</span>
              </div>
            </div>
            <p className="mb-4 text-xs text-stone-400">How many people already qualify for each role, versus how many could be reskilled into it.</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.roleCoverage.map((r) => ({ role: r.roleTitle, Ready: r.ready, Reskillable: r.reskillable }))} barGap={2} margin={{ left: -12 }}>
                <CartesianGrid vertical={false} stroke={ink.grid} />
                <XAxis dataKey="role" tick={{ fontSize: 11, fill: ink.muted }} axisLine={{ stroke: ink.baseline }} tickLine={false} interval={0} angle={-18} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: ink.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: `1px solid ${ink.grid}`, fontSize: 12 }}
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                />
                <Legend wrapperStyle={{ display: "none" }} />
                <Bar dataKey="Ready" name="Ready now" fill={status.good} radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar dataKey="Reskillable" name="Reskillable" fill={status.warning} radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-card">
            <h2 className="mb-1 text-sm font-semibold text-stone-800">Most common skills in the org</h2>
            <p className="mb-4 text-xs text-stone-400">From verified profiles, certifications, and project evidence.</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.topSkills} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid horizontal={false} stroke={ink.grid} />
                <XAxis type="number" tick={{ fontSize: 11, fill: ink.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: ink.secondary }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${ink.grid}`, fontSize: 12 }} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="count" name="Employees" fill={sequentialBlue} radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-6">
            <h2 className="text-sm font-semibold text-brand-800">Try the hybrid workforce planner</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-brand-700">
              Ask for headcount on any role — e.g. "50 AI Engineers" — and see exactly how many are ready today, how many can be
              reskilled, and how many you actually need to hire.
            </p>
            <Link to="/workforce-planner" className="mt-3 inline-block rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700">
              Open Workforce Planner →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
