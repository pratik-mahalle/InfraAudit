import OpenAI from "openai";
import { InsertRecommendation, insertRecommendationSchema } from "@shared/schema";
import { CloudProvider } from "@shared/cloud-providers";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export interface CostAnomalyAnalysisResult {
  detected: boolean;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  estimatedSavings: number;
}

export interface SecurityDriftAnalysisResult {
  detected: boolean;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: string[];
  recommendations: string[];
  complianceImpact: string[];
}

/**
 * Analyzes resource data to detect cost anomalies using OpenAI
 */
export async function analyzeCostAnomalies(
  resourceData: any, 
  costHistory: any[],
  provider: CloudProvider
): Promise<CostAnomalyAnalysisResult> {
  try {
    const prompt = `
      You are an expert cloud cost optimization specialist. Analyze the following cloud resource data and its cost history to identify potential cost anomalies, inefficiencies, or waste.

      RESOURCE DATA:
      ${JSON.stringify(resourceData, null, 2)}

      COST HISTORY:
      ${JSON.stringify(costHistory, null, 2)}

      PROVIDER: ${provider}

      Please analyze this data and provide:
      1. Whether any cost anomalies are detected (true/false)
      2. A clear description of the anomaly or inefficiency if detected
      3. The severity level (low, medium, high, critical)
      4. A list of specific recommendations to address the issue
      5. An estimated monthly savings amount in USD if recommendations are implemented

      Respond in the following JSON format:
      {
        "detected": boolean,
        "description": "string",
        "severity": "low|medium|high|critical",
        "recommendations": ["string"],
        "estimatedSavings": number
      }
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content) as CostAnomalyAnalysisResult;
    return result;
  } catch (error) {
    console.error("Error analyzing cost anomalies:", error);
    return {
      detected: false,
      description: "Analysis failed due to an error",
      severity: "low",
      recommendations: ["Retry analysis"],
      estimatedSavings: 0
    };
  }
}

/**
 * Analyzes resource data to detect security configuration drifts using OpenAI
 */
export async function analyzeSecurityDrifts(
  resourceData: any,
  provider: CloudProvider
): Promise<SecurityDriftAnalysisResult> {
  try {
    const prompt = `
      You are an expert cloud security specialist. Analyze the following cloud resource data to identify potential security configuration drifts, vulnerabilities, or compliance issues.

      RESOURCE DATA:
      ${JSON.stringify(resourceData, null, 2)}

      PROVIDER: ${provider}

      Please analyze this data and provide:
      1. Whether any security drifts or vulnerabilities are detected (true/false)
      2. A clear description of the security issue if detected
      3. The severity level (low, medium, high, critical)
      4. A list of specific vulnerabilities or misconfigurations
      5. A list of specific recommendations to address the issues
      6. The potential compliance impacts (e.g., GDPR, HIPAA, SOC2, etc.)

      Respond in the following JSON format:
      {
        "detected": boolean,
        "description": "string",
        "severity": "low|medium|high|critical",
        "vulnerabilities": ["string"],
        "recommendations": ["string"],
        "complianceImpact": ["string"]
      }
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content) as SecurityDriftAnalysisResult;
    return result;
  } catch (error) {
    console.error("Error analyzing security drifts:", error);
    return {
      detected: false,
      description: "Analysis failed due to an error",
      severity: "low",
      vulnerabilities: ["Analysis could not be completed"],
      recommendations: ["Retry analysis"],
      complianceImpact: []
    };
  }
}

/**
 * Generates optimization recommendations based on resource data using OpenAI
 */
export async function generateOptimizationRecommendations(
  resourceData: any,
  costHistory: any[],
  provider: CloudProvider
): Promise<InsertRecommendation[]> {
  try {
    const prompt = `
      You are an expert cloud optimization specialist. Generate detailed optimization recommendations for the following cloud resources.

      RESOURCE DATA:
      ${JSON.stringify(resourceData, null, 2)}

      COST HISTORY:
      ${JSON.stringify(costHistory, null, 2)}

      PROVIDER: ${provider}

      Generate 3-5 specific, actionable recommendations that would optimize costs, performance, or security.
      For each recommendation include:
      1. Title (short, descriptive)
      2. Type (cost, security, performance)
      3. Description (detailed explanation)
      4. Impact (high, medium, low)
      5. Estimated savings percentage if applicable
      6. Implementation difficulty (easy, medium, hard)

      Respond with an array of recommendation objects in the following JSON format:
      [{
        "title": "string",
        "type": "cost|security|performance",
        "description": "string",
        "impact": "high|medium|low",
        "resourceId": null,
        "estimatedSavings": number,
        "implementationDifficulty": "easy|medium|hard"
      }]
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const recommendations = JSON.parse(response.choices[0].message.content);
    
    // Validate and format the recommendations according to the schema
    return recommendations.map((rec: any) => {
      return insertRecommendationSchema.parse({
        title: rec.title,
        type: rec.type,
        description: rec.description,
        impact: rec.impact,
        resourceId: rec.resourceId || null,
        estimatedSavings: rec.estimatedSavings || 0,
        implementationDifficulty: rec.implementationDifficulty || "medium",
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  } catch (error) {
    console.error("Error generating optimization recommendations:", error);
    return [];
  }
}