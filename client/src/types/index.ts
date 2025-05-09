// Common types to be used across the application
export interface User {
  id: number;
  username: string;
  fullName?: string;
  role: string;
}

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

export interface CostAnomaly {
  id: number;
  resourceId: number;
  anomalyType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  percentage: number;
  previousCost: number;
  currentCost: number;
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
  title: string;
  description: string;
  type: string;
  potentialSavings: number;
  resourcesAffected: number[];
  createdAt: string;
  status: 'open' | 'applied' | 'dismissed';
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
