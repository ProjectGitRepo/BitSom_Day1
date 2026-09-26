import type { BenchPressureInsight, Employee, FlightRiskInsight, HiddenGemInsight, Role } from "../types.js";
import { rankEmployeesForRole } from "./matching.js";

const juniorTitleHints = ["Analyst", "Associate", "Specialist", "Coordinator", "Junior"];

function isJuniorSoundingTitle(title: string): boolean {
  return juniorTitleHints.some((hint) => title.includes(hint)) || title.trim().endsWith(" I");
}

export function computeFlightRisks(employees: Employee[], limit = 5): FlightRiskInsight[] {
  const scored = employees.map((e) => {
    let riskScore = 0;
    const reasons: string[] = [];

    if (e.tenureYears >= 5 && e.pastRoles.length === 0) {
      riskScore += 40;
      reasons.push(`No internal role change in ${e.tenureYears} years of tenure`);
    }
    if (e.lmsCompletions.length === 0) {
      riskScore += 30;
      reasons.push("No learning or development activity on record");
    }
    if (e.interestedInReskilling && e.mobility !== "low" && e.tenureYears >= 3) {
      riskScore += 20;
      reasons.push("Actively open to a new role but hasn't moved");
    }
    if (e.managerFeedback.every((f) => f.rating === "Meets Expectations") && e.managerFeedback.length > 0) {
      riskScore += 10;
      reasons.push("Performance has plateaued at \"Meets Expectations\"");
    }

    const riskLevel: FlightRiskInsight["riskLevel"] = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

    return {
      employeeId: e.id,
      name: e.name,
      title: e.title,
      department: e.department,
      avatarColor: e.avatarColor,
      riskScore: Math.min(100, riskScore),
      riskLevel,
      reasons
    };
  });

  return scored
    .filter((s) => s.riskScore >= 40)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, limit);
}

export function computeHiddenGems(employees: Employee[], roles: Role[], limit = 5): HiddenGemInsight[] {
  const gems: HiddenGemInsight[] = [];

  for (const employee of employees) {
    if (!isJuniorSoundingTitle(employee.title)) continue;

    let best: { role: Role; score: number } | null = null;
    for (const role of roles) {
      if (role.department === employee.department) continue; // looking for overlooked cross-department fit
      const [result] = rankEmployeesForRole([employee], role);
      if (!best || result.score > best.score) best = { role, score: result.score };
    }

    if (best && best.score >= 82) {
      gems.push({
        employeeId: employee.id,
        name: employee.name,
        title: employee.title,
        department: employee.department,
        avatarColor: employee.avatarColor,
        bestRoleTitle: best.role.title,
        bestRoleScore: best.score,
        reason: `${employee.name.split(" ")[0]} scores ${best.score}/100 as evidence-based fit for ${best.role.title} — well outside their current ${employee.department} track and easy to miss on title alone.`
      });
    }
  }

  return gems.sort((a, b) => b.bestRoleScore - a.bestRoleScore).slice(0, limit);
}

export function computeBenchPressure(employees: Employee[], roles: Role[]): BenchPressureInsight[] {
  return roles
    .map((role) => {
      const ranked = rankEmployeesForRole(employees, role);
      const readyCount = ranked.filter((r) => r.tier === "ready").length;
      const reskillableCount = ranked.filter((r) => r.tier === "reskillable").length;

      const pressure: BenchPressureInsight["pressure"] = readyCount < 8 ? "critical" : readyCount < 15 ? "watch" : "healthy";
      const headline =
        pressure === "critical"
          ? `${role.title} bench is critically thin — only ${readyCount} of ${employees.length} employees are ready now.`
          : pressure === "watch"
            ? `${role.title} bench is worth watching — ${readyCount} ready, ${reskillableCount} reskillable.`
            : `${role.title} bench is healthy — ${readyCount} ready today.`;

      return {
        roleId: role.id,
        roleTitle: role.title,
        readyCount,
        reskillableCount,
        totalEmployees: employees.length,
        pressure,
        headline
      };
    })
    .sort((a, b) => a.readyCount - b.readyCount);
}
