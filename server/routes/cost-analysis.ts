import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { CloudProviderService } from '../services/cloud-provider-service';

const router = Router();

// Schema for validating cost analysis request query parameters
const costAnalysisQuerySchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  groupBy: z.enum(['service', 'region', 'account', 'day', 'week', 'month']).default('service'),
  services: z.string().optional().transform(val => val ? val.split(',') : []),
  regions: z.string().optional().transform(val => val ? val.split(',') : []),
  accounts: z.string().optional().transform(val => val ? val.split(',') : [])
});

type CostAnalysisQuery = z.infer<typeof costAnalysisQuerySchema>;

/**
 * GET /api/cost-analysis
 * Get cost data for analysis with filtering options
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Parse and validate query parameters
    const query = costAnalysisQuerySchema.parse(req.query);
    
    // Get the cloud provider service instance
    const cloudProviderService = req.app.get('cloudProviderService') as CloudProviderService;
    
    // Check if any providers are configured
    const configuredProviders = cloudProviderService.getConfiguredProviders();
    
    if (configuredProviders.length === 0) {
      // If no cloud providers are configured, return an empty array
      return res.json([]);
    }
    
    // Calculate date range based on the timeRange parameter
    const endDate = new Date();
    let startDate = new Date();
    
    switch (query.timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    // Get cost data from configured providers
    const costData = await cloudProviderService.getAllCostData(startDate, endDate);
    
    // Apply filtering based on services, regions, and accounts if specified
    const filteredData = costData.filter(item => {
      // Apply service filter
      if (query.services && query.services.length > 0 && item.service) {
        if (!query.services.includes(item.service)) {
          return false;
        }
      }
      
      // Apply region filter
      if (query.regions && query.regions.length > 0 && item.region) {
        if (!query.regions.includes(item.region)) {
          return false;
        }
      }
      
      // Apply account filter (this would be implemented if we had account identifiers in the data)
      
      return true;
    });
    
    // Group data if needed
    if (query.groupBy === 'day' || query.groupBy === 'week' || query.groupBy === 'month') {
      const groupedData = groupCostDataByTime(filteredData, query.groupBy);
      return res.json(groupedData);
    }
    
    // Return filtered data
    res.json(filteredData);
  } catch (error: any) {
    console.error('Error fetching cost analysis data:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch cost analysis data' });
  }
});

/**
 * GET /api/cost-analysis/services
 * Get a list of all services across cloud providers
 */
router.get('/services', async (req: Request, res: Response) => {
  try {
    // Get the cloud provider service instance
    const cloudProviderService = req.app.get('cloudProviderService') as CloudProviderService;
    
    // Check if any providers are configured
    const configuredProviders = cloudProviderService.getConfiguredProviders();
    
    if (configuredProviders.length === 0) {
      // If no cloud providers are configured, return an empty array
      return res.json([]);
    }
    
    // For this example, we'll return some common AWS/GCP/Azure services
    // In a real implementation, this would be dynamically fetched from the cost data
    const services = [
      'EC2', 'S3', 'RDS', 'Lambda', 'DynamoDB',   // AWS services
      'Compute Engine', 'Cloud Storage', 'BigQuery', 'Cloud SQL', // GCP services
      'Virtual Machines', 'Blob Storage', 'Azure SQL', 'App Service' // Azure services
    ];
    
    res.json(services);
  } catch (error: any) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch services' });
  }
});

/**
 * GET /api/cost-analysis/regions
 * Get a list of all regions across cloud providers
 */
router.get('/regions', async (req: Request, res: Response) => {
  try {
    // Get the cloud provider service instance
    const cloudProviderService = req.app.get('cloudProviderService') as CloudProviderService;
    
    // Check if any providers are configured
    const configuredProviders = cloudProviderService.getConfiguredProviders();
    
    if (configuredProviders.length === 0) {
      // If no cloud providers are configured, return an empty array
      return res.json([]);
    }
    
    // For this example, we'll return some common regions
    // In a real implementation, this would be dynamically fetched from the cost data
    const regions = [
      'us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', // AWS regions
      'us-central1', 'europe-west1', 'asia-east1', // GCP regions
      'eastus', 'westeurope', 'southeastasia' // Azure regions
    ];
    
    res.json(regions);
  } catch (error: any) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch regions' });
  }
});

/**
 * GET /api/cost-analysis/anomalies
 * Get a list of cost anomalies
 */
router.get('/anomalies', async (req: Request, res: Response) => {
  try {
    // Get the cloud provider service instance
    const cloudProviderService = req.app.get('cloudProviderService') as CloudProviderService;
    
    // Check if any providers are configured
    const configuredProviders = cloudProviderService.getConfiguredProviders();
    
    if (configuredProviders.length === 0) {
      // If no cloud providers are configured, return an empty array
      return res.json([]);
    }
    
    // Get cost anomalies from the database
    const anomalies = await storage.getCostAnomalies();
    
    res.json(anomalies);
  } catch (error: any) {
    console.error('Error fetching cost anomalies:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch cost anomalies' });
  }
});

/**
 * Helper function to group cost data by time (day, week, month)
 */
function groupCostDataByTime(data: any[], groupBy: 'day' | 'week' | 'month') {
  const groupedData: Record<string, any> = {};
  
  data.forEach(item => {
    const date = new Date(item.date);
    let groupKey = '';
    
    if (groupBy === 'day') {
      // Format: YYYY-MM-DD
      groupKey = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      // Get the week number
      const weekNumber = getWeekNumber(date);
      groupKey = `${date.getFullYear()}-W${weekNumber}`;
    } else if (groupBy === 'month') {
      // Format: YYYY-MM
      groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    
    if (!groupedData[groupKey]) {
      groupedData[groupKey] = {
        date: groupKey,
        amount: 0,
        service: item.service,
        region: item.region
      };
    }
    
    groupedData[groupKey].amount += item.amount;
  });
  
  return Object.values(groupedData);
}

/**
 * Helper function to get the week number of a date
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export default router;