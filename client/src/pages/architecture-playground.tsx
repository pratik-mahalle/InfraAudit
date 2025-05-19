import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  ConnectionLineType,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  NodeTypes,
} from 'react-flow-renderer';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CloudNodeComponent } from '@/components/playground/CloudNodeComponent';
import { NodeSelector } from '@/components/playground/NodeSelector';
import { SavedArchitectures } from '@/components/playground/SavedArchitectures';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  DownloadCloud,
  Save,
  FileText,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  ArrowRight,
  Layout,
  Play,
  AlertCircle,
  Info,
  CheckCircle,
} from 'lucide-react';

// Define custom node types
const nodeTypes: NodeTypes = {
  cloudNode: CloudNodeComponent,
};

export function ArchitecturePlaygroundPage() {
  const { user } = useAuth();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeName, setNodeName] = useState<string>('');
  const [architectureName, setArchitectureName] = useState<string>('Untitled Architecture');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodeName(node.data.label || '');
  }, []);

  // Update node name
  const updateNodeName = useCallback(() => {
    if (selectedNode && nodeName) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                label: nodeName,
              },
            };
          }
          return node;
        })
      );
    }
  }, [selectedNode, nodeName, setNodes]);

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      // Check if the connection is valid based on cloud architecture rules
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      
      if (!sourceNode || !targetNode) return;

      // Add custom connection validation logic here
      // For example, certain resources can only connect to specific other resources

      setEdges((eds) => addEdge({ 
        ...params, 
        type: ConnectionLineType.SmoothStep,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        labelStyle: { fill: '#3b82f6', fontWeight: 700 },
        markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
      }, eds));
    },
    [nodes, setEdges]
  );

  // Handle dropping a new node onto the canvas
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (reactFlowWrapper.current && reactFlowInstance) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const type = event.dataTransfer.getData('application/reactflow/type');
        const provider = event.dataTransfer.getData('application/reactflow/provider');
        const dropPosition = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode = {
          id: `${type}-${Date.now()}`,
          type: 'cloudNode',
          position: dropPosition,
          data: { 
            label: `${type}`, 
            type: type,
            provider: provider,
            icon: getNodeIcon(type, provider),
            properties: getDefaultProperties(type, provider),
          },
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [reactFlowInstance, setNodes]
  );

  // Get icon based on node type and provider
  const getNodeIcon = (type: string, provider: string) => {
    const iconMap: { [key: string]: { [key: string]: string } } = {
      'AWS': {
        'EC2': 'compute',
        'S3': 'storage',
        'RDS': 'database',
        'Lambda': 'serverless',
        'VPC': 'network',
        'ELB': 'loadbalancer',
      },
      'Azure': {
        'VM': 'compute',
        'Blob': 'storage',
        'SQL': 'database',
        'Functions': 'serverless',
        'VNet': 'network',
        'LB': 'loadbalancer',
      },
      'GCP': {
        'Compute': 'compute',
        'Storage': 'storage',
        'SQL': 'database',
        'Functions': 'serverless',
        'VPC': 'network',
        'LB': 'loadbalancer',
      },
      'Kubernetes': {
        'Pod': 'pod',
        'Service': 'service',
        'Deployment': 'deployment',
        'ConfigMap': 'configmap',
        'Secret': 'secret',
        'Ingress': 'ingress',
      }
    };

    return iconMap[provider]?.[type] || 'default';
  };

  // Get default properties for a node type
  const getDefaultProperties = (type: string, provider: string) => {
    const defaultProps: { [key: string]: { [key: string]: { [key: string]: string } } } = {
      'AWS': {
        'EC2': { 
          'instance_type': 't2.micro', 
          'ami': 'ami-0c55b159cbfafe1f0',
          'region': 'us-east-1'
        },
        'S3': { 
          'bucket_name': '', 
          'region': 'us-east-1',
          'access': 'private'
        },
        'RDS': { 
          'engine': 'postgres',
          'instance_class': 'db.t3.micro',
          'storage': '20'
        }
      },
      'Azure': {
        'VM': { 
          'size': 'Standard_B1s',
          'image': 'UbuntuLTS',
          'region': 'eastus'
        }
      },
      'GCP': {
        'Compute': { 
          'machine_type': 'e2-micro',
          'image': 'debian-cloud/debian-10',
          'zone': 'us-central1-a'
        }
      },
      'Kubernetes': {
        'Pod': {
          'image': 'nginx:latest',
          'replicas': '1'
        },
        'Deployment': {
          'image': 'nginx:latest',
          'replicas': '3'
        }
      }
    };

    return defaultProps[provider]?.[type] || {};
  };

  // Save the current architecture
  const saveArchitecture = async () => {
    if (!architectureName) {
      setError('Please provide a name for this architecture');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const response = await fetch('/api/architecture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: architectureName,
          nodes: nodes,
          edges: edges,
          userId: user?.id,
        }),
      });

      if (response.ok) {
        setSuccess('Architecture saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to save architecture');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      setError('An error occurred while saving');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Export architecture as JSON
  const exportArchitecture = () => {
    const dataStr = JSON.stringify({ nodes, edges, name: architectureName });
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${architectureName.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Clear the canvas
  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setNodeName('');
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="flex flex-col w-full h-screen p-4 bg-background">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold">Cloud Architecture Playground</h1>
          <Input
            value={architectureName}
            onChange={(e) => setArchitectureName(e.target.value)}
            className="ml-4 w-64"
            placeholder="Architecture Name"
          />
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={saveArchitecture}>
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save Architecture</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={exportArchitecture}>
                  <DownloadCloud className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Architecture</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={clearCanvas}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear Canvas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 p-4 border-r border-border overflow-y-auto">
          <Tabs defaultValue="components">
            <TabsList className="w-full">
              <TabsTrigger value="components" className="flex-1">Components</TabsTrigger>
              <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
            </TabsList>
            <TabsContent value="components" className="mt-4">
              <NodeSelector />
            </TabsContent>
            <TabsContent value="saved" className="mt-4">
              <SavedArchitectures 
                setNodes={setNodes} 
                setEdges={setEdges} 
                setArchitectureName={setArchitectureName}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 relative">
          <ReactFlowProvider>
            <div className="w-full h-full" ref={reactFlowWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
              >
                <Controls />
                <MiniMap />
                <Background />
              </ReactFlow>
            </div>
          </ReactFlowProvider>
        </div>

        {selectedNode && (
          <div className="w-80 border-l border-border p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Node Properties</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="node-name">Name</Label>
                <div className="flex items-center mt-1 space-x-2">
                  <Input
                    id="node-name"
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={updateNodeName}>
                    Update
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Type</Label>
                <p className="mt-1 text-sm">{selectedNode.data.type}</p>
              </div>
              
              <div>
                <Label>Provider</Label>
                <p className="mt-1 text-sm">{selectedNode.data.provider}</p>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <Label className="mb-2 block">Properties</Label>
                {Object.entries(selectedNode.data.properties || {}).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <Label htmlFor={`prop-${key}`} className="text-xs text-gray-500">
                      {key.replace(/_/g, ' ')}
                    </Label>
                    <Input
                      id={`prop-${key}`}
                      value={value as string}
                      onChange={(e) => {
                        const updatedProperties = {
                          ...selectedNode.data.properties,
                          [key]: e.target.value,
                        };
                        
                        setNodes((nds) =>
                          nds.map((node) => {
                            if (node.id === selectedNode.id) {
                              return {
                                ...node,
                                data: {
                                  ...node.data,
                                  properties: updatedProperties,
                                },
                              };
                            }
                            return node;
                          })
                        );
                      }}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
              
              <div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
                    setEdges((eds) => eds.filter(
                      (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
                    ));
                    setSelectedNode(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Node
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArchitecturePlaygroundPage;