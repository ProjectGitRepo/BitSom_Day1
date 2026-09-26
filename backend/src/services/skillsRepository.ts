import { skillsRepository, employees } from "../data/index.js";
import type { SkillDefinition } from "../types.js";

const byLowerNameOrAlias = new Map<string, SkillDefinition>();
for (const skill of skillsRepository) {
  byLowerNameOrAlias.set(skill.name.toLowerCase(), skill);
  for (const alias of skill.aliases) byLowerNameOrAlias.set(alias.toLowerCase(), skill);
}
const byId = new Map(skillsRepository.map((s) => [s.id, s]));

/**
 * Resolves any raw skill string (from a connector, a resume parse, or an HR-typed query)
 * to its canonical repository entry — so "ML" and "Machine Learning" are recognized as
 * the same skill everywhere matching happens, instead of silently failing to line up.
 */
export function resolveSkill(rawName: string): SkillDefinition | undefined {
  return byLowerNameOrAlias.get(rawName.trim().toLowerCase());
}

export function canonicalName(rawName: string): string {
  return resolveSkill(rawName)?.name ?? rawName;
}

export function getSkillById(id: string): SkillDefinition | undefined {
  return byId.get(id);
}

/**
 * The knowledge-graph lookup that lets matching recognize adjacent capability instead of
 * requiring an exact skill name. A role needing "AI Product Ownership" that an employee
 * doesn't hold directly can still draw partial credit if that employee holds skills this
 * repository lists as adjacent to it (e.g. customer interviews, roadmapping, analytics).
 */
export function getAdjacentSkillNames(rawName: string): string[] {
  const skill = resolveSkill(rawName);
  if (!skill) return [];
  return skill.related.map((id) => byId.get(id)?.name).filter((n): n is string => Boolean(n));
}

export function listSkillsWithUsage() {
  const counts = new Map<string, number>();
  for (const employee of employees) {
    for (const skill of employee.skills) {
      const canonical = resolveSkill(skill.name);
      const key = canonical?.id ?? skill.name;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return skillsRepository.map((skill) => ({
    ...skill,
    relatedSkills: skill.related.map((id) => byId.get(id)).filter((s): s is SkillDefinition => Boolean(s)).map((s) => ({ id: s.id, name: s.name })),
    employeeCount: counts.get(skill.id) ?? 0
  }));
}

export function getSkillDetail(id: string) {
  const skill = byId.get(id);
  if (!skill) return undefined;

  const holders = employees
    .map((e) => {
      const entry = e.skills.find((s) => resolveSkill(s.name)?.id === id || s.name.toLowerCase() === skill.name.toLowerCase());
      if (!entry) return null;
      return { employeeId: e.id, name: e.name, title: e.title, department: e.department, avatarColor: e.avatarColor, level: entry.level, rawName: entry.name };
    })
    .filter((h): h is NonNullable<typeof h> => h !== null)
    .sort((a, b) => b.level - a.level);

  return {
    ...skill,
    relatedSkills: skill.related.map((relId) => byId.get(relId)).filter((s): s is SkillDefinition => Boolean(s)).map((s) => ({ id: s.id, name: s.name, category: s.category })),
    employeeCount: holders.length,
    holders
  };
}
