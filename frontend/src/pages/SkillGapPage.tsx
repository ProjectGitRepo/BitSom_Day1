import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, GraduationCap } from "lucide-react";
import { api } from "../lib/api";
import type { SkillGapReport } from "../types";
import PageHeader from "../components/PageHeader";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import ScoreBar from "../components/ScoreBar";

export default function SkillGapPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [searchParams] = useSearchParams();
  const roleId = searchParams.get("roleId") ?? undefined;
  const [report, setReport] = useState<SkillGapReport | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    api.skillGap(employeeId, roleId).then((r) => setReport(r.report));
  }, [employeeId, roleId]);

  if (!report) return <div className="p-8 text-sm text-stone-400">Loading skill gap analysis…</div>;

  const { employee, role, score, tier, gaps, estimatedHoursToClose, estimatedWeeksToClose } = report;

  return (
    <div>
      <PageHeader
        eyebrow="Agent 3 · Skill Gap & Reskilling Path"
        title={`Closing the gap to ${role.title}`}
        action={
          <Link to="/talent" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50">
            <ArrowLeft size={14} /> Back to Talent 360
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 px-8 py-6 lg:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            <Avatar name={employee.name} color={employee.avatarColor} size={44} />
            <div>
              <p className="text-sm font-bold text-stone-900">{employee.name}</p>
              <p className="text-xs text-stone-500">{employee.title} · {employee.department}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-stone-400">
              <span>Match for {role.title}</span>
              <StatusBadge tier={tier as "ready" | "reskillable" | "gap"} />
            </div>
            <ScoreBar score={score} />
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-card">
          <div className="flex items-center gap-2 text-stone-500">
            <Clock size={16} />
            <p className="text-xs font-medium uppercase tracking-wide">Estimated time to close gap</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-stone-900">{estimatedWeeksToClose} <span className="text-base font-medium text-stone-400">weeks</span></p>
          <p className="mt-1 text-xs text-stone-400">≈ {estimatedHoursToClose} learning hours across {gaps.length} skill{gaps.length === 1 ? "" : "s"}</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-card">
          <div className="flex items-center gap-2 text-stone-500">
            <GraduationCap size={16} />
            <p className="text-xs font-medium uppercase tracking-wide">Reskilling profile</p>
          </div>
          <div className="mt-3 space-y-1 text-xs text-stone-600">
            <p>Open to reskilling: <strong>{employee.interestedInReskilling ? "Yes" : "No"}</strong></p>
            <p>Mobility: <strong className="capitalize">{employee.mobility}</strong></p>
            <p>Tenure: <strong>{employee.tenureYears} years</strong></p>
          </div>
        </div>
      </div>

      <div className="px-8 pb-8">
        <div className="rounded-xl border border-stone-200 bg-white shadow-card">
          <div className="border-b border-stone-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-stone-800">Skill-by-skill gap</h2>
            <p className="mt-0.5 text-xs text-stone-400">Where {employee.name.split(" ")[0]} stands today versus what {role.title} requires.</p>
          </div>

          {gaps.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-stone-400">No gap — every required skill is already met at the target level.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {gaps.map((g) => (
                <div key={g.skill} className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-[240px_1fr]">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{g.skill}</p>
                    <p className="mt-1 text-xs text-stone-400">Level {g.currentLevel} of {g.requiredLevel} required</p>
                    <div className="mt-2 flex h-1.5 gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className="flex-1 rounded-full"
                          style={{ backgroundColor: i < g.currentLevel ? "#2a78d6" : i < g.requiredLevel ? "#fab219" : "#e2e8f0" }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {g.recommendedCourses.length === 0 && <span className="text-xs text-stone-400">No matching course in catalog yet.</span>}
                    {g.recommendedCourses.map((c) => (
                      <div key={c.title} className="rounded-lg border border-stone-100 bg-stone-50/60 px-3 py-2 text-xs">
                        <p className="font-medium text-stone-700">{c.title}</p>
                        <p className="text-stone-400">{c.provider} · {c.hours}h</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
