import type { LmsCourse, RoiAssumptions, RoiSummary } from "../types.js";
import type { WorkforcePlan } from "./workforce.js";
import { buildSkillGapReport } from "./skillGap.js";

// Defaults grounded in published benchmarks: external technical hires average ~$14,170
// fully-loaded per hire vs. ~$5,770 to upskill an existing employee into the same role,
// and average external time-to-fill runs ~8 weeks.
export const DEFAULT_ROI_ASSUMPTIONS: RoiAssumptions = {
  costPerExternalHire: 14170,
  costPerLearningHour: 45,
  costPerInternalMove: 500,
  avgExternalTimeToFillWeeks: 8
};

export function computeRoi(plan: WorkforcePlan, lmsCatalog: LmsCourse[], overrides?: Partial<RoiAssumptions>): RoiSummary {
  const assumptions: RoiAssumptions = { ...DEFAULT_ROI_ASSUMPTIONS, ...overrides };
  const { readyUsed, reskillUsed, hireExternally } = plan.allocation;

  const reskillCandidates = plan.reskillPool.slice(0, reskillUsed);
  const gapReports = reskillCandidates.map((c) => buildSkillGapReport(c.employee, plan.role, lmsCatalog));
  const totalReskillHours = gapReports.reduce((sum, r) => sum + r.estimatedHoursToClose, 0);
  const avgReskillWeeks = gapReports.length > 0 ? Math.round(gapReports.reduce((sum, r) => sum + r.estimatedWeeksToClose, 0) / gapReports.length) : 0;

  const baselineCost = plan.headcountNeeded * assumptions.costPerExternalHire;
  const hybridCost =
    readyUsed * assumptions.costPerInternalMove + totalReskillHours * assumptions.costPerLearningHour + hireExternally * assumptions.costPerExternalHire;

  const baselineWeeks = assumptions.avgExternalTimeToFillWeeks;
  // Time-to-fully-staffed is bounded by whichever lane takes longest to land its share of
  // the headcount — reskilling and external hiring both run in parallel with redeployment.
  const hybridWeeks = Math.max(readyUsed > 0 ? 2 : 0, avgReskillWeeks, hireExternally > 0 ? assumptions.avgExternalTimeToFillWeeks : 0);

  const dollarsSaved = baselineCost - hybridCost;
  const pctSaved = baselineCost > 0 ? Math.round((dollarsSaved / baselineCost) * 100) : 0;
  const weeksSaved = baselineWeeks - hybridWeeks;

  return {
    assumptions,
    baselineCost: Math.round(baselineCost),
    hybridCost: Math.round(hybridCost),
    dollarsSaved: Math.round(dollarsSaved),
    pctSaved,
    baselineWeeks,
    hybridWeeks,
    weeksSaved
  };
}
