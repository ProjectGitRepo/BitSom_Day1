import type {
  ConnectorConfigStatus,
  DashboardSummary,
  Employee,
  EmployeeSummary,
  InsightsResponse,
  MatchResult,
  NextActionsResponse,
  RoiAssumptions,
  RoleFit,
  RoleSummary,
  SkillGapReport,
  SyncLogEntry,
  SystemSource,
  WorkforcePlanResponse
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  dashboardSummary: () => request<DashboardSummary>("/dashboard-summary"),

  listEmployees: (params?: { department?: string; q?: string }) => {
    const search = new URLSearchParams();
    if (params?.department && params.department !== "All") search.set("department", params.department);
    if (params?.q) search.set("q", params.q);
    const qs = search.toString();
    return request<{ total: number; employees: EmployeeSummary[] }>(`/employees${qs ? `?${qs}` : ""}`);
  },

  getEmployee: (id: string) => request<{ employee: Employee; roleFits: RoleFit[] }>(`/employees/${id}`),

  listRoles: () => request<{ roles: RoleSummary[] }>("/roles"),

  capabilitySearch: (params: { roleId?: string; q?: string; limit?: number }) => {
    const search = new URLSearchParams();
    if (params.roleId) search.set("roleId", params.roleId);
    if (params.q) search.set("q", params.q);
    if (params.limit) search.set("limit", String(params.limit));
    return request<{
      searchedRole: { title: string; requiredSkills: RoleSummary["requiredSkills"]; evidenceKeywords: string[] };
      detectedRole: { title: string; confidence: number } | null;
      totalCandidates: number;
      matches: MatchResult[];
    }>(`/capability-search?${search.toString()}`);
  },

  workforcePlan: (roleId: string, headcount: number, assumptions?: Partial<RoiAssumptions>) =>
    request<WorkforcePlanResponse>("/workforce-plan", {
      method: "POST",
      body: JSON.stringify({ roleId, headcount, assumptions })
    }),

  getInsights: () => request<InsightsResponse>("/insights"),

  getNextActions: () => request<NextActionsResponse>("/next-actions"),

  skillGap: (employeeId: string, roleId?: string) =>
    request<{ report: SkillGapReport }>(`/skill-gap/${employeeId}${roleId ? `?roleId=${roleId}` : ""}`),

  listSystemSources: () => request<{ sources: SystemSource[] }>("/system-sources"),

  syncSystemSource: (id: string) =>
    request<{ source: SystemSource; entry: SyncLogEntry }>(`/system-sources/${id}/sync`, { method: "POST" }),

  getSyncLog: (id: string) => request<{ log: SyncLogEntry[] }>(`/system-sources/${id}/log`),

  getConnectorConfig: (id: string) => request<{ config: ConnectorConfigStatus }>(`/system-sources/${id}/config`),

  saveConnectorConfig: (id: string, values: Record<string, string>) =>
    request<{ config: ConnectorConfigStatus }>(`/system-sources/${id}/config`, {
      method: "PUT",
      body: JSON.stringify({ values })
    })
};
