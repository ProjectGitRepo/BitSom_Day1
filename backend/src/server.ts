import express from "express";
import cors from "cors";
import employeesRouter from "./routes/employees.js";
import rolesRouter from "./routes/roles.js";
import searchRouter from "./routes/search.js";
import workforceRouter from "./routes/workforce.js";
import skillGapRouter from "./routes/skillGap.js";
import dashboardRouter from "./routes/dashboard.js";
import systemSourcesRouter from "./routes/systemSources.js";
import insightsRouter from "./routes/insights.js";
import skillsRouter from "./routes/skills.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/employees", employeesRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/capability-search", searchRouter);
app.use("/api/workforce-plan", workforceRouter);
app.use("/api/skill-gap", skillGapRouter);
app.use("/api/dashboard-summary", dashboardRouter);
app.use("/api/system-sources", systemSourcesRouter);
app.use("/api/insights", insightsRouter);
app.use("/api/skills", skillsRouter);

app.listen(PORT, () => {
  console.log(`TalentIQ backend running at http://localhost:${PORT}`);
});
