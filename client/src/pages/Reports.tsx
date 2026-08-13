import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useScan } from "@/hooks/use-scan";
import { DashboardLayout } from "@/layouts/DashboardLayout";

import {
  Loader2,
  Plus,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  AlertTriangle,
  Server,
  RefreshCw,
  Ban,
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Report = {
  id: number;
  status: string;
  queueJobId?: number | null;
  stage?: string;
  progressPercent?: number;
  totalResources: number;
  totalDrifts: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  startedAt: string;
  completedAt: string | null;
  reportData: any;
  errorMessage?: string;
  createdAt: string;
};

const formatStage = (stage?: string) =>
  (stage || "queued")
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

function SecurityScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <Badge variant="secondary">N/A</Badge>;
  const color =
    score > 80
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : score >= 50
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return (
    <Badge variant="outline" className={cn("font-semibold", color)}>
      {score}%
    </Badge>
  );
}

function StatusBadge({ status, stage }: { status: string; stage?: string }) {
  if (status === "running") {
    return (
      <Badge variant="outline" className="gap-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        {formatStage(stage)}
      </Badge>
    );
  }
  if (status === "completed") {
    return (
      <Badge variant="outline" className="gap-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </Badge>
    );
  }
  if (status === "cancelled") {
    return (
      <Badge variant="outline" className="gap-1.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <Ban className="h-3 w-3" />
        Cancelled
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle className="h-3 w-3" />
      Failed
    </Badge>
  );
}

export default function Reports() {
  const { toast } = useToast();
  const { startScan, isScanning } = useScan();

  const {
    data: reports = [],
    isLoading,
    error,
  } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    select: (data) => (Array.isArray(data) ? data : []),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Report deleted", description: "The report has been removed." });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/reports/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Report cancelled", description: "The queued report generation was cancelled." });
    },
    onError: (err: Error) => {
      toast({ title: "Cancel failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Scan Reports
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              View infrastructure scan results and security assessments.
            </p>
          </div>
          <Button
            onClick={() => startScan()}
            disabled={isScanning}
            className="gap-2"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                New Scan
              </>
            )}
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Error loading reports</p>
                  <p className="text-sm opacity-80">{(error as Error).message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 mb-6">
                  <FileText className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No reports yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
                  Run your first infrastructure scan to generate a security and drift report.
                </p>
                <Button onClick={() => startScan()} disabled={isScanning} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Run First Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reports.map((report) => (
              <Link key={report.id} href={`/reports/${report.id}`}>
                <Card className="group cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={report.status} stage={report.stage} />
                      <SecurityScoreBadge score={report.reportData?.security_score} />
                    </div>
                    <CardTitle className="text-base mt-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Report #{report.id}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(report.startedAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5" />
                        {report.totalResources ?? 0} resources
                      </span>
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {report.totalDrifts ?? 0} drifts
                      </span>
                    </div>

                    {report.status === "running" && (
                      <div className="mt-4 space-y-1.5">
                        <Progress value={report.progressPercent ?? 0} className="h-1.5" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatStage(report.stage)} - {report.progressPercent ?? 0}%
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end gap-1">
                      {report.status === "running" && report.queueJobId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={cancelMutation.isPending}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            cancelMutation.mutate(report.id);
                          }}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (confirm("Delete this report?")) {
                            deleteMutation.mutate(report.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
