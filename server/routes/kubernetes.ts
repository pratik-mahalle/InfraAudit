import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { kubernetesService, KubernetesClusterConfig } from '../services/kubernetes-service';

const router = Router();

// Schema for adding a Kubernetes cluster
const addKubernetesClusterSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  kubeconfig: z.string().optional(),
  context: z.string().optional(),
});

/**
 * GET /api/kubernetes/clusters
 * Get all configured Kubernetes clusters
 */
router.get('/clusters', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const clusters = kubernetesService.getClusters();
    
    // Map clusters to remove sensitive information
    const safeClusterData = clusters.map(cluster => ({
      id: cluster.id,
      name: cluster.name,
      context: cluster.context,
      hasKubeconfig: !!cluster.kubeconfig
    }));
    
    res.json(safeClusterData);
  } catch (error: any) {
    console.error('Error fetching Kubernetes clusters:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Kubernetes clusters' });
  }
});

/**
 * POST /api/kubernetes/clusters
 * Add a new Kubernetes cluster
 */
router.post('/clusters', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    // Validate request body
    const validatedData = addKubernetesClusterSchema.parse(req.body);
    
    // Generate a unique ID
    const clusterId = `k8s-${Date.now()}`;
    
    // Create cluster config
    const clusterConfig: KubernetesClusterConfig = {
      id: clusterId,
      name: validatedData.name,
      kubeconfig: validatedData.kubeconfig,
      context: validatedData.context
    };
    
    // Add cluster to service
    const success = await kubernetesService.addCluster(clusterConfig);
    
    if (!success) {
      return res.status(400).json({ message: 'Failed to add Kubernetes cluster. Please check your configuration.' });
    }
    
    // Return cluster info without kubeconfig
    const { kubeconfig, ...safeClusterInfo } = clusterConfig;
    res.status(201).json({
      ...safeClusterInfo,
      hasKubeconfig: !!kubeconfig
    });
  } catch (error: any) {
    console.error('Error adding Kubernetes cluster:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Invalid cluster configuration', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: error.message || 'Failed to add Kubernetes cluster' });
  }
});

/**
 * DELETE /api/kubernetes/clusters/:id
 * Remove a Kubernetes cluster
 */
router.delete('/clusters/:id', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const clusterId = req.params.id;
    
    if (!kubernetesService.hasCluster(clusterId)) {
      return res.status(404).json({ message: 'Kubernetes cluster not found' });
    }
    
    const success = kubernetesService.removeCluster(clusterId);
    
    if (!success) {
      return res.status(500).json({ message: 'Failed to remove Kubernetes cluster' });
    }
    
    res.status(204).send();
  } catch (error: any) {
    console.error('Error removing Kubernetes cluster:', error);
    res.status(500).json({ message: error.message || 'Failed to remove Kubernetes cluster' });
  }
});

/**
 * GET /api/kubernetes/resources
 * Get all Kubernetes resources across all clusters
 */
router.get('/resources', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const resources = await kubernetesService.getAllResources();
    res.json(resources);
  } catch (error: any) {
    console.error('Error fetching Kubernetes resources:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch Kubernetes resources' });
  }
});

/**
 * GET /api/kubernetes/clusters/:id/resources
 * Get resources for a specific Kubernetes cluster
 */
router.get('/clusters/:id/resources', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const clusterId = req.params.id;
    
    if (!kubernetesService.hasCluster(clusterId)) {
      return res.status(404).json({ message: 'Kubernetes cluster not found' });
    }
    
    const resources = await kubernetesService.getClusterResources(clusterId);
    res.json(resources);
  } catch (error: any) {
    console.error(`Error fetching resources for cluster ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed to fetch cluster resources' });
  }
});

/**
 * GET /api/kubernetes/clusters/:id/health
 * Get health information for a specific Kubernetes cluster
 */
router.get('/clusters/:id/health', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const clusterId = req.params.id;
    
    if (!kubernetesService.hasCluster(clusterId)) {
      return res.status(404).json({ message: 'Kubernetes cluster not found' });
    }
    
    const healthInfo = await kubernetesService.getClusterHealth(clusterId);
    res.json(healthInfo);
  } catch (error: any) {
    console.error(`Error fetching health for cluster ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed to fetch cluster health' });
  }
});

/**
 * GET /api/kubernetes/clusters/:clusterId/namespaces/:namespace/pods/:podName/utilization
 * Get resource utilization for a specific pod
 */
router.get('/clusters/:clusterId/namespaces/:namespace/pods/:podName/utilization', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { clusterId, namespace, podName } = req.params;
    
    if (!kubernetesService.hasCluster(clusterId)) {
      return res.status(404).json({ message: 'Kubernetes cluster not found' });
    }
    
    const utilizationData = await kubernetesService.getResourceUtilization(clusterId, namespace, podName);
    
    if (!utilizationData) {
      return res.status(404).json({ message: 'Pod metrics not found or metrics server not available' });
    }
    
    res.json(utilizationData);
  } catch (error: any) {
    console.error(`Error fetching pod utilization for ${req.params.namespace}/${req.params.podName}:`, error);
    res.status(500).json({ message: error.message || 'Failed to fetch pod utilization data' });
  }
});

export default router;