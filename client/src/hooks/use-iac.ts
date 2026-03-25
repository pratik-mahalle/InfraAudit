import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useIaCDefinitions() {
  return useQuery({
    queryKey: ['iac', 'definitions'],
    queryFn: () => api.iac.listDefinitions() as Promise<any[]>,
  });
}

export function useIaCDrifts() {
  return useQuery({
    queryKey: ['iac', 'drifts'],
    queryFn: () => api.iac.listDrifts() as Promise<any[]>,
  });
}

export function useIaCDriftSummary() {
  return useQuery({
    queryKey: ['iac', 'drifts', 'summary'],
    queryFn: () => api.iac.getDriftSummary() as Promise<Record<string, number>>,
  });
}

export function useUploadIaC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => api.iac.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iac'] });
    },
  });
}

export function useDetectIaCDrift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.iac.detectDrift(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iac', 'drifts'] });
      queryClient.invalidateQueries({ queryKey: ['drifts'] });
    },
  });
}

export function useDeleteIaCDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.iac.deleteDefinition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iac', 'definitions'] });
    },
  });
}
