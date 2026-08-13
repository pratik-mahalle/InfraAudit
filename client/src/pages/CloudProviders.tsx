import { useMemo } from "react";
import { useLocation } from "wouter";
import { CloudProviderSetup } from "@/components/providers/CloudProviderSetup";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DetailRow, EmptyPanel, MetricTile, ToneBadge } from "@/components/security-ops/ops-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useProviders, useProviderStatus } from "@/hooks/use-providers";
import { useResources } from "@/hooks/use-resources";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Database,
  KeyRound,
  Layers3,
  Link2,
  RefreshCw,
  ShieldCheck,
  Server,
} from "lucide-react";

const providerCatalog = [
  {
    id: "aws",
    label: "Amazon Web Services",
    short: "AWS",
    tone: "orange" as const,
    telemetry: ["Security Hub", "Inspector", "Config", "IAM Access Analyzer"],
  },
  {
    id: "gcp",
    label: "Google Cloud",
    short: "GCP",
    tone: "blue" as const,
    telemetry: ["Security Command Center", "Cloud Asset Inventory", "IAM Recommender"],
  },
  {
    id: "azure",
    label: "Microsoft Azure",
    short: "Azure",
    tone: "violet" as const,
    telemetry: ["Defender for Cloud", "Resource Graph", "Policy Insights"],
  },
];

function resourceProvider(resource: any) {
  return String(resource.provider ?? "unknown").toLowerCase();
}

function resourceType(resource: any) {
  return resource.type ?? resource.resourceType ?? "unknown";
}

function compactTime(value?: string | null) {
  if (!value) return "Never synced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never synced";
  return date.toLocaleString();
}

export default function CloudProviders() {
  const [, navigate] = useLocation();
  const { data: providers = [], isLoading: providersLoading, isError: providersError } = useProviders();
  const { data: providerStatus = [] } = useProviderStatus();
  const { data: resourcePage, isLoading: resourcesLoading } = useResources({ page: 1, pageSize: 100 });

  const resources = resourcePage?.data ?? [];
  const totalResources = resourcePage?.totalItems ?? resources.length;
  const connectedProviders = providers.filter((provider) => provider.isConnected);
  const lastSync = connectedProviders
    .map((provider) => provider.lastSynced)
    .filter(Boolean)
    .sort()
    .at(-1);

  const providerReadiness = useMemo(() => providerCatalog.map((item) => {
    const provider = providers.find((candidate) => candidate.provider.toLowerCase() === item.id);
    const status = providerStatus.find((candidate) => candidate.provider.toLowerCase() === item.id);
    const connected = Boolean(provider?.isConnected || status?.status === "connected");
    const resourceCount = (status as any)?.resourceCount ?? (status as any)?.resource_count ?? resources.filter((resource) => resourceProvider(resource) === item.id).length;
    return {
      ...item,
      connected,
      lastSynced: provider?.lastSynced ?? status?.lastSynced,
      resourceCount,
      message: status?.message,
      status: status?.status ?? (connected ? "connected" : "disconnected"),
    };
  }), [providerStatus, providers, resources]);

  const resourceTypes = Object.entries(resources.reduce<Record<string, number>>((counts, resource) => {
    const type = resourceType(resource);
    counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <DashboardLayout>
      <PageHeader
        title="Cloud Connection Hub"
        description="Connect provider accounts, monitor sync readiness, and confirm which inventories are ready for security scanning."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/resources")}>
              <Database className="h-4 w-4" />
              Inventory
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate("/drift")}>
              <RefreshCw className="h-4 w-4" />
              Drift Review
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={Cloud} label="Connected clouds" value={connectedProviders.length} tone="blue" helper={`${providerCatalog.length} cloud providers supported`} />
        <MetricTile icon={Server} label="Inventory assets" value={resourcesLoading ? "..." : totalResources} tone="emerald" helper="Resources available to scanners" />
        <MetricTile icon={Activity} label="Last sync" value={lastSync ? new Date(lastSync).toLocaleDateString() : "None"} tone={lastSync ? "slate" : "amber"} helper={compactTime(lastSync)} />
        <MetricTile icon={ShieldCheck} label="Ready channels" value={providerReadiness.filter((provider) => provider.connected).length} tone="orange" helper="Cloud-native evidence sources" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Provider Readiness</CardTitle>
            <CardDescription>Connection, inventory, and scanner evidence coverage by provider</CardDescription>
          </CardHeader>
          <CardContent>
            {providersError ? (
              <EmptyPanel icon={AlertTriangle} title="Provider status unavailable" description="InfraAudit could not load provider connection status from the API." />
            ) : providersLoading ? (
              <EmptyPanel icon={RefreshCw} title="Loading providers" description="Fetching cloud connection state and sync metadata." />
            ) : (
              <div className="grid gap-3 lg:grid-cols-3">
                {providerReadiness.map((provider) => (
                  <section
                    key={provider.id}
                    className={cn(
                      "rounded-lg border p-4",
                      provider.connected ? "bg-card" : "bg-muted/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{provider.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{provider.short} account inventory</p>
                      </div>
                      <ToneBadge value={provider.status} tone={provider.connected ? "emerald" : "slate"} />
                    </div>
                    <dl className="mt-5 grid gap-4">
                      <DetailRow label="Last synced">{compactTime(provider.lastSynced)}</DetailRow>
                      <DetailRow label="Resources">{provider.resourceCount}</DetailRow>
                      {provider.message && <DetailRow label="Status note">{provider.message}</DetailRow>}
                    </dl>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {provider.telemetry.map((source) => (
                        <ToneBadge key={source} value={source} tone={provider.connected ? provider.tone : "slate"} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Scanner Inputs</CardTitle>
            <CardDescription>What the security engine can use right now</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-md border bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Resource snapshots</p>
                  <p className="text-xs text-muted-foreground">Normalized inventory for evidence checks</p>
                </div>
              </div>
              <ToneBadge value={totalResources} tone="emerald" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-md border bg-blue-500/10 p-2 text-blue-700 dark:text-blue-300">
                  <Link2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Connected providers</p>
                  <p className="text-xs text-muted-foreground">Credential-backed sync targets</p>
                </div>
              </div>
              <ToneBadge value={connectedProviders.length} tone="blue" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-md border bg-orange-500/10 p-2 text-orange-700 dark:text-orange-300">
                  <Layers3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Asset type spread</p>
                  <p className="text-xs text-muted-foreground">Compute, storage, IAM, network scope</p>
                </div>
              </div>
              <ToneBadge value={resourceTypes.length} tone="orange" />
            </div>
            {resourceTypes.length > 0 && (
              <div className="space-y-2 pt-2">
                {resourceTypes.map(([type, count]) => (
                  <button key={type} type="button" onClick={() => navigate(`/resources?type=${encodeURIComponent(type)}`)} className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/40">
                    <span className="truncate text-sm">{type}</span>
                    <span className="flex items-center gap-2">
                      <ToneBadge value={count} tone="slate" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 rounded-lg border bg-card p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Credential Center</h2>
            <p className="text-sm text-muted-foreground">Manage provider credentials, Kubernetes access, sync jobs, and disconnect actions.</p>
          </div>
          <ToneBadge value="encrypted storage" tone="emerald" />
        </div>
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">
            <KeyRound className="mt-0.5 h-4 w-4 flex-none" />
            <p className="text-sm">
              Use dedicated read-only identities for inventory sync. Provider secrets stay in the backend; the browser only submits them through the authenticated API.
            </p>
          </div>
          <CloudProviderSetup showHeader={false} />
        </div>
      </div>
    </DashboardLayout>
  );
}
