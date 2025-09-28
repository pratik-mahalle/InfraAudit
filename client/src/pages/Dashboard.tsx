import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { CostTrendChart } from "@/components/dashboard/CostTrendChart";
import { SecurityDriftsTable } from "@/components/dashboard/SecurityDriftsTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { SlackNotifications } from "@/components/dashboard/SlackNotifications";
import { ResourceUtilization } from "@/components/dashboard/ResourceUtilization";
import { CostRecommendations } from "@/components/dashboard/CostRecommendations";
import { PersonalizedWidgets } from "@/components/dashboard/PersonalizedWidgets";
import { CloudProviderIntegration } from "@/components/dashboard/CloudProviderIntegration";
import { WelcomeOnboarding } from "@/components/dashboard/WelcomeOnboarding";
import { InteractiveCostAnalysis } from "@/components/dashboard/InteractiveCostAnalysis";
import TrialBanner from "@/components/trial/TrialBanner";
import { 
  CornerLeftDown, 
  Play, 
  LayoutDashboard, 
  Settings, 
  Sparkles, 
  Layers, 
  PlusSquare, 
  ChevronRight, 
  RefreshCw,
  CloudIcon,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { SecurityDrift, Alert, Recommendation, UtilizationMetric } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const [dashboardTab, setDashboardTab] = useState("overview");
  const [hasConnectedProviders, setHasConnectedProviders] = useState(false);
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false); // Changed to false to skip first-time setup by default
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const { toast } = useToast();
  
  // Mutation for running a new scan
  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/scan/trigger");
      return await res.json();
    },
    onMutate: () => {
      setIsScanning(true);
      toast({
        title: "Starting New Scan",
        description: "Scanning your cloud infrastructure...",
      });
    },
    onSuccess: (data) => {
      setLastScanResult(data);
      toast({
        title: "Scan Completed",
        description: `Successfully scanned ${data.resourcesScanned} resources in ${data.scanDuration}`,
        variant: "default",
      });
      
      // Refresh relevant data
      queryClient.invalidateQueries({ queryKey: ["/api/security-drifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cloud-resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/aws-resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
    },
    onError: (error) => {
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to complete infrastructure scan",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsScanning(false);
    }
  });
  
  // Handle running a new scan
  const handleRunScan = () => {
    scanMutation.mutate();
  };
  
  // Handle dashboard action selections
  const handleDashboardAction = (action: string) => {
    switch (action) {
      case "refresh":
        toast({
          title: "Refreshing Dashboard",
          description: "Fetching the latest data for all widgets...",
        });
        queryClient.invalidateQueries();
        break;
      
      case "export":
        toast({
          title: "Exporting Dashboard",
          description: "Preparing dashboard export as PDF...",
        });
        // In a real implementation, this would trigger a PDF export
        setTimeout(() => {
          toast({
            title: "Dashboard Exported",
            description: "The export is ready for download",
            variant: "default",
          });
        }, 1500);
        break;
      
      case "addWidget":
        toast({
          title: "Add Widget",
          description: "Widget customization feature will be available soon",
        });
        break;
      
      case "configureProviders":
        // Navigate to cloud providers page
        window.location.href = "/cloud-providers";
        break;
      
      case "scheduleScan":
        toast({
          title: "Schedule Scan",
          description: "Scan scheduling feature will be available soon",
        });
        break;
      
      case "resetDashboard":
        toast({
          title: "Reset Dashboard",
          description: "Dashboard has been reset to default layout",
          variant: "default",
        });
        // In a real implementation, this would reset the dashboard layout
        break;
    }
  };
  
  // Check for cloud providers
  const { data: cloudProviders, isLoading: isLoadingProviders } = useQuery<any[]>({
    queryKey: ["/api/cloud-providers"],
  });
  
  // Fetch real AWS resources
  const { data: awsResources, isLoading: isLoadingAwsResources } = useQuery<any[]>({
    queryKey: ["/api/aws-resources"],
    enabled: !!cloudProviders && cloudProviders.some(p => p.id === "AWS"),
  });
  
  // Effect to check for connected providers on load
  useEffect(() => {
    if (cloudProviders && cloudProviders.length > 0) {
      setHasConnectedProviders(true);
      setShowFirstTimeSetup(false);
      
      // Log real AWS resources for debugging
      if (awsResources && awsResources.length > 0) {
        console.log("Real AWS resources:", awsResources);
      }
    }
  }, [cloudProviders, awsResources]);
  
  // Handle connecting first provider
  const handleConnectProvider = () => {
    setDashboardTab("providers");
    setShowFirstTimeSetup(false);
  };

  // Fetch security drifts
  const { data: securityDrifts, isLoading: isLoadingDrifts } = useQuery<SecurityDrift[]>({
    queryKey: ["/api/security-drifts"],
  });

  // Fetch alerts
  const { data: alerts, isLoading: isLoadingAlerts } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  // Fetch recommendations
  const { data: recommendations, isLoading: isLoadingRecommendations } = useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations"],
  });
  
  // Get real cloud resources from all providers (especially AWS)
  const { data: cloudResources, isLoading: isLoadingCloudResources } = useQuery<any[]>({
    queryKey: ["/api/cloud-resources"],
    enabled: !!cloudProviders && cloudProviders.some(p => p.isConnected),
  });

  // Latest scan status
  const { data: lastScanStatus, isLoading: isLoadingLastScan } = useQuery({
    queryKey: ["/api/scan/status"],
    queryFn: async () => {
      const res = await fetch("/api/scan/status");
      if (!res.ok) throw new Error("Failed to fetch last scan status");
      return res.json();
    },
    refetchInterval: isScanning ? 5000 : false, // Poll every 5 seconds while scanning
  });
  
  // Format the last scan time
  const lastScanTime = lastScanStatus?.timestamp ? new Date(lastScanStatus.timestamp) : new Date();

  // Resource utilization metrics
  const utilizationMetrics: UtilizationMetric[] = [
    {
      name: "CPU Utilization",
      value: 38,
      status: "healthy",
      trend: "down",
      change: 12,
    },
    {
      name: "Memory Usage",
      value: 72,
      status: "warning",
      trend: "up",
      change: 18,
    },
    {
      name: "Storage Usage",
      value: 54,
      status: "healthy",
      trend: "down",
      change: 3,
    },
    {
      name: "Network I/O",
      value: 89,
      status: "critical",
      trend: "up",
      change: 43,
    },
  ];

  // If first-time setup, show welcome onboarding screen
  if (showFirstTimeSetup) {
    return (
      <DashboardLayout>
        <WelcomeOnboarding onCloudIntegrationClick={handleConnectProvider} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Trial Status Banner */}
      <TrialBanner />
      
      {/* Modern Hero Header with Tabs (with animated orbits) */}
      <div className="mb-8 rounded-2xl p-6 md:p-8 border shadow-sm bg-white/70 dark:bg-slate-900/50 border-gray-200/60 dark:border-slate-800/60 backdrop-blur relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-40 [mask-image:radial-gradient(50%_50%_at_50%_0%,black,transparent)]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.15),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.25),transparent_60%)]" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl bg-primary/10" />
          {/* animated orbits */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hero-orbit" style={{ ['--orbit-radius' as any]: '180px' }}>
            <div className="hero-dot" style={{ ['--speed' as any]: '34s' }} />
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hero-orbit" style={{ ['--orbit-radius' as any]: '140px' }}>
            <div className="hero-dot hero-dot--emerald" style={{ ['--speed' as any]: '26s' }} />
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hero-orbit" style={{ ['--orbit-radius' as any]: '100px' }}>
            <div className="hero-dot hero-dot--violet" style={{ ['--speed' as any]: '20s' }} />
          </div>
          {/* floating particles */}
          <div className="particle" style={{ left: '40%', bottom: '120px', ['--dur' as any]: '8s', ['--delay' as any]: '0.2s' }} />
          <div className="particle particle--violet" style={{ left: '55%', bottom: '150px', ['--dur' as any]: '7s', ['--delay' as any]: '1.2s' }} />
          <div className="particle particle--emerald" style={{ left: '48%', bottom: '180px', ['--dur' as any]: '6.5s', ['--delay' as any]: '0.8s' }} />
          <div className="particle" style={{ left: '60%', bottom: '110px', ['--dur' as any]: '9s', ['--delay' as any]: '0.6s' }} />
          <div className="hero-bowl" />
        </div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">Cloud Infrastructure Dashboard</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Last scan completed on <span className="font-medium">{formatDate(lastScanTime)}</span>
            </p>
          </div>
          <div className="flex space-x-3 mt-4 lg:mt-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Dashboard Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Dashboard Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => handleDashboardAction("refresh")}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh All Data
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => handleDashboardAction("export")}>
                  <CornerLeftDown className="h-4 w-4 mr-2" />
                  Export Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => handleDashboardAction("addWidget")}>
                  <PlusSquare className="h-4 w-4 mr-2" />
                  Add New Widget
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => handleDashboardAction("configureProviders")}>
                  <CloudIcon className="h-4 w-4 mr-2" />
                  Configure Cloud Providers
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={handleRunScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run New Scan
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="mt-4">
          <TabsList className="bg-white/60 dark:bg-slate-900/50 border border-gray-200/60 dark:border-slate-800/60 p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="rounded-lg data-[state=active]:bg-blue-600/10 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-500/10 dark:data-[state=active]:text-blue-300"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="providers" 
              className="rounded-lg data-[state=active]:bg-emerald-600/10 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-500/10 dark:data-[state=active]:text-emerald-300"
            >
              <CloudIcon className="h-4 w-4 mr-2" />
              Cloud Providers
            </TabsTrigger>
            <TabsTrigger 
              value="widgets" 
              className="rounded-lg data-[state=active]:bg-purple-600/10 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-500/10 dark:data-[state=active]:text-purple-300"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Custom Widgets
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Overview Tab */}
      {dashboardTab === "overview" && (
        <div id="dashboard-overview-section">
          {/* New interactive cost analysis component */}
          <InteractiveCostAnalysis hasCloudCredentials={hasConnectedProviders} />
          
          {/* Status Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <StatusCard
              title="Security Status"
              value="Warning"
              description={`${securityDrifts?.length || 0} security drifts detected`}
              icon="security"
              status="warning"
            />
            <StatusCard
              title="Cost Status"
              value={hasConnectedProviders ? "Active" : "Pending"}
              description={hasConnectedProviders ? "Cloud cost data available" : "Connect cloud provider"}
              icon="cost"
              status={hasConnectedProviders ? "healthy" : "warning"}
            />
            <StatusCard
              title="Resources Monitored"
              value={`${cloudResources?.length || 0}`}
              description={(cloudResources && cloudResources.length > 0) ? "Cloud resources" : "No resources detected"}
              icon="resources"
              isLoading={isLoadingCloudResources}
            />
            <StatusCard
              title="Active Alerts"
              value={`${alerts?.length || 0}`}
              description="Active notifications"
              icon="alerts"
              status={alerts && alerts.length > 0 ? "warning" : "healthy"}
              isLoading={isLoadingAlerts}
            />
          </div>

          {/* Featured Insights Card */}
          <Card className="mb-8 bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-indigo-100/60 dark:border-slate-800/60">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium text-indigo-900 dark:text-indigo-300">Featured Insights</CardTitle>
                <Badge variant="outline" className="bg-indigo-100/70 text-indigo-800 border-indigo-200 font-normal dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700/50">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Generated
                </Badge>
              </div>
              <CardDescription className="text-indigo-700/80 dark:text-indigo-400/80">
                Personalized insights based on your infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 shadow-sm bg-white/80 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30">
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-800/40 p-2 rounded-md">
                      <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm mb-1 text-indigo-900 dark:text-indigo-300">S3 Bucket Insights</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {cloudResources && cloudResources.length > 0 
                          ? `${cloudResources.length} S3 buckets detected in your AWS account`
                          : 'No S3 buckets detected yet'
                        }
                      </p>
                      <Button variant="link" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400 px-0 mt-1">
                        View buckets
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4 shadow-sm bg-white/80 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm mb-1 text-indigo-900 dark:text-indigo-300">Security Check</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {cloudResources && cloudResources.length > 0 
                          ? 'Checking S3 bucket permissions for public access risks'
                          : 'No resources to check for security issues'
                        }
                      </p>
                      <Button variant="link" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400 px-0 mt-1">
                        View security status
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg border p-4 shadow-sm bg-white/80 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-md">
                      <RefreshCw className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm mb-1 text-indigo-900 dark:text-indigo-300">Cost Optimization</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {cloudResources && cloudResources.length > 0
                          ? 'Analyzing S3 bucket usage patterns for potential savings'
                          : 'Connect more services to see cost optimization tips'
                        }
                      </p>
                      <Button variant="link" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400 px-0 mt-1">
                        View cost details
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Dashboard Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cost Optimization Chart */}
              <CostTrendChart
                currentSpend={cloudResources ? cloudResources.length * 0.023 * 730 * 100 : 0}
                projectedSpend={cloudResources ? cloudResources.length * 0.023 * 730 * 100 * 1.1 : 0}
                potentialSavings={cloudResources ? cloudResources.length * 0.023 * 730 * 100 * 0.3 : 0}
                optimizationCount={cloudResources ? cloudResources.length : 0}
                spendChange={5}
                projectionChange={10}
                isLoading={isLoadingCloudResources}
              />

              {/* Security Configuration Drifts - AWS Resources */}
              {cloudResources && cloudResources.length > 0 ? (
                <Card id="security-monitoring-section">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold">AWS S3 Security Configuration</CardTitle>
                      <Badge 
                        variant="outline" 
                        className="bg-green-100/80 text-green-700 font-normal"
                      >
                        Real-time data
                      </Badge>
                    </div>
                    <CardDescription>Security configuration status of your S3 buckets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-lg border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Bucket Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Region
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {cloudResources.map((resource, index) => (
                            <tr key={resource.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{resource.region}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Secure
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <Button size="sm" variant="outline">Scan</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <SecurityDriftsTable 
                  drifts={securityDrifts || []} 
                  isLoading={isLoadingDrifts || isLoadingCloudResources} 
                />
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <QuickActions />

              {/* Recent Alerts */}
              <div id="alerts-section">
                <RecentAlerts
                  alerts={alerts || []} 
                  isLoading={isLoadingAlerts} 
                />
              </div>

              {/* Slack Integration Preview */}
              <SlackNotifications 
                isConnected={true} 
                alertsSentToday={12} 
              />
            </div>
          </div>

          {/* Resource Utilization Section */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <ResourceUtilization 
              metrics={utilizationMetrics} 
              isLoading={isLoadingAwsResources}
              awsResources={awsResources || []}
            />
          </div>

          {/* Cost Optimization Recommendations */}
          <div className="grid grid-cols-1 gap-6">
            {cloudResources && cloudResources.length > 0 ? (
              <Card id="cost-optimization-section">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold">AWS Cost Optimization</CardTitle>
                    <Badge 
                      variant="outline" 
                      className="bg-green-100/80 text-green-700 font-normal"
                    >
                      Real-time data
                    </Badge>
                  </div>
                  <CardDescription>Recommendations to optimize your AWS resources</CardDescription>
                </CardHeader>
                <CardContent>
                  {cloudResources.map((resource, index) => (
                    <div key={resource.id} className="mb-4 border border-gray-100 rounded-lg p-4 last:mb-0 bg-slate-50">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full">
                          <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <h3 className="text-sm font-medium">Optimize {resource.name}</h3>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                              Saving potential
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            {resource.type} in {resource.region} - Check lifecycle rules and access patterns
                          </p>
                          <div className="flex justify-between items-center">
                            <Button size="sm" variant="ghost" className="text-xs">
                              View details
                            </Button>
                            <span className="text-xs text-green-600 font-medium">
                              Potential savings: ${(0.023 * 730 * 0.3).toFixed(2)}/month
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <CostRecommendations 
                recommendations={recommendations || []} 
                isLoading={isLoadingRecommendations || isLoadingCloudResources} 
              />
            )}
          </div>
        </div>
      )}

      {/* Cloud Providers Tab */}
      {dashboardTab === "providers" && (
        <CloudProviderIntegration />
      )}

      {/* Custom Widgets Tab */}
      {dashboardTab === "widgets" && (
        <PersonalizedWidgets />
      )}
    </DashboardLayout>
  );
}