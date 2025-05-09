import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  role: text("role").default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
});

// Cloud resources schema
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // EC2, S3, RDS, etc.
  provider: text("provider").notNull(), // AWS, Azure, GCP
  region: text("region").notNull(),
  status: text("status").notNull(), // running, stopped, etc.
  tags: jsonb("tags"),
  cost: integer("cost"), // Cost in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  name: true,
  type: true,
  provider: true,
  region: true,
  status: true,
  tags: true,
  cost: true,
});

// Security drifts schema
export const securityDrifts = pgTable("security_drifts", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull(),
  driftType: text("drift_type").notNull(), // IAM policy change, open port, etc.
  severity: text("severity").notNull(), // critical, high, medium, low
  details: jsonb("details"),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  status: text("status").notNull(), // open, remediated, approved
});

export const insertSecurityDriftSchema = createInsertSchema(securityDrifts).pick({
  resourceId: true,
  driftType: true,
  severity: true,
  details: true,
  status: true,
});

// Cost anomalies schema
export const costAnomalies = pgTable("cost_anomalies", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull(),
  anomalyType: text("anomaly_type").notNull(), // spike, trend, etc.
  severity: text("severity").notNull(), // critical, high, medium, low
  percentage: integer("percentage").notNull(), // Percentage increase
  previousCost: integer("previous_cost").notNull(), // Cost in cents
  currentCost: integer("current_cost").notNull(), // Cost in cents
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  status: text("status").notNull(), // open, investigated, resolved
});

export const insertCostAnomalySchema = createInsertSchema(costAnomalies).pick({
  resourceId: true,
  anomalyType: true,
  severity: true,
  percentage: true,
  previousCost: true,
  currentCost: true,
  status: true,
});

// Alerts schema
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // security, cost, resource
  severity: text("severity").notNull(), // critical, high, medium, low
  resourceId: integer("resource_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  status: text("status").notNull(), // open, acknowledged, resolved
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  title: true,
  message: true,
  type: true,
  severity: true,
  resourceId: true,
  status: true,
});

// Recommendations schema
export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // rightsizing, unused resources, storage optimization
  potentialSavings: integer("potential_savings").notNull(), // Savings in cents
  resourcesAffected: jsonb("resources_affected"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  status: text("status").notNull(), // open, applied, dismissed
});

export const insertRecommendationSchema = createInsertSchema(recommendations).pick({
  title: true,
  description: true,
  type: true,
  potentialSavings: true,
  resourcesAffected: true,
  status: true,
});

// Define relations
export const resourcesRelations = relations(resources, ({ many }) => ({
  securityDrifts: many(securityDrifts),
  costAnomalies: many(costAnomalies),
  alerts: many(alerts)
}));

export const securityDriftsRelations = relations(securityDrifts, ({ one }) => ({
  resource: one(resources, {
    fields: [securityDrifts.resourceId],
    references: [resources.id]
  })
}));

export const costAnomaliesRelations = relations(costAnomalies, ({ one }) => ({
  resource: one(resources, {
    fields: [costAnomalies.resourceId],
    references: [resources.id]
  })
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  resource: one(resources, {
    fields: [alerts.resourceId],
    references: [resources.id],
    relationName: "resourceAlerts"
  })
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type SecurityDrift = typeof securityDrifts.$inferSelect;
export type InsertSecurityDrift = z.infer<typeof insertSecurityDriftSchema>;

export type CostAnomaly = typeof costAnomalies.$inferSelect;
export type InsertCostAnomaly = z.infer<typeof insertCostAnomalySchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
