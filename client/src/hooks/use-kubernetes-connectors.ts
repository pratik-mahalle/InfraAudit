import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type KubernetesConnector, type KubernetesInventorySnapshotPage } from '@/lib/api';

export const kubernetesConnectorKeys = {
  all: ['kubernetes-connectors'] as const,
  snapshots: (connectorId: number | null) => ['kubernetes-connectors', connectorId, 'snapshots'] as const,
  snapshot: (connectorId: number | null, snapshotId: string | null) =>
    ['kubernetes-connectors', connectorId, 'snapshots', snapshotId] as const,
};

export function useKubernetesConnectors() {
  return useQuery({
    queryKey: kubernetesConnectorKeys.all,
    queryFn: () => api.kubernetes.listConnectors(),
    refetchInterval: 30_000,
  });
}

export function useCreateKubernetesConnector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.kubernetes.createConnector(name),
    onSuccess: (result) => {
      queryClient.setQueryData<KubernetesConnector[]>(kubernetesConnectorKeys.all, (current = []) => [
        result.connector,
        ...current.filter((connector) => connector.id !== result.connector.id),
      ]);
      queryClient.invalidateQueries({ queryKey: kubernetesConnectorKeys.all });
    },
  });
}

export function useRevokeKubernetesConnector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.kubernetes.revokeConnector(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kubernetesConnectorKeys.all });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useKubernetesInventorySnapshots(connectorId: number | null) {
  return useQuery<KubernetesInventorySnapshotPage>({
    queryKey: kubernetesConnectorKeys.snapshots(connectorId),
    queryFn: () => api.kubernetes.listInventorySnapshots(connectorId as number),
    enabled: connectorId !== null,
    refetchInterval: 30_000,
  });
}

export function useKubernetesInventorySnapshot(connectorId: number | null, snapshotId: string | null) {
  return useQuery({
    queryKey: kubernetesConnectorKeys.snapshot(connectorId, snapshotId),
    queryFn: () => api.kubernetes.getInventorySnapshot(connectorId as number, snapshotId as string),
    enabled: connectorId !== null && snapshotId !== null,
  });
}
