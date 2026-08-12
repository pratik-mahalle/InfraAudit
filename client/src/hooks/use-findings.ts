import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Finding, type FindingParams, type FindingStatus, type FindingSummary, type PaginatedResponse } from '@/lib/api';

export const findingsKeys = {
  all: ['findings'] as const,
  list: (params?: FindingParams) => ['findings', 'list', params ?? {}] as const,
  detail: (id: number) => ['findings', 'detail', id] as const,
  summary: ['findings', 'summary'] as const,
};

export function useFindings(params?: FindingParams) {
  return useQuery<PaginatedResponse<Finding>>({
    queryKey: findingsKeys.list(params),
    queryFn: () => api.findings.list(params),
  });
}

export function useFinding(id?: number) {
  return useQuery<Finding>({
    queryKey: findingsKeys.detail(id ?? 0),
    queryFn: () => api.findings.get(id as number),
    enabled: !!id,
  });
}

export function useFindingSummary() {
  return useQuery<FindingSummary>({
    queryKey: findingsKeys.summary,
    queryFn: () => api.findings.getSummary(),
  });
}

export function useUpdateFindingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: FindingStatus }) => api.findings.updateStatus(id, status),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: findingsKeys.all });
      queryClient.invalidateQueries({ queryKey: findingsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
