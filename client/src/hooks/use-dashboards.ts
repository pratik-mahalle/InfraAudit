import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CustomDashboard, CustomDashboardInput } from '@/types';

export const dashboardQueryKey = ['/api/v1/dashboards'] as const;

export function useDashboards() {
  return useQuery({
    queryKey: dashboardQueryKey,
    queryFn: () => api.dashboards.list(),
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomDashboardInput) => api.dashboards.create(input),
    onSuccess: (dashboard) => {
      queryClient.setQueryData(dashboardQueryKey, (current: { dashboards: CustomDashboard[] } | undefined) => ({
        dashboards: [...(current?.dashboards ?? []).map((item) => dashboard.isDefault ? { ...item, isDefault: false } : item), dashboard],
      }));
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });
}

export function useUpdateDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomDashboardInput }) => api.dashboards.update(id, input),
    onSuccess: (dashboard) => {
      queryClient.setQueryData(dashboardQueryKey, (current: { dashboards: CustomDashboard[] } | undefined) => {
        if (!current) return current;
        return { dashboards: current.dashboards.map((item) => item.id === dashboard.id ? dashboard : dashboard.isDefault ? { ...item, isDefault: false } : item) };
      });
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.dashboards.delete(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData(dashboardQueryKey, (current: { dashboards: CustomDashboard[] } | undefined) => {
        if (!current) return current;
        return { dashboards: current.dashboards.filter((item) => item.id !== id) };
      });
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });
}
