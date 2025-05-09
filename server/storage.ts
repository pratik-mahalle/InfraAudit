import {
  users, resources, securityDrifts, costAnomalies, alerts, recommendations,
  type User, type InsertUser, 
  type Resource, type InsertResource,
  type SecurityDrift, type InsertSecurityDrift,
  type CostAnomaly, type InsertCostAnomaly,
  type Alert, type InsertAlert,
  type Recommendation, type InsertRecommendation
} from "@shared/schema";
import session from "express-session";
import { DatabaseStorage } from "./database-storage";

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
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

// Use database storage implementation
export const storage = new DatabaseStorage();
