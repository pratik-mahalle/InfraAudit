import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Copy,
  History,
  Loader2,
  Plus,
  RadioTower,
  RefreshCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  kubernetesConnectorKeys,
  useCreateKubernetesConnector,
  useKubernetesConnectors,
  useKubernetesInventorySnapshot,
  useKubernetesInventorySnapshots,
  useRevokeKubernetesConnector,
} from '@/hooks/use-kubernetes-connectors';
import { queryClient } from '@/lib/queryClient';
import type {
  CreateKubernetesConnectorResponse,
  KubernetesConnector,
  KubernetesInventoryStatus,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { EmptyPanel, ToneBadge } from '@/components/security-ops/ops-ui';

const chartVersion = '0.2.0';

function relativeTime(value?: string) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return formatDistanceToNow(date, { addSuffix: true });
}

function connectorTone(connector: KubernetesConnector): 'emerald' | 'amber' | 'blue' | 'slate' {
  if (connector.status === 'connected' && connector.inventoryStatus === 'applied') return 'emerald';
  if (connector.status === 'connected' && connector.inventoryStatus === 'partial') return 'amber';
  if (connector.status === 'pending') return 'blue';
  return 'slate';
}

function inventoryTone(status: KubernetesInventoryStatus): 'emerald' | 'amber' | 'slate' {
  if (status === 'applied') return 'emerald';
  if (status === 'partial') return 'amber';
  return 'slate';
}

