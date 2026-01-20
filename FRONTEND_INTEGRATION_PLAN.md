# Frontend Integration Plan for InfraAudit

## Overview

This document outlines the frontend pages, components, and API hooks needed to support the new backend features implemented in Phases 2-6.

---

## Current Frontend State Analysis

### Existing Pages
| Page | File | Status |
|------|------|--------|
| Dashboard | `pages/Dashboard.tsx` | ✅ Exists |
| Security Monitoring | `pages/SecurityMonitoring.tsx` | ✅ Exists (has drift monitoring) |
| Cost Optimization | `pages/CostOptimization.tsx` | ✅ Exists (basic cost features) |
| Cost Prediction | `pages/CostPrediction.tsx` | ✅ Exists |
| Cloud Providers | `pages/CloudProviders.tsx` | ✅ Exists (minimal) |
| Settings | `pages/Settings.tsx` | ✅ Exists |
| Kubernetes | `pages/KubernetesPage.tsx` | ✅ Exists (stub) |

### Existing Hooks
| Hook | File | Purpose |
|------|------|---------|
| `use-drifts.ts` | Security drifts | ✅ Works with backend |
| `use-alerts.ts` | Alert management | ✅ Works with backend |
| `use-resources.ts` | Resource listing | ✅ Works with backend |
| `use-providers.ts` | Provider connections | ✅ Works with backend |
| `use-vulnerabilities.ts` | Vulnerability data | ✅ Works with backend |

### Current API Client (`lib/api.ts`)
Currently supports: auth, drifts, baselines, alerts, resources, providers, recommendations, anomalies, vulnerabilities, kubernetes, iac, billing.

---

## Required Frontend Updates

### Phase 2: Security Scanner Integration

**API Additions to `lib/api.ts`:**
```typescript
// IaC Security Scanners
scanners: {
  // Run Checkov scan on IaC files
  runCheckovScan: (path: string) => 
    request('/api/v1/scanners/checkov', { method: 'POST', body: { path } }),
  
  // Run tfsec scan on Terraform files
  runTfsecScan: (path: string) => 
    request('/api/v1/scanners/tfsec', { method: 'POST', body: { path } }),
  
  // Get scan history
  getScanHistory: (limit?: number) => 
    request('/api/v1/scanners/history', { params: { limit } }),
  
  // Get scan results by ID
  getScanResults: (scanId: string) => 
    request(`/api/v1/scanners/results/${scanId}`),
},
```

**UI Updates:**
1. **SecurityMonitoring.tsx** - Add tab for "IaC Security Scans"
   - Show scan history
   - Trigger new scans (Checkov, tfsec)
   - Display scan results with severity breakdown
   
2. **New Component: `components/security/IaCScanResults.tsx`**
   - Display vulnerabilities found by scanners
   - Link to remediation suggestions

---

### Phase 3: Cloud Cost Analytics 🚀

**API Additions to `lib/api.ts`:**
```typescript
// Cloud Cost Analytics
costs: {
  // Get cost overview
  getOverview: () => 
    request<CostOverview>('/api/v1/costs'),
  
  // Get costs by provider
  getByProvider: (provider: string, period?: string) => 
    request<CostSummary>(`/api/v1/costs/${provider}`, { params: { period } }),
  
  // Get cost trends
  getTrends: (provider?: string, period?: string) => 
    request<CostTrend>('/api/v1/costs/trends', { params: { provider, period } }),
  
  // Get cost forecast
  getForecast: (provider?: string, days?: number) => 
    request<CostForecast>('/api/v1/costs/forecast', { params: { provider, days } }),
  
  // Sync costs from providers
  sync: (provider?: string) => 
    request('/api/v1/costs/sync', { method: 'POST', params: { provider } }),
  
  // Get potential savings
  getSavings: () => 
    request<{ potential_savings: number }>('/api/v1/costs/savings'),
  
  // Cost anomalies
  listAnomalies: (status?: string, limit?: number, offset?: number) => 
    request<{ anomalies: CostAnomaly[], total: number }>('/api/v1/costs/anomalies', { 
      params: { status, limit, offset } 
    }),
  
  // Detect new anomalies
  detectAnomalies: (provider?: string) => 
    request('/api/v1/costs/anomalies/detect', { method: 'POST', params: { provider } }),
  
  // Cost optimizations
  listOptimizations: (status?: string, limit?: number, offset?: number) => 
    request<{ optimizations: CostOptimization[], total: number }>('/api/v1/costs/optimizations', { 
      params: { status, limit, offset } 
    }),
},
```

