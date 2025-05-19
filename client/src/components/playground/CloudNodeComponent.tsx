import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'react-flow-renderer';
import { Card } from '@/components/ui/card';
import { Server, Database, HardDrive, Network, Globe } from 'lucide-react';

interface CloudNodeData {
  label: string;
  type: string;
  provider: string;
  icon?: string;
  properties?: Record<string, string>;
}

const getNodeIcon = (type: string, provider: string, iconType?: string) => {
  // Fallback icons based on general types
  if (iconType) {
    switch (iconType) {
      case 'compute': return <Server className="h-10 w-10 text-blue-500" />;
      case 'database': return <Database className="h-10 w-10 text-purple-500" />;
      case 'storage': return <HardDrive className="h-10 w-10 text-green-500" />;
      case 'network': return <Network className="h-10 w-10 text-orange-500" />;
      case 'loadbalancer': return <Globe className="h-10 w-10 text-cyan-500" />;
      case 'serverless': return <Server className="h-10 w-10 text-indigo-500" />;
      case 'pod': return <Server className="h-10 w-10 text-blue-400" />;
      case 'service': return <Network className="h-10 w-10 text-yellow-500" />;
      case 'deployment': return <Server className="h-10 w-10 text-blue-600" />;
      case 'configmap': return <HardDrive className="h-10 w-10 text-teal-500" />;
      case 'secret': return <Database className="h-10 w-10 text-red-500" />;
      case 'ingress': return <Globe className="h-10 w-10 text-pink-500" />;
      default: return <Server className="h-10 w-10 text-gray-500" />;
    }
  }

  // Default fallback
  return <Server className="h-10 w-10 text-gray-500" />;
};

// Function to get provider color
const getProviderColor = (provider: string) => {
  switch (provider) {
    case 'AWS': return 'ring-orange-500 bg-orange-50 dark:bg-orange-950/20';
    case 'Azure': return 'ring-blue-500 bg-blue-50 dark:bg-blue-950/20';
    case 'GCP': return 'ring-red-500 bg-red-50 dark:bg-red-950/20';
    case 'Kubernetes': return 'ring-blue-400 bg-blue-50 dark:bg-blue-950/20';
    default: return 'ring-gray-500 bg-gray-50 dark:bg-gray-800/20';
  }
};

export const CloudNodeComponent = memo<NodeProps<CloudNodeData>>(({ data, selected }) => {
  const providerColor = getProviderColor(data.provider);
  
  return (
    <div className="relative">
      <Card 
        className={`flex flex-col items-center justify-center w-36 h-24 p-2 ${
          selected ? 'ring-2 ring-primary' : 'ring-1'
        } ${providerColor}`}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-blue-500"
        />
        <div className="flex flex-col items-center">
          {getNodeIcon(data.type, data.provider, data.icon)}
          <div className="mt-1 text-xs font-medium text-center truncate w-full">
            {data.label}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {data.provider}
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-blue-500"
        />
      </Card>
    </div>
  );
});

CloudNodeComponent.displayName = 'CloudNodeComponent';

export default CloudNodeComponent;