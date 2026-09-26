import { Router } from "express";
import { employees, roles, lmsCatalog } from "../data/index.js";
import { buildWorkforcePlan, checkPoolComposition } from "../services/workforce.js";
import { buildSkillGapReport } from "../services/skillGap.js";
import { computeRoi } from "../services/roi.js";
import type { RoiAssumptions } from "../types.js";

const router = Router();

router.post("/", (req, res) => {
  const { roleId, headcount, assumptions } = req.body as {
    roleId?: string;
    headcount?: number;
    assumptions?: Partial<RoiAssumptions>;
  };
  if (!roleId || !headcount || headcount < 1) {
    return res.status(400).json({ error: "roleId and a positive headcount are required." });
  }
  const role = roles.find((r) => r.id === roleId);
  if (!role) return res.status(404).json({ error: "Role not found" });

  const plan = buildWorkforcePlan(employees, role, Math.round(headcount));
  const roi = computeRoi(plan, lmsCatalog, assumptions);
  const poolComposition = checkPoolComposition(employees, plan);

  const trim = (list: typeof plan.readyPool, withGap: boolean) =>
    list.map((r) => {
      const base = {
        employeeId: r.employee.id,
        name: r.employee.name,
        title: r.employee.title,
        department: r.employee.department,
        avatarColor: r.employee.avatarColor,
        score: r.score,
        skillScore: r.skillScore,
        evidenceScore: r.evidenceScore,
        tier: r.tier,
        mobility: r.employee.mobility,
        interestedInReskilling: r.employee.interestedInReskilling,
        missingSkills: r.missingSkills,
        matchedSkills: r.matchedSkills,
        adjacentSkills: r.adjacentSkills,
        rationale: r.rationale
      };
      if (!withGap) return base;
      const gap = buildSkillGapReport(r.employee, role, lmsCatalog);
      return { ...base, estimatedWeeksToClose: gap.estimatedWeeksToClose, estimatedHoursToClose: gap.estimatedHoursToClose };
    });

  res.json({
    role: { id: role.id, title: role.title, department: role.department },
    headcountNeeded: plan.headcountNeeded,
    allocation: plan.allocation,
    readyPool: trim(plan.readyPool, false),
    reskillPool: trim(plan.reskillPool, true),
    gapPoolSize: plan.gapPool.length,
    roi,
    poolComposition
  });
});

export default router;
