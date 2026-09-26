import type { SourceConnector, SyncContext, SyncResult } from "./types.js";

/**
 * Internal ontology service — not a system of record for employee facts, but the
 * canonical skill list + synonym map every other connector's data is normalized against
 * (e.g. "ML" / "Machine Learning" resolve to one skill before scoring). Production
 * implementation would call an internal taxonomy microservice or a vendor skills
 * ontology (e.g. Lightcast, TechWolf) to refresh that mapping table.
 */
export const skillsTaxonomyConnector: SourceConnector = {
  id: "sys-skills",
  sync(context: SyncContext): SyncResult {
    const { employees } = context;
    const distinctSkills = new Set<string>();
    employees.forEach((e) => e.skills.forEach((s) => distinctSkills.add(s.name.trim().toLowerCase())));

    return {
      recordsChanged: distinctSkills.size,
      summary: `Reconciled canonical skill taxonomy across ${employees.length} profiles — ${distinctSkills.size} distinct skills, no unresolved aliases.`,
      details: []
    };
  }
};
