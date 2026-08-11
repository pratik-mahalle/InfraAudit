import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, BrainCircuit, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAIConfig, useAIRuns, useUpdateAIConfig } from '@/hooks/use-ai';
import { AIProviderName, AIRunStatus } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PAGE_SIZE = 15;

const providerLabels: Record<AIProviderName, string> = {
  claude: 'Anthropic Claude',
  gemini: 'Google Gemini',
  openai: 'OpenAI',
};

const statusStyles: Record<AIRunStatus, string> = {
  queued: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  running: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  succeeded: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  rejected: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  failed: 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  cancelled: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
};

type ProviderRow = { provider: AIProviderName; enabled: boolean; available: boolean };

function humanize(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function AIEngineSettings() {
  const { toast } = useToast();
  const configQuery = useAIConfig();
  const updateConfig = useUpdateAIConfig();
  const [providerRows, setProviderRows] = useState<ProviderRow[]>([]);
  const [defaultProvider, setDefaultProvider] = useState<AIProviderName | ''>('');
  const [runStatus, setRunStatus] = useState<AIRunStatus | 'all'>('all');
  const [runOffset, setRunOffset] = useState(0);
  const runsQuery = useAIRuns({
    status: runStatus === 'all' ? undefined : runStatus,
    limit: PAGE_SIZE,
    offset: runOffset,
  });

  useEffect(() => {
    if (!configQuery.data) return;
    const configured = [...configQuery.data.orgDefaults].sort((a, b) => a.fallbackOrder - b.fallbackOrder);
    const availableNames = new Set(configQuery.data.availableProviders);
    const configuredNames = new Set(configured.map((entry) => entry.provider));
    const rows: ProviderRow[] = [
      ...configured.map((entry) => ({ provider: entry.provider, enabled: entry.enabled && availableNames.has(entry.provider), available: availableNames.has(entry.provider) })),
      ...configQuery.data.availableProviders
        .filter((provider) => !configuredNames.has(provider))
        .map((provider) => ({ provider, enabled: configured.length === 0, available: true })),
    ];
    setProviderRows(rows);
    setDefaultProvider(
      configured.find((entry) => entry.isDefault)?.provider
      ?? rows.find((entry) => entry.enabled)?.provider
      ?? '',
    );
  }, [configQuery.data]);

  useEffect(() => {
    setRunOffset(0);
  }, [runStatus]);

  const enabledProviders = useMemo(
    () => providerRows.filter((entry) => entry.enabled),
    [providerRows],
  );

  const setProviderEnabled = (provider: AIProviderName, enabled: boolean) => {
    const nextRows = providerRows.map((entry) => entry.provider === provider ? { ...entry, enabled } : entry);
    const nextEnabled = nextRows.filter((entry) => entry.enabled);
    setProviderRows(nextRows);
    if (!enabled) {
      if (provider === defaultProvider) setDefaultProvider(nextEnabled[0]?.provider ?? '');
    } else if (!defaultProvider) {
      setDefaultProvider(provider);
    }
  };

  const moveProvider = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= providerRows.length) return;
    const next = [...providerRows];
    [next[index], next[target]] = [next[target], next[index]];
    setProviderRows(next);
  };

  const saveConfiguration = () => {
    if (enabledProviders.length === 0 || !defaultProvider) {
      toast({ title: 'Choose a provider', description: 'Enable at least one provider and select the default.', variant: 'destructive' });
      return;
    }
    updateConfig.mutate(
      enabledProviders.map((entry, fallbackOrder) => ({
        provider: entry.provider,
        is_default: entry.provider === defaultProvider,
        fallback_order: fallbackOrder,
      })),
      {
        onSuccess: () => toast({ title: 'AI policy saved', description: 'The organization provider order is now active.' }),
        onError: (error) => toast({ title: 'Unable to save AI policy', description: error.message, variant: 'destructive' }),
      },
    );
  };

  if (configQuery.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-72 w-full" /></div>;
  }

  if (configQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>AI settings unavailable</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{configQuery.error.message}</span>
          <Button variant="outline" size="sm" onClick={() => configQuery.refetch()}>Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }

  const availableProviders = configQuery.data?.availableProviders ?? [];
  const runs = runsQuery.data?.items ?? [];
  const totalRuns = runsQuery.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Server-managed credentials</AlertTitle>
        <AlertDescription>
          This policy selects providers already configured on the InfraAudit server. Provider keys are never accepted or stored in this page.
        </AlertDescription>
      </Alert>

      <Card className="rounded-2xl shadow bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5" /> Intelligence Engine policy</CardTitle>
          <CardDescription>Choose the organization default and the bounded provider fallback order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {availableProviders.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No deployment providers available</AlertTitle>
              <AlertDescription>An operator must configure a supported provider credential on the server before AI tasks can run.</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2 max-w-md">
                <Label>Default provider</Label>
                <Select value={defaultProvider} onValueChange={(value) => setDefaultProvider(value as AIProviderName)}>
                  <SelectTrigger><SelectValue placeholder="Select a default provider" /></SelectTrigger>
                  <SelectContent>
                    {enabledProviders.map((entry) => (
                      <SelectItem key={entry.provider} value={entry.provider}>{providerLabels[entry.provider]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Provider fallback order</Label>
                  <p className="text-sm text-muted-foreground">Only enabled providers are tried, from top to bottom, when a retry is safe.</p>
                </div>
                {providerRows.map((entry, index) => {
                  const saved = configQuery.data?.orgDefaults.find((item) => item.provider === entry.provider);
                  return (
                    <div key={entry.provider} className="flex items-center gap-3 rounded-xl border p-4">
                      <Switch checked={entry.enabled} disabled={!entry.available} onCheckedChange={(enabled) => setProviderEnabled(entry.provider, enabled)} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{providerLabels[entry.provider]}</div>
                        <div className="text-xs text-muted-foreground">{saved?.model || 'Deployment default model'}</div>
                      </div>
                      {entry.provider === defaultProvider && entry.enabled && <Badge>Default</Badge>}
                      {!entry.available && <Badge variant="outline">Unavailable</Badge>}
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => moveProvider(index, -1)} disabled={index === 0} aria-label={`Move ${providerLabels[entry.provider]} up`}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => moveProvider(index, 1)} disabled={index === providerRows.length - 1} aria-label={`Move ${providerLabels[entry.provider]} down`}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button onClick={saveConfiguration} disabled={updateConfig.isPending || enabledProviders.length === 0}>
                  {updateConfig.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save organization policy
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow bg-white dark:bg-gray-900">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Execution ledger</CardTitle>
            <CardDescription>Organization-scoped task lifecycle and reproducibility metadata. Prompts and raw provider responses are not stored.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={runStatus} onValueChange={(value) => setRunStatus(value as AIRunStatus | 'all')}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.keys(statusStyles).map((status) => <SelectItem key={status} value={status}>{humanize(status)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => runsQuery.refetch()} aria-label="Refresh execution ledger">
              <RefreshCw className={`h-4 w-4 ${runsQuery.isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {runsQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Execution ledger unavailable</AlertTitle>
              <AlertDescription>{runsQuery.error.message}</AlertDescription>
            </Alert>
          ) : runsQuery.isLoading ? (
            <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          ) : runs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No AI runs match this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead><TableHead>Status</TableHead><TableHead>Provider</TableHead>
                    <TableHead>Attempts</TableHead><TableHead>Latency</TableHead><TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <div className="font-medium">{humanize(run.taskKind)}</div>
                        <div className="font-mono text-xs text-muted-foreground" title={run.id}>{run.id.slice(0, 8)}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={statusStyles[run.status]}>{humanize(run.status)}</Badge></TableCell>
                      <TableCell>
                        <div>{run.provider ? providerLabels[run.provider] : 'Not selected'}</div>
                        {run.model && <div className="text-xs text-muted-foreground">{run.model}</div>}
                      </TableCell>
                      <TableCell>{run.attempt}</TableCell>
                      <TableCell>{run.latencyMs > 0 ? `${run.latencyMs.toLocaleString()} ms` : '—'}</TableCell>
                      <TableCell>{formatDate(run.startedAt || run.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>{totalRuns === 0 ? '0 runs' : `${runOffset + 1}–${Math.min(runOffset + PAGE_SIZE, totalRuns)} of ${totalRuns}`}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setRunOffset(Math.max(0, runOffset - PAGE_SIZE))} disabled={runOffset === 0}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setRunOffset(runOffset + PAGE_SIZE)} disabled={runOffset + PAGE_SIZE >= totalRuns}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
