// Common types to be used across the application
export interface User {
  id: number;
  authId?: string;
  email: string;
  username: string;
  fullName?: string;
  role: string;
  planType?: string;
  avatarUrl?: string;
  jobTitle?: string;
  company?: string;
  organizationId?: number;
  orgName?: string;
  approved?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  trialStartedAt?: string;
  trialStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Zod-compatible insert schema for auth forms
export type InsertUser = {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
};

// Cloud provider types (replaces @shared/cloud-providers)
export enum CloudProvider {
  AWS = "AWS",
  GCP = "GCP",
  AZURE = "AZURE",
}

export interface CloudCredentials {
  provider: CloudProvider;
}

export interface AWSCredentials extends CloudCredentials {
  provider: CloudProvider.AWS;
  roleArn: string;
  region?: string;
}

export interface GCPCredentials extends CloudCredentials {
  provider: CloudProvider.GCP;
  serviceAccountKey: string;
  projectId?: string;
  billingDataset?: string;
}

export interface AzureCredentials extends CloudCredentials {
  provider: CloudProvider.AZURE;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  subscriptionId: string;
  location?: string;
}

export type AllCloudCredentials = AWSCredentials | GCPCredentials | AzureCredentials;

export interface Resource {
  id: number;
  name: string;
  type: string;
  provider: string;
  region: string;
  status: string;
  tags: Record<string, string>;
  cost: number;
  createdAt: string;
}

export interface SecurityDrift {
  id: number;
  resourceId: number;
  driftType: string;
  description?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: Record<string, any>;
  detectedAt: string;
  status: 'open' | 'remediated' | 'approved';
}

// Updated CostAnomaly to match backend more closely while maintaining backward compat
export interface CostAnomaly {
  id: string | number;
  provider?: string;
  serviceName?: string;
  resourceId?: string | number;
  anomalyType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  percentage?: number;
  deviation: number;
  expectedCost: number;
  actualCost: number;
  previousCost?: number; // legacy
  currentCost?: number; // legacy
  detectedAt: string;
  status: 'open' | 'reviewed' | 'resolved';
  notes?: string;
  baselineMethod?: string;
  details?: {
    medianAbsoluteDeviation?: number;
    robustZScore?: number;
    absoluteImpact?: number;
  };
}

export interface CostAnomalyPage {
  anomalies: CostAnomaly[];
  total: number;
}

export interface Alert {
  id: number;
  title: string;
  message: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  resourceId?: number;
  createdAt: string;
  status: string;
}

export interface Recommendation {
  id: number;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  savings: number;
  effort: string;
  impact: string;
  category: string;
  status: 'pending' | 'applied' | 'dismissed';
  resources?: string[];
  createdAt: string;
}

export interface ScanResult {
  status: string;
  timestamp: string;
  summary: {
    resourcesScanned: number;
    securityDrifts: number;
    costAnomalies: number;
    newAlerts: number;
  }
}

export interface StatusSummary {
  securityStatus: 'healthy' | 'warning' | 'critical';
  costStatus: 'healthy' | 'warning' | 'critical';
  resourcesCount: number;
  alertsCount: number;
}

export type ChartTimeframe = '7d' | '30d' | '90d';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

export interface UtilizationMetric {
  name: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down';
  change: number;
}

// ==========================================
// New Types for Phase 3-6
// ==========================================

// Cost Analytics
export interface ServiceCost {
  provider?: string;
  serviceName: string;
  cost: number;
  percentage: number;
}

export interface CostOverview {
  totalCost: number;
  monthlyCost: number;
  dailyCost: number;
  currency: string;
  byProvider: Record<string, number>;
  topServices: ServiceCost[];
  trend?: CostTrend;
  anomalyCount: number;
  potentialSavings: number;
  dataStatus: CostDataStatus;
}

export interface CostDataStatus {
  hasData: boolean;
  recordCount: number;
  aggregateRecords: number;
  resourceRecords: number;
  firstCostDate?: string;
  lastCostDate?: string;
  lastUpdatedAt?: string;
}

export type CostSyncProviderStatus =
  | 'synced'
  | 'no_data'
  | 'not_connected'
  | 'not_configured'
  | 'failed';

export interface CostSyncResult {
  provider: string;
  status: CostSyncProviderStatus;
  recordsFetched: number;
  recordsStored: number;
  aggregateRecords: number;
  resourceRecords: number;
  message: string;
}

export interface CostSyncSummary {
  status: 'completed' | 'partial' | 'failed' | 'action_required';
  results: CostSyncResult[];
  recordsFetched: number;
  recordsStored: number;
}

export interface CostTrend {
  period: string;
  currentCost: number;
  previousCost: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  dataPoints: { date: string; cost: number }[];
}

export interface ForecastPoint {
  date: string;
  cost: number;
  lowerBound: number;
  upperBound: number;
}

export interface CostForecast {
  provider: string;
  model: string;
  period: string;
  forecastedCost: number;
  confidenceLevel: number;
  lowerBound: number;
  upperBound: number;
  currency: string;
  endDate: string;
  dataPoints: ForecastPoint[];
  historical: { date: string; cost: number }[];
  accuracy?: ForecastAccuracy;
}

export interface ForecastAccuracy {
  method: string;
  samples: number;
  meanAbsoluteError: number;
  meanAbsolutePercentError: number;
  candidates: Record<string, number>;
}

export interface AIForecastResult {
  summary: string;
  costDrivers: string[];
  riskFactors: string[];
  recommendations: string[];
  forecast30d?: number;
  forecast60d?: number;
  forecast90d?: number;
}

export interface ROIData {
  currentMonthlySpend: number;
  currency: string;
  providerBreakdown: Record<string, number>;
  resourceCount: number;
  appliedSavings: number;
  pendingSavings: number;
  totalPotentialSavings: number;
  optimizationCount: number;
  securityIncidents: number;
  driftCount: number;
}

export interface CostOptimization {
  id: string;
  provider: string;
  resourceId?: string;
  resourceType: string;
  optimizationType: string;
  title: string;
  description: string;
  currentCost: number;
  estimatedSavings: number;
  savingsPercent: number;
  implementation: 'easy' | 'moderate' | 'complex' | string;
  status: 'new' | 'acknowledged' | 'planned' | 'applied' | 'verified' | 'dismissed' | 'expired';
  details?: Record<string, unknown>;
  source: string;
  providerSource?: string;
  accountId?: string;
  region?: string;
  actionType?: string;
  restartNeeded?: boolean;
  rollbackPossible?: boolean;
  currency: string;
  recommendationLookbackDays?: number;
  includedInTotal: boolean;
  confidence: number;
  savingsLow: number;
  savingsHigh: number;
  evidence?: OptimizationEvidence[];
  assumptions?: string[];
  notes?: string;
  realizedSavings?: number;
  firstSeenAt: string;
  lastSeenAt: string;
  appliedAt?: string;
  verifiedAt?: string;
}

export interface OptimizationEvidence {
  metric: string;
  observed: unknown;
  threshold?: unknown;
  unit?: string;
  source: string;
}

export interface OptimizationCoverage {
  provider: string;
  source: string;
  status: 'available' | 'partial' | 'stale' | 'not_enrolled' | 'missing_permission' | 'unavailable' | 'not_connected' | 'not_supported';
  findings: number;
  deduplicatedSavings: number;
  currency: string;
  stale: boolean;
  missingPermissions?: string[];
  errorCategory?: string;
  message: string;
}

export interface OptimizationSourceResult extends OptimizationCoverage {
  id: string;
  runId: string;
  organizationId: number;
  startedAt: string;
  completedAt: string;
}

export interface OptimizationAnalysisRun {
  id: string;
  organizationId: number;
  actorProfileId: number;
  trigger: 'manual' | 'scheduled' | string;
  provider: string;
  status: 'running' | 'completed' | 'partial' | 'failed';
  findings: number;
  deduplicatedSavings: number;
  currency: string;
  sourceCoverage: OptimizationSourceResult[];
  missingPermissions?: string[];
  errorCategory?: string;
  message: string;
  startedAt: string;
  completedAt?: string;
}

export interface OptimizationAnalysisStatus {
  provider: string;
  latestRun?: OptimizationAnalysisRun;
  lastSuccessfulAnalysis?: string;
  isStale: boolean;
  evaluatedFindings: number;
  authoritativeSavings: number;
  currency: string;
  missingPermissions?: string[];
  nextScheduledRun?: string;
}

export interface CostOptimizationFilters {
  status?: string;
  provider?: string;
  accountId?: string;
  region?: string;
  source?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export interface OptimizationAnalysis {
  message: string;
  generated: number;
  expired: number;
  coverage: OptimizationCoverage[];
  run?: OptimizationAnalysisRun;
}

export interface CostOptimizationPage {
  optimizations: CostOptimization[];
  total: number;
}

// Compliance
export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  provider?: string;
  isEnabled: boolean;
}

export interface ComplianceControl {
  id: string;
  frameworkId: string;
  controlId: string;
  title: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  remediation?: string;
}

export interface ComplianceAssessment {
  id: string;
  queueJobId?: number;
  frameworkId: string;
  frameworkName: string;
  frameworkVersion: string;
  evaluationEngineVersion: string;
  evidenceManifestChecksum?: string;
  assessmentDate: string;
  totalControls: number;
  passedControls: number;
  failedControls: number;
  notApplicableControls: number;
  notEvaluatedControls?: number;
  unsupportedControls?: number;
  sourceUnavailableControls?: number;
  compliancePercent: number;
  coveragePercent?: number;
  scoreAvailable?: boolean;
  evaluationStatus?: 'complete' | 'partial' | 'unavailable' | 'not_assessed';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  stage?: string;
  progressPercent?: number;
  controlsEvaluated?: number;
  findingsReconciled?: number;
  errorMessage?: string;
  findings?: string; // JSON string in backend, parsed in frontend usage
}

export interface ComplianceEvidenceManifest {
  schemaVersion: number;
  assessmentId: string;
  organizationId: number;
  actorProfileId: number;
  framework: {
    id: string;
    name: string;
    version: string;
    provider?: string;
  };
  engineVersion: string;
  scope: {
    providers: string[] | null;
    resourceCount: number;
  };
  controls: Array<{
    id: string;
    controlId: string;
    title: string;
    category: string;
    severity: string;
  }> | null;
  mappings: Array<{
    id: string;
    controlId: string;
    controlRecordId: string;
    securityRuleType?: string;
    resourceType?: string;
    provider?: string;
    mappingConfidence?: string;
    checkQuery?: string;
    version: number;
    checksum: string;
    effectiveAt: string;
  }> | null;
  resources: Array<{
    resourceId: string;
    provider: string;
    resourceType: string;
    observedAt: string;
    configurationSha256: string;
  }> | null;
  exclusions: Array<{
    controlId: string;
    status: string;
    reason: string;
  }> | null;
  controlResults: AssessmentFinding[] | null;
  resultsChecksum: string;
  createdAt: string;
  checksum: string;
}

export interface ComplianceAssessmentDetail {
  assessment: ComplianceAssessment;
  findings: AssessmentFinding[] | null;
  evidenceManifest: ComplianceEvidenceManifest | null;
  evidenceVerified: boolean;
}

export interface AssessmentFinding {
  controlId: string;
  controlTitle: string;
  category: string;
  severity: string;
  status: 'passed' | 'failed' | 'not_applicable' | 'not_evaluated' | 'unsupported' | 'source_unavailable';
  affectedCount: number;
  affectedResources?: string[];
  remediation: string;
  evidence?: string;
  policyId?: string;
  policySource?: string;
  confidence?: string;
}

export interface FrameworkCompliance {
  frameworkId: string;
  frameworkName: string;
  totalControls: number;
  passedControls: number;
  failedControls: number;
  notApplicableControls: number;
  notEvaluatedControls?: number;
  unsupportedControls?: number;
  sourceUnavailableControls?: number;
  controlsEvaluated?: number;
  compliancePercent: number;
  coveragePercent?: number;
  scoreAvailable?: boolean;
  evaluationStatus?: 'complete' | 'partial' | 'unavailable' | 'not_assessed';
  lastAssessment?: string;
}

export interface ComplianceOverview {
  totalControls: number;
  passedControls: number;
  failedControls: number;
  notApplicableControls: number;
  notEvaluatedControls?: number;
  unsupportedControls?: number;
  sourceUnavailableControls?: number;
  controlsEvaluated?: number;
  compliancePercent: number;
  coveragePercent?: number;
  scoreAvailable?: boolean;
  evaluationStatus?: 'complete' | 'partial' | 'unavailable' | 'not_assessed';
  byFramework: FrameworkCompliance[];
  bySeverity: Record<string, number>;
}

export interface ResourceControlStatus {
  frameworkId: string;
  controlId: string;
  title: string;
  status: 'passed' | 'failed' | 'not_checked' | 'not_evaluated' | 'unsupported' | 'source_unavailable';
  severity?: string;
  reason?: string;
  remediation?: string;
  lastChecked: string;
}

export interface ResourceComplianceStatus {
  resourceId: string;
  resourceType: string;
  provider: string;
  controlStatuses: ResourceControlStatus[];
  overallStatus: 'compliant' | 'non_compliant' | 'partial';
  lastChecked: string;
  totalControls: number;
  passedControls: number;
  failedControls: number;
  notEvaluatedControls?: number;
  unsupportedControls?: number;
  sourceUnavailableControls?: number;
  controlsEvaluated?: number;
  score: number;
  coveragePercent?: number;
  scoreAvailable?: boolean;
}

// Jobs & Automation
export interface ScheduledJob {
  id: string;
  name: string;
  description?: string;
  type: string;
  schedule: string; // Cron expression
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: 'idle' | 'running' | 'failed';
}

export interface JobExecution {
  id: number;
  jobId: string;
  status: 'success' | 'failure' | 'running';
  startedAt: string;
  completedAt?: string;
  duration?: string;
  errorMessage?: string;
}

export interface RemediationAction {
  id: string;
  driftId?: number;
  vulnerabilityId?: number;
  resourceId?: string;
  type?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  actionType: string;
  description: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'executed' | 'failed';
  requestedBy: number; // User ID
  requestedAt: string;
}

// Notifications — backend returns snake_case JSON
export interface NotificationPreference {
  id: string;
  user_id: number;
  channel: 'email' | 'slack' | 'webhook';
  is_enabled: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_enabled: boolean;
  last_triggered?: string;
  created_at: string;
  updated_at: string;
}
