import {
  CostOverview, CostTrend, CostForecast, CostAnomalyPage, CostOptimizationPage, CostSyncSummary, OptimizationAnalysis,
  AIForecastResult, ROIData,
  ComplianceOverview, ComplianceFramework, ComplianceControl, ComplianceAssessment, ComplianceAssessmentDetail, AssessmentFinding,
  ResourceComplianceStatus,
  ScheduledJob, JobExecution, RemediationAction, NotificationPreference,
  Webhook
} from '@/types';
import { apiRequest, unwrapResponse } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, params } = options;

  // Build query string from params
  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `${url.includes('?') ? '&' : '?'}${qs}`;
  }

  // Get Supabase session token for Go backend authentication
  const authHeaders: Record<string, string> = {};
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    authHeaders['Authorization'] = `Bearer ${session.access_token}`;
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
    credentials: 'include',
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    // Handle Go error envelope: { success: false, error: { code, message } }
    const errorJson = await response.json().catch(() => ({ message: 'Request failed' }));
    const errorMsg = errorJson.error?.message || errorJson.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMsg);
  }

  const json = await response.json();
  return unwrapResponse<T>(json);
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type KubernetesConnectorStatus = 'pending' | 'connected' | 'disconnected' | 'revoked';
export type KubernetesInventoryStatus = 'applied' | 'partial' | 'superseded';

