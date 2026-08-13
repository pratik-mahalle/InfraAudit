import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Bug,
  CheckCircle2,
  FileSearch,
  Gauge,
  GitBranch,
  Loader2,
  Package,
  PackageCheck,
  Search,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTopVulnerabilities, useTriggerVulnerabilityScan } from "@/hooks/use-vulnerabilities";
import { useFindings, useUpdateFindingStatus } from "@/hooks/use-findings";
import { isTerminalQueueState, useQueueJobStatus } from "@/hooks/use-queue-job";
import { useToast } from "@/hooks/use-toast";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { Finding, FindingStatus, Vulnerability } from "@/lib/api";
import { FindingDetailPanel, findingEvidence, formatFindingLabel } from "@/components/findings/finding-ui";
import { EmptyPanel, ToneBadge } from "@/components/security-ops/ops-ui";

const severityOptions = ["all", "critical", "high", "medium", "low", "info"];
const statusOptions = ["open", "all", "resolved", "accepted", "false_positive", "ignored"];
const vulnerabilityFindingTypes = new Set(["cve", "vulnerability"]);

function scanJobDescription(status?: string, lastError?: string) {
  switch (status) {
    case "available":
    case "pending":
    case "scheduled":
      return "Queued and waiting for a worker.";
    case "running":
      return "Checking packages, images, and resources.";
    case "retryable":
      return lastError ? `Retry scheduled after: ${lastError}` : "Retry scheduled after a scanner error.";
    case "completed":
      return "Scan completed. Vulnerability data is refreshing.";
    case "discarded":
      return lastError ? `Scan failed permanently: ${lastError}` : "Scan failed permanently.";
    case "cancelled":
      return "Scan was cancelled.";
    default:
      return "Waiting for scanner status.";
  }
}

function evidenceValue(finding: Finding, keys: string[]) {
  const evidence = findingEvidence(finding);
  for (const key of keys) {
    if (evidence[key] !== undefined && evidence[key] !== null && evidence[key] !== "") return String(evidence[key]);
  }
  return "";
}

function packageLabel(finding: Finding) {
  const name = evidenceValue(finding, ["package_name", "packageName"]) || finding.ruleId || finding.externalId || "unknown package";
  const version = evidenceValue(finding, ["package_version", "packageVersion"]);
  return version ? `${name}@${version}` : name;
}

function fixedVersion(finding: Finding) {
  return evidenceValue(finding, ["fixed_version", "fixedVersion"]);
}

function severityRank(severity?: string) {
  return { critical: 5, high: 4, medium: 3, low: 2, info: 1 }[String(severity ?? "").toLowerCase()] ?? 0;
}

function patchLane(finding: Finding) {
  if (finding.severity === "critical") return "Emergency";
  if (finding.severity === "high") return "Patch Window";
  if (fixedVersion(finding) || finding.remediation) return "Fix Ready";
  return "Backlog";
}

function PatchQueueRow({
  finding,
  selected,
  onSelect,
}: {
  finding: Finding;
  selected: boolean;
  onSelect: () => void;
}) {
  const fix = fixedVersion(finding);
  const cve = finding.externalId || finding.ruleId;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 lg:grid-cols-[minmax(0,1fr)_180px_120px]",
        selected && "bg-primary/5",
      )}
    >
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <ToneBadge value={finding.severity} />
          <ToneBadge value={finding.status} />
          {cve && <ToneBadge value={cve} tone="blue" />}
        </div>
        <h3 className="truncate text-sm font-semibold">{finding.title}</h3>
        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{packageLabel(finding)}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{finding.description || "No vulnerability description attached."}</p>
      </div>
      <div className="min-w-0 text-xs text-muted-foreground">
        <p className="truncate font-mono">{finding.resourceId || "not resource scoped"}</p>
        <p className="mt-1">{finding.provider?.toUpperCase() || "UNKNOWN"} · {formatFindingLabel(finding.scannerType || finding.sourceType)}</p>
        <p className="mt-1">{formatTimeAgo(finding.lastSeenAt)}</p>
      </div>
      <div className="flex items-center justify-between gap-2 lg:justify-end">
        {fix ? <ToneBadge value={`fix ${fix}`} tone="emerald" /> : <ToneBadge value="manual" tone="amber" />}
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

