// Demo data for exploring InfraAudit without connecting real infrastructure
// This provides realistic mock data for dashboards and analysis

import {
  Recommendation,
  SecurityDrift,
  Alert,
  UtilizationMetric,
  ComplianceOverview,
  ComplianceFramework,
  ComplianceControl,
  ComplianceAssessment,
  AssessmentFinding,
  ScheduledJob,
  JobExecution,
  RemediationAction,
  NotificationPreference,
  Webhook
} from "@/types";

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
        priority: "high",
        savings: 2340,
        effort: "low",
        impact: "medium",
        category: "cost",
        resources: ["i-0abc1", "i-0abc3", "i-0abc5", "i-0abc7", "i-0abc9"],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
    },
    {
        id: 1002,
        title: "Delete unused EBS volumes",
        description: "12 unattached EBS volumes detected totaling 320 GB. These volumes incur charges but aren't being used.",
        type: "storage",
        priority: "medium",
        savings: 890,
        effort: "low",
        impact: "low",
        category: "cost",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
    },
    {
        id: 1003,
        title: "Consider Reserved Instances",
        description: "Based on your consistent usage patterns, switching to 1-year reserved instances for 8 EC2 instances would save significantly.",
        type: "compute",
        priority: "high",
        savings: 4500,
        effort: "medium",
        impact: "high",
        category: "cost",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
    },
    {
        id: 1004,
        title: "Enable S3 Intelligent Tiering",
        description: "15 S3 buckets with varying access patterns could benefit from Intelligent Tiering to automatically optimize costs.",
        type: "storage",
        priority: "medium",
        savings: 450,
        effort: "low",
        impact: "medium",
        category: "cost",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
    },
    {
        id: 1005,
        title: "Hibernate dev/test clusters on weekends",
        description: "Development and test Kubernetes clusters run 24/7 but show no activity on weekends. Schedule hibernation to save costs.",
        type: "compute",
        priority: "medium",
        savings: 1200,
        effort: "medium",
        impact: "medium",
        category: "cost",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
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

// Demo compliance overview
export const demoComplianceOverview: ComplianceOverview = {
    totalControls: 85,
    passedControls: 68,
    failedControls: 17,
    compliancePercent: 80,
    byFramework: [
        { frameworkId: "cis-aws-v1.4", frameworkName: "CIS AWS Foundations Benchmark v1.4", totalControls: 45, passedControls: 38, failedControls: 7, compliancePercent: 84, lastAssessment: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
        { frameworkId: "soc2-type-ii", frameworkName: "SOC 2 Type II Security & Trust", totalControls: 25, passedControls: 20, failedControls: 5, compliancePercent: 80, lastAssessment: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
        { frameworkId: "nist-800-53", frameworkName: "NIST SP 800-53 Rev. 5", totalControls: 15, passedControls: 10, failedControls: 5, compliancePercent: 66, lastAssessment: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    ],
    bySeverity: {
        critical: 2,
        high: 5,
        medium: 6,
        low: 4,
    }
};

// Demo compliance frameworks
export const demoComplianceFrameworks: ComplianceFramework[] = [
    { id: "cis-aws-v1.4", name: "CIS AWS Foundations Benchmark v1.4", version: "1.4.0", description: "Prescriptive guidelines for securing AWS services", provider: "AWS", isEnabled: true },
    { id: "soc2-type-ii", name: "SOC 2 Type II Security & Trust", version: "2017", description: "Security controls mapping to Trust Services Criteria", provider: "Multi-cloud", isEnabled: true },
    { id: "nist-800-53", name: "NIST SP 800-53 Rev. 5", version: "5.0.0", description: "Security and Privacy Controls for Information Systems and Organizations", provider: "Multi-cloud", isEnabled: false }
];

// Demo compliance controls
export const demoComplianceControls: Record<string, ComplianceControl[]> = {
    "cis-aws-v1.4": [
        { id: "cis-1.1", frameworkId: "cis-aws-v1.4", controlId: "1.1", title: "Avoid the use of the 'root' account", description: "Ensure root credentials are not used for everyday tasks.", category: "IAM", severity: "critical" },
        { id: "cis-1.2", frameworkId: "cis-aws-v1.4", controlId: "1.2", title: "Ensure MFA is enabled for all IAM users", description: "Multi-Factor Authentication adds an extra layer of protection.", category: "IAM", severity: "high", remediation: "Enable MFA in IAM console" },
        { id: "cis-2.1", frameworkId: "cis-aws-v1.4", controlId: "2.1", title: "Ensure CloudTrail is enabled in all regions", description: "Enable full trail logging for security auditing.", category: "Logging", severity: "high" },
        { id: "cis-3.1", frameworkId: "cis-aws-v1.4", controlId: "3.1", title: "Ensure no security groups allow 0.0.0.0/0 to port 22", description: "Avoid open SSH access.", category: "Networking", severity: "critical" }
    ],
    "soc2-type-ii": [
        { id: "soc-cc1.1", frameworkId: "soc2-type-ii", controlId: "CC1.1", title: "Access Control for Live Databases", description: "Production database access must be tightly controlled and logged.", category: "Access Control", severity: "critical" },
        { id: "soc-cc2.2", frameworkId: "soc2-type-ii", controlId: "CC2.2", title: "Vulnerability Scanning Schedule", description: "Verify regular automated dependency and image scanning is running.", category: "Vulnerability Management", severity: "medium" }
    ]
};

// Demo compliance assessments
export const demoComplianceAssessments: ComplianceAssessment[] = [
    { id: "assess-001", frameworkId: "cis-aws-v1.4", frameworkName: "CIS AWS Foundations Benchmark v1.4", assessmentDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), totalControls: 45, passedControls: 38, failedControls: 7, notApplicableControls: 0, compliancePercent: 84, status: "completed" },
    { id: "assess-002", frameworkId: "soc2-type-ii", frameworkName: "SOC 2 Type II Security & Trust", assessmentDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), totalControls: 25, passedControls: 20, failedControls: 5, notApplicableControls: 0, compliancePercent: 80, status: "completed" }
];

// Demo assessment findings
export const demoAssessmentFindings: AssessmentFinding[] = [
    { controlId: "cis-1.2", controlTitle: "Ensure MFA is enabled for all IAM users", category: "IAM", severity: "high", status: "failed", affectedCount: 4, affectedResources: ["iam-user/deploy-bot", "iam-user/analytics-reader"], remediation: "Open IAM, select user, go to Security Credentials, enable MFA device." },
    { controlId: "cis-3.1", controlTitle: "Ensure no security groups allow 0.0.0.0/0 to port 22", category: "Networking", severity: "critical", status: "failed", affectedCount: 1, affectedResources: ["sg-0abc123def456 (default)"], remediation: "Go to VPC Security Groups, remove Rule permitting Port 22 from 0.0.0.0/0." }
];

// Demo jobs list
export const demoJobs: ScheduledJob[] = [
    { id: "job-001", name: "Daily Cloud Drift Detection", description: "Scans cloud resources in AWS & GCP to identify active configuration changes.", type: "Drift Scan", schedule: "0 2 * * *", enabled: true, lastRun: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), nextRun: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), status: "idle" },
    { id: "job-002", name: "Weekly CIS Compliance Audit", description: "Performs deep auditing against CIS Benchmark requirements.", type: "Compliance Assessment", schedule: "0 0 * * 0", enabled: true, lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), status: "idle" },
    { id: "job-003", name: "Cost Anomaly Engine Scanner", description: "Calculates cost spikes and deviations on AWS billing metrics.", type: "Cost Analysis", schedule: "*/30 * * * *", enabled: false, lastRun: new Date(Date.now() - 15 * 60 * 1000).toISOString(), status: "idle" }
];