**TypeScript Interfaces:**
```typescript
interface CostOverview {
  total_cost: number;
  monthly_cost: number;
  daily_cost: number;
  currency: string;
  by_provider: Record<string, number>;
  top_services: ServiceCost[];
  trend?: CostTrend;
  anomaly_count: number;
  potential_savings: number;
}

interface ServiceCost {
  provider?: string;
  service_name: string;
  cost: number;
  percentage: number;
}

interface CostTrend {
  period: string;
  current_cost: number;
  previous_cost: number;
  change_percent: number;
  trend: 'up' | 'down' | 'stable';
  data_points: { date: string; cost: number }[];
}

interface CostForecast {
  provider: string;
  forecasted_cost: number;
  confidence_level: number;
  lower_bound: number;
  upper_bound: number;
  currency: string;
  end_date: string;
}

interface CostAnomaly {
  id: string;
  provider: string;
  service_name: string;
  resource_id?: string;
  anomaly_type: 'spike' | 'drop' | 'unusual_pattern';
  expected_cost: number;
  actual_cost: number;
  deviation: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'reviewed' | 'resolved';
  detected_at: string;
}

interface CostOptimization {
  id: string;
  provider: string;
  resource_type: string;
  optimization_type: string;
  title: string;
  description: string;
  current_cost: number;
  estimated_savings: number;
  savings_percent: number;
  implementation: 'easy' | 'moderate' | 'complex';
  status: 'pending' | 'applied' | 'dismissed';
}
```

**UI Updates:**

1. **CostOptimization.tsx** - Major enhancement
   - Replace mock data with real API calls
   - Add provider breakdown chart
   - Add forecast visualization
   - Show real optimization recommendations
   - Update anomaly detection to use new backend

2. **New Hook: `hooks/use-costs.ts`**
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCostOverview() {
  return useQuery({
    queryKey: ['/api/v1/costs'],
    queryFn: () => api.costs.getOverview(),
  });
}

export function useCostTrends(provider?: string, period?: string) {
  return useQuery({
    queryKey: ['/api/v1/costs/trends', provider, period],
    queryFn: () => api.costs.getTrends(provider, period),
  });
}

export function useCostAnomalies(status?: string) {
  return useQuery({
    queryKey: ['/api/v1/costs/anomalies', status],
    queryFn: () => api.costs.listAnomalies(status),
  });
}

export function useCostOptimizations(status?: string) {
  return useQuery({
    queryKey: ['/api/v1/costs/optimizations', status],
    queryFn: () => api.costs.listOptimizations(status),
  });
}

