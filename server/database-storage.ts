import { db } from "./db";
import { eq } from "drizzle-orm";
import type { IStorage } from "./storage";
import {
  users, resources, securityDrifts, costAnomalies, alerts, recommendations, organizations,
  type User, type InsertUser,
  type Resource, type InsertResource,
  type SecurityDrift, type InsertSecurityDrift,
  type CostAnomaly, type InsertCostAnomaly,
  type Alert, type InsertAlert,
  type Recommendation, type InsertRecommendation,
  type Organization, type InsertOrganization
} from "@shared/schema";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

const PgSession = connectPgSimple(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
    return organization;
  }
  
  async getOrganizationByName(name: string): Promise<Organization | undefined> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.name, name));
    return organization;
  }
  
  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [newOrganization] = await db
      .insert(organizations)
      .values(organization)
      .returning();
    return newOrganization;
  }
  
  async updateOrganization(id: number, organization: Partial<Organization>): Promise<Organization | undefined> {
    const [updatedOrganization] = await db
      .update(organizations)
      .set(organization)
      .where(eq(organizations.id, id))
      .returning();
    return updatedOrganization;
  }

  // Resource operations
  async getResources(): Promise<Resource[]> {
    return db.select().from(resources);
  }

  async getResourceById(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async getResourcesByProvider(provider: string): Promise<Resource[]> {
    return db.select().from(resources).where(eq(resources.provider, provider));
  }

  async getResourcesByType(type: string): Promise<Resource[]> {
    return db.select().from(resources).where(eq(resources.type, type));
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async updateResource(id: number, resource: Partial<Resource>): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set(resource)
      .where(eq(resources.id, id))
      .returning();
    return updatedResource;
  }

  // SecurityDrift operations
  async getSecurityDrifts(): Promise<SecurityDrift[]> {
    return db.select().from(securityDrifts);
  }

  async getSecurityDriftById(id: number): Promise<SecurityDrift | undefined> {
    const [drift] = await db
      .select()
      .from(securityDrifts)
      .where(eq(securityDrifts.id, id));
    return drift;
  }

  async getSecurityDriftsByResource(resourceId: number): Promise<SecurityDrift[]> {
    return db
      .select()
      .from(securityDrifts)
      .where(eq(securityDrifts.resourceId, resourceId));
  }

  async getSecurityDriftsBySeverity(severity: string): Promise<SecurityDrift[]> {
    return db
      .select()
      .from(securityDrifts)
      .where(eq(securityDrifts.severity, severity));
  }

  async createSecurityDrift(drift: InsertSecurityDrift): Promise<SecurityDrift> {
    const [newDrift] = await db
      .insert(securityDrifts)
      .values(drift)
      .returning();
    return newDrift;
  }

  async updateSecurityDrift(id: number, drift: Partial<SecurityDrift>): Promise<SecurityDrift | undefined> {
    const [updatedDrift] = await db
      .update(securityDrifts)
      .set(drift)
      .where(eq(securityDrifts.id, id))
      .returning();
    return updatedDrift;
  }

  // CostAnomaly operations
  async getCostAnomalies(): Promise<CostAnomaly[]> {
    return db.select().from(costAnomalies);
  }

  async getCostAnomalyById(id: number): Promise<CostAnomaly | undefined> {
    const [anomaly] = await db
      .select()
      .from(costAnomalies)
      .where(eq(costAnomalies.id, id));
    return anomaly;
  }

  async getCostAnomaliesByResource(resourceId: number): Promise<CostAnomaly[]> {
    return db
      .select()
      .from(costAnomalies)
      .where(eq(costAnomalies.resourceId, resourceId));
  }

  async getCostAnomaliesBySeverity(severity: string): Promise<CostAnomaly[]> {
    return db
      .select()
      .from(costAnomalies)
      .where(eq(costAnomalies.severity, severity));
  }

  async createCostAnomaly(anomaly: InsertCostAnomaly): Promise<CostAnomaly> {
    const [newAnomaly] = await db
      .insert(costAnomalies)
      .values(anomaly)
      .returning();
    return newAnomaly;
  }

  async updateCostAnomaly(id: number, anomaly: Partial<CostAnomaly>): Promise<CostAnomaly | undefined> {
    const [updatedAnomaly] = await db
      .update(costAnomalies)
      .set(anomaly)
      .where(eq(costAnomalies.id, id))
      .returning();
    return updatedAnomaly;
  }

  // Alert operations
  async getAlerts(): Promise<Alert[]> {
    return db.select().from(alerts);
  }

  async getAlertById(id: number): Promise<Alert | undefined> {
    const [alert] = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, id));
    return alert;
  }

  async getAlertsByType(type: string): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(eq(alerts.type, type));
  }

  async getAlertsBySeverity(severity: string): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(eq(alerts.severity, severity));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db
      .insert(alerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async updateAlert(id: number, alert: Partial<Alert>): Promise<Alert | undefined> {
    const [updatedAlert] = await db
      .update(alerts)
      .set(alert)
      .where(eq(alerts.id, id))
      .returning();
    return updatedAlert;
  }

  // Recommendation operations
  async getRecommendations(): Promise<Recommendation[]> {
    return db.select().from(recommendations);
  }

  async getRecommendationById(id: number): Promise<Recommendation | undefined> {
    const [recommendation] = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.id, id));
    return recommendation;
  }

  async getRecommendationsByType(type: string): Promise<Recommendation[]> {
    return db
      .select()
      .from(recommendations)
      .where(eq(recommendations.type, type));
  }

  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const [newRecommendation] = await db
      .insert(recommendations)
      .values(recommendation)
      .returning();
    return newRecommendation;
  }

  async updateRecommendation(id: number, recommendation: Partial<Recommendation>): Promise<Recommendation | undefined> {
    const [updatedRecommendation] = await db
      .update(recommendations)
      .set(recommendation)
      .where(eq(recommendations.id, id))
      .returning();
    return updatedRecommendation;
  }
}