// Demo data for exploring InfraAudit without connecting real infrastructure
// This provides realistic mock data for dashboards and analysis

import { Recommendation, SecurityDrift, Alert, UtilizationMetric } from "@/types";

// Demo cloud resources
export const demoResources = [
    {
        id: "demo-ec2-1",
        name: "web-server-prod-1",
        type: "EC2 Instance",
        provider: "AWS",
        region: "us-east-1",
        status: "running",
        cost: 156.80,
        cpuUtilization: 23,
        memoryUtilization: 45,
        tags: { environment: "production", team: "web" },
    },
    {
        id: "demo-ec2-2",
        name: "api-server-prod-1",
        type: "EC2 Instance",
        provider: "AWS",
        region: "us-east-1",
        status: "running",
        cost: 312.50,
        cpuUtilization: 67,
        memoryUtilization: 78,
        tags: { environment: "production", team: "backend" },
    },
    {
        id: "demo-ec2-3",
        name: "batch-worker-dev",
        type: "EC2 Instance",
        provider: "AWS",
        region: "us-west-2",
        status: "running",
        cost: 89.20,
        cpuUtilization: 5,
        memoryUtilization: 12,
        tags: { environment: "development", team: "data" },
    },
    {
        id: "demo-rds-1",
        name: "postgres-prod",
        type: "RDS Database",
        provider: "AWS",
        region: "us-east-1",
        status: "available",
        cost: 445.90,
        cpuUtilization: 34,
        memoryUtilization: 56,
        tags: { environment: "production", team: "backend" },
    },
    {
        id: "demo-s3-1",
        name: "app-assets-bucket",
        type: "S3 Bucket",
        provider: "AWS",
        region: "us-east-1",
        status: "active",
        cost: 45.30,
        storageUsed: "2.3 TB",
        tags: { environment: "production", team: "web" },
    },
    {
        id: "demo-vm-1",
        name: "k8s-node-pool-1",
        type: "Virtual Machine",
        provider: "Azure",
        region: "eastus",
        status: "running",
        cost: 234.50,
        cpuUtilization: 45,
        memoryUtilization: 62,
        tags: { environment: "production", cluster: "aks-main" },
    },
    {
        id: "demo-gce-1",
        name: "ml-training-gpu",
        type: "Compute Engine",
        provider: "GCP",
        region: "us-central1",
        status: "running",
        cost: 890.00,
        cpuUtilization: 89,
        memoryUtilization: 92,
        tags: { environment: "production", team: "ml" },
    },
];

// Demo recommendations - matches Recommendation type
export const demoRecommendations: Recommendation[] = [
    {
        id: 1001,
        title: "Right-size underutilized EC2 instances",
        description: "5 EC2 instances are running at less than 20% CPU utilization. Consider downsizing to smaller instance types.",
        type: "compute",
        potentialSavings: 2340,
        resourcesAffected: [1, 3, 5, 7, 9],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "open",
    },
    {
        id: 1002,
        title: "Delete unused EBS volumes",
        description: "12 unattached EBS volumes detected totaling 320 GB. These volumes incur charges but aren't being used.",
        type: "storage",
        potentialSavings: 890,
        resourcesAffected: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "open",
    },
    {
        id: 1003,
        title: "Consider Reserved Instances",
        description: "Based on your consistent usage patterns, switching to 1-year reserved instances for 8 EC2 instances would save significantly.",
        type: "compute",
        potentialSavings: 4500,
        resourcesAffected: [1, 2, 4, 6, 8, 10, 12, 14],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "open",
    },
    {
        id: 1004,
        title: "Enable S3 Intelligent Tiering",
        description: "15 S3 buckets with varying access patterns could benefit from Intelligent Tiering to automatically optimize costs.",
        type: "storage",
        potentialSavings: 450,
        resourcesAffected: [101, 102, 103],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "open",
    },
    {
        id: 1005,
        title: "Hibernate dev/test clusters on weekends",
        description: "Development and test Kubernetes clusters run 24/7 but show no activity on weekends. Schedule hibernation to save costs.",
        type: "compute",
        potentialSavings: 1200,
        resourcesAffected: [201, 202],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: "open",
    },
];

