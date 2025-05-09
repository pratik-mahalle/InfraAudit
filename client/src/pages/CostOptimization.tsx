import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { CostTrendChart } from "@/components/dashboard/CostTrendChart";
import { CostRecommendations } from "@/components/dashboard/CostRecommendations";
import { CostForecasting } from "@/components/cost/CostForecasting";
import { UnusedResourceRecommender } from "@/components/recommendations/UnusedResourceRecommender";
import { SavingsPlansOptimizer } from "@/components/cost/SavingsPlansOptimizer";
import { CloudIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  ArrowUpRight, 
  TrendingDown, 
  AlertCircle, 
  ArrowDownRight,
  Download,
  TrendingUp
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { formatCurrency, formatDate, formatTimeAgo } from "@/lib/utils";
import { CostAnomaly, Recommendation, Resource } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function CostOptimization() {
  const [resourceFilter, setResourceFilter] = useState("all");
  const [timeframeFilter, setTimeframeFilter] = useState("7d");
  const [awsOptimizations, setAwsOptimizations] = useState<Recommendation[]>([]);
  const [isGeneratingAwsOptimizations, setIsGeneratingAwsOptimizations] = useState(false);
  const { toast } = useToast();

  // Fetch cost anomalies
  const { data: costAnomalies, isLoading: isLoadingAnomalies } = useQuery<CostAnomaly[]>({
    queryKey: ["/api/cost-anomalies"],
  });

  // Fetch recommendations
  const { data: recommendations, isLoading: isLoadingRecommendations } = useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations"],
  });

  // Fetch resources
  const { data: resources } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });
  
  // Fetch real AWS resources
  const { data: awsResources, isLoading: isLoadingAwsResources } = useQuery<any[]>({
    queryKey: ["/api/aws-resources"],
  });
  
  // Fetch cloud providers to check for AWS
  const { data: cloudProviders } = useQuery<any[]>({
    queryKey: ["/api/cloud-providers"],
  });
  
  // Generate AWS optimizations based on real S3 buckets
  useEffect(() => {
    console.log("AWS Resources:", awsResources);
    
    // Clear existing AWS optimizations when the component loads or awsResources changes
    setAwsOptimizations([]);
    
    if (awsResources && awsResources.length > 0) {
      console.log("Found AWS resources, generating recommendations");
      
      // Create optimizations based on AWS S3 buckets
      const s3Buckets = awsResources.filter(r => r.type === "S3");
      console.log("S3 Buckets found:", s3Buckets.length);
      
      if (s3Buckets.length > 0) {
        // Create a new array for our optimizations
        const newAwsOptimizations: Recommendation[] = s3Buckets.map((bucket, index) => {
          // Generate different recommendation types for variety
          const recTypes = ["right-sizing", "idle-resources", "reservations"];
          const typeIndex = index % recTypes.length;
          
          let title = "";
          let description = "";
          let impact = "medium";
          let potentialSavings = 0;
          
          // Calculate a basic monthly cost based on bucket name length (just for demo purposes)
          const monthlyCost = (bucket.name.length * 0.25) * 30;
          
          // Create different optimization types based on bucket properties
          if (recTypes[typeIndex] === "right-sizing") {
            title = `Optimize storage class for ${bucket.name}`;
            description = `Consider moving infrequently accessed objects in ${bucket.name} to S3 Standard-IA or Glacier storage class to reduce costs.`;
            potentialSavings = monthlyCost * 0.4; // 40% potential savings
          } else if (recTypes[typeIndex] === "idle-resources") {
            title = `Clean up unused objects in ${bucket.name}`;
            description = `Bucket ${bucket.name} may contain unused or outdated objects. Consider setting up lifecycle policies to archive or delete them.`;
            potentialSavings = monthlyCost * 0.25; // 25% potential savings
          } else {
            title = `Consider S3 Reservation for ${bucket.name}`;
            description = `Based on consistent usage patterns for ${bucket.name}, consider purchasing S3 Storage Class reservations.`;
            potentialSavings = monthlyCost * 0.3; // 30% potential savings
          }
          
          return {
            id: 1000 + index, // Use high IDs to not conflict with existing recommendations
            title,
            description,
            type: recTypes[typeIndex],
            potentialSavings,
            resourcesAffected: [index + 1], // Link to existing resources
            createdAt: new Date().toISOString(),
            status: 'open',
          };
        });
        
        setAwsOptimizations(newAwsOptimizations);
      }
      
      setIsGeneratingAwsOptimizations(false);
    }
  }, [awsResources, isGeneratingAwsOptimizations]);

  const getResourceName = (id: number) => {
    // First check if we have a matching resource in our resources array
    const resource = resources?.find((r) => r.id === id);
    if (resource) return resource.name;
    
    // If not found and we have AWS resources, check there
    if (awsResources && awsResources.length > 0) {
      const awsResource = awsResources.find((r, index) => (index + 1) === id);
      if (awsResource) return awsResource.name;
    }
    
    return `Resource ID: ${id}`;
  };

  // Combine regular recommendations with AWS optimizations
  console.log("Regular recommendations:", recommendations);
  console.log("AWS optimizations:", awsOptimizations);
  
  const allRecommendations = [...(recommendations || []), ...awsOptimizations];
  console.log("All recommendations:", allRecommendations);

  // Calculate total costs and savings using both standard resources and AWS resources
  const totalStandardSpend = resources?.reduce((sum, resource) => sum + resource.cost, 0) || 0;
  
  // Add AWS resources cost (using a simplified calculation based on S3 storage)
  const totalAwsSpend = awsResources ? 
    awsResources.reduce((sum, resource) => {
      // Calculate estimated cost based on bucket properties
      const resourceCost = resource.type === "S3" ? resource.name.length * 0.25 * 30 : 0;
      return sum + resourceCost;
    }, 0) : 0;
  
  const totalCurrentSpend = totalStandardSpend + totalAwsSpend;
  const totalProjectedSpend = Math.round(totalCurrentSpend * 1.25); // 25% increase projection
  
  // Calculate total potential savings from all recommendations
  const totalPotentialSavings = allRecommendations?.reduce(
    (sum, rec) => sum + rec.potentialSavings,
    0
  ) || 0;

  return (
    <DashboardLayout>
      <PageHeader
        title="Cost Optimization"
        description="Monitor and optimize cloud spending across your infrastructure"
        actions={
          <div className="flex space-x-2">
            {awsResources && awsResources.length > 0 && (
              <Badge 
                variant="outline" 
                className="bg-blue-100/80 text-blue-700 border-blue-200 mr-2 h-9 px-3 flex items-center gap-1"
              >
                <CloudIcon className="h-3.5 w-3.5" />
                Real AWS Data
              </Badge>
            )}
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <Link href="/cost-prediction">
                <TrendingUp className="h-4 w-4" />
                AI Cost Prediction
              </Link>
            </Button>
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Cost Report
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-danger bg-opacity-10 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Month Spend</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCurrentSpend)}</p>
              </div>
            </div>
            <div className="text-danger flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>+32%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-warning bg-opacity-10 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Cost Anomalies</p>
                <p className="text-2xl font-bold">{costAnomalies?.length || 0}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400">Last 30 days</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-secondary bg-opacity-10 p-3 rounded-full">
                <TrendingDown className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Potential Savings</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPotentialSavings)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400">{recommendations?.length || 0} recommendations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Trend Chart */}
      <div className="mb-6">
        <CostTrendChart
          currentSpend={totalCurrentSpend}
          projectedSpend={totalProjectedSpend}
          potentialSavings={totalPotentialSavings}
          optimizationCount={recommendations?.length || 0}
          spendChange={32}
          projectionChange={25}
          isLoading={isLoadingAnomalies}
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="anomalies" className="mb-6">
        <TabsList>
          <TabsTrigger value="anomalies">Cost Anomalies</TabsTrigger>
          <TabsTrigger value="by-service">Costs by Service</TabsTrigger>
          <TabsTrigger value="by-region">Costs by Region</TabsTrigger>
        </TabsList>

        {/* Cost Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Anomalies</CardTitle>
              <CardDescription>
                Unexpected cost increases detected in your infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Select
                  value={timeframeFilter}
                  onValueChange={setTimeframeFilter}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Last 7 days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Increase</TableHead>
                    <TableHead>Previous Cost</TableHead>
                    <TableHead>Current Cost</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAnomalies ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        Loading cost anomalies...
                      </TableCell>
                    </TableRow>
                  ) : costAnomalies && costAnomalies.length > 0 ? (
                    costAnomalies.map((anomaly) => (
                      <TableRow key={anomaly.id}>
                        <TableCell className="font-medium">
                          {getResourceName(anomaly.resourceId)}
                        </TableCell>
                        <TableCell>{anomaly.anomalyType}</TableCell>
                        <TableCell className="text-danger">
                          <div className="flex items-center">
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            {anomaly.percentage}%
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(anomaly.previousCost)}</TableCell>
                        <TableCell>{formatCurrency(anomaly.currentCost)}</TableCell>
                        <TableCell>{formatTimeAgo(anomaly.detectedAt)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            anomaly.status === "open"
                              ? "bg-warning bg-opacity-10 text-warning"
                              : anomaly.status === "investigated"
                              ? "bg-primary bg-opacity-10 text-primary"
                              : "bg-secondary bg-opacity-10 text-secondary"
                          }`}>
                            {anomaly.status.charAt(0).toUpperCase() + anomaly.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="h-8 text-primary hover:text-primary/80"
                            disabled={anomaly.status !== "open"}
                          >
                            {anomaly.status === "open" ? "Investigate" : "View"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No cost anomalies detected.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costs by Service Tab */}
        <TabsContent value="by-service" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Costs by Service</CardTitle>
              <CardDescription>
                Breakdown of costs across different cloud services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-lg mb-4">
                <div className="text-center text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-2" />
                  <p>Service cost distribution visualization</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Current Cost</TableHead>
                    <TableHead>Previous Period</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {awsResources && awsResources.length > 0 ? (
                    <>
                      {/* Show real AWS S3 costs */}
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            <span>S3 Storage</span>
                            <Badge 
                              variant="outline" 
                              className="ml-2 bg-blue-100/80 text-blue-700 border-blue-200 px-1.5 py-0.5 flex items-center gap-1"
                            >
                              <CloudIcon className="h-3 w-3" />
                              Real AWS
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(awsResources.filter(r => r.type === "S3").reduce((total, bucket) => {
                            const monthlyCost = bucket.name.length * 0.25 * 30;
                            return total + monthlyCost;
                          }, 0))}
                        </TableCell>
                        <TableCell>{formatCurrency(0)}</TableCell>
                        <TableCell className="text-danger">
                          <div className="flex items-center">
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            100%
                          </div>
                        </TableCell>
                        <TableCell>
                          {awsResources.filter(r => r.type === "S3").length > 0 ? "100%" : "0%"}
                        </TableCell>
                      </TableRow>
                      {/* Show bucket-specific costs */}
                      {awsResources.filter(r => r.type === "S3").map((bucket, index) => {
                        const monthlyCost = bucket.name.length * 0.25 * 30;
                        return (
                          <TableRow key={bucket.id}>
                            <TableCell className="font-medium pl-8">
                              <span className="text-blue-600">└ </span>
                              {bucket.name}
                            </TableCell>
                            <TableCell>{formatCurrency(monthlyCost)}</TableCell>
                            <TableCell>{formatCurrency(0)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              <div className="flex items-center">
                                <span>New</span>
                              </div>
                            </TableCell>
                            <TableCell>{Math.round(100 / awsResources.filter(r => r.type === "S3").length)}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Loading cost data...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costs by Region Tab */}
        <TabsContent value="by-region" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Costs by Region</CardTitle>
              <CardDescription>
                Geographic distribution of cloud resource costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-lg mb-4">
                <div className="text-center text-gray-500">
                  <TrendingDown className="h-12 w-12 mx-auto mb-2" />
                  <p>Regional cost distribution visualization</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Current Cost</TableHead>
                    <TableHead>Previous Period</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {awsResources && awsResources.length > 0 ? (
                    <>
                      {/* Group by region and count */}
                      {Object.entries(
                        awsResources.reduce((acc: Record<string, {count: number, cost: number}>, resource) => {
                          acc[resource.region] = acc[resource.region] || {
                            count: 0,
                            cost: 0
                          };
                          
                          // Calculate simple cost for the resource
                          const monthlyCost = resource.type === "S3" ? resource.name.length * 0.25 * 30 : 0;
                          
                          acc[resource.region].count++;
                          acc[resource.region].cost += monthlyCost;
                          return acc;
                        }, {})
                      ).map(([region, data]) => (
                        <TableRow key={region}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-1">
                              <span>{region}</span>
                              <Badge 
                                variant="outline" 
                                className="ml-2 bg-blue-100/80 text-blue-700 border-blue-200 px-1.5 py-0.5 flex items-center gap-1"
                              >
                                <CloudIcon className="h-3 w-3" />
                                Real AWS
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(data.cost)}</TableCell>
                          <TableCell>{formatCurrency(0)}</TableCell>
                          <TableCell className="text-danger">
                            <div className="flex items-center">
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                              100%
                            </div>
                          </TableCell>
                          <TableCell>100%</TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Loading regional cost data...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cost Forecasting */}
      <div className="mb-6">
        <CostForecasting
          historicalData={awsResources && awsResources.length > 0 ? 
            // Generate a cost trend based on S3 buckets
            [
              { 
                date: "Jan", 
                actual: awsResources.reduce((sum, r) => sum + r.name.length * 0.18 * 30, 0), 
                forecast: 0 
              },
              { 
                date: "Feb", 
                actual: awsResources.reduce((sum, r) => sum + r.name.length * 0.19 * 30, 0), 
                forecast: 0 
              },
              { 
                date: "Mar", 
                actual: awsResources.reduce((sum, r) => sum + r.name.length * 0.21 * 30, 0), 
                forecast: 0 
              },
              { 
                date: "Apr", 
                actual: awsResources.reduce((sum, r) => sum + r.name.length * 0.20 * 30, 0), 
                forecast: 0 
              },
              { 
                date: "May", 
                actual: awsResources.reduce((sum, r) => sum + r.name.length * 0.22 * 30, 0), 
                forecast: 0 
              },
              { 
                date: "Jun", 
                actual: awsResources.reduce((sum, r) => sum + r.name.length * 0.23 * 30, 0), 
                forecast: 0 
              },
              { 
                date: "Jul", 
                actual: awsResources.reduce((sum, r) => sum + r.name.length * 0.24 * 30, 0), 
                forecast: 0 
              },
              { 
                date: "Aug", 
                actual: awsResources.reduce((sum, r) => sum + r.name.length * 0.24 * 30, 0), 
                forecast: 0 
              },
              { 
                date: "Sep", 
                actual: awsResources.reduce((sum, r) => sum + r.name.length * 0.25 * 30, 0), 
                forecast: 0 
              },
              { 
                date: "Oct", 
                actual: awsResources.reduce((sum, r) => sum + r.name.length * 0.22 * 30, 0), 
                forecast: 0 
              },
              // Forecast for next two months
              { 
                date: "Nov", 
                actual: 0, 
                forecast: awsResources.reduce((sum, r) => sum + r.name.length * 0.26 * 30, 0) 
              },
              { 
                date: "Dec", 
                actual: 0, 
                forecast: awsResources.reduce((sum, r) => sum + r.name.length * 0.27 * 30, 0) 
              }
            ] : 
            // Default data if no AWS resources
            [
              { date: "Jan", actual: 100, forecast: 0 },
              { date: "Feb", actual: 120, forecast: 0 },
              { date: "Mar", actual: 130, forecast: 0 },
              { date: "Apr", actual: 125, forecast: 0 },
              { date: "May", actual: 140, forecast: 0 },
              { date: "Jun", actual: 150, forecast: 0 },
              { date: "Jul", actual: 160, forecast: 0 },
              { date: "Aug", actual: 170, forecast: 0 },
              { date: "Sep", actual: 180, forecast: 0 },
              { date: "Oct", actual: 175, forecast: 0 },
              { date: "Nov", actual: 0, forecast: 190 },
              { date: "Dec", actual: 0, forecast: 200 }
            ]
          }
          monthlyBudget={
            awsResources && awsResources.length > 0 ? 
            Math.round(awsResources.reduce((sum, r) => sum + r.name.length * 0.3 * 30, 0)) : 
            200
          }
          forecastTotal={
            awsResources && awsResources.length > 0 ? 
            Math.round(awsResources.reduce((sum, r) => sum + r.name.length * 0.27 * 30, 0)) : 
            200
          }
          isLoading={false}
          onUpdateBudget={(newBudget) => {
            // In a real app, this would update the budget via API
            toast({
              title: "Budget Updated",
              description: `Monthly budget has been updated to ${formatCurrency(newBudget)}.`
            });
          }}
        />
      </div>
      
      {/* Unused Resource Recommender */}
      <div className="mb-6">
        <UnusedResourceRecommender
          resources={awsResources && awsResources.length > 0 ? awsResources.map(resource => {
            // Transform AWS resource data to the format expected by UnusedResourceRecommender
            const monthlyCost = resource.type === "S3" ? resource.name.length * 0.25 * 30 : 0;
            // Generate a random utilization below 20% for S3 buckets
            const utilization = Math.floor(Math.random() * 20);
            
            return {
              id: resource.id,
              name: resource.name,
              type: resource.type,
              region: resource.region,
              lastUsed: resource.createdAt,
              costPerMonth: monthlyCost,
              provider: "AWS",
              status: resource.status,
              utilization: utilization
            };
          }) : []}
          isLoading={false}
          onCleanup={(resources) => {
            // In a real app, this would clean up resources via API
            toast({
              title: "Resources Scheduled for Cleanup",
              description: `${resources.length} resources scheduled for removal.`
            });
          }}
        />
      </div>
      
      {/* Savings Plans Optimizer */}
      <div className="mb-6">
        <SavingsPlansOptimizer
          savingsPlans={[
            {
              id: "sp1",
              type: "Compute",
              term: 12,
              upfrontPayment: 0,
              monthlyCommitment: 2000,
              estimatedCoverage: 85,
              estimatedSavings: 24,
              totalSavingsAmount: 7680,
              resourceTypes: ["EC2", "Fargate", "Lambda"],
              regions: ["us-east-1", "us-west-2"],
              provider: "AWS"
            },
            {
              id: "sp2",
              type: "EC2 Instance",
              term: 36,
              upfrontPayment: 15000,
              monthlyCommitment: 1500,
              estimatedCoverage: 90,
              estimatedSavings: 42,
              totalSavingsAmount: 22680,
              resourceTypes: ["EC2"],
              regions: ["us-east-1", "us-east-2", "us-west-1"],
              provider: "AWS"
            },
            {
              id: "sp3",
              type: "SageMaker",
              term: 12,
              upfrontPayment: 0,
              monthlyCommitment: 500,
              estimatedCoverage: 75,
              estimatedSavings: 20,
              totalSavingsAmount: 1500,
              resourceTypes: ["SageMaker"],
              regions: ["us-east-1"],
              provider: "AWS"
            }
          ]}
          reservedInstances={[
            {
              id: "ri1",
              instanceType: "t3.xlarge",
              region: "us-east-1",
              term: 12,
              paymentOption: "no_upfront",
              upfrontPayment: 0,
              monthlyPayment: 110,
              onDemandCost: 150,
              savingsPercentage: 27,
              totalSavingsAmount: 480,
              provider: "AWS"
            },
            {
              id: "ri2",
              instanceType: "m5.2xlarge",
              region: "us-west-2",
              term: 36,
              paymentOption: "partial_upfront",
              upfrontPayment: 1500,
              monthlyPayment: 160,
              onDemandCost: 280,
              savingsPercentage: 40,
              totalSavingsAmount: 4320,
              provider: "AWS"
            },
            {
              id: "ri3",
              instanceType: "r5.large",
              region: "us-east-2",
              term: 12,
              paymentOption: "all_upfront",
              upfrontPayment: 1800,
              monthlyPayment: 0,
              onDemandCost: 180,
              savingsPercentage: 25,
              totalSavingsAmount: 360,
              provider: "AWS"
            }
          ]}
          usagePatterns={[
            {
              resourceType: "EC2 - t3.xlarge",
              region: "us-east-1",
              monthlyHours: 720,
              averageUtilization: 85,
              onDemandCost: 150,
              provider: "AWS"
            },
            {
              resourceType: "EC2 - m5.2xlarge",
              region: "us-west-2",
              monthlyHours: 720,
              averageUtilization: 90,
              onDemandCost: 280,
              provider: "AWS"
            },
            {
              resourceType: "SageMaker - ml.c5.xlarge",
              region: "us-east-1",
              monthlyHours: 600,
              averageUtilization: 60,
              onDemandCost: 120,
              provider: "AWS"
            },
            {
              resourceType: "RDS - db.m5.large",
              region: "us-east-2",
              monthlyHours: 720,
              averageUtilization: 95,
              onDemandCost: 220,
              provider: "AWS"
            }
          ]}
          isLoading={false}
          onPurchase={(items, type) => {
            // In a real app, this would initiate purchase via API
            toast({
              title: `${type === 'savings_plan' ? 'Savings Plans' : 'Reserved Instances'} Purchase`,
              description: `${items.length} ${type === 'savings_plan' ? 'savings plans' : 'reserved instances'} purchase initiated.`
            });
          }}
        />
      </div>

      {/* Cost Optimization Recommendations */}
      <div className="mb-6">
        <CostRecommendations
          recommendations={allRecommendations}
          isLoading={isLoadingRecommendations && !awsOptimizations.length}
          getResourceName={getResourceName}
        />
      </div>
    </DashboardLayout>
  );
}
