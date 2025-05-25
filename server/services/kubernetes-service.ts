import * as k8s from '@kubernetes/client-node';
import { v4 as uuidv4 } from 'uuid';

// Types for Kubernetes clusters and resources
export interface KubernetesClusterConfig {
  name: string;
  kubeconfig?: string;
  context?: string;
}

export interface KubernetesCluster {
  id: string;
  name: string;
  context?: string;
  hasKubeconfig: boolean;
}

export interface KubernetesResource {
  id: string;
  name: string;
  namespace: string;
  kind: string;
  creationTimestamp: string;
  status: string;
  cost?: number;
  costPerMonth?: number;
  utilization?: number;
  cpu?: {
    requests?: string;
    limits?: string;
    usage?: string;
  };
  memory?: {
    requests?: string;
    limits?: string;
  };
  podCount?: number;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  clusterName: string;
}

/**
 * Service to manage Kubernetes clusters
 */
export class KubernetesService {
  private clusters: Map<string, {
    config: KubernetesClusterConfig;
    client: k8s.KubeConfig;
    coreApi: k8s.CoreV1Api;
    appsApi: k8s.AppsV1Api;
    metricsClient?: k8s.Metrics;
  }> = new Map();

  constructor() {
    console.log('Initializing Kubernetes service...');
  }

  /**
   * Add a Kubernetes cluster
   */
  addCluster(config: KubernetesClusterConfig): KubernetesCluster {
    try {
      console.log(`Adding Kubernetes cluster: ${config.name}`);
      
      // Create a KubeConfig
      const kubeConfig = new k8s.KubeConfig();
      
      if (config.kubeconfig) {
        // Load from provided kubeconfig
        kubeConfig.loadFromString(config.kubeconfig);
        
        // Set context if provided
        if (config.context) {
          kubeConfig.setCurrentContext(config.context);
        }
      } else {
        // If no kubeconfig is provided, try to load from default locations
        try {
          kubeConfig.loadFromDefault();
        } catch (error) {
          console.error('Failed to load kubeconfig from default location:', error);
          throw new Error('No valid kubeconfig provided and could not load from default location');
        }
      }
      
      // Create API clients
      const coreApi = kubeConfig.makeApiClient(k8s.CoreV1Api);
      const appsApi = kubeConfig.makeApiClient(k8s.AppsV1Api);
      
      // Create Metrics client if available
      let metricsClient: k8s.Metrics | undefined;
      try {
        metricsClient = new k8s.Metrics(kubeConfig);
      } catch (error) {
        console.warn('Metrics API not available:', error);
      }
      
      // Generate an ID for the cluster
      const clusterId = uuidv4();
      
      // Store the cluster configuration and clients
      this.clusters.set(clusterId, {
        config,
        client: kubeConfig,
        coreApi,
        appsApi,
        metricsClient
      });
      
      // Return the cluster information
      return {
        id: clusterId,
        name: config.name,
        context: kubeConfig.getCurrentContext(),
        hasKubeconfig: !!config.kubeconfig
      };
    } catch (error) {
      console.error('Error adding Kubernetes cluster:', error);
      throw error;
    }
  }

  /**
   * Get all Kubernetes clusters
   */
  getClusters(): KubernetesCluster[] {
    const clusters: KubernetesCluster[] = [];
    
    for (const [id, { config, client }] of this.clusters.entries()) {
      clusters.push({
        id,
        name: config.name,
        context: client.getCurrentContext(),
        hasKubeconfig: !!config.kubeconfig
      });
    }
    
    return clusters;
  }

  /**
   * Get a Kubernetes cluster by ID
   */
  getCluster(id: string): KubernetesCluster | undefined {
    const cluster = this.clusters.get(id);
    if (!cluster) return undefined;
    
    return {
      id,
      name: cluster.config.name,
      context: cluster.client.getCurrentContext(),
      hasKubeconfig: !!cluster.config.kubeconfig
    };
  }

  /**
   * Remove a Kubernetes cluster
   */
  removeCluster(id: string): boolean {
    return this.clusters.delete(id);
  }

