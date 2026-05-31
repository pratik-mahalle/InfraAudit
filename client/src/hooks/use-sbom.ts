import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type SBOMReport } from '@/lib/api';

export function useSBOMReports(params?: { resource_id?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['sbom', 'reports', params],
    queryFn: () => api.sbom.list(params),
  });
}

export function useSBOMReport(id: number) {
  return useQuery<SBOMReport>({
    queryKey: ['sbom', 'reports', id],
    queryFn: () => api.sbom.get(id),
    enabled: !!id,
  });
}

export function useGenerateSBOM() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.sbom.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sbom'] });
    },
  });
}

export function useDeleteSBOM() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.sbom.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sbom'] });
    },
  });
}
