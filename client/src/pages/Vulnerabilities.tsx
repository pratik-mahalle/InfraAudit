import { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useVulnerabilities, useVulnerabilitySummary, useTopVulnerabilities, useTriggerVulnerabilityScan } from "@/hooks/use-vulnerabilities";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Lock, ShieldAlert, Bug, Search, Loader2, Zap, AlertTriangle, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vulnerability } from "@/lib/api";

export default function Vulnerabilities() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: vulnsResponse, isLoading } = useVulnerabilities();
  const { data: summary } = useVulnerabilitySummary();
  const { data: topVulns } = useTopVulnerabilities();
  const scanMutation = useTriggerVulnerabilityScan();

  const vulnerabilities: Vulnerability[] = Array.isArray(vulnsResponse) ? vulnsResponse : (vulnsResponse?.data || []);

  const filtered = vulnerabilities.filter(v => {
    if (severityFilter !== "all" && v.severity !== severityFilter) return false;
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (search && !v.title?.toLowerCase().includes(search.toLowerCase()) && !v.cveId?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const severityColors: Record<string, string> = {
    critical: "bg-red-500/10 text-red-600 border-red-500/30",
    high: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    low: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  };

  const statusColors: Record<string, string> = {
    open: "bg-red-500/10 text-red-600 border-red-500/30",
    fixed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    ignored: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  };

  const bySeverity = (summary as any)?.by_severity || summary;
  const criticalCount = bySeverity?.critical ?? vulnerabilities.filter(v => v.severity === "critical").length;
  const highCount = bySeverity?.high ?? vulnerabilities.filter(v => v.severity === "high").length;
  const openCount = vulnerabilities.filter(v => v.status === "open").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vulnerabilities</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Scan and manage security vulnerabilities across your infrastructure
            </p>
          </div>
          <Button
            onClick={() => scanMutation.mutate(undefined, {
              onSuccess: () => toast({ title: "Scan Started", description: "Vulnerability scan initiated..." }),
              onError: () => toast({ title: "Scan Failed", description: "Could not start vulnerability scan.", variant: "destructive" }),
            })}
            disabled={scanMutation.isPending}
            className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
          >
            {scanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Run Vulnerability Scan
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 w-fit mb-3"><Bug className="h-5 w-5" /></div>
              <div className="text-2xl font-bold">{vulnerabilities.length}</div>
              <div className="text-sm text-gray-500">Total Vulnerabilities</div>
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
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 w-fit mb-3"><Lock className="h-5 w-5" /></div>
              <div className="text-2xl font-bold">{openCount}</div>
              <div className="text-sm text-gray-500">Open / Unresolved</div>
            </CardContent>
          </Card>
        </div>

        {/* Top Vulnerabilities Highlight */}
        {topVulns && topVulns.length > 0 && (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Top Vulnerabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {topVulns.slice(0, 3).map((v: any) => (
                  <div key={v.id} className="p-3 rounded-lg border border-red-500/20 bg-white dark:bg-slate-900">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{v.title}</span>
                      <Badge variant="outline" className={cn("text-xs ml-2 shrink-0", severityColors[v.severity])}>{v.severity}</Badge>
                    </div>
                    {v.cveId && (
                      <a href={`https://nvd.nist.gov/vuln/detail/${v.cveId}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                        {v.cveId} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{v.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by title or CVE..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="ignored">Ignored</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Vulnerabilities</CardTitle>
            <CardDescription>{filtered.length} vulnerabilit{filtered.length !== 1 ? "ies" : "y"} found</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Lock className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-medium text-gray-500">No vulnerabilities found</p>
                <p className="text-xs text-gray-400 mt-1">Run a vulnerability scan to check your infrastructure</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vulnerability</TableHead>
                    <TableHead>CVE</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Detected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(v => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="max-w-sm">
                          <div className="font-medium text-gray-900 dark:text-white">{v.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{v.description}</div>
                          {v.remediation && (
                            <div className="text-xs text-blue-500 mt-0.5 line-clamp-1">Fix: {v.remediation}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {v.cveId ? (
                          <a href={`https://nvd.nist.gov/vuln/detail/${v.cveId}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                            {v.cveId} <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", severityColors[v.severity])}>{v.severity}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", statusColors[v.status])}>{v.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">Resource #{v.resourceId}</TableCell>
                      <TableCell className="text-xs text-gray-500">{new Date(v.detectedAt).toLocaleDateString()}</TableCell>
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
