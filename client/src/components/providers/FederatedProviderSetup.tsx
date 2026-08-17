import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Download, Loader2, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  useMigrateProvider,
  useSetupProvider,
  useValidateProviderConnection,
} from '@/hooks/use-providers';
import type {
  Provider,
  ProviderSetupArtifact,
  ProviderSetupRequest,
  ProviderSetupResult,
  ProviderSourceDiagnostic,
} from '@/lib/api';
import { SocBadge } from '@/components/security-ops/soc-ui';

type FederatedProvider = 'gcp' | 'azure';

export function FederatedProviderSetup({ provider, existing }: { provider: FederatedProvider; existing?: Provider }) {
  const { toast } = useToast();
  const setup = useSetupProvider();
  const migrate = useMigrateProvider();
  const validate = useValidateProviderConnection();
  const [cloudScopeId, setCloudScopeId] = useState(existing?.cloudScopeId ?? '');
  const [displayName, setDisplayName] = useState('');
  const [gcpProjectNumber, setGcpProjectNumber] = useState('');
  const [gcpBillingDataset, setGcpBillingDataset] = useState('');
  const [azureTenantId, setAzureTenantId] = useState('');
  const [optionalSecurity, setOptionalSecurity] = useState(true);
  const [optionalCost, setOptionalCost] = useState(false);
  const [setupResult, setSetupResult] = useState<ProviderSetupResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<ProviderSourceDiagnostic[]>([]);

  const isLegacy = existing?.authMethod === 'legacy_gcp_key' || existing?.authMethod === 'legacy_azure_secret';
  const pending = setup.isPending || migrate.isPending;
  const validationError = useMemo(() => {
    if (!cloudScopeId.trim()) return provider === 'gcp' ? 'Project ID is required.' : 'Subscription ID is required.';
    if (provider === 'gcp' && !/^\d+$/.test(gcpProjectNumber.trim())) return 'GCP project number must contain only digits.';
    if (provider === 'azure' && !azureTenantId.trim()) return 'Azure tenant ID is required.';
    return '';
  }, [azureTenantId, cloudScopeId, gcpProjectNumber, provider]);

  const request = (): ProviderSetupRequest => ({
    cloudScopeId: cloudScopeId.trim(),
    displayName: displayName.trim() || undefined,
    gcpProjectNumber: provider === 'gcp' ? gcpProjectNumber.trim() : undefined,
    gcpBillingDataset: provider === 'gcp' ? gcpBillingDataset.trim() || undefined : undefined,
    azureTenantId: provider === 'azure' ? azureTenantId.trim() : undefined,
    optionalSecurity,
    optionalCost,
  });

  const startSetup = () => {
    if (validationError) {
      toast({ title: 'Setup details are incomplete', description: validationError, variant: 'destructive' });
      return;
    }
    const callbacks = {
      onSuccess: (result: ProviderSetupResult) => {
        setSetupResult(result);
        setDiagnostics([]);
        toast({
          title: result.reused ? 'Existing setup recovered' : 'Secure setup created',
          description: 'Review and deploy the generated artifact, then run live validation.',
        });
      },
      onError: (error: Error) => toast({ title: 'Could not create setup', description: error.message, variant: 'destructive' }),
    };
    if (isLegacy && existing?.connectionId) {
      migrate.mutate({ provider, connectionId: existing.connectionId, input: request() }, callbacks);
    } else {
      setup.mutate({ provider, input: request() }, callbacks);
    }
  };

  const runValidation = () => {
    if (!setupResult) return;
    validate.mutate({ provider, connectionId: setupResult.connection.id }, {
      onSuccess: (result) => {
        setSetupResult((current) => current ? { ...current, connection: result.connection } : current);
        setDiagnostics(result.diagnostics);
        toast({
          title: result.connection.lifecycleState === 'error' ? 'Validation needs attention' : 'Provider identity validated',
          description: result.connection.lifecycleState === 'syncing'
            ? `Initial sync queued as job ${result.connection.lastJobId}.`
            : `Connection state: ${result.connection.lifecycleState}.`,
          variant: result.connection.lifecycleState === 'error' ? 'destructive' : 'default',
        });
      },
      onError: (error: Error) => toast({ title: 'Validation failed', description: error.message, variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-5">
      <Alert className="border-emerald-500/30 bg-emerald-500/10">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <AlertTitle>No customer secret is shared</AlertTitle>
        <AlertDescription>
          {provider === 'gcp'
            ? 'InfraAudit exchanges its AWS workload identity for short-lived GCP credentials through Workload Identity Federation.'
            : 'Azure Lighthouse delegates read-only access to the InfraAudit identity; no customer app secret is created or pasted here.'}
        </AlertDescription>
      </Alert>

      {isLegacy && (
        <Alert className="border-amber-500/30 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Legacy credential migration</AlertTitle>
          <AlertDescription>
            The existing credential remains active during shadow setup. It is replaced only after the new identity validates against the same cloud scope.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 rounded-md border p-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${provider}-scope`}>{provider === 'gcp' ? 'GCP project ID' : 'Azure subscription ID'}</Label>
          <Input id={`${provider}-scope`} value={cloudScopeId} onChange={(event) => setCloudScopeId(event.target.value)} disabled={isLegacy} placeholder={provider === 'gcp' ? 'my-production-project' : '00000000-0000-0000-0000-000000000000'} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${provider}-name`}>Display name (optional)</Label>
          <Input id={`${provider}-name`} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={provider === 'gcp' ? 'Production GCP' : 'Production Azure'} />
        </div>
        {provider === 'gcp' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="gcp-project-number">GCP project number</Label>
              <Input id="gcp-project-number" inputMode="numeric" value={gcpProjectNumber} onChange={(event) => setGcpProjectNumber(event.target.value)} placeholder="123456789012" />
              <p className="text-xs text-muted-foreground">The numeric project number anchors the exact WIF audience and principal set.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gcp-billing-table">BigQuery billing table (optional)</Label>
              <Input id="gcp-billing-table" value={gcpBillingDataset} onChange={(event) => setGcpBillingDataset(event.target.value)} placeholder="billing-project.dataset.gcp_billing_export_v1_ABC" />
            </div>
          </>
        ) : (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="azure-tenant">Customer Azure tenant ID</Label>
            <Input id="azure-tenant" value={azureTenantId} onChange={(event) => setAzureTenantId(event.target.value)} placeholder="00000000-0000-0000-0000-000000000000" />
          </div>
        )}
        <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
          <Checkbox checked={optionalSecurity} onCheckedChange={(checked) => setOptionalSecurity(checked === true)} />
          <span><strong className="block">Native security findings</strong><span className="text-muted-foreground">Include SCC or Defender read access and diagnostics.</span></span>
        </label>
        <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
          <Checkbox checked={optionalCost} onCheckedChange={(checked) => setOptionalCost(checked === true)} />
          <span><strong className="block">Cost visibility</strong><span className="text-muted-foreground">Include BigQuery billing or Cost Management Reader access.</span></span>
        </label>
      </div>

      <Button type="button" className="w-full" onClick={startSetup} disabled={pending || Boolean(validationError)}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
        {pending ? 'Preparing secure setup…' : isLegacy ? 'Create migration artifact' : 'Generate secure setup artifact'}
      </Button>

      {setupResult && (
        <ArtifactReview artifact={setupResult.artifact} state={setupResult.connection.lifecycleState} onValidate={runValidation} validating={validate.isPending} />
      )}

      {diagnostics.length > 0 && <DiagnosticSummary diagnostics={diagnostics} />}
    </div>
  );
}

function ArtifactReview({ artifact, state, onValidate, validating }: { artifact: ProviderSetupArtifact; state: string; onValidate: () => void; validating: boolean }) {
  return (
    <div className="space-y-4 rounded-md border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-medium">Setup artifact {artifact.version}</p><p className="text-sm text-muted-foreground">Review before deploying in the customer cloud scope.</p></div>
        <SocBadge tone={state === 'error' ? 'red' : state === 'partial' ? 'orange' : state === 'connected' || state === 'syncing' ? 'green' : 'blue'}>{state}</SocBadge>
      </div>
      <ol className="space-y-2 text-sm text-muted-foreground">
        {artifact.deploymentSteps.map((step, index) => <li key={step} className="flex gap-2"><span className="font-mono text-foreground">{index + 1}.</span><span>{step}</span></li>)}
      </ol>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="outline" onClick={() => downloadText(artifact.filename, artifact.terraform)}><Download className="mr-2 h-4 w-4" />Download Terraform</Button>
        <Button type="button" variant="outline" onClick={() => downloadText(artifact.filename.replace(/\.tf$/, artifact.providerNative.trimStart().startsWith('#!') ? '.sh' : '.bicep'), artifact.providerNative)}><Download className="mr-2 h-4 w-4" />Download provider-native setup</Button>
      </div>
      <Button type="button" className="w-full" onClick={onValidate} disabled={validating || state === 'syncing'}>
        {validating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
        {validating ? 'Validating identity and capabilities…' : 'I deployed this artifact — validate access'}
      </Button>
    </div>
  );
}

function DiagnosticSummary({ diagnostics }: { diagnostics: ProviderSourceDiagnostic[] }) {
  return (
    <div className="space-y-2 rounded-md border p-4">
      <p className="font-medium">Live validation results</p>
      {diagnostics.map((diagnostic) => (
        <div key={`${diagnostic.operationId}-${diagnostic.source}`} className="flex flex-col gap-1 rounded border bg-background p-3 text-sm sm:flex-row sm:items-start sm:justify-between">
          <div><p className="font-medium">{diagnostic.source.replaceAll('_', ' ')}</p><p className="text-xs text-muted-foreground">{diagnostic.guidance || `${diagnostic.fetchedCount} items observed`}</p></div>
          <SocBadge tone={diagnostic.outcome === 'success_with_data' || diagnostic.outcome === 'success_empty' ? 'green' : diagnostic.outcome === 'partial' || diagnostic.outcome === 'not_configured' ? 'orange' : 'red'}>{diagnostic.outcome}</SocBadge>
        </div>
      ))}
    </div>
  );
}

function downloadText(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
