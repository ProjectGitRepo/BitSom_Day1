import type { Employee, LmsCourse, Role } from "../types.js";
import { scoreEmployeeForRole } from "./matching.js";

export interface SkillGapItem {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  recommendedCourses: { title: string; provider: string; hours: number }[];
}

export interface SkillGapReport {
  employee: Employee;
  role: Role;
  score: number;
  tier: string;
  gaps: SkillGapItem[];
  estimatedHoursToClose: number;
  estimatedWeeksToClose: number;
}

export function buildSkillGapReport(employee: Employee, role: Role, lmsCatalog: LmsCourse[]): SkillGapReport {
  const match = scoreEmployeeForRole(employee, role);

  const gaps: SkillGapItem[] = role.requiredSkills
    .map((req) => {
      const owned = employee.skills.find((s) => s.name.toLowerCase() === req.name.toLowerCase());
      const currentLevel = owned?.level ?? 0;
      const gap = Math.max(0, req.minLevel - currentLevel);
      if (gap === 0) return null;
      const courses = lmsCatalog
        .filter((c) => c.skill.toLowerCase() === req.name.toLowerCase())
        .map((c) => ({ title: c.title, provider: c.provider, hours: c.hours }));
      return { skill: req.name, currentLevel, requiredLevel: req.minLevel, gap, recommendedCourses: courses };
    })
    .filter((g): g is SkillGapItem => g !== null);

  const estimatedHoursToClose = gaps.reduce((sum, g) => {
    const cheapestCourse = g.recommendedCourses.sort((a, b) => a.hours - b.hours)[0];
    return sum + (cheapestCourse ? cheapestCourse.hours * g.gap : g.gap * 10);
  }, 0);

  return {
    employee,
    role,
    score: match.score,
    tier: match.tier,
    gaps,
    estimatedHoursToClose,
    estimatedWeeksToClose: Math.max(1, Math.round(estimatedHoursToClose / 5))
  };
}
