import type { EvidenceSnippet } from "../types";

type MatchedSkill = { name: string; level: number; minLevel: number; confidence: number };
type MissingSkill = { name: string; minLevel: number };
type AdjacentSkill = { requiredSkill: string; viaSkill: string; confidence: number };

export function SkillFitContent({
  matchedSkills,
  missingSkills,
  adjacentSkills
}: {
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  adjacentSkills: AdjacentSkill[];
}) {
  const bridged = new Set(adjacentSkills.map((a) => a.requiredSkill));
  const trueGaps = missingSkills.filter((m) => !bridged.has(m.name));

  return (
    <div>
      <p className="mb-1.5 font-semibold text-stone-800">Skill fit</p>
      <p className="mb-2.5 text-stone-500">
        Share of required skills confirmed at the level this role needs, weighted by how confident the engine is in
        each one (source + recency).
      </p>
      <div className="space-y-1.5">
        {matchedSkills.map((s) => (
          <div key={s.name} className="flex items-center justify-between gap-2">
            <span className="text-emerald-700">✓ {s.name}</span>
            <span className="shrink-0 text-stone-400">
              {s.level}/{s.minLevel}+ · {Math.round(s.confidence * 100)}% conf.
            </span>
          </div>
        ))}
        {adjacentSkills.map((a) => (
          <div key={a.requiredSkill} className="flex items-center justify-between gap-2">
            <span className="text-amber-700">~ {a.requiredSkill}</span>
            <span className="shrink-0 text-stone-400">via {a.viaSkill}</span>
          </div>
        ))}
        {trueGaps.map((m) => (
          <div key={m.name} className="flex items-center justify-between gap-2">
            <span className="text-rose-600">✗ {m.name}</span>
            <span className="shrink-0 text-stone-400">not found</span>
          </div>
        ))}
        {matchedSkills.length === 0 && adjacentSkills.length === 0 && trueGaps.length === 0 && (
          <p className="text-stone-400">No required skills to evaluate.</p>
        )}
      </div>
    </div>
  );
}

export function EvidenceFitContent({ evidence }: { evidence: EvidenceSnippet[] }) {
  return (
    <div>
      <p className="mb-1.5 font-semibold text-stone-800">Evidence fit</p>
      <p className="mb-2.5 text-stone-500">
        Free-text phrases found in resumes, project records, or manager feedback that match this role's real-world
        evidence bank — not just tagged skills.
      </p>
      {evidence.length === 0 && <p className="italic text-stone-400">No evidence phrases found beyond formal skill records.</p>}
      <div className="space-y-2">
        {evidence.slice(0, 6).map((e, i) => (
          <div key={i}>
            <p className="font-medium text-stone-700">"{e.phrase}"</p>
            <p className="text-[11px] text-stone-400">{e.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
