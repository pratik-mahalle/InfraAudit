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
  cpu?: {
    requests?: string;
    limits?: string;
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
}