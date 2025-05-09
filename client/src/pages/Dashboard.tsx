import React from "react";
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
import { CornerLeftDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { SecurityDrift, Alert, Recommendation, UtilizationMetric } from "@/types";

export default function Dashboard() {
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
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-semibold font-inter mb-1">Infrastructure Overview</h1>
          <p className="text-gray-500">
            Last scan completed on <span className="font-medium">{formatDate(lastScanTime)}</span>
          </p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <CornerLeftDown className="h-4 w-4" />
            Export Report
          </Button>
          <Button className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Run New Scan
          </Button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
    </DashboardLayout>
  );
}
