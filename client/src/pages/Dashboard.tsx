import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { CloudProviderIntegration } from "@/components/dashboard/CloudProviderIntegration";
import api from "@/lib/api";

// Icons
import {
  LayoutDashboard,
  Settings,
  RefreshCw,
  CloudIcon,
  Zap,
  Shield,
  DollarSign,
  Server,
  Bell,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Rocket,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Plus,
  Loader2,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { formatDate, cn } from "@/lib/utils";
import { SecurityDrift, Alert, Recommendation } from "@/types";

// ─── Onboarding Screen ─────────────────────────────────────────────────────
function OnboardingScreen({ onNavigateToProviders }: { onNavigateToProviders: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full text-center space-y-8"
      >
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-600/20">
          <CloudIcon className="h-10 w-10 text-white" />
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome to InfraAudit
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Connect your cloud provider to start monitoring your infrastructure, detecting drifts, and optimizing costs.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            { icon: CloudIcon, title: "Connect", desc: "Link your AWS, GCP, or Azure account" },
            { icon: Server, title: "Discover", desc: "We scan and catalog all your resources" },
            { icon: Shield, title: "Monitor", desc: "Get alerts on drifts, costs & security" },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50"
            >
              <step.icon className="h-6 w-6 text-blue-500 mb-2" />
              <div className="font-semibold text-sm text-gray-900 dark:text-white">{step.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{step.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            size="lg"
            onClick={onNavigateToProviders}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20 px-8"
          >
            <Plus className="h-5 w-5" />
            Connect Cloud Provider
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  trend,
  trendValue,
  isLoading,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  trend?: "up" | "down" | "stable";
  trendValue?: number;
  isLoading?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200/60 dark:border-slate-800/60"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("p-2 rounded-lg", iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && trendValue !== undefined && trendValue !== 0 && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md",
                trend === "down"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : trend === "up"
                  ? "bg-red-500/10 text-red-600"
                  : "bg-gray-500/10 text-gray-600"
              )}
            >
              {trend === "up" ? <TrendingUp className="h-3 w-3" /> : trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
              {Math.abs(trendValue)}%
            </div>
          )}
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-7 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
            {subtitle && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</div>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Provider Summary Card ──────────────────────────────────────────────────
function ProviderSummaryCard({ provider }: { provider: any }) {
  const isConnected = provider.isConnected;
  const statusColor = isConnected
    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
    : "bg-red-500/10 text-red-600 border-red-500/30";

  const providerNames: Record<string, string> = {
    aws: "Amazon Web Services",
    gcp: "Google Cloud Platform",
    azure: "Microsoft Azure",
  };
  const displayName = providerNames[(provider.provider || "").toLowerCase()] || (provider.provider || "Unknown").toUpperCase();

  return (
    <Card className="border border-gray-200/60 dark:border-slate-800/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-gray-900 dark:text-white">
            {displayName}
          </div>
          <Badge variant="outline" className={cn("text-xs", statusColor)}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {provider.lastSynced
            ? `Last synced: ${formatDate(new Date(provider.lastSynced))}`
            : "Not synced yet"}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Alert Row ──────────────────────────────────────────────────────────────
function AlertRow({ alert }: { alert: Alert }) {
  const severityColors: Record<string, string> = {
    critical: "bg-red-500/10 text-red-600",
    high: "bg-orange-500/10 text-orange-600",
    medium: "bg-amber-500/10 text-amber-600",
    low: "bg-blue-500/10 text-blue-600",
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-slate-800 last:border-0">
      <div className={cn("p-1.5 rounded-md mt-0.5", severityColors[alert.severity] || "bg-gray-100")}>
        <AlertTriangle className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{alert.title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{alert.message}</div>
      </div>
      <Badge variant="outline" className={cn("text-xs shrink-0", severityColors[alert.severity])}>
        {alert.severity}
      </Badge>
    </div>
  );
}

// ─── Drift Row ──────────────────────────────────────────────────────────────
function DriftRow({ drift }: { drift: SecurityDrift }) {
  const severityColors: Record<string, string> = {
    critical: "bg-red-500/10 text-red-600",
    high: "bg-orange-500/10 text-orange-600",
    medium: "bg-amber-500/10 text-amber-600",
    low: "bg-blue-500/10 text-blue-600",
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-slate-800 last:border-0">
      <div className={cn("p-1.5 rounded-md mt-0.5", severityColors[drift.severity] || "bg-gray-100")}>
        <Shield className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {drift.driftType}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Status: {drift.status} &middot; Detected {drift.detectedAt ? formatDate(new Date(drift.detectedAt)) : "recently"}
        </div>
      </div>
      <Badge variant="outline" className={cn("text-xs shrink-0", severityColors[drift.severity])}>
        {drift.severity}
      </Badge>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">{description}</div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate] = useLocation();
  const [isScanning, setIsScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ── Data Queries ─────────────────────────────────────────
  const { data: providers, isLoading: isLoadingProviders } = useQuery<any[]>({
    queryKey: ["/api/providers"],
    staleTime: 0,              // always refetch when dashboard mounts
    refetchOnMount: "always",  // ensure fresh data after navigating back from cloud-providers
  });

  // Only fetch data when at least one provider is connected
  const hasConnected = !!providers && providers.some((p: any) => p.isConnected);

  const { data: driftsResponse, isLoading: isLoadingDrifts } = useQuery<any>({
    queryKey: ["/api/drifts"],
    enabled: hasConnected,
  });

  const { data: alertsResponse, isLoading: isLoadingAlerts } = useQuery<any>({
    queryKey: ["/api/alerts"],
    enabled: hasConnected,
  });

  const { data: recommendationsResponse, isLoading: isLoadingRecs } = useQuery<any>({
    queryKey: ["/api/recommendations"],
    enabled: hasConnected,
  });

  const { data: resourcesResponse, isLoading: isLoadingResources } = useQuery<any>({
    queryKey: ["/api/resources"],
    enabled: hasConnected,
  });

  const { data: driftSummary } = useQuery<any>({
    queryKey: ["/api/drifts/summary"],
    enabled: hasConnected,
  });

  const { data: alertSummary } = useQuery<any>({
    queryKey: ["/api/alerts/summary"],
    enabled: hasConnected,
  });

  // Extract arrays from paginated responses
  const drifts: SecurityDrift[] = Array.isArray(driftsResponse) ? driftsResponse : (driftsResponse?.data || []);
  const alerts: Alert[] = Array.isArray(alertsResponse) ? alertsResponse : (alertsResponse?.data || []);
  const recommendations: Recommendation[] = Array.isArray(recommendationsResponse) ? recommendationsResponse : (recommendationsResponse?.data || []);
  const resources: any[] = Array.isArray(resourcesResponse) ? resourcesResponse : (resourcesResponse?.data || []);

  // Go backend returns { provider: "aws", isConnected: true, lastSynced: "..." }
  const connectedProviders = providers?.filter((p: any) => p.isConnected) || [];
  const hasProviders = connectedProviders.length > 0;

  // ── Mutations ────────────────────────────────────────────
  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/drifts/detect");
      return await res.json();
    },
    onMutate: () => {
      setIsScanning(true);
      toast({ title: "Scan Started", description: "Detecting infrastructure drifts..." });
    },
    onSuccess: () => {
      toast({ title: "Scan Complete", description: "Drift detection finished." });
      queryClient.invalidateQueries({ queryKey: ["/api/drifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drifts/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/summary"] });
    },
    onError: (error) => {
      toast({ title: "Scan Failed", description: error.message || "Could not run scan.", variant: "destructive" });
    },
    onSettled: () => setIsScanning(false),
  });

  const handleRunScan = () => {
    if (!hasProviders) {
      toast({ title: "No Providers Connected", description: "Connect a cloud provider first to run a scan.", variant: "destructive" });
      return;
    }
    scanMutation.mutate();
  };

  // ── If no providers, show onboarding ─────────────────────
  if (!isLoadingProviders && !hasProviders) {
    return (
      <DashboardLayout>
        <OnboardingScreen onNavigateToProviders={() => navigate("/cloud-providers")} />
      </DashboardLayout>
    );
  }

  // ── Loading state ────────────────────────────────────────
  if (isLoadingProviders) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Connected dashboard ──────────────────────────────────
  const totalDrifts = driftSummary?.total ?? drifts.length;
  const criticalDrifts = driftSummary?.critical ?? drifts.filter(d => d.severity === "critical").length;
  const totalAlerts = alertSummary?.total ?? alerts.length;
  const openAlerts = alertSummary?.open ?? alerts.filter(a => a.status === "open").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                {connectedProviders.length} provider{connectedProviders.length !== 1 ? "s" : ""} connected
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Dashboard</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  queryClient.invalidateQueries();
                  toast({ title: "Refreshing", description: "Fetching latest data..." });
                }}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/cloud-providers")}>
                  <CloudIcon className="h-4 w-4 mr-2" /> Manage Providers
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleRunScan}
                    disabled={isScanning}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Run Scan
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Scan all connected providers for drifts</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* ── Stat Cards ───────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Resources"
            value={resources.length}
            subtitle={`Across ${connectedProviders.length} provider${connectedProviders.length !== 1 ? "s" : ""}`}
            icon={Server}
            iconColor="bg-blue-500/10 text-blue-600"
            isLoading={isLoadingResources}
            onClick={() => navigate("/resources")}
          />
          <StatCard
            title="Security Drifts"
            value={totalDrifts}
            subtitle={criticalDrifts > 0 ? `${criticalDrifts} critical` : "No critical drifts"}
            icon={Shield}
            iconColor={criticalDrifts > 0 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}
            isLoading={isLoadingDrifts}
            onClick={() => navigate("/security")}
          />
          <StatCard
            title="Active Alerts"
            value={openAlerts}
            subtitle={totalAlerts > openAlerts ? `${totalAlerts - openAlerts} resolved` : "All open"}
            icon={Bell}
            iconColor={openAlerts > 5 ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}
            isLoading={isLoadingAlerts}
            onClick={() => navigate("/alerts")}
          />
          <StatCard
            title="Recommendations"
            value={recommendations.length}
            subtitle="Optimization suggestions"
            icon={CheckCircle2}
            iconColor="bg-violet-500/10 text-violet-600"
            isLoading={isLoadingRecs}
            onClick={() => navigate("/recommendations")}
          />
        </div>

        {/* ── Connected Providers ──────────────────────────── */}
        <Card className="border border-gray-200/60 dark:border-slate-800/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CloudIcon className="h-5 w-5 text-blue-500" />
                Connected Providers
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/cloud-providers")} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Provider
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {connectedProviders.map((provider: any) => (
                <ProviderSummaryCard key={provider.id || provider.provider} provider={provider} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Two Column Layout ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Alerts */}
          <Card className="border border-gray-200/60 dark:border-slate-800/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Recent Alerts
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/alerts")} className="gap-1 text-xs">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAlerts ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : alerts.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No alerts"
                  description="Your infrastructure looks healthy. Alerts will appear here when issues are detected."
                />
              ) : (
                <div>
                  {alerts.slice(0, 5).map((alert) => (
                    <AlertRow key={alert.id} alert={alert} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Drifts */}
          <Card className="border border-gray-200/60 dark:border-slate-800/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  Security Drifts
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/security")} className="gap-1 text-xs">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingDrifts ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : drifts.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No drifts detected"
                  description="Run a scan to check for security configuration drifts across your infrastructure."
                />
              ) : (
                <div>
                  {drifts.slice(0, 5).map((drift) => (
                    <DriftRow key={drift.id} drift={drift} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Recommendations ──────────────────────────────── */}
        <Card className="border border-gray-200/60 dark:border-slate-800/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-violet-500" />
                Optimization Recommendations
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/recommendations")} className="gap-1 text-xs">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingRecs ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : recommendations.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No recommendations yet"
                description="Run a scan to generate optimization recommendations for your infrastructure."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendations.slice(0, 6).map((rec) => (
                  <div key={rec.id} className="p-4 rounded-lg border border-gray-200/60 dark:border-slate-800/60 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">{rec.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{rec.description}</div>
                    {(rec as any).estimatedSavings && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          Save ${((rec as any).estimatedSavings || 0).toLocaleString()}/mo
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
