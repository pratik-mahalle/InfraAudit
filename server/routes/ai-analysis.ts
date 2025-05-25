import { Router, Request, Response } from "express";
import { db } from "../db";
import {
  analyzeCostAnomalies,
  analyzeSecurityDrifts,
  generateOptimizationRecommendations
} from "../services/ai-service";
import {
  costAnomalies,
  securityDrifts,
  resources,
  recommendations,
  insertCostAnomalySchema,
  insertSecurityDriftSchema,
  insertRecommendationSchema
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { CloudProvider } from "@shared/cloud-providers";

const router = Router();

// Trigger AI analysis for cost anomalies on a specific resource
router.post("/analyze/cost/:resourceId", async (req: Request, res: Response) => {
  try {
    const resourceId = parseInt(req.params.resourceId);
    
    // Get the resource data
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, resourceId));
      
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    // Get cost history for this resource (you would need to have this data from your cost history table)
    const costHistory = await db.query.costHistory.findMany({
      where: eq(resources.id, resourceId),
      limit: 30 // Last 30 entries
    }).catch(() => []);
    
    // If cost history doesn't exist, create mock data for demonstration
    const costData = costHistory.length ? costHistory : generateMockCostHistory(resource);
    
    // Use OpenAI to analyze cost anomalies
    const analysisResult = await analyzeCostAnomalies(
      resource,
      costData,
      resource.provider as CloudProvider
    );
    
    // If anomalies are detected, store them in the database
    if (analysisResult.detected) {
      const anomalyData = insertCostAnomalySchema.parse({
        resourceId: resource.id,
        description: analysisResult.description,
        severity: analysisResult.severity,
        amount: analysisResult.estimatedSavings,
        status: "open",
        detectedAt: new Date(),
        resolvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const [createdAnomaly] = await db
        .insert(costAnomalies)
        .values(anomalyData)
        .returning();
        
      // Also generate recommendations
      const recommendationsData = analysisResult.recommendations.map(rec => ({
        title: `Cost Optimization: ${rec.substring(0, 50)}...`,
        type: "cost",
        description: rec,
        resourceId: resource.id,
        impact: analysisResult.severity,
        status: "open",
        estimatedSavings: analysisResult.estimatedSavings,
        implementationDifficulty: "medium",
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      const validatedRecommendations = recommendationsData.map(rec => 
        insertRecommendationSchema.parse(rec)
      );
      
      await db
        .insert(recommendations)
        .values(validatedRecommendations);
        
      return res.status(200).json({
        message: "Cost anomaly detected and recorded",
        anomaly: createdAnomaly,
        recommendations: analysisResult.recommendations
      });
    }
    
    return res.status(200).json({
      message: "No cost anomalies detected",
      analysis: analysisResult
    });
  } catch (error: any) {
    console.error("Error analyzing cost anomalies:", error);
    return res.status(500).json({ 
      message: "Error analyzing cost anomalies", 
      error: error?.message || "Unknown error" 
    });
  }
});

// Trigger AI analysis for security drifts on a specific resource
router.post("/analyze/security/:resourceId", async (req: Request, res: Response) => {
  try {
    const resourceId = parseInt(req.params.resourceId);
    
    // Get the resource data
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, resourceId));
      
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    // Use OpenAI to analyze security drifts
    const analysisResult = await analyzeSecurityDrifts(
      resource,
      resource.provider as CloudProvider
    );
    
    // If security drifts are detected, store them in the database
    if (analysisResult.detected) {
      const driftData = insertSecurityDriftSchema.parse({
        resourceId: resource.id,
        description: analysisResult.description,
        severity: analysisResult.severity,
        status: "open",
        detectedAt: new Date(),
        resolvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const [createdDrift] = await db
        .insert(securityDrifts)
        .values(driftData)
        .returning();
        
      // Also generate recommendations
      const recommendationsData = analysisResult.recommendations.map(rec => ({
        title: `Security Fix: ${rec.substring(0, 50)}...`,
        type: "security",
        description: rec,
        resourceId: resource.id,
        impact: analysisResult.severity,
        status: "open",
        estimatedSavings: 0,
        implementationDifficulty: "medium",
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      const validatedRecommendations = recommendationsData.map(rec => 
        insertRecommendationSchema.parse(rec)
      );
      
      await db
        .insert(recommendations)
        .values(validatedRecommendations);
        
      return res.status(200).json({
        message: "Security drift detected and recorded",
        drift: createdDrift,
        vulnerabilities: analysisResult.vulnerabilities,
        recommendations: analysisResult.recommendations,
        complianceImpact: analysisResult.complianceImpact
      });
    }
    
    return res.status(200).json({
      message: "No security drifts detected",
      analysis: analysisResult
    });
  } catch (error: any) {
    console.error("Error analyzing security drifts:", error);
    return res.status(500).json({ 
      message: "Error analyzing security drifts", 
      error: error?.message || "Unknown error" 
    });
  }
});

// Generate AI-powered optimization recommendations for a resource
router.post("/recommendations/:resourceId", async (req: Request, res: Response) => {
  try {
    const resourceId = parseInt(req.params.resourceId);
    
    // Get the resource data
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, resourceId));
      
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    // Get cost history for this resource
    const costHistory = await db.query.costHistory.findMany({
      where: eq(resources.id, resourceId),
      limit: 30 // Last 30 entries
    }).catch(() => []);
    
    // If cost history doesn't exist, create mock data for demonstration
    const costData = costHistory.length ? costHistory : generateMockCostHistory(resource);
    
    // Generate AI-powered recommendations
    const recommendationsData = await generateOptimizationRecommendations(
      resource,
      costData,
      resource.provider as CloudProvider
    );
    
    if (recommendationsData.length > 0) {
      // Insert recommendations into the database
      const [createdRecommendation] = await db
        .insert(recommendations)
        .values(recommendationsData)
        .returning();
        
      return res.status(200).json({
        message: "Recommendations generated successfully",
        recommendations: recommendationsData
      });
    }
    
    return res.status(200).json({
      message: "No recommendations generated",
      recommendations: []
    });
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    return res.status(500).json({ 
      message: "Error generating recommendations", 
      error: error?.message || "Unknown error" 
    });
  }
});

// Helper function to generate mock cost history for demo purposes
function generateMockCostHistory(resource: any) {
  const now = new Date();
  const costData = [];
  
  // Generate 30 days of cost history
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Base cost is determined by resource type and size
    let baseCost = 0;
    switch (resource.type) {
      case 'EC2':
        baseCost = 30; // $30/day for EC2
        break;
      case 'S3':
        baseCost = 5; // $5/day for S3
        break;
      case 'RDS':
        baseCost = 50; // $50/day for RDS
        break;
      default:
        baseCost = 20; // Default daily cost
    }
    
    // Add some random variation
    const variation = Math.random() * 0.2 - 0.1; // -10% to +10%
    
    // Add a cost spike on the 10th day to simulate an anomaly
    const anomalyFactor = i === 10 ? 2.5 : 1;
    
    const cost = baseCost * (1 + variation) * anomalyFactor;
    
    costData.push({
      date: date.toISOString().split('T')[0],
      amount: parseFloat(cost.toFixed(2)),
      resourceId: resource.id,
      service: resource.type,
      region: resource.region
    });
  }
  
  return costData;
}

export default router;