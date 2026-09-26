import type { Employee, EvidenceSnippet, MatchResult, Role } from "../types.js";
import { computeSkillConfidence } from "./confidence.js";
import { canonicalName, getAdjacentSkillNames } from "./skillsRepository.js";

const READY_THRESHOLD = 72;
const RESKILL_THRESHOLD = 40;

function excerptAround(text: string, phrase: string, pad = 40): string {
  const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx === -1) return text.slice(0, 120);
  const start = Math.max(0, idx - pad);
  const end = Math.min(text.length, idx + phrase.length + pad);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

function findEvidence(employee: Employee, keywords: string[]): EvidenceSnippet[] {
  const snippets: EvidenceSnippet[] = [];
  const seenPhrases = new Set<string>();

  const scan = (text: string, field: EvidenceSnippet["field"], label: string) => {
    const lower = text.toLowerCase();
    for (const phrase of keywords) {
      const key = `${field}:${label}:${phrase}`;
      if (seenPhrases.has(key)) continue;
      if (lower.includes(phrase.toLowerCase())) {
        snippets.push({ field, label, phrase, excerpt: excerptAround(text, phrase) });
        seenPhrases.add(key);
      }
    }
  };

  scan(employee.resumeSummary, "resumeSummary", "Resume summary");
  employee.projects.forEach((proj) => scan(proj.description, "project", proj.name));
  employee.managerFeedback.forEach((fb) => scan(fb.comments, "managerFeedback", `Manager feedback (${fb.cycle})`));

  return snippets;
}

function buildRationale(
  employee: Employee,
  role: Role,
  fullyMetCount: number,
  totalRequired: number,
  evidence: EvidenceSnippet[],
  tier: MatchResult["tier"],
  adjacentSkills: MatchResult["adjacentSkills"]
): string {
  const firstName = employee.name.split(" ")[0];
  const tierPhrase =
    tier === "ready" ? "a strong, ready-now match" : tier === "reskillable" ? "a promising reskilling candidate" : "currently a stretch match";

  let sentence =
    totalRequired > 0
      ? `${firstName} is ${tierPhrase} for ${role.title} — ${fullyMetCount} of ${totalRequired} required skills confirmed at level`
      : `${firstName} is ${tierPhrase} for "${role.title}"`;

  if (evidence.length > 0) {
    const fields = new Set(evidence.map((e) => (e.field === "project" ? "project records" : e.field === "managerFeedback" ? "manager feedback" : "resume")));
    sentence += `, backed by ${evidence.length} independent evidence match${evidence.length > 1 ? "es" : ""} across ${[...fields].join(" and ")}`;
  } else {
    sentence += ", though no independent project or feedback evidence was found beyond formal skill records";
  }

  if (adjacentSkills.length > 0) {
    const via = [...new Set(adjacentSkills.map((a) => a.viaSkill))];
    sentence += `. Doesn't directly hold ${adjacentSkills.length === 1 ? adjacentSkills[0].requiredSkill : `${adjacentSkills.length} required skills`}, but shows adjacent capability via ${via.join(", ")}`;
  }

  const recentProject = employee.projects.find((p) => p.year >= new Date().getFullYear() - 1);
  if (recentProject) {
    sentence += `. Most recent supporting evidence: "${recentProject.name}" (${recentProject.year})`;
  }

  return `${sentence}.`;
}

export function scoreEmployeeForRole(employee: Employee, role: Role): MatchResult {
  const matchedSkills: MatchResult["matchedSkills"] = [];
  const missingSkills: MatchResult["missingSkills"] = [];
  const adjacentSkills: MatchResult["adjacentSkills"] = [];
  let skillWeightTotal = 0;
  let skillWeightEarned = 0;
  let fullyMetCount = 0;

  for (const req of role.requiredSkills) {
    skillWeightTotal += req.weight;
    // Resolved through the skills repository so an alias like "ML" on an employee's
    // profile still matches a role requiring "Machine Learning".
    const reqCanonical = canonicalName(req.name).toLowerCase();
    const owned = employee.skills.find((s) => canonicalName(s.name).toLowerCase() === reqCanonical);

    if (!owned) {
      missingSkills.push({ name: req.name, minLevel: req.minLevel });

      // Knowledge-graph fallback: no exact skill, but the required skill's adjacent
      // capabilities (from the skills repository) might still be present — this is what
      // lets a Business Analyst with customer interviews + SQL + stakeholder management
      // register as a partial fit for "AI Product Manager" without ever having that title.
      let bestAdjacent: { name: string; confidence: number; level: number } | null = null;
      for (const adjName of getAdjacentSkillNames(req.name)) {
        const adjCanonical = canonicalName(adjName).toLowerCase();
        const adjOwned = employee.skills.find((s) => canonicalName(s.name).toLowerCase() === adjCanonical);
        if (!adjOwned) continue;
        const { confidence: adjConfidence } = computeSkillConfidence(adjOwned);
        if (!bestAdjacent || adjConfidence > bestAdjacent.confidence) {
          bestAdjacent = { name: adjName, confidence: adjConfidence, level: adjOwned.level };
        }
      }
      if (bestAdjacent) {
        const adjacencyCredit = req.weight * 0.4 * bestAdjacent.confidence * Math.min(1, bestAdjacent.level / req.minLevel);
        skillWeightEarned += adjacencyCredit;
        adjacentSkills.push({ requiredSkill: req.name, viaSkill: bestAdjacent.name, confidence: bestAdjacent.confidence });
      }
      continue;
    }

    // Stale, unverified evidence counts for less than a recently confirmed skill — but it
    // tempers the score rather than flipping a real, sufficient-level skill into a miss.
    const { confidence } = computeSkillConfidence(owned);

    matchedSkills.push({ name: req.name, level: owned.level, minLevel: req.minLevel, confidence });

    if (owned.level >= req.minLevel) {
      fullyMetCount += 1;
      // A skill that clears the bar is still credited near-fully even on weak evidence —
      // confidence is a visible signal (badges, tooltips, rationale) more than a scoring cliff.
      skillWeightEarned += req.weight * (0.85 + 0.15 * confidence);
    } else {
      skillWeightEarned += req.weight * (owned.level / req.minLevel) * 0.5 * confidence;
      missingSkills.push({ name: req.name, minLevel: req.minLevel });
    }
  }

  const skillScore = skillWeightTotal > 0 ? Math.min(100, (skillWeightEarned / skillWeightTotal) * 100) : 0;

  const evidence = findEvidence(employee, role.evidenceKeywords);
  const evidenceScore = Math.min(100, evidence.length * 16);

  const score = Math.round(skillScore * 0.65 + evidenceScore * 0.35);

  let tier: MatchResult["tier"] = "gap";
  if (score >= READY_THRESHOLD) tier = "ready";
  else if (score >= RESKILL_THRESHOLD) tier = "reskillable";

  const rationale = buildRationale(employee, role, fullyMetCount, role.requiredSkills.length, evidence, tier, adjacentSkills);

  return {
    employee,
    score,
    skillScore: Math.round(skillScore),
    evidenceScore: Math.round(evidenceScore),
    matchedSkills,
    missingSkills,
    adjacentSkills,
    evidence,
    tier,
    rationale
  };
}

export function rankEmployeesForRole(employees: Employee[], role: Role): MatchResult[] {
  return employees.map((e) => scoreEmployeeForRole(e, role)).sort((a, b) => b.score - a.score);
}

export { READY_THRESHOLD, RESKILL_THRESHOLD };
