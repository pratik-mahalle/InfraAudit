import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertResourceSchema,
  insertSecurityDriftSchema,
  insertCostAnomalySchema,
  insertAlertSchema,
  insertRecommendationSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { setupAuth } from "./auth";
import { registerCloudProviderRoutes } from "./routes/cloud-providers";
import { notificationsRouter } from "./routes/notifications";
import { aiCostRouter } from "./routes/ai-cost";
import { scanRouter } from "./routes/scan";
import { subscriptionsRouter } from "./routes/subscriptions";
import { costPredictionRouter } from "./routes/cost-prediction";
import { billingImportRouter } from "./routes/billing-import";
import kubernetesRouter from "./routes/kubernetes";


export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes and middleware
  setupAuth(app);
  
  // Setup cloud provider routes - this is now async
  await registerCloudProviderRoutes(app);
  
  // Setup notifications routes
  app.use('/api/notifications', notificationsRouter);
  
  // Setup AI cost prediction and optimization routes
  app.use('/api/ai-cost', aiCostRouter);
  
  // Setup scan routes
  app.use('/api/scan', scanRouter);
  
  // Setup subscription routes
  app.use('/api/subscriptions', subscriptionsRouter);
  
  // Setup cost prediction and optimization routes
  app.use('/api/cost-prediction', costPredictionRouter);
  
  // Setup billing import routes
  app.use('/api/billing-import', billingImportRouter);
  
  // Setup a simplified cost analysis endpoint
  app.get('/api/cost-analysis', async (req, res) => {
    try {
      // In a real implementation, this would fetch data from cloud providers
      // For now, return sample data
      const mockData = generateMockCostData();
      res.json(mockData);
    } catch (error: any) {
      console.error('Error fetching cost analysis data:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch cost analysis data' });
    }
  });
  
  // Helper function to generate mock cost data
  function generateMockCostData() {
    const services = ['EC2', 'S3', 'RDS', 'Lambda', 'DynamoDB', 'CloudFront'];
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
    const data = [];
    
    // Generate 90 days of data
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 90);
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const service = services[Math.floor(Math.random() * services.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const baseAmount = Math.random() * 100 + 10; // $10-$110
      
      // Add some trends and patterns
      const dayOfWeek = currentDate.getDay(); // 0-6
      let multiplier = 1.0;
      
      // Weekends have lower costs
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        multiplier = 0.7;
      }
      
      // Add a cost spike for a specific service in the middle of the data
      const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (service === 'EC2' && daysSinceStart > 40 && daysSinceStart < 50) {
        multiplier = 2.5;
      }
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        amount: baseAmount * multiplier,
        service,
        region
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  }
  
  // Error handler helper for Zod validation errors
  const handleZodError = (err: ZodError, res: Response) => {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors,
    });
  };

  // API Routes - all prefixed with /api
  app.get("/api/status", (req, res) => {
    res.json({ status: "OK", time: new Date().toISOString() });
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  });

  // Resource routes
  app.get("/api/resources", async (req, res) => {
    const provider = req.query.provider as string | undefined;
    const type = req.query.type as string | undefined;

    let resources;
    if (provider) {
      resources = await storage.getResourcesByProvider(provider);
    } else if (type) {
      resources = await storage.getResourcesByType(type);
    } else {
      resources = await storage.getResources();
    }

    res.json(resources);
  });

  app.get("/api/resources/:id", async (req, res) => {
    const resourceId = parseInt(req.params.id);
    if (isNaN(resourceId)) {
      return res.status(400).json({ message: "Invalid resource ID" });
    }

    const resource = await storage.getResourceById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json(resource);
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const resourceData = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(resourceData);
      res.status(201).json(resource);
    } catch (err) {
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: "Failed to create resource" });
    }
  });

  app.patch("/api/resources/:id", async (req, res) => {
    const resourceId = parseInt(req.params.id);
    if (isNaN(resourceId)) {
      return res.status(400).json({ message: "Invalid resource ID" });
    }

    try {
      const resource = await storage.updateResource(resourceId, req.body);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(resource);
    } catch (err) {
      res.status(500).json({ message: "Failed to update resource" });
    }
  });

  // Security drift routes
  app.get("/api/security-drifts", async (req, res) => {
    const resourceId = req.query.resourceId ? parseInt(req.query.resourceId as string) : undefined;
    const severity = req.query.severity as string | undefined;

    let drifts;
    if (resourceId && !isNaN(resourceId)) {
      drifts = await storage.getSecurityDriftsByResource(resourceId);
    } else if (severity) {
      drifts = await storage.getSecurityDriftsBySeverity(severity);
    } else {
      drifts = await storage.getSecurityDrifts();
    }

    res.json(drifts);
  });

  app.get("/api/security-drifts/:id", async (req, res) => {
    const driftId = parseInt(req.params.id);
    if (isNaN(driftId)) {
      return res.status(400).json({ message: "Invalid drift ID" });
    }

    const drift = await storage.getSecurityDriftById(driftId);
    if (!drift) {
      return res.status(404).json({ message: "Security drift not found" });
    }

    res.json(drift);
  });

  app.post("/api/security-drifts", async (req, res) => {
    try {
      const driftData = insertSecurityDriftSchema.parse(req.body);
      const drift = await storage.createSecurityDrift(driftData);
      res.status(201).json(drift);
    } catch (err) {
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: "Failed to create security drift" });
    }
  });

  app.patch("/api/security-drifts/:id", async (req, res) => {
    const driftId = parseInt(req.params.id);
    if (isNaN(driftId)) {
      return res.status(400).json({ message: "Invalid drift ID" });
    }

    try {
      const drift = await storage.updateSecurityDrift(driftId, req.body);
      if (!drift) {
        return res.status(404).json({ message: "Security drift not found" });
      }
      res.json(drift);
    } catch (err) {
      res.status(500).json({ message: "Failed to update security drift" });
    }
  });

  // Cost anomaly routes
  app.get("/api/cost-anomalies", async (req, res) => {
    const resourceId = req.query.resourceId ? parseInt(req.query.resourceId as string) : undefined;
    const severity = req.query.severity as string | undefined;

    let anomalies;
    if (resourceId && !isNaN(resourceId)) {
      anomalies = await storage.getCostAnomaliesByResource(resourceId);
    } else if (severity) {
      anomalies = await storage.getCostAnomaliesBySeverity(severity);
    } else {
      anomalies = await storage.getCostAnomalies();
    }

    res.json(anomalies);
  });

  app.get("/api/cost-anomalies/:id", async (req, res) => {
    const anomalyId = parseInt(req.params.id);
    if (isNaN(anomalyId)) {
      return res.status(400).json({ message: "Invalid anomaly ID" });
    }

    const anomaly = await storage.getCostAnomalyById(anomalyId);
    if (!anomaly) {
      return res.status(404).json({ message: "Cost anomaly not found" });
    }

    res.json(anomaly);
  });

  app.post("/api/cost-anomalies", async (req, res) => {
    try {
      const anomalyData = insertCostAnomalySchema.parse(req.body);
      const anomaly = await storage.createCostAnomaly(anomalyData);
      res.status(201).json(anomaly);
    } catch (err) {
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: "Failed to create cost anomaly" });
    }
  });

  app.patch("/api/cost-anomalies/:id", async (req, res) => {
    const anomalyId = parseInt(req.params.id);
    if (isNaN(anomalyId)) {
      return res.status(400).json({ message: "Invalid anomaly ID" });
    }

    try {
      const anomaly = await storage.updateCostAnomaly(anomalyId, req.body);
      if (!anomaly) {
        return res.status(404).json({ message: "Cost anomaly not found" });
      }
      res.json(anomaly);
    } catch (err) {
      res.status(500).json({ message: "Failed to update cost anomaly" });
    }
  });

  // Alert routes
  app.get("/api/alerts", async (req, res) => {
    const type = req.query.type as string | undefined;
    const severity = req.query.severity as string | undefined;

    let alerts;
    if (type) {
      alerts = await storage.getAlertsByType(type);
    } else if (severity) {
      alerts = await storage.getAlertsBySeverity(severity);
    } else {
      alerts = await storage.getAlerts();
    }

    res.json(alerts);
  });

  app.get("/api/alerts/:id", async (req, res) => {
    const alertId = parseInt(req.params.id);
    if (isNaN(alertId)) {
      return res.status(400).json({ message: "Invalid alert ID" });
    }

    const alert = await storage.getAlertById(alertId);
    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.json(alert);
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const alertData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(alertData);
      res.status(201).json(alert);
    } catch (err) {
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  app.patch("/api/alerts/:id", async (req, res) => {
    const alertId = parseInt(req.params.id);
    if (isNaN(alertId)) {
      return res.status(400).json({ message: "Invalid alert ID" });
    }

    try {
      const alert = await storage.updateAlert(alertId, req.body);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      res.json(alert);
    } catch (err) {
      res.status(500).json({ message: "Failed to update alert" });
    }
  });

  // Recommendation routes
  app.get("/api/recommendations", async (req, res) => {
    const type = req.query.type as string | undefined;

    let recommendations;
    if (type) {
      recommendations = await storage.getRecommendationsByType(type);
    } else {
      recommendations = await storage.getRecommendations();
    }

    res.json(recommendations);
  });

  app.get("/api/recommendations/:id", async (req, res) => {
    const recommendationId = parseInt(req.params.id);
    if (isNaN(recommendationId)) {
      return res.status(400).json({ message: "Invalid recommendation ID" });
    }

    const recommendation = await storage.getRecommendationById(recommendationId);
    if (!recommendation) {
      return res.status(404).json({ message: "Recommendation not found" });
    }

    res.json(recommendation);
  });

  app.post("/api/recommendations", async (req, res) => {
    try {
      const recommendationData = insertRecommendationSchema.parse(req.body);
      const recommendation = await storage.createRecommendation(recommendationData);
      res.status(201).json(recommendation);
    } catch (err) {
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: "Failed to create recommendation" });
    }
  });

  app.patch("/api/recommendations/:id", async (req, res) => {
    const recommendationId = parseInt(req.params.id);
    if (isNaN(recommendationId)) {
      return res.status(400).json({ message: "Invalid recommendation ID" });
    }

    try {
      const recommendation = await storage.updateRecommendation(recommendationId, req.body);
      if (!recommendation) {
        return res.status(404).json({ message: "Recommendation not found" });
      }
      res.json(recommendation);
    } catch (err) {
      res.status(500).json({ message: "Failed to update recommendation" });
    }
  });

  // Run scan simulation endpoint
  app.post("/api/run-scan", async (req, res) => {
    try {
      // Simulate scan completion
      const scanTime = new Date();
      
      // Return scan completion details
      res.json({ 
        status: "completed", 
        timestamp: scanTime.toISOString(),
        summary: {
          resourcesScanned: 268,
          securityDrifts: 3,
          costAnomalies: 1,
          newAlerts: 3
        }
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to run scan" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
