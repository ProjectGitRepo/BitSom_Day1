import { Router } from "express";
import { employees, roles, lmsCatalog } from "../data/index.js";
import { buildSkillGapReport } from "../services/skillGap.js";
import { rankEmployeesForRole } from "../services/matching.js";

const router = Router();

router.get("/:employeeId", (req, res) => {
  const employee = employees.find((e) => e.id === req.params.employeeId);
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const { roleId } = req.query as { roleId?: string };
  let role = roleId ? roles.find((r) => r.id === roleId) : undefined;

  if (!role) {
    role = roles
      .map((r) => ({ r, score: rankEmployeesForRole([employee], r)[0].score }))
      .sort((a, b) => b.score - a.score)[0].r;
  }

  const report = buildSkillGapReport(employee, role, lmsCatalog);
  res.json({ report });
});

export default router;
