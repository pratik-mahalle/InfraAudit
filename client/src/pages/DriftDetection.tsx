import React, { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useDrifts, useDriftSummary, useTriggerDriftDetection, useResolveDrift, useAcknowledgeDrift } from "@/hooks/use-drifts";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Shield, ShieldAlert, ShieldCheck, Search, Loader2, Zap, CheckCircle2, Eye, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriftDetection() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: driftsResponse, isLoading } = useDrifts();
  const { data: summary } = useDriftSummary();
  const detectMutation = useTriggerDriftDetection();
  const resolveMutation = useResolveDrift();
  const acknowledgeMutation = useAcknowledgeDrift();

  const drifts = Array.isArray(driftsResponse) ? driftsResponse : (driftsResponse?.data || []);

  const filtered = drifts.filter((d: any) => {
    if (severityFilter !== "all" && d.severity !== severityFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search && !d.driftType?.toLowerCase().includes(search.toLowerCase()) && !d.fieldChanged?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const driftTypeLabels: Record<string, string> = {
    configuration_change: "Config Change",
    security_group: "Security Group",
    iam_policy: "IAM Policy",
    network_rule: "Network Rule",
    encryption: "Encryption",
    compliance: "Compliance",
    k8s_deployment: "K8s Deployment",
    k8s_image_change: "K8s Image Change",
  };

  const severityColors: Record<string, string> = {
    critical: "bg-red-500/10 text-red-600 border-red-500/30",
    high: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    low: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  };

  const statusColors: Record<string, string> = {
    detected: "bg-red-500/10 text-red-600 border-red-500/30",
    acknowledged: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    approved: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  };

  const totalDrifts = summary?.total ?? drifts.length;
  const criticalCount = summary?.critical ?? drifts.filter((d: any) => d.severity === "critical").length;
  const highCount = summary?.high ?? drifts.filter((d: any) => d.severity === "high").length;
  const resolvedCount = drifts.filter((d: any) => d.status === "resolved").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Drift Detection</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monitor and manage infrastructure configuration drifts
            </p>
          </div>
          <Button
            onClick={() => detectMutation.mutate(undefined, {
              onSuccess: () => toast({ title: "Scan Started", description: "Detecting configuration drifts..." }),
              onError: () => toast({ title: "Scan Failed", description: "Could not start drift detection.", variant: "destructive" }),
            })}
            disabled={detectMutation.isPending}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            {detectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Run Drift Scan
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 w-fit mb-3"><Shield className="h-5 w-5" /></div>
              <div className="text-2xl font-bold">{totalDrifts}</div>
              <div className="text-sm text-gray-500">Total Drifts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-600 w-fit mb-3"><ShieldAlert className="h-5 w-5" /></div>
              <div className="text-2xl font-bold">{criticalCount}</div>
              <div className="text-sm text-gray-500">Critical</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 w-fit mb-3"><AlertTriangle className="h-5 w-5" /></div>
              <div className="text-2xl font-bold">{highCount}</div>
              <div className="text-sm text-gray-500">High Severity</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 w-fit mb-3"><ShieldCheck className="h-5 w-5" /></div>
              <div className="text-2xl font-bold">{resolvedCount}</div>
              <div className="text-sm text-gray-500">Resolved</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search drifts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="detected">Detected</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Drifts</CardTitle>
            <CardDescription>{filtered.length} drift{filtered.length !== 1 ? "s" : ""} found</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShieldCheck className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-medium text-gray-500">No drifts detected</p>
                <p className="text-xs text-gray-400 mt-1">Run a drift scan to check your infrastructure configuration</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drift Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((drift: any) => (
                    <React.Fragment key={drift.id}>
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {driftTypeLabels[drift.driftType] || drift.driftType || "Configuration Drift"}
                          </span>
                          {drift.details?.cve_summary && drift.details.cve_summary.critical > 0 && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              {drift.details.cve_summary.critical} Critical CVE{drift.details.cve_summary.critical > 1 ? "s" : ""}
                            </Badge>
                          )}
                          {drift.details?.cve_summary && drift.details.cve_summary.critical === 0 && drift.details.cve_summary.high > 0 && (
                            <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-[10px] px-1.5 py-0">
                              {drift.details.cve_summary.high} High CVE{drift.details.cve_summary.high > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        {drift.fieldChanged && <div className="text-xs text-gray-500 mt-0.5">Field: {drift.fieldChanged}</div>}
                        {drift.details?.namespace && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {drift.details.namespace}/{drift.details.deployment} on {drift.details.cluster}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", severityColors[drift.severity] || "")}>
                          {drift.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", statusColors[drift.status] || "")}>
                          {drift.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        Resource #{drift.resourceId}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {drift.detectedAt ? new Date(drift.detectedAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {drift.details?.cve_summary && (
                            <Button variant="ghost" size="sm"
                              onClick={() => setExpandedId(expandedId === drift.id ? null : drift.id)}
                            >
                              <ShieldAlert className={cn("h-4 w-4", expandedId === drift.id ? "text-blue-600" : "text-gray-400")} />
                            </Button>
                          )}
                          {drift.status !== "resolved" && (
                            <>
                              {drift.status === "detected" && (
                                <Button variant="ghost" size="sm"
                                  onClick={() => acknowledgeMutation.mutate(drift.id, {
                                    onSuccess: () => toast({ title: "Acknowledged", description: "Drift has been acknowledged." }),
                                  })}
                                  disabled={acknowledgeMutation.isPending}
                                >
                                  <Eye className="h-4 w-4 text-amber-500" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm"
                                onClick={() => resolveMutation.mutate(drift.id, {
                                  onSuccess: () => toast({ title: "Resolved", description: "Drift has been resolved." }),
                                })}
                                disabled={resolveMutation.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === drift.id && drift.details?.cve_summary && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50 dark:bg-gray-900/50 p-0">
                          <div className="p-4">
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                              <div className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                                CVE Report: {drift.details.cve_summary.image}
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                                <div><span className="font-bold text-red-600">{drift.details.cve_summary.critical}</span> Critical</div>
                                <div><span className="font-bold text-orange-600">{drift.details.cve_summary.high}</span> High</div>
                                <div><span className="font-bold text-amber-600">{drift.details.cve_summary.medium}</span> Medium</div>
                                <div><span className="font-bold text-blue-600">{drift.details.cve_summary.low}</span> Low</div>
                              </div>
                              {drift.details.cve_summary.top_cves?.length > 0 && (
                                <div className="space-y-1 border-t border-red-200 dark:border-red-800 pt-2">
                                  {drift.details.cve_summary.top_cves.map((cve: any) => (
                                    <div key={cve.id} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                      <Badge variant="outline" className={cn("text-[10px] px-1 py-0",
                                        cve.severity === "critical" ? "border-red-400 text-red-600" : "border-orange-400 text-orange-600"
                                      )}>
                                        {cve.severity}
                                      </Badge>
                                      <span className="font-mono font-medium">{cve.id}</span>
                                      <span className="truncate">{cve.title || cve.package}</span>
                                      {cve.fixed && <span className="text-green-600 shrink-0">(fix: {cve.fixed})</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
