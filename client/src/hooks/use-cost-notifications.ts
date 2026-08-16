import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CostNotificationChannelInput, CostNotificationChannelType } from '@/types';

const channelsKey = ['/api/v1/costs/monitor-notifications/channels'] as const;
const incidentsKey = ['/api/v1/costs/monitor-notifications/incidents'] as const;

export function useCostNotificationChannels() {
  return useQuery({
    queryKey: channelsKey,
    queryFn: () => api.costs.listMonitorNotificationChannels(),
  });
}

export function useUpdateCostNotificationChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channel, input }: { channel: CostNotificationChannelType; input: CostNotificationChannelInput }) =>
      api.costs.updateMonitorNotificationChannel(channel, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: channelsKey }),
  });
}

export function useTestCostNotificationChannel() {
  return useMutation({
    mutationFn: ({ channel, input }: { channel: CostNotificationChannelType; input?: Omit<CostNotificationChannelInput, 'enabled'> }) =>
      api.costs.testMonitorNotificationChannel(channel, input),
  });
}

export interface CostMonitorIncidentFilters {
  monitorId?: string;
  status?: 'open' | 'acknowledged' | 'resolved';
  limit?: number;
  offset?: number;
}

export function useCostMonitorIncidents(filters: CostMonitorIncidentFilters = {}) {
  return useQuery({
    queryKey: [...incidentsKey, filters],
    queryFn: () => api.costs.listMonitorIncidents(filters),
  });
}

export function useCostMonitorIncidentHistory(id?: string) {
  return useQuery({
    queryKey: [...incidentsKey, id, 'history'],
    queryFn: () => api.costs.getMonitorIncidentHistory(id!),
    enabled: Boolean(id),
  });
}

function useIncidentAction(action: 'acknowledge' | 'escalate') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note = '' }: { id: string; note?: string }) => action === 'acknowledge'
      ? api.costs.acknowledgeMonitorIncident(id, note)
      : api.costs.escalateMonitorIncident(id, note),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: incidentsKey });
      queryClient.invalidateQueries({ queryKey: [...incidentsKey, variables.id, 'history'] });
    },
  });
}

export function useAcknowledgeCostMonitorIncident() {
  return useIncidentAction('acknowledge');
}

export function useEscalateCostMonitorIncident() {
  return useIncidentAction('escalate');
}