export function useSyncCosts() {
  return useMutation({
    mutationFn: (provider?: string) => api.costs.sync(provider),
  });
}
```

3. **New Component: `components/cost/CostProviderBreakdown.tsx`**
   - Pie/donut chart showing cost by provider (AWS, GCP, Azure)

4. **New Component: `components/cost/CostOptimizationsList.tsx`**
   - List of actionable optimization recommendations
   - Apply/dismiss actions

---

### Phase 4: Compliance Framework 🆕

**API Additions to `lib/api.ts`:**
```typescript
// Compliance Framework
compliance: {
  // Get compliance overview
  getOverview: () => 
    request<ComplianceOverview>('/api/v1/compliance/overview'),
  
  // Get compliance trend
  getTrend: (frameworkId: string, days?: number) => 
    request<ComplianceTrend>('/api/v1/compliance/trend', { params: { framework_id: frameworkId, days } }),
  
  // List frameworks
  listFrameworks: () => 
    request<{ frameworks: ComplianceFramework[] }>('/api/v1/compliance/frameworks'),
  
  // Get framework details
  getFramework: (id: string) => 
    request<ComplianceFramework>(`/api/v1/compliance/frameworks/${id}`),
  
  // Enable/disable framework
  enableFramework: (id: string) => 
    request(`/api/v1/compliance/frameworks/${id}/enable`, { method: 'POST' }),
  disableFramework: (id: string) => 
    request(`/api/v1/compliance/frameworks/${id}/disable`, { method: 'POST' }),
  
  // List controls for a framework
  listControls: (frameworkId: string, category?: string) => 
    request<{ controls: ComplianceControl[] }>(`/api/v1/compliance/frameworks/${frameworkId}/controls`, {
      params: { category }
    }),
  
  // Run assessment
  runAssessment: (frameworkId: string) => 
    request<ComplianceAssessment>('/api/v1/compliance/assess', { 
      method: 'POST', body: { framework_id: frameworkId } 
    }),
  
  // List assessments
  listAssessments: (frameworkId?: string, limit?: number, offset?: number) => 
    request<{ assessments: ComplianceAssessment[], total: number }>('/api/v1/compliance/assessments', {
      params: { framework_id: frameworkId, limit, offset }
    }),
  
  // Get assessment details
  getAssessment: (id: string) => 
    request(`/api/v1/compliance/assessments/${id}`),
  
  // Export assessment
  exportAssessment: (id: string) => 
    request(`/api/v1/compliance/assessments/${id}/export`),
  
  // Get failing controls
  getFailingControls: (frameworkId: string) => 
    request<{ failing_controls: AssessmentFinding[] }>('/api/v1/compliance/controls/failing', {
      params: { framework_id: frameworkId }
    }),
},
```

**TypeScript Interfaces:**
```typescript
interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  provider?: string;
  is_enabled: boolean;
}

interface ComplianceControl {
  id: string;
  control_id: string;
  title: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  remediation?: string;
  reference_url?: string;
}

interface ComplianceAssessment {
  id: string;
  framework_id: string;
  framework_name: string;
  assessment_date: string;
  total_controls: number;
  passed_controls: number;
  failed_controls: number;
  not_applicable_controls: number;
  compliance_percent: number;
  status: 'running' | 'completed' | 'failed';
}

interface AssessmentFinding {
  control_id: string;
  control_title: string;
  category: string;
  severity: string;
  status: 'passed' | 'failed' | 'not_applicable';
  affected_count: number;
  affected_resources?: string[];
  remediation: string;
}

interface ComplianceOverview {
  total_controls: number;
  passed_controls: number;
  failed_controls: number;
  compliance_percent: number;
  by_framework: FrameworkCompliance[];
  by_severity: Record<string, number>;
}

interface FrameworkCompliance {
  framework_id: string;
  framework_name: string;
  total_controls: number;
  passed_controls: number;
  failed_controls: number;
  compliance_percent: number;
  last_assessment?: string;
}
```

**New Page: `pages/Compliance.tsx`** 🆕
- Compliance dashboard with overall score
- Framework selector (CIS, NIST, SOC2, etc.)
- Control categories breakdown
- Recent assessment history
- Failing controls list with remediation
- Run new assessment button

**New Components:**
1. `components/compliance/ComplianceScoreCard.tsx` - Overall compliance score gauge
2. `components/compliance/FrameworkSelector.tsx` - Dropdown/tabs for framework selection
3. `components/compliance/ControlsTable.tsx` - List of controls with status
4. `components/compliance/AssessmentHistory.tsx` - Historical assessments
5. `components/compliance/FailingControlsList.tsx` - Prioritized failing controls

**New Hook: `hooks/use-compliance.ts`**

---

### Phase 5: Automation & Orchestration 🆕

**API Additions to `lib/api.ts`:**
```typescript
// Jobs & Automation
jobs: {
  // List jobs
  list: () => 
    request<{ jobs: ScheduledJob[] }>('/api/v1/jobs'),
  
  // Create job
  create: (job: CreateJobRequest) => 
    request<{ id: string }>('/api/v1/jobs', { method: 'POST', body: job }),
  
  // Get job
  get: (id: string) => 
    request<ScheduledJob>(`/api/v1/jobs/${id}`),
  
  // Update job
  update: (id: string, job: Partial<ScheduledJob>) => 
    request(`/api/v1/jobs/${id}`, { method: 'PUT', body: job }),
  
  // Delete job
  delete: (id: string) => 
    request(`/api/v1/jobs/${id}`, { method: 'DELETE' }),
  
  // Trigger job
  trigger: (id: string) => 
    request(`/api/v1/jobs/${id}/run`, { method: 'POST' }),
  
  // List job executions
  getExecutions: (id: string) => 
    request<{ executions: JobExecution[] }>(`/api/v1/jobs/${id}/executions`),
  
  // Get available job types
  getTypes: () => 
    request<{ types: JobType[] }>('/api/v1/jobs/types'),
},

