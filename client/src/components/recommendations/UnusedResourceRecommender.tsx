import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HardDrive, 
  Server, 
  CircleOff, 
  Trash2, 
  Network, 
  Loader2, 
  Filter, 
  Recycle,
  Check,
  XCircle
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id: string;
  name: string;
  type: string;
  region: string;
  lastUsed: string;
  costPerMonth: number;
  provider: string;
  status: string;
  utilization: number;
}

interface UnusedResourceRecommenderProps {
  resources?: Resource[];
  isLoading?: boolean;
  onCleanup?: (resources: string[]) => void;
}

export function UnusedResourceRecommender({ 
  resources = [], 
  isLoading = false,
  onCleanup
}: UnusedResourceRecommenderProps) {
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const { toast } = useToast();

  const filteredResources = resources.filter(resource => 
    (filterType === "all" || resource.type === filterType) &&
    (filterProvider === "all" || resource.provider === filterProvider)
  );

  const handleSelectAll = () => {
    if (selectedResources.length === filteredResources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(filteredResources.map(r => r.id));
    }
  };

  const handleSelectResource = (id: string) => {
    setSelectedResources(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id) 
        : [...prev, id]
    );
  };

  const handleCleanup = () => {
    if (selectedResources.length === 0) {
      toast({
        title: "No resources selected",
        description: "Please select at least one resource to clean up.",
      });
      return;
    }

    onCleanup?.(selectedResources);
    
    // For demo purposes - normally would wait for API response
    toast({
      title: "Cleanup initiated",
      description: `${selectedResources.length} resources have been scheduled for cleanup.`,
    });
    
    setSelectedResources([]);
  };

  const totalSavings = selectedResources
    .map(id => resources.find(r => r.id === id)?.costPerMonth || 0)
    .reduce((sum, cost) => sum + cost, 0);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "EBS Volume":
        return <HardDrive className="h-5 w-5 text-blue-500" />;
      case "EC2 Instance":
        return <Server className="h-5 w-5 text-red-500" />;
      case "Load Balancer":
        return <Network className="h-5 w-5 text-green-500" />;
      case "RDS Instance":
        return <Database className="h-5 w-5 text-purple-500" />;
      case "Elastic IP":
        return <Globe className="h-5 w-5 text-cyan-500" />;
      default:
        return <CircleOff className="h-5 w-5 text-gray-500" />;
    }
  };

  // Display a different icon for Database and Globe since they were missing
  function Database(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M4 6v6a8 3 0 0 0 16 0V6" />
        <path d="M4 12v6a8 3 0 0 0 16 0v-6" />
      </svg>
    );
  }

  function Globe(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    );
  }

  const uniqueTypes = Array.from(new Set(resources.map(r => r.type)));
  const uniqueProviders = Array.from(new Set(resources.map(r => r.provider)));
  
  const getRecommendationMessage = (resource: Resource) => {
    switch (resource.type) {
      case "EBS Volume":
        return "Unattached EBS volume has not been used for over 30 days. Consider deleting or snapshotting and removing.";
      case "EC2 Instance":
        return `Low CPU utilization (${resource.utilization}%) for the past month. Consider resizing or terminating.`;
      case "Load Balancer":
        return "No requests to this load balancer for over 14 days. Consider removing if not needed.";
      case "RDS Instance":
        return `Low database connection rate (${resource.utilization}%) for the past month. Consider downsizing or removing.`;
      case "Elastic IP":
        return "Elastic IP not associated with any running instance. You are being charged for unused IPs.";
      default:
        return "Resource appears to be unused or significantly underutilized. Consider removing to reduce costs.";
    }
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Unused Resource Recommender</CardTitle>
          <CardDescription>
            Identify and clean up idle or underutilized resources to optimize costs
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Resource Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {uniqueProviders.map(provider => (
                <SelectItem key={provider} value={provider}>{provider}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Analyzing your cloud resources...</p>
          </div>
        ) : (
          <>
            {selectedResources.length > 0 && (
              <div className="bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 rounded-md p-4 mb-4 flex items-center justify-between">
                <div>
                  <span className="font-medium">{selectedResources.length} resources selected</span>
                  <p className="text-sm text-muted-foreground">
                    Potential monthly savings: {formatCurrency(totalSavings)}
                  </p>
                </div>
                <Button 
                  onClick={handleCleanup}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Recycle className="mr-2 h-4 w-4" />
                  Clean Up Selected
                </Button>
              </div>
            )}

            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Resources</TabsTrigger>
                <TabsTrigger value="storage">Storage</TabsTrigger>
                <TabsTrigger value="compute">Compute</TabsTrigger>
                <TabsTrigger value="networking">Networking</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox 
                            checked={selectedResources.length === filteredResources.length && filteredResources.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Recommendation</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead className="text-right">Monthly Cost</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResources.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No unused resources found for the selected filters
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredResources.map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedResources.includes(resource.id)}
                                onCheckedChange={() => handleSelectResource(resource.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start gap-2">
                                {getResourceIcon(resource.type)}
                                <div>
                                  <div className="font-medium">{resource.name}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span>{resource.type}</span>
                                    <span className="mx-1">•</span>
                                    <span>{resource.region}</span>
                                    <span className="mx-1">•</span>
                                    <Badge variant="outline" className="text-xs h-5">
                                      {resource.provider}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-md text-sm">
                                {getRecommendationMessage(resource)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatTimeAgo(resource.lastUsed)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(resource.costPerMonth)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => handleSelectResource(resource.id)}
                              >
                                {selectedResources.includes(resource.id) ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Deselect
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-1" />
                                    Select
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="storage">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox 
                            checked={
                              filteredResources
                                .filter(r => r.type === "EBS Volume")
                                .every(r => selectedResources.includes(r.id)) &&
                              filteredResources.some(r => r.type === "EBS Volume")
                            }
                            onCheckedChange={() => {
                              const storageResources = filteredResources
                                .filter(r => r.type === "EBS Volume")
                                .map(r => r.id);
                              
                              const allSelected = storageResources.every(id => 
                                selectedResources.includes(id)
                              );
                              
                              if (allSelected) {
                                setSelectedResources(prev => 
                                  prev.filter(id => !storageResources.includes(id))
                                );
                              } else {
                                setSelectedResources(prev => 
                                  Array.from(new Set([...prev, ...storageResources]))
                                );
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Recommendation</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead className="text-right">Monthly Cost</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResources.filter(r => r.type === "EBS Volume").length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No unused storage resources found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredResources
                          .filter(r => r.type === "EBS Volume")
                          .map((resource) => (
                            <TableRow key={resource.id}>
                              <TableCell>
                                <Checkbox 
                                  checked={selectedResources.includes(resource.id)}
                                  onCheckedChange={() => handleSelectResource(resource.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-start gap-2">
                                  {getResourceIcon(resource.type)}
                                  <div>
                                    <div className="font-medium">{resource.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <span>{resource.type}</span>
                                      <span className="mx-1">•</span>
                                      <span>{resource.region}</span>
                                      <span className="mx-1">•</span>
                                      <Badge variant="outline" className="text-xs h-5">
                                        {resource.provider}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-md text-sm">
                                  {getRecommendationMessage(resource)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatTimeAgo(resource.lastUsed)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(resource.costPerMonth)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => handleSelectResource(resource.id)}
                                >
                                  {selectedResources.includes(resource.id) ? (
                                    <>
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Deselect
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Select
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="compute">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox 
                            checked={
                              filteredResources
                                .filter(r => r.type === "EC2 Instance" || r.type === "RDS Instance")
                                .every(r => selectedResources.includes(r.id)) &&
                              filteredResources.some(r => r.type === "EC2 Instance" || r.type === "RDS Instance")
                            }
                            onCheckedChange={() => {
                              const computeResources = filteredResources
                                .filter(r => r.type === "EC2 Instance" || r.type === "RDS Instance")
                                .map(r => r.id);
                              
                              const allSelected = computeResources.every(id => 
                                selectedResources.includes(id)
                              );
                              
                              if (allSelected) {
                                setSelectedResources(prev => 
                                  prev.filter(id => !computeResources.includes(id))
                                );
                              } else {
                                setSelectedResources(prev => 
                                  Array.from(new Set([...prev, ...computeResources]))
                                );
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Recommendation</TableHead>
                        <TableHead>Utilization</TableHead>
                        <TableHead className="text-right">Monthly Cost</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResources.filter(r => r.type === "EC2 Instance" || r.type === "RDS Instance").length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No unused compute resources found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredResources
                          .filter(r => r.type === "EC2 Instance" || r.type === "RDS Instance")
                          .map((resource) => (
                            <TableRow key={resource.id}>
                              <TableCell>
                                <Checkbox 
                                  checked={selectedResources.includes(resource.id)}
                                  onCheckedChange={() => handleSelectResource(resource.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-start gap-2">
                                  {getResourceIcon(resource.type)}
                                  <div>
                                    <div className="font-medium">{resource.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <span>{resource.type}</span>
                                      <span className="mx-1">•</span>
                                      <span>{resource.region}</span>
                                      <span className="mx-1">•</span>
                                      <Badge variant="outline" className="text-xs h-5">
                                        {resource.provider}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-md text-sm">
                                  {getRecommendationMessage(resource)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                                    <div 
                                      className={`h-full rounded-full ${
                                        resource.utilization < 10 ? 'bg-red-500' : 
                                        resource.utilization < 30 ? 'bg-orange-500' : 'bg-yellow-500'
                                      }`}
                                      style={{ width: `${resource.utilization}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm">{resource.utilization}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(resource.costPerMonth)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => handleSelectResource(resource.id)}
                                >
                                  {selectedResources.includes(resource.id) ? (
                                    <>
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Deselect
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Select
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="networking">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox 
                            checked={
                              filteredResources
                                .filter(r => r.type === "Load Balancer" || r.type === "Elastic IP")
                                .every(r => selectedResources.includes(r.id)) &&
                              filteredResources.some(r => r.type === "Load Balancer" || r.type === "Elastic IP")
                            }
                            onCheckedChange={() => {
                              const networkResources = filteredResources
                                .filter(r => r.type === "Load Balancer" || r.type === "Elastic IP")
                                .map(r => r.id);
                              
                              const allSelected = networkResources.every(id => 
                                selectedResources.includes(id)
                              );
                              
                              if (allSelected) {
                                setSelectedResources(prev => 
                                  prev.filter(id => !networkResources.includes(id))
                                );
                              } else {
                                setSelectedResources(prev => 
                                  Array.from(new Set([...prev, ...networkResources]))
                                );
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Recommendation</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead className="text-right">Monthly Cost</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResources.filter(r => r.type === "Load Balancer" || r.type === "Elastic IP").length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No unused networking resources found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredResources
                          .filter(r => r.type === "Load Balancer" || r.type === "Elastic IP")
                          .map((resource) => (
                            <TableRow key={resource.id}>
                              <TableCell>
                                <Checkbox 
                                  checked={selectedResources.includes(resource.id)}
                                  onCheckedChange={() => handleSelectResource(resource.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-start gap-2">
                                  {getResourceIcon(resource.type)}
                                  <div>
                                    <div className="font-medium">{resource.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <span>{resource.type}</span>
                                      <span className="mx-1">•</span>
                                      <span>{resource.region}</span>
                                      <span className="mx-1">•</span>
                                      <Badge variant="outline" className="text-xs h-5">
                                        {resource.provider}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-md text-sm">
                                  {getRecommendationMessage(resource)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatTimeAgo(resource.lastUsed)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(resource.costPerMonth)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => handleSelectResource(resource.id)}
                                >
                                  {selectedResources.includes(resource.id) ? (
                                    <>
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Deselect
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Select
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}