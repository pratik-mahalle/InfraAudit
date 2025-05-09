import { db, pool } from "./db";
import { 
  users, resources, securityDrifts, costAnomalies, alerts, recommendations 
} from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";


const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  try {
    // Check if we already have data
    const allUsers = await db.select().from(users);
    if (allUsers.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database with initial data...");

    // Create demo user
    const [user] = await db.insert(users).values({
      username: 'demo',
      password: await hashPassword('password'),
      fullName: 'Demo User',
      role: 'admin'
    }).returning();
    
    console.log("Created demo user:", user.username);

    // Create sample resources
    const [awsEc2] = await db.insert(resources).values({
      name: 'web-server-prod',
      type: 'EC2',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'running',
      tags: { environment: 'production', app: 'web' },
      cost: 8400
    }).returning();
    
    const [apiServer] = await db.insert(resources).values({
      name: 'api-server-prod',
      type: 'EC2',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'running',
      tags: { environment: 'production', app: 'api' },
      cost: 6200
    }).returning();
    
    const [s3Bucket] = await db.insert(resources).values({
      name: 's3-customer-data',
      type: 'S3',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'active',
      tags: { environment: 'production', data: 'customer' },
      cost: 2500
    }).returning();
    
    const [rdsCluster] = await db.insert(resources).values({
      name: 'rds-analytics-cluster',
      type: 'RDS',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'running',
      tags: { environment: 'production', app: 'analytics' },
      cost: 12000
    }).returning();
    
    const [apiGateway] = await db.insert(resources).values({
      name: 'api-gateway-prod',
      type: 'ApiGateway',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'active',
      tags: { environment: 'production', app: 'api' },
      cost: 1800
    }).returning();

    console.log("Created sample resources");
    
    // Create sample security drifts
    await db.insert(securityDrifts).values({
      resourceId: s3Bucket.id,
      driftType: 'Public Access',
      severity: 'critical',
      details: { previous: 'private', current: 'public' },
      status: 'open'
    });
    
    await db.insert(securityDrifts).values({
      resourceId: apiGateway.id,
      driftType: 'IAM Policy Change',
      severity: 'high',
      details: { policy: 'API execution permissions expanded' },
      status: 'open'
    });
    
    await db.insert(securityDrifts).values({
      resourceId: rdsCluster.id,
      driftType: 'Encryption Disabled',
      severity: 'high',
      details: { previous: 'encrypted', current: 'unencrypted' },
      status: 'open'
    });

    console.log("Created sample security drifts");
    
    // Create sample cost anomalies
    await db.insert(costAnomalies).values({
      resourceId: awsEc2.id,
      anomalyType: 'spike',
      severity: 'critical',
      percentage: 43,
      previousCost: 5800,
      currentCost: 8400,
      status: 'open'
    });

    console.log("Created sample cost anomalies");
    
    // Create sample alerts
    await db.insert(alerts).values({
      title: 'Cost anomaly detected in EC2',
      message: 'Unexpected 43% increase in compute costs over the last 24 hours.',
      type: 'cost',
      severity: 'critical',
      resourceId: awsEc2.id,
      status: 'open'
    });
    
    await db.insert(alerts).values({
      title: 'Security group modified',
      message: 'Port 22 (SSH) opened to 0.0.0.0/0 on production-web-sg.',
      type: 'security',
      severity: 'high',
      resourceId: awsEc2.id,
      status: 'open'
    });
    
    await db.insert(alerts).values({
      title: 'S3 access policy changed',
      message: 'Public read access granted to data-exports bucket.',
      type: 'security',
      severity: 'high',
      resourceId: s3Bucket.id,
      status: 'open'
    });

    console.log("Created sample alerts");
    
    // Create sample recommendations
    await db.insert(recommendations).values({
      title: 'Right-size over-provisioned instances',
      description: '15 EC2 instances consistently using <20% CPU and memory.',
      type: 'rightsizing',
      potentialSavings: 218000,
      resourcesAffected: [awsEc2.id, apiServer.id],
      status: 'open'
    });
    
    await db.insert(recommendations).values({
      title: 'Remove unused EBS volumes',
      description: '8 unattached EBS volumes totaling 1.2TB of storage.',
      type: 'unused_resources',
      potentialSavings: 84000,
      resourcesAffected: [],
      status: 'open'
    });
    
    await db.insert(recommendations).values({
      title: 'Optimize S3 storage classes',
      description: '3.5TB of infrequently accessed data in Standard tier.',
      type: 'storage_optimization',
      potentialSavings: 62000,
      resourcesAffected: [s3Bucket.id],
      status: 'open'
    });

    console.log("Created sample recommendations");
    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}