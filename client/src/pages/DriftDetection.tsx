import { useState } from "react";
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
                    <TableRow key={drift.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-white">{drift.driftType || "Configuration Drift"}</div>
                        {drift.fieldChanged && <div className="text-xs text-gray-500 mt-0.5">Field: {drift.fieldChanged}</div>}
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
                        {drift.status !== "resolved" && (
                          <div className="flex items-center justify-end gap-1">
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
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
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
