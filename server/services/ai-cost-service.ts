import OpenAI from "openai";
import { storage } from "../storage";
import { Resource, CostAnomaly } from "@shared/schema";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI-driven service for cost prediction and optimization
 */
export class AICostService {
  /**
   * Predict future costs based on historical data and usage patterns
   * @param resourceId Optional resource ID to get prediction for a specific resource
   * @param months Number of months to forecast
   */
  async predictFutureCosts(resourceId?: number, months: number = 3): Promise<any> {
    try {
      // Get resources and cost data for analysis
      let resources: Resource[];
      if (resourceId) {
        const resource = await storage.getResourceById(resourceId);
        resources = resource ? [resource] : [];
      } else {
        resources = await storage.getResources();
      }

      if (resources.length === 0) {
        throw new Error("No resources found for cost prediction");
      }

      // Get historical cost anomalies for patterns
      const costAnomalies = await storage.getCostAnomalies();

      // Prepare data for the AI model
      const resourceData = resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        type: resource.type,
        provider: resource.provider,
        region: resource.region,
        currentCost: resource.cost ? resource.cost / 100 : 0, // Convert from cents to dollars
        tags: resource.tags || {},
      }));

      // Format historical anomalies
      const anomalyData = costAnomalies.map(anomaly => ({
        resourceId: anomaly.resourceId,
        anomalyType: anomaly.anomalyType,
        percentage: anomaly.percentage,
        previousCost: anomaly.previousCost / 100, // Convert from cents to dollars
        currentCost: anomaly.currentCost / 100, // Convert from cents to dollars
        detectedAt: anomaly.detectedAt,
      }));

      // Call the OpenAI API for cost prediction
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a cloud cost analytics AI assistant that predicts future cloud costs and provides optimization recommendations. Provide realistic and well-reasoned cost predictions based on resource information and historical patterns."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "cost_prediction",
              months_to_predict: months,
              resources: resourceData,
              historical_anomalies: anomalyData,
              current_date: new Date().toISOString()
            })
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2, // Lower temperature for more deterministic predictions
      });

      // Parse the AI response
      const content = response.choices[0].message.content || '{}';
      const prediction = JSON.parse(content);
      return prediction;
    } catch (error) {
      console.error("Error in cost prediction:", error);
      throw error;
    }
  }

  /**
   * Generate optimization recommendations to reduce cloud costs
   * @param resourceId Optional resource ID to get recommendations for a specific resource
   */
  async generateCostOptimizationRecommendations(resourceId?: number): Promise<any> {
    try {
      // Get resources for analysis
      let resources: Resource[];
      if (resourceId) {
        const resource = await storage.getResourceById(resourceId);
        resources = resource ? [resource] : [];
      } else {
        resources = await storage.getResources();
      }

      if (resources.length === 0) {
        throw new Error("No resources found for optimization recommendations");
      }

      // Prepare data for the AI model
      const resourceData = resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        type: resource.type,
        provider: resource.provider,
        region: resource.region, 
        currentCost: resource.cost ? resource.cost / 100 : 0, // Convert from cents to dollars
        tags: resource.tags || {},
      }));

      // Call the OpenAI API for optimization recommendations
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a cloud cost optimization expert. Provide actionable, specific recommendations to reduce cloud costs while maintaining performance and reliability. Focus on practical steps that could be implemented by DevOps teams."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "cost_optimization",
              resources: resourceData,
              target_savings_percentage: 15,
              optimization_priorities: ["unused_resources", "rightsizing", "reserved_instances", "spot_instances"]
            })
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      // Parse the AI response
      const content = response.choices[0].message.content || '{}';
      const recommendations = JSON.parse(content);
      return recommendations;
    } catch (error) {
      console.error("Error in generating optimization recommendations:", error);
      throw error;
    }
  }

  /**
   * Analyze a cost anomaly and provide potential causes and remediation steps
   * @param anomalyId The ID of the cost anomaly to analyze
   */
  async analyzeCostAnomaly(anomalyId: number): Promise<any> {
    try {
      // Get the cost anomaly
      const anomaly = await storage.getCostAnomalyById(anomalyId);
      if (!anomaly) {
        throw new Error(`Cost anomaly with ID ${anomalyId} not found`);
      }

      // Get the associated resource
      const resource = await storage.getResourceById(anomaly.resourceId);
      if (!resource) {
        throw new Error(`Resource with ID ${anomaly.resourceId} not found`);
      }

      // Prepare data for the AI model
      const anomalyData = {
        id: anomaly.id,
        resourceId: anomaly.resourceId,
        resourceName: resource.name,
        resourceType: resource.type,
        provider: resource.provider,
        anomalyType: anomaly.anomalyType,
        percentage: anomaly.percentage,
        previousCost: anomaly.previousCost / 100, // Convert from cents to dollars
        currentCost: anomaly.currentCost / 100, // Convert from cents to dollars
        costDifference: (anomaly.currentCost - anomaly.previousCost) / 100, // Convert from cents to dollars
        detectedAt: anomaly.detectedAt,
      };

      // Call the OpenAI API for anomaly analysis
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a cloud cost analysis expert. Analyze this cost anomaly and provide potential causes, implications, and specific remediation steps to address the issue."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "anomaly_analysis",
              anomaly: anomalyData,
            })
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      // Parse the AI response
      const content = response.choices[0].message.content || '{}';
      const analysis = JSON.parse(content);
      return analysis;
    } catch (error) {
      console.error("Error in cost anomaly analysis:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const aiCostService = new AICostService();