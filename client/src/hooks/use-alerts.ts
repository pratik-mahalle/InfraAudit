import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Alert, type AlertParams, type AlertSummary, type PaginatedResponse } from '@/lib/api';

export function useAlerts(params?: AlertParams) {
  return useQuery<PaginatedResponse<Alert>>({
    queryKey: ['alerts', params],
    queryFn: () => api.alerts.list(params),
  });
}

export function useAlert(id: number) {
  return useQuery<Alert>({
    queryKey: ['alerts', id],
    queryFn: () => api.alerts.get(id),
    enabled: !!id,
  });
}

export function useAlertSummary() {
  return useQuery<AlertSummary>({
    queryKey: ['alerts', 'summary'],
    queryFn: () => api.alerts.getSummary(),
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Alert>) => api.alerts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useUpdateAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Alert> }) =>
      api.alerts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.alerts.update(id, { status: 'acknowledged' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.alerts.update(id, { status: 'resolved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.alerts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
