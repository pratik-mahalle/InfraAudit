import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";

interface ConnectionLine {
  source: string;
  target: string;
  type: string;
}

interface ResourceNode {
  id: number;
  type: string;
  name: string;
  provider: string;
  region: string;
  status: string;
  x?: number;
  y?: number;
}

interface InfrastructureMapProps {
  resources?: ResourceNode[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function InfrastructureMap({ 
  resources = [], 
  isLoading = false,
  onRefresh 
}: InfrastructureMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [zoom, setZoom] = useState<number>(1);
  const [connections, setConnections] = useState<ConnectionLine[]>([]);

  const filteredResources = resources.filter(resource => 
    (selectedProvider === "all" || resource.provider === selectedProvider) &&
    (selectedRegion === "all" || resource.region === selectedRegion)
  );

  // Generate mock connections between resources
  useEffect(() => {
    if (filteredResources.length === 0) return;
    
    const newConnections: ConnectionLine[] = [];
    // Connect some nodes for visualization
    for (let i = 1; i < filteredResources.length; i++) {
      if (Math.random() > 0.3) { // 70% chance of connection
        newConnections.push({
          source: filteredResources[i-1].name,
          target: filteredResources[i].name,
          type: ["network", "data", "dependency"][Math.floor(Math.random() * 3)]
        });
      }
    }
    setConnections(newConnections);
  }, [filteredResources]);

  // Assign positions to nodes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || filteredResources.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Position nodes in a circular layout
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35 * zoom;
    
    // Assign positions to nodes
    filteredResources.forEach((node, i) => {
      const angle = (i / filteredResources.length) * Math.PI * 2;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });
    
    // Draw connections
    ctx.lineWidth = 1;
    connections.forEach(conn => {
      const source = filteredResources.find(r => r.name === conn.source);
      const target = filteredResources.find(r => r.name === conn.target);
      
      if (source && target && source.x && source.y && target.x && target.y) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        
        // Set line color based on connection type
        if (conn.type === 'network') {
          ctx.strokeStyle = '#3b82f6'; // blue
        } else if (conn.type === 'data') {
          ctx.strokeStyle = '#10b981'; // green
        } else {
          ctx.strokeStyle = '#8b5cf6'; // purple
        }
        
        ctx.stroke();
      }
    });
    
    // Draw nodes
    filteredResources.forEach((node) => {
      if (node.x && node.y) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        
        // Set fill color based on resource type
        if (node.type === 'EC2') {
          ctx.fillStyle = '#ef4444'; // red
        } else if (node.type === 'S3') {
          ctx.fillStyle = '#f97316'; // orange
        } else if (node.type === 'RDS') {
          ctx.fillStyle = '#06b6d4'; // cyan
        } else if (node.type === 'ApiGateway') {
          ctx.fillStyle = '#8b5cf6'; // purple
        } else {
          ctx.fillStyle = '#a1a1aa'; // gray
        }
        
        ctx.fill();
        
        // Draw node label
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name, node.x, node.y + 20);
      }
    });
    
  }, [filteredResources, connections, zoom]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const availableProviders = [...new Set(resources.map(r => r.provider))];
  const availableRegions = [...new Set(resources.map(r => r.region))];

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Real-Time Infrastructure Map</CardTitle>
          <CardDescription>
            Visual topology of your cloud resources and their relationships
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2 mr-4">
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {availableProviders.map(provider => (
                <SelectItem key={provider} value={provider}>{provider}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {availableRegions.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading infrastructure map...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="bg-red-100">
                <span className="block w-2 h-2 rounded-full bg-red-500 mr-1"></span> EC2
              </Badge>
              <Badge variant="outline" className="bg-orange-100">
                <span className="block w-2 h-2 rounded-full bg-orange-500 mr-1"></span> S3
              </Badge>
              <Badge variant="outline" className="bg-cyan-100">
                <span className="block w-2 h-2 rounded-full bg-cyan-500 mr-1"></span> RDS
              </Badge>
              <Badge variant="outline" className="bg-purple-100">
                <span className="block w-2 h-2 rounded-full bg-purple-500 mr-1"></span> API Gateway
              </Badge>
              <Badge variant="outline" className="bg-blue-100">
                <span className="block w-2 h-2 rounded-full bg-blue-500 mr-1"></span> Network
              </Badge>
              <Badge variant="outline" className="bg-green-100">
                <span className="block w-2 h-2 rounded-full bg-green-500 mr-1"></span> Data
              </Badge>
              <Badge variant="outline" className="bg-purple-100">
                <span className="block w-2 h-2 rounded-full bg-purple-500 mr-1"></span> Dependency
              </Badge>
            </div>
            <div className="rounded-md border bg-card h-96 relative overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="w-full h-full"
              ></canvas>
              {filteredResources.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground">No resources found for the selected filters</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}