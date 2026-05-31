import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type PolicyItem, type PolicyTemplate, type PolicyViolation } from '@/lib/api';

export function usePolicies() {
  return useQuery<PolicyItem[]>({
    queryKey: ['policies'],
    queryFn: () => api.policies.list(),
  });
}

export function usePolicy(id: number) {
  return useQuery<PolicyItem>({
    queryKey: ['policies', id],
    queryFn: () => api.policies.get(id),
    enabled: !!id,
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.policies.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policies'] }),
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PolicyItem> }) =>
      api.policies.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policies'] }),
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.policies.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policies'] }),
  });
}

export function usePolicyTemplates() {
  return useQuery<PolicyTemplate[]>({
    queryKey: ['policies', 'templates'],
    queryFn: () => api.policies.listTemplates(),
  });
}

export function useGeneratePolicy() {
  return useMutation({
    mutationFn: (description: string) => api.policies.generate(description),
  });
}

export function useEvaluatePolicies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.policies.evaluate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['violations'] });
    },
  });
}

export function usePolicyViolations(params?: { policy_id?: number; status?: string }) {
  return useQuery<PolicyViolation[]>({
    queryKey: ['violations', params],
    queryFn: () => api.policies.listViolations(params),
  });
}

export function useUpdateViolationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.policies.updateViolationStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['violations'] }),
  });
}
