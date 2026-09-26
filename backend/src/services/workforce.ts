import type { Employee, MatchResult, Role } from "../types.js";
import { rankEmployeesForRole, READY_THRESHOLD, RESKILL_THRESHOLD } from "./matching.js";

export interface WorkforcePlan {
  role: Role;
  headcountNeeded: number;
  readyPool: MatchResult[];
  reskillPool: MatchResult[];
  gapPool: MatchResult[];
  allocation: {
    readyUsed: number;
    reskillUsed: number;
    hireExternally: number;
  };
}

export interface DepartmentComposition {
  department: string;
  orgSharePct: number;
  poolSharePct: number;
  flagged: boolean;
}

export interface PoolCompositionCheck {
  departments: DepartmentComposition[];
  hasSkew: boolean;
}

/**
 * A minimal, rule-based fairness check on the ready + reskill pool a plan proposes to
 * draw from: does any department make up a share of the qualified pool well beyond its
 * share of the org overall? This is the kind of pre-decision bias check regulators are
 * starting to require of automated employment tooling (EU AI Act, high-risk HR AI) —
 * and it's tractable here specifically because every score is already attributable to
 * named factors, not a black-box model output.
 */
export function checkPoolComposition(allEmployees: Employee[], plan: WorkforcePlan): PoolCompositionCheck {
  const totalOrg = allEmployees.length;
  const orgCounts = new Map<string, number>();
  allEmployees.forEach((e) => orgCounts.set(e.department, (orgCounts.get(e.department) ?? 0) + 1));

  const pool = [...plan.readyPool, ...plan.reskillPool];
  const poolCounts = new Map<string, number>();
  pool.forEach((r) => poolCounts.set(r.employee.department, (poolCounts.get(r.employee.department) ?? 0) + 1));

  const departments = [...poolCounts.keys()]
    .map((department) => {
      const orgCount = orgCounts.get(department) ?? 0;
      const poolCount = poolCounts.get(department) ?? 0;
      const orgSharePct = totalOrg > 0 ? Math.round((orgCount / totalOrg) * 1000) / 10 : 0;
      const poolSharePct = pool.length > 0 ? Math.round((poolCount / pool.length) * 1000) / 10 : 0;
      // Flag only on a real signal: the pool is big enough to mean something, this
      // department accounts for a non-trivial slice of it, and that slice is at least
      // double its natural share of the org.
      const flagged = pool.length >= 5 && poolCount >= 3 && poolSharePct >= orgSharePct * 2;
      return { department, orgSharePct, poolSharePct, flagged };
    })
    .sort((a, b) => b.poolSharePct - a.poolSharePct);

  return { departments, hasSkew: departments.some((d) => d.flagged) };
}

export function buildWorkforcePlan(employees: Employee[], role: Role, headcountNeeded: number): WorkforcePlan {
  const ranked = rankEmployeesForRole(employees, role);

  const readyPool = ranked.filter((r) => r.tier === "ready");
  const reskillPool = ranked
    .filter((r) => r.tier === "reskillable" && r.employee.interestedInReskilling && r.employee.mobility !== "low")
    .sort((a, b) => b.score - a.score);
  const gapPool = ranked.filter(
    (r) => r.tier === "gap" || (r.tier === "reskillable" && (!r.employee.interestedInReskilling || r.employee.mobility === "low"))
  );

  const readyUsed = Math.min(readyPool.length, headcountNeeded);
  const remainingAfterReady = Math.max(0, headcountNeeded - readyUsed);
  const reskillUsed = Math.min(reskillPool.length, remainingAfterReady);
  const hireExternally = Math.max(0, headcountNeeded - readyUsed - reskillUsed);

  return {
    role,
    headcountNeeded,
    readyPool,
    reskillPool,
    gapPool,
    allocation: { readyUsed, reskillUsed, hireExternally }
  };
}

export { READY_THRESHOLD, RESKILL_THRESHOLD };
