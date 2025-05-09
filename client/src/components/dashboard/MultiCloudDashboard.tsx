import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// Define types for the resources and stats
interface CloudResource {
  id: number;
  name: string;
  type: string;
  provider: string;
  region: string;
  status: string;
  cost: number;
  tags: Record<string, string>;
}

interface ResourceStats {
  totalResources: number;
  totalCost: number;
  costByProvider: Record<string, number>;
  resourcesByType: Record<string, number>;
  resourcesByStatus: Record<string, number>;
  resourcesByRegion: Record<string, number>;
  costByRegion: Record<string, number>;
  costByTag: Record<string, Record<string, number>>;
}

interface MultiCloudDashboardProps {
  resources?: CloudResource[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function MultiCloudDashboard({ 
  resources = [], 
  isLoading = false,
  onRefresh
}: MultiCloudDashboardProps) {
  const [provider, setProvider] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");
  const [tag, setTag] = useState<string>("environment");

  // Filter resources based on selected provider and region
  const filteredResources = resources.filter(resource => {
    return (provider === "all" || resource.provider === provider) &&
           (region === "all" || resource.region === region);
  });

  // Calculate statistics for the filtered resources
  const stats: ResourceStats = filteredResources.reduce(
    (acc, resource) => {
      // Count total resources
      acc.totalResources++;
      
      // Sum total cost
      acc.totalCost += resource.cost;
      
      // Count by provider
      acc.costByProvider[resource.provider] = (acc.costByProvider[resource.provider] || 0) + resource.cost;
      
      // Count by type
      acc.resourcesByType[resource.type] = (acc.resourcesByType[resource.type] || 0) + 1;
      
      // Count by status
      acc.resourcesByStatus[resource.status] = (acc.resourcesByStatus[resource.status] || 0) + 1;
      
      // Count by region
      acc.resourcesByRegion[resource.region] = (acc.resourcesByRegion[resource.region] || 0) + 1;
      
      // Sum cost by region
      acc.costByRegion[resource.region] = (acc.costByRegion[resource.region] || 0) + resource.cost;
      
      // Sum cost by tag
      for (const [tagKey, tagValue] of Object.entries(resource.tags || {})) {
        if (!acc.costByTag[tagKey]) {
          acc.costByTag[tagKey] = {};
        }
        acc.costByTag[tagKey][tagValue] = (acc.costByTag[tagKey][tagValue] || 0) + resource.cost;
      }
      
      return acc;
    },
    {
      totalResources: 0,
      totalCost: 0,
      costByProvider: {},
      resourcesByType: {},
      resourcesByStatus: {},
      resourcesByRegion: {},
      costByRegion: {},
      costByTag: {},
    } as ResourceStats
  );

  // Prepare data for charts
  const providersChartData = Object.entries(stats.costByProvider).map(([name, value]) => ({ name, value }));
  const typeChartData = Object.entries(stats.resourcesByType).map(([name, value]) => ({ name, value }));
  const regionChartData = Object.entries(stats.costByRegion).map(([name, value]) => ({ name, value }));
  
  // Get the selected tag data for the pie chart
  const tagData = stats.costByTag[tag] 
    ? Object.entries(stats.costByTag[tag]).map(([name, value]) => ({ name, value }))
    : [];

  // Get available tags
  const availableTags = Object.keys(stats.costByTag);
  
  // Get unique providers and regions for filter dropdowns
  const availableProviders = [...new Set(resources.map(r => r.provider))];
  const availableRegions = [...new Set(resources.map(r => r.region))];

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Multi-Cloud Dashboard</CardTitle>
          <CardDescription>
            Unified view across AWS, GCP, and Azure resources
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {availableProviders.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {availableRegions.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="py-4 px-6">
                  <CardDescription>Total Resources</CardDescription>
                  <CardTitle className="text-3xl">{stats.totalResources}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="py-4 px-6">
                  <CardDescription>Monthly Cost</CardDescription>
                  <CardTitle className="text-3xl">{formatCurrency(stats.totalCost)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="py-4 px-6">
                  <CardDescription>Cloud Providers</CardDescription>
                  <CardTitle className="text-3xl">{Object.keys(stats.costByProvider).length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="py-4 px-6">
                  <CardDescription>Regions</CardDescription>
                  <CardTitle className="text-3xl">{Object.keys(stats.costByRegion).length}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Tabs defaultValue="cost">
              <TabsList className="mb-4">
                <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
                <TabsTrigger value="resources">Resource Distribution</TabsTrigger>
                <TabsTrigger value="tags">Tags & Categories</TabsTrigger>
              </TabsList>
              <TabsContent value="cost" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cost by Provider</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={providersChartData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `$${value}`} />
                          <Tooltip formatter={(value: number) => [`$${value}`, 'Cost']} />
                          <Bar dataKey="value" fill="#8884d8" name="Cost" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cost by Region</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={regionChartData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `$${value}`} />
                          <Tooltip formatter={(value: number) => [`$${value}`, 'Cost']} />
                          <Bar dataKey="value" fill="#82ca9d" name="Cost" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="resources" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resources by Type</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={typeChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            nameKey="name"
                            label={(entry) => `${entry.name}: ${entry.value}`}
                          >
                            {typeChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} resources`, 'Count']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resources by Status</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="grid grid-cols-2 gap-4 w-full">
                          {Object.entries(stats.resourcesByStatus).map(([status, count]) => (
                            <Card key={status} className="p-4">
                              <div className="flex flex-col items-center">
                                <Badge 
                                  variant="outline" 
                                  className={`mb-2 ${status === 'running' ? 'bg-green-100' : 
                                    status === 'stopped' ? 'bg-red-100' : 'bg-blue-100'}`}
                                >
                                  {status}
                                </Badge>
                                <span className="text-2xl font-bold">{count}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatPercentage(count / stats.totalResources)}
                                </span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="tags" className="space-y-4">
                <div className="flex justify-end mb-4">
                  <Select value={tag} onValueChange={setTag}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select Tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Cost Distribution by Tag: {tag}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {tagData.length > 0 ? (
                        <PieChart>
                          <Pie
                            data={tagData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            nameKey="name"
                            label={(entry) => `${entry.name}: $${entry.value}`}
                          >
                            {tagData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                          <Legend />
                        </PieChart>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No tag data available</p>
                        </div>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}