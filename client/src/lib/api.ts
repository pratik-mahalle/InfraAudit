const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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

export interface Alert {
  id: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  resourceId?: number;
  status: 'open' | 'acknowledged' | 'resolved';
  createdAt: string;
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
  id: number;
  resourceId?: string;
  provider: string;
  name: string;
  type: string;
  region: string;
  status: string;
  tags?: Record<string, string>;
  cost: number;
  configuration?: string;
  createdAt: string;
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
  id: number;
  provider: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncAt?: string;
}

export interface ProviderCredentials {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  projectId?: string;
  credentials?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  subscriptionId?: string;
}

export interface Recommendation {
  id: number;
  resourceId?: number;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedSavings?: number;
  status: 'pending' | 'applied' | 'dismissed';
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
  resourceId: number;
  cveId?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  remediation?: string;
  status: 'open' | 'fixed' | 'ignored';
  detectedAt: string;
}

export const api = {
  // ============================================
  // Authentication
  // ============================================
  auth: {
    login: (email: string, password: string) =>
      request('/api/login', { method: 'POST', body: { email, password } }),

    register: (data: { email: string; password: string; username?: string; fullName?: string }) =>
      request('/api/register', { method: 'POST', body: data }),

    logout: () => request('/api/logout', { method: 'POST' }),

    me: () => request('/api/user'),

    refresh: (refreshToken: string) =>
      request('/api/auth/refresh', { method: 'POST', body: { refreshToken } }),
  },

  // ============================================
  // Drifts
  // ============================================
  drifts: {
    list: (params?: DriftParams) => {
      const searchParams = new URLSearchParams();
      if (params?.resourceId) searchParams.set('resourceId', params.resourceId);
      if (params?.driftType) searchParams.set('driftType', params.driftType);
      if (params?.severity) searchParams.set('severity', params.severity);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      
      const query = searchParams.toString();
      return request<PaginatedResponse<Drift>>(`/api/drifts${query ? `?${query}` : ''}`);
    },

    get: (id: number) => request<Drift>(`/api/drifts/${id}`),

    getSummary: () => request<DriftSummary>('/api/drifts/summary'),

    detect: () => request<{ message: string }>('/api/drifts/detect', { method: 'POST' }),

    update: (id: number, data: Partial<Drift>) =>
      request(`/api/drifts/${id}`, { method: 'PUT', body: data }),

    delete: (id: number) => request(`/api/drifts/${id}`, { method: 'DELETE' }),
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
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      
      const query = searchParams.toString();
      return request<PaginatedResponse<Alert>>(`/api/alerts${query ? `?${query}` : ''}`);
    },

    get: (id: number) => request<Alert>(`/api/alerts/${id}`),

    getSummary: () => request<AlertSummary>('/api/alerts/summary'),

    create: (data: Partial<Alert>) =>
      request<{ id: number }>('/api/alerts', { method: 'POST', body: data }),

    update: (id: number, data: Partial<Alert>) =>
      request(`/api/alerts/${id}`, { method: 'PUT', body: data }),

    delete: (id: number) => request(`/api/alerts/${id}`, { method: 'DELETE' }),
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
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      
      const query = searchParams.toString();
      return request<PaginatedResponse<Resource>>(`/api/resources${query ? `?${query}` : ''}`);
    },

    get: (id: number) => request<Resource>(`/api/resources/${id}`),

    create: (data: Partial<Resource>) =>
      request<{ id: number }>('/api/resources', { method: 'POST', body: data }),

    update: (id: number, data: Partial<Resource>) =>
      request(`/api/resources/${id}`, { method: 'PUT', body: data }),

    delete: (id: number) => request(`/api/resources/${id}`, { method: 'DELETE' }),
  },

  // ============================================
  // Providers
  // ============================================
  providers: {
    list: () => request<Provider[]>('/api/providers'),

    getStatus: () => request<Record<string, Provider>>('/api/providers/status'),

    connect: (provider: string, credentials: ProviderCredentials) =>
      request(`/api/providers/${provider}/connect`, { method: 'POST', body: credentials }),

    sync: (provider: string) =>
      request(`/api/providers/${provider}/sync`, { method: 'POST' }),

    disconnect: (provider: string) =>
      request(`/api/providers/${provider}`, { method: 'DELETE' }),
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
  },

  // ============================================
  // Vulnerabilities
  // ============================================
  vulnerabilities: {
    list: () => request<PaginatedResponse<Vulnerability>>('/api/vulnerabilities'),

    get: (id: number) => request<Vulnerability>(`/api/vulnerabilities/${id}`),

    getSummary: () => request<Record<string, number>>('/api/vulnerabilities/summary'),

    getTop: () => request<Vulnerability[]>('/api/vulnerabilities/top'),

    scan: () => request<{ message: string }>('/api/vulnerabilities/scan', { method: 'POST' }),
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
  },

  // ============================================
  // IaC (Infrastructure as Code)
  // ============================================
  iac: {
    upload: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${API_BASE}/api/iac/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }).then(res => res.json());
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
};

export default api;
