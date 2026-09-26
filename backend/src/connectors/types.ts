import type { Employee, LmsCourse } from "../types.js";

export interface SyncContext {
  employees: Employee[];
  lmsCatalog: LmsCourse[];
}

export interface SyncResult {
  recordsChanged: number;
  summary: string;
  details: string[];
}

/**
 * Contract every source-system integration implements.
 *
 * Today each connector below mutates the in-memory seeded dataset directly, so a demo sync
 * is visible end-to-end (new evidence shows up in Talent 360 / Capability Search / the
 * workforce plan immediately). Swapping to a live tenant means replacing the body of
 * `sync()` with a real HTTP client call against that system's API and mapping its response
 * onto the same `Employee` shape — nothing else in the ingestion pipeline, matching engine,
 * or UI needs to change.
 */
export interface SourceConnector {
  id: string; // matches SystemSource.id
  sync(context: SyncContext): SyncResult;
}
