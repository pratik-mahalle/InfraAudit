import { 
  CloudProvider, 
  AWSCredentials,
  CloudResource,
  CostData,
  SecurityFinding,
  ResourceUtilization
} from '../../shared/cloud-providers';

// AWS SDK Imports
import { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand } from "@aws-sdk/client-ec2";
import { S3Client, ListBucketsCommand, GetBucketTaggingCommand } from "@aws-sdk/client-s3";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { IAMClient, ListAccessKeysCommand } from "@aws-sdk/client-iam";

/**
 * AWS Provider Implementation for real cloud integration
 */
export class AWSProvider {
  private credentials: AWSCredentials;
  private ec2Client: EC2Client;
  private s3Client: S3Client;
  private rdsClient: RDSClient;
  private costExplorerClient: CostExplorerClient;
  private iamClient: IAMClient;

  constructor(credentials: AWSCredentials) {
    this.credentials = credentials;
    const region = credentials.region || 'us-east-1';
    
    // Initialize AWS clients with provided credentials
    const clientConfig = {
      region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      }
    };
    
    this.ec2Client = new EC2Client(clientConfig);
    this.s3Client = new S3Client(clientConfig);
    this.rdsClient = new RDSClient(clientConfig);
    this.costExplorerClient = new CostExplorerClient(clientConfig);
    this.iamClient = new IAMClient(clientConfig);
  }
  
  /**
   * Get all AWS resources (EC2, S3, RDS)
   */
  async getResources(): Promise<CloudResource[]> {
    try {
      console.log('Fetching AWS resources...');
      const resources: CloudResource[] = [];
      
      // Fetch EC2 instances
      try {
        const ec2Resources = await this.getEC2Resources();
        resources.push(...ec2Resources);
      } catch (error) {
        console.error('Error fetching EC2 resources:', error);
      }
      
      // Fetch S3 buckets
      try {
        const s3Resources = await this.getS3Resources();
        resources.push(...s3Resources);
      } catch (error) {
        console.error('Error fetching S3 resources:', error);
      }
      
      // Fetch RDS instances
      try {
        const rdsResources = await this.getRDSResources();
        resources.push(...rdsResources);
      } catch (error) {
        console.error('Error fetching RDS resources:', error);
      }
      
      console.log(`Fetched ${resources.length} AWS resources`);
      return resources;
    } catch (error) {
      console.error('Error in getResources:', error);
      return [];
    }
  }
  
  /**
   * Get cost data from AWS Cost Explorer
   */
  async getCostData(startDate: Date, endDate: Date): Promise<CostData[]> {
    try {
      console.log('Fetching AWS cost data...');
      
      // Format dates for AWS Cost Explorer
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      
      // Create the command to get cost data
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
          }
        ]
      });
      
      try {
        const response = await this.costExplorerClient.send(command);
        const costData: CostData[] = [];
        
        if (response.ResultsByTime) {
          for (const result of response.ResultsByTime) {
            const date = result.TimePeriod?.Start || '';
            
            if (result.Groups) {
              for (const group of result.Groups) {
                const service = group.Keys?.[0] || 'Unknown';
                const amount = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
                
                costData.push({
                  date,
                  amount,
                  service
                });
              }
            }
          }
        }
        
        console.log(`Fetched ${costData.length} cost data entries`);
        return costData;
      } catch (error) {
        console.error('Error fetching cost data from AWS:', error);
        // Return empty array if Cost Explorer access fails
        return [];
      }
    } catch (error) {
      console.error('Error in getCostData:', error);
      return [];
    }
  }

  /**
   * Get security findings from AWS
   * In a production environment, this would use AWS Security Hub
   */
  async getSecurityFindings(): Promise<SecurityFinding[]> {
    try {
      console.log('Fetching AWS security findings...');
      
      // In a real implementation, we would use the AWS Security Hub API
      // For now, we'll check for IAM access keys that might be too old
      const command = new ListAccessKeysCommand({});
      const response = await this.iamClient.send(command);
      
      const findings: SecurityFinding[] = [];
      
      if (response.AccessKeyMetadata) {
        for (const key of response.AccessKeyMetadata) {
          if (key.CreateDate) {
            const keyAge = Math.floor((Date.now() - key.CreateDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Flag keys older than 90 days
            if (keyAge > 90) {
              findings.push({
                id: `AWS-IAM-KEY-${key.AccessKeyId}`,
                resourceId: key.AccessKeyId || 'unknown',
                severity: 'medium',
                title: 'IAM Access Key too old',
                description: `Access key ${key.AccessKeyId} is ${keyAge} days old, which exceeds the recommended rotation period of 90 days.`,
                remediation: 'Rotate the access key by creating a new key and deleting the old one.',
                detectedAt: new Date().toISOString(),
                status: 'open'
              });
            }
          }
        }
      }
      
      return findings;
    } catch (error) {
      console.error('Error fetching security findings:', error);
      return [];
    }
  }

  /**
   * Get resource utilization data
   * In a production environment, this would use AWS CloudWatch
   */
  async getResourceUtilization(resourceIds: string[], metrics: string[]): Promise<ResourceUtilization[]> {
    try {
      console.log('Fetching AWS resource utilization...');
      
      // In a real implementation, we would use CloudWatch API to get utilization data
      // As this is complex without complete AWS credentials, we're returning an empty array for now
      return [];
    } catch (error) {
      console.error('Error fetching resource utilization:', error);
      return [];
    }
  }

  /**
   * Calculate cost anomalies 
   */
  async calculateCostAnomalies(): Promise<any[]> {
    try {
      console.log('Analyzing AWS cost data for anomalies...');

      // In a real implementation, we would analyze cost patterns to detect anomalies
      // This requires historical data and complex analysis
      return [];
    } catch (error) {
      console.error('Error calculating cost anomalies:', error);
      return [];
    }
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations(): Promise<any[]> {
    try {
      console.log('Generating AWS optimization recommendations...');
      
      // In a real implementation, we would analyze usage patterns to generate recommendations
      // This requires multiple data points and analysis from different services
      return [];
    } catch (error) {
      console.error('Error generating optimization recommendations:', error);
      return [];
    }
  }

  // Helper method to fetch EC2 instances
  private async getEC2Resources(): Promise<CloudResource[]> {
    const command = new DescribeInstancesCommand({});
    const response = await this.ec2Client.send(command);
    const resources: CloudResource[] = [];
    
    if (!response.Reservations) return resources;
    
    for (const reservation of response.Reservations) {
      if (!reservation.Instances) continue;
      
      for (const instance of reservation.Instances) {
        const tags: Record<string, string> = {};
        instance.Tags?.forEach(tag => {
          if (tag.Key && tag.Value) {
            tags[tag.Key] = tag.Value;
          }
        });
        
        const name = tags['Name'] || instance.InstanceId || 'Unnamed Instance';
        
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
          cost: 0,
          costPerMonth: 0,
          utilization: 0,
          metadata: {
            instanceType: instance.InstanceType || 'unknown',
            vpcId: instance.VpcId || 'unknown',
            publicIp: instance.PublicIpAddress || '',
            privateIp: instance.PrivateIpAddress || ''
          }
        });
      }
    }
    
    return resources;
  }
  
  // Helper method to fetch S3 buckets
  private async getS3Resources(): Promise<CloudResource[]> {
    const command = new ListBucketsCommand({});
    const response = await this.s3Client.send(command);
    const resources: CloudResource[] = [];
    
    if (!response.Buckets) return resources;
    
    for (const bucket of response.Buckets) {
      // Try to get bucket tags
      let bucketTags: Record<string, string> = {};
      try {
        const taggingCommand = new GetBucketTaggingCommand({
          Bucket: bucket.Name
        });
        const taggingResponse = await this.s3Client.send(taggingCommand);
        
        taggingResponse.TagSet?.forEach(tag => {
          if (tag.Key && tag.Value) {
            bucketTags[tag.Key] = tag.Value;
          }
        });
      } catch (error) {
        // Bucket might not have tags, that's okay
        console.log(`No tags for bucket ${bucket.Name}`);
      }
      
      resources.push({
        id: bucket.Name || `s3-${Date.now()}`,
        name: bucket.Name || 'Unnamed Bucket',
        type: 'S3',
        region: this.credentials.region || 'us-east-1', // Buckets are global but have a region
        provider: CloudProvider.AWS,
        status: 'active', // S3 buckets are always active if they exist
        tags: bucketTags,
        createdAt: bucket.CreationDate?.toISOString() || new Date().toISOString(),
        cost: 0,
        costPerMonth: 0,
        metadata: {
          sizeGB: 0, // Would need additional requests for this
          objects: 0, // Would need additional requests for this
          versioning: 'Unknown' // Would need additional requests for this
        }
      });
    }
    
    return resources;
  }
  
  // Helper method to fetch RDS instances
  private async getRDSResources(): Promise<CloudResource[]> {
    const command = new DescribeDBInstancesCommand({});
    const response = await this.rdsClient.send(command);
    const resources: CloudResource[] = [];
    
    if (!response.DBInstances) return resources;
    
    for (const dbInstance of response.DBInstances) {
      // Extract tags if available
      const tags: Record<string, string> = {};
      dbInstance.TagList?.forEach(tag => {
        if (tag.Key && tag.Value) {
          tags[tag.Key] = tag.Value;
        }
      });
      
      const name = tags['Name'] || dbInstance.DBInstanceIdentifier || 'Unnamed DB';
      
      resources.push({
        id: dbInstance.DBInstanceIdentifier || `rds-${Date.now()}`,
        name,
        type: 'RDS',
        region: this.credentials.region || 'us-east-1',
        provider: CloudProvider.AWS,
        status: dbInstance.DBInstanceStatus || 'unknown',
        tags,
        createdAt: dbInstance.InstanceCreateTime?.toISOString() || new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        cost: 0,
        costPerMonth: 0,
        utilization: 0,
        metadata: {
          engine: dbInstance.Engine || 'unknown',
          version: dbInstance.EngineVersion || 'unknown',
          instanceClass: dbInstance.DBInstanceClass || 'unknown',
          storageGB: dbInstance.AllocatedStorage || 0
        }
      });
    }
    
    return resources;
  }
}