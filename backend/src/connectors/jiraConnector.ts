import type { SourceConnector, SyncContext, SyncResult } from "./types.js";
import { evidencePhrasesByCategory, pickRandom } from "./shared.js";

const projectNames = ["Project Nova", "Project Atlas", "Project Horizon", "Project Vertex", "Project Meridian", "Project Orion", "Project Catalyst", "Project Zenith"];

/**
 * Project records. Production implementation would call the Jira REST API (issues,
 * epics, contributor fields) and Confluence for delivered work descriptions — this is
 * the richest evidence source for the capability-mapping engine, since it captures what
 * someone actually did, not just what they claim to know.
 */
export const jiraConnector: SourceConnector = {
  id: "sys-pm",
  sync(context: SyncContext): SyncResult {
    const { employees } = context;
    const employee = pickRandom(employees);
    const category = pickRandom(Object.keys(evidencePhrasesByCategory));
    const phrase = pickRandom(evidencePhrasesByCategory[category]);
    const projectName = `${pickRandom(projectNames)} ${Math.floor(Math.random() * 9) + 1}`;
    const firstName = employee.name.split(" ")[0];

    employee.projects.unshift({
      name: projectName,
      role: employee.title,
      description: `As part of the team, ${firstName} ${phrase}.`,
      year: new Date().getFullYear()
    });

    return {
      recordsChanged: 1,
      summary: `Logged new project record "${projectName}" for ${employee.name}.`,
      details: [`${employee.id} project added: ${projectName}`]
    };
  }
};
