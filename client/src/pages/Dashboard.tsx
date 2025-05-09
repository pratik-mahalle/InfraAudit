import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { formatDate } from "@/lib/utils";
import { SecurityDrift, Alert, Recommendation, UtilizationMetric } from "@/types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [dashboardTab, setDashboardTab] = useState("overview");
  const [hasConnectedProviders, setHasConnectedProviders] = useState(false);
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(true);
  
  // Check for cloud providers
  const { data: cloudProviders, isLoading: isLoadingProviders } = useQuery<any[]>({
    queryKey: ["/api/cloud-providers"],
  });
  
  // Effect to check for connected providers on load
  useEffect(() => {
    if (cloudProviders && cloudProviders.length > 0) {
      setHasConnectedProviders(true);
      setShowFirstTimeSetup(false);
    }
  }, [cloudProviders]);
  
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

  // Last scan time
  const lastScanTime = new Date();

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

  return (
    <DashboardLayout>
      {/* Enhanced Header with Tabs */}
      <div className="mb-6 bg-gradient-to-r from-slate-50 to-blue-50/80 dark:from-slate-900/70 dark:to-blue-950/30 p-6 rounded-xl border border-blue-100/50 dark:border-blue-900/20 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Cloud Infrastructure Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
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
                <DropdownMenuItem className="cursor-pointer">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh All Data
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <CornerLeftDown className="h-4 w-4 mr-2" />
                  Export Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <PlusSquare className="h-4 w-4 mr-2" />
                  Add New Widget
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <CloudIcon className="h-4 w-4 mr-2" />
                  Configure Cloud Providers
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Play className="h-4 w-4" />
              Run New Scan
            </Button>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="mt-4">
          <TabsList className="bg-white/80 dark:bg-slate-900/50 border border-blue-100/50 dark:border-blue-800/30 p-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-blue-100/80 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-300"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="providers" 
              className="data-[state=active]:bg-green-100/80 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900/30 dark:data-[state=active]:text-green-300"
            >
              <CloudIcon className="h-4 w-4 mr-2" />
              Cloud Providers
            </TabsTrigger>
            <TabsTrigger 
              value="widgets" 
              className="data-[state=active]:bg-purple-100/80 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/30 dark:data-[state=active]:text-purple-300"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Custom Widgets
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Dashboard Content */}
      {showFirstTimeSetup ? (
        <WelcomeOnboarding onCloudIntegrationClick={handleConnectProvider} />
      ) : (
        <>
          <div className={dashboardTab === "overview" ? "block" : "hidden"}>
            {/* Status Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatusCard
            title="Security Status"
            value="Warning"
            description="3 security drifts detected"
            icon="security"
            status="warning"
          />
          <StatusCard
            title="Cost Status"
            value="Critical"
            description="Cost spike of 43% detected"
            icon="cost"
            status="critical"
          />
          <StatusCard
            title="Resources Monitored"
            value="268"
            description="Across 3 cloud providers"
            icon="resources"
          />
          <StatusCard
            title="Active Alerts"
            value="12"
            description="4 high, 8 medium priority"
            icon="alerts"
            status="warning"
          />
        </div>

        {/* Featured Insights Card */}
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-indigo-100 dark:border-indigo-900/20 mb-8">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-indigo-900 dark:text-indigo-300">Featured Insights</CardTitle>
              <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200 font-normal dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700/50">
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
              <div className="bg-white dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-800/40 p-2 rounded-md">
                    <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1 text-indigo-900 dark:text-indigo-300">Resource Efficiency</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">12 underutilized EC2 instances could be downsized to save $432/month</p>
                    <Button variant="link" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400 px-0 mt-1">
                      View recommendations
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1 text-indigo-900 dark:text-indigo-300">Security Vulnerability</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Public S3 bucket detected with sensitive data - immediate action required</p>
                    <Button variant="link" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400 px-0 mt-1">
                      View details
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-md">
                    <RefreshCw className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1 text-indigo-900 dark:text-indigo-300">Auto-Scaling</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Implement auto-scaling for web app cluster to handle 38% traffic increase</p>
                    <Button variant="link" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400 px-0 mt-1">
                      View suggestion
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
              currentSpend={1238400}
              projectedSpend={1875000}
              potentialSavings={432000}
              optimizationCount={32}
              spendChange={43}
              projectionChange={51}
              isLoading={false}
            />

            {/* Security Configuration Drifts */}
            <SecurityDriftsTable 
              drifts={securityDrifts || []} 
              isLoading={isLoadingDrifts} 
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActions />

            {/* Recent Alerts */}
            <RecentAlerts 
              alerts={alerts || []} 
              isLoading={isLoadingAlerts} 
            />

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
            isLoading={false} 
          />
        </div>

        {/* Cost Optimization Recommendations */}
        <div className="grid grid-cols-1 gap-6">
          <CostRecommendations 
            recommendations={recommendations || []} 
            isLoading={isLoadingRecommendations} 
          />
        </div>
      </div>

      {/* Cloud Providers Tab */}
      <div className={dashboardTab === "providers" ? "block" : "hidden"}>
        <CloudProviderIntegration />
      </div>

      {/* Custom Widgets Tab */}
      <div className={dashboardTab === "widgets" ? "block" : "hidden"}>
        <PersonalizedWidgets />
      </div>
        </>
      )}
    </DashboardLayout>
  );
}
