import { AlertCircle, AlertTriangle, CalendarClock, CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import type { OptimizationAnalysisStatus, OptimizationSourceResult } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizationAnalysisHealthProps {
  status?: OptimizationAnalysisStatus;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function statusIcon(status?: OptimizationAnalysisStatus) {
  if (status?.isStale) return <Clock3 className="h-5 w-5 text-amber-600" />;
  if (status?.latestRun?.status === "completed") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (status?.latestRun?.status === "partial") return <AlertTriangle className="h-5 w-5 text-amber-600" />;
  return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
}

function sourceBadgeVariant(source: OptimizationSourceResult) {
  if (source.status === "available") return "outline" as const;
  if (source.status === "missing_permission" || source.status === "unavailable") return "destructive" as const;
  return "secondary" as const;
}

export function OptimizationAnalysisHealth({ status, isLoading, isError, onRetry }: OptimizationAnalysisHealthProps) {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader><Skeleton className="h-6 w-64" /><Skeleton className="h-4 w-96 max-w-full" /></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="mb-6 border-destructive/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-start gap-3"><ShieldAlert className="h-5 w-5 text-destructive" /><div><p className="font-medium">Recommendation source health could not be loaded.</p><p className="text-sm text-muted-foreground">Existing recommendations remain visible, but their freshness cannot be confirmed.</p></div></div>
          <Button variant="outline" onClick={onRetry}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!status?.latestRun) {
    return (
      <Card className="mb-6 border-blue-500/30 bg-blue-500/5">
        <CardContent className="flex items-start gap-3 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
          <div><p className="font-medium">AWS optimization analysis is ready to run.</p><p className="text-sm text-muted-foreground">Run Analyze savings to check Cost Optimization Hub enrollment and permissions, or use the evidence-backed fallback on the first pass.</p></div>
        </CardContent>
      </Card>
    );
  }

  const run = status.latestRun;
  const notEnrolled = run.sourceCoverage?.some(source => source.status === "not_enrolled");
  const missingPermissions = status.missingPermissions ?? [];

  return (
    <Card className={`mb-6 ${status.isStale || run.status === "partial" ? "border-amber-500/40" : "border-emerald-500/30"}`}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">{statusIcon(status)} AWS recommendation source health</CardTitle>
            <CardDescription className="mt-1">
              {notEnrolled
                ? "Cost Optimization Hub is not enrolled; first-run Cost Explorer and inventory fallbacks remain available."
                : status.isStale
                  ? "The last authoritative Hub findings are retained as stale. Fallback duplicates were not introduced."
                  : run.message}
            </CardDescription>
          </div>
          <Badge variant={run.status === "completed" ? "outline" : "secondary"}>{status.isStale ? "stale" : run.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Authoritative monthly savings</p><p className="mt-1 text-xl font-semibold">{formatCurrency(status.authoritativeSavings, status.currency || "USD")}</p></div>
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Evaluated findings</p><p className="mt-1 text-xl font-semibold">{status.evaluatedFindings}</p></div>
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Last successful analysis</p><p className="mt-1 text-sm font-medium">{status.lastSuccessfulAnalysis ? new Date(status.lastSuccessfulAnalysis).toLocaleString() : "No completed run"}</p></div>
          <div className="rounded-lg border p-3"><p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />Next scheduled run</p><p className="mt-1 text-sm font-medium">{status.nextScheduledRun ? new Date(status.nextScheduledRun).toLocaleString() : "No enabled cost schedule"}</p></div>
        </div>

        {missingPermissions.length > 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
            <p className="font-medium text-amber-800 dark:text-amber-300">Missing read permissions</p>
            <div className="mt-2 flex flex-wrap gap-2">{missingPermissions.map(permission => <code key={permission} className="rounded bg-muted px-2 py-1 text-xs">{permission}</code>)}</div>
          </div>
        )}

        {run.sourceCoverage?.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {run.sourceCoverage.map(source => (
              <div key={`${source.source}-${source.id || source.status}`} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2"><span className="font-medium">{source.source.replace(/_/g, " ")}</span><Badge variant={sourceBadgeVariant(source)}>{source.status.replace(/_/g, " ")}</Badge></div>
                <p className="mt-2 text-sm text-muted-foreground">{source.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{source.findings} findings{source.stale ? " · retained stale" : ""}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
