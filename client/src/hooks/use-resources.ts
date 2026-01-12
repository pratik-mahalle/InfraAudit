import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Resource, type ResourceParams, type PaginatedResponse } from '@/lib/api';

export function useResources(params?: ResourceParams) {
  return useQuery<PaginatedResponse<Resource>>({
    queryKey: ['resources', params],
    queryFn: () => api.resources.list(params),
  });
}

export function useResource(id: number) {
  return useQuery<Resource>({
    queryKey: ['resources', id],
    queryFn: () => api.resources.get(id),
    enabled: !!id,
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
    mutationFn: ({ id, data }: { id: number; data: Partial<Resource> }) =>
      api.resources.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.resources.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}
