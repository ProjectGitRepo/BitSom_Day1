import { Router } from "express";
import { employees, roles } from "../data/index.js";
import { rankEmployeesForRole } from "../services/matching.js";

const router = Router();

router.get("/", (_req, res) => {
  const totalEmployees = employees.length;
  const departments = [...new Set(employees.map((e) => e.department))];
  const reskillReady = employees.filter((e) => e.interestedInReskilling && e.mobility !== "low").length;

  const roleCoverage = roles.map((role) => {
    const ranked = rankEmployeesForRole(employees, role);
    const ready = ranked.filter((r) => r.tier === "ready").length;
    const reskillable = ranked.filter(
      (r) => r.tier === "reskillable" && r.employee.interestedInReskilling && r.employee.mobility !== "low"
    ).length;
    return { roleId: role.id, roleTitle: role.title, ready, reskillable, total: employees.length };
  });

  const skillFrequency = new Map<string, number>();
  employees.forEach((e) => e.skills.forEach((s) => skillFrequency.set(s.name, (skillFrequency.get(s.name) ?? 0) + 1)));
  const topSkills = [...skillFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  res.json({
    totalEmployees,
    totalDepartments: departments.length,
    departments,
    totalRoles: roles.length,
    reskillReadyEmployees: reskillReady,
    roleCoverage,
    topSkills
  });
});

export default router;
