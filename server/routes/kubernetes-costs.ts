import { Request, Response } from 'express';
import { KubernetesService } from '../services/kubernetes-service';

const kubernetesService = new KubernetesService();

export async function getKubernetesCosts(req: Request, res: Response) {
  try {
    // Get the organization ID from the session or request
    const organizationId = req.session.user?.organizationId || 1;
    
    // Get all connected clusters
    const clusters = await kubernetesService.getClusters();
    
    if (clusters.length === 0) {
      // Return placeholder data if no clusters are connected
      return res.json({
        message: 'No Kubernetes clusters connected',
        data: null
      });
    }
    
    // For simplicity, we'll use the first cluster
    // In a real application, you might want to aggregate data from all clusters
    const clusterId = clusters[0].id;
    
    // Get real-time cost calculations
    const costData = await kubernetesService.calculateKubernetesCosts(clusterId);
    
    // Get cost predictions
    const predictions = await kubernetesService.generateKubernetesCostPredictions(clusterId);
    
    // Get optimization recommendations
    const recommendations = await kubernetesService.generateKubernetesOptimizationRecommendations(clusterId);
    
    // Calculate utilization metrics
    const nodes = await kubernetesService.getClusterNodes(clusterId);
    const pods = await kubernetesService.getPods(clusterId);
    
    let cpuUtilization = 0;
    let memoryUtilization = 0;
    let storageUtilization = 0;
    let networkUtilization = 0;
    
    // Calculate average utilization
    // This is a simplified approach; in a real system, you'd get this from monitoring tools
    if (pods.length > 0) {
      const podsWithUtilization = pods.filter(pod => pod.utilization !== undefined);
      if (podsWithUtilization.length > 0) {
        cpuUtilization = Math.round(
          podsWithUtilization.reduce((sum, pod) => sum + (pod.utilization || 0), 0) / 
          podsWithUtilization.length
        );
      }
      
      // Use simulated values for memory, storage, and network
      memoryUtilization = 72;
      storageUtilization = 43;
      networkUtilization = 34;
    }
    
    // Format recommendations for the frontend
    const formattedRecommendations = recommendations.map(rec => ({
      id: rec.resourceId,
      title: rec.recommendation,
      saving: rec.potentialSavings,
      description: rec.details
    }));
    
    // Compile the response
    const response = {
      currentCost: {
        totalCost: costData.totalCost,
        breakdown: costData.costBreakdown,
        percentChange: 8.2, // Sample value - in a real app, calculate from historical data
        changeDirection: 'increase' as const
      },
      projectedCost: {
        totalCost: predictions.monthly.cost,
        percentChange: 12.7 // Sample value - in a real app, calculate from predictions
      },
      potentialSavings: {
        totalSavings: recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0),
        recommendationCount: recommendations.length
      },
      utilization: {
        cpu: cpuUtilization,
        memory: memoryUtilization,
        storage: storageUtilization,
        network: networkUtilization
      },
      recommendations: formattedRecommendations
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching Kubernetes costs:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch Kubernetes cost data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}