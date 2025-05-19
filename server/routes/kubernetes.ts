import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { KubernetesService, KubernetesClusterConfig } from '../services/kubernetes-service';

// Create a new Kubernetes service instance that will be used across the application
const kubernetesService = new KubernetesService();

// Schema for adding a Kubernetes cluster
const addClusterSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  kubeconfig: z.string().optional(),
  context: z.string().optional(),
});

const router = Router();

// Get all Kubernetes clusters
router.get('/clusters', (req: Request, res: Response) => {
  try {
    const clusters = kubernetesService.getClusters();
    res.json(clusters);
  } catch (error) {
    console.error('Error getting Kubernetes clusters:', error);
    res.status(500).json({ error: 'Failed to get Kubernetes clusters' });
  }
});

// Get a specific Kubernetes cluster
router.get('/clusters/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cluster = kubernetesService.getCluster(id);
    
    if (!cluster) {
      return res.status(404).json({ error: 'Kubernetes cluster not found' });
    }
    
    res.json(cluster);
  } catch (error) {
    console.error('Error getting Kubernetes cluster:', error);
    res.status(500).json({ error: 'Failed to get Kubernetes cluster' });
  }
});

// Add a Kubernetes cluster
router.post('/clusters', (req: Request, res: Response) => {
  try {
    const validation = addClusterSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid cluster configuration',
        details: validation.error.format()
      });
    }
    
    const config: KubernetesClusterConfig = validation.data;
    const cluster = kubernetesService.addCluster(config);
    
    res.status(201).json(cluster);
  } catch (error) {
    console.error('Error adding Kubernetes cluster:', error);
    res.status(500).json({ error: 'Failed to add Kubernetes cluster' });
  }
});

// Remove a Kubernetes cluster
router.delete('/clusters/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = kubernetesService.removeCluster(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Kubernetes cluster not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error removing Kubernetes cluster:', error);
    res.status(500).json({ error: 'Failed to remove Kubernetes cluster' });
  }
});

// Get resources for a specific cluster
router.get('/clusters/:id/resources', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resources = await kubernetesService.getResources(id);
    
    res.json(resources);
  } catch (error) {
    console.error('Error getting Kubernetes resources:', error);
    res.status(500).json({ error: 'Failed to get Kubernetes resources' });
  }
});

// Get health status for a specific cluster
router.get('/clusters/:id/health', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const health = await kubernetesService.getClusterHealth(id);
    
    res.json(health);
  } catch (error) {
    console.error('Error getting Kubernetes cluster health:', error);
    res.status(500).json({ error: 'Failed to get Kubernetes cluster health' });
  }
});

// Get logs for a specific pod
router.get('/clusters/:id/namespaces/:namespace/pods/:name/logs', async (req: Request, res: Response) => {
  try {
    const { id, namespace, name } = req.params;
    const { container } = req.query;
    
    const logs = await kubernetesService.getPodLogs(
      id, 
      namespace, 
      name,
      container as string | undefined
    );
    
    res.json({ logs });
  } catch (error) {
    console.error('Error getting pod logs:', error);
    res.status(500).json({ error: 'Failed to get pod logs' });
  }
});

export default router;