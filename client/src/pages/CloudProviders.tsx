import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Database,
  Loader2,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { CloudProviderSetup } from "@/components/providers/CloudProviderSetup";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useDisconnectProvider, useProviders, useProviderStatus, useSyncProvider } from "@/hooks/use-providers";
import { useResources } from "@/hooks/use-resources";
import { SocBadge, SocButton, SocPanel, SocStat, SocWorkspace } from "@/components/security-ops/soc-ui";
import { cn } from "@/lib/utils";

const providerCatalog = [
  {
    id: "aws",
    label: "Amazon Web Services",
    short: "AWS",
    Icon: Cloud,
    tone: "orange" as const,
  },
  {
    id: "gcp",
    label: "Google Cloud Platform",
    short: "GCP",
    Icon: Database,
    tone: "blue" as const,
  },
  {
    id: "azure",
    label: "Microsoft Azure",
    short: "AZ",
    Icon: ShieldCheck,
    tone: "cyan" as const,
  },
  {
    id: "kubernetes",
    label: "Kubernetes",
    short: "K8S",
    Icon: Server,
    tone: "blue" as const,
  },
];

const providerRequirements: Record<string, string[]> = {
  aws: [
    "InfraAudit organization owner or administrator access",
    "AWS permission to deploy an IAM role with CloudFormation",
    "Save the stack RoleArn output for the activation step",
  ],
  gcp: [
    "Service account key JSON",
    "Project ID for the target project",
    "Viewer access for inventory, monitoring, security, and billing data",
  ],
  azure: [
    "App registration client ID and secret",
    "Tenant ID and subscription ID",
    "Reader access on the target subscription",
  ],
  kubernetes: [
    "Kubeconfig with read-only cluster access",
    "Cluster name or kubeconfig context",
    "Network access from the InfraAudit scanner runtime",
  ],
};

function resourceProvider(resource: any) {
  return String(resource.provider ?? "").toLowerCase();
}

function compactTime(value?: string | null) {
  if (!value) return "Never synced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never synced";
  return date.toLocaleString();
}

function providerTone(status?: string, connected?: boolean) {
  if (status === "error") return "red" as const;
  if (status === "partial") return "orange" as const;
  if (connected) return "green" as const;
  return "slate" as const;
}

