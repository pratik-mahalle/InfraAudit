import express, { Request, Response } from "express";
import { z } from "zod";
import { ZodError } from "zod";
import {
  predictFutureCosts,
  generateCostOptimizationSuggestions,
  importCloudBillingData,
  getCostOptimizationSuggestions,
  getHistoricalCostData
} from "../services/cost-prediction-service";

const router = express.Router();

/**
 * Get historical cost data
 * GET /api/cost-prediction/history
 */
router.get("/history", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return res.status(400).json({ message: "No organization ID found for user" });
    }

    // Parse query parameters
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const groupBy = (req.query.groupBy as 'day' | 'week' | 'month') || 'day';

    const data = await getHistoricalCostData(
      organizationId,
      startDate,
      endDate,
      groupBy
    );

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching historical cost data:", error);
    res.status(500).json({ 
      message: "Failed to fetch historical cost data",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Predict future costs
 * POST /api/cost-prediction/predict
 */
router.post("/predict", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return res.status(400).json({ message: "No organization ID found for user" });
    }

    // Validate request body
    const schema = z.object({
      days: z.number().int().positive().default(30),
      model: z.enum(['linear', 'movingAverage', 'weightedMovingAverage']).default('linear')
    });

    const { days, model } = schema.parse(req.body);

    const predictions = await predictFutureCosts(
      organizationId,
      days,
      model
    );

    res.status(200).json(predictions);
  } catch (error) {
    console.error("Error predicting costs:", error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: "Invalid request parameters", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to predict costs",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get cost optimization suggestions
 * GET /api/cost-prediction/optimization-suggestions
 */
router.get("/optimization-suggestions", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return res.status(400).json({ message: "No organization ID found for user" });
    }

    const suggestions = await getCostOptimizationSuggestions(organizationId);
    res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error fetching cost optimization suggestions:", error);
    res.status(500).json({ 
      message: "Failed to fetch cost optimization suggestions",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Generate new cost optimization suggestions
 * POST /api/cost-prediction/generate-suggestions
 */
router.post("/generate-suggestions", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return res.status(400).json({ message: "No organization ID found for user" });
    }

    const suggestions = await generateCostOptimizationSuggestions(organizationId);
    res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error generating cost optimization suggestions:", error);
    res.status(500).json({ 
      message: "Failed to generate cost optimization suggestions",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Import cloud billing data
 * POST /api/cost-prediction/import-billing-data
 */
router.post("/import-billing-data", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return res.status(400).json({ message: "No organization ID found for user" });
    }

    // Validate request body
    const dataItemSchema = z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
      amount: z.number().positive(),
      serviceCategory: z.string().optional(),
      region: z.string().optional(),
      usageType: z.string().optional(),
      usageAmount: z.number().optional(),
      usageUnit: z.string().optional(),
      resourceId: z.number().int().positive().optional(),
    });

    const schema = z.object({
      provider: z.string(),
      billingData: z.array(dataItemSchema)
    });

    const { provider, billingData } = schema.parse(req.body);

    const importedData = await importCloudBillingData(
      organizationId,
      provider,
      billingData
    );

    res.status(200).json({
      message: "Billing data imported successfully",
      count: importedData.length,
      data: importedData
    });
  } catch (error) {
    console.error("Error importing billing data:", error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: "Invalid request parameters", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to import billing data",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export const costPredictionRouter = router;