// Demo security drifts - matches SecurityDrift type
export const demoSecurityDrifts: SecurityDrift[] = [
    {
        id: 2001,
        resourceId: 101,
        driftType: "s3_public_access",
        severity: "critical",
        details: {
            resource: "s3://data-exports-prod",
            description: "S3 bucket has public access enabled, potentially exposing sensitive data.",
            remediation: "Disable public access and review bucket policies",
        },
        detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: "open",
    },
    {
        id: 2002,
        resourceId: 102,
        driftType: "security_group_open_ssh",
        severity: "high",
        details: {
            resource: "sg-0abc123def456",
            description: "Security group allows SSH (port 22) access from 0.0.0.0/0, exposing instances to potential brute force attacks.",
            remediation: "Restrict SSH access to specific IP ranges or use a bastion host",
        },
        detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: "open",
    },
    {
        id: 2003,
        resourceId: 103,
        driftType: "iam_unused_keys",
        severity: "medium",
        details: {
            resource: "iam-user/deploy-bot",
            description: "IAM user 'deploy-bot' has access keys that haven't been used in 90+ days.",
            remediation: "Rotate or delete unused access keys",
        },
        detectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "open",
    },
    {
        id: 2004,
        resourceId: 104,
        driftType: "rds_no_encryption",
        severity: "high",
        details: {
            resource: "rds/analytics-db",
            description: "RDS instance 'analytics-db' does not have encryption at rest enabled.",
            remediation: "Enable encryption at rest by creating an encrypted snapshot and restoring from it",
        },
        detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "open",
    },
];

// Demo alerts - matches Alert type
export const demoAlerts: Alert[] = [
    {
        id: 3001,
        title: "Cost anomaly detected",
        type: "cost",
        severity: "medium",
        message: "Daily spend increased by 45% compared to the 7-day average ($2,340 vs $1,612).",
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: "open",
    },
    {
        id: 3002,
        title: "High CPU utilization",
        type: "resource",
        severity: "medium",
        message: "Instance 'api-server-prod-1' has been running at 95%+ CPU for the last 2 hours.",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: "open",
    },
    {
        id: 3003,
        title: "Security group modified",
        type: "security",
        severity: "low",
        message: "Security group 'web-servers-sg' was modified by user admin@company.com.",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: "acknowledged",
    },
    {
        id: 3004,
        title: "Budget threshold exceeded",
        type: "cost",
        severity: "critical",
        message: "Monthly budget for 'Development' project has exceeded 90% with 10 days remaining.",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: "open",
    },
];

// Demo utilization metrics
export const demoUtilizationMetrics: UtilizationMetric[] = [
    { name: "CPU Utilization", value: 38, status: "healthy", trend: "down", change: 12 },
    { name: "Memory Usage", value: 72, status: "warning", trend: "up", change: 18 },
    { name: "Storage Usage", value: 54, status: "healthy", trend: "down", change: 3 },
    { name: "Network I/O", value: 89, status: "critical", trend: "up", change: 43 },
];

// Demo cost data for charts
export const demoCostData = {
    currentMonthSpend: 24850,
    lastMonthSpend: 23120,
    projectedSpend: 27335,
    potentialSavings: 7455,
    optimizationCount: 47,
    spendByService: [
        { service: "EC2", cost: 12450, percentage: 50 },
        { service: "RDS", cost: 5640, percentage: 23 },
        { service: "S3", cost: 3210, percentage: 13 },
        { service: "Lambda", cost: 1890, percentage: 8 },
        { service: "Other", cost: 1660, percentage: 6 },
    ],
    spendByTeam: [
        { team: "Engineering", cost: 15200, percentage: 61 },
        { team: "Data Science", cost: 5400, percentage: 22 },
        { team: "DevOps", cost: 2800, percentage: 11 },
        { team: "QA", cost: 1450, percentage: 6 },
    ],
    dailySpend: [
        { date: "2026-01-01", amount: 780 },
        { date: "2026-01-02", amount: 820 },
        { date: "2026-01-03", amount: 795 },
        { date: "2026-01-04", amount: 750 },
        { date: "2026-01-05", amount: 620 },
        { date: "2026-01-06", amount: 580 },
        { date: "2026-01-07", amount: 840 },
        { date: "2026-01-08", amount: 890 },
        { date: "2026-01-09", amount: 910 },
        { date: "2026-01-10", amount: 870 },
    ],
};

// Demo cluster data (like in CAST AI)
export const demoCluster = {
    id: "demo-cluster",
    name: "InfraAudit Demo Cluster",
    provider: "AWS",
    region: "us-east-1",
    nodes: 100,
    cpu: 1376.34,
    memory: "5.4 TiB",
    cpuCost: 0.0521,
    computeCost: 43377.84,
    status: "Demo",
};

// Function to check if demo mode is active
export function isDemoMode(): boolean {
    if (typeof window !== "undefined") {
        return localStorage.getItem("infraaudit_demo_mode") === "true";
    }
    return false;
}

// Function to enable demo mode
export function enableDemoMode(): void {
    if (typeof window !== "undefined") {
        localStorage.setItem("infraaudit_demo_mode", "true");
    }
}

// Function to disable demo mode
export function disableDemoMode(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem("infraaudit_demo_mode");
    }
}
