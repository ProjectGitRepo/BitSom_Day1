export interface SkillEntry {
  name: string;
  level: number; // 1-5
  source: string[]; // 'self' | 'manager' | 'certification' | 'project' | 'lms'
  lastVerifiedAt: string; // ISO date the evidence was last refreshed by a connector sync
}

export interface SkillConfidence {
  confidence: number; // 0-1, triangulated provenance + recency weighted
  tier: "high" | "medium" | "low";
  freshness: "fresh" | "aging" | "stale";
  monthsSinceVerified: number;
  evidence: { key: string; label: string; present: boolean }[];
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  year: number;
}

export interface ProjectEntry {
  name: string;
  role: string;
  description: string;
  year: number;
}

export interface PastRoleEntry {
  title: string;
  team: string;
  startYear: number;
  endYear: number;
}

export interface ManagerFeedbackEntry {
  cycle: string;
  rating: string;
  comments: string;
}

export interface LmsCompletionEntry {
  course: string;
  completedDate: string;
  hours: number;
}

export interface Employee {
  id: string;
  name: string;
  title: string;
  department: string;
  location: string;
  tenureYears: number;
  avatarColor: string;
  skills: SkillEntry[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
  pastRoles: PastRoleEntry[];
  managerFeedback: ManagerFeedbackEntry[];
  lmsCompletions: LmsCompletionEntry[];
  resumeSummary: string;
  interestedInReskilling: boolean;
  mobility: "high" | "medium" | "low";
}

export interface RequiredSkill {
  name: string;
  minLevel: number;
  weight: number;
}

export interface RecommendedCourse {
  course: string;
  skill: string;
  hours: number;
}

export interface Role {
  id: string;
  title: string;
  department: string;
  requiredSkills: RequiredSkill[];
  evidenceKeywords: string[];
  recommendedCourses: RecommendedCourse[];
}

export interface SkillDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  aliases: string[];
  related: string[]; // skill ids
}

export interface LmsCourse {
  id: string;
  title: string;
  skill: string;
  provider: string;
  hours: number;
}

export interface EvidenceSnippet {
  field: "resumeSummary" | "project" | "managerFeedback";
  label: string;
  phrase: string;
  excerpt: string;
}

export interface SystemSource {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "connected" | "disconnected";
  syncFrequency: string;
  recordsSynced: number;
  lastSyncedAt: string;
}

export interface SyncLogEntry {
  id: string;
  connectorId: string;
  timestamp: string;
  recordsChanged: number;
  summary: string;
}

export interface MatchResult {
  employee: Employee;
  score: number;
  skillScore: number;
  evidenceScore: number;
  matchedSkills: { name: string; level: number; minLevel: number; confidence: number }[];
  missingSkills: { name: string; minLevel: number }[];
  adjacentSkills: { requiredSkill: string; viaSkill: string; confidence: number }[];
  evidence: EvidenceSnippet[];
  tier: "ready" | "reskillable" | "gap";
  rationale: string;
}

export interface FlightRiskInsight {
  employeeId: string;
  name: string;
  title: string;
  department: string;
  avatarColor: string;
  riskScore: number;
  riskLevel: "high" | "medium" | "low";
  reasons: string[];
}

export interface HiddenGemInsight {
  employeeId: string;
  name: string;
  title: string;
  department: string;
  avatarColor: string;
  bestRoleTitle: string;
  bestRoleScore: number;
  reason: string;
}

export interface BenchPressureInsight {
  roleId: string;
  roleTitle: string;
  readyCount: number;
  reskillableCount: number;
  totalEmployees: number;
  pressure: "critical" | "watch" | "healthy";
  headline: string;
}

export interface NextAction {
  priority: number;
  title: string;
  detail: string;
  category: "retention" | "mobility" | "hiring" | "general";
}

export interface NextActionsResponse {
  actions: NextAction[];
  source: "rule-based";
  generatedAt: string;
}

export interface RoiAssumptions {
  costPerExternalHire: number;
  costPerLearningHour: number;
  costPerInternalMove: number;
  avgExternalTimeToFillWeeks: number;
}

export interface DepartmentComposition {
  department: string;
  orgSharePct: number;
  poolSharePct: number;
  flagged: boolean;
}

export interface PoolCompositionCheck {
  departments: DepartmentComposition[];
  hasSkew: boolean;
}

export interface RoiSummary {
  assumptions: RoiAssumptions;
  baselineCost: number;
  hybridCost: number;
  dollarsSaved: number;
  pctSaved: number;
  baselineWeeks: number;
  hybridWeeks: number;
  weeksSaved: number;
}
