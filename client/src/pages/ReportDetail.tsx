import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { DashboardLayout } from "@/layouts/DashboardLayout";

import {
  Loader2,
  ArrowLeft,
  Shield,
  Server,
  AlertTriangle,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Search,
  Cloud,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Report = {
  id: number;
  status: string;
  resourceCount: number;
  driftCount: number;
  securityScore: number;
  startedAt: string;
  completedAt: string | null;
  providers: string[];
  reportData: any;
};

// ─── Security Score Gauge ──────────────────────────────────────────
function SecurityGauge({ score }: { score: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score > 80
      ? "stroke-green-500"
      : score >= 50
        ? "stroke-yellow-500"
        : "stroke-red-500";
  const textColor =
    score > 80
      ? "text-green-500"
      : score >= 50
        ? "text-yellow-500"
        : "text-red-500";

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-gray-200 dark:text-gray-800"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className={cn("transition-all duration-1000", color)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-4xl font-bold", textColor)}>{score}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  color = "from-blue-500 to-blue-600",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white shadow-lg", color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Severity Badge ────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", styles[severity?.toLowerCase()] || styles.low)}>
      {severity || "low"}
    </Badge>
  );
}

export default function ReportDetail() {
  const [location] = useLocation();
  const reportId = useMemo(() => {
    const parts = location.split("/");
    return parts[2] || "";
  }, [location]);

  const [resourceSearch, setResourceSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  const {
    data: report,
    isLoading,
    error,
  } = useQuery<Report>({
    queryKey: [`/api/reports/${reportId}`],
    enabled: !!reportId,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !report) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Link href="/reports">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Reports
            </Button>
          </Link>
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">
                  {error ? (error as Error).message : "Report not found"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Parse report_data
  const reportData =
    typeof report.reportData === "string"
      ? JSON.parse(report.reportData)
      : report.reportData || {};

  const resources: any[] = reportData.resources || [];
  const drifts: any[] = reportData.drifts || [];
  const costData = reportData.cost || {};

  // Filter resources
  const filteredResources = resources.filter((r: any) => {
    if (!resourceSearch) return true;
    const q = resourceSearch.toLowerCase();
    return (
      (r.name || "").toLowerCase().includes(q) ||
      (r.type || "").toLowerCase().includes(q) ||
      (r.provider || "").toLowerCase().includes(q) ||
      (r.region || "").toLowerCase().includes(q)
    );
  });

  // Filter drifts
  const filteredDrifts = drifts.filter((d: any) => {
    if (!severityFilter) return true;
    return (d.severity || "low").toLowerCase() === severityFilter;
  });

  // Severity counts
  const severityCounts = drifts.reduce(
    (acc: Record<string, number>, d: any) => {
      const sev = (d.severity || "low").toLowerCase();
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Duration
  const duration =
    report.startedAt && report.completedAt
      ? Math.round(
          (new Date(report.completedAt).getTime() -
            new Date(report.startedAt).getTime()) /
            1000
        )
      : null;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/reports">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Report #{report.id}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Started {new Date(report.startedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4" />
            Download as PDF
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="summary" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-1.5">
              <Server className="h-3.5 w-3.5" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Security & Drift
            </TabsTrigger>
            <TabsTrigger value="cost" className="gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Cost
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Executive Summary ── */}
          <TabsContent value="summary" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score Gauge */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Security Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <SecurityGauge score={report.securityScore ?? 0} />
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                <StatCard
                  icon={Server}
                  label="Total Resources"
                  value={report.resourceCount ?? 0}
                  color="from-blue-500 to-blue-600"
                />
                <StatCard
                  icon={AlertTriangle}
                  label="Total Drifts"
                  value={report.driftCount ?? 0}
                  color="from-orange-500 to-orange-600"
                />
                <StatCard
                  icon={XCircle}
                  label="Critical / High"
                  value={`${severityCounts.critical || 0} / ${severityCounts.high || 0}`}
                  color="from-red-500 to-red-600"
                />
                <StatCard
                  icon={AlertTriangle}
                  label="Medium / Low"
                  value={`${severityCounts.medium || 0} / ${severityCounts.low || 0}`}
                  color="from-yellow-500 to-yellow-600"
                />
              </div>
            </div>

            {/* Duration and providers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {duration != null && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Scan Duration</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatDuration(duration)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {report.providers && report.providers.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                        <Cloud className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Providers</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {report.providers.map((p) => (
                            <Badge key={p} variant="secondary" className="capitalize">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── Tab 2: Resource Inventory ── */}
          <TabsContent value="resources" className="space-y-4 mt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search resources..."
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredResources.length} resources
              </span>
            </div>

            {filteredResources.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {resources.length === 0 ? "No resource data in this report." : "No resources match your search."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResources.map((r: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <TableCell className="font-medium text-gray-900 dark:text-white">
                            {r.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {r.type || "unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize text-gray-600 dark:text-gray-400">
                            {r.provider || "N/A"}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {r.region || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "capitalize",
                                (r.status || "").toLowerCase() === "running" || (r.status || "").toLowerCase() === "active"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                              )}
                            >
                              {r.status || "unknown"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* ── Tab 3: Security & Drift Analysis ── */}
          <TabsContent value="security" className="space-y-4 mt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                Filter by severity:
              </span>
              <Button
                variant={severityFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSeverityFilter(null)}
              >
                All ({drifts.length})
              </Button>
              {["critical", "high", "medium", "low"].map((sev) => (
                <Button
                  key={sev}
                  variant={severityFilter === sev ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSeverityFilter(sev)}
                  className="capitalize"
                >
                  {sev} ({severityCounts[sev] || 0})
                </Button>
              ))}
            </div>

            {filteredDrifts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-green-500" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {drifts.length === 0 ? "No drifts detected in this scan." : "No drifts match the selected filter."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredDrifts.map((drift: any, idx: number) => (
                  <Card key={idx} className="hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <SeverityBadge severity={drift.severity} />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {drift.resourceName || drift.resource || "Unknown Resource"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium">Type:</span> {drift.driftType || drift.type || "configuration"}
                          </p>
                          {drift.details && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {drift.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Tab 4: Cost Summary ── */}
          <TabsContent value="cost" className="space-y-6 mt-6">
            {/* Total monthly estimate */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Monthly Estimate
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${(costData.totalMonthly ?? costData.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Provider breakdown */}
            {costData.byProvider && Object.keys(costData.byProvider).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Cost by Provider
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(costData.byProvider).map(([provider, amount]: [string, any]) => (
                    <Card key={provider}>
                      <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                            <Cloud className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{provider}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Top expensive resources */}
            {costData.topResources && costData.topResources.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Expensive Resources
                </h3>
                <Card>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                          <TableHead>Resource</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Monthly Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costData.topResources.map((res: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium text-gray-900 dark:text-white">
                              {res.name}
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {res.type}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ${Number(res.cost || res.monthlyCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            )}

            {/* Empty state for cost */}
            {!costData.totalMonthly && !costData.total && !costData.byProvider && (
              <Card>
                <CardContent className="py-12 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No cost data available for this report.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          nav, aside, header, footer, button, .no-print { display: none !important; }
          body { background: white !important; }
          * { color: black !important; border-color: #e5e7eb !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}
