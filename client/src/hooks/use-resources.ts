import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Resource, type ResourceParams, type PaginatedResponse } from '@/lib/api';

export function useResources(params?: ResourceParams) {
  return useQuery<PaginatedResponse<Resource>>({
    queryKey: ['resources', params],
    queryFn: () => api.resources.list(params),
  });
}

export function useResource(id: string | number) {
  return useQuery<Resource>({
    queryKey: ['resources', id],
    queryFn: () => api.resources.get(id),
    enabled: String(id).length > 0,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Resource>) => api.resources.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Resource> }) =>
      api.resources.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string | number) => api.resources.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useRefreshResourceMetrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const providers = await api.providers.list();
      const connectedProviders = providers.filter((provider) => provider.isConnected);

      if (connectedProviders.length === 0) {
        throw new Error('Connect a cloud provider before refreshing metrics.');
      }

      // Run sequentially so each provider sync completes its resource replacement
      // before the next provider starts writing to the organization inventory.
      for (const provider of connectedProviders) {
        await api.providers.sync(provider.provider);
      }

      return connectedProviders.length;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['providers'] }),
        queryClient.invalidateQueries({ queryKey: ['resources'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/resources'] }),
        queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] }),
      ]);
    },
  });
}
