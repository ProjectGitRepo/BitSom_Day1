import employeesData from "./employees.json" with { type: "json" };
import rolesData from "./roles.json" with { type: "json" };
import lmsCatalogData from "./lmsCatalog.json" with { type: "json" };
import systemSourcesData from "./systemSources.json" with { type: "json" };
import skillsRepositoryData from "./skillsRepository.json" with { type: "json" };
import type { Employee, LmsCourse, Role, SkillDefinition, SystemSource } from "../types.js";

export const employees = employeesData as unknown as Employee[];
export const roles = rolesData as unknown as Role[];
export const lmsCatalog = lmsCatalogData as unknown as LmsCourse[];
// Cloned into independent, mutable objects so a sync action can update state for the server's lifetime.
export const systemSources: SystemSource[] = (systemSourcesData as unknown as SystemSource[]).map((s) => ({ ...s }));
export const skillsRepository = skillsRepositoryData as unknown as SkillDefinition[];
