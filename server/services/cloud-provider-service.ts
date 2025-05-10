import { 
  CloudProvider, 
  AllCloudCredentials, 
  AWSCredentials, 
  GCPCredentials, 
  AzureCredentials,
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
 * Interface defining the methods for cloud provider implementations
 */
interface CloudProviderInterface {
  getResources(): Promise<CloudResource[]>;
  getCostData(startDate: Date, endDate: Date): Promise<CostData[]>;
  getSecurityFindings(): Promise<SecurityFinding[]>;
  getResourceUtilization(resourceIds: string[], metrics: string[]): Promise<ResourceUtilization[]>;
  calculateCostAnomalies(): Promise<any[]>;
  generateOptimizationRecommendations(): Promise<any[]>;
}

/**
 * AWS Provider Implementation
 */
class AWSProvider implements CloudProviderInterface {
  private credentials: AWSCredentials;
  private ec2Client: EC2Client;
  private s3Client: S3Client;
  private rdsClient: RDSClient;
  private costExplorerClient: CostExplorerClient;

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
  }

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
      throw error;
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
          lastUsed: new Date().toISOString(), // AWS doesn't provide this directly
          cost: 0, // Would need Cost Explorer for real costs
          costPerMonth: 0, // Would need Cost Explorer for real costs
          utilization: 0, // Would need CloudWatch for utilization
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
        cost: 0, // Would need Cost Explorer for real costs
        costPerMonth: 0, // Would need Cost Explorer for real costs
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
        lastUsed: new Date().toISOString(), // AWS doesn't provide this directly
        cost: 0, // Would need Cost Explorer for real costs
        costPerMonth: 0, // Would need Cost Explorer for real costs
        utilization: 0, // Would need CloudWatch for utilization
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
        // This could happen if the account doesn't have Cost Explorer enabled
        // or if the IAM permissions don't allow Cost Explorer access
        console.log('Failed to fetch cost data');
        return this.getNoCostData();
      }
    } catch (error) {
      console.error('Error in getCostData:', error);
      return this.getNoCostData();
    }
  }
  
  // Return empty cost data when Cost Explorer access fails or is not configured
  private getNoCostData(): CostData[] {
    return [];
  }

  async getSecurityFindings(): Promise<SecurityFinding[]> {
    // In a real implementation, we would use the AWS Security Hub API
    console.log('Fetching AWS security findings...');
    
    try {
      // TODO: Implement real AWS Security Hub API integration when credentials are provided
      // For now, return empty array to indicate no findings are available without credentials
      return [];
    } catch (error) {
      console.error('Error fetching security findings:', error);
      return [];
    }
  }

  async getResourceUtilization(resourceIds: string[], metrics: string[]): Promise<ResourceUtilization[]> {
    // In a real implementation, we would use the AWS CloudWatch API
    console.log('Fetching AWS resource utilization...');
    
    try {
      // TODO: Implement real AWS CloudWatch API integration when credentials are provided
      // For now, return empty array to indicate no utilization data is available without credentials
      return [];
    } catch (error) {
      console.error('Error fetching resource utilization:', error);
      return [];
    }
  }

  async calculateCostAnomalies(): Promise<any[]> {
    // In a real implementation, we would analyze cost data to detect anomalies
    // For demo purposes, we'll return simulated cost anomalies
    return [
      {
        resourceId: 'i-0987654321fedcba0',
        anomalyType: 'spike',
        severity: 'high',
        percentage: 65,
        previousCost: 42580, // $425.80
        currentCost: 69120, // $691.20
        services: ['EC2', 'EBS'],
        detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async generateOptimizationRecommendations(): Promise<any[]> {
    // In a real implementation, we would analyze resource usage to generate recommendations
    // For demo purposes, we'll return simulated recommendations
    return [
      {
        resourceId: 'i-1234567890abcdef0',
        recommendationType: 'rightsize',
        description: 'This instance is consistently underutilized. Consider downsizing from t3.large to t3.medium.',
        potentialSavings: 16200, // $162.00 per month
        confidence: 'high'
      },
      {
        resourceId: 's3-data-bucket-prod',
        recommendationType: 'lifecycle',
        description: 'Implement a lifecycle policy to transition older objects to Glacier storage.',
        potentialSavings: 125, // $1.25 per month
        confidence: 'medium'
      }
    ];
  }
}

/**
 * GCP Provider Implementation
 */
class GCPProvider implements CloudProviderInterface {
  private credentials: GCPCredentials;

  constructor(credentials: GCPCredentials) {
    this.credentials = credentials;
  }

  async getResources(): Promise<CloudResource[]> {
    // In a real implementation, we would use the GCP API to fetch resources
    // For demo purposes, we'll return simulated resources
    return [
      {
        id: 'gce-1234',
        name: 'App Server',
        type: 'Compute Engine',
        region: 'us-central1',
        provider: CloudProvider.GCP,
        status: 'running',
        tags: { environment: 'production', role: 'app' },
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        cost: 35, // $0.35 per hour
        costPerMonth: 25200, // $252.00 per month
        utilization: 0.65, // 65% utilization
        metadata: {
          machineType: 'n1-standard-2',
          zone: 'us-central1-a',
          networkTags: ['http-server', 'https-server']
        }
      },
      {
        id: 'cloudsql-5678',
        name: 'Customer Database',
        type: 'Cloud SQL',
        region: 'us-central1',
        provider: CloudProvider.GCP,
        status: 'running',
        tags: { environment: 'production', data: 'customer' },
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        cost: 18, // $0.18 per hour
        costPerMonth: 12960, // $129.60 per month
        utilization: 0.53, // 53% utilization
        metadata: {
          dbType: 'PostgreSQL',
          version: '12',
          tier: 'db-n1-standard-1',
          storageGB: 50
        }
      }
    ];
  }

  async getCostData(startDate: Date, endDate: Date): Promise<CostData[]> {
    // In a real implementation, we would use the GCP Billing API
    // For demo purposes, we'll generate simulated cost data
    const costData: CostData[] = [];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    
    // Generate daily cost data
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Base cost plus some randomness
      const baseCost = 80;
      const randomVariance = Math.random() * 30 - 15; // -15 to +15
      const cost = Math.max(baseCost + randomVariance, 30); // Ensure minimum $0.30
      
      costData.push({
        date: date.toISOString().split('T')[0],
        amount: Math.round(cost * 100) / 100,
        service: 'Compute Engine'
      });
      
      costData.push({
        date: date.toISOString().split('T')[0],
        amount: Math.round((cost * 0.25) * 100) / 100,
        service: 'Cloud SQL'
      });
    }
    
    return costData;
  }

  async getSecurityFindings(): Promise<SecurityFinding[]> {
    // In a real implementation, we would use the GCP Security Command Center API
    // For demo purposes, we'll return simulated security findings
    return [
      {
        id: 'GCP-SEC-001',
        resourceId: 'gce-1234',
        severity: 'medium',
        title: 'VM instance has unnecessary open ports',
        description: 'The VM instance gce-1234 has firewall rules allowing access to non-essential ports from all sources.',
        remediation: 'Restrict firewall rules to allow access only to necessary ports and from trusted sources.',
        detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open'
      }
    ];
  }

  async getResourceUtilization(resourceIds: string[], metrics: string[]): Promise<ResourceUtilization[]> {
    // In a real implementation, we would use the GCP Monitoring API
    // For demo purposes, we'll return simulated utilization data
    const utilization: ResourceUtilization[] = [];
    
    // Generate utilization data for Compute Engine instances
    for (const resourceId of resourceIds.filter(id => id.startsWith('gce-'))) {
      // CPU utilization
      if (metrics.includes('cpu') || metrics.length === 0) {
        for (let i = 0; i < 24; i++) {
          const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
          const baseValue = 55; // 55% base utilization
          const randomVariance = Math.random() * 25; // 0-25% variance
          
          utilization.push({
            resourceId,
            metric: 'cpu',
            value: Math.min(baseValue + randomVariance, 100),
            timestamp: timestamp.toISOString(),
            unit: 'percent'
          });
        }
      }
    }
    
    // Generate utilization data for Cloud SQL instances
    for (const resourceId of resourceIds.filter(id => id.startsWith('cloudsql-'))) {
      // Storage utilization
      if (metrics.includes('storage') || metrics.length === 0) {
        for (let i = 0; i < 24; i++) {
          const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
          const baseValue = 45; // 45% base utilization
          const randomVariance = Math.random() * 5; // 0-5% variance
          
          utilization.push({
            resourceId,
            metric: 'storage',
            value: baseValue + randomVariance,
            timestamp: timestamp.toISOString(),
            unit: 'percent'
          });
        }
      }
    }
    
    return utilization;
  }

  async calculateCostAnomalies(): Promise<any[]> {
    // For demo purposes, we'll return simulated cost anomalies
    return [
      {
        resourceId: 'gce-1234',
        anomalyType: 'trend',
        severity: 'medium',
        percentage: 28,
        previousCost: 19680, // $196.80
        currentCost: 25200, // $252.00
        services: ['Compute Engine'],
        detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async generateOptimizationRecommendations(): Promise<any[]> {
    // For demo purposes, we'll return simulated recommendations
    return [
      {
        resourceId: 'cloudsql-5678',
        recommendationType: 'storage_optimization',
        description: 'This Cloud SQL instance has 50GB of provisioned storage but is only using 45%. Consider reducing the provisioned storage.',
        potentialSavings: 3890, // $38.90 per month
        confidence: 'medium'
      }
    ];
  }
}

/**
 * Azure Provider Implementation
 */
class AzureProvider implements CloudProviderInterface {
  private credentials: AzureCredentials;

  constructor(credentials: AzureCredentials) {
    this.credentials = credentials;
  }

  async getResources(): Promise<CloudResource[]> {
    // In a real implementation, we would use the Azure Management API
    // For demo purposes, we'll return simulated resources
    return [
      {
        id: 'vm-9876',
        name: 'Data Processing',
        type: 'Virtual Machine',
        region: 'eastus',
        provider: CloudProvider.AZURE,
        status: 'running',
        tags: { Environment: 'Production', Role: 'Data' },
        createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        cost: 41, // $0.41 per hour
        costPerMonth: 29520, // $295.20 per month
        utilization: 0.62, // 62% utilization
        metadata: {
          vmSize: 'Standard_D2s_v3',
          osType: 'Linux',
          diskSizeGB: 128
        }
      },
      {
        id: 'sqldb-5432',
        name: 'Product Database',
        type: 'SQL Database',
        region: 'eastus',
        provider: CloudProvider.AZURE,
        status: 'online',
        tags: { Environment: 'Production', Data: 'Product' },
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        cost: 16, // $0.16 per hour
        costPerMonth: 11520, // $115.20 per month
        utilization: 0.38, // 38% utilization
        metadata: {
          tier: 'Standard',
          maxSizeGB: 100,
          dtu: 50
        }
      },
      {
        id: 'storage-7890',
        name: 'Application Files',
        type: 'Storage Account',
        region: 'eastus',
        provider: CloudProvider.AZURE,
        status: 'available',
        tags: { Environment: 'Production', Purpose: 'Files' },
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        cost: 8, // $0.08 per day
        costPerMonth: 240, // $2.40 per month
        metadata: {
          tier: 'Standard_LRS',
          sizeGB: 80
        }
      }
    ];
  }

  async getCostData(startDate: Date, endDate: Date): Promise<CostData[]> {
    // In a real implementation, we would use the Azure Cost Management API
    // For demo purposes, we'll generate simulated cost data
    const costData: CostData[] = [];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    
    // Generate daily cost data
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Base cost plus some randomness
      const baseCost = 120;
      const randomVariance = Math.random() * 40 - 20; // -20 to +20
      const cost = Math.max(baseCost + randomVariance, 60); // Ensure minimum $0.60
      
      costData.push({
        date: date.toISOString().split('T')[0],
        amount: Math.round(cost * 100) / 100,
        service: 'Virtual Machines'
      });
      
      costData.push({
        date: date.toISOString().split('T')[0],
        amount: Math.round((cost * 0.3) * 100) / 100,
        service: 'SQL Database'
      });
      
      costData.push({
        date: date.toISOString().split('T')[0],
        amount: Math.round((cost * 0.05) * 100) / 100,
        service: 'Storage'
      });
    }
    
    return costData;
  }

  async getSecurityFindings(): Promise<SecurityFinding[]> {
    // In a real implementation, we would use the Azure Security Center API
    // For demo purposes, we'll return simulated security findings
    return [
      {
        id: 'AZ-SEC-001',
        resourceId: 'vm-9876',
        severity: 'high',
        title: 'Operating system vulnerabilities',
        description: 'The virtual machine vm-9876 has operating system vulnerabilities that need to be patched.',
        remediation: 'Apply the latest security patches to the operating system.',
        detectedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open'
      },
      {
        id: 'AZ-SEC-002',
        resourceId: 'storage-7890',
        severity: 'medium',
        title: 'Storage account not using HTTPS',
        description: 'The storage account storage-7890 allows insecure HTTP traffic.',
        remediation: 'Configure the storage account to accept only HTTPS connections.',
        detectedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open'
      }
    ];
  }

  async getResourceUtilization(resourceIds: string[], metrics: string[]): Promise<ResourceUtilization[]> {
    // In a real implementation, we would use the Azure Monitor API
    // For demo purposes, we'll return simulated utilization data
    const utilization: ResourceUtilization[] = [];
    
    // Generate utilization data for Virtual Machines
    for (const resourceId of resourceIds.filter(id => id.startsWith('vm-'))) {
      // CPU utilization
      if (metrics.includes('cpu') || metrics.length === 0) {
        for (let i = 0; i < 24; i++) {
          const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
          const baseValue = 50; // 50% base utilization
          const randomVariance = Math.random() * 25; // 0-25% variance
          
          utilization.push({
            resourceId,
            metric: 'cpu',
            value: Math.min(baseValue + randomVariance, 100),
            timestamp: timestamp.toISOString(),
            unit: 'percent'
          });
        }
      }
      
      // Disk IO
      if (metrics.includes('diskIO') || metrics.length === 0) {
        for (let i = 0; i < 24; i++) {
          const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
          const baseValue = 20; // 20 MB/s base utilization
          const randomVariance = Math.random() * 10; // 0-10 MB/s variance
          
          utilization.push({
            resourceId,
            metric: 'diskIO',
            value: baseValue + randomVariance,
            timestamp: timestamp.toISOString(),
            unit: 'MBps'
          });
        }
      }
    }
    
    // Generate utilization data for SQL Databases
    for (const resourceId of resourceIds.filter(id => id.startsWith('sqldb-'))) {
      // DTU utilization
      if (metrics.includes('dtu') || metrics.length === 0) {
        for (let i = 0; i < 24; i++) {
          const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
          const baseValue = 30; // 30% base utilization
          const randomVariance = Math.random() * 20; // 0-20% variance
          
          utilization.push({
            resourceId,
            metric: 'dtu',
            value: baseValue + randomVariance,
            timestamp: timestamp.toISOString(),
            unit: 'percent'
          });
        }
      }
    }
    
    return utilization;
  }

  async calculateCostAnomalies(): Promise<any[]> {
    // For demo purposes, we'll return simulated cost anomalies
    return [
      {
        resourceId: 'vm-9876',
        anomalyType: 'spike',
        severity: 'low',
        percentage: 15,
        previousCost: 25680, // $256.80
        currentCost: 29520, // $295.20
        services: ['Virtual Machines', 'Managed Disks'],
        detectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async generateOptimizationRecommendations(): Promise<any[]> {
    // For demo purposes, we'll return simulated recommendations
    return [
      {
        resourceId: 'sqldb-5432',
        recommendationType: 'performance_tier',
        description: 'This SQL Database is consistently underutilized. Consider switching from DTU-based pricing to vCore with serverless option for automatic scaling.',
        potentialSavings: 4608, // $46.08 per month
        confidence: 'high'
      },
      {
        resourceId: 'vm-9876',
        recommendationType: 'reserved_instance',
        description: 'This Virtual Machine has been running consistently. Consider purchasing a 1-year reserved instance to reduce costs.',
        potentialSavings: 8856, // $88.56 per month
        confidence: 'high'
      }
    ];
  }
}

/**
 * Cloud Provider Service to manage multiple cloud providers
 */
export class CloudProviderService {
  private providers: Map<CloudProvider, CloudProviderInterface> = new Map();

  constructor(credentials: AllCloudCredentials[]) {
    // Initialize providers from credentials
    credentials.forEach(cred => this.addProvider(cred));
  }

  /**
   * Add a cloud provider
   */
  addProvider(credentials: AllCloudCredentials): void {
    switch (credentials.provider) {
      case CloudProvider.AWS:
        this.providers.set(
          CloudProvider.AWS, 
          new AWSProvider(credentials as AWSCredentials)
        );
        break;
      case CloudProvider.GCP:
        this.providers.set(
          CloudProvider.GCP, 
          new GCPProvider(credentials as GCPCredentials)
        );
        break;
      case CloudProvider.AZURE:
        this.providers.set(
          CloudProvider.AZURE, 
          new AzureProvider(credentials as AzureCredentials)
        );
        break;
      default:
        throw new Error(`Unsupported cloud provider: ${credentials.provider}`);
    }
  }

  /**
   * Remove a cloud provider
   */
  removeProvider(provider: CloudProvider): void {
    this.providers.delete(provider);
  }

  /**
   * Get resources from all configured providers
   */
  async getAllResources(): Promise<CloudResource[]> {
    const resourcePromises = Array.from(this.providers.values()).map(provider => 
      provider.getResources()
    );
    
    const allResourceArrays = await Promise.all(resourcePromises);
    return allResourceArrays.flat();
  }

  /**
   * Get resources from a specific provider
   */
  async getResourcesByProvider(provider: CloudProvider): Promise<CloudResource[]> {
    const providerImpl = this.providers.get(provider);
    
    if (!providerImpl) {
      return [];
    }
    
    return await providerImpl.getResources();
  }
  
  /**
   * Sync resources for a specific provider
   * @param provider The cloud provider to sync
   * @returns List of resources after sync
   */
  async syncProvider(provider: CloudProvider): Promise<CloudResource[]> {
    console.log(`Syncing provider: ${provider}`);
    const providerImpl = this.providers.get(provider);
    
    if (!providerImpl) {
      console.error(`Provider ${provider} is not configured for sync`);
      return [];
    }
    
    // For now, this just fetches resources again, but in a real implementation
    // we might invalidate caches, trigger background jobs, etc.
    return await providerImpl.getResources();
  }

  /**
   * Get cost data from all configured providers
   */
  async getAllCostData(startDate: Date, endDate: Date): Promise<CostData[]> {
    const costPromises = Array.from(this.providers.values()).map(provider => 
      provider.getCostData(startDate, endDate)
    );
    
    const allCostArrays = await Promise.all(costPromises);
    return allCostArrays.flat();
  }

  /**
   * Get security findings from all configured providers
   */
  async getAllSecurityFindings(): Promise<SecurityFinding[]> {
    const securityPromises = Array.from(this.providers.values()).map(provider => 
      provider.getSecurityFindings()
    );
    
    const allSecurityArrays = await Promise.all(securityPromises);
    return allSecurityArrays.flat();
  }

  /**
   * Get resource utilization data from all configured providers
   */
  async getAllResourceUtilization(resourceIds: string[], metrics: string[]): Promise<ResourceUtilization[]> {
    const utilizationPromises = Array.from(this.providers.values()).map(provider => 
      provider.getResourceUtilization(resourceIds, metrics)
    );
    
    const allUtilizationArrays = await Promise.all(utilizationPromises);
    return allUtilizationArrays.flat();
  }

  /**
   * Calculate cost anomalies across all configured providers
   */
  async calculateAllCostAnomalies(): Promise<any[]> {
    const anomalyPromises = Array.from(this.providers.values()).map(provider => 
      provider.calculateCostAnomalies()
    );
    
    const allAnomalyArrays = await Promise.all(anomalyPromises);
    return allAnomalyArrays.flat();
  }

  /**
   * Generate optimization recommendations across all configured providers
   */
  async generateAllOptimizationRecommendations(): Promise<any[]> {
    const recommendationPromises = Array.from(this.providers.values()).map(provider => 
      provider.generateOptimizationRecommendations()
    );
    
    const allRecommendationArrays = await Promise.all(recommendationPromises);
    return allRecommendationArrays.flat();
  }

  /**
   * Check if a specific provider is configured
   */
  isProviderConfigured(provider: CloudProvider): boolean {
    return this.providers.has(provider);
  }

  /**
   * Get a list of all configured providers
   */
  getConfiguredProviders(): CloudProvider[] {
    return Array.from(this.providers.keys());
  }
}