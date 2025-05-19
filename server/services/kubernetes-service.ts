import * as k8s from '@kubernetes/client-node';
import { EventEmitter } from 'events';

export interface KubernetesClusterConfig {
  id: string;
  name: string;
  kubeconfig?: string;
  context?: string;
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

interface UtilizationData {
  cpu: {
    current: number;
    limit: number;
    timestamp: string;
  };
  memory: {
    current: number;
    limit: number;
    timestamp: string;
  };
}

export class KubernetesService extends EventEmitter {
  private clusters: Map<string, {
    config: KubernetesClusterConfig;
    client: k8s.KubeConfig;
    coreApi: k8s.CoreV1Api;
    appsApi: k8s.AppsV1Api;
    metricsClient?: k8s.Metrics;
  }> = new Map();

  constructor() {
    super();
  }

  /**
   * Add a Kubernetes cluster
   */
  async addCluster(config: KubernetesClusterConfig): Promise<boolean> {
    try {
      const kc = new k8s.KubeConfig();
      
      if (config.kubeconfig) {
        // Load from kubeconfig string
        const kubeConfigBuffer = Buffer.from(config.kubeconfig, 'utf-8');
        kc.loadFromString(kubeConfigBuffer.toString());
      } else {
        // Try loading from default location
        kc.loadFromDefault();
      }

      // Set context if provided
      if (config.context) {
        kc.setCurrentContext(config.context);
      }

      const coreApi = kc.makeApiClient(k8s.CoreV1Api);
      const appsApi = kc.makeApiClient(k8s.AppsV1Api);
      
      // Attempt to access the API to verify credentials
      await coreApi.listNamespacedPod('default');

      // If metrics server is available, create metrics client
      try {
        const metricsClient = new k8s.Metrics(kc);
        this.clusters.set(config.id, { config, client: kc, coreApi, appsApi, metricsClient });
      } catch (error) {
        // Store without metrics if not available
        console.warn(`Metrics not available for cluster ${config.name}: ${error}`);
        this.clusters.set(config.id, { config, client: kc, coreApi, appsApi });
      }

      return true;
    } catch (error) {
      console.error(`Failed to add Kubernetes cluster ${config.name}:`, error);
      return false;
    }
  }

  /**
   * Remove a Kubernetes cluster
   */
  removeCluster(clusterId: string): boolean {
    return this.clusters.delete(clusterId);
  }

  /**
   * Get all configured clusters
   */
  getClusters(): KubernetesClusterConfig[] {
    return Array.from(this.clusters.values()).map(cluster => cluster.config);
  }

  /**
   * Check if cluster is already configured
   */
  hasCluster(clusterId: string): boolean {
    return this.clusters.has(clusterId);
  }

  /**
   * Get all resources from all clusters
   */
  async getAllResources(): Promise<KubernetesResource[]> {
    const allResources: KubernetesResource[] = [];
    
    for (const [clusterId, cluster] of this.clusters.entries()) {
      try {
        const resources = await this.getClusterResources(clusterId);
        allResources.push(...resources);
      } catch (error) {
        console.error(`Error fetching resources from cluster ${cluster.config.name}:`, error);
      }
    }

    return allResources;
  }

  /**
   * Get resources from a specific cluster
   */
  async getClusterResources(clusterId: string): Promise<KubernetesResource[]> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      throw new Error(`Cluster ${clusterId} not found`);
    }

    const resources: KubernetesResource[] = [];
    
