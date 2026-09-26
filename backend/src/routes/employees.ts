import { Router } from "express";
import { employees, roles } from "../data/index.js";
import { rankEmployeesForRole } from "../services/matching.js";
import { computeSkillConfidence } from "../services/confidence.js";

const router = Router();

router.get("/", (req, res) => {
  const { department, q } = req.query as { department?: string; q?: string };
  let list = employees;
  if (department && department !== "All") {
    list = list.filter((e) => e.department === department);
  }
  if (q) {
    const lower = q.toLowerCase();
    list = list.filter(
      (e) =>
        e.name.toLowerCase().includes(lower) ||
        e.title.toLowerCase().includes(lower) ||
        e.skills.some((s) => s.name.toLowerCase().includes(lower))
    );
  }
  const summary = list.map((e) => ({
    id: e.id,
    name: e.name,
    title: e.title,
    department: e.department,
    location: e.location,
    tenureYears: e.tenureYears,
    avatarColor: e.avatarColor,
    topSkills: [...e.skills].sort((a, b) => b.level - a.level).slice(0, 4).map((s) => s.name),
    mobility: e.mobility,
    interestedInReskilling: e.interestedInReskilling
  }));
  res.json({ total: summary.length, employees: summary });
});

router.get("/:id", (req, res) => {
  const employee = employees.find((e) => e.id === req.params.id);
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const employeeWithConfidence = {
    ...employee,
    skills: employee.skills.map((s) => ({ ...s, ...computeSkillConfidence(s) }))
  };

  const roleFits = roles
    .map((role) => {
      const [result] = rankEmployeesForRole([employee], role);
      return {
        roleId: role.id,
        roleTitle: role.title,
        score: result.score,
        skillScore: result.skillScore,
        evidenceScore: result.evidenceScore,
        tier: result.tier,
        matchedSkills: result.matchedSkills,
        missingSkills: result.missingSkills,
        adjacentSkills: result.adjacentSkills,
        evidence: result.evidence,
        rationale: result.rationale
      };
    })
    .sort((a, b) => b.score - a.score);

  res.json({ employee: employeeWithConfidence, roleFits });
});

export default router;
