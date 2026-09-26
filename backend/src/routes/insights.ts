import { Router } from "express";
import { employees, roles } from "../data/index.js";
import { computeBenchPressure, computeFlightRisks, computeHiddenGems } from "../services/insights.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    flightRisks: computeFlightRisks(employees),
    hiddenGems: computeHiddenGems(employees, roles),
    benchPressure: computeBenchPressure(employees, roles)
  });
});

export default router;
