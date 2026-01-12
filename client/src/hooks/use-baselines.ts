import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Baseline, type CreateBaselineRequest } from '@/lib/api';

export function useBaselines() {
  return useQuery<Baseline[]>({
    queryKey: ['baselines'],
    queryFn: () => api.baselines.list(),
  });
}

export function useBaselineByResource(resourceId: string) {
  return useQuery<Baseline>({
    queryKey: ['baselines', 'resource', resourceId],
    queryFn: () => api.baselines.getByResource(resourceId),
    enabled: !!resourceId,
  });
}

export function useCreateBaseline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBaselineRequest) => api.baselines.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baselines'] });
    },
  });
}

export function useDeleteBaseline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.baselines.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baselines'] });
    },
  });
}
