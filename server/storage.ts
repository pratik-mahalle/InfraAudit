import {
  users, resources, securityDrifts, costAnomalies, alerts, recommendations,
  type User, type InsertUser, 
  type Resource, type InsertResource,
  type SecurityDrift, type InsertSecurityDrift,
  type CostAnomaly, type InsertCostAnomaly,
  type Alert, type InsertAlert,
  type Recommendation, type InsertRecommendation
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Resource operations
  getResources(): Promise<Resource[]>;
  getResourceById(id: number): Promise<Resource | undefined>;
  getResourcesByProvider(provider: string): Promise<Resource[]>;
  getResourcesByType(type: string): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<Resource>): Promise<Resource | undefined>;
  
  // SecurityDrift operations
  getSecurityDrifts(): Promise<SecurityDrift[]>;
  getSecurityDriftById(id: number): Promise<SecurityDrift | undefined>;
  getSecurityDriftsByResource(resourceId: number): Promise<SecurityDrift[]>;
  getSecurityDriftsBySeverity(severity: string): Promise<SecurityDrift[]>;
  createSecurityDrift(drift: InsertSecurityDrift): Promise<SecurityDrift>;
  updateSecurityDrift(id: number, drift: Partial<SecurityDrift>): Promise<SecurityDrift | undefined>;
  
  // CostAnomaly operations
  getCostAnomalies(): Promise<CostAnomaly[]>;
  getCostAnomalyById(id: number): Promise<CostAnomaly | undefined>;
  getCostAnomaliesByResource(resourceId: number): Promise<CostAnomaly[]>;
  getCostAnomaliesBySeverity(severity: string): Promise<CostAnomaly[]>;
  createCostAnomaly(anomaly: InsertCostAnomaly): Promise<CostAnomaly>;
  updateCostAnomaly(id: number, anomaly: Partial<CostAnomaly>): Promise<CostAnomaly | undefined>;
  
  // Alert operations
  getAlerts(): Promise<Alert[]>;
  getAlertById(id: number): Promise<Alert | undefined>;
  getAlertsByType(type: string): Promise<Alert[]>;
  getAlertsBySeverity(severity: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: number, alert: Partial<Alert>): Promise<Alert | undefined>;
  
  // Recommendation operations
  getRecommendations(): Promise<Recommendation[]>;
  getRecommendationById(id: number): Promise<Recommendation | undefined>;
  getRecommendationsByType(type: string): Promise<Recommendation[]>;
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  updateRecommendation(id: number, recommendation: Partial<Recommendation>): Promise<Recommendation | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private resources: Map<number, Resource>;
  private securityDrifts: Map<number, SecurityDrift>;
  private costAnomalies: Map<number, CostAnomaly>;
  private alerts: Map<number, Alert>;
  private recommendations: Map<number, Recommendation>;
  
  private userId: number;
  private resourceId: number;
  private securityDriftId: number;
  private costAnomalyId: number;
  private alertId: number;
  private recommendationId: number;

  constructor() {
    this.users = new Map();
    this.resources = new Map();
    this.securityDrifts = new Map();
    this.costAnomalies = new Map();
    this.alerts = new Map();
    this.recommendations = new Map();
    
    this.userId = 1;
    this.resourceId = 1;
    this.securityDriftId = 1;
    this.costAnomalyId = 1;
    this.alertId = 1;
    this.recommendationId = 1;
    
    this.initializeData();
  }

  // Initialize with sample data
  private initializeData() {
    // Create demo user
    this.createUser({
      username: 'demo',
      password: 'password',
      fullName: 'Demo User',
      role: 'admin'
    });
    
    // Create sample resources
    const awsEc2 = this.createResource({
      name: 'web-server-prod',
      type: 'EC2',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'running',
      tags: { environment: 'production', app: 'web' },
      cost: 8400
    });
    
    this.createResource({
      name: 'api-server-prod',
      type: 'EC2',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'running',
      tags: { environment: 'production', app: 'api' },
      cost: 6200
    });
    
    this.createResource({
      name: 's3-customer-data',
      type: 'S3',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'active',
      tags: { environment: 'production', data: 'customer' },
      cost: 2500
    });
    
    this.createResource({
      name: 'rds-analytics-cluster',
      type: 'RDS',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'running',
      tags: { environment: 'production', app: 'analytics' },
      cost: 12000
    });
    
    this.createResource({
      name: 'api-gateway-prod',
      type: 'ApiGateway',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'active',
      tags: { environment: 'production', app: 'api' },
      cost: 1800
    });
    
    // Create sample security drifts
    this.createSecurityDrift({
      resourceId: 3,
      driftType: 'Public Access',
      severity: 'critical',
      details: { previous: 'private', current: 'public' },
      status: 'open'
    });
    
    this.createSecurityDrift({
      resourceId: 5,
      driftType: 'IAM Policy Change',
      severity: 'high',
      details: { policy: 'API execution permissions expanded' },
      status: 'open'
    });
    
    this.createSecurityDrift({
      resourceId: 4,
      driftType: 'Encryption Disabled',
      severity: 'high',
      details: { previous: 'encrypted', current: 'unencrypted' },
      status: 'open'
    });
    
    // Create sample cost anomalies
    this.createCostAnomaly({
      resourceId: 1,
      anomalyType: 'spike',
      severity: 'critical',
      percentage: 43,
      previousCost: 5800,
      currentCost: 8400,
      status: 'open'
    });
    
    // Create sample alerts
    this.createAlert({
      title: 'Cost anomaly detected in EC2',
      message: 'Unexpected 43% increase in compute costs over the last 24 hours.',
      type: 'cost',
      severity: 'critical',
      resourceId: 1,
      status: 'open'
    });
    
    this.createAlert({
      title: 'Security group modified',
      message: 'Port 22 (SSH) opened to 0.0.0.0/0 on production-web-sg.',
      type: 'security',
      severity: 'high',
      resourceId: 1,
      status: 'open'
    });
    
    this.createAlert({
      title: 'S3 access policy changed',
      message: 'Public read access granted to data-exports bucket.',
      type: 'security',
      severity: 'high',
      resourceId: 3,
      status: 'open'
    });
    
    // Create sample recommendations
    this.createRecommendation({
      title: 'Right-size over-provisioned instances',
      description: '15 EC2 instances consistently using <20% CPU and memory.',
      type: 'rightsizing',
      potentialSavings: 218000,
      resourcesAffected: [1, 2],
      status: 'open'
    });
    
    this.createRecommendation({
      title: 'Remove unused EBS volumes',
      description: '8 unattached EBS volumes totaling 1.2TB of storage.',
      type: 'unused_resources',
      potentialSavings: 84000,
      resourcesAffected: [],
      status: 'open'
    });
    
    this.createRecommendation({
      title: 'Optimize S3 storage classes',
      description: '3.5TB of infrequently accessed data in Standard tier.',
      type: 'storage_optimization',
      potentialSavings: 62000,
      resourcesAffected: [3],
      status: 'open'
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Resource methods
  async getResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async getResourceById(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async getResourcesByProvider(provider: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(
      (resource) => resource.provider === provider
    );
  }

  async getResourcesByType(type: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(
      (resource) => resource.type === type
    );
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const id = this.resourceId++;
    const now = new Date();
    const resource: Resource = { ...insertResource, id, createdAt: now };
    this.resources.set(id, resource);
    return resource;
  }

  async updateResource(id: number, resource: Partial<Resource>): Promise<Resource | undefined> {
    const existingResource = this.resources.get(id);
    if (!existingResource) return undefined;
    
    const updatedResource = { ...existingResource, ...resource };
    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  // SecurityDrift methods
  async getSecurityDrifts(): Promise<SecurityDrift[]> {
    return Array.from(this.securityDrifts.values());
  }

  async getSecurityDriftById(id: number): Promise<SecurityDrift | undefined> {
    return this.securityDrifts.get(id);
  }

  async getSecurityDriftsByResource(resourceId: number): Promise<SecurityDrift[]> {
    return Array.from(this.securityDrifts.values()).filter(
      (drift) => drift.resourceId === resourceId
    );
  }

  async getSecurityDriftsBySeverity(severity: string): Promise<SecurityDrift[]> {
    return Array.from(this.securityDrifts.values()).filter(
      (drift) => drift.severity === severity
    );
  }

  async createSecurityDrift(insertDrift: InsertSecurityDrift): Promise<SecurityDrift> {
    const id = this.securityDriftId++;
    const now = new Date();
    const drift: SecurityDrift = { ...insertDrift, id, detectedAt: now };
    this.securityDrifts.set(id, drift);
    return drift;
  }

  async updateSecurityDrift(id: number, drift: Partial<SecurityDrift>): Promise<SecurityDrift | undefined> {
    const existingDrift = this.securityDrifts.get(id);
    if (!existingDrift) return undefined;
    
    const updatedDrift = { ...existingDrift, ...drift };
    this.securityDrifts.set(id, updatedDrift);
    return updatedDrift;
  }

  // CostAnomaly methods
  async getCostAnomalies(): Promise<CostAnomaly[]> {
    return Array.from(this.costAnomalies.values());
  }

  async getCostAnomalyById(id: number): Promise<CostAnomaly | undefined> {
    return this.costAnomalies.get(id);
  }

  async getCostAnomaliesByResource(resourceId: number): Promise<CostAnomaly[]> {
    return Array.from(this.costAnomalies.values()).filter(
      (anomaly) => anomaly.resourceId === resourceId
    );
  }

  async getCostAnomaliesBySeverity(severity: string): Promise<CostAnomaly[]> {
    return Array.from(this.costAnomalies.values()).filter(
      (anomaly) => anomaly.severity === severity
    );
  }

  async createCostAnomaly(insertAnomaly: InsertCostAnomaly): Promise<CostAnomaly> {
    const id = this.costAnomalyId++;
    const now = new Date();
    const anomaly: CostAnomaly = { ...insertAnomaly, id, detectedAt: now };
    this.costAnomalies.set(id, anomaly);
    return anomaly;
  }

  async updateCostAnomaly(id: number, anomaly: Partial<CostAnomaly>): Promise<CostAnomaly | undefined> {
    const existingAnomaly = this.costAnomalies.get(id);
    if (!existingAnomaly) return undefined;
    
    const updatedAnomaly = { ...existingAnomaly, ...anomaly };
    this.costAnomalies.set(id, updatedAnomaly);
    return updatedAnomaly;
  }

  // Alert methods
  async getAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values());
  }

  async getAlertById(id: number): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async getAlertsByType(type: string): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.type === type
    );
  }

  async getAlertsBySeverity(severity: string): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.severity === severity
    );
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.alertId++;
    const now = new Date();
    const alert: Alert = { ...insertAlert, id, createdAt: now };
    this.alerts.set(id, alert);
    return alert;
  }

  async updateAlert(id: number, alert: Partial<Alert>): Promise<Alert | undefined> {
    const existingAlert = this.alerts.get(id);
    if (!existingAlert) return undefined;
    
    const updatedAlert = { ...existingAlert, ...alert };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  // Recommendation methods
  async getRecommendations(): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values());
  }

  async getRecommendationById(id: number): Promise<Recommendation | undefined> {
    return this.recommendations.get(id);
  }

  async getRecommendationsByType(type: string): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values()).filter(
      (recommendation) => recommendation.type === type
    );
  }

  async createRecommendation(insertRecommendation: InsertRecommendation): Promise<Recommendation> {
    const id = this.recommendationId++;
    const now = new Date();
    const recommendation: Recommendation = { ...insertRecommendation, id, createdAt: now };
    this.recommendations.set(id, recommendation);
    return recommendation;
  }

  async updateRecommendation(id: number, recommendation: Partial<Recommendation>): Promise<Recommendation | undefined> {
    const existingRecommendation = this.recommendations.get(id);
    if (!existingRecommendation) return undefined;
    
    const updatedRecommendation = { ...existingRecommendation, ...recommendation };
    this.recommendations.set(id, updatedRecommendation);
    return updatedRecommendation;
  }
}

import { DatabaseStorage } from "./database-storage";

// When using the database, comment out the line below and uncomment the following line
// export const storage = new MemStorage();
export const storage = new DatabaseStorage();
