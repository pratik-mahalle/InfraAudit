import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Provider, type ProviderConnection, type ProviderCredentials, type ProviderSetupRequest, type ProviderSyncStatus } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

const providerAffectedQueryKeys = [
  ['providers'],
  ['resources'],
  ['dashboard'],
  ['findings'],
  ['vulnerabilities'],
  ['vulnerability-scans'],
  ['/api/v1/compliance'],
  ['/api/v1/costs'],
] as const;

function invalidateProviderConsumers(queryClient: ReturnType<typeof useQueryClient>) {
  providerAffectedQueryKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
}

export function useProviders() {
  return useQuery<Provider[]>({
    queryKey: ['providers'],
    queryFn: () => api.providers.list(),
  });
}

export function useProviderStatus() {
  return useQuery<ProviderSyncStatus[]>({
    queryKey: ['providers', 'status'],
    queryFn: () => api.providers.getStatus(),
    refetchInterval: 15_000,
  });
}

export function useConnectProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ provider, credentials }: { provider: string; credentials: ProviderCredentials }) =>
      api.providers.connect(provider, credentials),
    onSuccess: () => {
      invalidateProviderConsumers(queryClient);
    },
  });
}

export function useSyncProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: string | { provider: string; connectionId: string; idempotencyKey?: string }) =>
      typeof input === 'string'
        ? api.providers.sync(input)
        : api.providers.syncConnection(input.provider, input.connectionId, input.idempotencyKey),
    onSuccess: () => {
      invalidateProviderConsumers(queryClient);
    },
  });
}

export function useDisconnectProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: string | { provider: string; connectionId: string }) =>
      typeof input === 'string'
        ? api.providers.disconnect(input)
        : api.providers.deleteConnection(input.provider, input.connectionId),
    onSuccess: () => {
      invalidateProviderConsumers(queryClient);
    },
  });
}

export function useProviderConnection(provider: string, connectionId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['providers', 'connection', user?.organizationId, provider, connectionId],
    queryFn: () => api.providers.getConnection(provider, connectionId!),
    enabled: Boolean(connectionId),
    refetchInterval: (query) => {
      const state = query.state.data?.lifecycleState;
      return state === 'validating' || state === 'syncing' ? 5_000 : false;
    },
  });
}

export function useProviderDiagnostics(provider: string, connectionId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['providers', 'diagnostics', user?.organizationId, provider, connectionId],
    queryFn: () => api.providers.getDiagnostics(provider, connectionId!),
    enabled: Boolean(connectionId),
  });
}

export function useProviderConnections(provider: string) {
  return useQuery<ProviderConnection[]>({
    queryKey: ['providers', 'connections', provider],
    queryFn: () => api.providers.listConnections(provider),
  });
}

export function useSetupAWS() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { roleArn: string; region: string; displayName?: string; cloudScopeId?: string }) => {
      const setup = await api.providers.setupAWS(input);
      return api.providers.validateConnection('aws', setup.connection.id);
    },
    onSuccess: () => {
      invalidateProviderConsumers(queryClient);
      queryClient.invalidateQueries({ queryKey: ['providers', 'connections', 'aws'] });
      queryClient.invalidateQueries({ queryKey: ['providers', 'diagnostics'] });
    },
  });
}

export function useSetupProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, input }: { provider: 'aws' | 'gcp' | 'azure'; input: ProviderSetupRequest }) =>
      api.providers.setup(provider, input),
    onSuccess: () => invalidateProviderConsumers(queryClient),
  });
}

export function useMigrateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, connectionId, input }: { provider: 'aws' | 'gcp' | 'azure'; connectionId: string; input: ProviderSetupRequest }) =>
      api.providers.migrate(provider, connectionId, input),
    onSuccess: () => invalidateProviderConsumers(queryClient),
  });
}

export function useValidateProviderConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, connectionId }: { provider: string; connectionId: string }) =>
      api.providers.validateConnection(provider, connectionId),
    onSuccess: (result) => {
      invalidateProviderConsumers(queryClient);
      queryClient.setQueryData(
        ['providers', 'connection', result.connection.organizationId, result.connection.provider, result.connection.id],
        result.connection,
      );
      queryClient.invalidateQueries({ queryKey: ['providers', 'diagnostics'] });
    },
  });
}
