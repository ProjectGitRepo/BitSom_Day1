import { Router } from "express";
import { getSkillDetail, listSkillsWithUsage } from "../services/skillsRepository.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ skills: listSkillsWithUsage() });
});

router.get("/:id", (req, res) => {
  const skill = getSkillDetail(req.params.id);
  if (!skill) return res.status(404).json({ error: "Skill not found" });
  res.json({ skill });
});

export default router;
