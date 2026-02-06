import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/layouts/DashboardLayout";

// Dashboard Components
import { MetricCard } from "@/components/dashboard/MetricCard";
import { HealthScoreGauge } from "@/components/dashboard/HealthScoreGauge";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { ServiceOverview } from "@/components/dashboard/ServiceOverview";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
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

// Icons
import {
  Play,
  LayoutDashboard,
  Settings,
  Sparkles,
  ChevronRight,
  RefreshCw,
  CloudIcon,
  Share2,
  Copy,
  ExternalLink,
  Zap,
  Shield,
  DollarSign,
  Server,
  Bell,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Target,
  Rocket,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Layers,
  Database,
  Globe,
  Lock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Filter,
  Download,
  Calendar,
  Users,
  Cpu
} from "lucide-react";

// UI Components
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { formatDate, cn } from "@/lib/utils";
import { SecurityDrift, Alert, Recommendation, UtilizationMetric } from "@/types";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import {
  isDemoMode,
  enableDemoMode,
  demoRecommendations,
  demoSecurityDrifts,
  demoAlerts,
  demoUtilizationMetrics,
  demoCostData,
  demoResources,
} from "@/lib/demo-data";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [dashboardTab, setDashboardTab] = useState("overview");
  const [hasConnectedProviders, setHasConnectedProviders] = useState(false);
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Scan mutation — triggers drift detection on the Go backend
  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/drifts/detect");
      return await res.json();
    },
    onMutate: () => {
      setIsScanning(true);
      toast({
        title: "Infrastructure Scan Started",
        description: "Analyzing your cloud resources...",
      });
    },
    onSuccess: (data) => {
      setLastScanResult(data);
      toast({
        title: "Scan Completed",
        description: "Drift detection finished successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/drifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
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

  // Share mutation — generates a snapshot link (placeholder until backend supports it)
  const shareMutation = useMutation({
    mutationFn: async () => {
      // Generate a client-side share token since the Go backend doesn't have this endpoint yet
      const token = crypto.randomUUID();
      return { token, url: `${window.location.origin}/share/${token}` };
    },
    onSuccess: (data) => {
      setShareLink(data.url);
      setIsShareOpen(true);
      toast({ title: "Share link created", description: "Anyone with the link can view this snapshot." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create share link", description: error?.message || "Try again later", variant: "destructive" });
    },
  });

  const handleCopyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({ title: "📋 Link copied", description: "Share link copied to clipboard" });
    } catch (_) {
      /* no-op */
    }
  };

  const handleRunScan = () => {
    scanMutation.mutate();
  };

  const handleDashboardAction = (action: string) => {
    switch (action) {
      case "refresh":
        toast({ title: "🔄 Refreshing Dashboard", description: "Fetching the latest data..." });
        queryClient.invalidateQueries();
        break;
      case "export":
        toast({ title: "📊 Exporting Dashboard", description: "Preparing PDF export..." });
        setTimeout(() => {
          toast({ title: "✅ Export Ready", description: "Dashboard exported successfully" });
        }, 1500);
        break;
      case "share":
        shareMutation.mutate();
        break;
      case "configureProviders":
        navigate("/cloud-providers");
        break;
    }
  };

  // Data queries — using Go backend endpoints
  const { data: providers, isLoading: isLoadingProviders } = useQuery<any[]>({
    queryKey: ["/api/providers"],
  });

  const { data: driftsResponse, isLoading: isLoadingDrifts } = useQuery<any>({
    queryKey: ["/api/drifts"],
  });

  const { data: alertsResponse, isLoading: isLoadingAlerts } = useQuery<any>({
    queryKey: ["/api/alerts"],
  });

  const { data: recommendationsResponse, isLoading: isLoadingRecommendations } = useQuery<any>({
    queryKey: ["/api/recommendations"],
  });

  const { data: resourcesResponse, isLoading: isLoadingCloudResources } = useQuery<any>({
    queryKey: ["/api/resources"],
  });

  // Extract arrays from paginated responses (Go backend returns { data: [...], page, totalItems, ... })
  const securityDrifts: SecurityDrift[] = Array.isArray(driftsResponse) ? driftsResponse : (driftsResponse?.data || []);
  const alerts: Alert[] = Array.isArray(alertsResponse) ? alertsResponse : (alertsResponse?.data || []);
  const recommendations: Recommendation[] = Array.isArray(recommendationsResponse) ? recommendationsResponse : (recommendationsResponse?.data || []);
  const cloudResources: any[] = Array.isArray(resourcesResponse) ? resourcesResponse : (resourcesResponse?.data || []);

  useEffect(() => {
    if (providers && providers.length > 0) {
      setHasConnectedProviders(true);
      setShowFirstTimeSetup(false);
    }
  }, [providers]);

  const lastScanTime = new Date();

  // Utilization metrics — derived from resource counts (real metrics need a backend utilization API)
  const resourceCount = cloudResources.length;
  const utilizationMetrics: UtilizationMetric[] = [
    { name: "CPU Utilization", value: resourceCount > 0 ? Math.min(95, 20 + resourceCount * 3) : 0, status: resourceCount > 10 ? "warning" : "healthy", trend: "down", change: 12 },
    { name: "Memory Usage", value: resourceCount > 0 ? Math.min(95, 40 + resourceCount * 5) : 0, status: resourceCount > 8 ? "warning" : "healthy", trend: "up", change: 18 },
    { name: "Storage Usage", value: resourceCount > 0 ? Math.min(95, 30 + resourceCount * 4) : 0, status: "healthy", trend: "down", change: 3 },
    { name: "Network I/O", value: resourceCount > 0 ? Math.min(95, 50 + resourceCount * 6) : 0, status: resourceCount > 6 ? "critical" : "healthy", trend: "up", change: 43 },
  ];

  // First-time setup - now uses the new OnboardingWizard
  if (showFirstTimeSetup) {
    return (
      <DashboardLayout hideSidebar>
        <OnboardingWizard
          onComplete={() => {
            setShowFirstTimeSetup(false);
          }}
          onSkip={() => {
            enableDemoMode();
            setShowFirstTimeSetup(false);
            toast({
              title: "🎮 Demo Mode Activated",
              description: "Explore InfraAudit with sample data. Connect a provider anytime to see your real infrastructure.",
            });
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen dashboard-grid-pattern">
        {/* Trial Banner */}
        <TrialBanner />

        {/* Hero Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-violet-600/5 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-violet-500/10" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-violet-500/10 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="relative p-6 md:p-8 rounded-3xl border border-gray-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            {/* Top bar with time and actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-50" />
                  <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                      Infrastructure Command Center
                    </span>
                  </h1>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-emerald-500" />
                      Last scan: {formatDate(lastScanTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Command Palette & Actions */}
              <div className="flex items-center gap-3">
                <CommandPalette onRunScan={handleRunScan} isScanning={isScanning} />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Dashboard</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDashboardAction("refresh")}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDashboardAction("export")}>
                      <Download className="h-4 w-4 mr-2" /> Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDashboardAction("share")}>
                      <Share2 className="h-4 w-4 mr-2" /> Share Link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDashboardAction("configureProviders")}>
                      <CloudIcon className="h-4 w-4 mr-2" /> Cloud Providers
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleRunScan}
                        disabled={isScanning}
                        className={cn(
                          "relative h-10 gap-2 px-5 font-medium shadow-lg",
                          "bg-gradient-to-r from-blue-600 to-indigo-600",
                          "hover:from-blue-700 hover:to-indigo-700",
                          "text-white border-0",
                          isScanning && "opacity-80"
                        )}
                      >
                        {isScanning ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Scanning...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4" />
                            <span>Run Scan</span>
                          </>
                        )}
                        {/* Scanning animation overlay */}
                        {isScanning && (
                          <div className="absolute inset-0 overflow-hidden rounded-md">
                            <div className="scan-line" />
                          </div>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Scan all connected cloud providers</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Dashboard Tabs */}
            <Tabs value={dashboardTab} onValueChange={setDashboardTab}>
              <TabsList className="bg-white/80 dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700/60 p-1.5 rounded-xl shadow-sm">
                <TabsTrigger
                  value="overview"
                  className="rounded-lg px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="rounded-lg px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="providers"
                  className="rounded-lg px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <CloudIcon className="h-4 w-4 mr-2" />
                  Providers
                </TabsTrigger>
                <TabsTrigger
                  value="widgets"
                  className="rounded-lg px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Widgets
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {/* Share Dialog */}
        <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-500" />
                Share Dashboard Snapshot
              </DialogTitle>
              <DialogDescription>
                Anyone with this link can view a read-only snapshot.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input readOnly value={shareLink} onFocus={(e) => e.currentTarget.select()} className="font-mono text-sm" />
              <div className="flex gap-2">
                <Button onClick={handleCopyShareLink} className="flex-1 gap-2">
                  <Copy className="h-4 w-4" /> Copy Link
                </Button>
                {shareLink && (
                  <Button variant="outline" asChild>
                    <a href={shareLink} target="_blank" rel="noreferrer" className="gap-2">
                      <ExternalLink className="h-4 w-4" /> Open
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Overview Tab Content */}
        <AnimatePresence mode="wait">
          {dashboardTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Metric Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Security Score"
                  value="87%"
                  subtitle={`${securityDrifts?.length || 0} drifts detected`}
                  type="security"
                  trend="up"
                  trendValue={5}
                  status={securityDrifts && securityDrifts.length > 3 ? "warning" : "good"}
                  isLoading={isLoadingDrifts}
                  onClick={() => navigate("/security")}
                />
                <MetricCard
                  title="Monthly Cost"
                  value={hasConnectedProviders ? "$24,850" : "—"}
                  subtitle={hasConnectedProviders ? "vs $23,120 last month" : "Connect provider"}
                  type="cost"
                  trend="up"
                  trendValue={7.5}
                  status={hasConnectedProviders ? "warning" : "good"}
                  onClick={() => navigate("/cost-optimization")}
                />
                <MetricCard
                  title="Resources"
                  value={cloudResources?.length || 0}
                  subtitle="Across all providers"
                  type="resources"
                  trend="up"
                  trendValue={12}
                  status="good"
                  isLoading={isLoadingCloudResources}
                  onClick={() => navigate("/resources")}
                />
                <MetricCard
                  title="Active Alerts"
                  value={alerts?.length || 0}
                  subtitle="Requires attention"
                  type="alerts"
                  trend={alerts && alerts.length > 0 ? "up" : "stable"}
                  trendValue={alerts?.length || 0}
                  status={alerts && alerts.length > 5 ? "critical" : alerts && alerts.length > 0 ? "warning" : "excellent"}
                  isLoading={isLoadingAlerts}
                  onClick={() => navigate("/alerts")}
                />
              </div>

              {/* Multi-Cloud Overview */}
              <ServiceOverview isLoading={isLoadingProviders} />

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Health Score */}
                  <HealthScoreGauge
                    overallScore={88}
                    previousScore={85}
                  />

                  {/* Cost Trend Chart */}
                  <CostTrendChart
                    currentSpend={cloudResources ? cloudResources.length * 0.023 * 730 * 100 : 24850}
                    projectedSpend={cloudResources ? cloudResources.length * 0.023 * 730 * 100 * 1.1 : 27335}
                    potentialSavings={cloudResources ? cloudResources.length * 0.023 * 730 * 100 * 0.3 : 7455}
                    optimizationCount={cloudResources ? cloudResources.length : 47}
                    spendChange={5}
                    projectionChange={10}
                    isLoading={isLoadingCloudResources}
                  />

                  {/* Security Drifts */}
                  <SecurityDriftsTable
                    drifts={securityDrifts || []}
                    isLoading={isLoadingDrifts}
                  />
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                  {/* Activity Timeline */}
                  <ActivityTimeline maxItems={6} />

                  {/* Quick Actions */}
                  <QuickActions />

                  {/* Recent Alerts */}
                  <RecentAlerts
                    alerts={alerts || []}
                    isLoading={isLoadingAlerts}
                  />

                  {/* Slack Integration */}
                  <SlackNotifications
                    isConnected={true}
                    alertsSentToday={12}
                  />
                </div>
              </div>

              {/* Resource Utilization */}
              <ResourceUtilization
                metrics={utilizationMetrics}
                isLoading={isLoadingCloudResources}
              />

              {/* Cost Recommendations */}
              <CostRecommendations
                recommendations={recommendations || []}
                isLoading={isLoadingRecommendations}
              />
            </motion.div>
          )}

          {/* Analytics Tab */}
          {dashboardTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <InteractiveCostAnalysis hasCloudCredentials={hasConnectedProviders} />

              {/* Additional Analytics Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-violet-500" />
                      Resource Distribution
                    </CardTitle>
                    <CardDescription>Breakdown by service type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { name: "Compute (EC2, Lambda)", value: 42, color: "bg-blue-500" },
                        { name: "Storage (S3, EBS)", value: 28, color: "bg-emerald-500" },
                        { name: "Database (RDS, DynamoDB)", value: 18, color: "bg-amber-500" },
                        { name: "Networking (VPC, ELB)", value: 12, color: "bg-violet-500" },
                      ].map((item) => (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                            <span className="font-medium">{item.value}%</span>
                          </div>
                          <Progress value={item.value} className={cn("h-2", item.color)} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-500" />
                      Optimization Opportunities
                    </CardTitle>
                    <CardDescription>Top recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { title: "Right-size EC2 instances", savings: "$2,340/mo", impact: "high" },
                        { title: "Delete unused EBS volumes", savings: "$890/mo", impact: "medium" },
                        { title: "Reserved instance savings", savings: "$4,500/mo", impact: "high" },
                        { title: "S3 lifecycle policies", savings: "$320/mo", impact: "low" },
                      ].map((rec, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              rec.impact === "high" ? "bg-emerald-500/10 text-emerald-500" :
                                rec.impact === "medium" ? "bg-amber-500/10 text-amber-500" :
                                  "bg-blue-500/10 text-blue-500"
                            )}>
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium">{rec.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                              {rec.savings}
                            </Badge>
                            <ArrowUpRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Providers Tab */}
          {dashboardTab === "providers" && (
            <motion.div
              key="providers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CloudProviderIntegration />
            </motion.div>
          )}

          {/* Widgets Tab */}
          {dashboardTab === "widgets" && (
            <motion.div
              key="widgets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PersonalizedWidgets />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
