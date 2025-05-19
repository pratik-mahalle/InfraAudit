import { 
  EC2Client, 
  DescribeInstancesCommand,
  DescribeInstanceStatusCommand,
  DescribeVolumesCommand,
  DescribeSecurityGroupsCommand,
  EC2ServiceException
} from '@aws-sdk/client-ec2';

import {
  CloudWatchClient,
  GetMetricDataCommand,
  MetricDataQuery
} from '@aws-sdk/client-cloudwatch';

import {
  CostExplorerClient,
  GetCostAndUsageCommand
} from '@aws-sdk/client-cost-explorer';

import { 
  CloudProvider, 
  AWSCredentials, 
  CloudResource, 
  CostData, 
  SecurityFinding,
  ResourceUtilization
} from '@shared/cloud-providers';

// Interface for the AWS cloud provider implementation
export interface CloudProviderInterface {
  getResources(): Promise<CloudResource[]>;
  getCostData(startDate: Date, endDate: Date): Promise<CostData[]>;
  getSecurityFindings(): Promise<SecurityFinding[]>;
  getResourceUtilization(resourceIds: string[], metrics: string[]): Promise<ResourceUtilization[]>;
  calculateCostAnomalies(): Promise<any[]>;
  generateOptimizationRecommendations(): Promise<any[]>;
}

/**
 * AWS Provider Implementation using real AWS SDK
 */
export class AWSProvider implements CloudProviderInterface {
  private ec2Client: EC2Client;
  private cloudWatchClient: CloudWatchClient;
  private costExplorerClient: CostExplorerClient;
  private credentials: AWSCredentials;

  constructor(credentials: AWSCredentials) {
    this.credentials = credentials;
    
    // Create EC2 client
    this.ec2Client = new EC2Client({
      region: credentials.region || 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      }
    });
    