// Remediation
remediation: {
  // Get remediation summary
  getSummary: () => 
    request('/api/v1/remediation/summary'),
  
  // Get pending approvals
  getPendingApprovals: () => 
    request('/api/v1/remediation/pending'),
  
  // Suggest remediation for drift
  suggestForDrift: (driftId: number) => 
    request(`/api/v1/remediation/suggest/drift/${driftId}`, { method: 'POST' }),
  
  // Suggest remediation for vulnerability
  suggestForVulnerability: (vulnId: number) => 
    request(`/api/v1/remediation/suggest/vulnerability/${vulnId}`, { method: 'POST' }),
  
  // List remediation actions
  listActions: (status?: string) => 
    request('/api/v1/remediation/actions', { params: { status } }),
  
  // Execute action
  executeAction: (id: string) => 
    request(`/api/v1/remediation/actions/${id}/execute`, { method: 'POST' }),
  
  // Approve action
  approveAction: (id: string) => 
    request(`/api/v1/remediation/actions/${id}/approve`, { method: 'POST' }),
  
  // Rollback action
  rollbackAction: (id: string) => 
    request(`/api/v1/remediation/actions/${id}/rollback`, { method: 'POST' }),
},
```

**New Page: `pages/Automation.tsx`** 🆕
- Job scheduler with cron configuration
- Active jobs list with status
- Execution history
- Remediation queue

**New Components:**
1. `components/automation/JobScheduler.tsx` - Create/edit scheduled jobs
2. `components/automation/JobsList.tsx` - List of all jobs
3. `components/automation/ExecutionHistory.tsx` - Job run history
4. `components/automation/RemediationQueue.tsx` - Pending remediations

---

### Phase 6: Notifications & Integrations 🆕

**API Additions to `lib/api.ts`:**
```typescript
// Notifications
notifications: {
  // Get preferences
  getPreferences: () => 
    request('/api/v1/notifications/preferences'),
  
  // Update preference
  updatePreference: (channel: string, settings: NotificationSettings) => 
    request(`/api/v1/notifications/preferences/${channel}`, { method: 'PUT', body: settings }),
  
  // Get notification history
  getHistory: (limit?: number, offset?: number) => 
    request('/api/v1/notifications/history', { params: { limit, offset } }),
  
  // Send test notification
  send: (channel: string, message: string) => 
    request('/api/v1/notifications/send', { method: 'POST', body: { channel, message } }),
},

// Webhooks
webhooks: {
  // List webhooks
  list: () => 
    request<{ webhooks: Webhook[] }>('/api/v1/webhooks'),
  
  // Create webhook
  create: (webhook: CreateWebhookRequest) => 
    request<{ id: string }>('/api/v1/webhooks', { method: 'POST', body: webhook }),
  
  // Get webhook
  get: (id: string) => 
    request<Webhook>(`/api/v1/webhooks/${id}`),
  
  // Update webhook
  update: (id: string, webhook: Partial<Webhook>) => 
    request(`/api/v1/webhooks/${id}`, { method: 'PUT', body: webhook }),
  
  // Delete webhook
  delete: (id: string) => 
    request(`/api/v1/webhooks/${id}`, { method: 'DELETE' }),
  
  // Test webhook
  test: (id: string) => 
    request(`/api/v1/webhooks/${id}/test`, { method: 'POST' }),
  
  // Get available events
  getEvents: () => 
    request<{ events: string[] }>('/api/v1/webhooks/events'),
},
```

**Update: `pages/Settings.tsx`**
- Add Notifications tab
- Add Integrations tab (webhooks, Slack, etc.)

**New Components:**
1. `components/settings/NotificationPreferences.tsx` - Configure alerts per channel
2. `components/settings/WebhookManager.tsx` - CRUD for webhooks
3. `components/settings/SlackIntegration.tsx` - Slack connection settings

---

## App.tsx Route Updates

Add these new routes to `App.tsx`:

```tsx
// Add imports
import Compliance from "@/pages/Compliance";
import Automation from "@/pages/Automation";

