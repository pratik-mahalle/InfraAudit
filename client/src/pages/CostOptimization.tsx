import React, { useState } from "react";
import { Link } from "wouter";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { CostTrendChart } from "@/components/dashboard/CostTrendChart";
import { CostProviderBreakdown } from "@/components/cost/CostProviderBreakdown";
import { CostOptimizationsList } from "@/components/cost/CostOptimizationsList";
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
  Download,
  TrendingUp,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useCostOverview,
  useCostAnomalies,
  useCostOptimizations,
  useSyncCosts,
  useCostTrends
} from "@/hooks/use-costs";
import { ChartTimeframe } from "@/types";

export default function CostOptimization() {
  const [timeframeFilter, setTimeframeFilter] = useState<"7d" | "30d" | "90d">("30d");
  const { toast } = useToast();

  // Fetch real data from backend
  const { data: overview, isLoading: isLoadingOverview } = useCostOverview();
  const { data: trends } = useCostTrends();
  const { data: anomalies, isLoading: isLoadingAnomalies } = useCostAnomalies();
  const { data: optimizations, isLoading: isLoadingOptimizations } = useCostOptimizations();
  const { mutate: syncCosts, isPending: isSyncing } = useSyncCosts();

  // Handle actions
  const handleSync = () => {
    syncCosts(undefined, {
      onSuccess: () => {
        toast({
          title: "Synchronization Started",
          description: "Fetching latest cost data from cloud providers.",
        });
      },
      onError: () => {
        toast({
          title: "Synchronization Failed",
          description: "Failed to start cost synchronization.",
          variant: "destructive",
        });
      }
    });
  };

  const currentSpend = overview?.monthlyCost || 0;
  const projectedSpend = currentSpend * 1.1; // Simple projection if backend doesn't provide
  const potentialSavings = overview?.potentialSavings || 0;

  // Calculate changes (mock logic if backend doesn't provide prev period yet)
  const spendChange = overview?.trend?.changePercent || 0;

  // Export report as CSV
  const handleExportReport = () => {
    try {
      const rows: string[][] = [
        ["Cost Optimization Report", `Generated ${new Date().toLocaleString()}`],
        [],
        ["Summary"],
        ["Current Month Spend", formatCurrency(currentSpend)],
        ["Projected Spend", formatCurrency(projectedSpend)],
        ["Potential Savings", formatCurrency(potentialSavings)],
        ["Spend Change %", `${spendChange}%`],
        ["Cost Anomalies", String(overview?.anomalyCount || 0)],
        [],
        ["Top Services by Cost"],
        ["Service", "Provider", "Cost", "% of Total"],
      ];

      if (overview?.topServices) {
        for (const svc of overview.topServices) {
          rows.push([svc.serviceName, svc.provider || '', formatCurrency(svc.cost), `${svc.percentage?.toFixed(1)}%`]);
        }
      }

      if (optimizations && optimizations.length > 0) {
        rows.push([], ["Optimization Recommendations"], ["ID", "Title", "Estimated Savings", "Status"]);
        for (const opt of optimizations as any[]) {
          rows.push([String(opt.id), opt.title || opt.description || '', formatCurrency(opt.estimatedSavings || 0), opt.status || '']);
        }
      }

      if (anomalies && anomalies.length > 0) {
        rows.push([], ["Cost Anomalies"], ["Service", "Provider", "Severity", "Expected", "Actual", "Deviation", "Status"]);
        for (const a of anomalies as any[]) {
          rows.push([a.serviceName || '', a.provider || '', a.severity || '', formatCurrency(a.expectedCost || 0), formatCurrency(a.actualCost || 0), formatCurrency(a.deviation || 0), a.status || '']);
        }
      }

      const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `infraaudit-cost-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: "Cost optimization report has been downloaded as CSV.",
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Unable to generate the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Cost Optimization"
        description="Monitor and optimize cloud spending across your infrastructure"
        actions={
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Costs"}
            </Button>
            <Button className="flex items-center gap-2" onClick={handleExportReport}>
              <Download className="h-4 w-4" />
              Export Report
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
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold">{formatCurrency(currentSpend)}</p>
                  {isLoadingOverview && <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>}
                </div>
              </div>
            </div>
            <div className={`${spendChange >= 0 ? 'text-danger' : 'text-green-500'} flex items-center`}>
              {spendChange >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              <span>{Math.abs(spendChange)}%</span>
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
                <p className="text-2xl font-bold">{overview?.anomalyCount || 0}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(potentialSavings)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400">{optimizations?.length || 0} recommendations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Cost Trend Chart */}
        <div className="lg:col-span-2">
          <CostTrendChart
            currentSpend={currentSpend}
            projectedSpend={projectedSpend}
            potentialSavings={potentialSavings}
            optimizationCount={optimizations?.length || 0}
            spendChange={spendChange}
            projectionChange={10}
            isLoading={isLoadingOverview}
            trendDataPoints={(trends as any)?.dataPoints}
          />
        </div>

        {/* Provider Breakdown */}
        <div>
          <CostProviderBreakdown
            data={overview?.byProvider || {}}
            totalCost={overview?.totalCost || 0}
          />
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="optimizations" className="mb-6">
        <TabsList>
          <TabsTrigger value="optimizations">Recommendations</TabsTrigger>
          <TabsTrigger value="anomalies">Cost Anomalies</TabsTrigger>
          <TabsTrigger value="by-service">Detailed Breakdown</TabsTrigger>
        </TabsList>

        {/* Optimizations Tab */}
        <TabsContent value="optimizations" className="space-y-6 mt-6">
          <CostOptimizationsList
            optimizations={optimizations || []}
            isLoading={isLoadingOptimizations}
            onApply={(id) => toast({ title: "Applying fix...", description: `Applied fix for ${id}` })}
            onDismiss={(id) => toast({ title: "Dismissed", description: `Dismissed recommendation ${id}` })}
          />
        </TabsContent>

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
                  onValueChange={(v) => setTimeframeFilter(v as any)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Last 30 days" />
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
                    <TableHead>Service/Resource</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Deviation</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAnomalies ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        Loading cost anomalies...
                      </TableCell>
                    </TableRow>
                  ) : anomalies && anomalies.length > 0 ? (
                    anomalies.map((anomaly) => (
                      <TableRow key={anomaly.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{anomaly.serviceName || 'Unknown Service'}</span>
                            <span className="text-xs text-muted-foreground">{anomaly.provider}</span>
                          </div>
                        </TableCell>
                        <TableCell>{anomaly.anomalyType}</TableCell>
                        <TableCell>
                          <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {anomaly.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-danger">
                          <div className="flex items-center">
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            {formatCurrency(anomaly.deviation)}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(anomaly.expectedCost)}</TableCell>
                        <TableCell>{formatCurrency(anomaly.actualCost)}</TableCell>
                        <TableCell>{new Date(anomaly.detectedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-opacity-10 ${anomaly.status === "open" ? "bg-warning text-warning" : "bg-green-500 text-green-700"
                            }`}>
                            {anomaly.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-primary hover:text-primary/80"
                            disabled={anomaly.status !== "open"}
                          >
                            Investigate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
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
              <CardTitle>Top Services by Cost</CardTitle>
              <CardDescription>
                Breakdown of your highest spending services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview?.topServices?.map((service, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{service.serviceName}</TableCell>
                      <TableCell>{service.provider}</TableCell>
                      <TableCell>{formatCurrency(service.cost)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-secondary/20 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${service.percentage}%` }} />
                          </div>
                          <span>{service.percentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!overview?.topServices || overview.topServices.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">No service data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
