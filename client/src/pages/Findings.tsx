import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSearch, Fingerprint, ListFilter, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFindings, useFindingSummary, useUpdateFindingStatus } from "@/hooks/use-findings";
import type { Finding, FindingParams, FindingStatus } from "@/lib/api";
import { FindingDetailPanel, formatFindingLabel } from "@/components/findings/finding-ui";
import { EmptyPanel, FilterToolbar, MetricTile, ToneBadge } from "@/components/security-ops/ops-ui";
import { cn, formatTimeAgo } from "@/lib/utils";

const severityOptions = [
  { value: "all", label: "All severity" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "info", label: "Info" },
];

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "all", label: "All status" },
  { value: "resolved", label: "Resolved" },
  { value: "accepted", label: "Accepted risk" },
  { value: "false_positive", label: "False positive" },
  { value: "ignored", label: "Ignored" },
];

const typeOptions = [
  { value: "all", label: "All types" },
  { value: "cve", label: "CVE" },
  { value: "vulnerability", label: "Vulnerability" },
  { value: "misconfiguration", label: "Misconfiguration" },
  { value: "compliance_violation", label: "Compliance" },
  { value: "exposure", label: "Exposure" },
  { value: "secret", label: "Secret" },
  { value: "malware", label: "Malware" },
];

const sourceOptions = [
  { value: "all", label: "All sources" },
  { value: "vulnerability", label: "Vulnerability" },
  { value: "compliance", label: "Compliance" },
  { value: "cloud_native", label: "Cloud native" },
  { value: "policy", label: "Policy" },
];

function findingLane(finding: Finding) {
  if (finding.status === "resolved") return "Cleared";
  if (finding.severity === "critical" || finding.severity === "high") return "Priority";
  if (finding.findingType === "compliance_violation") return "Audit";
  if (finding.findingType === "exposure" || finding.findingType === "misconfiguration") return "Exposure";
  return "Watch";
}

function FindingSignalCard({
  finding,
  selected,
  onSelect,
}: {
  finding: Finding;
  selected?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40",
        selected && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <ToneBadge value={finding.severity} />
            <ToneBadge value={formatFindingLabel(finding.findingType)} tone="blue" />
          </div>
          <h3 className="mt-2 line-clamp-2 text-sm font-semibold">{finding.title}</h3>
        </div>
        {finding.status === "resolved" ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
        )}
      </div>
      <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
        <span className="truncate font-mono">{finding.resourceId || "Not resource scoped"}</span>
        <span>{finding.provider?.toUpperCase() || "Provider unknown"} · {formatFindingLabel(finding.scannerType || finding.sourceType)}</span>
        <span>{formatTimeAgo(finding.lastSeenAt)}</span>
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
    if (!query) return findings;
    return findings.filter((finding) => {
      const haystack = [
        finding.title,
        finding.description,
        finding.resourceId,
        finding.provider,
        finding.resourceType,
        finding.scannerType,
        finding.ruleId,
        finding.externalId,
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [findings, search]);

  const selectedFinding: Finding | null = filtered.find((finding) => finding.id === selectedFindingId) ?? filtered[0] ?? null;
  const bySeverity = summary?.bySeverity ?? {};
  const byStatus = summary?.byStatus ?? {};
  const lanes = ["Priority", "Audit", "Exposure", "Watch", "Cleared"];
  const groupedFindings = lanes.map((lane) => ({
    lane,
    items: filtered.filter((finding) => findingLane(finding) === lane),
  }));
  const visibleGroupedFindings = groupedFindings.filter((group) => group.items.length > 0);
  const typeMix = typeOptions
    .filter((option) => option.value !== "all")
    .map((option) => ({
      ...option,
      count: findings.filter((finding) => finding.findingType === option.value).length,
    }))
    .filter((item) => item.count > 0);

  const handleStatusChange = (nextStatus: FindingStatus) => {
    if (!selectedFinding) return;
    updateStatus.mutate(
      { id: selectedFinding.id, status: nextStatus },
      {
        onSuccess: () => toast({ title: "Finding updated", description: `Status changed to ${nextStatus.replace(/_/g, " ")}.` }),
        onError: (err: Error) => toast({ title: "Could not update finding", description: err.message, variant: "destructive" }),
      }
    );
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Security Findings"
        description="Unified triage for CVEs, misconfigurations, compliance violations, exposures, and provider-native findings."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={Fingerprint} label="Total findings" value={summary?.total ?? findingsResponse?.totalItems ?? 0} tone="blue" helper="Across all sources" />
        <MetricTile icon={AlertTriangle} label="Open" value={byStatus.open ?? 0} tone="red" helper="Needs owner action" />
        <MetricTile icon={ShieldCheck} label="Resolved" value={byStatus.resolved ?? 0} tone="emerald" helper="Closed by scan or analyst" />
        <MetricTile icon={ListFilter} label="Critical / High" value={(bySeverity.critical ?? 0) + (bySeverity.high ?? 0)} tone="orange" helper="Priority queue" />
      </div>

      <div className="mt-6">
        <FilterToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search title, resource, provider, rule, source..."
          filters={[
            { value: severity, onChange: setSeverity, placeholder: "Severity", options: severityOptions },
            { value: status, onChange: setStatus, placeholder: "Status", options: statusOptions },
            { value: findingType, onChange: setFindingType, placeholder: "Type", options: typeOptions, widthClassName: "sm:w-[190px]" },
            { value: sourceType, onChange: setSourceType, placeholder: "Source", options: sourceOptions, widthClassName: "sm:w-[170px]" },
          ]}
        />
      </div>

      {isError && (
        <div className="mt-6">
          <EmptyPanel icon={AlertTriangle} title="Could not load findings" description={error instanceof Error ? error.message : "The findings API returned an error."} />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Triage Board</CardTitle>
            <CardDescription>{filtered.length} findings grouped by analyst workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {typeMix.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {typeMix.slice(0, 8).map((item) => (
                  <div key={item.value} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold">{item.count}</p>
                  </div>
                ))}
              </div>
            )}
            {isLoading ? (
              <EmptyPanel icon={FileSearch} title="Loading findings" description="Fetching normalized finding evidence from all scanners and compliance sources." />
            ) : filtered.length === 0 ? (
              <EmptyPanel icon={ShieldCheck} title="No findings in this view" description="Change filters, run scans, or sync providers to refresh the queue." />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {visibleGroupedFindings.map((group) => (
                  <section key={group.lane} className="rounded-lg border bg-muted/20 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{group.lane}</h3>
                      <ToneBadge value={group.items.length} tone={group.lane === "Priority" ? "red" : group.lane === "Cleared" ? "emerald" : "slate"} />
                    </div>
                    <div className="space-y-2">
                      {group.items.slice(0, 8).map((finding) => (
                        <FindingSignalCard
                          key={finding.id}
                          finding={finding}
                          selected={selectedFinding?.id === finding.id}
                          onSelect={() => setSelectedFindingId(finding.id)}
                        />
                      ))}
                    </div>
                    {group.items.length > 8 && (
                      <p className="mt-3 text-xs text-muted-foreground">+{group.items.length - 8} more in this lane. Use search or filters to narrow.</p>
                    )}
                  </section>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Investigation Record</CardTitle>
            <CardDescription>Evidence, ownership, remediation, and lifecycle controls</CardDescription>
          </CardHeader>
          <CardContent>
            <FindingDetailPanel
              finding={selectedFinding}
              onStatusChange={handleStatusChange}
              isStatusPending={updateStatus.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
