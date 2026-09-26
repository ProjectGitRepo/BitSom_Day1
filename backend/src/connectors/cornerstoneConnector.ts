import type { SourceConnector, SyncContext, SyncResult } from "./types.js";
import { nowISO, pickRandom, upsertSkill } from "./shared.js";

/**
 * Learning & development. Production implementation would call Cornerstone LMS's API
 * for course completions, which is also the clearest reskilling-progress signal —
 * a completed course is what turns a "gap" into a "ready" employee over time.
 */
export const cornerstoneConnector: SourceConnector = {
  id: "sys-lms",
  sync(context: SyncContext): SyncResult {
    const { employees, lmsCatalog } = context;
    const employee = pickRandom(employees);
    const course = pickRandom(lmsCatalog);

    employee.lmsCompletions.unshift({
      course: course.title,
      completedDate: nowISO().slice(0, 10),
      hours: course.hours
    });
    upsertSkill(employee, course.skill, { addSource: "lms", bump: 1, minLevel: 2 });

    return {
      recordsChanged: 1,
      summary: `Logged completion of "${course.title}" for ${employee.name} — skill "${course.skill}" updated.`,
      details: [`${employee.id} completed ${course.title}`]
    };
  }
};
