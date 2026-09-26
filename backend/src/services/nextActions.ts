import { employees, roles } from "../data/index.js";
import { computeBenchPressure, computeFlightRisks, computeHiddenGems } from "./insights.js";
import type { NextAction, NextActionsResponse } from "../types.js";

/**
 * Synthesizes the three insight engines (flight risk, hidden gems, bench pressure) into
 * a short, prioritized "what to do today" list — the connective layer the Overview
 * dashboard was missing: each insight card said what it found, but nothing said what to
 * actually do about it, or noticed when two signals about the same person reinforce each
 * other. Rule-based and deterministic, same as everything else in this build — a
 * generative model could write more fluid prose over these same facts later, but the
 * facts and their prioritization don't need one to be useful.
 */

interface Facts {
  totalEmployees: number;
  flightRisks: ReturnType<typeof computeFlightRisks>;
  hiddenGems: ReturnType<typeof computeHiddenGems>;
  criticalBenchPressure: ReturnType<typeof computeBenchPressure>;
}

function gatherFacts(): Facts {
  return {
    totalEmployees: employees.length,
    flightRisks: computeFlightRisks(employees, 5),
    hiddenGems: computeHiddenGems(employees, roles, 5),
    criticalBenchPressure: computeBenchPressure(employees, roles).filter((b) => b.pressure === "critical").slice(0, 5)
  };
}

function buildActions(facts: Facts): NextAction[] {
  const actions: NextAction[] = [];
  let priority = 1;

  // The one genuinely cross-referenced signal: someone who is both a flight risk and a
  // hidden gem for an understaffed role is a stronger, more specific action than either
  // fact alone — a retention conversation with a concrete internal move to offer.
  const criticalRoleIds = new Set(facts.criticalBenchPressure.map((b) => b.roleId));
  const dualSignal = facts.flightRisks.find((risk) =>
    facts.hiddenGems.some((gem) => gem.employeeId === risk.employeeId)
  );
  if (dualSignal) {
    const gem = facts.hiddenGems.find((g) => g.employeeId === dualSignal.employeeId)!;
    actions.push({
      priority: priority++,
      title: `Prioritize a retention conversation with ${dualSignal.name}`,
      detail: `Flagged as ${dualSignal.riskLevel} flight risk (${dualSignal.reasons[0]?.toLowerCase()}), and separately scores ${gem.bestRoleScore}/100 for ${gem.bestRoleTitle} — an internal move may solve both at once.`,
      category: "retention"
    });
  }

  const topFlightRisk = facts.flightRisks.find((r) => r.employeeId !== dualSignal?.employeeId) ?? facts.flightRisks[0];
  if (topFlightRisk && topFlightRisk.employeeId !== dualSignal?.employeeId) {
    actions.push({
      priority: priority++,
      title: `Check in with ${topFlightRisk.name}`,
      detail: `Flagged ${topFlightRisk.riskLevel} flight risk: ${topFlightRisk.reasons[0]?.toLowerCase() ?? "no recent internal movement"}.`,
      category: "retention"
    });
  }

  const topGem = facts.hiddenGems.find((g) => g.employeeId !== dualSignal?.employeeId) ?? facts.hiddenGems[0];
  if (topGem && topGem.employeeId !== dualSignal?.employeeId) {
    actions.push({
      priority: priority++,
      title: `Consider ${topGem.name} for ${topGem.bestRoleTitle}`,
      detail: `Evidence-based fit score of ${topGem.bestRoleScore}/100, outside their current ${topGem.department} track.`,
      category: "mobility"
    });
  }

  const topPressure = facts.criticalBenchPressure[0];
  if (topPressure) {
    actions.push({
      priority: priority++,
      title: `Plan headcount for ${topPressure.roleTitle}`,
      detail: `Only ${topPressure.readyCount} of ${facts.totalEmployees} employees are ready now — bench is critically thin.`,
      category: "hiring"
    });
  }

  const secondPressure = facts.criticalBenchPressure[1];
  if (secondPressure && criticalRoleIds.size > 1) {
    actions.push({
      priority: priority++,
      title: `Also watch ${secondPressure.roleTitle}`,
      detail: `${secondPressure.readyCount} ready, ${secondPressure.reskillableCount} reskillable — a second role under critical bench pressure.`,
      category: "hiring"
    });
  }

  if (actions.length === 0) {
    actions.push({
      priority: 1,
      title: "No urgent signals right now",
      detail: "Flight risk, hidden gems, and bench pressure are all within normal range across the org.",
      category: "general"
    });
  }

  return actions.slice(0, 5);
}

export function getNextActions(): NextActionsResponse {
  const facts = gatherFacts();
  return { actions: buildActions(facts), source: "rule-based", generatedAt: new Date().toISOString() };
}