export function KubernetesAgentConnectors() {
  const { toast } = useToast();
  const [selectedConnectorId, setSelectedConnectorId] = useState<number | null>(null);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connectorName, setConnectorName] = useState('');
  const [createdConnector, setCreatedConnector] = useState<CreateKubernetesConnectorResponse | null>(null);

  const connectorsQuery = useKubernetesConnectors();
  const connectors = connectorsQuery.data ?? [];
  const createConnector = useCreateKubernetesConnector();
  const revokeConnector = useRevokeKubernetesConnector();
  const snapshotsQuery = useKubernetesInventorySnapshots(selectedConnectorId);
  const snapshots = snapshotsQuery.data?.items ?? [];
  const snapshotQuery = useKubernetesInventorySnapshot(selectedConnectorId, selectedSnapshotId);
  const selectedConnector = connectors.find((connector) => connector.id === selectedConnectorId);

  useEffect(() => {
    if (selectedConnectorId === null && connectors.length > 0) {
      setSelectedConnectorId(connectors[0].id);
    } else if (selectedConnectorId !== null && !connectors.some((connector) => connector.id === selectedConnectorId)) {
      setSelectedConnectorId(connectors[0]?.id ?? null);
    }
  }, [connectors, selectedConnectorId]);

  useEffect(() => {
    if (snapshots.length === 0) {
      setSelectedSnapshotId(null);
      return;
    }
    if (!selectedSnapshotId || !snapshots.some((snapshot) => snapshot.id === selectedSnapshotId)) {
      setSelectedSnapshotId(snapshots[0].id);
    }
  }, [selectedSnapshotId, snapshots]);

  const resourcesByKind = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of snapshotQuery.data?.resources ?? []) {
      totals.set(item.kind, (totals.get(item.kind) ?? 0) + 1);
    }
    return Array.from(totals.entries()).sort((left, right) => right[1] - left[1]);
  }, [snapshotQuery.data?.resources]);

  const openCreateDialog = () => {
    setConnectorName('');
    setCreatedConnector(null);
    setDialogOpen(true);
  };

  const submitConnector = async () => {
    const name = connectorName.trim();
    if (!name) return;
    try {
      const result = await createConnector.mutateAsync(name);
      setCreatedConnector(result);
      setSelectedConnectorId(result.connector.id);
      toast({ title: 'Connector created', description: 'Install the agent with the one-time token shown now.' });
    } catch (error) {
      toast({ title: 'Failed to create connector', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: `Failed to copy ${label.toLowerCase()}`, variant: 'destructive' });
    }
  };

  const revoke = async (connector: KubernetesConnector) => {
    if (!confirm(`Revoke connector "${connector.name}"? Current inventory will be removed, but snapshot history is retained.`)) return;
    try {
      await revokeConnector.mutateAsync(connector.id);
      toast({ title: 'Connector revoked', description: 'Current inventory was removed and snapshot history was retained.' });
    } catch (error) {
      toast({ title: 'Failed to revoke connector', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const secretCommand = createdConnector
    ? `kubectl create namespace infraudit-agent --dry-run=client -o yaml | kubectl apply -f -\nkubectl -n infraudit-agent create secret generic infraudit-kubernetes-agent --from-literal=token='${createdConnector.token}'`
    : '';
  const helmCommand = `helm upgrade --install infraudit-kubernetes-agent oci://ghcr.io/pratik-mahalle/charts/infraudit-kubernetes-agent --version ${chartVersion} --namespace infraudit-agent`;

  return (
    <section className="mb-8" aria-labelledby="outbound-connectors-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <RadioTower className="h-4 w-4" />
            Outbound agents
          </div>
          <h2 id="outbound-connectors-title" className="mt-1 text-xl font-semibold">Private cluster inventory</h2>
          <p className="mt-1 text-sm text-muted-foreground">Agents send health and security summaries over HTTPS without exposing the Kubernetes API.</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Connect Agent
        </Button>
      </div>

      {connectorsQuery.isError ? (
        <EmptyPanel icon={AlertCircle} title="Connector API unavailable" description={(connectorsQuery.error as Error).message} />
      ) : connectorsQuery.isLoading ? (
        <EmptyPanel icon={Loader2} title="Loading connectors" description="Fetching outbound cluster connections." />
      ) : connectors.length === 0 ? (
        <EmptyPanel
          icon={RadioTower}
          title="No outbound agents"
          description="Create a connector for clusters whose Kubernetes API is not reachable from InfraAudit."
          action={<Button onClick={openCreateDialog}>Connect Agent</Button>}
        />
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Agent connections</CardTitle>
                  <CardDescription>{connectors.length} configured</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Refresh connectors"
                  onClick={() => queryClient.invalidateQueries({ queryKey: kubernetesConnectorKeys.all })}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {connectors.map((connector) => (
                  <div
                    key={connector.id}
                    className={cn(
                      'flex w-full items-start rounded-md border transition-colors hover:bg-muted/50',
                      selectedConnectorId === connector.id && 'border-primary bg-muted/50',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedConnectorId(connector.id)}
                      className="min-w-0 flex-1 p-3 text-left"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold">{connector.name}</span>
                          <ToneBadge value={connector.status} tone={connectorTone(connector)} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Seen {relativeTime(connector.lastSeenAt)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate text-muted-foreground">{connector.kubernetesVersion || 'Waiting for agent'}</span>
                        <span className="shrink-0 font-mono">{connector.resourceCount} resources</span>
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mr-2 mt-2 h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Revoke ${connector.name}`}
                      disabled={connector.status === 'revoked' || revokeConnector.isPending}
                      onClick={() => revoke(connector)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{selectedConnector?.name || 'Snapshot history'}</CardTitle>
                    <CardDescription>
                      {selectedConnector?.lastInventoryAt
                        ? `Latest inventory ${relativeTime(selectedConnector.lastInventoryAt)}`
                        : 'Waiting for the first inventory upload'}
                    </CardDescription>
                  </div>
                  {selectedConnector?.inventoryStatus && (
                    <ToneBadge value={selectedConnector.inventoryStatus} tone={inventoryTone(selectedConnector.inventoryStatus)} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {snapshotsQuery.isLoading ? (
                  <EmptyPanel icon={Loader2} title="Loading history" description="Fetching inventory snapshots." />
                ) : snapshotsQuery.isError ? (
                  <EmptyPanel icon={AlertCircle} title="History unavailable" description={(snapshotsQuery.error as Error).message} />
                ) : snapshots.length === 0 ? (
                  <EmptyPanel icon={History} title="No snapshots received" description="Install the agent to begin recording cluster inventory history." />
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Collected</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Resources</TableHead>
                          <TableHead>Agent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {snapshots.map((snapshot) => (
                          <TableRow
                            key={snapshot.id}
                            className={cn('cursor-pointer', selectedSnapshotId === snapshot.id && 'bg-muted/50')}
                            onClick={() => setSelectedSnapshotId(snapshot.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSelectedSnapshotId(snapshot.id);
                              }
                            }}
                            tabIndex={0}
                            aria-selected={selectedSnapshotId === snapshot.id}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock3 className="h-4 w-4 text-muted-foreground" />
                                <span>{relativeTime(snapshot.collectedAt)}</span>
                              </div>
                            </TableCell>
                            <TableCell><ToneBadge value={snapshot.status} tone={inventoryTone(snapshot.status)} /></TableCell>
                            <TableCell className="text-right font-mono">{snapshot.resourceCount}</TableCell>
                            <TableCell className="font-mono text-xs">{snapshot.agentVersion || 'unknown'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {selectedSnapshotId && (
            <div className="mt-5 border-t pt-5">
              {snapshotQuery.isLoading ? (
                <EmptyPanel icon={Loader2} title="Loading snapshot" description="Fetching the detailed inventory report." />
              ) : snapshotQuery.isError ? (
                <EmptyPanel icon={AlertCircle} title="Snapshot unavailable" description={(snapshotQuery.error as Error).message} />
              ) : snapshotQuery.data ? (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold">Inventory report</h3>
                        <p className="text-sm text-muted-foreground">{new Date(snapshotQuery.data.collectedAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ToneBadge value={snapshotQuery.data.status} tone={inventoryTone(snapshotQuery.data.status)} />
                        <ToneBadge value={`${snapshotQuery.data.resourceCount} resources`} tone="blue" />
                      </div>
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Resource</TableHead>
                            <TableHead>Kind</TableHead>
                            <TableHead>Namespace</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(snapshotQuery.data.resources ?? []).slice(0, 100).map((item) => (
                            <TableRow key={`${item.kind}:${item.uid}`}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.kind}</TableCell>
                              <TableCell className="font-mono text-xs">{item.namespace || 'cluster'}</TableCell>
                              <TableCell><ToneBadge value={item.status} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {(snapshotQuery.data.resources?.length ?? 0) > 100 && (
                      <p className="mt-2 text-xs text-muted-foreground">Showing the first 100 resources in this snapshot.</p>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div>
                      <h3 className="mb-3 text-sm font-semibold">Resource mix</h3>
                      <div className="space-y-2">
                        {resourcesByKind.map(([kind, count]) => (
                          <div key={kind} className="flex items-center justify-between rounded-md border px-3 py-2">
                            <span className="text-sm">{kind}</span>
                            <span className="font-mono text-sm">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-3 text-sm font-semibold">Collection coverage</h3>
                      {(snapshotQuery.data.errors ?? []).length === 0 ? (
                        <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                          <p className="text-sm">All permitted resource groups were collected.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(snapshotQuery.data.errors ?? []).map((error) => (
                            <div key={`${error.resource}:${error.message}`} className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                              <p className="text-sm font-medium">{error.resource}</p>
                              <p className="mt-1 break-words text-xs text-muted-foreground">{error.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setCreatedConnector(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Connect a Kubernetes agent</DialogTitle>
            <DialogDescription>The token is shown once. Store it in a Kubernetes Secret, then install the outbound agent.</DialogDescription>
          </DialogHeader>

          {!createdConnector ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label htmlFor="connector-name" className="text-sm font-medium">Cluster name</label>
                <Input
                  id="connector-name"
                  value={connectorName}
                  onChange={(event) => setConnectorName(event.target.value)}
                  placeholder="production-private"
                  maxLength={255}
                  autoFocus
                />
              </div>
              <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-sm text-muted-foreground">The agent has read-only inventory permissions and no access to Secrets or ConfigMaps.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={submitConnector} disabled={!connectorName.trim() || createConnector.isPending} className="gap-2">
                  {createConnector.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create Connector
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                  Connector ready
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Run both commands from a workstation with cluster-admin access.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">1. Create the connector Secret</p>
                  <Button variant="outline" size="sm" onClick={() => copy(secretCommand, 'Secret command')} className="gap-2">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
                <pre className="max-h-36 overflow-auto rounded-md border bg-muted p-3 text-xs"><code>{secretCommand}</code></pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">2. Install the agent</p>
                  <Button variant="outline" size="sm" onClick={() => copy(helmCommand, 'Helm command')} className="gap-2">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
                <pre className="overflow-auto rounded-md border bg-muted p-3 text-xs"><code>{helmCommand}</code></pre>
              </div>

              <DialogFooter>
                <Button onClick={() => setDialogOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