export interface KubernetesConnector {
  id: number;
  name: string;
  tokenPrefix: string;
  status: KubernetesConnectorStatus;
  clusterUid?: string;
  kubernetesVersion?: string;
  agentVersion?: string;
  lastSeenAt?: string;
  lastInventoryAt?: string;
  lastSnapshotId?: string;
  inventoryStatus?: KubernetesInventoryStatus;
  resourceCount: number;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KubernetesInventoryResource {
  uid: string;
  apiVersion: string;
  kind: string;
  namespace?: string;
  name: string;
  status: string;
  configuration?: Record<string, unknown>;
}

export interface KubernetesCollectionError {
  resource: string;
  message: string;
}

export interface KubernetesInventorySnapshot {
  id: string;
  connectorId: number;
  clusterUid: string;
  kubernetesVersion?: string;
  agentVersion?: string;
  collectedAt: string;
  receivedAt: string;
  status: KubernetesInventoryStatus;
  complete: boolean;
  resourceCount: number;
  resources?: KubernetesInventoryResource[];
  errors?: KubernetesCollectionError[];
}

export interface KubernetesInventorySnapshotPage {
  items: KubernetesInventorySnapshot[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateKubernetesConnectorResponse {
  connector: KubernetesConnector;
  token: string;
}

export type AIProviderName = 'claude' | 'gemini' | 'openai';

export interface AIConfigEntry {
  provider: AIProviderName;
  model: string;
  isDefault: boolean;
  fallbackOrder: number;
  enabled: boolean;
  updatedAt: string;
}

export interface AIConfiguration {
  userOverride: AIConfigEntry | null;
  orgDefaults: AIConfigEntry[];
  availableProviders: AIProviderName[];
}

export type AIRunStatus = 'queued' | 'running' | 'succeeded' | 'rejected' | 'failed' | 'cancelled';

export interface AIRun {
  id: string;
  organizationId: number;
  actorProfileId: number;
  taskKind: string;
  schemaVersion: string;
  subject: { type: string; id: string };
  provider?: AIProviderName;
  model?: string;
  promptRevision: string;
  engineRevision: string;
  parameterHash: string;
  evidenceRefs: Array<{ type: string; id: string; checksum: string }>;
  status: AIRunStatus;
  attempt: number;
  startedAt?: string;
  finishedAt?: string;
  errorClass?: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  providerRequestId?: string;
  estimatedCostUsd: number;
  redactionProfile: string;
  validationResult: { status?: string };
  warnings: string[];
  outputHash?: string;
  jobId?: string;
  traceId?: string;
  correlationId?: string;
  causationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIRunPage {
  items: AIRun[];
  total: number;
  limit: number;
  offset: number;
}

export interface DriftParams {
  resourceId?: string;
  driftType?: string;
  severity?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface AlertParams {
  type?: string;
  severity?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface ResourceParams {
  provider?: string;
  type?: string;
  region?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface Drift {
  id: number;
  resourceId: number;
  resourceIdStr?: string;
  driftType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  details?: Record<string, unknown>;
  detectedAt: string;
  status: 'detected' | 'acknowledged' | 'resolved' | 'approved';
  baselineConfig?: string;
  currentConfig?: string;
  remediationTips?: string[];
}

export interface DriftSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  open: number;
  remediated: number;
  byType?: Record<string, number>;
}

export interface DriftDetectionResponse {
  message: string;
  scanId?: number;
  jobId?: number;
  jobKind?: string;
  queue?: string;
  duplicate?: boolean;
}

export interface DriftScan {
  id: number;
  queueJobId?: number;
  trigger: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  stage: string;
  progressPercent: number;
  resourcesEvaluated: number;
  baselinesCreated: number;
  driftsDetected: number;
  driftsCreated: number;
  policyViolations: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface DriftScanDetail {
  scan: DriftScan;
  findings: Drift[];
}

export interface VulnerabilityScanResponse {
  message: string;
  scanId?: number;
  jobId?: number;
  jobKind?: string;
  queue?: string;
  duplicate?: boolean;
}

export interface ComplianceAssessmentRunResponse {
  message?: string;
  jobId?: number;
  jobKind?: string;
  queue?: string;
  duplicate?: boolean;
}

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type FindingStatus = 'open' | 'resolved' | 'ignored' | 'false_positive' | 'accepted';
export type FindingType = 'cve' | 'vulnerability' | 'misconfiguration' | 'compliance_violation' | 'exposure' | 'secret' | 'malware';

export interface FindingParams {
  findingType?: string;
  sourceType?: string;
  severity?: string;
  status?: string;
  provider?: string;
  resourceId?: string;
  resourceType?: string;
  scannerType?: string;
  ruleId?: string;
  externalId?: string;
  page?: number;
  pageSize?: number;
}

export interface Finding {
  id: number;
  findingType: FindingType | string;
  sourceType: string;
  sourceId?: number;
  fingerprint: string;
  resourceId?: string;
  provider?: string;
  resourceType?: string;
  scannerType?: string;
  ruleId?: string;
  externalId?: string;
  title: string;
  description?: string;
  severity: FindingSeverity | string;
  status: FindingStatus | string;
  confidence?: string;
  evidence?: string;
  remediation?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindingSummary {
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  total: number;
}

export type QueueJobState = 'available' | 'cancelled' | 'completed' | 'discarded' | 'pending' | 'retryable' | 'running' | 'scheduled';

export interface QueueJobStatus {
  id: number;
  kind: string;
  queue: string;
  state: QueueJobState;
  status: QueueJobState;
  attempt: number;
  maxAttempts: number;
  priority: number;
  createdAt: string;
  scheduledAt: string;
  attemptedAt?: string;
  finalizedAt?: string;
  lastError?: string;
  organizationId: number;
  actorProfileId: number;
}

export interface Alert {
  id: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  resourceId?: number;
  resource?: string;
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
  sourceType?: string;
  sourceScope?: string;
  sourceId?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AlertSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  open: number;
  acknowledged: number;
  resolved: number;
}

export interface Resource {
  id?: number;
  resourceId?: string;
  provider: string;
  name: string;
  type: string;
  region: string;
  status: string;
  tags?: Record<string, string>;
  cost?: number;
  configuration?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Baseline {
  id: number;
  resourceId: string;
  provider: string;
  resourceType: string;
  configuration: string;
  baselineType: 'automatic' | 'approved' | 'manual';
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBaselineRequest {
  resourceId: string;
  provider: string;
  resourceType: string;
  configuration: string;
  baselineType?: string;
  description?: string;
}

export interface Provider {
  provider: string;
  isConnected: boolean;
  lastSynced?: string;
  status?: 'connected' | 'disconnected' | 'partial' | 'error';
  message?: string;
}

export interface ProviderSyncStatus extends Provider {
  resourceCount: number;
  status: 'connected' | 'disconnected' | 'partial' | 'error';
  message?: string;
}

export interface ProviderCredentials {
  roleArn?: string;
  region?: string;
  projectId?: string;
  credentials?: string;
  billingDataset?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  subscriptionId?: string;
  location?: string;
}

export interface DownloadedFile {
  blob: Blob;
  filename: string;
}

function downloadFilename(response: Response, fallback: string): string {
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const candidate = match?.[1]?.split(/[\\/]/).pop()?.trim();
  return candidate?.replace(/[^A-Za-z0-9._-]/g, '_') || fallback;
}

type ProviderWire = {
  provider: string;
  is_connected?: boolean;
  isConnected?: boolean;
  last_synced?: string;
  lastSynced?: string;
  resource_count?: number;
  resourceCount?: number;
  status?: ProviderSyncStatus['status'];
  message?: string;
};

const normalizeProvider = (provider: ProviderWire): Provider => ({
  provider: provider.provider,
  isConnected: provider.is_connected ?? provider.isConnected ?? false,
  lastSynced: provider.last_synced ?? provider.lastSynced,
  status: provider.status,
  message: provider.message,
});

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

export interface Anomaly {
  id: number;
  resourceId: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  expectedValue: number;
  actualValue: number;
  detectedAt: string;
}

export interface Vulnerability {
  id: number;
  scanId?: number;
  resourceId: string | number;
  cveId?: string;
  vulnerabilityId?: string;
  provider?: string;
  resourceType?: string;
  packageName?: string;
  packageVersion?: string;
  fixedVersion?: string;
  scannerType?: string;
  detectionMethod?: string;
  cvssScore?: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  remediation?: string;
  referenceUrls?: string;
  status: 'open' | 'patched' | 'ignored' | 'false_positive' | 'accepted' | 'fixed';
  detectedAt: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  resolvedAt?: string;
}

export interface VulnerabilityScan {
  id: number;
  queueJobId?: number;
  resourceId?: string;
  scanType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  stage?: string;
  progressPercent: number;
  scannerVersion?: string;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  findingsFetched: number;
  findingsNormalized: number;
  findingsReconciled: number;
  sourcesFailed: number;
  scanDuration?: number;
  errorMessage?: string;
  metadata?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface VulnerabilityScanSource {
  id: number;
  provider: string;
  source: string;
  outcome: 'success' | 'success_empty' | 'partial' | 'permission_denied' | 'rate_limited' | 'not_configured' | 'failed';
  durationMs: number;
  findingsFetched: number;
  findingsNormalized: number;
  findingsReconciled: number;
  errorCode?: string;
  errorMessage?: string;
  attemptedAt: string;
  completedAt: string;
}

export interface VulnerabilityScanDetail extends VulnerabilityScan {
  findings: Vulnerability[];
  sources: VulnerabilityScanSource[];
}

// Health Score
export interface HealthIssue {
  title: string;
  description?: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  savings?: string;
  resourceId?: string;
}

export interface HealthScore {
  score: number;
  costIssues: HealthIssue[];
  securityIssues: HealthIssue[];
  breakdown: {
    costScore: number;
    securityScore: number;
  };
}

// Phase 2A: SBOM
export interface SBOMReport {
  id: number;
  user_id: number;
  resource_id: string;
  format: string;
  content: string;
  component_count: number;
  generated_at: string;
  created_at: string;
}

export interface SBOMGenerateRequest {
  resource_id: string;
  image: string;
  format: string;
}

// Phase 2A: Policies (OPA/Rego)
export interface PolicyItem {
  id: number;
  user_id: number;
  name: string;
  description: string;
  rego_code: string;
  category: string;
  severity: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PolicyViolation {
  id: number;
  user_id: number;
  policy_id: number;
  resource_id: string;
  violation_detail: string;
  severity: string;
  status: string;
  detected_at: string;
  created_at: string;
}

export interface PolicyTemplate {
  name: string;
  description: string;
  category: string;
  severity: string;
  rego_code: string;
}

export const api = {
  // ============================================
  // Authentication
  // ============================================
  auth: {
    // Supabase handles login/register/refresh — only Go backend profile endpoints remain
    logout: () => request('/api/logout', { method: 'POST' }),
    me: () => request('/api/user'),
  },

  // ============================================
  // Drifts
  // ============================================
  drifts: {
    list: (params?: DriftParams) => {
      const searchParams = new URLSearchParams();
      if (params?.resourceId) searchParams.set('resource_id', params.resourceId);
      if (params?.driftType) searchParams.set('drift_type', params.driftType);
      if (params?.severity) searchParams.set('severity', params.severity);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('page_size', params.pageSize.toString());

      const query = searchParams.toString();
      return request<PaginatedResponse<Drift>>(`/api/v1/drifts${query ? `?${query}` : ''}`);
    },

    get: (id: number) => request<Drift>(`/api/v1/drifts/${id}`),

    getSummary: () => request<DriftSummary>('/api/v1/drifts/summary'),

    listScans: (page = 1, pageSize = 20) =>
      request<PaginatedResponse<DriftScan>>(`/api/v1/drifts/scans?page=${page}&page_size=${pageSize}`),

    getScan: (id: number) => request<DriftScanDetail>(`/api/v1/drifts/scans/${id}`),

    detect: () => request<DriftDetectionResponse>('/api/v1/drifts/detect', { method: 'POST' }),

    update: (id: number, data: Partial<Drift>) =>
      request(`/api/v1/drifts/${id}`, { method: 'PUT', body: data }),

    delete: (id: number) => request(`/api/v1/drifts/${id}`, { method: 'DELETE' }),
  },

  queue: {
    getJobStatus: (id: number) => request<QueueJobStatus>(`/api/v1/queue/jobs/${id}`),
  },

  // ============================================
  // Baselines
  // ============================================
  baselines: {
    list: () => request<Baseline[]>('/api/baselines'),

    getByResource: (resourceId: string) =>
      request<Baseline>(`/api/baselines/resource/${resourceId}`),

    create: (data: CreateBaselineRequest) =>
      request<{ id: number }>('/api/baselines', { method: 'POST', body: data }),

    delete: (id: number) => request(`/api/baselines/${id}`, { method: 'DELETE' }),
  },

  // ============================================
  // Alerts
  // ============================================
  alerts: {
    list: (params?: AlertParams) => {
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.set('type', params.type);
      if (params?.severity) searchParams.set('severity', params.severity);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('page_size', params.pageSize.toString());

      const query = searchParams.toString();
      return request<PaginatedResponse<Alert>>(`/api/v1/alerts${query ? `?${query}` : ''}`);
    },

    get: (id: number) => request<Alert>(`/api/v1/alerts/${id}`),

    getSummary: () => request<AlertSummary>('/api/v1/alerts/summary'),

    create: (data: Partial<Alert>) =>
      request<{ id: number }>('/api/v1/alerts', { method: 'POST', body: data }),

    update: (id: number, data: Partial<Alert>) =>
      request(`/api/v1/alerts/${id}`, { method: 'PUT', body: data }),

    delete: (id: number) => request(`/api/v1/alerts/${id}`, { method: 'DELETE' }),
  },

  // ============================================
  // Resources
  // ============================================
  resources: {
    list: (params?: ResourceParams) => {
      const searchParams = new URLSearchParams();
      if (params?.provider) searchParams.set('provider', params.provider);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.region) searchParams.set('region', params.region);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('page_size', params.pageSize.toString());

      const query = searchParams.toString();
      return request<PaginatedResponse<Resource>>(`/api/v1/resources${query ? `?${query}` : ''}`);
    },

    get: (id: string | number) => request<Resource>(`/api/v1/resources/${encodeURIComponent(id)}`),

    create: (data: Partial<Resource>) =>
      request<{ id: number }>('/api/v1/resources', { method: 'POST', body: data }),

    update: (id: string | number, data: Partial<Resource>) =>
      request(`/api/v1/resources/${encodeURIComponent(id)}`, { method: 'PUT', body: data }),

    delete: (id: string | number) => request(`/api/v1/resources/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    analyze: (resourceData: Record<string, unknown>) =>
      request<{
        costAnalysis: {
          detected: boolean;
          description: string;
          severity: string;
          recommendations: string[];
          estimatedSavings: number;
        };
        securityAnalysis: {
          detected: boolean;
          description: string;
          severity: string;
          vulnerabilities: string[];
          recommendations: string[];
          complianceImpact: string[];
        };
      }>('/api/v1/resources/analyze', { method: 'POST', body: resourceData }),
  },

  // ============================================
  // Providers
  // ============================================
  providers: {
    list: async () => {
      const providers = await request<ProviderWire[]>('/api/v1/providers');
      return providers.map(normalizeProvider);
    },

    getStatus: async () => {
      const providers = await request<ProviderWire[]>('/api/v1/providers/status');
      return providers.map((provider) => ({
        ...normalizeProvider(provider),
        resourceCount: provider.resource_count ?? provider.resourceCount ?? 0,
        status: provider.status ?? 'disconnected',
        message: provider.message,
      }));
    },

    downloadAWSRoleTemplate: async (): Promise<DownloadedFile> => {
      const response = await apiRequest('POST', '/api/v1/providers/aws/role-template');
      return {
        blob: await response.blob(),
        filename: downloadFilename(response, 'infraudit-aws-read-role.json'),
      };
    },

    connect: (provider: string, credentials: ProviderCredentials) =>
      request(`/api/v1/providers/${provider}/connect`, {
        method: 'POST',
        body: {
          aws_role_arn: credentials.roleArn,
          aws_region: credentials.region,
          gcp_project_id: credentials.projectId,
          gcp_service_account_json: credentials.credentials,
          gcp_billing_dataset: credentials.billingDataset,
          azure_tenant_id: credentials.tenantId,
          azure_client_id: credentials.clientId,
          azure_client_secret: credentials.clientSecret,
          azure_subscription_id: credentials.subscriptionId,
          azure_location: credentials.location,
        },
      }),

    sync: (provider: string) =>
      request(`/api/v1/providers/${provider}/sync`, { method: 'POST' }),

    disconnect: (provider: string) =>
      request(`/api/v1/providers/${provider}`, { method: 'DELETE' }),
  },

  // ============================================
  // Recommendations
  // ============================================
  recommendations: {
    list: () => request<PaginatedResponse<Recommendation>>('/api/recommendations'),

    get: (id: number) => request<Recommendation>(`/api/recommendations/${id}`),

    generate: () =>
      request<{ message: string }>('/api/recommendations/generate', { method: 'POST' }),

    getSavings: () => request<{ totalSavings: number }>('/api/recommendations/savings'),

    update: (id: number, data: Partial<Recommendation>) =>
      request(`/api/recommendations/${id}`, { method: 'PUT', body: data }),
  },

  // ============================================
  // Anomalies
  // ============================================
  anomalies: {
    list: () => request<PaginatedResponse<Anomaly>>('/api/anomalies'),

    get: (id: number) => request<Anomaly>(`/api/anomalies/${id}`),

    getSummary: () => request<Record<string, number>>('/api/anomalies/summary'),

    detect: () => request<{ message: string }>('/api/anomalies/detect', { method: 'POST' }),
  },

  // ============================================
  // Vulnerabilities
  // ============================================
  vulnerabilities: {
    list: (page = 1, pageSize = 100) => request<PaginatedResponse<Vulnerability>>('/api/v1/vulnerabilities', { params: { page, page_size: pageSize } }),

    get: (id: number) => request<Vulnerability>(`/api/v1/vulnerabilities/${id}`),

    getSummary: () => request<Record<string, number>>('/api/v1/vulnerabilities/summary'),

    getTop: () => request<Vulnerability[]>('/api/v1/vulnerabilities/top'),

    scan: () => request<VulnerabilityScanResponse>('/api/v1/vulnerabilities/scan', { method: 'POST' }),

    listScans: (page = 1, pageSize = 10) => request<PaginatedResponse<VulnerabilityScan>>('/api/v1/vulnerabilities/scans', { params: { page, page_size: pageSize } }),

    getScan: (id: number) => request<VulnerabilityScanDetail>(`/api/v1/vulnerabilities/scans/${id}`),
  },

  // ============================================
  // Normalized Findings
  // ============================================
  findings: {
    list: (params?: FindingParams) => {
      const searchParams = new URLSearchParams();
      if (params?.findingType) searchParams.set('finding_type', params.findingType);
      if (params?.sourceType) searchParams.set('source_type', params.sourceType);
      if (params?.severity) searchParams.set('severity', params.severity);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.provider) searchParams.set('provider', params.provider);
      if (params?.resourceId) searchParams.set('resource_id', params.resourceId);
      if (params?.resourceType) searchParams.set('resource_type', params.resourceType);
      if (params?.scannerType) searchParams.set('scanner_type', params.scannerType);
      if (params?.ruleId) searchParams.set('rule_id', params.ruleId);
      if (params?.externalId) searchParams.set('external_id', params.externalId);
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('page_size', params.pageSize.toString());

      const query = searchParams.toString();
      return request<PaginatedResponse<Finding>>(`/api/v1/findings${query ? `?${query}` : ''}`);
    },

    get: (id: number) => request<Finding>(`/api/v1/findings/${id}`),

    getSummary: () => request<FindingSummary>('/api/v1/findings/summary'),

    updateStatus: (id: number, status: FindingStatus) =>
      request<{ message: string }>(`/api/v1/findings/${id}/status`, {
        method: 'PUT',
        body: { status },
      }),
  },

  // ============================================
  // Kubernetes
  // ============================================
  kubernetes: {
    listClusters: () => request('/api/kubernetes/clusters'),

    getCluster: (id: string) => request(`/api/kubernetes/clusters/${id}`),

    registerCluster: (data: { name: string; kubeconfig: string }) =>
      request('/api/kubernetes/clusters', { method: 'POST', body: data }),

    deleteCluster: (id: string) =>
      request(`/api/kubernetes/clusters/${id}`, { method: 'DELETE' }),

    syncCluster: (id: string) =>
      request(`/api/kubernetes/clusters/${id}/sync`, { method: 'POST' }),

    getStats: () => request('/api/kubernetes/stats'),

    listNamespaces: (clusterId: string) =>
      request(`/api/kubernetes/clusters/${clusterId}/namespaces`),

    listDeployments: (clusterId: string) =>
      request(`/api/kubernetes/clusters/${clusterId}/deployments`),

    listPods: (clusterId: string) =>
      request(`/api/kubernetes/clusters/${clusterId}/pods`),

    listServices: (clusterId: string) =>
      request(`/api/kubernetes/clusters/${clusterId}/services`),

    listConnectors: () =>
      request<KubernetesConnector[]>('/api/v1/kubernetes/connectors'),

    createConnector: (name: string) =>
      request<CreateKubernetesConnectorResponse>('/api/v1/kubernetes/connectors', {
        method: 'POST',
        body: { name },
      }),

    revokeConnector: (id: number) =>
      request(`/api/v1/kubernetes/connectors/${id}`, { method: 'DELETE' }),

    listInventorySnapshots: (connectorId: number, limit = 20, offset = 0) =>
      request<KubernetesInventorySnapshotPage>(`/api/v1/kubernetes/connectors/${connectorId}/snapshots`, {
        params: { limit, offset },
      }),

    getInventorySnapshot: (connectorId: number, snapshotId: string) =>
      request<KubernetesInventorySnapshot>(`/api/v1/kubernetes/connectors/${connectorId}/snapshots/${snapshotId}`),
  },

  // ============================================
  // IaC (Infrastructure as Code)
  // ============================================
  iac: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`${API_BASE}/api/iac/upload`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorJson.error?.message || errorJson.message || `HTTP error! status: ${res.status}`);
      }
      return res.json();
    },

    listDefinitions: () => request('/api/iac/definitions'),

    getDefinition: (id: string) => request(`/api/iac/definitions/${id}`),

    deleteDefinition: (id: string) =>
      request(`/api/iac/definitions/${id}`, { method: 'DELETE' }),

    detectDrift: () =>
      request('/api/iac/drifts/detect', { method: 'POST' }),

    listDrifts: () => request('/api/iac/drifts'),

    getDriftSummary: () => request('/api/iac/drifts/summary'),
  },

  // ============================================
  // Billing
  // ============================================
  billing: {
    getPlans: () => request('/api/billing/plans'),

    getInfo: () => request('/api/billing/info'),

    updatePlan: (planId: string) =>
      request('/api/billing/subscription', { method: 'POST', body: { planId } }),

    createCheckout: (planId: string) =>
      request('/api/billing/checkout', { method: 'POST', body: { planId } }),
  },

  // ============================================
  // Phase 3: Cloud Cost Analytics
  // ============================================
  costs: {
    getOverview: () => request<CostOverview>('/api/v1/costs'),

    getByProvider: (provider: string, period?: string) => {
      const params = new URLSearchParams();
      if (period) params.set('period', period);
      return request<any>(`/api/v1/costs/${provider}?${params.toString()}`);
    },

    getTrends: (provider?: string, period?: string) => {
      const params = new URLSearchParams();
      if (provider) params.set('provider', provider);
      if (period) params.set('period', period);
      return request<CostTrend>(`/api/v1/costs/trends?${params.toString()}`);
    },

    getForecast: (provider?: string, days?: number, model?: string) => {
      const params = new URLSearchParams();
      if (provider) params.set('provider', provider);
      if (days) params.set('days', days.toString());
      if (model) params.set('model', model);
      return request<CostForecast>(`/api/v1/costs/forecast?${params.toString()}`);
    },

    getAIForecast: () => request<AIForecastResult>('/api/v1/costs/forecast/ai', { method: 'POST' }),
    getROI: () => request<ROIData>('/api/v1/costs/roi'),

    sync: (provider?: string) => {
      const params = new URLSearchParams();
      if (provider) params.set('provider', provider);
      const qs = params.toString();
      return request<CostSyncSummary>(`/api/v1/costs/sync${qs ? `?${qs}` : ''}`, { method: 'POST' });
    },

    getSavings: () => request<{ potentialSavings: number }>('/api/v1/costs/savings'),

    listAnomalies: (status?: string, limit?: number, offset?: number) => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (limit) params.set('limit', limit.toString());
      if (offset) params.set('offset', offset.toString());
      return request<CostAnomalyPage>(`/api/v1/costs/anomalies?${params.toString()}`);
    },

    detectAnomalies: (provider?: string) => {
      const params = new URLSearchParams();
      if (provider) params.set('provider', provider);
      const qs = params.toString();
      return request<{ message: string; detected: number }>(`/api/v1/costs/anomalies/detect${qs ? `?${qs}` : ''}`, { method: 'POST' });
    },

    updateAnomaly: (id: string | number, status: 'open' | 'reviewed' | 'resolved', notes?: string) =>
      request<{ status: string }>(`/api/v1/costs/anomalies/${id}`, {
        method: 'PATCH', body: { status, notes },
      }),

    listOptimizations: (status?: string, limit?: number, offset?: number) => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (limit) params.set('limit', limit.toString());
      if (offset) params.set('offset', offset.toString());
      return request<CostOptimizationPage>(`/api/v1/costs/optimizations?${params.toString()}`);
    },

    generateOptimizations: (provider?: string) => {
      const params = new URLSearchParams();
      if (provider) params.set('provider', provider);
      const qs = params.toString();
      return request<OptimizationAnalysis>(`/api/v1/costs/optimizations/generate${qs ? `?${qs}` : ''}`, { method: 'POST' });
    },

    updateOptimization: (id: string, status: 'acknowledged' | 'planned' | 'applied' | 'verified' | 'dismissed', notes?: string) =>
      request<{ status: string }>(`/api/v1/costs/optimizations/${id}`, {
        method: 'PATCH', body: { status, notes },
      }),
  },

  // ============================================
  // Phase 4: Compliance Framework
  // ============================================
  compliance: {
    getOverview: () => request<ComplianceOverview>('/api/v1/compliance/overview'),

    getTrend: (frameworkId: string, days?: number) => {
      const params = new URLSearchParams();
      if (frameworkId) params.set('framework_id', frameworkId);
      if (days) params.set('days', days.toString());
      return request<any>(`/api/v1/compliance/trend?${params.toString()}`);
    },

    listFrameworks: () =>
      request<any>('/api/v1/compliance/frameworks').then(
        (res) => (Array.isArray(res) ? res : res?.frameworks || []) as ComplianceFramework[]
      ),

    getFramework: (id: string) => request<ComplianceFramework>(`/api/v1/compliance/frameworks/${id}`),

    enableFramework: (id: string) => request(`/api/v1/compliance/frameworks/${id}/enable`, { method: 'POST' }),

    disableFramework: (id: string) => request(`/api/v1/compliance/frameworks/${id}/disable`, { method: 'POST' }),

    listControls: (frameworkId: string, category?: string) => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      return request<any>(`/api/v1/compliance/frameworks/${frameworkId}/controls?${params.toString()}`).then(
        (res) => (Array.isArray(res) ? res : res?.controls || []) as ComplianceControl[]
      );
    },

    runAssessment: (frameworkId: string) =>
      request<ComplianceAssessment | ComplianceAssessmentRunResponse>('/api/v1/compliance/assess', {
        method: 'POST', body: { framework_id: frameworkId }
      }),

    listAssessments: (frameworkId?: string, limit?: number, offset?: number) => {
      const params = new URLSearchParams();
      if (frameworkId) params.set('framework_id', frameworkId);
      if (limit) params.set('limit', limit.toString());
      if (offset) params.set('offset', offset.toString());
      return request<any>(`/api/v1/compliance/assessments?${params.toString()}`).then(
        (res) => (Array.isArray(res) ? res : res?.assessments || []) as ComplianceAssessment[]
      );
    },

    getAssessment: (id: string) => request<ComplianceAssessmentDetail>(`/api/v1/compliance/assessments/${id}`),

    exportAssessment: (id: string) => request(`/api/v1/compliance/assessments/${id}/export`),

    getFailingControls: (frameworkId: string) => {
      const params = new URLSearchParams();
      params.set('framework_id', frameworkId);
      return request<any>(`/api/v1/compliance/controls/failing?${params.toString()}`).then(
        (res) => (Array.isArray(res) ? res : res?.failingControls || []) as AssessmentFinding[]
      );
    },

    getResourceCompliance: (resourceId: string) =>
      request<ResourceComplianceStatus>(`/api/v1/compliance/resources/${resourceId}`),
  },

  // ============================================
  // Phase 5: Automation & Orchestration (Jobs)
  // ============================================
  jobs: {
    list: () => request<ScheduledJob[]>('/api/v1/jobs'),

    create: (job: Partial<ScheduledJob>) =>
      request<{ id: string }>('/api/v1/jobs', { method: 'POST', body: job }),

    get: (id: string) => request<ScheduledJob>(`/api/v1/jobs/${id}`),

    update: (id: string, job: Partial<ScheduledJob>) =>
      request(`/api/v1/jobs/${id}`, { method: 'PUT', body: job }),

    delete: (id: string) => request(`/api/v1/jobs/${id}`, { method: 'DELETE' }),

    trigger: (id: string) => request(`/api/v1/jobs/${id}/run`, { method: 'POST' }),

    getExecutions: (id: string) => request<JobExecution[]>(`/api/v1/jobs/${id}/executions`),

    getTypes: () => request<string[]>('/api/v1/jobs/types'),
  },

  // ============================================
  // Phase 5: Remediation
  // ============================================
  remediation: {
    getSummary: () => request('/api/v1/remediation/summary'),

    getPendingApprovals: () => request<RemediationAction[]>('/api/v1/remediation/pending'),

    suggestForDrift: (driftId: number) =>
      request(`/api/v1/remediation/suggest/drift/${driftId}`, { method: 'POST' }),

    suggestForVulnerability: (vulnId: number) =>
      request(`/api/v1/remediation/suggest/vulnerability/${vulnId}`, { method: 'POST' }),

    listActions: (status?: string) => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      return request<RemediationAction[]>('/api/v1/remediation/actions?' + params.toString());
    },

    executeAction: (id: string) => request(`/api/v1/remediation/actions/${id}/execute`, { method: 'POST' }),

    approveAction: (id: string) => request(`/api/v1/remediation/actions/${id}/approve`, { method: 'POST' }),

    rollbackAction: (id: string) => request(`/api/v1/remediation/actions/${id}/rollback`, { method: 'POST' }),
  },

  // ============================================
  // Phase 6: Notifications & Webhooks
  // ============================================
  notifications: {
    getPreferences: async () => {
      const res = await request<any>('/api/v1/notifications/preferences');
      // Backend wraps in {preferences: [...]}, unwrap it
      return res?.preferences || res || [];
    },

    updatePreference: (channel: string, settings: any) => {
      const { enabled, isEnabled, is_enabled, ...config } = settings;
      return request(`/api/v1/notifications/preferences/${channel}`, {
        method: 'PUT',
        body: { is_enabled: enabled ?? isEnabled ?? is_enabled ?? true, config },
      });
    },

    getHistory: (limit?: number, offset?: number) => {
      const params = new URLSearchParams();
      if (limit) params.set('limit', limit.toString());
      if (offset) params.set('offset', offset.toString());
      return request('/api/v1/notifications/history?' + params.toString());
    },

    send: (channel: string, message: string) =>
      request('/api/v1/notifications/send', {
        method: 'POST',
        body: {
          type: 'test_notification',
          priority: 'low',
          title: `Test ${channel} notification`,
          message,
          data: { channel },
        },
      }),
  },

  webhooks: {
    list: () => request<Webhook[]>('/api/v1/webhooks'),

    create: (webhook: any) =>
      request<{ id: string }>('/api/v1/webhooks', { method: 'POST', body: webhook }),

    get: (id: string) => request<Webhook>(`/api/v1/webhooks/${id}`),

    update: (id: string, webhook: any) =>
      request(`/api/v1/webhooks/${id}`, { method: 'PUT', body: webhook }),

    delete: (id: string) => request(`/api/v1/webhooks/${id}`, { method: 'DELETE' }),

    test: (id: string) => request(`/api/v1/webhooks/${id}/test`, { method: 'POST' }),

    getEvents: () => request<string[]>('/api/v1/webhooks/events'),
  },

  // ============================================
  // Health Score
  // ============================================
  healthScore: {
    get: () => request<HealthScore>("/api/v1/health-score"),
  },

  // ============================================
  // Phase 2A: SBOM
  // ============================================
  sbom: {
    generate: (data: SBOMGenerateRequest) =>
      request<SBOMReport>('/api/v1/sbom/generate', { method: 'POST', body: data }),

    list: (params?: { resource_id?: string; page?: number; page_size?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.resource_id) searchParams.set('resource_id', params.resource_id);
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
      const qs = searchParams.toString();
      return request<{ data: SBOMReport[]; totalItems: number; page: number; pageSize: number; totalPages: number }>(
        `/api/v1/sbom/reports${qs ? `?${qs}` : ''}`
      );
    },

    get: (id: number) => request<SBOMReport>(`/api/v1/sbom/reports/${id}`),

    download: async (id: number) => {
      const report = await request<SBOMReport>(`/api/v1/sbom/reports/${id}`);
      const blob = new Blob([report.content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sbom-${id}.${report.format}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    delete: (id: number) =>
      request(`/api/v1/sbom/reports/${id}`, { method: 'DELETE' }),
  },

  // ============================================
  // Intelligence Engine
  // ============================================
  ai: {
    listProviders: () => request<AIProviderName[]>('/api/v1/ai/providers'),
    getConfig: () => request<AIConfiguration>('/api/v1/ai/config'),
    updateOrgConfig: (providers: Array<{
      provider: AIProviderName;
      is_default: boolean;
      fallback_order: number;
    }>) => request<void>('/api/v1/ai/config/org', {
      method: 'PUT',
      body: { providers },
    }),
    listRuns: (params: { status?: AIRunStatus; taskKind?: string; limit?: number; offset?: number } = {}) => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.set('status', params.status);
      if (params.taskKind) searchParams.set('task_kind', params.taskKind);
      if (params.limit !== undefined) searchParams.set('limit', params.limit.toString());
      if (params.offset !== undefined) searchParams.set('offset', params.offset.toString());
      const query = searchParams.toString();
      return request<AIRunPage>(`/api/v1/ai/runs${query ? `?${query}` : ''}`);
    },
  },

  // ============================================
  // Phase 2A: Policies (OPA/Rego)
  // ============================================
  policies: {
    list: () => request<PolicyItem[]>('/api/v1/policies'),

    get: (id: number) => request<PolicyItem>(`/api/v1/policies/${id}`),

    create: (data: { name: string; description: string; rego_code: string; category: string; severity: string }) =>
      request<PolicyItem>('/api/v1/policies', { method: 'POST', body: data }),

    update: (id: number, data: Partial<PolicyItem>) =>
      request(`/api/v1/policies/${id}`, { method: 'PUT', body: data }),

    delete: (id: number) =>
      request(`/api/v1/policies/${id}`, { method: 'DELETE' }),

    listTemplates: () => request<PolicyTemplate[]>('/api/v1/policies/templates'),

    generate: (description: string) =>
      request<{ regoCode: string }>('/api/v1/policies/generate', { method: 'POST', body: { description } }),

    evaluate: () =>
      request<{ new_violations: number }>('/api/v1/policies/evaluate', { method: 'POST' }),

    listViolations: (params?: { policy_id?: number; status?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.policy_id) searchParams.set('policy_id', params.policy_id.toString());
      if (params?.status) searchParams.set('status', params.status);
      const qs = searchParams.toString();
      return request<PolicyViolation[]>(`/api/v1/policies/violations${qs ? `?${qs}` : ''}`);
    },

    updateViolationStatus: (id: number, status: string) =>
      request(`/api/v1/policies/violations/${id}/status`, { method: 'PUT', body: { status } }),
  },
};

export default api;
