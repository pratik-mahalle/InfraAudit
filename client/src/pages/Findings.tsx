import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Fingerprint,
  ListFilter,
  Search,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFindings, useFindingSummary, useUpdateFindingStatus } from "@/hooks/use-findings";
import type { Finding, FindingParams, FindingStatus } from "@/lib/api";
import { FindingDetailPanel, formatFindingLabel } from "@/components/findings/finding-ui";
import { EmptyPanel, ToneBadge } from "@/components/security-ops/ops-ui";
import { cn, formatTimeAgo } from "@/lib/utils";

const severities = ["all", "critical", "high", "medium", "low", "info"];
const statuses = ["open", "all", "resolved", "accepted", "false_positive", "ignored"];
const types = ["all", "cve", "vulnerability", "misconfiguration", "compliance_violation", "exposure", "secret", "malware"];
const sources = ["all", "vulnerability", "compliance", "cloud_native", "policy"];

function findingLane(finding: Finding) {
  if (finding.status === "resolved") return "Resolved";
  if (finding.severity === "critical" || finding.severity === "high") return "Priority";
  if (finding.findingType === "compliance_violation") return "Audit";
  if (finding.findingType === "exposure" || finding.findingType === "misconfiguration") return "Exposure";
  return "Watch";
}

function severityRank(severity?: string) {
  return { critical: 5, high: 4, medium: 3, low: 2, info: 1 }[String(severity ?? "").toLowerCase()] ?? 0;
}

