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
      {/* Enhanced Header with Tabs */}
      <div className="mb-6 bg-gray-900/70 p-6 rounded-xl border border-gray-800 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gradient">
              Cloud Infrastructure Dashboard
            </h1>
            <p className="text-gray-400">
              Last scan completed on <span className="font-medium text-gray-300">{formatDate(lastScanTime)}</span>
            </p>
          </div>
          <div className="flex space-x-3 mt-4 lg:mt-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 border-gray-700 bg-gray-800/80">
                  <Settings className="h-4 w-4" />
                  Dashboard Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] bg-gray-900 border-gray-800">
                <DropdownMenuLabel>Dashboard Options</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh All Data
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                  <CornerLeftDown className="h-4 w-4 mr-2" />
                  Export Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                  <PlusSquare className="h-4 w-4 mr-2" />
                  Add New Widget
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                  <CloudIcon className="h-4 w-4 mr-2" />
                  Configure Cloud Providers
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="flex items-center gap-2 btn-gradient">
              <Play className="h-4 w-4" />
              Run New Scan
            </Button>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="mt-4">
          <TabsList className="bg-gray-800 border border-gray-700 p-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="providers" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <CloudIcon className="h-4 w-4 mr-2" />
              Cloud Providers
            </TabsTrigger>
            <TabsTrigger 
              value="widgets" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Custom Widgets
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Overview Tab */}
      {dashboardTab === "overview" && (
        <div>
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
          <Card className="bg-gray-900/70 border-gray-800 mb-8">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium text-gradient">Featured Insights</CardTitle>
                <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-700/50 font-normal">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Generated
                </Badge>
              </div>
              <CardDescription className="text-gray-400">
                Personalized insights based on your infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-md">
                      <Layers className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm mb-1 text-white">Resource Efficiency</h3>
                      <p className="text-xs text-gray-400">12 underutilized EC2 instances could be downsized to save $432/month</p>
                      <Button variant="link" size="sm" className="text-xs text-blue-400 px-0 mt-1">
                        View recommendations
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-br from-red-600 to-red-700 p-2 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm mb-1 text-white">Security Vulnerability</h3>
                      <p className="text-xs text-gray-400">Public S3 bucket detected with sensitive data - immediate action required</p>
                      <Button variant="link" size="sm" className="text-xs text-blue-400 px-0 mt-1">
                        View details
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-br from-green-600 to-green-700 p-2 rounded-md">
                      <RefreshCw className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm mb-1 text-white">Auto-Scaling</h3>
                      <p className="text-xs text-gray-400">Implement auto-scaling for web app cluster to handle 38% traffic increase</p>
                      <Button variant="link" size="sm" className="text-xs text-blue-400 px-0 mt-1">
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