// Demo job executions
export const demoJobExecutions: JobExecution[] = [
    { id: 9001, jobId: "job-001", status: "success", startedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), completedAt: new Date(Date.now() - 20 * 60 * 60 * 1000 + 45000).toISOString(), duration: "45s" },
    { id: 9002, jobId: "job-002", status: "success", startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 120000).toISOString(), duration: "2m 0s" },
    { id: 9003, jobId: "job-003", status: "failure", startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), completedAt: new Date(Date.now() - 15 * 60 * 1000 + 5000).toISOString(), duration: "5s", errorMessage: "Rate limiting threshold hit on GCP Cost API" }
];

// Demo remediation actions
export const demoRemediationActions: RemediationAction[] = [
    { id: "rem-001", driftId: 2001, actionType: "Disable S3 Public Access", description: "Restrict access policies on s3://data-exports-prod bucket.", severity: "critical", status: "pending_approval", requestedBy: 1, requestedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
    { id: "rem-002", driftId: 2002, actionType: "Block Open SSH Access", description: "Remove 0.0.0.0/0 SSH inbound rule from Security Group sg-0abc123def456.", severity: "high", status: "pending_approval", requestedBy: 1, requestedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }
];

// Demo notification preferences
export const demoNotificationPreferences: NotificationPreference[] = [
    { id: "pref-slack", user_id: 1, channel: "slack", is_enabled: true, config: { webhook_url: "https://hooks.slack.com/services/...", channel_name: "#infraaudit-alerts" }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "pref-email", user_id: 1, channel: "email", is_enabled: true, config: { frequency: "immediate", digest_hour: 8 }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "pref-webhook", user_id: 1, channel: "webhook", is_enabled: false, config: { endpoint_url: "" }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

// Demo webhooks
export const demoWebhooks: Webhook[] = [
    { id: "web-001", name: "Production Teams Alert Dispatcher", url: "https://api.company.com/webhooks/alerts", events: ["drift_detected", "vulnerability_found"], is_enabled: true, last_triggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() }
];

// Demo Kubernetes clusters
export const demoK8sClusters = [
    { id: "aks-prod-1", name: "aks-prod-westus", provider: "azure", nodeCount: 12, version: "v1.28.3", isConnected: true },
    { id: "gke-prod-1", name: "gke-production-central", provider: "gcp", nodeCount: 24, version: "v1.27.6", isConnected: true }
];

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
