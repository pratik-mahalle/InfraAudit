import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bug, CheckCircle2, FileSearch, Loader2, Package, Play, Search, ShieldAlert, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTopVulnerabilities, useTriggerVulnerabilityScan } from "@/hooks/use-vulnerabilities";
import { useFindings, useUpdateFindingStatus } from "@/hooks/use-findings";
import { isTerminalQueueState, useQueueJobStatus } from "@/hooks/use-queue-job";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Finding, FindingStatus, Vulnerability } from "@/lib/api";
import { findingEvidence, formatFindingLabel } from "@/components/findings/finding-ui";
import { EmptyPanel } from "@/components/security-ops/ops-ui";
import { SocBadge, SocButton, SocPanel, SocProgress, SocStat, SocWorkspace } from "@/components/security-ops/soc-ui";

const vulnerabilityFindingTypes = new Set(["cve", "vulnerability"]);

function evidenceValue(finding: Finding, keys: string[]) {
  const evidence = findingEvidence(finding);
  for (const key of keys) {
    if (evidence[key] !== undefined && evidence[key] !== null && evidence[key] !== "") return String(evidence[key]);
  }
  return "";
}

function packageName(finding?: Finding | null) {
  if (!finding) return "";
  return evidenceValue(finding, ["package_name", "packageName"]) || finding.ruleId || finding.externalId || "unknown package";
}

function packageVersion(finding?: Finding | null) {
  return finding ? evidenceValue(finding, ["package_version", "packageVersion", "installed"]) : "";
}

function fixedVersion(finding?: Finding | null) {
  return finding ? evidenceValue(finding, ["fixed_version", "fixedVersion", "fixed"]) : "";
}

function cvssScore(finding?: Finding | null) {
  return finding ? evidenceValue(finding, ["cvss", "cvss_score", "cvssScore"]) : "";
}

function severityRank(severity?: string) {
  return { critical: 5, high: 4, medium: 3, low: 2, info: 1 }[String(severity ?? "").toLowerCase()] ?? 0;
}

function severityTone(severity?: string) {
  if (severity === "critical") return "red" as const;
  if (severity === "high") return "orange" as const;
  if (severity === "medium") return "yellow" as const;
  if (severity === "low") return "blue" as const;
  return "slate" as const;
}

function patchLane(finding: Finding) {
  if (finding.severity === "critical") return "Emergency";
  if (finding.severity === "high") return "Patch Window";
  if (fixedVersion(finding) || finding.remediation) return "Fix Ready";
  return "Backlog";
}

function scanJobDescription(status?: string, lastError?: string) {
  switch (status) {
    case "available":
    case "pending":
    case "scheduled":
      return "Queued";
    case "running":
      return "Running";
    case "retryable":
      return lastError ? `Retry: ${lastError}` : "Retry";
    case "completed":
      return "Done";
    case "discarded":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Waiting";
  }
}

function VulnCard({ finding, selected, onSelect }: { finding: Finding; selected: boolean; onSelect: () => void }) {
  const fix = fixedVersion(finding);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn("w-full rounded border border-border bg-background p-3 text-left hover:border-border hover:bg-muted", selected && "border-blue-500 bg-blue-500/10")}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <SocBadge tone={severityTone(finding.severity)}>{finding.severity}</SocBadge>
        <span className="font-mono text-xs text-muted-foreground">{cvssScore(finding) ? `CVSS ${cvssScore(finding)}` : "CVSS n/a"}</span>
      </div>
      <h3 className="line-clamp-2 text-base font-medium text-foreground">{finding.title}</h3>
      <p className="mt-1 font-mono text-xs text-blue-300">{finding.externalId || finding.ruleId || `FND-${finding.id}`}</p>
      <p className="mt-3 truncate font-mono text-xs text-muted-foreground">
        <Package className="mr-1 inline h-3.5 w-3.5" />
        {packageName(finding)} {packageVersion(finding)}
        {fix && <span className="text-emerald-600 dark:text-green-400"> → {fix}</span>}
      </p>
      <p className="mt-2 truncate font-mono text-xs text-muted-foreground">{finding.resourceId || "not resource scoped"} · {finding.scannerType || finding.sourceType}</p>
      {finding.remediation && <p className="mt-3 font-mono text-xs uppercase text-red-300">↯ exploit or fix guidance</p>}
    </button>
  );
}

