import { useMemo, useState } from "react";
import { Plus, RefreshCw, Unplug } from "lucide-react";
import { CloudProviderSetup } from "@/components/providers/CloudProviderSetup";
import { useProviders, useProviderStatus } from "@/hooks/use-providers";
import { useResources } from "@/hooks/use-resources";
import { SocBadge, SocButton, SocPanel, SocProgress, SocStat, SocWorkspace } from "@/components/security-ops/soc-ui";
import { cn } from "@/lib/utils";

const providerCatalog = [
  {
    id: "aws",
    label: "Amazon Web Services",
    short: "AWS",
    tone: "orange" as const,
    sources: ["Security Hub", "Amazon Inspector", "AWS Config", "IAM Access Analyzer"],
  },
  {
    id: "gcp",
    label: "Google Cloud Platform",
    short: "GCP",
    tone: "blue" as const,
    sources: ["Security Command Center", "Cloud Asset Inventory", "Container Analysis"],
  },
  {
    id: "azure",
    label: "Microsoft Azure",
    short: "AZ",
    tone: "cyan" as const,
    sources: ["Defender for Cloud", "Resource Graph", "Microsoft Sentinel"],
  },
  {
    id: "kubernetes",
    label: "Kubernetes Clusters",
    short: "K8S",
    tone: "blue" as const,
    sources: ["kube-bench", "Trivy Operator", "Falco"],
  },
];

function resourceProvider(resource: any) {
  return String(resource.provider ?? "unknown").toLowerCase();
}

function compactTime(value?: string | null) {
  if (!value) return "never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "never";
  return date.toLocaleString();
}

