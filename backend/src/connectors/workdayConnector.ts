import type { SourceConnector, SyncContext, SyncResult } from "./types.js";
import { pickRandom } from "./shared.js";

/**
 * System of record for org data. Production implementation would call Workday's
 * Human_Resources / Staffing web services (or the REST API) for worker profiles,
 * organizational assignments, and location — this mock just confirms the roster,
 * since org changes are naturally less frequent than skill evidence.
 */
export const workdayConnector: SourceConnector = {
  id: "sys-hris",
  sync(context: SyncContext): SyncResult {
    const { employees } = context;
    if (employees.length === 0) {
      return { recordsChanged: 0, summary: "No employee records found.", details: [] };
    }

    // Occasionally reflect a location change, otherwise confirm the roster is current.
    if (Math.random() < 0.35) {
      const employee = pickRandom(employees);
      const locations = ["Bengaluru", "Mumbai", "Pune", "Hyderabad", "Gurugram", "Chennai", "Remote"];
      const next = pickRandom(locations.filter((l) => l !== employee.location));
      const prev = employee.location;
      employee.location = next;
      return {
        recordsChanged: 1,
        summary: `Updated location for ${employee.name}: ${prev} → ${next}.`,
        details: [`${employee.id} location changed`]
      };
    }

    return {
      recordsChanged: employees.length,
      summary: `Confirmed organizational data for ${employees.length} employees — no changes since last sync.`,
      details: []
    };
  }
};
