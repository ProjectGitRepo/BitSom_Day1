import { Router } from "express";
import { employees, roles } from "../data/index.js";
import { rankEmployeesForRole } from "../services/matching.js";
import { detectRoleFromQuery } from "../services/intent.js";
import type { Role } from "../types.js";

const router = Router();

router.get("/", (req, res) => {
  const { roleId, q, limit } = req.query as { roleId?: string; q?: string; limit?: string };

  if (!roleId && !q) {
    return res.status(400).json({ error: "Provide roleId and/or a free-text q parameter." });
  }

  let searchRole: Role;
  let detectedRole: { title: string; confidence: number } | null = null;
  const baseRole = roleId ? roles.find((r) => r.id === roleId) : undefined;
  if (roleId && !baseRole) {
    return res.status(404).json({ error: "Role not found" });
  }

  const extraPhrases = q
    ? q
        .split(/[,;]| and /i)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  if (baseRole) {
    searchRole = {
      ...baseRole,
      evidenceKeywords: [...new Set([...baseRole.evidenceKeywords, ...extraPhrases])]
    };
  } else {
    // No role explicitly picked — try to interpret the free-text ask against the role
    // catalog so a plain-English query still benefits from a role's full skill model.
    const detection = q ? detectRoleFromQuery(q, roles) : null;
    if (detection) {
      detectedRole = { title: detection.role.title, confidence: detection.confidence };
      searchRole = {
        ...detection.role,
        evidenceKeywords: [...new Set([...detection.role.evidenceKeywords, ...extraPhrases])]
      };
    } else {
      searchRole = {
        id: "ad-hoc-search",
        title: q ?? "Custom search",
        department: "Custom",
        requiredSkills: [],
        evidenceKeywords: extraPhrases,
        recommendedCourses: []
      };
    }
  }

  const ranked = rankEmployeesForRole(employees, searchRole);
  const max = Math.min(Number(limit) || 25, 95);
  const results = ranked.slice(0, max).map((r) => ({
    employeeId: r.employee.id,
    name: r.employee.name,
    title: r.employee.title,
    department: r.employee.department,
    avatarColor: r.employee.avatarColor,
    score: r.score,
    skillScore: r.skillScore,
    evidenceScore: r.evidenceScore,
    tier: r.tier,
    matchedSkills: r.matchedSkills,
    missingSkills: r.missingSkills,
    adjacentSkills: r.adjacentSkills,
    evidence: r.evidence,
    rationale: r.rationale
  }));

  res.json({
    searchedRole: { title: searchRole.title, requiredSkills: searchRole.requiredSkills, evidenceKeywords: searchRole.evidenceKeywords },
    detectedRole,
    totalCandidates: employees.length,
    matches: results
  });
});

export default router;
