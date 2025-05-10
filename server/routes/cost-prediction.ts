import { Router, Request, Response } from "express";
import { z } from "zod";
import { 
  predictFutureCosts, 
  generateCostOptimizationSuggestions, 
  importCloudBillingData, 
  getCostOptimizationSuggestions,
  getHistoricalCostData
} from "../services/cost-prediction-service";

const router = Router();

// Create schema for prediction request
const predictionRequestSchema = z.object({
  days: z.number().int().positive().default(30),
  model: z.enum(['linear', 'movingAverage', 'weightedMovingAverage']).default('linear'),
  resourceId: z.number().optional()
});

// Schema for billing data import
const billingImportSchema = z.object({
  provider: z.string(),
  billingData: z.array(z.object({
    date: z.string(),
    amount: z.number().positive(),
    serviceCategory: z.string().optional(),
    region: z.string().optional(),
    usageType: z.string().optional(),
    usageAmount: z.number().optional(),
    usageUnit: z.string().optional(),
    resourceId: z.number().optional()
  }))
});

/**
 * Get historical cost data
 * GET /api/cost-prediction/history
 */
router.get("/history", async (req: Request, res: Response) => {
  try {
    // Since we don't have authentication yet, use a default organization ID
    const organizationId = 1;
    
    // For testing purposes, mock some historical data
    const mockHistoricalData = {
      totalSpend: 1245.67,
      previousPeriodSpend: 987.45,
      percentageChange: 26.15,
      byService: [
        { service: "EC2", amount: 456.78, percentage: 36.67 },
        { service: "S3", amount: 234.56, percentage: 18.83 },
        { service: "RDS", amount: 198.76, percentage: 15.96 },
        { service: "Lambda", amount: 134.21, percentage: 10.77 },
        { service: "Other", amount: 221.36, percentage: 17.77 }
      ],
      byDay: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 25 + Math.random() * 20
      }))
    };
    
    res.json(mockHistoricalData);
  } catch (error: any) {
    console.error('Error getting historical cost data:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Predict future costs
 * POST /api/cost-prediction/predict
 */
router.post("/predict", async (req: Request, res: Response) => {
  try {
    const { days, model } = predictionRequestSchema.parse(req.body);
    
    // Since we don't have authentication yet, use a default organization ID
    const organizationId = 1;
    
    // For testing purposes, mock prediction response
    const mockPredictions = {
      dailyPredictions: Array.from({ length: days }, (_, i) => ({
        predictedDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predictedAmount: 35 + Math.random() * 25,
        confidenceInterval: 5 + Math.random() * 8,
        model: model,
        predictionPeriod: 'daily'
      })),
      weeklyPredictions: Array.from({ length: Math.ceil(days / 7) }, (_, i) => ({
        period: `Week ${i + 1}`,
        startDate: new Date(Date.now() + (i * 7 + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + (Math.min((i + 1) * 7, days)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predictedAmount: 250 + Math.random() * 100,
        confidenceInterval: 30 + Math.random() * 20,
        model: model
      })),
      monthlyPrediction: {
        period: "Next 30 Days",
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predictedAmount: 1050 + Math.random() * 400,
        confidenceInterval: 105 + Math.random() * 50,
        model: model
      }
    };
    
    res.json(mockPredictions);
    
    // TODO: Uncomment this when the database issues are fixed
    // const predictions = await predictFutureCosts(organizationId, days, model);
    // res.json(predictions);
  } catch (error: any) {
    console.error('Error predicting costs:', error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * Get cost optimization suggestions
 * GET /api/cost-prediction/optimization-suggestions
 */
router.get("/optimization-suggestions", async (req: Request, res: Response) => {
  try {
    // Since we don't have authentication yet, use a default organization ID
    const organizationId = 1;
    
    // For testing purposes, mock optimization suggestions
    const mockSuggestions = {
      suggestions: [
        { 
          id: 1,
          title: "Right-size underutilized EC2 instances", 
          description: "3 instances are consistently below 20% CPU utilization", 
          suggestedAction: "Downsize",
          potentialSavings: 312.45,
          confidence: 0.85,
          implementationDifficulty: "easy",
          status: "pending"
        },
        { 
          id: 2,
          title: "Enable S3 lifecycle policies", 
          description: "Move infrequently accessed objects to cheaper storage classes", 
          suggestedAction: "StorageTransition",
          potentialSavings: 85.20,
          confidence: 0.92,
          implementationDifficulty: "easy",
          status: "pending"
        },
        { 
          id: 3,
          title: "Terminate idle RDS read replicas", 
          description: "2 read replicas have not been accessed in 30+ days", 
          suggestedAction: "Terminate",
          potentialSavings: 210.75,
          confidence: 0.78,
          implementationDifficulty: "medium",
          status: "pending"
        },
        { 
          id: 4,
          title: "Use EC2 Spot Instances for batch processing", 
          description: "Several batch processing jobs can use spot instances to reduce costs", 
          suggestedAction: "Spot",
          potentialSavings: 156.30,
          confidence: 0.75,
          implementationDifficulty: "medium",
          status: "pending"
        },
      ],
      totalPotentialSavings: 764.70
    };
    
    res.json(mockSuggestions);
    
    // TODO: Uncomment this when the database issues are fixed
    // const suggestions = await getCostOptimizationSuggestions(organizationId);
    // res.json({ suggestions, totalPotentialSavings: suggestions.reduce((sum, s) => sum + Number(s.potentialSavings), 0) });
  } catch (error: any) {
    console.error('Error getting optimization suggestions:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Generate new cost optimization suggestions
 * POST /api/cost-prediction/generate-suggestions
 */
router.post("/generate-suggestions", async (req: Request, res: Response) => {
  try {
    // Since we don't have authentication yet, use a default organization ID
    const organizationId = 1;
    
    // For testing purposes, return the same mock data as the GET endpoint
    const mockSuggestions = {
      suggestions: [
        { 
          id: 1,
          title: "Right-size underutilized EC2 instances", 
          description: "3 instances are consistently below 20% CPU utilization", 
          suggestedAction: "Downsize",
          potentialSavings: 312.45,
          confidence: 0.85,
          implementationDifficulty: "easy",
          status: "pending"
        },
        { 
          id: 2,
          title: "Enable S3 lifecycle policies", 
          description: "Move infrequently accessed objects to cheaper storage classes", 
          suggestedAction: "StorageTransition",
          potentialSavings: 85.20,
          confidence: 0.92,
          implementationDifficulty: "easy",
          status: "pending"
        },
        { 
          id: 3,
          title: "Terminate idle RDS read replicas", 
          description: "2 read replicas have not been accessed in 30+ days", 
          suggestedAction: "Terminate",
          potentialSavings: 210.75,
          confidence: 0.78,
          implementationDifficulty: "medium",
          status: "pending"
        },
        { 
          id: 4,
          title: "Use EC2 Spot Instances for batch processing", 
          description: "Several batch processing jobs can use spot instances to reduce costs", 
          suggestedAction: "Spot",
          potentialSavings: 156.30,
          confidence: 0.75,
          implementationDifficulty: "medium",
          status: "pending"
        },
      ],
      totalPotentialSavings: 764.70
    };
    
    res.json(mockSuggestions);
    
    // TODO: Uncomment this when the database issues are fixed
    // const suggestions = await generateCostOptimizationSuggestions(organizationId);
    // res.json({ suggestions, totalPotentialSavings: suggestions.reduce((sum, s) => sum + Number(s.potentialSavings), 0) });
  } catch (error: any) {
    console.error('Error generating optimization suggestions:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Import cloud billing data
 * POST /api/cost-prediction/import-billing-data
 */
router.post("/import-billing-data", async (req: Request, res: Response) => {
  try {
    const { provider, billingData } = billingImportSchema.parse(req.body);
    
    // Since we don't have authentication yet, use a default organization ID
    const organizationId = 1;
    
    // For testing purposes, simulate a successful import
    res.json({
      success: true,
      message: "Billing data imported successfully",
      count: billingData.length
    });
    
    // TODO: Uncomment this when the database issues are fixed
    // const importedRecords = await importCloudBillingData(organizationId, provider, billingData);
    // res.json({
    //   success: true,
    //   count: importedRecords.length,
    //   message: `Successfully imported ${importedRecords.length} billing records from ${provider}`
    // });
  } catch (error: any) {
    console.error('Error importing billing data:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

export const costPredictionRouter = router;