// Common types to be used across the application
export interface User {
  id: number;
  email: string;
  username: string;
  fullName?: string;
  role: string;
  planType?: string;
  organizationId?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  trialStartedAt?: string;
  trialStatus?: string;
  oauthProvider?: string;
  oauthId?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
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
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}

export interface GCPCredentials extends CloudCredentials {
  provider: CloudProvider.GCP;
  serviceAccountKey: string;
  projectId?: string;
}

export interface AzureCredentials extends CloudCredentials {
  provider: CloudProvider.AZURE;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  subscriptionId: string;
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
  status: 'open' | 'investigated' | 'resolved';
}

export interface Alert {
  id: number;
  title: string;
  message: string;
  type: 'security' | 'cost' | 'resource';
  severity: 'critical' | 'high' | 'medium' | 'low';
  resourceId?: number;
  createdAt: string;
  status: 'open' | 'acknowledged' | 'resolved';
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
}

export interface CostTrend {
  period: string;
  currentCost: number;
  previousCost: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  dataPoints: { date: string; cost: number }[];
}

export interface CostForecast {
  provider: string;
  period: string;
  forecastedCost: number;
  confidenceLevel: number;
  lowerBound: number;
  upperBound: number;
  currency: string;
  endDate: string;
}

export interface CostOptimization {
  id: string;
  provider: string;
  resourceId: string;
  resourceType: string;
  optimizationType: string;
  description: string;
  estimatedSavings: number;
  confidence: number;
  status: 'open' | 'applied' | 'dismissed';
  detectedAt: string;
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
  frameworkId: string;
  frameworkName: string;
  assessmentDate: string;
  totalControls: number;
  passedControls: number;
  failedControls: number;
  notApplicableControls: number;
  compliancePercent: number;
  status: 'running' | 'completed' | 'failed';
  findings?: string; // JSON string in backend, parsed in frontend usage
}

export interface AssessmentFinding {
  controlId: string;
  controlTitle: string;
  category: string;
  severity: string;
  status: 'passed' | 'failed' | 'not_applicable';
  affectedCount: number;
  affectedResources?: string[];
  remediation: string;
}

export interface FrameworkCompliance {
  frameworkId: string;
  frameworkName: string;
  totalControls: number;
  passedControls: number;
  failedControls: number;
  compliancePercent: number;
  lastAssessment?: string;
}

export interface ComplianceOverview {
  totalControls: number;
  passedControls: number;
  failedControls: number;
  compliancePercent: number;
  byFramework: FrameworkCompliance[];
  bySeverity: Record<string, number>;
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

// Notifications
export interface NotificationPreference {
  id: number;
  userId: number;
  channel: 'email' | 'slack' | 'webhook';
  enabled: boolean;
  settings: Record<string, any>;
  categories: string[]; // ["security", "cost", "compliance"]
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isEnabled: boolean;
  secretToken?: string;
  lastTriggeredAt?: string;
  failureCount: number;
}