export default function CloudProviders() {
  const { toast } = useToast();
  const [selectedProviderId, setSelectedProviderId] = useState("aws");
  const [connectOpen, setConnectOpen] = useState(false);
  const { data: providers = [], isLoading: providersLoading, isError: providersError, error: providersErrorValue } = useProviders();
  const { data: providerStatus = [], isLoading: statusLoading } = useProviderStatus();
  const { data: resourcePage, isLoading: resourcesLoading } = useResources({ page: 1, pageSize: 100 });
  const syncProvider = useSyncProvider();
  const disconnectProvider = useDisconnectProvider();
  const resources = resourcePage?.data ?? [];

  const providerRows = useMemo(() => providerCatalog.map((catalogItem) => {
    const provider = providers.find((candidate) => candidate.provider.toLowerCase() === catalogItem.id);
    const status = providerStatus.find((candidate) => candidate.provider.toLowerCase() === catalogItem.id);
    const resourceCount = status?.resourceCount ?? resources.filter((resource) => {
      const providerName = resourceProvider(resource);
      return catalogItem.id === "kubernetes"
        ? providerName.includes("kubernetes") || providerName.includes("k8s")
        : providerName === catalogItem.id;
    }).length;
    const connected = Boolean(
      provider?.isConnected
      || status?.status === "connected"
      || status?.status === "partial"
      || (catalogItem.id === "kubernetes" && resourceCount > 0),
    );

    return {
      ...catalogItem,
      connected,
      resourceCount,
      status: status?.status ?? (connected ? "connected" : "disconnected"),
      message: status?.message,
      lastSynced: provider?.lastSynced ?? status?.lastSynced,
    };
  }), [providerStatus, providers, resources]);

  const selectedProvider = providerRows.find((provider) => provider.id === selectedProviderId) ?? providerRows[0];
  const connectedProviders = providerRows.filter((provider) => provider.connected);
  const disconnectedProviders = providerRows.filter((provider) => !provider.connected);
  const totalResources = resourcePage?.totalItems ?? resources.length;
  const isLoading = providersLoading || statusLoading || resourcesLoading;

  const handleAddProvider = (providerId = selectedProviderId) => {
    setSelectedProviderId(providerId);
    setConnectOpen(true);
  };

  const handleSync = (providerId: string) => {
    syncProvider.mutate(providerId, {
      onSuccess: () => toast({ title: "Provider sync started", description: `${providerId.toUpperCase()} inventory refresh is running.` }),
      onError: (error: Error) => toast({ title: "Sync failed", description: error.message, variant: "destructive" }),
    });
  };

  const handleDisconnect = (providerId: string) => {
    disconnectProvider.mutate(providerId, {
      onSuccess: () => toast({ title: "Provider disconnected", description: `${providerId.toUpperCase()} was disconnected.` }),
      onError: (error: Error) => toast({ title: "Disconnect failed", description: error.message, variant: "destructive" }),
    });
  };

  return (
    <SocWorkspace section="Infrastructure / Providers" title="Cloud Providers">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Provider Connections</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Manage cloud accounts and inventory sync</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Set up least-privilege provider identities, review sync health, and confirm which cloud inventories are feeding InfraAudit.
            </p>
          </div>
          <Button onClick={() => handleAddProvider()} className="gap-2 self-start lg:self-center">
            <Plus className="h-4 w-4" />
            Add Provider
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <SocStat label="Connected" value={`${connectedProviders.length}/${providerRows.length}`} tone="green" />
          <SocStat label="Inventory Assets" value={totalResources} tone="blue" />
          <SocStat label="Needs Setup" value={disconnectedProviders.length} tone={disconnectedProviders.length > 0 ? "orange" : "green"} />
        </div>

        {providersError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              <p className="font-semibold">Could not load provider status</p>
              <p className="mt-1 text-red-700/80 dark:text-red-300/80">{providersErrorValue instanceof Error ? providersErrorValue.message : "The providers API returned an error."}</p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {providerRows.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => setSelectedProviderId(provider.id)}
              className={cn(
                "rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50",
                selectedProvider?.id === provider.id && "border-primary bg-primary/10",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md border",
                  provider.tone === "orange" && "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-300",
                  provider.tone === "blue" && "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
                  provider.tone === "cyan" && "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
                )}>
                  <provider.Icon className="h-5 w-5" />
                </span>
                <SocBadge tone={providerTone(provider.status, provider.connected)}>{provider.status}</SocBadge>
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{provider.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{provider.resourceCount} resources</p>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant={provider.connected ? "outline" : "default"}
                  size="sm"
                  className="gap-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleAddProvider(provider.id);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {provider.connected ? "Update" : "Connect"}
                </Button>
                {provider.connected && provider.id !== "kubernetes" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={syncProvider.isPending}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSync(provider.id);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sync
                  </Button>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <SocPanel
            eyebrow="Connected Accounts"
            title="Provider status"
            actions={isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : undefined}
          >
            <div className="divide-y divide-border">
              {providerRows.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setSelectedProviderId(provider.id)}
                  className={cn(
                    "grid w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/60 md:grid-cols-[44px_minmax(0,1fr)_130px_160px]",
                    selectedProvider?.id === provider.id && "bg-primary/10",
                  )}
                >
                  <span className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-md border",
                    provider.tone === "orange" && "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-300",
                    provider.tone === "blue" && "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
                    provider.tone === "cyan" && "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
                  )}>
                    <provider.Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{provider.label}</span>
                      <SocBadge tone={providerTone(provider.status, provider.connected)}>{provider.status}</SocBadge>
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">{provider.message || compactTime(provider.lastSynced)}</span>
                  </span>
                  <span className="font-mono text-sm text-muted-foreground md:text-right">
                    <strong className="text-foreground">{provider.resourceCount}</strong> resources
                  </span>
                  <span className="flex gap-2 md:justify-end" onClick={(event) => event.stopPropagation()}>
                    <SocButton
                      variant="ghost"
                      className="h-9 px-3"
                      disabled={!provider.connected || provider.id === "kubernetes" || syncProvider.isPending}
                      onClick={() => handleSync(provider.id)}
                    >
                      {syncProvider.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Sync
                    </SocButton>
                    <SocButton
                      variant="danger"
                      className="h-9 px-3"
                      disabled={!provider.connected || provider.id === "kubernetes" || disconnectProvider.isPending}
                      onClick={() => handleDisconnect(provider.id)}
                    >
                      {disconnectProvider.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
                    </SocButton>
                  </span>
                </button>
              ))}
            </div>
          </SocPanel>

          <SocPanel eyebrow="Selected Provider" title={selectedProvider?.label || "Provider"}>
            <div className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{selectedProvider?.short}</p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">{selectedProvider?.connected ? "Connected" : "Not connected"}</h3>
                </div>
                {selectedProvider?.connected ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Unplug className="h-5 w-5 text-muted-foreground" />}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <SocStat label="Resources" value={selectedProvider?.resourceCount ?? 0} tone="blue" />
                <SocStat label="Last Sync" value={<span className="text-base">{compactTime(selectedProvider?.lastSynced)}</span>} />
              </div>

              <div>
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Connection State</p>
                <div className="space-y-3 rounded-md border border-border bg-background p-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Provider ID</span>
                    <span className="font-mono text-foreground">{selectedProvider?.id}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Status</span>
                    <SocBadge tone={providerTone(selectedProvider?.status, selectedProvider?.connected)}>{selectedProvider?.status}</SocBadge>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">API message</span>
                    <span className="max-w-[210px] text-right text-foreground">{selectedProvider?.message || "No status message"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
                Use a dedicated read-only identity for each cloud account. AWS uses a cross-account role and does not require long-lived access keys.
              </div>
            </div>
          </SocPanel>
        </div>

        <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
          <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Set up or update {selectedProvider?.label || "provider"}</DialogTitle>
              <DialogDescription>
                Choose the provider tab and follow its least-privilege onboarding flow.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Setup checklist</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(providerRequirements[selectedProviderId] ?? []).map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Current state</p>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Status</span>
                    <SocBadge tone={providerTone(selectedProvider?.status, selectedProvider?.connected)}>{selectedProvider?.status}</SocBadge>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Resources</span>
                    <span className="font-mono text-foreground">{selectedProvider?.resourceCount ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last sync</span>
                    <p className="mt-1 text-foreground">{compactTime(selectedProvider?.lastSynced)}</p>
                  </div>
                </div>
              </div>
            </div>
            <CloudProviderSetup showHeader={false} showConnectedProviders={false} initialTab={selectedProviderId} allowConnectedProviderUpdate />
          </DialogContent>
        </Dialog>
      </div>
    </SocWorkspace>
  );
}
