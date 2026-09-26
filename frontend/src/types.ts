export interface SkillEntry {
  name: string;
  level: number;
  source: string[];
  lastVerifiedAt: string;
  confidence?: number;
  freshness?: "fresh" | "aging" | "stale";
  monthsSinceVerified?: number;
}

export interface EmployeeSummary {
  id: string;
  name: string;
  title: string;
  department: string;
  location: string;
  tenureYears: number;
  avatarColor: string;
  topSkills: string[];
  mobility: "high" | "medium" | "low";
  interestedInReskilling: boolean;
}

export interface Employee extends Omit<EmployeeSummary, "topSkills"> {
  skills: SkillEntry[];
  certifications: { name: string; issuer: string; year: number }[];
  projects: { name: string; role: string; description: string; year: number }[];
  pastRoles: { title: string; team: string; startYear: number; endYear: number }[];
  managerFeedback: { cycle: string; rating: string; comments: string }[];
  lmsCompletions: { course: string; completedDate: string; hours: number }[];
  resumeSummary: string;
}

export interface RoleFit {
  roleId: string;
  roleTitle: string;
  score: number;
  skillScore: number;
  evidenceScore: number;
  tier: "ready" | "reskillable" | "gap";
  matchedSkills: { name: string; level: number; minLevel: number; confidence: number }[];
  missingSkills: { name: string; minLevel: number }[];
  adjacentSkills: { requiredSkill: string; viaSkill: string; confidence: number }[];
  evidence: EvidenceSnippet[];
  rationale: string;
}

export interface RequiredSkill {
  name: string;
  minLevel: number;
  weight: number;
}

export interface RoleSummary {
  id: string;
  title: string;
  department: string;
  requiredSkills: RequiredSkill[];
}

export interface EvidenceSnippet {
  field: string;
  label: string;
  phrase: string;
  excerpt: string;
}

export interface MatchResult {
  employeeId: string;
  name: string;
  title: string;
  department: string;
  avatarColor: string;
  score: number;
  skillScore: number;
  evidenceScore: number;
  tier: "ready" | "reskillable" | "gap";
  matchedSkills: { name: string; level: number; minLevel: number; confidence: number }[];
  missingSkills: { name: string; minLevel: number }[];
  adjacentSkills: { requiredSkill: string; viaSkill: string; confidence: number }[];
  evidence: EvidenceSnippet[];
  rationale: string;
}

export interface WorkforceCandidate {
  employeeId: string;
  name: string;
  title: string;
  department: string;
  avatarColor: string;
  score: number;
  skillScore: number;
  evidenceScore: number;
  tier: "ready" | "reskillable" | "gap";
  mobility: "high" | "medium" | "low";
  interestedInReskilling: boolean;
  missingSkills: { name: string; minLevel: number }[];
  matchedSkills: { name: string; level: number; minLevel: number; confidence: number }[];
  adjacentSkills: { requiredSkill: string; viaSkill: string; confidence: number }[];
  rationale: string;
  estimatedWeeksToClose?: number;
  estimatedHoursToClose?: number;
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

export interface WorkforcePlanResponse {
  role: { id: string; title: string; department: string };
  headcountNeeded: number;
  allocation: { readyUsed: number; reskillUsed: number; hireExternally: number };
  readyPool: WorkforceCandidate[];
  reskillPool: WorkforceCandidate[];
  gapPoolSize: number;
  roi: RoiSummary;
  poolComposition: PoolCompositionCheck;
}

export interface DashboardSummary {
  totalEmployees: number;
  totalDepartments: number;
  departments: string[];
  totalRoles: number;
  reskillReadyEmployees: number;
  roleCoverage: { roleId: string; roleTitle: string; ready: number; reskillable: number; total: number }[];
  topSkills: { name: string; count: number }[];
}

export interface SkillGapItem {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  recommendedCourses: { title: string; provider: string; hours: number }[];
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

export interface ConnectorConfigField {
  key: string;
  label: string;
  placeholder: string;
  secret: boolean;
  required: boolean;
}

export interface ConnectorConfigStatus {
  fields: ConnectorConfigField[];
  configured: boolean;
  configuredAt: string | null;
  maskedValues: { key: string; value: string | null }[];
}

export interface SyncLogEntry {
  id: string;
  connectorId: string;
  timestamp: string;
  recordsChanged: number;
  summary: string;
}

export interface SkillGapReport {
  employee: Employee;
  role: RoleSummary;
  score: number;
  tier: string;
  gaps: SkillGapItem[];
  estimatedHoursToClose: number;
  estimatedWeeksToClose: number;
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

export interface InsightsResponse {
  flightRisks: FlightRiskInsight[];
  hiddenGems: HiddenGemInsight[];
  benchPressure: BenchPressureInsight[];
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