// Add to PROTECTED_ROUTES
"/compliance",
"/automation",

// Add protected routes
<ProtectedRoute path="/compliance">
  <WithTrialCheck><Compliance /></WithTrialCheck>
</ProtectedRoute>
<ProtectedRoute path="/automation">
  <WithTrialCheck><Automation /></WithTrialCheck>
</ProtectedRoute>
```

---

## Navigation Updates

Update the sidebar/navigation in `layouts/DashboardLayout.tsx` to include:

```tsx
// Main Navigation Items
const navItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Shield, label: 'Security', path: '/security' },
  { icon: DollarSign, label: 'Cost Optimization', path: '/cost' },
  { icon: ClipboardCheck, label: 'Compliance', path: '/compliance' }, // NEW
  { icon: PlayCircle, label: 'Automation', path: '/automation' }, // NEW  
  { icon: Cloud, label: 'Providers', path: '/cloud-providers' },
  { icon: Activity, label: 'Resources', path: '/resources' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];
```

---

## Implementation Priority

### Priority 1 (High Value, Backend Ready)
1. ✅ Update `lib/api.ts` with new API endpoints
2. ✅ Create `pages/Compliance.tsx` - Full compliance dashboard
3. ✅ Update `pages/CostOptimization.tsx` - Hook up to real cost APIs
4. ✅ Create `hooks/use-costs.ts` and `hooks/use-compliance.ts`

### Priority 2 (Medium Value)
5. Create `pages/Automation.tsx` - Job scheduling UI
6. Update `pages/Settings.tsx` - Notifications & webhooks
7. Create `components/compliance/*` components
8. Create `components/automation/*` components

### Priority 3 (Enhancement)
9. Update `pages/SecurityMonitoring.tsx` - Add IaC scan results
10. Add real-time updates via WebSocket
11. Add export/download features for reports

---

## Estimated Effort

| Task | Effort (hours) |
|------|----------------|
| API client updates | 2 |
| Cost page updates | 4 |
| **Compliance page (new)** | 8 |
| Automation page (new) | 6 |
| Settings notifications | 3 |
| New hooks | 2 |
| New components | 6 |
| Testing & integration | 4 |
| **Total** | **~35 hours** |

---

## Files to Create/Modify Summary

### New Files to Create:
```
pages/
  Compliance.tsx              # NEW - Compliance dashboard

components/
  compliance/
    ComplianceScoreCard.tsx   # NEW
    FrameworkSelector.tsx     # NEW
    ControlsTable.tsx         # NEW
    AssessmentHistory.tsx     # NEW
    FailingControlsList.tsx   # NEW
  automation/
    JobScheduler.tsx          # NEW
    JobsList.tsx              # NEW
    ExecutionHistory.tsx      # NEW
    RemediationQueue.tsx      # NEW
  settings/
    NotificationPreferences.tsx # NEW
    WebhookManager.tsx        # NEW
    
hooks/
  use-costs.ts                # NEW
  use-compliance.ts           # NEW
  use-jobs.ts                 # NEW
  use-notifications.ts        # NEW
```

### Files to Modify:
```
lib/api.ts                    # Add all new API methods
pages/CostOptimization.tsx    # Hook to real backend
pages/Settings.tsx            # Add notification/webhook tabs
layouts/DashboardLayout.tsx   # Update navigation
App.tsx                       # Add new routes
types/index.ts                # Add new TypeScript interfaces
```

---

*Generated on: 2026-01-19*
*Backend Version: InfraAudit Go v1.0 (Phases 2-6 Complete)*