    try {
      // Get all pods
      const { body: pods } = await cluster.coreApi.listPodForAllNamespaces();
      
      for (const pod of pods.items) {
        const resource: KubernetesResource = {
          id: `${clusterId}:pod:${pod.metadata?.namespace}/${pod.metadata?.name}`,
          name: pod.metadata?.name || 'unknown',
          namespace: pod.metadata?.namespace || 'default',
          kind: 'Pod',
          creationTimestamp: pod.metadata?.creationTimestamp || new Date().toISOString(),
          status: pod.status?.phase || 'Unknown',
          labels: pod.metadata?.labels || {},
          annotations: pod.metadata?.annotations || {},
          clusterName: cluster.config.name,
          cpu: {
            requests: this.calculatePodCpuRequests(pod),
            limits: this.calculatePodCpuLimits(pod),
          },
          memory: {
            requests: this.calculatePodMemoryRequests(pod),
            limits: this.calculatePodMemoryLimits(pod),
          }
        };
        
        resources.push(resource);
      }

      // Get all deployments
      const { body: deployments } = await cluster.appsApi.listDeploymentForAllNamespaces();
      
      for (const deployment of deployments.items) {
        const resource: KubernetesResource = {
          id: `${clusterId}:deployment:${deployment.metadata?.namespace}/${deployment.metadata?.name}`,
          name: deployment.metadata?.name || 'unknown',
          namespace: deployment.metadata?.namespace || 'default',
          kind: 'Deployment',
          creationTimestamp: deployment.metadata?.creationTimestamp || new Date().toISOString(),
          status: this.getDeploymentStatus(deployment),
          labels: deployment.metadata?.labels || {},
          annotations: deployment.metadata?.annotations || {},
          clusterName: cluster.config.name,
          podCount: deployment.status?.readyReplicas || 0
        };
        
        resources.push(resource);
      }

      // Get all services
      const { body: services } = await cluster.coreApi.listServiceForAllNamespaces();
      
      for (const service of services.items) {
        const resource: KubernetesResource = {
          id: `${clusterId}:service:${service.metadata?.namespace}/${service.metadata?.name}`,
          name: service.metadata?.name || 'unknown',
          namespace: service.metadata?.namespace || 'default',
          kind: 'Service',
          creationTimestamp: service.metadata?.creationTimestamp || new Date().toISOString(),
          status: 'Active', // Services don't really have a status
          labels: service.metadata?.labels || {},
          annotations: service.metadata?.annotations || {},
          clusterName: cluster.config.name
        };
        
        resources.push(resource);
      }

      return resources;
    } catch (error) {
      console.error(`Error fetching resources from cluster ${cluster.config.name}:`, error);
      throw error;
    }
  }

  /**
   * Get resource utilization data
   */
  async getResourceUtilization(clusterId: string, namespace: string, podName: string): Promise<UtilizationData | null> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster || !cluster.metricsClient) {
      return null;
    }

    try {
      const podMetrics = await cluster.metricsClient.getPodMetrics(namespace, podName);
      if (!podMetrics || !podMetrics.containers || podMetrics.containers.length === 0) {
        return null;
      }

      // Get pod to calculate capacity/limits
      const { body: pod } = await cluster.coreApi.readNamespacedPod(podName, namespace);
      
      // Calculate total CPU and memory usage across all containers
      let totalCpuUsage = 0;
      let totalMemoryUsage = 0;
      let cpuLimit = 0;
      let memoryLimit = 0;

      for (const container of podMetrics.containers) {
        // CPU is in cores or millicores
        const cpuUsage = this.parseCpuMetric(container.usage.cpu);
        totalCpuUsage += cpuUsage;

        // Memory is in bytes
        const memoryUsage = this.parseMemoryMetric(container.usage.memory);
        totalMemoryUsage += memoryUsage;
      }

      // Calculate limits from pod spec
      for (const container of pod.spec?.containers || []) {
        if (container.resources?.limits?.cpu) {
          cpuLimit += this.parseCpuValue(container.resources.limits.cpu);
        }
        
        if (container.resources?.limits?.memory) {
          memoryLimit += this.parseMemoryValue(container.resources.limits.memory);
        }
      }

      return {
        cpu: {
          current: totalCpuUsage,
          limit: cpuLimit,
          timestamp: new Date().toISOString()
        },
        memory: {
          current: totalMemoryUsage,
          limit: memoryLimit,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`Error fetching pod metrics for ${namespace}/${podName}:`, error);
      return null;
    }
  }

  /**
   * Get cluster health status
   */
  async getClusterHealth(clusterId: string): Promise<{ 
    status: 'Healthy' | 'Degraded' | 'Critical' | 'Unknown';
    components: { name: string; status: string }[];
    nodes: { name: string; status: string; capacity: any }[];
  }> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      throw new Error(`Cluster ${clusterId} not found`);
    }

    try {
      // Check component status
      const { body: componentStatuses } = await cluster.coreApi.listComponentStatus();
      
      const components = componentStatuses.items.map(component => ({
        name: component.metadata?.name || 'unknown',
        status: component.conditions?.[0]?.type || 'Unknown'
      }));

      // Check nodes status
      const { body: nodes } = await cluster.coreApi.listNode();
      
      const nodeStatuses = nodes.items.map(node => ({
        name: node.metadata?.name || 'unknown',
        status: this.getNodeStatus(node),
        capacity: node.status?.capacity || {}
      }));

      // Calculate overall status
      const criticalNodes = nodeStatuses.filter(node => node.status === 'NotReady').length;
      const degradedComponents = components.filter(component => component.status !== 'Healthy').length;

      let status: 'Healthy' | 'Degraded' | 'Critical' | 'Unknown' = 'Healthy';
      
      if (criticalNodes > 0) {
        status = 'Critical';
      } else if (degradedComponents > 0) {
        status = 'Degraded';
      }

      return {
        status,
        components,
        nodes: nodeStatuses
      };
    } catch (error) {
      console.error(`Error checking cluster health for ${cluster.config.name}:`, error);
      return {
        status: 'Unknown',
        components: [],
        nodes: []
      };
    }
  }

  /**
   * Helper methods for resource processing
   */
  private getNodeStatus(node: k8s.V1Node): string {
    if (!node.status?.conditions) {
      return 'Unknown';
    }

    const readyCondition = node.status.conditions.find(
      condition => condition.type === 'Ready'
    );

    return readyCondition?.status === 'True' ? 'Ready' : 'NotReady';
  }

  private getDeploymentStatus(deployment: k8s.V1Deployment): string {
    if (!deployment.status) {
      return 'Unknown';
    }

    const { availableReplicas = 0, replicas = 0 } = deployment.status;
    
    if (availableReplicas === replicas && replicas > 0) {
      return 'Available';
    } else if (availableReplicas < replicas && availableReplicas > 0) {
      return 'Degraded';
    } else {
      return 'Unavailable';
    }
  }

  private calculatePodCpuRequests(pod: k8s.V1Pod): string {
    let totalCpu = 0;
    
    for (const container of pod.spec?.containers || []) {
      if (container.resources?.requests?.cpu) {
        totalCpu += this.parseCpuValue(container.resources.requests.cpu);
      }
    }
    
    return totalCpu ? `${totalCpu}m` : '';
  }

  private calculatePodCpuLimits(pod: k8s.V1Pod): string {
    let totalCpu = 0;
    
    for (const container of pod.spec?.containers || []) {
      if (container.resources?.limits?.cpu) {
        totalCpu += this.parseCpuValue(container.resources.limits.cpu);
      }
    }
    
    return totalCpu ? `${totalCpu}m` : '';
  }

  private calculatePodMemoryRequests(pod: k8s.V1Pod): string {
    let totalMemory = 0;
    
    for (const container of pod.spec?.containers || []) {
      if (container.resources?.requests?.memory) {
        totalMemory += this.parseMemoryValue(container.resources.requests.memory);
      }
    }
    
    return totalMemory ? `${this.formatMemoryValue(totalMemory)}` : '';
  }

  private calculatePodMemoryLimits(pod: k8s.V1Pod): string {
    let totalMemory = 0;
    
    for (const container of pod.spec?.containers || []) {
      if (container.resources?.limits?.memory) {
        totalMemory += this.parseMemoryValue(container.resources.limits.memory);
      }
    }
    
    return totalMemory ? `${this.formatMemoryValue(totalMemory)}` : '';
  }

  private parseCpuValue(cpu: string): number {
    if (cpu.endsWith('m')) {
      return parseInt(cpu.slice(0, -1), 10);
    } else if (cpu.endsWith('n')) {
      return parseInt(cpu.slice(0, -1), 10) / 1000000;
    } else {
      return parseFloat(cpu) * 1000; // Convert cores to millicores
    }
  }

  private parseMemoryValue(memory: string): number {
    const suffixes: Record<string, number> = {
      'Ki': 1024,
      'Mi': 1024 * 1024,
      'Gi': 1024 * 1024 * 1024,
      'Ti': 1024 * 1024 * 1024 * 1024,
      'Pi': 1024 * 1024 * 1024 * 1024 * 1024,
      'Ei': 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
      'K': 1000,
      'M': 1000 * 1000,
      'G': 1000 * 1000 * 1000,
      'T': 1000 * 1000 * 1000 * 1000,
      'P': 1000 * 1000 * 1000 * 1000 * 1000,
      'E': 1000 * 1000 * 1000 * 1000 * 1000 * 1000,
    };

    for (const [suffix, multiplier] of Object.entries(suffixes)) {
      if (memory.endsWith(suffix)) {
        return parseFloat(memory.slice(0, -suffix.length)) * multiplier;
      }
    }

    return parseInt(memory, 10);
  }

  private formatMemoryValue(bytes: number): string {
    const units = ['B', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)}${units[unitIndex]}`;
  }

  private parseCpuMetric(cpu: string): number {
    // CPU metrics can be in format like "125m" (millicores) or "0.125" (cores)
    if (cpu.endsWith('n')) {
      return parseInt(cpu.slice(0, -1), 10) / 1000000;
    } else if (cpu.endsWith('u')) {
      return parseInt(cpu.slice(0, -1), 10) / 1000;
    } else if (cpu.endsWith('m')) {
      return parseInt(cpu.slice(0, -1), 10);
    } else {
      return parseFloat(cpu) * 1000; // Convert cores to millicores
    }
  }

  private parseMemoryMetric(memory: string): number {
    // Memory metrics can be in various formats like "128974848", "123Mi", etc.
    return this.parseMemoryValue(memory);
  }
}

// Create singleton instance
export const kubernetesService = new KubernetesService();