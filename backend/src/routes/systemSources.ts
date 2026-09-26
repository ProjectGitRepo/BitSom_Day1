import { Router } from "express";
import { systemSources } from "../data/index.js";
import { runSync, getSyncLog } from "../services/ingestion.js";
import { getConfigStatus, saveConfig } from "../services/connectorConfig.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ sources: systemSources });
});

router.get("/:id/config", (req, res) => {
  const source = systemSources.find((s) => s.id === req.params.id);
  if (!source) return res.status(404).json({ error: "System source not found" });
  const config = getConfigStatus(req.params.id);
  if (!config) return res.status(404).json({ error: "No config schema for this connector" });
  res.json({ config });
});

router.put("/:id/config", (req, res) => {
  const source = systemSources.find((s) => s.id === req.params.id);
  if (!source) return res.status(404).json({ error: "System source not found" });

  const { values } = req.body as { values?: Record<string, string> };
  if (!values) return res.status(400).json({ error: "values object is required" });

  try {
    const config = saveConfig(req.params.id, values);
    res.json({ config });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get("/:id/log", (req, res) => {
  const source = systemSources.find((s) => s.id === req.params.id);
  if (!source) return res.status(404).json({ error: "System source not found" });
  res.json({ log: getSyncLog(req.params.id) });
});

router.post("/:id/sync", (req, res) => {
  const source = systemSources.find((s) => s.id === req.params.id);
  if (!source) return res.status(404).json({ error: "System source not found" });

  try {
    const { source: updated, entry } = runSync(req.params.id);
    res.json({ source: updated, entry });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
