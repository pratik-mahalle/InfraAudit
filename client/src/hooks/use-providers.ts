import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Provider, type ProviderCredentials, type ProviderSyncStatus } from '@/lib/api';

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
  });
}

export function useConnectProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ provider, credentials }: { provider: string; credentials: ProviderCredentials }) =>
      api.providers.connect(provider, credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
  });
}

export function useSyncProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (provider: string) => api.providers.sync(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
    },
  });
}

export function useDisconnectProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (provider: string) => api.providers.disconnect(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
    },
  });
}