    // Create CloudWatch client
    this.cloudWatchClient = new CloudWatchClient({
      region: credentials.region || 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      }
    });
    
    // Create Cost Explorer client
    this.costExplorerClient = new CostExplorerClient({
      region: credentials.region || 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      }
    });
  }

  /**
   * Get resources from AWS
   * @returns List of cloud resources
   */
  async getResources(): Promise<CloudResource[]> {
    console.log('Fetching real AWS resources...');
    const resources: CloudResource[] = [];
    
    try {
      // Get EC2 instances
      const command = new DescribeInstancesCommand({});
      const response = await this.ec2Client.send(command);
      
      if (response.Reservations && response.Reservations.length > 0) {
        for (const reservation of response.Reservations) {
          if (reservation.Instances) {
            for (const instance of reservation.Instances) {
              // Get instance tags
              const tags: Record<string, string> = {};
              if (instance.Tags) {
                instance.Tags.forEach(tag => {
                  if (tag.Key && tag.Value) {
                    tags[tag.Key] = tag.Value;
                  }
                });
              }
              
              // Get instance name from tags
              const name = tags['Name'] || instance.InstanceId || 'Unknown';
              
              // Add instance to resources
              resources.push({
                id: instance.InstanceId || `ec2-${Date.now()}`,
                name,
                type: 'EC2',
                region: this.credentials.region || 'us-east-1',
                provider: CloudProvider.AWS,
                status: instance.State?.Name || 'unknown',
                tags,
                createdAt: instance.LaunchTime?.toISOString() || new Date().toISOString(),
                lastUsed: new Date().toISOString(),
                cost: 0, // Will be populated from cost data
                metadata: {
                  instanceType: instance.InstanceType,
                  availabilityZone: instance.Placement?.AvailabilityZone,
                  publicIp: instance.PublicIpAddress,
                  privateIp: instance.PrivateIpAddress,
                  vpcId: instance.VpcId,
                  securityGroups: instance.SecurityGroups?.map(sg => sg.GroupId),
                }
              });
            }
          }
        }
      }
      
      // Get EBS volumes
      const volumesCommand = new DescribeVolumesCommand({});
      const volumesResponse = await this.ec2Client.send(volumesCommand);
      
      if (volumesResponse.Volumes && volumesResponse.Volumes.length > 0) {
        for (const volume of volumesResponse.Volumes) {
          // Get volume tags
          const tags: Record<string, string> = {};
          if (volume.Tags) {
            volume.Tags.forEach(tag => {
              if (tag.Key && tag.Value) {
                tags[tag.Key] = tag.Value;
              }
            });
          }
          
          // Get volume name from tags
          const name = tags['Name'] || volume.VolumeId || 'Unknown';
          
          // Add volume to resources
          resources.push({
            id: volume.VolumeId || `ebs-${Date.now()}`,
            name,
            type: 'EBS',
            region: this.credentials.region || 'us-east-1',
            provider: CloudProvider.AWS,
            status: volume.State || 'unknown',
            tags,
            createdAt: volume.CreateTime?.toISOString() || new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            cost: 0, // Will be populated from cost data
            metadata: {
              size: volume.Size,
              volumeType: volume.VolumeType,
              iops: volume.Iops,
              availabilityZone: volume.AvailabilityZone,
              encrypted: volume.Encrypted,
              attachments: volume.Attachments?.map(a => a.InstanceId),
            }
          });
        }
      }
      
      // Get security groups
      const sgCommand = new DescribeSecurityGroupsCommand({});
      const sgResponse = await this.ec2Client.send(sgCommand);
      
      if (sgResponse.SecurityGroups && sgResponse.SecurityGroups.length > 0) {
        for (const sg of sgResponse.SecurityGroups) {
          // Get security group tags
          const tags: Record<string, string> = {};
          if (sg.Tags) {
            sg.Tags.forEach(tag => {
              if (tag.Key && tag.Value) {
                tags[tag.Key] = tag.Value;
              }
            });
          }
          
          // Add security group to resources
          resources.push({
            id: sg.GroupId || `sg-${Date.now()}`,
            name: sg.GroupName || 'Unknown',
            type: 'SecurityGroup',
            region: this.credentials.region || 'us-east-1',
            provider: CloudProvider.AWS,
            status: 'active',
            tags,
            createdAt: new Date().toISOString(), // Security groups don't have a creation date in the API
            lastUsed: new Date().toISOString(),
            cost: 0, // Security groups don't have a cost
            metadata: {
              description: sg.Description,
              vpcId: sg.VpcId,
              inboundRules: sg.IpPermissions?.map(rule => ({
                protocol: rule.IpProtocol,
                fromPort: rule.FromPort,
                toPort: rule.ToPort,
                ipRanges: rule.IpRanges?.map(range => range.CidrIp),
              })),
              outboundRules: sg.IpPermissionsEgress?.map(rule => ({
                protocol: rule.IpProtocol,
                fromPort: rule.FromPort,
                toPort: rule.ToPort,
                ipRanges: rule.IpRanges?.map(range => range.CidrIp),
              })),
            }
          });
        }
      }
      
      return resources;
    } catch (error) {
      console.error('Error fetching AWS resources:', error);
      // For permissions or authentication errors, throw a more specific error
      if (error instanceof EC2ServiceException) {
        if (error.name === 'UnauthorizedOperation' || error.name === 'AuthFailure') {
          throw new Error('AWS authorization failed. Please check your credentials.');
        }
      }
      throw error;
    }
  }

  /**
   * Get cost data from AWS Cost Explorer
   * @param startDate Start date for cost data
   * @param endDate End date for cost data
   * @returns List of cost data points
   */
  async getCostData(startDate: Date, endDate: Date): Promise<CostData[]> {
    console.log('Fetching real AWS cost data...');
    const costData: CostData[] = [];
    
    try {
      // Format dates for AWS Cost Explorer
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      
      // Get cost data by service and day
      const command = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: start,
          End: end
        },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE'
          },
          {
            Type: 'DIMENSION',
            Key: 'REGION'
          }
        ]
      });
      
      const response = await this.costExplorerClient.send(command);
      
      if (response.ResultsByTime && response.ResultsByTime.length > 0) {
        for (const resultByTime of response.ResultsByTime) {
          if (resultByTime.Groups && resultByTime.Groups.length > 0) {
            for (const group of resultByTime.Groups) {
              const service = group.Keys?.[0] || 'Unknown';
              const region = group.Keys?.[1] || 'Unknown';
              const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
              
              costData.push({
                date: resultByTime.TimePeriod?.Start || start,
                amount: cost,
                service,
                region
              });
            }
          }
        }
      }
      
      return costData;
    } catch (error) {
      console.error('Error fetching AWS cost data:', error);
      // Return empty array for cost data to avoid breaking the application
      // This allows the application to still show other data even if cost data fails
      return [];
    }
  }

  /**
   * Get security findings from AWS
   * @returns List of security findings
   */
  async getSecurityFindings(): Promise<SecurityFinding[]> {
    console.log('Analyzing AWS resources for security findings...');
    const findings: SecurityFinding[] = [];
    
    try {
      // Get EC2 instances
      const command = new DescribeInstancesCommand({});
      const response = await this.ec2Client.send(command);
      
      // Get instance status to check for any issues
      const statusCommand = new DescribeInstanceStatusCommand({});
      const statusResponse = await this.ec2Client.send(statusCommand);
      
      // Create a map of instance status
      const instanceStatus = new Map<string, string>();
      if (statusResponse.InstanceStatuses) {
        for (const status of statusResponse.InstanceStatuses) {
          if (status.InstanceId) {
            const systemStatus = status.SystemStatus?.Status || 'unknown';
            const instanceStatus = status.InstanceStatus?.Status || 'unknown';
            
            if (systemStatus !== 'ok' || instanceStatus !== 'ok') {
              instanceStatus.set(status.InstanceId, 'impaired');
            } else {
              instanceStatus.set(status.InstanceId, 'ok');
            }
          }
        }
      }
      
      // Check instances for security issues
      if (response.Reservations && response.Reservations.length > 0) {
        for (const reservation of response.Reservations) {
          if (reservation.Instances) {
            for (const instance of reservation.Instances) {
              if (!instance.InstanceId) continue;
              
              // Check for instances without tags
              if (!instance.Tags || instance.Tags.length === 0) {
                findings.push({
                  id: `finding-tags-${instance.InstanceId}`,
                  resourceId: instance.InstanceId,
                  severity: 'low',
                  title: 'EC2 instance missing tags',
                  description: 'This EC2 instance does not have any tags, which makes tracking ownership and purpose difficult.',
                  remediation: 'Add meaningful tags to the instance, including at minimum: Name, Environment, Owner, and Purpose.',
                  detectedAt: new Date().toISOString(),
                  status: 'open'
                });
              }
              
              // Check for instances with public IP
              if (instance.PublicIpAddress) {
                findings.push({
                  id: `finding-public-ip-${instance.InstanceId}`,
                  resourceId: instance.InstanceId,
                  severity: 'medium',
                  title: 'EC2 instance has public IP address',
                  description: 'This EC2 instance has a public IP address, which increases its attack surface.',
                  remediation: 'If the instance does not need to be publicly accessible, remove the public IP and place it in a private subnet.',
                  detectedAt: new Date().toISOString(),
                  status: 'open'
                });
              }
              
              // Check for instance health issues
              if (instanceStatus.get(instance.InstanceId) === 'impaired') {
                findings.push({
                  id: `finding-health-${instance.InstanceId}`,
                  resourceId: instance.InstanceId,
                  severity: 'high',
                  title: 'EC2 instance health check failed',
                  description: 'This EC2 instance is failing its health checks, which may indicate system issues.',
                  remediation: 'Investigate the instance and consider recovering or replacing it.',
                  detectedAt: new Date().toISOString(),
                  status: 'open'
                });
              }
            }
          }
        }
      }
      
      // Get security groups to check for wide-open rules
      const sgCommand = new DescribeSecurityGroupsCommand({});
      const sgResponse = await this.ec2Client.send(sgCommand);
      
      if (sgResponse.SecurityGroups && sgResponse.SecurityGroups.length > 0) {
        for (const sg of sgResponse.SecurityGroups) {
          if (!sg.GroupId) continue;
          
          // Check for security groups with wide-open ingress rules
          if (sg.IpPermissions) {
            for (const rule of sg.IpPermissions) {
              if (rule.IpRanges) {
                for (const ipRange of rule.IpRanges) {
                  if (ipRange.CidrIp === '0.0.0.0/0') {
                    // If this opens SSH (port 22) or RDP (port 3389) to the world, it's high severity
                    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
                    let title = 'Security group allows all traffic from the internet';
                    
                    if ((rule.FromPort === 22 || rule.ToPort === 22) && rule.IpProtocol === 'tcp') {
                      severity = 'critical';
                      title = 'Security group allows SSH from the internet';
                    } else if ((rule.FromPort === 3389 || rule.ToPort === 3389) && rule.IpProtocol === 'tcp') {
                      severity = 'critical';
                      title = 'Security group allows RDP from the internet';
                    }
                    
                    findings.push({
                      id: `finding-sg-open-${sg.GroupId}-${rule.FromPort}-${rule.ToPort}`,
                      resourceId: sg.GroupId,
                      severity,
                      title,
                      description: `Security group ${sg.GroupName} allows ${rule.IpProtocol} traffic from ${ipRange.CidrIp} on port range ${rule.FromPort}-${rule.ToPort}`,
                      remediation: 'Restrict the IP range to only the necessary IPs or CIDR blocks.',
                      detectedAt: new Date().toISOString(),
                      status: 'open'
                    });
                  }
                }
              }
            }
          }
        }
      }
      
      return findings;
    } catch (error) {
      console.error('Error fetching AWS security findings:', error);
      return [];
    }
  }

  /**
   * Get resource utilization metrics from AWS CloudWatch
   * @param resourceIds List of resource IDs to get metrics for
   * @param metrics List of metrics to retrieve
   * @returns List of resource utilization data points
   */
  async getResourceUtilization(resourceIds: string[], metrics: string[] = []): Promise<ResourceUtilization[]> {
    console.log('Fetching real AWS resource utilization metrics...');
    const utilizationData: ResourceUtilization[] = [];
    
    // Only process EC2 instances for now
    const ec2InstanceIds = resourceIds.filter(id => id.startsWith('i-'));
    
    if (ec2InstanceIds.length === 0) {
      return utilizationData;
    }
    
    // Default metrics if none specified
    const metricsToFetch = metrics.length > 0 ? metrics : ['CPUUtilization', 'NetworkIn', 'NetworkOut', 'DiskReadBytes', 'DiskWriteBytes'];
    
    try {
      // Set up time range for last 24 hours
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
      
      // Create metric queries
      const metricDataQueries: MetricDataQuery[] = [];
      
      let queryId = 0;
      for (const instanceId of ec2InstanceIds) {
        for (const metric of metricsToFetch) {
          metricDataQueries.push({
            Id: `q${queryId++}`,
            MetricStat: {
              Metric: {
                Namespace: 'AWS/EC2',
                MetricName: metric,
                Dimensions: [
                  {
                    Name: 'InstanceId',
                    Value: instanceId
                  }
                ]
              },
              Period: 3600, // 1 hour granularity
              Stat: 'Average'
            },
            Label: `${instanceId}-${metric}`
          });
        }
      }
      
      // Batch requests if there are too many queries
      const batchSize = 100; // CloudWatch API limit
      for (let i = 0; i < metricDataQueries.length; i += batchSize) {
        const batchQueries = metricDataQueries.slice(i, i + batchSize);
        
        const command = new GetMetricDataCommand({
          StartTime: startTime,
          EndTime: endTime,
          MetricDataQueries: batchQueries
        });
        
        const response = await this.cloudWatchClient.send(command);
        
        if (response.MetricDataResults) {
          for (const result of response.MetricDataResults) {
            if (result.Values && result.Timestamps && result.Values.length > 0) {
              // Parse the label to get instance ID and metric name
              const labelParts = result.Label?.split('-') || [];
              if (labelParts.length < 2) continue;
              
              const resourceId = labelParts[0];
              const metricName = labelParts.slice(1).join('-');
              
              // Get appropriate unit based on metric name
              let unit = '';
              if (metricName.includes('CPU')) {
                unit = 'percent';
              } else if (metricName.includes('Bytes')) {
                unit = 'bytes';
              } else if (metricName.includes('Count')) {
                unit = 'count';
              } else {
                unit = 'number';
              }
              
              // Add data points
              for (let i = 0; i < result.Values.length; i++) {
                utilizationData.push({
                  resourceId,
                  metric: metricName,
                  value: result.Values[i],
                  timestamp: result.Timestamps![i].toISOString(),
                  unit
                });
              }
            }
          }
        }
      }
      
      return utilizationData;
    } catch (error) {
      console.error('Error fetching AWS resource utilization:', error);
      return [];
    }
  }

  /**
   * Calculate cost anomalies from AWS Cost Explorer
   * @returns List of cost anomaly findings
   */
  async calculateCostAnomalies(): Promise<any[]> {
    console.log('Analyzing AWS cost data for anomalies...');
    // Implement cost anomaly detection logic
    // This would typically involve:
    // 1. Retrieving historical cost data
    // 2. Applying statistical methods to identify outliers
    // 3. Generating anomaly findings
    
    // For demo purposes, we'll return an empty array
    // A real implementation would connect to AWS Cost Anomaly Detection service
    return [];
  }

  /**
   * Generate optimization recommendations for AWS resources
   * @returns List of optimization recommendations
   */
  async generateOptimizationRecommendations(): Promise<any[]> {
    console.log('Generating AWS optimization recommendations...');
    const recommendations = [];
    
    try {
      // Get EC2 instances for rightsizing recommendations
      const command = new DescribeInstancesCommand({});
      const response = await this.ec2Client.send(command);
      
      if (response.Reservations && response.Reservations.length > 0) {
        for (const reservation of response.Reservations) {
          if (reservation.Instances) {
            for (const instance of reservation.Instances) {
              if (!instance.InstanceId) continue;
              
              // Get CPU utilization metrics for the instance
              const utilizationData = await this.getResourceUtilization([instance.InstanceId], ['CPUUtilization']);
              
              // Calculate average CPU utilization
              let avgCpuUtilization = 0;
              const cpuMetrics = utilizationData.filter(d => d.metric === 'CPUUtilization');
              
              if (cpuMetrics.length > 0) {
                avgCpuUtilization = cpuMetrics.reduce((sum, d) => sum + d.value, 0) / cpuMetrics.length;
              }
              
              // Generate recommendations based on utilization
              if (avgCpuUtilization < 10) {
                // Low utilization instance
                recommendations.push({
                  resourceId: instance.InstanceId,
                  resourceType: 'EC2',
                  title: 'Underutilized EC2 instance',
                  description: `EC2 instance ${instance.InstanceId} has average CPU utilization of ${avgCpuUtilization.toFixed(2)}% over the last 24 hours.`,
                  recommendationType: 'Resize',
                  estimatedSavings: this.estimateEC2Savings(instance.InstanceType || ''),
                  impact: 'medium',
                  effort: 'low'
                });
              }
              
              // Check for stopped instances that are incurring charges
              if (instance.State?.Name === 'stopped' && instance.EbsOptimized) {
                recommendations.push({
                  resourceId: instance.InstanceId,
                  resourceType: 'EC2',
                  title: 'Stopped EC2 instance with EBS volumes',
                  description: `EC2 instance ${instance.InstanceId} is stopped but still incurring charges for attached EBS volumes.`,
                  recommendationType: 'Terminate',
                  estimatedSavings: this.estimateEBSSavings(instance),
                  impact: 'high',
                  effort: 'low'
                });
              }
            }
          }
        }
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error generating AWS optimization recommendations:', error);
      return [];
    }
  }

  /**
   * Helper methods
   */
  
  // Estimate savings from resizing an EC2 instance
  private estimateEC2Savings(instanceType: string): number {
    // This is a simplified estimation based on instance type
    // In a real implementation, this would use actual pricing data
    const instancePricing: Record<string, number> = {
      't2.micro': 10,
      't2.small': 20,
      't2.medium': 40,
      'm5.large': 80,
      'm5.xlarge': 160,
      'c5.large': 90,
      'c5.xlarge': 180,
      'r5.large': 130,
      'r5.xlarge': 260
    };
    
    // Default savings percentage
    const savingsPercentage = 0.3; // 30% savings
    
    // Get monthly cost for instance type
    const monthlyCost = instancePricing[instanceType] || 50; // default to $50 if unknown
    
    // Calculate estimated monthly savings
    return monthlyCost * savingsPercentage;
  }
  
  // Estimate savings from terminating unused EBS volumes
  private estimateEBSSavings(instance: any): number {
    // Simplified calculation based on instance
    // A more accurate implementation would calculate based on actual EBS volume sizes
    return 20; // Assume $20/month savings from removing unused EBS volumes
  }
}