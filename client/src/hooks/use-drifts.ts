import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Drift, type DriftParams, type DriftScan, type DriftScanDetail, type DriftSummary, type PaginatedResponse } from '@/lib/api';

export function useDrifts(params?: DriftParams) {
  return useQuery<PaginatedResponse<Drift>>({
    queryKey: ['drifts', params],
    queryFn: () => api.drifts.list(params),
  });
}

export function useDrift(id: number) {
  return useQuery<Drift>({
    queryKey: ['drifts', id],
    queryFn: () => api.drifts.get(id),
    enabled: !!id,
  });
}

export function useDriftSummary() {
  return useQuery<DriftSummary>({
    queryKey: ['drifts', 'summary'],
    queryFn: () => api.drifts.getSummary(),
  });
}

export function useDriftScans(enabled = true) {
  return useQuery<PaginatedResponse<DriftScan>>({
    queryKey: ['drift-scans'],
    queryFn: () => api.drifts.listScans(1, 50),
    enabled,
  });
}

export function useDriftScan(id: number | null) {
  return useQuery<DriftScanDetail>({
    queryKey: ['drift-scans', id],
    queryFn: () => api.drifts.getScan(id!),
    enabled: id != null,
  });
}

export function useTriggerDriftDetection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.drifts.detect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drifts'] });
      queryClient.invalidateQueries({ queryKey: ['drift-scans'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useUpdateDrift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Drift> }) =>
      api.drifts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drifts'] });
    },
  });
}

export function useDeleteDrift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.drifts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drifts'] });
    },
  });
}

export function useResolveDrift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.drifts.update(id, { status: 'resolved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drifts'] });
    },
  });
}

export function useAcknowledgeDrift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.drifts.update(id, { status: 'acknowledged' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drifts'] });
    },
  });
}

export function useApproveDriftAsBaseline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.drifts.update(id, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drifts'] });
      queryClient.invalidateQueries({ queryKey: ['baselines'] });
    },
  });
}
