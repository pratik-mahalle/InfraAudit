import { useState } from "react";
import { Link } from "wouter";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { CostTrendChart } from "@/components/dashboard/CostTrendChart";
import { CostProviderBreakdown } from "@/components/cost/CostProviderBreakdown";
import { CostOptimizationsList } from "@/components/cost/CostOptimizationsList";
import { OptimizationAnalysisHealth } from "@/components/cost/OptimizationAnalysisHealth";
import { CostMonitorWidget } from "@/components/cost/CostMonitorWidget";
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
  RefreshCw,
  AlertTriangle,
  BellRing,
  CalendarClock,
  Database,
  Info,
  ReceiptText,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import {
  useCostOverview,
  useCostAnomalies,
  useCostOptimizations,
  useSyncCosts,
  useCostTrends,
  useDetectAnomalies,
  useGenerateCostOptimizations,
  useUpdateCostOptimization,
  useUpdateCostAnomaly,
  useCostOptimizationAnalysisStatus,
} from "@/hooks/use-costs";
import { ChartTimeframe, CostOptimization as CostOptimizationRecord, CostOptimizationFilters, CostSyncSummary } from "@/types";
import posthog from "@/lib/posthog";

export default function CostOptimization() {
  const [trendTimeframe, setTrendTimeframe] = useState<ChartTimeframe>("30d");
  const [anomalyTimeframe, setAnomalyTimeframe] = useState<ChartTimeframe>("30d");
  const [lastSync, setLastSync] = useState<CostSyncSummary | null>(null);
  const [optimizationPage, setOptimizationPage] = useState(0);
  const [optimizationFilters, setOptimizationFilters] = useState<CostOptimizationFilters>({ provider: "aws" });
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const canManageProviders = hasPermission("manage_providers");
  const canScan = hasPermission("scan");

  // Fetch real data from backend
  const overviewQuery = useCostOverview();
  const trendsQuery = useCostTrends("", trendTimeframe);
  const anomaliesQuery = useCostAnomalies();
  const optimizationPageSize = 10;
  const optimizationsQuery = useCostOptimizations({
    ...optimizationFilters,
    limit: optimizationPageSize,
    offset: optimizationPage * optimizationPageSize,
  });
  const analysisStatusQuery = useCostOptimizationAnalysisStatus("aws");
  const { data: overview, isLoading: isLoadingOverview } = overviewQuery;
  const { data: trends } = trendsQuery;
  const anomalies = anomaliesQuery.data?.anomalies ?? [];
  const optimizations = optimizationsQuery.data?.optimizations ?? [];
  const optimizationTotal = optimizationsQuery.data?.total ?? optimizations.length;
  const { mutate: syncCosts, isPending: isSyncing } = useSyncCosts();
  const { mutate: detectAnomalies, isPending: isDetecting } = useDetectAnomalies();
  const { mutate: generateOptimizations, isPending: isGenerating } = useGenerateCostOptimizations();
  const updateOptimization = useUpdateCostOptimization();
  const updateAnomaly = useUpdateCostAnomaly();

  const filteredAnomalies = anomalies.filter((anomaly) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(anomalyTimeframe.replace("d", "")));
    return new Date(anomaly.detectedAt) >= cutoff;
  });

  const handleDetectAnomalies = () => {
    detectAnomalies(undefined, {
      onSuccess: (result) => {
        posthog.capture("cost_anomaly_scan_completed", { anomalies_detected: result.detected });
        toast({
          title: "Anomaly scan complete",
          description: result.detected > 0
            ? `${result.detected} unusual cost pattern${result.detected === 1 ? "" : "s"} detected.`
            : "No unusual cost patterns were detected in the available history.",
        });
      },
      onError: (error) => {
        toast({
          title: "Scan failed",
          description: error instanceof Error ? error.message : "Failed to run anomaly detection.",
          variant: "destructive",
        });
      },
    });
  };

  const handleUpdateOptimization = (
    optimization: CostOptimizationRecord,
    status: 'acknowledged' | 'planned' | 'applied' | 'verified' | 'dismissed',
    notes?: string,
  ) => {
    updateOptimization.mutate({ id: optimization.id, status, notes }, {
      onSuccess: () => toast({ title: "Recommendation updated", description: `${optimization.title} is now ${status}.` }),
      onError: (error) => toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update the recommendation workflow.",
        variant: "destructive",
      }),
    });
  };

  const handleUpdateAnomaly = (id: string | number, status: 'reviewed' | 'resolved') => {
    updateAnomaly.mutate({ id, status }, {
      onSuccess: () => toast({ title: "Anomaly updated", description: `The anomaly is now ${status}.` }),
      onError: (error) => toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update the anomaly.",
        variant: "destructive",
      }),
    });
  };

  const handleGenerateOptimizations = () => {
    generateOptimizations("aws", {
      onSuccess: (result) => {
        posthog.capture("cost_optimizations_generated", { provider: "aws", generated_count: result.generated, run_status: result.run?.status });
        toast({
          title: "Recommendation analysis complete",
          description: result.run?.status === "partial"
            ? "Analysis completed with source gaps. Review the persistent source health details."
            : result.generated > 0
            ? `${result.generated} savings recommendation${result.generated === 1 ? "" : "s"} generated.`
            : "The analysis did not find a supported savings recommendation in the current data.",
        });
      },
      onError: (error) => {
        toast({
          title: "Analysis unavailable",
          description: error instanceof Error ? error.message : "Failed to generate cost recommendations.",
          variant: "destructive",
        });
      },
    });
  };

  // Handle actions
  const handleSync = () => {
    syncCosts(undefined, {
      onSuccess: (result) => {
        posthog.capture("cost_sync_completed", { status: result.status, records_stored: result.recordsStored });
        setLastSync(result);
        const failed = result.status === "failed" || result.status === "partial";
        const diagnosticMessage = result.results
          .map((item) => `${item.provider.toUpperCase()}: ${item.message}`)
          .join(" ");
        toast({
          title: result.status === "completed" ? "Cost sync complete" : "Cost sync needs attention",
          description: result.status === "completed"
            ? `${result.recordsStored} cost records were imported or refreshed.`
            : diagnosticMessage || "Cost synchronization was accepted, but provider diagnostics are not available yet.",
          variant: failed ? "destructive" : undefined,
        });
      },
      onError: (error) => {
        toast({
          title: "Synchronization failed",
          description: error instanceof Error ? error.message : "Failed to synchronize cost data.",
          variant: "destructive",
        });
      }
    });
  };

  const currentSpend = overview?.monthlyCost || 0;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedSpend = overview?.dataStatus?.hasData ? (overview.dailyCost || 0) * daysInMonth : 0;
  const potentialSavings = analysisStatusQuery.data?.latestRun
    ? analysisStatusQuery.data.authoritativeSavings
    : (overview?.potentialSavings || 0);
  const savingsCurrency = analysisStatusQuery.data?.currency || overview?.currency || "USD";
  const costCurrency = overview?.currency || "USD";

  const spendChange = overview?.trend?.changePercent || 0;
  const lastCostDate = overview?.dataStatus?.lastCostDate ? new Date(`${overview.dataStatus.lastCostDate}T00:00:00`) : undefined;
  const costDataIsStale = lastCostDate ? Date.now() - lastCostDate.getTime() > 72 * 60 * 60 * 1000 : false;
  const attributedRecords = overview?.dataStatus?.resourceRecords ?? 0;
  const aggregateRecords = overview?.dataStatus?.aggregateRecords ?? overview?.dataStatus?.recordCount ?? 0;

  /*
    The API returns provider-level outcomes because a multi-cloud sync can be
    partially successful. Keep those diagnostics visible after the toast.
  */
  const syncDiagnostics = lastSync?.results ?? [];

  // Export report as CSV
  const handleExportReport = () => {
    try {
      const rows: string[][] = [
        ["Cost Analysis Report", `Generated ${new Date().toLocaleString()}`],
        [],
        ["Summary"],
        ["Current Month Spend", formatCurrency(currentSpend, costCurrency)],
        ["Simple Run-rate Projected Month End", formatCurrency(projectedSpend, costCurrency)],
        ["Authoritative Monthly Savings", formatCurrency(potentialSavings, savingsCurrency)],
        ["Spend Change %", `${spendChange}%`],
        ["Cost Anomalies", String(overview?.anomalyCount || 0)],
        [],
        ["Top Services by Cost"],
        ["Service", "Provider", "Cost", "% of Total"],
      ];

      if (overview?.topServices) {
        for (const svc of overview.topServices) {
          rows.push([svc.serviceName, svc.provider || '', formatCurrency(svc.cost, costCurrency), `${svc.percentage?.toFixed(1)}%`]);
        }
      }

      if (optimizations.length > 0) {
        rows.push([], ["Optimization Recommendations"], ["ID", "Title", "Estimated Savings", "Status"]);
        for (const opt of optimizations) {
          rows.push([opt.id, opt.title, formatCurrency(opt.estimatedSavings, opt.currency || savingsCurrency), opt.status]);
        }
      }

      if (filteredAnomalies.length > 0) {
        rows.push([], ["Cost Anomalies"], ["Service", "Provider", "Severity", "Expected", "Actual", "Deviation", "Status"]);
        for (const anomaly of filteredAnomalies) {
          rows.push([
            anomaly.serviceName || '',
            anomaly.provider || '',
            anomaly.severity,
            formatCurrency(anomaly.expectedCost, costCurrency),
            formatCurrency(anomaly.actualCost, costCurrency),
            `${anomaly.deviation.toFixed(1)}%`,
            anomaly.status,
          ]);
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

      posthog.capture("cost_report_exported", { has_optimizations: optimizations.length > 0, has_anomalies: filteredAnomalies.length > 0 });
      toast({
        title: "Report exported",
        description: "Cost optimization report has been downloaded as CSV.",
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: "Unable to generate the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Cost Analysis"
        description="Understand actual spend, guardrails, anomalies, and evidence-backed savings without mixing their totals."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href="/billing-explorer"><ReceiptText className="mr-2 h-4 w-4" />Billing Explorer</Link></Button>
            <Button asChild variant="outline"><Link href="/cost-monitors"><BellRing className="mr-2 h-4 w-4" />Cost monitors</Link></Button>
            {canManageProviders && (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync Costs"}
              </Button>
            )}
            {canScan && (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleDetectAnomalies}
                disabled={isDetecting || !overview?.dataStatus?.hasData}
              >
                <AlertCircle className={`h-4 w-4 ${isDetecting ? "animate-pulse" : ""}`} />
                {isDetecting ? "Scanning..." : "Scan Anomalies"}
              </Button>
            )}
            <Button className="flex items-center gap-2" onClick={handleExportReport}>
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        }
      />

      <Card className="mb-6 bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">What this page answers</CardTitle>
          <CardDescription>Each section uses a different evidence set, so actual spend, alerts, forecasts, and savings are labelled separately.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-background p-3"><p className="flex items-center gap-2 text-sm font-semibold"><DollarSign className="h-4 w-4 text-blue-600" />What did we spend?</p><p className="mt-1 text-xs text-muted-foreground">Imported provider billing records, trends, and service/provider breakdowns.</p></div>
          <div className="rounded-lg border bg-background p-3"><p className="flex items-center gap-2 text-sm font-semibold"><BellRing className="h-4 w-4 text-amber-600" />Are we inside guardrails?</p><p className="mt-1 text-xs text-muted-foreground">Persistent thresholds and anomaly signals evaluated from stored cost history.</p></div>
          <div className="rounded-lg border bg-background p-3"><p className="flex items-center gap-2 text-sm font-semibold"><TrendingDown className="h-4 w-4 text-emerald-600" />What can we save?</p><p className="mt-1 text-xs text-muted-foreground">Deduplicated provider-native recommendations included in the authoritative savings total.</p></div>
        </CardContent>
      </Card>

      {overviewQuery.isError && (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium">Cost data could not be loaded.</p>
                <p className="text-sm text-muted-foreground">
                  {overviewQuery.error instanceof Error ? overviewQuery.error.message : "The cost API is unavailable."}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => overviewQuery.refetch()}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {!isLoadingOverview && !overviewQuery.isError && !overview?.dataStatus?.hasData && (
        <Card className="mb-6 border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex gap-4">
              <Database className="h-7 w-7 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">No cloud costs have been imported yet.</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  Connect a provider with billing-read access, then run Cost Sync. For AWS, the read role must allow
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5">ce:GetCostAndUsage</code>.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManageProviders && <Button asChild variant="outline"><Link href="/cloud-providers">Cloud providers</Link></Button>}
              {canManageProviders && <Button onClick={handleSync} disabled={isSyncing}>{isSyncing ? "Syncing..." : "Sync costs now"}</Button>}
            </div>
          </CardContent>
        </Card>
      )}

      {overview?.dataStatus?.hasData && (
        <Card className={`mb-6 ${costDataIsStale ? "border-amber-500/40" : "border-emerald-500/30"}`}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><CardTitle className="flex items-center gap-2 text-base"><Info className="h-4 w-4" />Billing evidence coverage</CardTitle><CardDescription className="mt-1">The dates and record types currently supporting charts, breakdowns, anomalies, and monitor evaluations.</CardDescription></div>
              <Badge variant={costDataIsStale ? "secondary" : "outline"}>{costDataIsStale ? "stale — sync recommended" : "current"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Billing window</p><p className="mt-1 text-sm font-semibold">{overview.dataStatus.firstCostDate ? new Date(`${overview.dataStatus.firstCostDate}T00:00:00`).toLocaleDateString() : "Unknown"} – {lastCostDate?.toLocaleDateString() ?? "Unknown"}</p></div>
            <div className="rounded-lg border p-3"><p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />Last imported</p><p className="mt-1 text-sm font-semibold">{overview.dataStatus.lastUpdatedAt ? new Date(overview.dataStatus.lastUpdatedAt).toLocaleString() : "Unknown"}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Aggregate evidence</p><p className="mt-1 text-xl font-semibold">{aggregateRecords.toLocaleString()}</p><p className="text-xs text-muted-foreground">provider/service totals</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Resource-attributed evidence</p><p className="mt-1 text-xl font-semibold">{attributedRecords.toLocaleString()}</p><p className="text-xs text-muted-foreground">used only in resource drill-downs</p></div>
          </CardContent>
        </Card>
      )}

      {syncDiagnostics.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Latest cost sync</CardTitle>
            <CardDescription>Provider results from the most recent import attempt</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {syncDiagnostics.map((result) => (
              <div key={result.provider} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-medium uppercase">{result.provider}</span>
                  <Badge variant={result.status === "failed" ? "destructive" : "outline"}>{result.status.replace(/_/g, " ")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{result.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {result.aggregateRecords ?? result.recordsStored} aggregate · {result.resourceRecords ?? 0} resource-attributed
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <OptimizationAnalysisHealth
        status={analysisStatusQuery.data}
        isLoading={analysisStatusQuery.isLoading}
        isError={analysisStatusQuery.isError}
        onRetry={() => analysisStatusQuery.refetch()}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Current month actual</CardDescription><CardTitle>{isLoadingOverview ? "—" : formatCurrency(currentSpend, costCurrency)}</CardTitle></CardHeader><CardContent><p className={`flex items-center text-xs ${spendChange > 0 ? "text-red-600" : spendChange < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>{spendChange > 0 ? <ArrowUpRight className="mr-1 h-3.5 w-3.5" /> : spendChange < 0 ? <TrendingDown className="mr-1 h-3.5 w-3.5" /> : null}{spendChange === 0 ? "No change" : `${Math.abs(spendChange).toFixed(1)}%`} vs previous comparable period</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Projected month end</CardDescription><CardTitle>{isLoadingOverview || projectedSpend <= 0 ? "Not available" : formatCurrency(projectedSpend, costCurrency)}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Simple run-rate: month-to-date daily average × {daysInMonth} days; not a provider invoice.</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Open anomaly signals</CardDescription><CardTitle>{overview?.anomalyCount ?? 0}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Unexpected patterns detected from imported history; not threshold monitors.</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Authoritative monthly savings</CardDescription><CardTitle>{formatCurrency(potentialSavings, savingsCurrency)}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">{optimizationTotal} recommendation{optimizationTotal === 1 ? "" : "s"}; only items included in the deduplicated total.</p></CardContent></Card>
      </div>

      <CostMonitorWidget layout="wide" className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Cost Trend Chart */}
        <div className="lg:col-span-2">
          <CostTrendChart
            timeframe={trendTimeframe}
            onTimeframeChange={setTrendTimeframe}
            currency={costCurrency}
            isLoading={isLoadingOverview}
            trendDataPoints={trends?.dataPoints}
          />
        </div>

        {/* Provider Breakdown */}
        <div>
          <CostProviderBreakdown
            data={overview?.byProvider || {}}
            totalCost={overview?.totalCost || 0}
            currency={costCurrency}
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
            optimizations={optimizations}
            total={optimizationTotal}
            isLoading={optimizationsQuery.isLoading}
            isError={optimizationsQuery.isError}
            isGenerating={isGenerating}
            updatingId={updateOptimization.variables?.id}
            canGenerate={canScan}
            analysisStatus={analysisStatusQuery.data}
            filters={optimizationFilters}
            page={optimizationPage}
            pageSize={optimizationPageSize}
            onFiltersChange={(filters) => {
              setOptimizationFilters(filters);
              setOptimizationPage(0);
            }}
            onPageChange={setOptimizationPage}
            onGenerate={handleGenerateOptimizations}
            onUpdate={handleUpdateOptimization}
            onRetry={() => optimizationsQuery.refetch()}
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
                  value={anomalyTimeframe}
                  onValueChange={(value) => setAnomalyTimeframe(value as ChartTimeframe)}
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
                    <TableHead>Status</TableHead>
                    {canScan && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anomaliesQuery.isLoading ? (
                    <>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: canScan ? 9 : 8 }).map((_, j) => (
                            <TableCell key={j}>
                              <div className="h-3 w-full rounded bg-muted animate-pulse" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </>
                  ) : anomaliesQuery.isError ? (
                    <TableRow>
                      <TableCell colSpan={canScan ? 9 : 8} className="h-24 text-center">
                        <div className="space-y-3">
                          <p>Cost anomalies could not be loaded.</p>
                          <Button variant="outline" size="sm" onClick={() => anomaliesQuery.refetch()}>Retry</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredAnomalies.length > 0 ? (
                    filteredAnomalies.map((anomaly) => (
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
                            {anomaly.deviation.toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(anomaly.expectedCost, costCurrency)}</TableCell>
                        <TableCell>{formatCurrency(anomaly.actualCost, costCurrency)}</TableCell>
                        <TableCell>{new Date(anomaly.detectedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-opacity-10 ${anomaly.status === "open" ? "bg-warning text-warning" : "bg-green-500 text-green-700"
                            }`}>
                            {anomaly.status}
                          </span>
                        </TableCell>
                        {canScan && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {anomaly.status === 'open' && (
                                <Button variant="outline" size="sm" onClick={() => handleUpdateAnomaly(anomaly.id, 'reviewed')} disabled={updateAnomaly.isPending}>Review</Button>
                              )}
                              {anomaly.status !== 'resolved' && (
                                <Button variant="outline" size="sm" onClick={() => handleUpdateAnomaly(anomaly.id, 'resolved')} disabled={updateAnomaly.isPending}>Resolve</Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={canScan ? 9 : 8} className="h-24 text-center">
                        No cost anomalies detected in this timeframe.
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
                      <TableCell>{formatCurrency(service.cost, costCurrency)}</TableCell>
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
