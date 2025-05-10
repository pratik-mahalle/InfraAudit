import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  role: text("role").default("user"), // user, admin, support
  organizationId: integer("organization_id"),
  planType: text("plan_type").default("free"), // free, basic, pro, enterprise
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // active, inactive, past_due, canceled
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  role: true,
  organizationId: true,
  planType: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionStatus: true,
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
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  name: true,
  type: true,
  provider: true,
  region: true,
  status: true,
  tags: true,
  cost: true,
  organizationId: true,
  userId: true,
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
export const resourcesRelations = relations(resources, ({ many, one }) => ({
  securityDrifts: many(securityDrifts),
  costAnomalies: many(costAnomalies),
  alerts: many(alerts),
  organization: one(organizations, {
    fields: [resources.organizationId],
    references: [organizations.id]
  }),
  user: one(users, {
    fields: [resources.userId],
    references: [users.id]
  })
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

// Cloud Credentials
export const cloudCredentials = pgTable("cloud_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(), // AWS, GCP, AZURE
  name: text("name"),
  encryptedCredentials: text("encrypted_credentials").notNull(),
  encryptionIv: text("encryption_iv").notNull(),
  isActive: boolean("is_active").default(true),
  lastSynced: timestamp("last_synced"),
  lastSyncStatus: text("last_sync_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCloudCredentialsSchema = createInsertSchema(cloudCredentials).pick({
  userId: true,
  provider: true,
  name: true,
  encryptedCredentials: true,
  encryptionIv: true,
  isActive: true,
});

export const cloudCredentialsRelations = relations(cloudCredentials, ({ one }) => ({
  user: one(users, {
    fields: [cloudCredentials.userId],
    references: [users.id]
  })
}));

export type CloudCredential = typeof cloudCredentials.$inferSelect;
export type InsertCloudCredential = z.infer<typeof insertCloudCredentialsSchema>;

// Organizations schema for multi-tenancy
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  billingEmail: text("billing_email").notNull(),
  billingAddress: text("billing_address"),
  planType: text("plan_type").default("free"), // free, basic, pro, enterprise
  resourceLimit: integer("resource_limit").default(10),
  userLimit: integer("user_limit").default(2),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // active, inactive, past_due, canceled
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  displayName: true,
  billingEmail: true,
  billingAddress: true,
  planType: true,
  resourceLimit: true,
  userLimit: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionStatus: true,
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
