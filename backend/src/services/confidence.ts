import type { SkillConfidence, SkillEntry } from "../types.js";

// How much a single source of evidence can be trusted, before recency/triangulation.
// A certification or manager sign-off outweighs an unverified self-reported claim.
const SOURCE_TRUST: Record<string, number> = {
  certification: 0.85,
  manager: 0.8,
  project: 0.75,
  lms: 0.65,
  self: 0.45
};

export const EVIDENCE_TYPES: { key: string; label: string }[] = [
  { key: "self", label: "Resume / self-reported" },
  { key: "project", label: "Project history" },
  { key: "certification", label: "Certification" },
  { key: "manager", label: "Manager validation" },
  { key: "lms", label: "Learning completion" }
];

function monthsBetween(fromISO: string, toDate: Date): number {
  const from = new Date(fromISO);
  return Math.max(0, (toDate.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

// Evidence decays the longer it goes unverified by a fresh sync — a resume claim from
// three years ago is worth less than one confirmed by last quarter's project record.
function recencyDecay(monthsSinceVerified: number): number {
  if (monthsSinceVerified <= 6) return 1;
  if (monthsSinceVerified <= 18) return 0.9;
  if (monthsSinceVerified <= 36) return 0.72;
  return 0.55;
}

/**
 * Triangulated confidence: a claim backed by one weak source is not the same as one
 * corroborated by several independent systems. "Employee says I know Python" is not
 * "employee has delivered three Python projects and holds a certification" — each
 * additional distinct source nudges confidence up, on top of the strongest single source.
 */
export function computeSkillConfidence(skill: Pick<SkillEntry, "source" | "lastVerifiedAt">, now: Date = new Date()): SkillConfidence {
  const distinctSources = [...new Set(skill.source)];
  const bestSourceTrust = Math.max(...distinctSources.map((s) => SOURCE_TRUST[s] ?? 0.4));
  const triangulationBonus = Math.min(0.15, 0.05 * (distinctSources.length - 1));
  const baseConfidence = Math.min(0.98, bestSourceTrust + triangulationBonus);

  const monthsSinceVerified = monthsBetween(skill.lastVerifiedAt, now);
  const decay = recencyDecay(monthsSinceVerified);
  const confidence = Math.round(baseConfidence * decay * 100) / 100;

  const freshness: SkillConfidence["freshness"] = monthsSinceVerified <= 6 ? "fresh" : monthsSinceVerified <= 18 ? "aging" : "stale";
  const tier: SkillConfidence["tier"] = confidence >= 0.72 ? "high" : confidence >= 0.5 ? "medium" : "low";

  const evidence = EVIDENCE_TYPES.map((t) => ({ ...t, present: distinctSources.includes(t.key) }));

  return { confidence, tier, freshness, monthsSinceVerified: Math.round(monthsSinceVerified), evidence };
}