export default function Vulnerabilities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [scanJobId, setScanJobId] = useState<number | null>(null);
  const [notifiedScanJobStatus, setNotifiedScanJobStatus] = useState<string | null>(null);

  const { data: findingsResponse, isLoading } = useFindings({ page: 1, pageSize: 100, status: "open" });
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
          packageName(finding),
          packageVersion(finding),
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
  const selectedFinding = filtered.find((item) => item.id === selectedFindingId) ?? filtered[0] ?? null;
  const criticalCount = findings.filter((item) => item.severity === "critical").length;
  const highCount = findings.filter((item) => item.severity === "high").length;
  const fixableCount = findings.filter((item) => (fixedVersion(item) || item.remediation) && item.status === "open").length;
  const activeScanJobStatus = scanJobStatus?.status ?? (scanJobId ? "available" : undefined);
  const scanJobIsActive = !!scanJobId && !scanJobStatusError && !isTerminalQueueState(activeScanJobStatus);

  const selectLegacyVulnerability = (vulnerability: Vulnerability) => {
    const cve = vulnerability.cveId ?? vulnerability.vulnerabilityId;
    const matchingFinding = findings.find((finding) => {
      const target = `${finding.externalId ?? ""} ${finding.ruleId ?? ""} ${finding.title}`.toLowerCase();
      return cve ? target.includes(cve.toLowerCase()) : target.includes(vulnerability.title.toLowerCase());
    });
    if (matchingFinding) setSelectedFindingId(matchingFinding.id);
    else setSearch(cve ?? vulnerability.title);
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
  }, [notifiedScanJobStatus, queryClient, scanJobStatus]);

  const runScan = () => {
    scanMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.jobId) {
          setScanJobId(result.jobId);
          setNotifiedScanJobStatus(null);
          toast({ title: result.duplicate ? "Vulnerability scan already queued" : "Vulnerability scan queued", description: `Job #${result.jobId} is running on the ${result.queue ?? "scan"} queue.` });
          return;
        }
        setScanJobId(null);
        toast({ title: "Vulnerability scan started", description: "InfraAudit is checking packages, images, and resources." });
      },
      onError: (error: Error) => toast({ title: "Scan failed", description: error.message || "Could not start vulnerability scan.", variant: "destructive" }),
    });
  };

  const scanRows = [
    ...(scanJobId ? [{
      id: `JOB-${scanJobId}`,
      target: selectedFinding?.resourceId || "current workspace",
      scanner: selectedFinding?.scannerType || selectedFinding?.sourceType || "configured scanner",
      state: scanJobDescription(activeScanJobStatus, scanJobStatus?.lastError),
    }] : []),
  ];

  return (
    <SocWorkspace section="Operations / Vulnerabilities" title="Vulnerability Workbench" counts={{ vulnerabilities: findings.length }}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_504px]">
        <SocPanel eyebrow="Scanner Activity" title="Vulnerability scan queue" actions={<SocButton onClick={runScan} disabled={scanMutation.isPending || scanJobIsActive}>{scanMutation.isPending || isFetchingScanJob ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Run Scan</SocButton>}>
          <div className="overflow-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b border-border font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <tr><th className="px-4 py-3">Scan</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Scanner</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scanRows.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-sm text-muted-foreground">No vulnerability scan job has been started from this session.</td></tr>
                ) : scanRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono text-sm text-foreground">{row.id}</td>
                    <td className="px-4 py-3 font-mono text-sm text-foreground">{row.target}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.scanner}</td>
                    <td className="px-4 py-3"><SocBadge tone={row.state === "Done" ? "green" : "blue"}>{row.state}</SocBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SocPanel>

        <div className="grid grid-cols-2 gap-4">
          <SocStat label="Emergency" value={criticalCount} tone="red" helper="≤24h SLA" />
          <SocStat label="Patch Window" value={highCount} tone="orange" helper="within 7d" />
          <SocStat label="Fix Ready" value={fixableCount} tone="blue" helper="awaiting deploy" />
          <SocStat label="Backlog" value={Math.max(0, findings.length - criticalCount - highCount - fixableCount)} helper="accepted / deferred" />
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_504px]">
        <div className="grid gap-4 lg:grid-cols-4">
          {lanes.map((lane) => (
            <SocPanel key={lane.lane} eyebrow={lane.lane} title={lane.lane === "Emergency" ? "≤ 24h SLA · exploitable in wild" : lane.lane === "Patch Window" ? "Scheduled maintenance" : lane.lane === "Fix Ready" ? "Awaiting rollout" : "Accepted or deferred"} actions={<span className="rounded border border-border px-2 py-1 font-mono text-xs text-muted-foreground">{lane.items.length}</span>}>
              <div className="max-h-[620px] space-y-3 overflow-auto p-3">
                {isLoading ? (
                  <div className="p-4 font-mono text-sm text-muted-foreground">Loading...</div>
                ) : lane.items.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No items.</div>
                ) : (
                  lane.items.map((finding) => <VulnCard key={finding.id} finding={finding} selected={selectedFinding?.id === finding.id} onSelect={() => setSelectedFindingId(finding.id)} />)
                )}
              </div>
            </SocPanel>
          ))}
        </div>

        <SocPanel eyebrow="Remediation Plan" title={selectedFinding?.externalId || selectedFinding?.ruleId || "Select vulnerability"}>
          <div className="border-b border-border p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              <SocBadge tone={severityTone(selectedFinding?.severity)}>{selectedFinding?.severity || "none"}</SocBadge>
              <span className="font-mono text-xs uppercase text-muted-foreground">{cvssScore(selectedFinding) ? `CVSS ${cvssScore(selectedFinding)}` : "CVSS n/a"}</span>
              <span className="font-mono text-xs text-muted-foreground">{selectedFinding?.scannerType || selectedFinding?.sourceType}</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">{selectedFinding?.title || "No vulnerability selected"}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedFinding?.description || "Select a vulnerability to inspect package, asset, and fix context."}</p>
          </div>
          {selectedFinding ? (
            <div className="max-h-[620px] overflow-auto p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <SocStat label="Package" value={<span className="text-base">{packageName(selectedFinding)}</span>} />
                <SocStat label="Resources" value={<span className="text-base">{selectedFinding.resourceId ? 1 : 0}</span>} />
                <SocStat label="Installed" value={<span className="text-base">{packageVersion(selectedFinding) || "unknown"}</span>} />
                <SocStat label="Fixed" value={<span className="text-base">{fixedVersion(selectedFinding) || "manual"}</span>} tone={fixedVersion(selectedFinding) ? "green" : "yellow"} />
                <SocStat label="First Seen" value={<span className="text-base">{new Date(selectedFinding.firstSeenAt).toLocaleDateString()}</span>} />
                <SocStat label="Last Seen" value={<span className="text-base">{new Date(selectedFinding.lastSeenAt).toLocaleDateString()}</span>} />
              </div>
              <div className="mt-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Blast Radius</p>
                <p className="mt-2 break-all font-mono text-sm text-foreground">{selectedFinding.resourceId || "not resource scoped"}</p>
              </div>
              <div className="mt-5 border-l-2 border-blue-500 px-4 text-sm leading-6 text-foreground">
                {selectedFinding.remediation || "Validate the package/image, apply the fixed version or mitigation, rerun the scan, then close after fingerprint disappearance."}
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <SocButton onClick={() => updateSelectedFindingStatus("resolved")} disabled={updateFindingStatus.isPending}><CheckCircle2 className="h-4 w-4" /> Resolve</SocButton>
                <SocButton variant="ghost" onClick={() => updateSelectedFindingStatus("accepted")} disabled={updateFindingStatus.isPending}><ShieldAlert className="h-4 w-4" /> Accept Risk</SocButton>
              </div>
            </div>
          ) : (
            <EmptyPanel icon={FileSearch} title="No vulnerability selected" description="Select an item from a patch lane to build a remediation plan." />
          )}
        </SocPanel>
      </div>

      {topVulns.length > 0 && (
        <SocPanel className="mt-4" eyebrow="Legacy Scanner Returns" title="Top vulnerabilities returned by scanner">
          <div className="grid gap-3 p-3 md:grid-cols-3">
            {topVulns.slice(0, 3).map((vulnerability) => (
              <button key={vulnerability.id} type="button" onClick={() => selectLegacyVulnerability(vulnerability)} className="rounded border border-border bg-background p-3 text-left hover:bg-muted">
                <SocBadge tone={severityTone(vulnerability.severity)}>{vulnerability.severity}</SocBadge>
                <p className="mt-3 line-clamp-2 text-sm font-medium text-foreground">{vulnerability.title}</p>
                {vulnerability.cveId && <p className="mt-2 font-mono text-xs text-blue-300">{vulnerability.cveId}</p>}
              </button>
            ))}
          </div>
        </SocPanel>
      )}
    </SocWorkspace>
  );
}
