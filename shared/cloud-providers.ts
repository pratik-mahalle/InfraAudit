export enum CloudProvider {
  AWS = "AWS",
  GCP = "GCP",
  AZURE = "AZURE"
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
  serviceAccountKey: string; // JSON string of the service account key
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

export interface CloudResource {
  id: string;
  name: string;
  type: string;
  region: string;
  provider: CloudProvider;
  status: string;
  tags?: Record<string, string>;
  createdAt: string;
  lastUsed?: string;
  cost: number;
  costPerMonth?: number;
  utilization?: number;
  metadata?: Record<string, any>;
}

export interface CostData {
  date: string;
  amount: number;
  service?: string;
  region?: string;
}

export interface SecurityFinding {
  id: string;
  resourceId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  remediation: string;
  detectedAt: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
}

export interface ResourceUtilization {
  resourceId: string;
  metric: string;
  value: number;
  timestamp: string;
  unit: string;
}

export interface CloudAccount {
  id: string;
  name: string;
  provider: CloudProvider;
  isConnected: boolean;
  lastSynced?: string;
  resourceCount?: number;
}