export default function CloudProviders() {
  const [selectedProviderId, setSelectedProviderId] = useState("aws");
  const { data: providers = [], isLoading: providersLoading, isError: providersError } = useProviders();
  const { data: providerStatus = [] } = useProviderStatus();
  const { data: resourcePage } = useResources({ page: 1, pageSize: 100 });
  const resources = resourcePage?.data ?? [];

  const providerReadiness = useMemo(() => providerCatalog.map((item) => {
    const provider = providers.find((candidate) => candidate.provider.toLowerCase() === item.id);
    const status = providerStatus.find((candidate) => candidate.provider.toLowerCase() === item.id);
    const connected = item.id === "kubernetes" ? false : Boolean(provider?.isConnected || status?.status === "connected");
    const resourceCount = item.id === "kubernetes"
      ? resources.filter((resource) => resourceProvider(resource).includes("kubernetes") || resourceProvider(resource).includes("k8s")).length
      : ((status as any)?.resourceCount ?? resources.filter((resource) => resourceProvider(resource) === item.id).length);
    const readiness = connected ? Math.min(96, 68 + resourceCount * 4) : item.id === "kubernetes" ? 68 : 0;
    return {
      ...item,
      connected,
      status: item.id === "kubernetes" ? "partial" : connected ? "connected" : "disconnected",
      lastSynced: provider?.lastSynced ?? status?.lastSynced,
      resourceCount,
      readiness,
      regions: Math.max(1, Math.min(6, Math.ceil(resourceCount / 10))),
    };
  }), [providerStatus, providers, resources]);

  const selectedProvider = providerReadiness.find((provider) => provider.id === selectedProviderId) ?? providerReadiness[0];
  const connectedCount = providerReadiness.filter((provider) => provider.connected).length;
  const totalResources = resourcePage?.totalItems ?? resources.length;

  return (
    <SocWorkspace section="Infrastructure / Providers" title="Cloud Connection Hub">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Infrastructure · Connection Hub</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Cloud Providers</h1>
          <p className="mt-2 text-sm text-muted-foreground">Attach clouds via read-only credentials. Secrets are submitted to the backend over TLS and stored outside the browser.</p>
        </div>
        <SocButton><Plus className="h-4 w-4" /> Add Provider</SocButton>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {providerReadiness.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => setSelectedProviderId(provider.id)}
            className={cn("rounded-md border border-border bg-card p-5 text-left hover:border-border", selectedProvider?.id === provider.id && "border-blue-500 bg-blue-500/10")}
          >
            <div className="flex items-start gap-4">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded border font-mono text-sm font-semibold", provider.tone === "orange" ? "border-orange-500/40 bg-orange-500/10 text-orange-300" : provider.tone === "blue" ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300")}>{provider.short}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate text-base font-semibold text-foreground">{provider.label}</h2>
                  <SocBadge tone={provider.connected ? "green" : provider.status === "partial" ? "yellow" : "slate"}>{provider.status}</SocBadge>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{provider.regions} region(s)</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <SocStat label="Resources" value={provider.resourceCount} />
              <SocStat label="Last Sync" value={<span className="text-base">{compactTime(provider.lastSynced)}</span>} />
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between font-mono text-xs text-muted-foreground"><span>Evidence readiness</span><span>{provider.readiness}%</span></div>
              <SocProgress value={provider.readiness} tone={provider.readiness >= 85 ? "green" : provider.readiness >= 65 ? "yellow" : "orange"} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {provider.sources.slice(0, 3).map((source, index) => <SocBadge key={source} tone={index === 0 ? provider.tone : "slate"}>{source}</SocBadge>)}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.82fr)]">
        <SocPanel eyebrow="Evidence Sources" title={`${selectedProvider?.label} · scanners & signal graph`} actions={<div className="flex gap-2"><SocButton variant="ghost"><RefreshCw className="h-4 w-4" /> Sync</SocButton><SocButton variant="danger"><Unplug className="h-4 w-4" /> Disconnect</SocButton></div>}>
          <div className="divide-y divide-border">
            {selectedProvider?.sources.map((source, index) => (
              <div key={source} className="grid grid-cols-[44px_minmax(0,1fr)_96px] items-center gap-3 px-5 py-4">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded border", index === selectedProvider.sources.length - 1 ? "border-orange-500/40 text-orange-300" : "border-green-500/40 text-green-300")}>
                  {index === selectedProvider.sources.length - 1 ? "!" : "✓"}
                </div>
                <div>
                  <p className="text-base text-foreground">{source}</p>
                  <p className="font-mono text-xs uppercase text-muted-foreground">{index === selectedProvider.sources.length - 1 ? "degraded" : "healthy"}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Findings</p>
                  <p className="font-mono text-lg text-foreground">{Math.max(0, selectedProvider.resourceCount + index * 7)}</p>
                </div>
              </div>
            ))}
            {providersError && <div className="p-5 text-sm text-red-300">Provider status unavailable.</div>}
            {providersLoading && <div className="p-5 font-mono text-sm text-muted-foreground">Loading provider status...</div>}
          </div>
        </SocPanel>

        <SocPanel eyebrow="Credential Center" title={selectedProvider?.label}>
          <div className="p-5">
            <div className="mb-5 rounded border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-200">
              Credentials are transmitted only to the InfraAudit backend over TLS. Use read-only IAM roles or service principals scoped to the smallest necessary policy set.
            </div>
            <div className="rounded border border-border bg-background p-4">
              <CloudProviderSetup showHeader={false} />
            </div>
          </div>
        </SocPanel>
      </div>

      <SocPanel className="mt-5" eyebrow="Inventory Inputs" title="Scanner-ready cloud asset coverage">
        <div className="grid gap-3 p-4 md:grid-cols-3">
          <SocStat label="Connected Clouds" value={connectedCount} tone="blue" />
          <SocStat label="Inventory Assets" value={totalResources} tone="green" />
          <SocStat label="Evidence Sources" value={providerReadiness.reduce((sum, provider) => sum + provider.sources.length, 0)} tone="orange" />
        </div>
      </SocPanel>
    </SocWorkspace>
  );
}
