import { useEffect, useState } from "react";
import { X, MapPin, Clock3, BadgeCheck, FolderKanban, MessageSquareQuote, GraduationCap, Compass, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Employee, RoleFit } from "../types";
import Avatar from "./Avatar";
import StatusBadge from "./StatusBadge";
import ScoreBar from "./ScoreBar";
import InfoHint from "./InfoHint";
import { SkillFitContent, EvidenceFitContent } from "./ScoreExplain";

const sourceLabels: Record<string, string> = {
  self: "Self-reported",
  manager: "Manager-confirmed",
  certification: "Certification",
  project: "Project record",
  lms: "LMS"
};

const freshnessConfig = {
  fresh: { label: "Fresh", bg: "bg-emerald-50", text: "text-emerald-700" },
  aging: { label: "Aging", bg: "bg-amber-50", text: "text-amber-700" },
  stale: { label: "Stale", bg: "bg-stone-100", text: "text-stone-500" }
} as const;

function FreshnessBadge({ freshness, confidence }: { freshness: "fresh" | "aging" | "stale"; confidence?: number }) {
  const { label, bg, text } = freshnessConfig[freshness];
  return (
    <span
      title={confidence !== undefined ? `${Math.round(confidence * 100)}% confidence — evidence-weighted, decays if not re-verified` : undefined}
      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${bg} ${text}`}
    >
      {label}
    </span>
  );
}

export default function EmployeeDetail({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [roleFits, setRoleFits] = useState<RoleFit[]>([]);

  useEffect(() => {
    setEmployee(null);
    api.getEmployee(employeeId).then(({ employee, roleFits }) => {
      setEmployee(employee);
      setRoleFits(roleFits);
    });
  }, [employeeId]);

  if (!employee) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-stone-400">Loading profile…</div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-stone-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <Avatar name={employee.name} color={employee.avatarColor} size={48} />
          <div>
            <h3 className="text-base font-bold text-stone-900">{employee.name}</h3>
            <p className="text-sm text-stone-500">{employee.title} · {employee.department}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-stone-400">
              <span className="inline-flex items-center gap-1"><MapPin size={12} />{employee.location}</span>
              <span className="inline-flex items-center gap-1"><Clock3 size={12} />{employee.tenureYears} yrs tenure</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <section>
          <p className="text-xs leading-relaxed text-stone-500">{employee.resumeSummary}</p>
        </section>

        <section>
          <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
            <BadgeCheck size={13} /> Skills mapping ({employee.skills.length})
          </h4>
          <div className="space-y-2">
            {[...employee.skills].sort((a, b) => b.level - a.level).map((skill) => (
              <div key={skill.name} className="rounded-lg border border-stone-100 bg-stone-50/60 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-700">{skill.name}</span>
                  <div className="flex items-center gap-1.5">
                    {skill.freshness && <FreshnessBadge freshness={skill.freshness} confidence={skill.confidence} />}
                    <span className="text-[10px] font-semibold tabular-nums text-stone-400">{skill.level}/5</span>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(skill.level / 5) * 100}%` }} />
                  </div>
                  <span className="whitespace-nowrap text-[10px] text-stone-400">{skill.source.map((s) => sourceLabels[s] ?? s).join(", ")}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {employee.certifications.length > 0 && (
          <section>
            <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-stone-400">Certifications</h4>
            <div className="space-y-1.5">
              {employee.certifications.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-700">{c.name}</span>
                  <span className="text-stone-400">{c.issuer} · {c.year}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
            <FolderKanban size={13} /> Project records
          </h4>
          <div className="space-y-2.5">
            {employee.projects.map((p) => (
              <div key={p.name} className="rounded-lg border border-stone-100 px-3 py-2">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                  <span>{p.name}</span>
                  <span className="font-normal text-stone-400">{p.year}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">{p.description}</p>
              </div>
            ))}
          </div>
        </section>

        {employee.pastRoles.length > 0 && (
          <section>
            <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-stone-400">Past roles</h4>
            <div className="space-y-1.5 border-l-2 border-stone-100 pl-3">
              {employee.pastRoles.map((r, i) => (
                <div key={i} className="text-xs">
                  <p className="font-medium text-stone-700">{r.title} <span className="font-normal text-stone-400">· {r.team}</span></p>
                  <p className="text-stone-400">{r.startYear} – {r.endYear}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {employee.managerFeedback.length > 0 && (
          <section>
            <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
              <MessageSquareQuote size={13} /> Manager feedback
            </h4>
            <div className="space-y-2">
              {employee.managerFeedback.map((f, i) => (
                <div key={i} className="rounded-lg bg-stone-50 px-3 py-2">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-stone-400">
                    <span>{f.cycle}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-stone-200">{f.rating}</span>
                  </div>
                  <p className="mt-1 text-xs italic leading-relaxed text-stone-600">"{f.comments}"</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {employee.lmsCompletions.length > 0 && (
          <section>
            <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
              <GraduationCap size={13} /> LMS completions
            </h4>
            <div className="space-y-1.5">
              {employee.lmsCompletions.map((l, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-700">{l.course}</span>
                  <span className="text-stone-400">{l.hours}h · {l.completedDate}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
            <Compass size={13} /> Best-fit roles (evidence-based)
          </h4>
          <div className="space-y-2">
            {roleFits.slice(0, 5).map((r) => (
              <Link
                key={r.roleId}
                to={`/talent/${employee.id}/skill-gap?roleId=${r.roleId}`}
                className="block rounded-lg border border-stone-100 px-3 py-2.5 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700">{r.roleTitle}</span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge tier={r.tier} />
                    <InfoHint align="right">
                      <div className="mb-2.5 flex gap-1.5 rounded-md bg-violet-50/60 p-2 text-violet-800">
                        <Sparkles size={12} className="mt-0.5 shrink-0 text-violet-500" />
                        <span>{r.rationale}</span>
                      </div>
                      <div className="mb-3 flex gap-4 text-[11px] text-stone-500">
                        <span>Skill fit: <strong className="text-stone-700">{r.skillScore}</strong></span>
                        <span>Evidence fit: <strong className="text-stone-700">{r.evidenceScore}</strong></span>
                      </div>
                      <div className="max-h-56 space-y-3 overflow-y-auto border-t border-stone-100 pt-2.5">
                        <SkillFitContent matchedSkills={r.matchedSkills} missingSkills={r.missingSkills} adjacentSkills={r.adjacentSkills} />
                        <EvidenceFitContent evidence={r.evidence} />
                      </div>
                    </InfoHint>
                  </div>
                </div>
                <ScoreBar score={r.score} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
