import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Bug,
  ExternalLink,
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
import { Separator } from "@/components/ui/separator";
import { useResources } from "@/hooks/use-resources";
import {
  useTopVulnerabilities,
  useTriggerVulnerabilityScan,
  useVulnerabilities,
  useVulnerabilitySummary,
} from "@/hooks/use-vulnerabilities";
import { useToast } from "@/hooks/use-toast";
import { cn, formatTimeAgo } from "@/lib/utils";
import type { Vulnerability } from "@/lib/api";
import {
  DetailRow,
  EmptyPanel,
  FilterToolbar,
  MetricTile,
  ToneBadge,
  compactDate,
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
  { value: "fixed", label: "Fixed" },
  { value: "ignored", label: "Ignored" },
];

export default function Vulnerabilities() {
  const { toast } = useToast();
  const [selectedVulnerabilityId, setSelectedVulnerabilityId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");

  const { data: vulnsResponse, isLoading } = useVulnerabilities();
  const { data: summary } = useVulnerabilitySummary();
  const { data: topVulns = [] } = useTopVulnerabilities();
  const { data: resourcesResponse } = useResources();
  const scanMutation = useTriggerVulnerabilityScan();

  const vulnerabilities: Vulnerability[] = Array.isArray(vulnsResponse) ? vulnsResponse : vulnsResponse?.data ?? [];
  const resources = resourcesResponse?.data ?? [];

  const resourceName = (resourceId: number) => {
    return resources.find((resource) => resource.id === resourceId)?.name ?? `Resource ${resourceId}`;
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vulnerabilities.filter((vulnerability) => {
      const matchesSeverity = severityFilter === "all" || vulnerability.severity === severityFilter;
      const matchesStatus = statusFilter === "all" || vulnerability.status === statusFilter;
      const haystack = `${vulnerability.title} ${vulnerability.description} ${vulnerability.cveId ?? ""} ${resourceName(vulnerability.resourceId)}`.toLowerCase();
      return matchesSeverity && matchesStatus && (!query || haystack.includes(query));
    });
  }, [resources, search, severityFilter, statusFilter, vulnerabilities]);

  const selectedVulnerability = filtered.find((item) => item.id === selectedVulnerabilityId) ?? filtered[0] ?? null;
  const bySeverity = (summary as any)?.bySeverity ?? (summary as any)?.by_severity ?? summary ?? {};
  const criticalCount = bySeverity.critical ?? vulnerabilities.filter((item) => item.severity === "critical").length;
  const highCount = bySeverity.high ?? vulnerabilities.filter((item) => item.severity === "high").length;
  const openCount = vulnerabilities.filter((item) => item.status === "open").length;
  const fixableCount = vulnerabilities.filter((item) => item.remediation && item.status === "open").length;

  const runScan = () => {
    scanMutation.mutate(undefined, {
      onSuccess: () => toast({ title: "Vulnerability scan started", description: "InfraAudit is checking packages, images, and resources." }),
      onError: (error: Error) => toast({ title: "Scan failed", description: error.message || "Could not start vulnerability scan.", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Vulnerability Remediation"
        description="Prioritize CVEs by severity, affected resource, and available fix guidance."
        actions={
          <Button onClick={runScan} disabled={scanMutation.isPending} className="gap-2">
            {scanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Run Vulnerability Scan
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={Bug} label="Open CVEs" value={openCount} tone="red" helper={`${vulnerabilities.length} total findings`} />
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
                  onClick={() => setSelectedVulnerabilityId(vulnerability.id)}
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
          searchPlaceholder="Search CVE, package title, description, or resource..."
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
            <CardDescription>{filtered.length} vulnerabilities match the current view</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyPanel icon={FileWarning} title="Loading vulnerabilities" description="Fetching vulnerability findings from the scanner." />
            ) : filtered.length === 0 ? (
              <EmptyPanel icon={PackageCheck} title="No vulnerabilities in this view" description="Change filters or run a scan to refresh vulnerability coverage." />
            ) : (
              <div className="divide-y rounded-lg border">
                {filtered.map((vulnerability) => (
                  <button
                    key={vulnerability.id}
                    type="button"
                    onClick={() => setSelectedVulnerabilityId(vulnerability.id)}
                    className={cn("w-full px-4 py-4 text-left transition-colors hover:bg-muted/50", selectedVulnerability?.id === vulnerability.id && "bg-muted")}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <ToneBadge value={vulnerability.severity} />
                          <ToneBadge value={vulnerability.status} />
                          {vulnerability.cveId && <ToneBadge value={vulnerability.cveId} tone="blue" />}
                        </div>
                        <h3 className="mt-2 text-sm font-semibold">{vulnerability.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{vulnerability.description}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatTimeAgo(vulnerability.detectedAt)}</span>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">{resourceName(vulnerability.resourceId)}</div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>CVE Context</CardTitle>
            <CardDescription>Affected asset and remediation detail</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedVulnerability ? (
              <EmptyPanel icon={Bug} title="No vulnerability selected" description="Select a CVE or package finding from the queue to inspect remediation context." />
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <ToneBadge value={selectedVulnerability.severity} />
                    <ToneBadge value={selectedVulnerability.status} />
                  </div>
                  <h2 className="text-lg font-semibold">{selectedVulnerability.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedVulnerability.description}</p>
                </div>
                <Separator />
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="CVE">
                    {selectedVulnerability.cveId ? (
                      <a
                        href={`https://nvd.nist.gov/vuln/detail/${selectedVulnerability.cveId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {selectedVulnerability.cveId}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      "No CVE linked"
                    )}
                  </DetailRow>
                  <DetailRow label="Affected resource">{resourceName(selectedVulnerability.resourceId)}</DetailRow>
                  <DetailRow label="Detected">{compactDate(selectedVulnerability.detectedAt)}</DetailRow>
                  <DetailRow label="Status">{selectedVulnerability.status}</DetailRow>
                </dl>
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Remediation</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedVulnerability.remediation || "No remediation guidance is attached to this finding yet."}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">Operational Next Step</p>
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      Validate the owning image or resource, patch to the recommended fixed version when available,
                      then rerun the vulnerability scan to confirm closure.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
