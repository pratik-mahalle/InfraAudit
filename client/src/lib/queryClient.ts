import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  isDemoMode,
  demoResources,
  demoRecommendations,
  demoSecurityDrifts,
  demoAlerts,
  demoCostData,
  demoComplianceOverview,
  demoComplianceFrameworks,
  demoComplianceControls,
  demoComplianceAssessments,
  demoAssessmentFindings,
  demoJobs,
  demoJobExecutions,
  demoRemediationActions,
  demoNotificationPreferences,
  demoWebhooks,
  demoK8sClusters
} from "@/lib/demo-data";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "";

// Get the current Supabase access token
async function getSupabaseToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// Convert snake_case keys to camelCase recursively
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeysToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamel);
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        snakeToCamel(key),
        convertKeysToCamel(value),
      ])
    );
  }
  return obj;
}

// Unwrap Go backend response envelope { success, data } and convert keys
export function unwrapResponse<T = unknown>(json: unknown): T {
  const obj = json as Record<string, unknown>;
  const data = obj?.success !== undefined ? obj.data : json;
  return convertKeysToCamel(data) as T;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Try to parse Go error envelope: { success: false, error: { message: "..." } }
    try {
      const json = await res.json();
      const msg =
        (json.error as Record<string, unknown>)?.message ||
        json.message ||
        res.statusText;
      throw new Error(String(msg));
    } catch (e) {
      if (e instanceof Error && e.message !== res.statusText) throw e;
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

// Intercept fetch requests for Offline Demo Mode
function mockFetch(url: string, method: string = "GET", body?: any): Response {
  // Strip host and query params for matching pathname
  let path = url;
  if (url.startsWith("http")) {
    try {
      path = new URL(url).pathname;
    } catch {
      path = url;
    }
  } else if (url.includes("?")) {
    path = url.split("?")[0];
  }

  let data: any = null;

  if (method === "GET") {
    if (path === "/api/user") {
      data = { id: 1, email: "demo@company.com", username: "demo_admin", fullName: "Demo Admin", role: "admin", approved: true };
    } else if (path === "/api/drifts/summary") {
      data = { total: 4, critical: 1, high: 2, medium: 1, low: 0, open: 4, remediated: 0 };
    } else if (path === "/api/drifts") {
      data = { success: true, data: demoSecurityDrifts };
    } else if (path === "/api/alerts/summary") {
      data = { total: 4, critical: 1, high: 2, medium: 1, low: 0, open: 3, acknowledged: 1, resolved: 0 };
    } else if (path === "/api/alerts") {
      data = { success: true, data: demoAlerts };
    } else if (path === "/api/resources") {
      data = { success: true, data: demoResources };
    } else if (path === "/api/recommendations/savings") {
      data = { totalSavings: 9380 };
    } else if (path === "/api/recommendations") {
      data = { success: true, data: demoRecommendations };
    } else if (path === "/api/providers/status") {
      data = {
        aws: { id: 1, provider: "aws", name: "AWS Production", status: "connected", lastSyncAt: new Date().toISOString() },
        gcp: { id: 2, provider: "gcp", name: "GCP Staging", status: "connected", lastSyncAt: new Date().toISOString() }
      };
    } else if (path === "/api/providers") {
      data = [
        { id: 1, provider: "aws", name: "AWS Production", isConnected: true, lastSynced: new Date().toISOString() },
        { id: 2, provider: "gcp", name: "GCP Staging", isConnected: true, lastSynced: new Date().toISOString() }
      ];
    } else if (path === "/api/kubernetes/clusters") {
      data = demoK8sClusters;
    } else if (path === "/api/kubernetes/stats") {
      data = { cpu: 1376.34, memory: "5.4 TiB", nodes: 100 };
    } else if (path === "/api/baselines") {
      data = [];
    } else if (path === "/api/v1/costs") {
      data = {
        totalCost: 24850,
        monthlyCost: 24850,
        dailyCost: 810,
        currency: "USD",
        byProvider: { AWS: 18000, GCP: 4000, Azure: 2850 },
        topServices: [
          { serviceName: "EC2", cost: 12450, percentage: 50 },
          { serviceName: "RDS", cost: 5640, percentage: 23 },
          { serviceName: "S3", cost: 3210, percentage: 13 }
        ],
        anomalyCount: 1,
        potentialSavings: 7455
      };
    } else if (path === "/api/v1/costs/trends") {
      data = {
        period: "30d",
        currentCost: 24850,
        previousCost: 23120,
        changePercent: 7.5,
        trend: "up",
        dataPoints: demoCostData.dailySpend.map(d => ({ date: d.date, cost: d.amount }))
      };
    } else if (path === "/api/v1/costs/forecast") {
      data = {
        provider: "all",
        model: "linear",
        period: "30d",
        forecastedCost: 27335,
        confidenceLevel: 92,
        lowerBound: 25000,
        upperBound: 29000,
        currency: "USD",
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        dataPoints: [
          { date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), cost: 850, lowerBound: 800, upperBound: 900 },
          { date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), cost: 890, lowerBound: 830, upperBound: 950 },
          { date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), cost: 920, lowerBound: 850, upperBound: 990 }
        ],
        historical: demoCostData.dailySpend.map(d => ({ date: d.date, cost: d.amount }))
      };
    } else if (path === "/api/v1/costs/forecast/ai" || path.includes("/api/v1/costs/forecast/ai")) {
      data = {
        summary: "Cost forecast predicts a slight upward drift due to EC2 staging usage.",
        costDrivers: ["EC2 Instance scaling", "RDS backup retention"],
        riskFactors: ["Unused storage attachments"],
        recommendations: ["Right-size dev environments", "Automate backup cleanup"],
        forecast30d: 25800,
        forecast60d: 26900,
        forecast90d: 28100
      };
    } else if (path === "/api/v1/costs/roi") {
      data = {
        currentMonthlySpend: 24850,
        currency: "USD",
        providerBreakdown: { AWS: 18000, GCP: 4000, Azure: 2850 },
        resourceCount: 154,
        appliedSavings: 3120,
        pendingSavings: 4335,
        totalPotentialSavings: 7455,
        optimizationCount: 47,
        securityIncidents: 0,
        driftCount: 4
      };
    } else if (path === "/api/v1/costs/anomalies") {
      data = [
        {
          id: 3001,
          provider: "AWS",
          serviceName: "EC2",
          anomalyType: "spike",
          severity: "high",
          deviation: 45,
          expectedCost: 1612,
          actualCost: 2340,
          detectedAt: new Date().toISOString(),
          status: "open"
        }
      ];
    } else if (path === "/api/v1/costs/optimizations") {
      data = [
        {
          id: "opt-1",
          provider: "AWS",
          resourceId: "i-0abc1",
          resourceType: "EC2 Instance",
          optimizationType: "Right-sizing",
          description: "Downsize instance from m5.xlarge to m5.large",
          estimatedSavings: 120,
          confidence: 92,
          status: "open",
          detectedAt: new Date().toISOString()
        }
      ];
    } else if (path === "/api/v1/compliance/overview") {
      data = demoComplianceOverview;
    } else if (path === "/api/v1/compliance/frameworks") {
      data = { frameworks: demoComplianceFrameworks };
    } else if (path.startsWith("/api/v1/compliance/frameworks/") && path.endsWith("/controls")) {
      const match = path.match(/\/api\/v1\/compliance\/frameworks\/([^/]+)\/controls/);
      const fwId = match ? match[1] : "";
      data = { controls: demoComplianceControls[fwId] || [] };
    } else if (path.startsWith("/api/v1/compliance/frameworks/")) {
      const match = path.match(/\/api\/v1\/compliance\/frameworks\/([^/]+)/);
      const fwId = match ? match[1] : "";
      data = demoComplianceFrameworks.find(f => f.id === fwId) || null;
    } else if (path === "/api/v1/compliance/assessments") {
      data = { assessments: demoComplianceAssessments };
    } else if (path.startsWith("/api/v1/compliance/controls/failing")) {
      data = { failingControls: demoAssessmentFindings };
    } else if (path === "/api/v1/jobs") {
      data = demoJobs;
    } else if (path === "/api/v1/jobs/types") {
      data = ["Drift Scan", "Compliance Assessment", "Cost Analysis"];
    } else if (path.startsWith("/api/v1/jobs/") && path.endsWith("/executions")) {
      const match = path.match(/\/api\/v1\/jobs\/([^/]+)\/executions/);
      const jobId = match ? match[1] : "";
      data = demoJobExecutions.filter(e => e.jobId === jobId);
    } else if (path === "/api/v1/remediation/pending") {
      data = demoRemediationActions;
    } else if (path === "/api/v1/remediation/summary") {
      data = { total: 2, pending: 2, executed: 12, failed: 0 };
    } else if (path === "/api/v1/remediation/actions") {
      data = demoRemediationActions;
    } else if (path === "/api/v1/notifications/preferences") {
      data = { preferences: demoNotificationPreferences };
    } else if (path === "/api/v1/webhooks") {
      data = { webhooks: demoWebhooks };
    } else {
      data = [];
    }
  } else {
    data = { success: true, message: "Action simulated in demo mode" };
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  if (isDemoMode()) {
    return mockFetch(url, method, data);
  }

  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";

  // Get Supabase token and include as Bearer
  const token = await getSupabaseToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  return async ({ queryKey }) => {
    if (isDemoMode()) {
      const res = mockFetch(queryKey[0] as string, "GET");
      const json = await res.json();
      return unwrapResponse<T>(json);
    }

    const headers: Record<string, string> = {};
    const token = await getSupabaseToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${queryKey[0] as string}`, {
      headers,
      credentials: "include",
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    const json = await res.json();
    return unwrapResponse<T>(json);
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
