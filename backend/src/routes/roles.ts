import { Router } from "express";
import { roles } from "../data/index.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ roles: roles.map((r) => ({ id: r.id, title: r.title, department: r.department, requiredSkills: r.requiredSkills })) });
});

router.get("/:id", (req, res) => {
  const role = roles.find((r) => r.id === req.params.id);
  if (!role) return res.status(404).json({ error: "Role not found" });
  res.json({ role });
});

export default router;