  /**
   * Get resources for a specific cluster
   */
  async getResources(clusterId: string): Promise<KubernetesResource[]> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      throw new Error(`Cluster with ID ${clusterId} not found`);
    }
    
    try {
      const resources: KubernetesResource[] = [];
      
      // Get pods
      const pods = await this.getPods(clusterId);
      resources.push(...pods);
      
      // Get deployments
      const deployments = await this.getDeployments(clusterId);
      resources.push(...deployments);
      
      // Get services
      const services = await this.getServices(clusterId);
      resources.push(...services);
      
      return resources;
    } catch (error) {
      console.error(`Error getting resources for cluster ${clusterId}:`, error);
      throw error;
    }
  }

  /**
   * Get pods for a specific cluster
   */
  private async getPods(clusterId: string): Promise<KubernetesResource[]> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      throw new Error(`Cluster with ID ${clusterId} not found`);
    }
    
    try {
      // Get pods from all namespaces
      const response = await cluster.coreApi.listPodForAllNamespaces();
      const resources: KubernetesResource[] = [];
      
      if (response && response.body && response.body.items) {
        for (const pod of response.body.items) {
          // Extract resource requests and limits
          const containers = pod.spec?.containers || [];
          const cpu: { requests?: string; limits?: string } = {};
          const memory: { requests?: string; limits?: string } = {};
          
          // Aggregate resource requests and limits from all containers
          for (const container of containers) {
            if (container.resources) {
              if (container.resources.requests?.cpu) {
                cpu.requests = container.resources.requests.cpu;
              }
              if (container.resources.limits?.cpu) {
                cpu.limits = container.resources.limits.cpu;
              }
              if (container.resources.requests?.memory) {
                memory.requests = container.resources.requests.memory;
              }
              if (container.resources.limits?.memory) {
                memory.limits = container.resources.limits.memory;
              }
            }
          }
          
          resources.push({
            id: `${clusterId}-pod-${pod.metadata?.uid || uuidv4()}`,
            name: pod.metadata?.name || 'unknown',
            namespace: pod.metadata?.namespace || 'default',
            kind: 'Pod',
            creationTimestamp: pod.metadata?.creationTimestamp || new Date().toISOString(),
            status: pod.status?.phase || 'Unknown',
            cpu,
            memory,
            labels: pod.metadata?.labels || {},
            annotations: pod.metadata?.annotations || {},
            clusterName: cluster.config.name
          });
        }
      }
      
      return resources;
    } catch (error) {
      console.error(`Error getting pods for cluster ${clusterId}:`, error);
      return [];
    }
  }

  /**
   * Get deployments for a specific cluster
   */
  private async getDeployments(clusterId: string): Promise<KubernetesResource[]> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      throw new Error(`Cluster with ID ${clusterId} not found`);
    }
    
    try {
      // Get deployments from all namespaces
      const response = await cluster.appsApi.listDeploymentForAllNamespaces();
      const resources: KubernetesResource[] = [];
      
      if (response && response.body && response.body.items) {
        for (const deployment of response.body.items) {
          resources.push({
            id: `${clusterId}-deployment-${deployment.metadata?.uid || uuidv4()}`,
            name: deployment.metadata?.name || 'unknown',
            namespace: deployment.metadata?.namespace || 'default',
            kind: 'Deployment',
            creationTimestamp: deployment.metadata?.creationTimestamp || new Date().toISOString(),
            status: this.getDeploymentStatus(deployment),
            podCount: deployment.status?.readyReplicas || 0,
            labels: deployment.metadata?.labels || {},
            annotations: deployment.metadata?.annotations || {},
            clusterName: cluster.config.name
          });
        }
      }
      
      return resources;
    } catch (error) {
      console.error(`Error getting deployments for cluster ${clusterId}:`, error);
      return [];
    }
  }

  /**
   * Get services for a specific cluster
   */
  private async getServices(clusterId: string): Promise<KubernetesResource[]> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      throw new Error(`Cluster with ID ${clusterId} not found`);
    }
    
    try {
      // Get services from all namespaces
      const response = await cluster.coreApi.listServiceForAllNamespaces();
      const resources: KubernetesResource[] = [];
      
      if (response && response.body && response.body.items) {
        for (const service of response.body.items) {
          resources.push({
            id: `${clusterId}-service-${service.metadata?.uid || uuidv4()}`,
            name: service.metadata?.name || 'unknown',
            namespace: service.metadata?.namespace || 'default',
            kind: 'Service',
            creationTimestamp: service.metadata?.creationTimestamp || new Date().toISOString(),
            status: 'Active', // Services don't have a status field
            labels: service.metadata?.labels || {},
            annotations: service.metadata?.annotations || {},
            clusterName: cluster.config.name
          });
        }
      }
      
      return resources;
    } catch (error) {
      console.error(`Error getting services for cluster ${clusterId}:`, error);
      return [];
    }
  }

  /**
   * Get metrics for a pod
   */
  async getPodMetrics(clusterId: string, namespace: string, podName: string): Promise<any> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      throw new Error(`Cluster with ID ${clusterId} not found`);
    }
    
    if (!cluster.metricsClient) {
      throw new Error('Metrics API not available for this cluster');
    }
    
    try {
      const metrics = await cluster.metricsClient.getPodMetrics(namespace, podName);
      
      if (metrics && metrics.containers) {
        return metrics;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting metrics for pod ${namespace}/${podName}:`, error);
      return null;
    }
  }

  /**
   * Get pod logs
   */
  async getPodLogs(clusterId: string, namespace: string, podName: string, container?: string): Promise<string> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      throw new Error(`Cluster with ID ${clusterId} not found`);
    }
    
    try {
      const response = await cluster.coreApi.readNamespacedPodLog(podName, namespace, container);
      return response.body;
    } catch (error) {
      console.error(`Error getting logs for pod ${namespace}/${podName}:`, error);
      return `Error getting logs: ${error}`;
    }
  }

  /**
   * Get cluster health status
   */
  async getClusterHealth(clusterId: string): Promise<any> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      throw new Error(`Cluster with ID ${clusterId} not found`);
    }
    
    try {
      // Check component status and node status
      const componentStatus = await this.getComponentStatus(clusterId);
      const nodeStatus = await this.getNodeStatus(clusterId);
      
      return {
        status: this.aggregateHealthStatus(componentStatus, nodeStatus),
        components: componentStatus,
        nodes: nodeStatus
      };
    } catch (error) {
      console.error(`Error getting health for cluster ${clusterId}:`, error);
      return {
        status: 'unknown',
        components: [],
        nodes: []
      };
    }
  }

  /**
   * Get component status
   */
  private async getComponentStatus(clusterId: string): Promise<any[]> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      throw new Error(`Cluster with ID ${clusterId} not found`);
    }
    
    try {
      const response = await cluster.coreApi.listComponentStatus();
      const components: any[] = [];
      
      if (response && response.body && response.body.items) {
        for (const component of response.body.items) {
          const status = component.conditions?.[0]?.type || 'Unknown';
          components.push({
            name: component.metadata?.name || 'unknown',
            status: status
          });
        }
      }
      
      return components;
    } catch (error) {
      console.error(`Error getting component status for cluster ${clusterId}:`, error);
      return [];
    }
  }

  /**
   * Get node status
   */
  private async getNodeStatus(clusterId: string): Promise<any[]> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      throw new Error(`Cluster with ID ${clusterId} not found`);
    }
    
    try {
      const response = await cluster.coreApi.listNode();
      const nodes: any[] = [];
      
      if (response && response.body && response.body.items) {
        for (const node of response.body.items) {
          // Determine node readiness
          const readyCondition = node.status?.conditions?.find(
            (condition) => condition.type === 'Ready'
          );
          const isReady = readyCondition?.status === 'True';
          
          nodes.push({
            name: node.metadata?.name || 'unknown',
            status: isReady ? 'Ready' : 'NotReady',
            version: node.status?.nodeInfo?.kubeletVersion || 'unknown',
            address: node.status?.addresses?.find(addr => addr.type === 'InternalIP')?.address || 'unknown'
          });
        }
      }
      
      return nodes;
    } catch (error) {
      console.error(`Error getting node status for cluster ${clusterId}:`, error);
      return [];
    }
  }

  /**
   * Helper method to determine deployment status
   */
  private getDeploymentStatus(deployment: any): string {
    if (!deployment.status) {
      return 'Unknown';
    }
    
    const desiredReplicas = deployment.spec?.replicas || 0;
    const readyReplicas = deployment.status.readyReplicas || 0;
    const updatedReplicas = deployment.status.updatedReplicas || 0;
    const availableReplicas = deployment.status.availableReplicas || 0;
    
    if (readyReplicas === desiredReplicas && updatedReplicas === desiredReplicas) {
      return 'Available';
    } else if (updatedReplicas < desiredReplicas) {
      return 'Updating';
    } else if (availableReplicas < desiredReplicas) {
      return 'Unavailable';
    } else {
      return 'Progressing';
    }
  }

  /**
   * Aggregate health status from components and nodes
   */
  private aggregateHealthStatus(components: any[], nodes: any[]): string {
    // Check if we have any data
    if (components.length === 0 && nodes.length === 0) {
      return 'unknown';
    }
    
    // Check node health
    const nodeHealth = nodes.every(node => node.status === 'Ready');
    
    // Check component health
    const componentHealth = components.every(component => component.status === 'Healthy');
    
    if (nodeHealth && componentHealth) {
      return 'ok';
    } else if (!nodeHealth && !componentHealth) {
      return 'critical';
    } else {
      return 'warning';
    }
  }

  // Calculate cost for Kubernetes resources based on cloud provider pricing
  async calculateKubernetesCosts(clusterId: string): Promise<{ 
    totalCost: number;
    costBreakdown: Record<string, number>;
    resourceCosts: Array<{ resourceId: string; cost: number; type: string }>
  }> {
    try {
      // Get all resources in the cluster
      const pods = await this.getPods(clusterId);
      const deployments = await this.getDeployments(clusterId);
      const services = await this.getServices(clusterId);
      const nodes = await this.getNodes(clusterId);
      
      // Pricing constants (USD)
      const pricingModel = {
        cpu: {
          hourly: 0.0425, // Per vCPU hour
          monthly: 31.025 // Per vCPU month (avg 31 days)
        },
        memory: {
          hourly: 0.00553, // Per GB hour
          monthly: 4.0369 // Per GB month (avg 31 days)
        },
        loadBalancer: {
          hourly: 0.025, // Per hour
          monthly: 18.25 // Per month (avg 31 days)
        },
        persistentStorage: {
          standard: {
            perGBMonth: 0.10 // Standard storage per GB-month
          },
          ssd: {
            perGBMonth: 0.17 // SSD storage per GB-month
          }
        }
      };
      
      // Initialize cost breakdown
      const costBreakdown: Record<string, number> = {
        compute: 0,
        memory: 0,
        storage: 0,
        networking: 0
      };
      
      const resourceCosts: Array<{ resourceId: string; cost: number; type: string }> = [];
      
      // Calculate node costs - this is the baseline compute cost
      for (const node of nodes) {
        const cpuCapacity = this.parseCpuValue(node.status?.capacity?.cpu || '0');
        const memoryGb = this.parseMemoryValue(node.status?.capacity?.memory || '0') / 1024; // Convert MB to GB
        
        const cpuCost = cpuCapacity * pricingModel.cpu.hourly * 24; // Daily cost
        const memoryCost = memoryGb * pricingModel.memory.hourly * 24; // Daily cost
        
        costBreakdown.compute += cpuCost;
        costBreakdown.memory += memoryCost;
        
        resourceCosts.push({
          resourceId: node.name,
          cost: cpuCost + memoryCost,
          type: 'Node'
        });
      }
      
      // Calculate costs for pods based on resource requests/limits
      for (const pod of pods) {
        let podCpuCost = 0;
        let podMemoryCost = 0;
        
        // Sum up container resources
        if (pod.cpu && pod.memory) {
          const cpuRequests = this.parseCpuValue(pod.cpu.requests || '0');
          const memoryGb = this.parseMemoryValue(pod.memory.requests || '0') / 1024; // Convert MB to GB
          
          podCpuCost = cpuRequests * pricingModel.cpu.hourly * 24; // Daily cost
          podMemoryCost = memoryGb * pricingModel.memory.hourly * 24; // Daily cost
        }
        
        // Add pod storage costs if applicable
        // This is a simplified approach - in real systems you'd look at PVC data
        const podStorageCost = 0; // Placeholder for real storage cost calculation
        
        // Calculate pod utilization (if metrics available)
        let utilization = 0;
        if (pod.cpu?.usage && pod.cpu?.requests) {
          const cpuUsage = this.parseCpuValue(pod.cpu.usage);
          const cpuRequests = this.parseCpuValue(pod.cpu.requests);
          if (cpuRequests > 0) {
            utilization = Math.min(100, Math.round((cpuUsage / cpuRequests) * 100));
          }
        }
        
        const totalPodCost = podCpuCost + podMemoryCost + podStorageCost;
        
        // Update the pod object with cost information
        pod.cost = parseFloat(totalPodCost.toFixed(4));
        pod.costPerMonth = parseFloat((totalPodCost * 30).toFixed(2));
        pod.utilization = utilization;
        
        // Add to cost breakdown
        costBreakdown.compute += podCpuCost;
        costBreakdown.memory += podMemoryCost;
        costBreakdown.storage += podStorageCost;
        
        resourceCosts.push({
          resourceId: pod.id,
          cost: totalPodCost,
          type: 'Pod'
        });
      }
      
      // Calculate service costs (primarily for load balancers)
      for (const service of services) {
        let serviceCost = 0;
        
        // Charge for LoadBalancer type services
        if (service.type === 'LoadBalancer') {
          serviceCost = pricingModel.loadBalancer.hourly * 24; // Daily cost
          costBreakdown.networking += serviceCost;
        }
        
        resourceCosts.push({
          resourceId: service.id,
          cost: serviceCost,
          type: 'Service'
        });
      }
      
      // Calculate total cost
      const totalCost = Object.values(costBreakdown).reduce((sum, cost) => sum + cost, 0);
      
      return {
        totalCost,
        costBreakdown,
        resourceCosts
      };
    } catch (error) {
      console.error('Error calculating Kubernetes costs:', error);
      throw new Error(`Failed to calculate Kubernetes costs: ${error.message}`);
    }
  }
  
  // Generate cost predictions for Kubernetes cluster
  async generateKubernetesCostPredictions(clusterId: string, days: number = 30): Promise<{
    daily: Array<{ date: string; cost: number }>;
    weekly: Array<{ week: number; cost: number }>;
    monthly: { cost: number };
    resourceProjections: Array<{ resourceId: string; type: string; currentCost: number; projectedCost: number; trend: 'increasing' | 'stable' | 'decreasing' }>
  }> {
    try {
      // Get current costs
      const currentCosts = await this.calculateKubernetesCosts(clusterId);
      
      // Get historical pod counts and resource usage (simplified version)
      // In a real implementation, this would query a time-series database
      const podHistory = await this.getPods(clusterId);
      const nodeHistory = await this.getNodes(clusterId);
      
      // Calculate growth rate based on recent history (simulated)
      // In a real implementation, this would analyze trends in resource usage
      const growthRates = {
        pods: 0.015, // 1.5% daily growth
        nodes: 0.005, // 0.5% daily growth
        cpu: 0.01,   // 1% daily growth
        memory: 0.02  // 2% daily growth
      };
      
      // Generate daily projections
      const daily = [];
      let cumulativeCost = currentCosts.totalCost;
      
      for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        // Apply growth rates
        cumulativeCost *= (1 + growthRates.pods + growthRates.cpu);
        
        daily.push({
          date: date.toISOString().split('T')[0],
          cost: parseFloat(cumulativeCost.toFixed(2))
        });
      }
      
      // Generate weekly projections
      const weekly = [];
      for (let i = 0; i < days; i += 7) {
        const weekCosts = daily.slice(i, i + 7);
        if (weekCosts.length > 0) {
          const weekTotal = weekCosts.reduce((sum, day) => sum + day.cost, 0);
          weekly.push({
            week: Math.floor(i / 7) + 1,
            cost: parseFloat(weekTotal.toFixed(2))
          });
        }
      }
      
      // Monthly projection
      const monthlyTotal = daily.reduce((sum, day) => sum + day.cost, 0);
      
      // Generate resource-specific projections
      const resourceProjections = currentCosts.resourceCosts.map(resource => {
        // Apply different growth rates based on resource type
        let growthRate = 0.01; // Default
        if (resource.type === 'Pod') {
          growthRate = growthRates.pods;
        } else if (resource.type === 'Node') {
          growthRate = growthRates.nodes;
        }
        
        const projectedCost = resource.cost * Math.pow(1 + growthRate, days);
        const trend = growthRate > 0.01 ? 'increasing' : (growthRate < 0.005 ? 'decreasing' : 'stable');
        
        return {
          resourceId: resource.resourceId,
          type: resource.type,
          currentCost: parseFloat(resource.cost.toFixed(2)),
          projectedCost: parseFloat(projectedCost.toFixed(2)),
          trend: trend as 'increasing' | 'stable' | 'decreasing'
        };
      });
      
      return {
        daily,
        weekly,
        monthly: { cost: parseFloat(monthlyTotal.toFixed(2)) },
        resourceProjections
      };
    } catch (error) {
      console.error('Error generating Kubernetes cost predictions:', error);
      throw new Error(`Failed to generate Kubernetes cost predictions: ${error.message}`);
    }
  }
  
  // Generate cost optimization recommendations for Kubernetes resources
  async generateKubernetesOptimizationRecommendations(clusterId: string): Promise<Array<{
    resourceId: string;
    resourceName: string;
    resourceType: string;
    recommendation: string;
    potentialSavings: number;
    details: string;
    severity: 'high' | 'medium' | 'low';
  }>> {
    try {
      const pods = await this.getPods(clusterId);
      const nodes = await this.getNodes(clusterId);
      const deployments = await this.getDeployments(clusterId);
      
      const recommendations = [];
      
      // Check for underutilized pods
      for (const pod of pods) {
        if (pod.utilization !== undefined && pod.utilization < 30 && pod.cost && pod.cost > 0) {
          recommendations.push({
            resourceId: pod.id,
            resourceName: pod.name,
            resourceType: 'Pod',
            recommendation: 'Rightsize container resources',
            potentialSavings: parseFloat((pod.cost * 0.4).toFixed(2)), // 40% potential savings
            details: `Pod ${pod.name} is consistently using less than 30% of requested CPU resources. Consider reducing resource requests.`,
            severity: 'medium'
          });
        }
      }
      
      // Check for node optimization opportunities
      for (const node of nodes) {
        // Check if node is underutilized
        if (node.utilization !== undefined && node.utilization < 20) {
          recommendations.push({
            resourceId: node.name,
            resourceName: node.name,
            resourceType: 'Node',
            recommendation: 'Consider node consolidation',
            potentialSavings: 0, // Calculate based on node cost
            details: `Node ${node.name} is significantly underutilized. Consider consolidating workloads to reduce cluster size.`,
            severity: 'high'
          });
        }
      }
      
      // Check deployment configurations
      for (const deployment of deployments) {
        // Check for missing resource limits
        if (!deployment.cpu?.limits || !deployment.memory?.limits) {
          recommendations.push({
            resourceId: deployment.id,
            resourceName: deployment.name,
            resourceType: 'Deployment',
            recommendation: 'Add resource limits',
            potentialSavings: 0, // Non-cost recommendation
            details: `Deployment ${deployment.name} is missing resource limits, which can lead to resource contention and poor cluster efficiency.`,
            severity: 'medium'
          });
        }
        
        // Check for high replica count with low utilization
        if (deployment.replicas && deployment.replicas > 3 && deployment.utilization && deployment.utilization < 30) {
          const potentialSavings = (deployment.replicas * 0.3); // Simplified calculation
          
          recommendations.push({
            resourceId: deployment.id,
            resourceName: deployment.name,
            resourceType: 'Deployment',
            recommendation: 'Reduce replica count',
            potentialSavings: parseFloat(potentialSavings.toFixed(2)),
            details: `Deployment ${deployment.name} has ${deployment.replicas} replicas with low utilization. Consider reducing the replica count.`,
            severity: 'medium'
          });
        }
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error generating Kubernetes optimization recommendations:', error);
      throw new Error(`Failed to generate Kubernetes optimization recommendations: ${error.message}`);
    }
  }
  
  // Helper function to parse CPU values (e.g., "100m" to 0.1)
  private parseCpuValue(cpu: string): number {
    if (!cpu) return 0;
    
    if (cpu.endsWith('m')) {
      return parseFloat(cpu.replace('m', '')) / 1000;
    }
    
    return parseFloat(cpu);
  }
  
  // Helper function to parse memory values to MB
  private parseMemoryValue(memory: string): number {
    if (!memory) return 0;
    
    let value = parseFloat(memory.replace(/[^0-9.]/g, ''));
    
    if (memory.includes('Ki')) {
      value = value / 1024; // Convert KiB to MiB
    } else if (memory.includes('Mi')) {
      // Already in MiB
    } else if (memory.includes('Gi')) {
      value = value * 1024; // Convert GiB to MiB
    } else if (memory.includes('Ti')) {
      value = value * 1024 * 1024; // Convert TiB to MiB
    }
    
    return value;
  }
}