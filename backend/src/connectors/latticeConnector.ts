import type { SourceConnector, SyncContext, SyncResult } from "./types.js";
import { evidencePhrasesByCategory, pickRandom } from "./shared.js";

/**
 * Manager feedback & performance ratings. Production implementation would call
 * Lattice's API for the latest completed review cycle per employee.
 */
export const latticeConnector: SourceConnector = {
  id: "sys-perf",
  sync(context: SyncContext): SyncResult {
    const { employees } = context;
    const employee = pickRandom(employees);
    const category = pickRandom(Object.keys(evidencePhrasesByCategory));
    const phrase = pickRandom(evidencePhrasesByCategory[category]);
    const rating = pickRandom(["Exceeds Expectations", "Meets Expectations", "Strong Performer", "Outstanding"]);

    employee.managerFeedback.unshift({
      cycle: "H2 2026",
      rating,
      comments: `Consistently ${phrase}. A dependable teammate who raises the bar for the group.`
    });

    return {
      recordsChanged: 1,
      summary: `Recorded new manager feedback for ${employee.name} (${rating}).`,
      details: [`${employee.id} feedback added for H2 2026`]
    };
  }
};
