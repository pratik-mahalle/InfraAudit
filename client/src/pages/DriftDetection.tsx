import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  GitCompareArrows,
  History,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useAcknowledgeDrift,
  useApproveDriftAsBaseline,
  useDriftSummary,
  useDrifts,
  useResolveDrift,
  useTriggerDriftDetection,
} from "@/hooks/use-drifts";
import { useToast } from "@/hooks/use-toast";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { Drift } from "@/lib/api";
import {
  ActionButton,
  DetailRow,
  EmptyPanel,
  FilterToolbar,
  MetricTile,
  ToneBadge,
  compactDate,
} from "@/components/security-ops/ops-ui";

type DriftFinding = Drift & {
  fieldChanged?: string;
};

const severityOptions = [
  { value: "all", label: "All severity" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const statusOptions = [
  { value: "all", label: "All status" },
  { value: "detected", label: "Detected" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
  { value: "approved", label: "Approved" },
];

const driftTypeLabels: Record<string, string> = {
  configuration_change: "Configuration change",
  security_group: "Security group",
  iam_policy: "IAM policy",
  network_rule: "Network rule",
  encryption: "Encryption",
  compliance: "Compliance",
  k8s_deployment: "Kubernetes deployment",
  k8s_image_change: "Kubernetes image change",
};

function labelForDrift(drift: DriftFinding) {
  return driftTypeLabels[drift.driftType] ?? drift.driftType?.replace(/_/g, " ") ?? "Configuration drift";
}

function driftResource(drift: DriftFinding) {
  return drift.resourceIdStr || String(drift.resourceId || "Unknown resource");
}

function formatConfig(value?: string) {
  if (!value) return "No configuration snapshot is available.";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export default function DriftDetection() {
  const { toast } = useToast();
  const [selectedDriftId, setSelectedDriftId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("detected");

  const { data: driftsResponse, isLoading } = useDrifts();
  const { data: summary } = useDriftSummary();
  const detectMutation = useTriggerDriftDetection();
  const resolveMutation = useResolveDrift();
  const acknowledgeMutation = useAcknowledgeDrift();
  const approveMutation = useApproveDriftAsBaseline();

  const drifts: DriftFinding[] = Array.isArray(driftsResponse) ? driftsResponse : driftsResponse?.data ?? [];

  const filteredDrifts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return drifts.filter((drift) => {
      const matchesSeverity = severityFilter === "all" || drift.severity === severityFilter;
      const matchesStatus = statusFilter === "all" || drift.status === statusFilter;
      const haystack = `${labelForDrift(drift)} ${drift.description} ${driftResource(drift)} ${drift.fieldChanged ?? ""}`.toLowerCase();
      return matchesSeverity && matchesStatus && (!query || haystack.includes(query));
    });
  }, [drifts, search, severityFilter, statusFilter]);

  const selectedDrift = filteredDrifts.find((drift) => drift.id === selectedDriftId) ?? filteredDrifts[0] ?? null;
  const detectedCount = drifts.filter((drift) => drift.status === "detected").length;
  const acknowledgedCount = drifts.filter((drift) => drift.status === "acknowledged").length;
  const resolvedCount = drifts.filter((drift) => drift.status === "resolved").length;
  const baselineCoverage = drifts.length ? Math.round(((resolvedCount + drifts.filter((drift) => drift.status === "approved").length) / drifts.length) * 100) : 100;
  const byType = summary?.byType ?? drifts.reduce<Record<string, number>>((acc, drift) => {
    acc[drift.driftType] = (acc[drift.driftType] ?? 0) + 1;
    return acc;
  }, {});

  const runScan = () => {
    detectMutation.mutate(undefined, {
      onSuccess: () => toast({ title: "Drift scan complete", description: "Cloud inventory was refreshed and compared with known baselines." }),
      onError: (error: Error) => toast({ title: "Scan failed", description: error.message, variant: "destructive" }),
    });
  };

  const acknowledge = (drift: DriftFinding) => {
    acknowledgeMutation.mutate(drift.id, {
      onSuccess: () => toast({ title: "Drift acknowledged", description: "The drift is now marked for owner review." }),
    });
  };

  const resolve = (drift: DriftFinding) => {
    resolveMutation.mutate(drift.id, {
      onSuccess: () => toast({ title: "Drift resolved", description: "The drift has been closed." }),
    });
  };

  const approve = (drift: DriftFinding) => {
    approveMutation.mutate(drift.id, {
      onSuccess: () => toast({ title: "Baseline approved", description: "This configuration is now accepted as baseline." }),
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Drift Detection"
        description="Compare live infrastructure against approved baselines and close configuration drift deliberately."
        actions={
          <Button onClick={runScan} disabled={detectMutation.isPending} className="gap-2">
            {detectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Run Drift Scan
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={GitCompareArrows} label="Total drifts" value={summary?.total ?? drifts.length} tone="blue" helper="All detected changes" />
        <MetricTile icon={ShieldAlert} label="Needs review" value={detectedCount} tone="red" helper={`${summary?.critical ?? drifts.filter((d) => d.severity === "critical").length} critical`} />
        <MetricTile icon={Eye} label="Acknowledged" value={acknowledgedCount} tone="amber" helper="Owner review started" />
        <MetricTile icon={ClipboardCheck} label="Baseline coverage" value={`${baselineCoverage}%`} tone="emerald" helper={`${resolvedCount} resolved`} />
      </div>

      <div className="mt-6">
        <FilterToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search drift type, field, or resource..."
          filters={[
            { value: severityFilter, onChange: setSeverityFilter, placeholder: "Severity", options: severityOptions },
            { value: statusFilter, onChange: setStatusFilter, placeholder: "Status", options: statusOptions },
          ]}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Baseline Change Queue</CardTitle>
            <CardDescription>{filteredDrifts.length} changes require review in the current view</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyPanel icon={History} title="Loading drifts" description="Checking live changes against stored baselines." />
            ) : filteredDrifts.length === 0 ? (
              <EmptyPanel icon={ShieldCheck} title="No drift in this view" description="Change filters or run a scan to compare current infrastructure state." />
            ) : (
              <div className="divide-y rounded-lg border">
                {filteredDrifts.map((drift) => (
                  <button
                    key={drift.id}
                    type="button"
                    onClick={() => setSelectedDriftId(drift.id)}
                    className={cn("w-full px-4 py-4 text-left transition-colors hover:bg-muted/50", selectedDrift?.id === drift.id && "bg-muted")}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <ToneBadge value={drift.severity} />
                          <ToneBadge value={drift.status} />
                        </div>
                        <h3 className="mt-2 text-sm font-semibold capitalize">{labelForDrift(drift)}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{drift.description}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatTimeAgo(drift.detectedAt)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{driftResource(drift)}</span>
                      {drift.fieldChanged && <span>Field: {drift.fieldChanged}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Drift Review</CardTitle>
              <CardDescription>Baseline context and remediation options</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedDrift ? (
                <EmptyPanel icon={GitCompareArrows} title="No drift selected" description="Select a change from the queue to compare baseline and live state." />
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <ToneBadge value={selectedDrift.severity} />
                      <ToneBadge value={selectedDrift.status} />
                    </div>
                    <h2 className="text-lg font-semibold capitalize">{labelForDrift(selectedDrift)}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{selectedDrift.description}</p>
                  </div>
                  <Separator />
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <DetailRow label="Resource">{driftResource(selectedDrift)}</DetailRow>
                    <DetailRow label="Detected">{compactDate(selectedDrift.detectedAt)}</DetailRow>
                    <DetailRow label="Changed field">{selectedDrift.fieldChanged || "Configuration"}</DetailRow>
                    <DetailRow label="Workflow">{selectedDrift.status === "detected" ? "Needs review" : "In progress"}</DetailRow>
                  </dl>
                  <div className="grid gap-3">
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Baseline</p>
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs">{formatConfig(selectedDrift.baselineConfig)}</pre>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Current</p>
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs">{formatConfig(selectedDrift.currentConfig)}</pre>
                    </div>
                  </div>
                  {selectedDrift.remediationTips && selectedDrift.remediationTips.length > 0 && (
                    <div className="rounded-lg border p-3">
                      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Remediation</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {selectedDrift.remediationTips.map((tip) => (
                          <li key={tip} className="flex gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selectedDrift.status === "detected" && (
                      <ActionButton variant="outline" onClick={() => acknowledge(selectedDrift)} disabled={acknowledgeMutation.isPending}>
                        Acknowledge
                      </ActionButton>
                    )}
                    {selectedDrift.status !== "resolved" && (
                      <ActionButton onClick={() => resolve(selectedDrift)} disabled={resolveMutation.isPending}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Resolve
                      </ActionButton>
                    )}
                    {selectedDrift.status !== "approved" && (
                      <ActionButton variant="outline" onClick={() => approve(selectedDrift)} disabled={approveMutation.isPending}>
                        Approve Baseline
                      </ActionButton>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Drift Types</CardTitle>
              <CardDescription>Where configuration changes are concentrated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(byType).length === 0 ? (
                <p className="text-sm text-muted-foreground">No drift type distribution is available.</p>
              ) : (
                Object.entries(byType).slice(0, 6).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm capitalize">{driftTypeLabels[type] ?? type.replace(/_/g, " ")}</span>
                    <ToneBadge value={count} tone="blue" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
