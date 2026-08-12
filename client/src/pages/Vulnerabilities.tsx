import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  FileSearch,
  FileWarning,
  Loader2,
  PackageCheck,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useTopVulnerabilities,
  useTriggerVulnerabilityScan,
} from "@/hooks/use-vulnerabilities";
import { useFindings, useUpdateFindingStatus } from "@/hooks/use-findings";
import { isTerminalQueueState, useQueueJobStatus } from "@/hooks/use-queue-job";
import { useToast } from "@/hooks/use-toast";
import type { Finding, FindingStatus, Vulnerability } from "@/lib/api";
import { FindingDetailPanel, FindingRow, formatFindingLabel } from "@/components/findings/finding-ui";
import {
  EmptyPanel,
  FilterToolbar,
  MetricTile,
  ToneBadge,
} from "@/components/security-ops/ops-ui";

const severityOptions = [
  { value: "all", label: "All severity" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const statusOptions = [
  { value: "all", label: "All status" },
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "accepted", label: "Accepted risk" },
  { value: "false_positive", label: "False positive" },
  { value: "ignored", label: "Ignored" },
];

const vulnerabilityFindingTypes = new Set(["cve", "vulnerability", "misconfiguration", "exposure"]);

function scanJobDescription(status?: string, lastError?: string) {
  switch (status) {
    case "available":
    case "pending":
    case "scheduled":
      return "The scan is queued and waiting for a worker.";
    case "running":
      return "The scanner is checking packages, images, and resources.";
    case "retryable":
      return lastError ? `The scan will retry after an error: ${lastError}` : "The scan will retry after an error.";
    case "completed":
      return "The scan completed. Vulnerability data is refreshing.";
    case "discarded":
      return lastError ? `The scan failed permanently: ${lastError}` : "The scan failed permanently.";
    case "cancelled":
      return "The scan was cancelled.";
    default:
      return "Waiting for the scan job to report status.";
  }
}

export default function Vulnerabilities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [scanJobId, setScanJobId] = useState<number | null>(null);
  const [notifiedScanJobStatus, setNotifiedScanJobStatus] = useState<string | null>(null);

  const findingParams = useMemo(
    () => ({
      page: 1,
      pageSize: 100,
      severity: severityFilter === "all" ? undefined : severityFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [severityFilter, statusFilter],
  );

  const { data: findingsResponse, isLoading } = useFindings(findingParams);
  const { data: topVulns = [] } = useTopVulnerabilities();
  const scanMutation = useTriggerVulnerabilityScan();
  const updateFindingStatus = useUpdateFindingStatus();
  const { data: scanJobStatus, error: scanJobStatusError, isFetching: isFetchingScanJob } = useQueueJobStatus(scanJobId);

  const findings = useMemo(
    () => (findingsResponse?.data ?? []).filter((finding) => vulnerabilityFindingTypes.has(String(finding.findingType).toLowerCase())),
    [findingsResponse?.data],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return findings.filter((finding) => {
      const haystack = [
        finding.title,
        finding.description,
        finding.resourceId,
        finding.resourceType,
        finding.provider,
        finding.ruleId,
        finding.externalId,
        finding.scannerType,
        finding.sourceType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return !query || haystack.includes(query);
    });
  }, [findings, search]);

  const selectedFinding = filtered.find((item) => item.id === selectedFindingId) ?? filtered[0] ?? null;
  const criticalCount = findings.filter((item) => item.severity === "critical").length;
  const highCount = findings.filter((item) => item.severity === "high").length;
  const openCount = findings.filter((item) => item.status === "open").length;
  const fixableCount = findings.filter((item) => item.remediation && item.status === "open").length;
  const activeScanJobStatus = scanJobStatus?.status ?? (scanJobId ? "available" : undefined);
  const scanJobIsActive = !!scanJobId && !scanJobStatusError && !isTerminalQueueState(activeScanJobStatus);

  const selectLegacyVulnerability = (vulnerability: Vulnerability) => {
    const cve = vulnerability.cveId ?? vulnerability.vulnerabilityId;
    const matchingFinding = findings.find((finding) => {
      const target = `${finding.externalId ?? ""} ${finding.ruleId ?? ""} ${finding.title}`.toLowerCase();
      return cve ? target.includes(cve.toLowerCase()) : target.includes(vulnerability.title.toLowerCase());
    });

    if (matchingFinding) {
      setSelectedFindingId(matchingFinding.id);
    } else {
      setSearch(cve ?? vulnerability.title);
    }
  };

  const updateSelectedFindingStatus = (status: FindingStatus) => {
    if (!selectedFinding) return;
    updateFindingStatus.mutate(
      { id: selectedFinding.id, status },
      {
        onSuccess: () => toast({ title: "Finding updated", description: `Status changed to ${formatFindingLabel(status)}.` }),
        onError: (error: Error) => toast({ title: "Could not update finding", description: error.message, variant: "destructive" }),
      },
    );
  };

  useEffect(() => {
    if (!scanJobStatus || !isTerminalQueueState(scanJobStatus.status)) return;

    const notificationKey = `${scanJobStatus.id}:${scanJobStatus.status}`;
    if (notifiedScanJobStatus === notificationKey) return;
    setNotifiedScanJobStatus(notificationKey);
    queryClient.invalidateQueries({ queryKey: ["vulnerabilities"] });

    if (scanJobStatus.status === "completed") {
      toast({ title: "Vulnerability scan complete", description: "Findings and remediation queues are refreshing." });
    } else {
      toast({
        title: "Vulnerability scan did not complete",
        description: scanJobStatus.lastError || scanJobDescription(scanJobStatus.status),
        variant: "destructive",
      });
    }
  }, [notifiedScanJobStatus, queryClient, scanJobStatus, toast]);

  const runScan = () => {
    scanMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.jobId) {
          setScanJobId(result.jobId);
          setNotifiedScanJobStatus(null);
          toast({
            title: result.duplicate ? "Vulnerability scan already queued" : "Vulnerability scan queued",
            description: `Job #${result.jobId} is running on the ${result.queue ?? "scan"} queue.`,
          });
          return;
        }

        setScanJobId(null);
        toast({ title: "Vulnerability scan started", description: "InfraAudit is checking packages, images, and resources." });
      },
      onError: (error: Error) => toast({ title: "Scan failed", description: error.message || "Could not start vulnerability scan.", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Vulnerability Remediation"
        description="Prioritize CVEs, exposures, and vulnerable configuration findings with evidence-backed remediation detail."
        actions={
          <Button onClick={runScan} disabled={scanMutation.isPending || scanJobIsActive} className="gap-2">
            {scanMutation.isPending || scanJobIsActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Run Vulnerability Scan
          </Button>
        }
      />

      {scanJobId && (
        <Card className="mb-6 rounded-lg border-primary/20">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {scanJobIsActive || isFetchingScanJob ? (
                <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-primary" />
              ) : scanJobStatus?.status === "completed" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">Vulnerability scan job #{scanJobId}</p>
                  <ToneBadge value={activeScanJobStatus ?? "queued"} tone={scanJobStatus?.status === "completed" ? "emerald" : scanJobStatus?.status === "discarded" ? "red" : "blue"} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {scanJobStatusError instanceof Error ? scanJobStatusError.message : scanJobDescription(activeScanJobStatus, scanJobStatus?.lastError)}
                </p>
              </div>
            </div>
            {scanJobStatus?.attempt !== undefined && (
              <p className="text-xs text-muted-foreground">
                Attempt {scanJobStatus.attempt}/{scanJobStatus.maxAttempts}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={Bug} label="Open findings" value={openCount} tone="red" helper={`${findings.length} vulnerability-domain findings`} />
        <MetricTile icon={ShieldAlert} label="Critical" value={criticalCount} tone="red" helper="Highest priority" />
        <MetricTile icon={AlertTriangle} label="High" value={highCount} tone="orange" helper="Patch planning" />
        <MetricTile icon={PackageCheck} label="Fix guidance" value={fixableCount} tone="emerald" helper="Open findings with remediation" />
      </div>

      {topVulns.length > 0 && (
        <Card className="mt-6 rounded-lg border-red-500/20">
          <CardHeader>
            <CardTitle>Highest Risk CVEs</CardTitle>
            <CardDescription>Quick access to the most important vulnerabilities returned by the scanner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 lg:grid-cols-3">
              {topVulns.slice(0, 3).map((vulnerability) => (
                <button
                  key={vulnerability.id}
                  type="button"
                  onClick={() => selectLegacyVulnerability(vulnerability)}
                  className="rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="mb-3 flex flex-wrap gap-2">
                    <ToneBadge value={vulnerability.severity} />
                    <ToneBadge value={vulnerability.status} />
                  </div>
                  <h3 className="line-clamp-1 text-sm font-semibold">{vulnerability.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{vulnerability.description}</p>
                  {vulnerability.cveId && <p className="mt-3 font-mono text-xs text-primary">{vulnerability.cveId}</p>}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <FilterToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search CVE, rule, resource, scanner, description..."
          filters={[
            { value: severityFilter, onChange: setSeverityFilter, placeholder: "Severity", options: severityOptions },
            { value: statusFilter, onChange: setStatusFilter, placeholder: "Status", options: statusOptions },
          ]}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Remediation Queue</CardTitle>
            <CardDescription>{filtered.length} evidence-backed findings match the current view</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyPanel icon={FileWarning} title="Loading findings" description="Fetching normalized vulnerability and exposure findings." />
            ) : filtered.length === 0 ? (
              <EmptyPanel icon={PackageCheck} title="No findings in this view" description="Change filters or run a scan to refresh vulnerability coverage." />
            ) : (
              <div className="divide-y rounded-lg border">
                {filtered.map((finding: Finding) => (
                  <FindingRow
                    key={finding.id}
                    finding={finding}
                    selected={selectedFinding?.id === finding.id}
                    onSelect={() => setSelectedFindingId(finding.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Finding Detail</CardTitle>
            <CardDescription>Evidence, source, lifecycle, and remediation context</CardDescription>
          </CardHeader>
          <CardContent>
            <FindingDetailPanel
              finding={selectedFinding}
              onStatusChange={updateSelectedFindingStatus}
              isStatusPending={updateFindingStatus.isPending}
            />
            {selectedFinding && (
              <div className="mt-5 rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                  <FileSearch className="h-4 w-4" />
                  Triage Step
                </div>
                <p className="text-sm text-muted-foreground">
                  Validate the affected package, image, resource, or exposure path, apply the remediation, then rerun the scan to confirm the fingerprint no longer appears.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
