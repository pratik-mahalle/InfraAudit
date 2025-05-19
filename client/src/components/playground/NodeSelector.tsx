import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Database, 
  HardDrive, 
  Network, 
  Globe, 
  FunctionSquare,
  Lock 
} from 'lucide-react';

// Define the available cloud resources
const awsResources = [
  { type: 'EC2', icon: <Server className="h-5 w-5 text-blue-500" />, category: 'compute' },
  { type: 'S3', icon: <HardDrive className="h-5 w-5 text-green-500" />, category: 'storage' },
  { type: 'RDS', icon: <Database className="h-5 w-5 text-purple-500" />, category: 'database' },
  { type: 'VPC', icon: <Network className="h-5 w-5 text-orange-500" />, category: 'network' },
  { type: 'Lambda', icon: <FunctionSquare className="h-5 w-5 text-indigo-500" />, category: 'serverless' },
  { type: 'ELB', icon: <Globe className="h-5 w-5 text-cyan-500" />, category: 'loadbalancer' },
];

const azureResources = [
  { type: 'VM', icon: <Server className="h-5 w-5 text-blue-500" />, category: 'compute' },
  { type: 'Blob', icon: <HardDrive className="h-5 w-5 text-green-500" />, category: 'storage' },
  { type: 'SQL', icon: <Database className="h-5 w-5 text-purple-500" />, category: 'database' },
  { type: 'VNet', icon: <Network className="h-5 w-5 text-orange-500" />, category: 'network' },
  { type: 'Functions', icon: <Function className="h-5 w-5 text-indigo-500" />, category: 'serverless' },
  { type: 'LB', icon: <Globe className="h-5 w-5 text-cyan-500" />, category: 'loadbalancer' },
];

const gcpResources = [
  { type: 'Compute', icon: <Server className="h-5 w-5 text-blue-500" />, category: 'compute' },
  { type: 'Storage', icon: <HardDrive className="h-5 w-5 text-green-500" />, category: 'storage' },
  { type: 'SQL', icon: <Database className="h-5 w-5 text-purple-500" />, category: 'database' },
  { type: 'VPC', icon: <Network className="h-5 w-5 text-orange-500" />, category: 'network' },
  { type: 'Functions', icon: <Function className="h-5 w-5 text-indigo-500" />, category: 'serverless' },
  { type: 'LB', icon: <Globe className="h-5 w-5 text-cyan-500" />, category: 'loadbalancer' },
];

const k8sResources = [
  { type: 'Pod', icon: <Server className="h-5 w-5 text-blue-400" />, category: 'pod' },
  { type: 'Service', icon: <Network className="h-5 w-5 text-yellow-500" />, category: 'service' },
  { type: 'Deployment', icon: <Server className="h-5 w-5 text-blue-600" />, category: 'deployment' },
  { type: 'ConfigMap', icon: <HardDrive className="h-5 w-5 text-teal-500" />, category: 'configmap' },
  { type: 'Secret', icon: <Lock className="h-5 w-5 text-red-500" />, category: 'secret' },
  { type: 'Ingress', icon: <Globe className="h-5 w-5 text-pink-500" />, category: 'ingress' },
];

export function NodeSelector() {
  const [searchTerm, setSearchTerm] = useState('');

  const onDragStart = (event: React.DragEvent, nodeType: string, provider: string) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/provider', provider);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Filter resources based on search term
  const filterResources = (resources: any[], provider: string) => {
    if (!searchTerm) return resources;
    return resources.filter(
      (resource) =>
        resource.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="w-full">
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="aws">
        <TabsList className="w-full">
          <TabsTrigger value="aws" className="flex-1">AWS</TabsTrigger>
          <TabsTrigger value="azure" className="flex-1">Azure</TabsTrigger>
          <TabsTrigger value="gcp" className="flex-1">GCP</TabsTrigger>
          <TabsTrigger value="k8s" className="flex-1">K8s</TabsTrigger>
        </TabsList>
        
        <TabsContent value="aws" className="mt-4 space-y-2">
          <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">
            AWS Resources
          </div>
          {filterResources(awsResources, 'AWS').map((resource) => (
            <Card
              key={resource.type}
              className="p-2 cursor-move flex items-center justify-between hover:bg-muted transition-colors"
              draggable
              onDragStart={(event) => onDragStart(event, resource.type, 'AWS')}
            >
              <div className="flex items-center gap-2">
                {resource.icon}
                <span className="text-sm">{resource.type}</span>
              </div>
              <Badge variant="outline" className="text-xs px-1.5 py-0">{resource.category}</Badge>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="azure" className="mt-4 space-y-2">
          <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">
            Azure Resources
          </div>
          {filterResources(azureResources, 'Azure').map((resource) => (
            <Card
              key={resource.type}
              className="p-2 cursor-move flex items-center justify-between hover:bg-muted transition-colors"
              draggable
              onDragStart={(event) => onDragStart(event, resource.type, 'Azure')}
            >
              <div className="flex items-center gap-2">
                {resource.icon}
                <span className="text-sm">{resource.type}</span>
              </div>
              <Badge variant="outline" className="text-xs px-1.5 py-0">{resource.category}</Badge>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="gcp" className="mt-4 space-y-2">
          <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">
            GCP Resources
          </div>
          {filterResources(gcpResources, 'GCP').map((resource) => (
            <Card
              key={resource.type}
              className="p-2 cursor-move flex items-center justify-between hover:bg-muted transition-colors"
              draggable
              onDragStart={(event) => onDragStart(event, resource.type, 'GCP')}
            >
              <div className="flex items-center gap-2">
                {resource.icon}
                <span className="text-sm">{resource.type}</span>
              </div>
              <Badge variant="outline" className="text-xs px-1.5 py-0">{resource.category}</Badge>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="k8s" className="mt-4 space-y-2">
          <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">
            Kubernetes Resources
          </div>
          {filterResources(k8sResources, 'Kubernetes').map((resource) => (
            <Card
              key={resource.type}
              className="p-2 cursor-move flex items-center justify-between hover:bg-muted transition-colors"
              draggable
              onDragStart={(event) => onDragStart(event, resource.type, 'Kubernetes')}
            >
              <div className="flex items-center gap-2">
                {resource.icon}
                <span className="text-sm">{resource.type}</span>
              </div>
              <Badge variant="outline" className="text-xs px-1.5 py-0">{resource.category}</Badge>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      
      <Separator className="my-4" />
      
      <div className="text-xs text-center text-muted-foreground">
        Drag and drop resources onto the canvas
      </div>
    </div>
  );
}

export default NodeSelector;