function SignalRow({
  finding,
  selected,
  onSelect,
}: {
  finding: Finding;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 lg:grid-cols-[96px_minmax(0,1fr)_150px]",
        selected && "bg-primary/5",
      )}
    >
      <div className="flex flex-wrap items-start gap-1.5">
        <ToneBadge value={finding.severity} />
        <ToneBadge value={finding.status} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="min-w-0 truncate text-sm font-semibold">{finding.title}</h3>
          <ToneBadge value={formatFindingLabel(finding.findingType)} tone="blue" />
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{finding.description || "No description attached."}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="font-mono">{finding.resourceId || "not resource scoped"}</span>
          <span>{finding.provider?.toUpperCase() || "UNKNOWN"}</span>
          <span>{formatFindingLabel(finding.scannerType || finding.sourceType)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <span className="text-xs text-muted-foreground">{formatTimeAgo(finding.lastSeenAt)}</span>
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

export default function Findings() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("open");
  const [findingType, setFindingType] = useState("all");
  const [sourceType, setSourceType] = useState("all");
  const [activeLane, setActiveLane] = useState("Priority");
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null);

  const params: FindingParams = {
    page: 1,
    pageSize: 100,
    severity: severity === "all" ? undefined : severity,
    status: status === "all" ? undefined : status,
    findingType: findingType === "all" ? undefined : findingType,
    sourceType: sourceType === "all" ? undefined : sourceType,
  };

  const { data: findingsResponse, isLoading, isError, error } = useFindings(params);
  const { data: summary } = useFindingSummary();
  const updateStatus = useUpdateFindingStatus();
  const findings = findingsResponse?.data ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return findings
      .filter((finding) => {
        if (!query) return true;
        return [
          finding.title,
          finding.description,
          finding.resourceId,
          finding.provider,
          finding.resourceType,
          finding.scannerType,
          finding.ruleId,
          finding.externalId,
          finding.fingerprint,
        ].join(" ").toLowerCase().includes(query);
      })
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
  }, [findings, search]);

  const lanes = ["Priority", "Exposure", "Audit", "Watch", "Resolved"].map((lane) => ({
    lane,
    items: filtered.filter((finding) => findingLane(finding) === lane),
  }));
  const visibleQueue = lanes.find((lane) => lane.lane === activeLane)?.items ?? filtered;
  const selectedFinding = filtered.find((finding) => finding.id === selectedFindingId) ?? visibleQueue[0] ?? filtered[0] ?? null;
  const bySeverity = summary?.bySeverity ?? {};
  const byStatus = summary?.byStatus ?? {};
  const byType = summary?.byType ?? {};
  const priorityTotal = (bySeverity.critical ?? 0) + (bySeverity.high ?? 0);

  const providerMix = Object.entries(findings.reduce<Record<string, number>>((counts, finding) => {
    const provider = finding.provider?.toUpperCase() || "UNKNOWN";
    counts[provider] = (counts[provider] ?? 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]);

  const handleStatusChange = (nextStatus: FindingStatus) => {
    if (!selectedFinding) return;
    updateStatus.mutate(
      { id: selectedFinding.id, status: nextStatus },
      {
        onSuccess: () => toast({ title: "Finding updated", description: `Status changed to ${nextStatus.replace(/_/g, " ")}.` }),
        onError: (err: Error) => toast({ title: "Could not update finding", description: err.message, variant: "destructive" }),
      },
    );
  };

  return (
    <DashboardLayout>
      <div className="mb-5 overflow-hidden rounded-xl border bg-card">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_520px]">
          <div className="border-b p-5 xl:border-b-0 xl:border-r">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Fingerprint className="h-4 w-4" />
                  Normalized evidence layer
                </div>
                <h1 className="text-2xl font-semibold">Security Findings Console</h1>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  Investigate CVEs, misconfigurations, compliance violations, exposure, secrets, malware, and provider-native signals in one queue.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Open</p>
                  <p className="text-2xl font-semibold">{byStatus.open ?? 0}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <p className="text-2xl font-semibold">{priorityTotal}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-semibold">{summary?.total ?? findingsResponse?.totalItems ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            {["critical", "high", "medium", "low"].map((item) => (
              <button key={item} type="button" onClick={() => setSeverity(item)} className="rounded-lg border p-3 text-left hover:bg-muted/40">
                <ToneBadge value={item} />
                <p className="mt-3 text-xl font-semibold">{bySeverity[item] ?? 0}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_210px_190px_220px_190px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search rule, resource, CVE, fingerprint, provider..." className="pl-9" />
        </div>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{severities.map((item) => <SelectItem key={item} value={item}>{formatFindingLabel(item)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{formatFindingLabel(item)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={findingType} onValueChange={setFindingType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{types.map((item) => <SelectItem key={item} value={item}>{formatFindingLabel(item)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sourceType} onValueChange={setSourceType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{sources.map((item) => <SelectItem key={item} value={item}>{formatFindingLabel(item)}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isError && (
        <div className="mb-4">
          <EmptyPanel icon={AlertTriangle} title="Could not load findings" description={error instanceof Error ? error.message : "The findings API returned an error."} />
        </div>
      )}

      <div className="grid min-h-[720px] overflow-hidden rounded-xl border bg-card xl:grid-cols-[280px_minmax(0,1fr)_460px]">
        <aside className="border-b bg-muted/20 xl:border-b-0 xl:border-r">
          <div className="border-b p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ListFilter className="h-4 w-4" />
              Signal Stack
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
                <span className="flex items-center gap-2">
                  {lane.lane === "Priority" ? <Siren className="h-4 w-4 text-red-600" /> : lane.lane === "Resolved" ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <CircleDot className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-medium">{lane.lane}</span>
                </span>
                <ToneBadge value={lane.items.length} tone={lane.lane === "Priority" ? "red" : lane.lane === "Resolved" ? "emerald" : "slate"} />
              </button>
            ))}
          </div>
          <div className="space-y-4 p-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Finding types</p>
              <div className="space-y-2">
                {Object.entries(byType).slice(0, 6).map(([type, count]) => (
                  <button key={type} type="button" onClick={() => setFindingType(type)} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-background">
                    <span className="truncate">{formatFindingLabel(type)}</span>
                    <ToneBadge value={count} tone="blue" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Providers</p>
              <div className="space-y-2">
                {providerMix.slice(0, 5).map(([provider, count]) => (
                  <button key={provider} type="button" onClick={() => setSearch(provider.toLowerCase())} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-background">
                    <span>{provider}</span>
                    <ToneBadge value={count} tone="slate" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 border-b xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="font-semibold">{activeLane} Queue</h2>
              <p className="text-xs text-muted-foreground">{visibleQueue.length} matching findings</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              setSearch("");
              setSeverity("all");
              setStatus("open");
              setFindingType("all");
              setSourceType("all");
              setActiveLane("Priority");
            }}>
              Reset
            </Button>
          </div>
          <div className="max-h-[760px] overflow-auto">
            {isLoading ? (
              <EmptyPanel icon={Fingerprint} title="Loading findings" description="Fetching normalized finding evidence." />
            ) : visibleQueue.length === 0 ? (
              <EmptyPanel icon={CheckCircle2} title="No findings in this lane" description="Change the filters or choose a different signal stack lane." />
            ) : (
              visibleQueue.map((finding) => (
                <SignalRow
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
            <h2 className="font-semibold">Investigation Record</h2>
            <p className="text-xs text-muted-foreground">Evidence, remediation, ownership, and lifecycle actions</p>
          </div>
          <div className="max-h-[760px] overflow-auto p-4">
            <FindingDetailPanel finding={selectedFinding} onStatusChange={handleStatusChange} isStatusPending={updateStatus.isPending} />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
