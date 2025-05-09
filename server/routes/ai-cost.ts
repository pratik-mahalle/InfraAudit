import { Router, Request, Response } from "express";
import { aiCostService } from "../services/ai-cost-service";
import { z } from "zod";

const router = Router();

// Schema for predict costs request
const predictCostsSchema = z.object({
  resourceId: z.number().optional(),
  months: z.number().min(1).max(12).optional().default(3),
});

// Schema for cost optimization request
const optimizationSchema = z.object({
  resourceId: z.number().optional(),
});

// Schema for anomaly analysis request
const anomalyAnalysisSchema = z.object({
  anomalyId: z.number(),
});

/**
 * Predict future costs
 * GET /api/ai-cost/predict
 */
router.get("/predict", async (req: Request, res: Response) => {
  try {
    const params = predictCostsSchema.parse(req.query);
    
    const prediction = await aiCostService.predictFutureCosts(
      params.resourceId, 
      params.months
    );
    
    return res.status(200).json(prediction);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Generate cost optimization recommendations
 * GET /api/ai-cost/optimize
 */
router.get("/optimize", async (req: Request, res: Response) => {
  try {
    const params = optimizationSchema.parse(req.query);
    
    const recommendations = await aiCostService.generateCostOptimizationRecommendations(
      params.resourceId
    );
    
    return res.status(200).json(recommendations);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Analyze a cost anomaly
 * GET /api/ai-cost/analyze-anomaly/:id
 */
router.get("/analyze-anomaly/:id", async (req: Request, res: Response) => {
  try {
    const anomalyId = parseInt(req.params.id);
    if (isNaN(anomalyId)) {
      return res.status(400).json({ error: "Invalid anomaly ID" });
    }
    
    const analysis = await aiCostService.analyzeCostAnomaly(anomalyId);
    
    return res.status(200).json(analysis);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export const aiCostRouter = router;