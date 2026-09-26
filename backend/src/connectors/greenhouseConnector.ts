import type { SourceConnector, SyncContext, SyncResult } from "./types.js";
import { certPool, pickRandom, upsertSkill } from "./shared.js";

/**
 * Resumes & certifications. Production implementation would call the Greenhouse
 * Harvest API for candidate/employee documents and parsed certification data.
 */
export const greenhouseConnector: SourceConnector = {
  id: "sys-ats",
  sync(context: SyncContext): SyncResult {
    const { employees } = context;
    const employee = pickRandom(employees);
    const candidateCerts = certPool.filter((c) => !employee.certifications.some((ec) => ec.name === c.name));

    if (candidateCerts.length === 0) {
      return {
        recordsChanged: 0,
        summary: `No new certifications found for ${employee.name} — profile already up to date.`,
        details: []
      };
    }

    const cert = pickRandom(candidateCerts);
    employee.certifications.push({ name: cert.name, issuer: cert.issuer, year: new Date().getFullYear() });
    upsertSkill(employee, cert.skill, { addSource: "certification", minLevel: 3, bump: 1 });

    return {
      recordsChanged: 1,
      summary: `Added "${cert.name}" certification for ${employee.name}, verified skill "${cert.skill}".`,
      details: [`${employee.id} certification added: ${cert.name}`]
    };
  }
};
