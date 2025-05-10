import { db } from "../db";
import { 
  costHistory, 
  costPredictions, 
  resources, 
  costOptimizationSuggestions,
  InsertCostPrediction,
  InsertCostHistory,
  InsertCostOptimizationSuggestion
} from "@shared/schema";
import { eq, and, gte, lte, desc, sql, isNull, sum, count } from "drizzle-orm";
import { addDays, subDays, format, parse, subMonths, eachDayOfInterval, eachMonthOfInterval } from "date-fns";

// Simple linear regression implementation
function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
  const n = x.length;
  if (n === 0 || y.length !== n) {
    return { slope: 0, intercept: 0, r2: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
    sumYY += y[i] * y[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const xMean = sumX / n;
  const yMean = sumY / n;
  
  let totalVariation = 0;
  let explainedVariation = 0;
  
  for (let i = 0; i < n; i++) {
    const predicted = slope * x[i] + intercept;
    totalVariation += Math.pow(y[i] - yMean, 2);
    explainedVariation += Math.pow(predicted - yMean, 2);
  }
  
  const r2 = explainedVariation / totalVariation;

  return { slope, intercept, r2 };
}

// Moving average function
function movingAverage(data: number[], window: number): number[] {
  const result = [];
  for (let i = 0; i <= data.length - window; i++) {
    const windowSlice = data.slice(i, i + window);
    const avg = windowSlice.reduce((sum, val) => sum + val, 0) / window;
    result.push(avg);
  }
  return result;
}

// Weighted moving average function
function weightedMovingAverage(data: number[], weights: number[]): number[] {
  if (weights.length > data.length) {
    weights = weights.slice(0, data.length);
  }
  
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const normalizedWeights = weights.map(w => w / weightSum);
  
  const result = [];
  for (let i = 0; i <= data.length - normalizedWeights.length; i++) {
    let avg = 0;
    for (let j = 0; j < normalizedWeights.length; j++) {
      avg += data[i + j] * normalizedWeights[j];
    }
    result.push(avg);
  }
  
  return result;
}

// Function to predict future costs
export async function predictFutureCosts(
  organizationId: number,
  predictionDays: number = 30,
  model: 'linear' | 'movingAverage' | 'weightedMovingAverage' = 'linear'
) {
  try {
    // Get historical cost data for the last 90 days
    const today = new Date();
    const startDate = subDays(today, 90);
    
    // Format dates for SQL query
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedToday = format(today, 'yyyy-MM-dd');
    
    // Query historical cost data
    const historicalData = await db.select({
      date: costHistory.date,
      amount: costHistory.amount,
      serviceCategory: costHistory.serviceCategory,
    })
    .from(costHistory)
    .where(
      and(
        eq(costHistory.organizationId, organizationId),
        gte(costHistory.date, formattedStartDate),
        lte(costHistory.date, formattedToday)
      )
    )
    .orderBy(costHistory.date);
    
    if (historicalData.length < 7) {
      throw new Error('Not enough historical data to make predictions');
    }
    
    // Prepare data for regression
    const dates = historicalData.map(entry => new Date(entry.date).getTime());
    const costs = historicalData.map(entry => Number(entry.amount));
    
    // Calculate day indices for x values (0, 1, 2, ...)
    const firstDate = dates[0];
    const x = dates.map(date => Math.floor((date - firstDate) / (1000 * 60 * 60 * 24)));
    
    let predictions: Array<{
      predictedDate: string;
      predictedAmount: number;
      confidenceInterval: number;
      model: string;
      predictionPeriod: string;
    }> = [];
    
    // Generate future dates
    const futureDates = [];
    for (let i = 1; i <= predictionDays; i++) {
      futureDates.push(addDays(today, i));
    }
    
    // Calculate prediction based on model choice
    if (model === 'linear') {
      // Perform linear regression
      const { slope, intercept, r2 } = linearRegression(x, costs);
      
      // Calculate confidence interval (simplified)
      const confidenceInterval = Math.sqrt(1 - r2) * Math.max(...costs) * 0.1;
      
      // Make predictions for future dates
      predictions = futureDates.map((date, i) => {
        const dayIndex = x[x.length - 1] + i + 1;
        const predictedAmount = slope * dayIndex + intercept;
        
        return {
          predictedDate: format(date, 'yyyy-MM-dd'),
          predictedAmount: Math.max(0, predictedAmount), // Ensure no negative predictions
          confidenceInterval,
          model: 'LinearRegression',
          predictionPeriod: 'daily'
        };
      });
    } 
    else if (model === 'movingAverage') {
      // Use last 7 days for moving average
      const window = 7;
      const recentCosts = costs.slice(-window);
      const maResults = movingAverage([...recentCosts], 1);
      const averageCost = maResults[maResults.length - 1];
      
      // Simple confidence calculation based on standard deviation
      const stdDev = Math.sqrt(
        recentCosts.reduce((sum, val) => sum + Math.pow(val - averageCost, 2), 0) / window
      );
      
      predictions = futureDates.map(date => ({
        predictedDate: format(date, 'yyyy-MM-dd'),
        predictedAmount: averageCost,
        confidenceInterval: stdDev,
        model: 'MovingAverage',
        predictionPeriod: 'daily'
      }));
    }
    else if (model === 'weightedMovingAverage') {
      // Use last 7 days with more weight on recent days
      const window = 7;
      const weights = [0.05, 0.1, 0.1, 0.15, 0.15, 0.2, 0.25]; // More weight on recent days
      const recentCosts = costs.slice(-window);
      
      if (recentCosts.length < window) {
        // Pad with average if not enough data
        const avg = recentCosts.reduce((a, b) => a + b, 0) / recentCosts.length;
        while (recentCosts.length < window) {
          recentCosts.unshift(avg);
        }
      }
      
      const wmaResults = weightedMovingAverage(recentCosts, weights);
      const weightedAvgCost = wmaResults[0];
      
      // Simple confidence calculation
      const stdDev = Math.sqrt(
        recentCosts.reduce((sum, val) => sum + Math.pow(val - weightedAvgCost, 2), 0) / window
      );
      
      predictions = futureDates.map(date => ({
        predictedDate: format(date, 'yyyy-MM-dd'),
        predictedAmount: weightedAvgCost,
        confidenceInterval: stdDev,
        model: 'WeightedMovingAverage',
        predictionPeriod: 'daily'
      }));
    }
    
    // Store predictions in database
    const insertedPredictions = [];
    for (const prediction of predictions) {
      // Use the object property names from the schema, not the DB column names
      const [inserted] = await db.insert(costPredictions).values({
        resourceId: null,
        organizationId: organizationId,
        predictedDate: prediction.predictedDate,
        predictedAmount: prediction.predictedAmount.toString(), // Convert to string for numeric fields
        confidenceInterval: prediction.confidenceInterval.toString(), // Convert to string for numeric fields
        model: prediction.model,
        predictionPeriod: prediction.predictionPeriod
      })
        .returning();
      
      insertedPredictions.push(inserted);
    }
    
    // Return summarized predictions by week and month
    const dailyPredictions = insertedPredictions;
    
    // Weekly aggregation (simplified)
    const weeklyPredictions = [];
    for (let i = 0; i < dailyPredictions.length; i += 7) {
      const weekPredictions = dailyPredictions.slice(i, i + 7);
      const weekTotal = weekPredictions.reduce((sum, p) => sum + Number(p.predictedAmount), 0);
      const avgConfidence = weekPredictions.reduce((sum, p) => sum + Number(p.confidenceInterval), 0) / weekPredictions.length;
      
      weeklyPredictions.push({
        period: `Week ${Math.floor(i / 7) + 1}`,
        startDate: weekPredictions[0].predictedDate,
        endDate: weekPredictions[weekPredictions.length - 1].predictedDate,
        predictedAmount: weekTotal,
        confidenceInterval: avgConfidence,
        model: dailyPredictions[0].model
      });
    }
    
    // Monthly total
    const monthlyTotal = dailyPredictions.reduce((sum, p) => sum + Number(p.predictedAmount), 0);
    const avgMonthlyConfidence = dailyPredictions.reduce((sum, p) => sum + Number(p.confidenceInterval), 0) / dailyPredictions.length;
    
    return {
      dailyPredictions,
      weeklyPredictions,
      monthlyPrediction: {
        period: "Next 30 Days",
        startDate: dailyPredictions[0].predictedDate,
        endDate: dailyPredictions[dailyPredictions.length - 1].predictedDate,
        predictedAmount: monthlyTotal,
        confidenceInterval: avgMonthlyConfidence,
        model: dailyPredictions[0].model
      }
    };
  } catch (error) {
    console.error('Error predicting future costs:', error);
    throw error;
  }
}

// Function to generate cost optimization suggestions
export async function generateCostOptimizationSuggestions(organizationId: number) {
  try {
    // Get all resources for the organization
    const allResources = await db.select()
      .from(resources)
      .where(eq(resources.organizationId, organizationId));
    
    // Map of resource types to potential optimizations
    const optimizationStrategies = {
      'EC2': [
        {
          detector: (resource: any) => resource.status === 'running' && resource.tags?.utilization && Number(resource.tags.utilization) < 20,
          title: "Right-size underutilized EC2 instance",
          description: (resource: any) => `Instance ${resource.name} has average CPU utilization below 20%. Consider downsizing to a smaller instance type.`,
          suggestedAction: "Downsize",
          calculateSavings: (resource: any) => Number(resource.cost) * 0.5, // Estimate 50% savings from downsizing
          confidence: 0.8,
          implementationDifficulty: "medium"
        },
        {
          detector: (resource: any) => resource.status === 'running' && resource.tags?.lastAccess && 
            new Date(resource.tags.lastAccess).getTime() < subDays(new Date(), 30).getTime(),
          title: "Terminate idle EC2 instance",
          description: (resource: any) => `Instance ${resource.name} has not been accessed in over 30 days. Consider terminating if not needed.`,
          suggestedAction: "Terminate",
          calculateSavings: (resource: any) => Number(resource.cost), // 100% savings from termination
          confidence: 0.9,
          implementationDifficulty: "easy"
        },
        {
          detector: (resource: any) => resource.status === 'running' && !resource.tags?.schedule,
          title: "Implement instance scheduling",
          description: (resource: any) => `Instance ${resource.name} is running 24/7. Implement scheduling to stop during non-business hours.`,
          suggestedAction: "Schedule",
          calculateSavings: (resource: any) => Number(resource.cost) * 0.3, // Estimate 30% savings from scheduling
          confidence: 0.75,
          implementationDifficulty: "easy"
        }
      ],
      'RDS': [
        {
          detector: (resource: any) => resource.status === 'available' && resource.tags?.connections && Number(resource.tags.connections) < 5,
          title: "Right-size underutilized RDS instance",
          description: (resource: any) => `Database ${resource.name} has very few connections. Consider downsizing to a smaller instance class.`,
          suggestedAction: "Downsize",
          calculateSavings: (resource: any) => Number(resource.cost) * 0.4, // Estimate 40% savings from downsizing
          confidence: 0.7,
          implementationDifficulty: "medium"
        }
      ],
      'S3': [
        {
          detector: (resource: any) => resource.tags?.storageClass === 'Standard' && resource.tags?.lastAccess && 
            new Date(resource.tags.lastAccess).getTime() < subMonths(new Date(), 3).getTime(),
          title: "Transition infrequently accessed S3 objects to a lower cost storage class",
          description: (resource: any) => `Bucket ${resource.name} contains objects not accessed in over 90 days. Consider transitioning to S3 Standard-IA or Glacier.`,
          suggestedAction: "StorageTransition",
          calculateSavings: (resource: any) => Number(resource.cost) * 0.7, // Estimate 70% savings from storage class transition
          confidence: 0.85,
          implementationDifficulty: "easy"
        }
      ]
    };
    
    const suggestions = [];
    
    // Check each resource against applicable optimization strategies
    for (const resource of allResources) {
      const strategies = optimizationStrategies[resource.type as keyof typeof optimizationStrategies] || [];
      
      for (const strategy of strategies) {
        if (strategy.detector(resource)) {
          const potentialSavings = strategy.calculateSavings(resource);
          
          // Create suggestion
          const [suggestion] = await db.insert(costOptimizationSuggestions)
            .values({
              resourceId: resource.id,
              organizationId,
              title: strategy.title,
              description: strategy.description(resource),
              suggestedAction: strategy.suggestedAction,
              potentialSavings,
              confidence: strategy.confidence,
              implementationDifficulty: strategy.implementationDifficulty,
              status: 'pending'
            })
            .returning();
          
          suggestions.push(suggestion);
        }
      }
    }
    
    return suggestions;
  } catch (error) {
    console.error('Error generating cost optimization suggestions:', error);
    throw error;
  }
}

// Function to import cloud billing data
export async function importCloudBillingData(
  organizationId: number, 
  provider: string, 
  billingData: Array<{
    date: string;
    amount: number;
    serviceCategory?: string;
    region?: string;
    usageType?: string;
    usageAmount?: number;
    usageUnit?: string;
    resourceId?: number;
  }>
) {
  try {
    // Validate billing data
    if (!billingData || !Array.isArray(billingData) || billingData.length === 0) {
      throw new Error('Invalid billing data format');
    }
    
    // Insert billing data into cost history table
    const insertedRecords = [];
    
    for (const record of billingData) {
      const [inserted] = await db.insert(costHistory)
        .values({
          organizationId,
          date: record.date,
          amount: record.amount,
          serviceCategory: record.serviceCategory,
          region: record.region,
          usageType: record.usageType,
          usageAmount: record.usageAmount,
          usageUnit: record.usageUnit,
          resourceId: record.resourceId,
        })
        .returning();
      
      insertedRecords.push(inserted);
    }
    
    return insertedRecords;
  } catch (error) {
    console.error('Error importing cloud billing data:', error);
    throw error;
  }
}

// Function to get existing cost optimization suggestions
export async function getCostOptimizationSuggestions(organizationId: number) {
  try {
    const suggestions = await db.select({
      id: costOptimizationSuggestions.id,
      resourceId: costOptimizationSuggestions.resourceId,
      title: costOptimizationSuggestions.title,
      description: costOptimizationSuggestions.description,
      suggestedAction: costOptimizationSuggestions.suggestedAction,
      potentialSavings: costOptimizationSuggestions.potentialSavings,
      confidence: costOptimizationSuggestions.confidence,
      implementationDifficulty: costOptimizationSuggestions.implementationDifficulty,
      status: costOptimizationSuggestions.status,
      createdAt: costOptimizationSuggestions.createdAt,
      resourceName: resources.name,
      resourceType: resources.type,
    })
    .from(costOptimizationSuggestions)
    .leftJoin(resources, eq(costOptimizationSuggestions.resourceId, resources.id))
    .where(eq(costOptimizationSuggestions.organizationId, organizationId))
    .orderBy(desc(costOptimizationSuggestions.potentialSavings));
    
    // Calculate total potential savings
    const totalPotentialSavings = suggestions.reduce(
      (sum, suggestion) => sum + Number(suggestion.potentialSavings), 
      0
    );
    
    return {
      suggestions,
      totalPotentialSavings,
      count: suggestions.length
    };
  } catch (error) {
    console.error('Error fetching cost optimization suggestions:', error);
    throw error;
  }
}

// Function to get historical cost data
export async function getHistoricalCostData(
  organizationId: number, 
  startDate?: string, 
  endDate?: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
) {
  try {
    // Set default date range to last 90 days if not specified
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : subDays(end, 90);
    
    // Format dates for SQL query
    const formattedStartDate = format(start, 'yyyy-MM-dd');
    const formattedEndDate = format(end, 'yyyy-MM-dd');
    
    let query;
    
    if (groupBy === 'day') {
      // Daily data
      query = db.select({
        date: costHistory.date,
        totalAmount: sql`SUM(${costHistory.amount})`.as('total_amount'),
        count: sql`COUNT(*)`.as('count'),
      })
      .from(costHistory)
      .where(
        and(
          eq(costHistory.organizationId, organizationId),
          gte(costHistory.date, formattedStartDate),
          lte(costHistory.date, formattedEndDate)
        )
      )
      .groupBy(costHistory.date)
      .orderBy(costHistory.date);
    } 
    else if (groupBy === 'week') {
      // Weekly data (PostgreSQL specific)
      query = db.select({
        weekStart: sql`DATE_TRUNC('week', ${costHistory.date})`.as('week_start'),
        totalAmount: sql`SUM(${costHistory.amount})`.as('total_amount'),
        count: sql`COUNT(*)`.as('count'),
      })
      .from(costHistory)
      .where(
        and(
          eq(costHistory.organizationId, organizationId),
          gte(costHistory.date, formattedStartDate),
          lte(costHistory.date, formattedEndDate)
        )
      )
      .groupBy(sql`DATE_TRUNC('week', ${costHistory.date})`)
      .orderBy(sql`DATE_TRUNC('week', ${costHistory.date})`);
    }
    else if (groupBy === 'month') {
      // Monthly data
      query = db.select({
        monthStart: sql`DATE_TRUNC('month', ${costHistory.date})`.as('month_start'),
        totalAmount: sql`SUM(${costHistory.amount})`.as('total_amount'),
        count: sql`COUNT(*)`.as('count'),
      })
      .from(costHistory)
      .where(
        and(
          eq(costHistory.organizationId, organizationId),
          gte(costHistory.date, formattedStartDate),
          lte(costHistory.date, formattedEndDate)
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${costHistory.date})`)
      .orderBy(sql`DATE_TRUNC('month', ${costHistory.date})`);
    }
    
    const results = await query;
    
    // Also get service category breakdown
    const categoryBreakdown = await db.select({
      serviceCategory: costHistory.serviceCategory,
      totalAmount: sql`SUM(${costHistory.amount})`.as('total_amount'),
      percentage: sql`ROUND(SUM(${costHistory.amount}) * 100.0 / (SELECT SUM(${costHistory.amount}) FROM ${costHistory} WHERE ${costHistory.organizationId} = ${organizationId} AND ${costHistory.date} >= ${formattedStartDate} AND ${costHistory.date} <= ${formattedEndDate}), 2)`.as('percentage'),
    })
    .from(costHistory)
    .where(
      and(
        eq(costHistory.organizationId, organizationId),
        gte(costHistory.date, formattedStartDate),
        lte(costHistory.date, formattedEndDate)
      )
    )
    .groupBy(costHistory.serviceCategory)
    .orderBy(desc(sql`SUM(${costHistory.amount})`));
    
    // Get total
    const [totalResult] = await db.select({
      totalCost: sql`SUM(${costHistory.amount})`.as('total_cost'),
      avgDaily: sql`AVG(daily.daily_cost)`.as('avg_daily'),
    })
    .from(costHistory)
    .innerJoin(
      db.select({
        date: costHistory.date,
        dailyCost: sql`SUM(${costHistory.amount})`.as('daily_cost'),
      })
      .from(costHistory)
      .where(
        and(
          eq(costHistory.organizationId, organizationId),
          gte(costHistory.date, formattedStartDate),
          lte(costHistory.date, formattedEndDate)
        )
      )
      .groupBy(costHistory.date)
      .as('daily'),
      eq(1, 1) // Join condition doesn't matter here, just need the subquery
    )
    .where(
      and(
        eq(costHistory.organizationId, organizationId),
        gte(costHistory.date, formattedStartDate),
        lte(costHistory.date, formattedEndDate)
      )
    );
    
    return {
      timeSeriesData: results,
      categoryBreakdown,
      summary: {
        totalCost: totalResult?.totalCost || 0,
        averageDailyCost: totalResult?.avgDaily || 0,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        period: groupBy
      }
    };
  } catch (error) {
    console.error('Error fetching historical cost data:', error);
    throw error;
  }
}