export default function Vulnerabilities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [activeLane, setActiveLane] = useState("Emergency");
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
    return findings
      .filter((finding) => {
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
          packageLabel(finding),
          fixedVersion(finding),
        ].filter(Boolean).join(" ").toLowerCase();
        return !query || haystack.includes(query);
      })
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
  }, [findings, search]);

  const lanes = ["Emergency", "Patch Window", "Fix Ready", "Backlog"].map((lane) => ({
    lane,
    items: filtered.filter((finding) => patchLane(finding) === lane),
  }));
  const visibleQueue = lanes.find((lane) => lane.lane === activeLane)?.items ?? filtered;
  const selectedFinding = filtered.find((item) => item.id === selectedFindingId) ?? visibleQueue[0] ?? filtered[0] ?? null;
  const criticalCount = findings.filter((item) => item.severity === "critical").length;
  const highCount = findings.filter((item) => item.severity === "high").length;
  const openCount = findings.filter((item) => item.status === "open").length;
  const fixableCount = findings.filter((item) => (fixedVersion(item) || item.remediation) && item.status === "open").length;
  const patchReadiness = openCount ? Math.round((fixableCount / openCount) * 100) : 100;
  const packageImpact = Object.entries(findings.reduce<Record<string, number>>((counts, finding) => {
    const pkg = packageLabel(finding);
    counts[pkg] = (counts[pkg] ?? 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]);
  const resourceImpact = Object.entries(findings.reduce<Record<string, number>>((counts, finding) => {
    const resource = finding.resourceId || "not resource scoped";
    counts[resource] = (counts[resource] ?? 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]);
  const scannerMix = Object.entries(findings.reduce<Record<string, number>>((counts, finding) => {
    const scanner = finding.scannerType || finding.sourceType || "unknown";
    counts[scanner] = (counts[scanner] ?? 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]);
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
    queryClient.invalidateQueries({ queryKey: ["findings"] });

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
      <div className="mb-5 rounded-xl border bg-card">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="border-b p-5 xl:border-b-0 xl:border-r">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Bug className="h-4 w-4" />
                  CVE and package remediation
                </div>
                <h1 className="text-2xl font-semibold">Vulnerability Patch Center</h1>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  Plan patch windows from actual package evidence, affected resources, fixed versions, scanner source, and lifecycle status.
                </p>
              </div>
              <Button onClick={runScan} disabled={scanMutation.isPending || scanJobIsActive} className="gap-2">
                {scanMutation.isPending || scanJobIsActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Run Vulnerability Scan
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-0 divide-x p-0">
            {[
              { label: "Open", value: openCount, tone: "red" as const },
              { label: "Critical", value: criticalCount, tone: "red" as const },
              { label: "High", value: highCount, tone: "orange" as const },
              { label: "Fixable", value: fixableCount, tone: "emerald" as const },
            ].map((item) => (
              <button key={item.label} type="button" onClick={() => item.label === "Critical" ? setSeverityFilter("critical") : item.label === "High" ? setSeverityFilter("high") : setStatusFilter("open")} className="p-5 text-left hover:bg-muted/40">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                <ToneBadge value={item.label} tone={item.tone} />
              </button>
            ))}
          </div>
        </div>
        {scanJobId && (
          <div className="border-t px-5 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                {scanJobIsActive || isFetchingScanJob ? <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-primary" /> : scanJobStatus?.status === "completed" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />}
                <div>
                  <p className="text-sm font-medium">Scan job #{scanJobId}</p>
                  <p className="text-xs text-muted-foreground">
                    {scanJobStatusError instanceof Error ? scanJobStatusError.message : scanJobDescription(activeScanJobStatus, scanJobStatus?.lastError)}
                  </p>
                </div>
              </div>
              <ToneBadge value={activeScanJobStatus ?? "queued"} tone={scanJobStatus?.status === "completed" ? "emerald" : scanJobStatus?.status === "discarded" ? "red" : "blue"} />
            </div>
          </div>
        )}
      </div>

      <div className="grid min-h-[760px] overflow-hidden rounded-xl border bg-card xl:grid-cols-[300px_minmax(0,1fr)_460px]">
        <aside className="border-b bg-muted/20 xl:border-b-0 xl:border-r">
          <div className="border-b p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Gauge className="h-4 w-4" />
              Patch Readiness
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Fix guidance coverage</span>
                <span className="font-medium">{patchReadiness}%</span>
              </div>
              <Progress value={patchReadiness} />
            </div>
          </div>
          <div className="divide-y">
            {lanes.map((lane) => (
              <button
                key={lane.lane}
                type="button"
                onClick={() => setActiveLane(lane.lane)}
                className={cn("flex w-full items-center justify-between px-4 py-4 text-left hover:bg-muted/60", activeLane === lane.lane && "bg-background")}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {lane.lane === "Emergency" ? <ShieldAlert className="h-4 w-4 text-red-600" /> : lane.lane === "Fix Ready" ? <PackageCheck className="h-4 w-4 text-emerald-600" /> : <Package className="h-4 w-4 text-muted-foreground" />}
                  {lane.lane}
                </span>
                <ToneBadge value={lane.items.length} tone={lane.lane === "Emergency" ? "red" : lane.lane === "Patch Window" ? "orange" : lane.lane === "Fix Ready" ? "emerald" : "slate"} />
              </button>
            ))}
          </div>
          <div className="space-y-4 p-4">
            {topVulns.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Top scanner returns</p>
                <div className="space-y-2">
                  {topVulns.slice(0, 4).map((vulnerability) => (
                    <button key={vulnerability.id} type="button" onClick={() => selectLegacyVulnerability(vulnerability)} className="w-full rounded-lg border bg-background p-3 text-left hover:bg-muted/40">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <ToneBadge value={vulnerability.severity} />
                        {vulnerability.cveId && <ToneBadge value={vulnerability.cveId} tone="blue" />}
                      </div>
                      <p className="line-clamp-2 text-sm font-medium">{vulnerability.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Scanner sources</p>
              <div className="space-y-2">
                {scannerMix.slice(0, 5).map(([scanner, count]) => (
                  <button key={scanner} type="button" onClick={() => setSearch(scanner)} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-background">
                    <span className="truncate">{scanner}</span>
                    <ToneBadge value={count} tone="blue" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 border-b xl:border-b-0 xl:border-r">
          <div className="border-b p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_170px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search CVE, package, fixed version, resource, scanner..." className="pl-9" />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{severityOptions.map((item) => <SelectItem key={item} value={item}>{formatFindingLabel(item)}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((item) => <SelectItem key={item} value={item}>{formatFindingLabel(item)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">{activeLane} Queue</h2>
                <p className="text-xs text-muted-foreground">{visibleQueue.length} vulnerabilities ready for triage</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setSeverityFilter("critical")}>Critical</Button>
                <Button size="sm" variant="outline" onClick={() => setSeverityFilter("high")}>High</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setSearch("");
                  setSeverityFilter("all");
                  setStatusFilter("open");
                  setActiveLane("Emergency");
                }}>Reset</Button>
              </div>
            </div>
          </div>
          <div className="max-h-[790px] overflow-auto">
            {isLoading ? (
              <EmptyPanel icon={FileSearch} title="Loading vulnerabilities" description="Fetching normalized CVE and package evidence." />
            ) : visibleQueue.length === 0 ? (
              <EmptyPanel icon={PackageCheck} title="No vulnerabilities in this lane" description="Change filters or run a scan to refresh vulnerability coverage." />
            ) : (
              visibleQueue.map((finding) => (
                <PatchQueueRow
                  key={finding.id}
                  finding={finding}
                  selected={selectedFinding?.id === finding.id}
                  onSelect={() => setSelectedFindingId(finding.id)}
                />
              ))
            )}
          </div>
        </main>

        <section className="min-w-0">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Remediation Plan</h2>
            <p className="text-xs text-muted-foreground">Package evidence, fixed version, affected asset, and closeout controls</p>
          </div>
          <div className="max-h-[790px] overflow-auto p-4">
            <FindingDetailPanel finding={selectedFinding} onStatusChange={updateSelectedFindingStatus} isStatusPending={updateFindingStatus.isPending} />
            {selectedFinding && (
              <div className="mt-4 grid gap-3">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                    <GitBranch className="h-4 w-4" />
                    Patch Step
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Validate the package/image, apply the fixed version or compensating control, then rerun the scan and close only after the fingerprint disappears.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">Blast radius</p>
                  <div className="space-y-2">
                    {resourceImpact.slice(0, 4).map(([resource, count]) => (
                      <button key={resource} type="button" onClick={() => setSearch(resource)} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted">
                        <span className="truncate font-mono text-xs">{resource}</span>
                        <ToneBadge value={count} tone="red" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">Package hotspots</p>
                  <div className="space-y-2">
                    {packageImpact.slice(0, 4).map(([pkg, count]) => (
                      <button key={pkg} type="button" onClick={() => setSearch(pkg)} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted">
                        <span className="truncate font-mono text-xs">{pkg}</span>
                        <ToneBadge value={count} tone="orange" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
