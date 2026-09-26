import { Router } from "express";
import { getNextActions } from "../services/nextActions.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getNextActions());
});

export default router;
