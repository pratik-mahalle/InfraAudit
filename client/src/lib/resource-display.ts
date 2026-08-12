export const AWS_RESOURCE_TYPE_LABELS: Record<string, string> = {
  "ec2-instance": "EC2 instance",
  "s3-bucket": "S3 bucket",
  "rds-instance": "RDS instance",
  "vpc": "VPC",
  "security-group": "Security group",
  "ebs-volume": "EBS volume",
  "iam-user": "IAM user",
  "iam-role": "IAM role",
};

export function formatResourceType(type: string): string {
  return AWS_RESOURCE_TYPE_LABELS[type.toLowerCase()]
    ?? type.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function parseResourceConfiguration(configuration?: string): Record<string, unknown> {
  if (!configuration) return {};
  try {
    const parsed = JSON.parse(configuration);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}
